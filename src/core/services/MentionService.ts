import { CompanyRepository } from '../../adapters/persistence/CompanyRepository';
import { GlobalMentionRepository } from '../../adapters/persistence/GlobalMentionRepository';
import { MentionRepository } from '../../adapters/persistence/MentionRepository';
import { ProjectRepository } from '../../adapters/persistence/ProjectRepository';
import { UserRepository } from '../../adapters/persistence/UserRepository';
import { GlobalParentType, GlobalVisibilityType } from '../commons/constants/GlobalConstants';
import { GlobalMention } from '../domain/GlobalMention';
import { Mention } from '../domain/Mention';
import { Project } from '../domain/Project';
import { GlobalMentionService } from './GlobalMentionService';
import { ProjectService } from './ProjectService';

export interface MentionContext {
  workspaceId: number;
  companyId?: number;
  visibility?: string;
}

export interface ResolvedMentions {
  mentions: GlobalMention[];
  projects: Project[];
}

export class MentionService {
  private companyRepository = new CompanyRepository();
  private userRepository = new UserRepository();
  private projectRepository = new ProjectRepository();
  private globalMentionRepository = new GlobalMentionRepository();
  private mentionRepository = new MentionRepository();
  private globalMentionService = new GlobalMentionService();
  private projectService = new ProjectService();

  async resolve(names: string[], context: MentionContext): Promise<ResolvedMentions> {
    const result: ResolvedMentions = { mentions: [], projects: [] };

    const uniqueNames = [...new Map(names.map(name => [name.toLowerCase(), name])).values()];
    if (uniqueNames.some(name => name.length > 64)) {
      throw new Error('Las menciones deben tener como máximo 64 caracteres.');
    }

    let companyId = context.companyId;
    for (const name of uniqueNames) {
      // FIXME unificar esta consulta usando un findUserByUsernameIn(uniqueNames);
      // FIXME corregir el algoritmo para que itere sobre los User;
      const user = await this.userRepository.findUserByUsername(name);

      let parentId: number;
      let parentType: string;
      let displayName = name;
      if (user?.id) {
        parentId = user.id;
        parentType = GlobalParentType.User;
      }
      else {
        // FIXME estas dos consultas son prácticamente lo mismo, la distancia entre una y otra es por un OR, el ORM lo soporta, pero creo que no funciona bien, no obstante, se puede utilizar una query nativa.
        let project = await this.projectRepository.findByWorkspaceIdAndProjectKeyAndStatusNotDeleted(context.workspaceId, name);
        if (!project?.id) {
          project = await this.projectRepository.findByWorkspaceIdAndNameAndStatusNotDeleted(context.workspaceId, name);
        }

        if (!project?.id) {
          if (!companyId) {
            const company = await this.companyRepository.findInternalByWorkspaceIdAndStatusNotDeleted(context.workspaceId);
            companyId = company?.id;
          }
          if (!companyId) {
            throw new Error('No se encontró una compañía interna para crear el proyecto mencionado.');
          }
          project = await this.projectService.add(companyId, context.workspaceId, [name], [name], context.visibility || GlobalVisibilityType.Internal);
        }
        result.projects.push(project);
        parentId = project.id;
        parentType = GlobalParentType.Project;
        displayName = project.name;
      }

      let mention = await this.globalMentionRepository.findByParentIdAndParentTypeAndStatusActive(parentId, parentType);
      if (!mention?.id) {
        mention = await this.globalMentionService.add(name, [displayName], parentId, parentType);
      }
      result.mentions.push(mention);
    }
    return result;
  }

  async create(mentions: GlobalMention[], parentId: number, userId: number): Promise<void> {
    const now = Date.now();
    for (const globalMention of mentions) {
      const entity = new Mention();
      entity.createdAt = now;
      entity.updatedAt = now;
      entity.userId = userId;
      entity.parentId = parentId;
      entity.globalMentionId = globalMention.id;
      await this.mentionRepository.save(entity);
    }
  }
}
