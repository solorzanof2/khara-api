import MarkdownIt from 'markdown-it';
import { MentionRepository } from '../../adapters/persistence/MentionRepository';
import { TaggableRepository } from '../../adapters/persistence/TaggableRepository';
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
    const lines = content.replace(/\r\n?/g, '\n').split('\n');
    const removedLines = new Set<number>();
    // Only standalone metadata lines in normal text are generated references.
    // Markdown tokens exclude fenced/indented code, quotations and list items.
    for (const token of compiler.parse(lines.join('\n'), {})) {
      if (token.type !== 'inline' || token.level !== 1 || !token.map) continue;
      // Multiline inline-code spans can contain a line that resembles metadata.
      if (token.children?.some(child => child.type === 'code_inline' && child.content.includes(metadata))) continue;
      for (let index = token.map[0]; index < token.map[1]; index++) {
        if (lines[index].trim().replace(/[ \t]+/g, ' ').toLowerCase() !== metadata.toLowerCase()) continue;
        removedLines.add(index);
        // Remove its following separator while retaining paragraph separation.
        if (lines[index + 1]?.trim() === '') removedLines.add(index + 1);
      }
    }
    content = lines.filter((_, index) => !removedLines.has(index)).join('\n').replace(/^\n+|\n+$/g, '');
    // Render separately so an unclosed code block cannot swallow the metadata.
    const html = compiler.render(content) + compiler.render(metadata);
    const data = await new PostMapperService().parse(html, userId);
    data.postType = type === 'insight' ? GlobalTaggableType.Insight : GlobalTaggableType.PostComment;
    return { data, projectMention, markdown: `${content}\n\n${metadata}` };
  }

  async replaceReferences(reply: Awaited<ReturnType<PostReplyService['prepare']>>, parentId: number): Promise<void> {
    await new TaggableRepository().deleteByParentIdAndParentType(parentId, reply.data.postType);
    await new MentionRepository().deleteByParentIdAndParentType(parentId, reply.data.postType);
    await this.createReferences(reply, parentId);
  }

  async createReferences(reply: Awaited<ReturnType<PostReplyService['prepare']>>, parentId: number): Promise<void> {
    await new TaggableService().create(reply.data, parentId);
    await new MentionService().create([reply.projectMention], parentId, reply.data.userId, reply.data.postType);
  }
}
