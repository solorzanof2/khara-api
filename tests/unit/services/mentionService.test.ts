import { CompanyRepository } from '../../../src/adapters/persistence/CompanyRepository';
import { Company } from '../../../src/core/domain/Company';
import { MentionService } from '../../../src/core/services/MentionService';
import { UserRepository } from '../../../src/adapters/persistence/UserRepository';
import { ProjectRepository } from '../../../src/adapters/persistence/ProjectRepository';
import { GlobalMentionRepository } from '../../../src/adapters/persistence/GlobalMentionRepository';
import { MentionRepository } from '../../../src/adapters/persistence/MentionRepository';
import { ProjectService } from '../../../src/core/services/ProjectService';
import { GlobalMentionService } from '../../../src/core/services/GlobalMentionService';
import { GlobalParentType } from '../../../src/core/commons/constants/GlobalConstants';
import { User } from '../../../src/core/domain/User';
import { Project } from '../../../src/core/domain/Project';
import { GlobalMention } from '../../../src/core/domain/GlobalMention';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));

const context = { workspaceId: 5, companyId: 9, visibility: 'private' };

describe('MentionService', () => {
  beforeEach(() => {
    jest.spyOn(CompanyRepository.prototype, 'findInternalByWorkspaceIdAndStatusNotDeleted').mockResolvedValue(Object.assign(new Company(), { id: 90 }));
    jest.spyOn(UserRepository.prototype, 'findUserByUsername').mockResolvedValue(new User());
    jest.spyOn(ProjectRepository.prototype, 'findByWorkspaceIdAndProjectKeyAndStatusNotDeleted').mockResolvedValue(new Project());
    jest.spyOn(ProjectRepository.prototype, 'findByWorkspaceIdAndNameAndStatusNotDeleted').mockResolvedValue(new Project());
    jest.spyOn(GlobalMentionRepository.prototype, 'findByParentIdAndParentTypeAndStatusActive').mockResolvedValue(new GlobalMention());
    jest.spyOn(GlobalMentionService.prototype, 'add').mockImplementation(async (name, _display, parentId, parentType) => Object.assign(new GlobalMention(), { id: 50, mention: name, parentId, parentType }));
    jest.spyOn(ProjectService.prototype, 'add').mockResolvedValue(Object.assign(new Project(), { id: 20, name: 'khara' }));
    jest.spyOn(MentionRepository.prototype, 'save').mockResolvedValue({} as any);
  });
  afterEach(() => jest.restoreAllMocks());

  test('prioriza el usuario y no busca ni crea proyectos', async () => {
    jest.mocked(UserRepository.prototype.findUserByUsername).mockResolvedValue(Object.assign(new User(), { id: 10 }));
    const result = await new MentionService().resolve(['ana'], context);
    expect(ProjectRepository.prototype.findByWorkspaceIdAndProjectKeyAndStatusNotDeleted).not.toHaveBeenCalled();
    expect(ProjectService.prototype.add).not.toHaveBeenCalled();
    expect(result.mentions[0]).toMatchObject({ parentId: 10, parentType: GlobalParentType.User });
  });

  test('reutiliza el proyecto del workspace sin crear otro', async () => {
    jest.mocked(ProjectRepository.prototype.findByWorkspaceIdAndProjectKeyAndStatusNotDeleted).mockResolvedValue(Object.assign(new Project(), { id: 21, name: 'Khara' }));
    const result = await new MentionService().resolve(['khara'], context);
    expect(ProjectRepository.prototype.findByWorkspaceIdAndProjectKeyAndStatusNotDeleted).toHaveBeenCalledWith(5, 'khara');
    expect(ProjectService.prototype.add).not.toHaveBeenCalled();
    expect(result.mentions[0]).toMatchObject({ parentId: 21, parentType: GlobalParentType.Project });
  });

  test('también reutiliza un proyecto por nombre aunque su key sea diferente', async () => {
    jest.mocked(ProjectRepository.prototype.findByWorkspaceIdAndNameAndStatusNotDeleted).mockResolvedValue(Object.assign(new Project(), { id: 25, name: 'General', projectKey: '__general__' }));
    const result = await new MentionService().resolve(['General'], context);
    expect(result.projects[0].id).toBe(25);
    expect(ProjectService.prototype.add).not.toHaveBeenCalled();
  });

  test('crea el proyecto mediante ProjectService y asocia su ID', async () => {
    const result = await new MentionService().resolve(['khara'], context);
    expect(ProjectService.prototype.add).toHaveBeenCalledWith(9, 5, ['khara'], ['khara'], 'private');
    expect(result.projects[0].id).toBe(20);
    expect(GlobalMentionService.prototype.add).toHaveBeenCalledWith('khara', ['khara'], 20, GlobalParentType.Project);
  });

  test('una mención repetida crea una sola asociación', async () => {
    const service = new MentionService();
    const result = await service.resolve(['khara', 'Khara', 'khara'], context);
    await service.create(result.mentions, 100, 7);
    expect(ProjectService.prototype.add).toHaveBeenCalledTimes(1);
    expect(MentionRepository.prototype.save).toHaveBeenCalledTimes(1);
    expect(MentionRepository.prototype.save).toHaveBeenCalledWith(expect.objectContaining({ parentId: 100, userId: 7, globalMentionId: 50 }));
  });

  test('reutiliza la referencia global existente', async () => {
    jest.mocked(GlobalMentionRepository.prototype.findByParentIdAndParentTypeAndStatusActive).mockResolvedValue(Object.assign(new GlobalMention(), { id: 60 }));
    const result = await new MentionService().resolve(['khara'], context);
    expect(result.mentions[0].id).toBe(60);
    expect(GlobalMentionService.prototype.add).not.toHaveBeenCalled();
  });

  test('desde Home crea el proyecto en la compañía interna del workspace', async () => {
    await new MentionService().resolve(['khara'], { workspaceId: 5 });
    expect(CompanyRepository.prototype.findInternalByWorkspaceIdAndStatusNotDeleted).toHaveBeenCalledWith(5);
    expect(ProjectService.prototype.add).toHaveBeenCalledWith(90, 5, ['khara'], ['khara'], 'internal');
  });

  test('no inserta proyectos si falta la compañía interna', async () => {
    jest.mocked(CompanyRepository.prototype.findInternalByWorkspaceIdAndStatusNotDeleted).mockResolvedValue(new Company());
    await expect(new MentionService().resolve(['khara'], { workspaceId: 5 })).rejects.toThrow('compañía interna');
    expect(ProjectService.prototype.add).not.toHaveBeenCalled();
  });

  test('un post sin menciones no genera entidades', async () => {
    const result = await new MentionService().resolve([], context);
    expect(result).toEqual({ mentions: [], projects: [] });
    expect(UserRepository.prototype.findUserByUsername).not.toHaveBeenCalled();
  });

  test('propaga errores de creación sin guardar una referencia inválida', async () => {
    jest.mocked(ProjectService.prototype.add).mockRejectedValue(new Error('database error'));
    await expect(new MentionService().resolve(['khara'], context)).rejects.toThrow('database error');
    expect(GlobalMentionService.prototype.add).not.toHaveBeenCalled();
  });
});
