import { PostInsightRepository } from '../../persistence/PostInsightRepository';
import { createUpdatePostReplyHandler } from './UpdatePostReplyHandler';

export const UpdatePostInsightHandler = createUpdatePostReplyHandler('insight', () => new PostInsightRepository());
