import { PostCommentRepository } from '../../persistence/PostCommentRepository';
import { createUpdatePostReplyHandler } from './UpdatePostReplyHandler';

export const UpdatePostCommentHandler = createUpdatePostReplyHandler('comment', () => new PostCommentRepository());
