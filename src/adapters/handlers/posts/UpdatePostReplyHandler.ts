import { GlobalStatus } from '../../../core/commons/constants/GlobalConstants';
import { PostComment } from '../../../core/domain/PostComment';
import { jsonString } from '../../../core/helpers/functions/Json';
import { PostReplyService } from '../../../core/services/PostReplyService';
import { ApiProxyHandler } from '../../../deepcore/application/http/HttpContracts';
import { ResponseEntity } from '../../../deepcore/application/http/ResponseEntity';
import { ProvideLoggerMiddleware } from '../../../deepcore/application/middlify/middleware/LoggerMiddleware';
import { ProvidePolicyMiddleware } from '../../../deepcore/application/middlify/middleware/PolicyMiddleware';
import { Middlify } from '../../../deepcore/application/middlify/Middlify';
import { GlobalMentionRepository } from '../../persistence/GlobalMentionRepository';
import { PostInsightRepository } from '../../persistence/PostInsightRepository';
import { PostRepository } from '../../persistence/PostRepository';
import { ProjectRepository } from '../../persistence/ProjectRepository';
import { WorkspaceRepository } from '../../persistence/WorkspaceRepository';

interface ReplyRepository<T> {
  findByUid(uid: string): Promise<T>;
  save(entity: T, getLastInserted: boolean): Promise<T>;
}

interface RequestBody {
  content: string;
  replyUid: string;
  parentUid: string;
  workspaceUid: string;
}

export function createUpdatePostReplyHandler<T extends PostComment>(
  type: 'comment' | 'insight' | 'insight-comment' | 'insight-brick', repositoryFactory: () => ReplyRepository<T>,
): ApiProxyHandler {
  const handler: ApiProxyHandler = async event => {
    try {
      const { content, replyUid, parentUid, workspaceUid } = (event.body || {}) as RequestBody;
      if (typeof content !== 'string' || !content.trim()
        || [replyUid, parentUid, workspaceUid].some(uid => typeof uid !== 'string' || !uid.trim())) {
        return ResponseEntity.badRequest();
      }
      const workspace = await new WorkspaceRepository().findByUidAndStatusNotDeleted(workspaceUid);
      if (!workspace?.id) return ResponseEntity.notFound();

      const author = await new GlobalMentionRepository().findByUserIdAndStatusActive(event.principalUser.id);
      if (!author?.id) return ResponseEntity.notFound();

      const insightReply = type === 'insight-comment' || type === 'insight-brick';
      const parent = insightReply
        ? await new PostInsightRepository().findByUid(parentUid)
        : await new PostRepository().findByUid(parentUid);
      if (!parent?.id || (insightReply ? parent.status === GlobalStatus.Deleted : parent.status !== GlobalStatus.Active) || parent.workspaceId !== workspace.id) {
        return ResponseEntity.notFound();
      }
      const repository = repositoryFactory();
      let entity = await repository.findByUid(replyUid);
      if (!entity?.id || (type === 'insight-brick' ? entity.status === GlobalStatus.Deleted : entity.status !== GlobalStatus.Active) || entity.workspaceId !== workspace.id
        || entity.parentId !== parent.id || entity.projectId !== parent.projectId) {
        return ResponseEntity.notFound();
      }
      if (entity.userId !== event.principalUser.id) return ResponseEntity.forbidden();

      const project = await new ProjectRepository().findByIdAndStatusNotDeleted(parent.projectId);
      if (!project?.id || project.workspaceId !== workspace.id) return ResponseEntity.notFound();

      const service = new PostReplyService();
      const reply = await service.prepare(content, type, project, event.principalUser.id);
      entity.markdownSource = reply.markdown;
      entity.htmlSource = reply.data.post;
      entity.updatedAt = Date.now();
      entity.attributes = typeof entity.attributes === 'string' ? entity.attributes : jsonString(entity.attributes || {});
      entity = await repository.save(entity, true);
      await service.replaceReferences(reply, entity.id);
      return ResponseEntity.ok();
    }
    catch (error) {
      return ResponseEntity.error(error);
    }
  };
  return Middlify(handler, [
    ProvideLoggerMiddleware(type === 'insight' ? 'UpdatePostInsightHandler'
      : type === 'insight-comment' ? 'UpdateInsightCommentHandler'
      : type === 'insight-brick' ? 'UpdateInsightBrickHandler' : 'UpdatePostCommentHandler'),
    ProvidePolicyMiddleware(),
  ]);
}
