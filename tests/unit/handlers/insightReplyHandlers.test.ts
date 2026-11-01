import { CreateInsightCommentHandler } from '../../../src/adapters/handlers/posts/CreateInsightCommentHandler';
import { CreateInsightBrickHandler } from '../../../src/adapters/handlers/posts/CreateInsightBrickHandler';
import { UpdateInsightCommentHandler } from '../../../src/adapters/handlers/posts/UpdateInsightCommentHandler';
import { UpdateInsightBrickHandler } from '../../../src/adapters/handlers/posts/UpdateInsightBrickHandler';
import { PostInsightCommentRepository } from '../../../src/adapters/persistence/PostInsightCommentRepository';
import { InsightBrickRepository } from '../../../src/adapters/persistence/InsightBrickRepository';
import { PostInsightRepository } from '../../../src/adapters/persistence/PostInsightRepository';
import { WorkspaceRepository } from '../../../src/adapters/persistence/WorkspaceRepository';
import { ProjectRepository } from '../../../src/adapters/persistence/ProjectRepository';
import { GlobalMentionRepository } from '../../../src/adapters/persistence/GlobalMentionRepository';
import { PostReplyService } from '../../../src/core/services/PostReplyService';
import { PostInsight } from '../../../src/core/domain/PostInsight';
import { InsightComment } from '../../../src/core/domain/InsightComment';
import { InsightBrick } from '../../../src/core/domain/InsightBrick';
import { Workspace } from '../../../src/core/domain/Workspace';
import { Project } from '../../../src/core/domain/Project';
import { GlobalMention } from '../../../src/core/domain/GlobalMention';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));
jest.mock('../../../src/deepcore/application/middlify/Middlify', () => ({ Middlify: (handler: unknown) => handler }));
const event = (changes = {}): any => ({ body: { content: 'Contenido', parentUid: 'insight', replyUid: 'child', workspaceUid: 'workspace', ...changes }, principalUser: { id: 7 }, requestId: 'test' });

describe.each([
  { type: 'insight-comment', create: CreateInsightCommentHandler, update: UpdateInsightCommentHandler, repository: PostInsightCommentRepository, Entity: InsightComment, status: 'active' },
  { type: 'insight-brick', create: CreateInsightBrickHandler, update: UpdateInsightBrickHandler, repository: InsightBrickRepository, Entity: InsightBrick, status: 'pending' },
])('$type', ({ type, create, update, repository, Entity, status }) => {
  let child: InsightComment | InsightBrick;
  let parent: PostInsight;
  beforeEach(() => {
    parent = Object.assign(new PostInsight(), { id: 10, projectId: 20, workspaceId: 30, status: 'active' });
    child = Object.assign(new Entity(), { id: 100, uid: 'child', parentId: 10, projectId: 20, workspaceId: 30,
      userId: 7, authorId: 8, createdAt: 1, status, attributes: '{"keep":true}' });
    jest.spyOn(InsightBrickRepository.prototype, 'saveChanges').mockResolvedValue(true);
    jest.spyOn(PostInsightRepository.prototype, 'findByUid').mockResolvedValue(parent);
    jest.spyOn(WorkspaceRepository.prototype, 'findByUidAndStatusNotDeleted').mockResolvedValue(Object.assign(new Workspace(), { id: 30 }));
    jest.spyOn(ProjectRepository.prototype, 'findByIdAndStatusNotDeleted').mockResolvedValue(Object.assign(new Project(), { id: 20, workspaceId: 30 }));
    jest.spyOn(GlobalMentionRepository.prototype, 'findByUserIdAndStatusActive').mockResolvedValue(Object.assign(new GlobalMention(), { id: 8, displayName: 'Autor' }));
    jest.spyOn(repository.prototype, 'findByUid').mockResolvedValue(child as InsightBrick);
    jest.spyOn(repository.prototype, 'save').mockImplementation(async entity => Object.assign(entity, { id: 100 }));
    jest.spyOn(PostReplyService.prototype, 'prepare').mockResolvedValue({ markdown: 'Contenido', data: { post: '<p>Contenido</p>' } } as any);
    jest.spyOn(PostReplyService.prototype, 'createReferences').mockResolvedValue();
    jest.spyOn(PostReplyService.prototype, 'replaceReferences').mockResolvedValue();
  });
  afterEach(() => jest.restoreAllMocks());
  test('creates a reply in the insight context and returns its content and type', async () => {
    const result = await create(event(type === 'insight-brick' ? { duration: { amount: '1,5', unit: 'hours' } } : {}));
    expect(result.body.status).toBe(200);
    expect(result.body.payload).toMatchObject({ uid: expect.any(String), type, rawContent: 'Contenido', htmlContent: '<p>Contenido</p>', displayName: 'Autor' });
    expect(repository.prototype.save).toHaveBeenCalledWith(expect.objectContaining({ parentId: 10, projectId: 20, workspaceId: 30, status, userId: 7 }), true);
    if (type === 'insight-brick') {
      expect(PostReplyService.prototype.prepare).toHaveBeenCalledWith('Contenido', type, expect.any(Project), 7, '#general · Tiempo: 1h 30min');
      expect(repository.prototype.save).toHaveBeenCalledWith(expect.objectContaining({ category: 'General' }), true);
      expect(result.body.payload.attributes.time.totals).toEqual(expect.objectContaining({ millis: 5400000, label: '1h 30min' }));
    }
    else expect(PostReplyService.prototype.prepare).toHaveBeenCalledWith('Contenido', type, expect.any(Project), 7);
  });
  test('updates only the child and keeps its status, identity, attributes and creation date', async () => {
    expect((await update(event())).body.status).toBe(200);
    expect(child).toMatchObject({ id: 100, uid: 'child', parentId: 10, createdAt: 1, status, markdownSource: 'Contenido' });
    expect(JSON.parse(child.attributes)).toMatchObject({ keep: true });
    expect(PostInsightRepository.prototype.findByUid).toHaveBeenCalledWith('insight');
    expect(PostReplyService.prototype.replaceReferences).toHaveBeenCalled();
  });
  if (type === 'insight-brick') {
    test('creates and edits a custom category only on the brick', async () => {
      const result = await create(event({ category: ' Soporte propio / QA ' }));
      expect(result.body.status).toBe(200);
      expect(repository.prototype.save).toHaveBeenCalledWith(expect.objectContaining({ category: 'Soporte propio / QA' }), true);
      expect(result.body.payload.category).toBe('Soporte propio / QA');
      expect((await update(event({ category: 'Otra categoría propia' }))).body.status).toBe(200);
      expect(child).toMatchObject({ category: 'Otra categoría propia' });
      expect(InsightBrickRepository.prototype.saveChanges).toHaveBeenCalledWith(expect.objectContaining({ category: 'Otra categoría propia' }), expect.any(Object));
    });
    test('rejects categories that exceed the database limit', async () => {
      expect((await create(event({ category: 'x'.repeat(129) }))).body.status).toBe(400);
      expect(repository.prototype.save).not.toHaveBeenCalled();
    });
  }
  test('rejects edits by another user or for a different parent', async () => {
    child.userId = 999;
    expect((await update(event())).body.status).toBe(403);
    child.userId = 7; child.parentId = 999;
    expect((await update(event())).body.status).toBe(404);
    expect(repository.prototype.save).not.toHaveBeenCalled();
  });
  test('rejects missing, deleted or foreign workspace parents', async () => {
    parent.id = 0;
    expect((await create(event())).body.status).toBe(404);
    parent.id = 10; parent.status = 'deleted';
    expect((await create(event())).body.status).toBe(404);
    parent.status = 'active'; parent.workspaceId = 999;
    expect((await create(event())).body.status).toBe(404);
    expect(repository.prototype.save).not.toHaveBeenCalled();
  });
  test('does not write blank content', async () => {
    expect((await create(event({ content: ' ' }))).body.status).toBe(400);
    expect((await update(event({ content: ' ' }))).body.status).toBe(400);
    expect(repository.prototype.save).not.toHaveBeenCalled();
  });
});
