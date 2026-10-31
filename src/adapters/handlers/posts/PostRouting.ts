import { Route } from '../../../deepcore/contracts/Route';
import { CreateInsightCommentHandler } from './CreateInsightCommentHandler';
import { CreatePostCommentHandler } from './CreatePostCommentHandler';
import { CreatePostHandler } from './CreatePostHandler';
import { CreatePostInsightHandler } from './CreatePostInsightHandler';
import { ReadPostHandler } from './ReadPostHandler';
import { ReadPostCollectionByUserHandler } from './ReadPostsCollectionByUserHandler';
import { ReadPostsCollectionHandler } from './ReadPostsCollectionHandler';
import { UpdatePostHandler } from './UpdatePostHandler';


export const PostRouting: Route[] = [
  {
    path: '/api/v1/posts',
    method: 'post',
    handler: CreatePostHandler,
  },
  {
    path: '/api/v1/posts/comments',
    method: 'post',
    handler: CreatePostCommentHandler,
  },
  {
    path: '/api/v1/posts/insights',
    method: 'post',
    handler: CreatePostInsightHandler,
  },
  {
    path: '/api/v1/posts/insights/comment',
    method: 'post',
    handler: CreateInsightCommentHandler,
  },
  {
    path: '/api/v1/posts/collection',
    method: 'get',
    handler: ReadPostsCollectionHandler,
  },
  {
    path: '/api/v1/posts/single',
    method: 'get',
    handler: ReadPostHandler,
  },
  {
    path: '/api/v1/posts/update',
    method: 'post',
    handler: UpdatePostHandler,
  },
  {
    path: '/api/v1/posts/collection/owner',
    method: 'get',
    handler: ReadPostCollectionByUserHandler,
  },
];

