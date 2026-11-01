import { ReadBrickCategoriesHandler } from '../../../src/adapters/handlers/posts/ReadBrickCategoriesHandler';
import { CreateBrickCategoryHandler } from '../../../src/adapters/handlers/posts/CreateBrickCategoryHandler';
import { BrickCategoryRepository } from '../../../src/adapters/persistence/BrickCategoryRepository';
import { PostInsightRepository } from '../../../src/adapters/persistence/PostInsightRepository';
import { ProjectRepository } from '../../../src/adapters/persistence/ProjectRepository';
import { WorkspaceRepository } from '../../../src/adapters/persistence/WorkspaceRepository';
import { PostInsight } from '../../../src/core/domain/PostInsight';
import { Project } from '../../../src/core/domain/Project';
import { Workspace } from '../../../src/core/domain/Workspace';
import { PostRouting } from '../../../src/adapters/handlers/posts/PostRouting';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));
jest.mock('../../../src/deepcore/application/middlify/Middlify', () => ({ Middlify: (handler: unknown) => handler }));
const event = (changes = {}): any => ({
  body: { ref: 'insight', workspaceUid: 'workspace', name: ' Revisión   de código ', ...changes },
  queryStringParameters: { ref: 'insight', workspaceUid: 'workspace', ...changes }, principalUser: { id: 7 },
});
let insight: PostInsight;
beforeEach(() => {
  insight = Object.assign(new PostInsight(), { id: 10, workspaceId: 30, projectId: 20, status: 'active' });
  jest.spyOn(PostInsightRepository.prototype, 'findByUid').mockResolvedValue(insight);
  jest.spyOn(WorkspaceRepository.prototype, 'findByUidAndStatusNotDeleted').mockResolvedValue(Object.assign(new Workspace(), { id: 30 }));
  jest.spyOn(ProjectRepository.prototype, 'findByIdAndStatusNotDeleted').mockResolvedValue(Object.assign(new Project(), { id: 20, workspaceId: 30 }));
  jest.spyOn(BrickCategoryRepository.prototype, 'getOrCreate').mockImplementation(async name => ({ id: 5, name } as any));
  jest.spyOn(BrickCategoryRepository.prototype, 'findAll').mockResolvedValue([]);
});
afterEach(() => jest.restoreAllMocks());

test('creates a normalized category in the parent insight project', async () => {
  const response = await CreateBrickCategoryHandler(event());
  expect(response.body.status).toBe(200);
  expect(response.body.payload).toEqual({ id: 5, name: 'Revisión de código' });
  expect(BrickCategoryRepository.prototype.getOrCreate).toHaveBeenCalledWith('Revisión de código');
});
test('reads the shared catalog without duplicating categories per project', async () => {
  expect((await ReadBrickCategoriesHandler(event())).body.status).toBe(200);
  expect(BrickCategoryRepository.prototype.findAll).toHaveBeenCalledWith();
  expect(BrickCategoryRepository.prototype.getOrCreate).not.toHaveBeenCalled();
});
test('rejects invalid names without persisting', async () => {
  expect((await CreateBrickCategoryHandler(event({ name: '<script>' }))).body.status).toBe(400);
  expect(BrickCategoryRepository.prototype.getOrCreate).not.toHaveBeenCalled();
});
for (const [handler, method] of [[ReadBrickCategoriesHandler, 'get'], [CreateBrickCategoryHandler, 'post']] as const) {
  test(method + ' route is registered', () => expect(PostRouting).toContainEqual({ path: '/api/v1/posts/insights/bricks/categories', method, handler }));
  test(method + ' rejects invalid insight/workspace refs', async () => {
    expect((await handler(event({ ref: '' }))).body.status).toBe(400);
    expect((await handler(event({ workspaceUid: 1 }))).body.status).toBe(400);
  });
  test(method + ' cannot read or create categories for another workspace', async () => {
    insight.workspaceId = 999;
    expect((await handler(event())).body.status).toBe(404);
    expect(BrickCategoryRepository.prototype.getOrCreate).not.toHaveBeenCalled();
    expect(BrickCategoryRepository.prototype.findAll).not.toHaveBeenCalled();
  });
  test(method + ' rejects missing or deleted insights', async () => {
    insight.id = 0;
    expect((await handler(event())).body.status).toBe(404);
    insight.id = 10; insight.status = 'deleted';
    expect((await handler(event())).body.status).toBe(404);
  });
}
