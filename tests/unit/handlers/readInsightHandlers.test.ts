import { ReadInsightHandler } from '../../../src/adapters/handlers/posts/ReadInsightHandler';
import { ReadInsightBricksCollectionHandler } from '../../../src/adapters/handlers/posts/ReadInsightBricksCollectionHandler';
import { PostInsightRepository } from '../../../src/adapters/persistence/PostInsightRepository';
import { PostInsightCommentRepository } from '../../../src/adapters/persistence/PostInsightCommentRepository';
import { InsightBrickRepository } from '../../../src/adapters/persistence/InsightBrickRepository';
import { GlobalMentionRepository } from '../../../src/adapters/persistence/GlobalMentionRepository';
import { PostRepository } from '../../../src/adapters/persistence/PostRepository';
import { ProjectRepository } from '../../../src/adapters/persistence/ProjectRepository';
import { PostInsight } from '../../../src/core/domain/PostInsight';
import { Post } from '../../../src/core/domain/Post';
import { Project } from '../../../src/core/domain/Project';
import { InsightComment } from '../../../src/core/domain/InsightComment';
import { InsightBrick } from '../../../src/core/domain/InsightBrick';
import { GlobalMention } from '../../../src/core/domain/GlobalMention';
import { PostRouting } from '../../../src/adapters/handlers/posts/PostRouting';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));
jest.mock('../../../src/deepcore/application/middlify/Middlify', () => ({ Middlify: (handler: unknown) => handler }));

const event = (ref: unknown = 'insight'): any => ({ queryStringParameters: { ref }, requestId: 'test' });
let insight: PostInsight;
beforeEach(() => {
  insight = Object.assign(new PostInsight(), { id: 10, uid: 'insight', parentId: 20, authorId: 1,
    projectId: 30, workspaceId: 40, status: 'active', markdownSource: 'Idea', htmlSource: '<p>Idea</p>' });
  jest.spyOn(PostInsightRepository.prototype, 'findByUid').mockResolvedValue(insight);
  jest.spyOn(PostRepository.prototype, 'findById').mockResolvedValue(Object.assign(new Post(), {
    id: 20, uid: 'post', projectId: 30, workspaceId: 40, status: 'active' }));
  jest.spyOn(ProjectRepository.prototype, 'findByIdAndStatusNotDeleted').mockResolvedValue(Object.assign(new Project(), {
    id: 30, uid: 'project', workspaceId: 40, name: 'Project' }));
  jest.spyOn(PostInsightCommentRepository.prototype, 'findByParentId').mockResolvedValue([
    Object.assign(new InsightComment(), { uid: 'comment', authorId: 2, markdownSource: 'Comment' }),
  ]);
  jest.spyOn(InsightBrickRepository.prototype, 'findByParentId').mockResolvedValue([
    Object.assign(new InsightBrick(), { uid: 'brick', authorId: 3, markdownSource: 'Brick', htmlSource: '<p>Brick</p>', status: 'pending' }),
  ]);
  jest.spyOn(GlobalMentionRepository.prototype, 'findAllByIdIn').mockResolvedValue([1, 2, 3].map(id =>
    Object.assign(new GlobalMention(), { id, displayName: 'Author ' + id, mention: 'author' + id })));
});
afterEach(() => jest.restoreAllMocks());

test('reads the insight and its own children with each correct author, project and totals', async () => {
  const response = await ReadInsightHandler(event());
  expect(response.body.status).toBe(200);
  expect(response.body.payload).toMatchObject({ uid: 'insight', parentUid: 'post', rawContent: 'Idea',
    displayName: 'Author 1', totalComments: 1, totalBricks: 1, project: { uid: 'project' },
    comments: [{ uid: 'comment', type: 'insight-comment', displayName: 'Author 2' }],
    bricks: [{ uid: 'brick', type: 'insight-brick', displayName: 'Author 3', rawContent: 'Brick', htmlContent: '<p>Brick</p>' }],
  });
  expect(PostInsightCommentRepository.prototype.findByParentId).toHaveBeenCalledWith(10);
  expect(InsightBrickRepository.prototype.findByParentId).toHaveBeenCalledWith(10);
});

test('returns empty collections and zero totals', async () => {
  jest.mocked(PostInsightCommentRepository.prototype.findByParentId).mockResolvedValue([]);
  jest.mocked(InsightBrickRepository.prototype.findByParentId).mockResolvedValue([]);
  const response = await ReadInsightHandler(event());
  expect(response.body.payload).toMatchObject({ comments: [], bricks: [], totalComments: 0, totalBricks: 0 });
});

for (const [handler, route] of [[ReadInsightHandler, '/api/v1/posts/insights/single'],
  [ReadInsightBricksCollectionHandler, '/api/v1/posts/insights/bricks/collection']] as const) {
  test(route + ' registers a GET route', () => expect(PostRouting).toContainEqual({ path: route, method: 'get', handler }));
  test.each(['', ' ', null, 1])(route + ' rejects invalid refs: %p', async ref => {
    expect((await handler(event(ref))).body.status).toBe(400);
    expect(PostInsightRepository.prototype.findByUid).not.toHaveBeenCalled();
  });
  test(route + ' returns 404 for missing and deleted insights', async () => {
    insight.id = 0;
    expect((await handler(event())).body.status).toBe(404);
    insight.id = 10; insight.status = 'deleted';
    expect((await handler(event())).body.status).toBe(404);
    expect(InsightBrickRepository.prototype.findByParentId).not.toHaveBeenCalled();
  });
  test(route + ' rejects an inconsistent or inaccessible parent project', async () => {
    insight.workspaceId = 999;
    expect((await handler(event())).body.status).toBe(404);
  });
}

test('dedicated bricks collection reads bricks without fetching insight comments', async () => {
  const response = await ReadInsightBricksCollectionHandler(event());
  expect(response.body.payload).toEqual([expect.objectContaining({ uid: 'brick', type: 'insight-brick', displayName: 'Author 3' })]);
  expect(PostInsightCommentRepository.prototype.findByParentId).not.toHaveBeenCalled();
});
