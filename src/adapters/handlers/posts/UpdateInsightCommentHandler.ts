import { PostInsightCommentRepository } from '../../persistence/PostInsightCommentRepository';
import { createUpdatePostReplyHandler } from './UpdatePostReplyHandler';

export const UpdateInsightCommentHandler = createUpdatePostReplyHandler('insight-comment', () => new PostInsightCommentRepository());
