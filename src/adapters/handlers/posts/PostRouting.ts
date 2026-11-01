import { UpdateInsightBrickTimeHandler } from './UpdateInsightBrickHandler';
import { ReadBrickCategoriesHandler } from './ReadBrickCategoriesHandler';
import { UpdateInsightBrickHandler } from './UpdateInsightBrickHandler';
import { UpdateInsightCommentHandler } from './UpdateInsightCommentHandler';
import { CreateInsightBrickHandler } from './CreateInsightBrickHandler';
import { ReadInsightBricksCollectionHandler } from './ReadInsightBricksCollectionHandler';
import { ReadInsightHandler } from './ReadInsightHandler';
import { Route } from '../../../deepcore/contracts/Route';
import { CreateInsightCommentHandler } from './CreateInsightCommentHandler';
import { CreatePostCommentHandler } from './CreatePostCommentHandler';
import { CreatePostHandler } from './CreatePostHandler';
import { CreatePostInsightHandler } from './CreatePostInsightHandler';
import { ReadPostHandler } from './ReadPostHandler';
import { ReadPostCollectionByUserHandler } from './ReadPostsCollectionByUserHandler';
import { ReadPostsCollectionHandler } from './ReadPostsCollectionHandler';
import { UpdatePostInsightHandler } from './UpdatePostInsightHandler';
import { UpdatePostCommentHandler } from './UpdatePostCommentHandler';
import { UpdatePostHandler } from './UpdatePostHandler';


export const PostRouting: Route[] = [
  { path: '/api/v1/posts/insights/bricks/time', method: 'post', handler: UpdateInsightBrickTimeHandler },
  { path: '/api/v1/posts/insights/bricks/categories', method: 'get', handler: ReadBrickCategoriesHandler },
  { path: '/api/v1/posts/insights/bricks/update', method: 'post', handler: UpdateInsightBrickHandler },
  { path: '/api/v1/posts/insights/comment/update', method: 'post', handler: UpdateInsightCommentHandler },
  { path: '/api/v1/posts/insights/bricks', method: 'post', handler: CreateInsightBrickHandler },
  { path: '/api/v1/posts/insights/bricks/collection', method: 'get', handler: ReadInsightBricksCollectionHandler },
  { path: '/api/v1/posts/insights/single', method: 'get', handler: ReadInsightHandler },
  { path: '/api/v1/posts/insights/update', method: 'post', handler: UpdatePostInsightHandler },
  { path: '/api/v1/posts/comments/update', method: 'post', handler: UpdatePostCommentHandler },
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

