import { UpdatePostCommentHandler } from '../../../src/adapters/handlers/posts/UpdatePostCommentHandler';
import { UpdatePostInsightHandler } from '../../../src/adapters/handlers/posts/UpdatePostInsightHandler';
import { WorkspaceRepository } from '../../../src/adapters/persistence/WorkspaceRepository';
import { GlobalMentionRepository } from '../../../src/adapters/persistence/GlobalMentionRepository';
import { ProjectRepository } from '../../../src/adapters/persistence/ProjectRepository';
import { PostRepository } from '../../../src/adapters/persistence/PostRepository';
import { PostCommentRepository } from '../../../src/adapters/persistence/PostCommentRepository';
import { PostInsightRepository } from '../../../src/adapters/persistence/PostInsightRepository';
import { MentionRepository } from '../../../src/adapters/persistence/MentionRepository';
import { TaggableRepository } from '../../../src/adapters/persistence/TaggableRepository';
import { MentionService } from '../../../src/core/services/MentionService';
import { TaggableService } from '../../../src/core/services/TaggableService';
import { TagService } from '../../../src/core/services/TagService';
import { Workspace } from '../../../src/core/domain/Workspace';
import { Project } from '../../../src/core/domain/Project';
import { Post } from '../../../src/core/domain/Post';
import { PostComment } from '../../../src/core/domain/PostComment';
import { PostInsight } from '../../../src/core/domain/PostInsight';
import { GlobalMention } from '../../../src/core/domain/GlobalMention';
import { Tag } from '../../../src/core/domain/Tag';
import { PostRouting } from '../../../src/adapters/handlers/posts/PostRouting';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));
jest.mock('../../../src/deepcore/application/middlify/Middlify', () => ({ Middlify: (handler: unknown) => handler }));

const event = (changes: object = {}): any => ({
  body: { content: 'Editado #tema', replyUid: 'reply', parentUid: 'parent', workspaceUid: 'workspace', ...changes },
  principalUser: { id: 7, username: 'author' }, requestId: 'test',
});

describe.each([
  { type: 'comment', parentType: 'post_comment', handler: UpdatePostCommentHandler, repository: PostCommentRepository, entity: PostComment },
  { type: 'insight', parentType: 'insight', handler: UpdatePostInsightHandler, repository: PostInsightRepository, entity: PostInsight },
])('Update post $type', ({ type, parentType, handler, repository, entity: Entity }) => {
  let reply: PostComment;
  beforeEach(() => {
    reply = Object.assign(new Entity(), { id: 100, uid: 'reply', parentId: 10, projectId: 20, workspaceId: 5,
      userId: 7, authorId: 8, status: 'active', createdAt: 123, updatedAt: 123, attributes: { keep: true },
      markdownSource: 'Original', htmlSource: '<p>Original</p>' });
    jest.spyOn(WorkspaceRepository.prototype, 'findByUidAndStatusNotDeleted').mockResolvedValue(Object.assign(new Workspace(), { id: 5 }));
    jest.spyOn(GlobalMentionRepository.prototype, 'findByUserIdAndStatusActive').mockResolvedValue(Object.assign(new GlobalMention(), { id: 8 }));
    jest.spyOn(PostRepository.prototype, 'findByUid').mockResolvedValue(Object.assign(new Post(), { id: 10, workspaceId: 5, projectId: 20, status: 'active' }));
    jest.spyOn(ProjectRepository.prototype, 'findByIdAndStatusNotDeleted').mockResolvedValue(Object.assign(new Project(), { id: 20, workspaceId: 5, projectKey: 'khara', name: 'Khara' }));
    jest.spyOn(repository.prototype, 'findByUid').mockResolvedValue(reply as PostInsight);
    jest.spyOn(repository.prototype, 'save').mockImplementation(async value => value);
    jest.spyOn(GlobalMentionRepository.prototype, 'findByParentIdAndParentTypeAndStatusActive').mockResolvedValue(Object.assign(new GlobalMention(), { id: 30, mention: 'khara' }));
    jest.spyOn(TagService.prototype, 'getByNameAndUpdateUsage').mockImplementation(async (name, userId, category) => Object.assign(new Tag(), { id: category === 'mention' ? 1 : 2, name, userId, category, link: '<a>' + (category === 'mention' ? '@' : '#') + name + '</a>' }));
    jest.spyOn(TaggableRepository.prototype, 'deleteByParentIdAndParentType').mockResolvedValue();
    jest.spyOn(MentionRepository.prototype, 'deleteByParentIdAndParentType').mockResolvedValue();
    jest.spyOn(TaggableService.prototype, 'create').mockResolvedValue(undefined);
    jest.spyOn(MentionService.prototype, 'create').mockResolvedValue();
  });
  afterEach(() => jest.restoreAllMocks());

  test('registers a dedicated route', () => {
    expect(PostRouting).toContainEqual({ path: '/api/v1/posts/' + (type === 'insight' ? 'insights' : 'comments') + '/update', method: 'post', handler });
  });
  test('updates the correct entity, preserves identity and creation date, and replaces only its references', async () => {
    const response = await handler(event());
    expect(response.body.status).toBe(200);
    expect(repository.prototype.findByUid).toHaveBeenCalledWith('reply');
    expect(repository.prototype.save).toHaveBeenCalledWith(expect.objectContaining({ id: 100, uid: 'reply', parentId: 10,
      projectId: 20, workspaceId: 5, userId: 7, authorId: 8, createdAt: 123, attributes: '{"keep":true}',
      markdownSource: 'Editado #tema\n\n#' + type + ' @khara', updatedAt: expect.any(Number) }), true);
    expect(reply.updatedAt).toBeGreaterThan(123);
    expect(reply.htmlSource).toContain('<a>@khara</a>');
    expect(TaggableRepository.prototype.deleteByParentIdAndParentType).toHaveBeenCalledWith(100, parentType);
    expect(MentionRepository.prototype.deleteByParentIdAndParentType).toHaveBeenCalledWith(100, parentType);
    expect(TaggableService.prototype.create).toHaveBeenCalledWith(expect.objectContaining({ postType: parentType }), 100);
    expect(MentionService.prototype.create).toHaveBeenCalledWith([expect.objectContaining({ id: 30 })], 100, 7, parentType);
  });
  test('does not repeat automatic metadata when saving rawContent again', async () => {
    const footer = '#'+type+' @khara';
    await handler(event({ content: 'Editado\n\n'+footer+'\n\n'+footer }));
    expect(reply.markdownSource).toBe('Editado\n\n'+footer);
    await handler(event({ content: reply.markdownSource + '\n\n' }));
    expect(reply.markdownSource).toBe('Editado\n\n'+footer);
  });
  test.each(['\n', '\n\n', '\r\n\r\n'])('keeps content written below metadata without duplicating it (%p)', async newline => {
    const metadata = '#' + type + ' @khara';
    const response = await handler(event({ content: 'Original' + newline + metadata + newline + 'Información nueva' }));
    expect(response.body.status).toBe(200);
    expect(reply.markdownSource).toContain('Original');
    expect(reply.markdownSource).toContain('Información nueva');
    expect(reply.markdownSource.split(metadata).length - 1).toBe(1);
    expect(reply.htmlSource.split('<a>#' + type + '</a>').length - 1).toBe(1);
    await handler(event({ content: reply.markdownSource + '\n\nMás información' }));
    expect(reply.markdownSource).toContain('Más información');
    expect(reply.markdownSource.split(metadata).length - 1).toBe(1);
  });

  test('normalizes metadata already duplicated in separate places', async () => {
    const metadata = '#' + type + ' @khara';
    await handler(event({ content: metadata + '\n\nPrimero\n\n' + metadata + '\n\nSegundo\n\n' + metadata }));
    expect(reply.markdownSource).toBe('Primero\n\nSegundo\n\n' + metadata);
  });

  test('preserves metadata used in fenced code and adds a real reference', async () => {
    const metadata = '#' + type + ' @khara';
    const code = '\x60\x60\x60text\n' + metadata + '\n\x60\x60\x60';
    await handler(event({ content: code }));
    expect(reply.markdownSource).toBe(code + '\n\n' + metadata);
    expect(reply.htmlSource).toContain('<a>#' + type + '</a>');
  });

  test.each([{ content: '   ' }, { content: null }, { content: 123 }, { replyUid: '' }, { parentUid: '' }, { workspaceUid: '' }])('rejects invalid input: %p', async changes => {
    expect((await handler(event(changes))).body.status).toBe(400);
    expect(repository.prototype.save).not.toHaveBeenCalled();
  });
  test.each([{ id: 0 }, { status: 'deleted' }, { workspaceId: 99 }, { parentId: 99 }, { projectId: 99 }])('rejects missing or unrelated replies: %p', async changes => {
    Object.assign(reply, changes);
    expect((await handler(event())).body.status).toBe(404);
    expect(repository.prototype.save).not.toHaveBeenCalled();
    expect(TaggableRepository.prototype.deleteByParentIdAndParentType).not.toHaveBeenCalled();
  });
  test('rejects editing a reply owned by another author', async () => {
    reply.userId = 99;
    expect((await handler(event())).body.status).toBe(403);
    expect(repository.prototype.save).not.toHaveBeenCalled();
  });
  test('rejects a parent from another workspace', async () => {
    jest.mocked(PostRepository.prototype.findByUid).mockResolvedValue(Object.assign(new Post(), { id: 10, projectId: 20, workspaceId: 99, status: 'active' }));
    expect((await handler(event())).body.status).toBe(404);
    expect(repository.prototype.save).not.toHaveBeenCalled();
  });
  test('rejects a deleted project', async () => {
    jest.mocked(ProjectRepository.prototype.findByIdAndStatusNotDeleted).mockResolvedValue(new Project());
    expect((await handler(event())).body.status).toBe(404);
    expect(repository.prototype.save).not.toHaveBeenCalled();
  });
  test('reports persistence failures without modifying references', async () => {
    jest.mocked(repository.prototype.save).mockRejectedValue(new Error('Database failed'));
    expect((await handler(event())).body.status).toBe(500);
    expect(TaggableRepository.prototype.deleteByParentIdAndParentType).not.toHaveBeenCalled();
  });
});
