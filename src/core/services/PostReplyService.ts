import MarkdownIt from 'markdown-it';
import { GlobalMentionRepository } from '../../adapters/persistence/GlobalMentionRepository';
import { GlobalParentType, GlobalTaggableType } from '../commons/constants/GlobalConstants';
import { Project } from '../domain/Project';
import { GlobalMentionService } from './GlobalMentionService';
import { MentionService } from './MentionService';
import { PostMapperService } from './PostMapperService';
import { TaggableService } from './TaggableService';

export class PostReplyService {
  async prepare(content: string, type: 'comment' | 'insight', project: Project, userId: number) {
    const repository = new GlobalMentionRepository();
    let projectMention = await repository.findByParentIdAndParentTypeAndStatusActive(project.id, GlobalParentType.Project);
    if (!projectMention?.id) {
      projectMention = await new GlobalMentionService().add(project.projectKey, [project.name], project.id, GlobalParentType.Project);
    }

    const metadata = `#${type} @${projectMention.mention}`;
    const compiler = MarkdownIt();
    // Render separately so an unclosed code block cannot swallow the metadata.
    const html = compiler.render(content) + compiler.render(metadata);
    const data = await new PostMapperService().parse(html, userId);
    data.postType = type === 'insight' ? GlobalTaggableType.Insight : GlobalTaggableType.PostComment;
    return { data, projectMention, markdown: `${content}\n\n${metadata}` };
  }

  async createReferences(reply: Awaited<ReturnType<PostReplyService['prepare']>>, parentId: number): Promise<void> {
    await new TaggableService().create(reply.data, parentId);
    await new MentionService().create([reply.projectMention], parentId, reply.data.userId, reply.data.postType);
  }
}
