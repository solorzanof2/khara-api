import { CreatePostCommentHandler } from '../../../src/adapters/handlers/posts/CreatePostCommentHandler';
import { CreatePostInsightHandler } from '../../../src/adapters/handlers/posts/CreatePostInsightHandler';
import { WorkspaceRepository } from '../../../src/adapters/persistence/WorkspaceRepository';
import { GlobalMentionRepository } from '../../../src/adapters/persistence/GlobalMentionRepository';
import { ProjectRepository } from '../../../src/adapters/persistence/ProjectRepository';
import { PostRepository } from '../../../src/adapters/persistence/PostRepository';
import { PostCommentRepository } from '../../../src/adapters/persistence/PostCommentRepository';
import { PostInsightRepository } from '../../../src/adapters/persistence/PostInsightRepository';
import { GlobalMentionService } from '../../../src/core/services/GlobalMentionService';
import { MentionService } from '../../../src/core/services/MentionService';
import { TaggableService } from '../../../src/core/services/TaggableService';
import { TagService } from '../../../src/core/services/TagService';
import { Workspace } from '../../../src/core/domain/Workspace';
import { Project } from '../../../src/core/domain/Project';
import { Post } from '../../../src/core/domain/Post';
import { GlobalMention } from '../../../src/core/domain/GlobalMention';
import { Tag } from '../../../src/core/domain/Tag';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));
jest.mock('../../../src/deepcore/application/middlify/Middlify', () => ({ Middlify: (handler: unknown) => handler }));

const event = (content: unknown): any => ({
  body: { content, parentUid: 'parent', workspaceUid: 'workspace', projectUid: 'ignored' },
  principalUser: { id: 7, username: 'author' }, requestId: 'test',
});

describe.each([
  { type: 'comment', parentType: 'post_comment', handler: CreatePostCommentHandler, repository: PostCommentRepository },
  { type: 'insight', parentType: 'insight', handler: CreatePostInsightHandler, repository: PostInsightRepository },
])('Create post $type', ({ type, parentType, handler, repository }) => {
  beforeEach(() => {
    jest.spyOn(WorkspaceRepository.prototype, 'findByUidAndStatusNotDeleted').mockResolvedValue(Object.assign(new Workspace(), { id: 5 }));
    jest.spyOn(GlobalMentionRepository.prototype, 'findByUserIdAndStatusActive').mockResolvedValue(Object.assign(new GlobalMention(), { id: 8, displayName: 'Author', mention: 'author' }));
    jest.spyOn(PostRepository.prototype, 'findByUid').mockResolvedValue(Object.assign(new Post(), { id: 10, projectId: 20, workspaceId: 5, status: 'active' }));
    jest.spyOn(ProjectRepository.prototype, 'findByIdAndStatusNotDeleted').mockResolvedValue(Object.assign(new Project(), { id: 20, workspaceId: 5, projectKey: 'khara', name: 'Khara' }));
    jest.spyOn(GlobalMentionRepository.prototype, 'findByParentIdAndParentTypeAndStatusActive').mockResolvedValue(Object.assign(new GlobalMention(), { id: 30, mention: 'khara', parentId: 20, parentType: 'project' }));
    jest.spyOn(GlobalMentionService.prototype, 'add').mockResolvedValue(Object.assign(new GlobalMention(), { id: 30, mention: 'khara' }));
    jest.spyOn(TagService.prototype, 'getByNameAndUpdateUsage').mockImplementation(async (name, userId, category) => Object.assign(new Tag(), { id: category === 'mention' ? 1 : 2, name, userId, category, link: `<a>${category === 'mention' ? '@' : '#'}${name}</a>` }));
    jest.spyOn(TaggableService.prototype, 'create').mockResolvedValue(undefined);
    jest.spyOn(MentionService.prototype, 'create').mockResolvedValue();
    jest.spyOn(repository.prototype, 'save').mockImplementation(async (reply: any) => Object.assign(reply, { id: 100 }));
  });
  afterEach(() => jest.restoreAllMocks());

  test('stores and returns linked type and project metadata derived from the parent', async () => {
    const result = await handler(event('Hola #tema'));
    expect(result.body.status).toBe(200);
    expect(result.body.payload).toEqual(expect.objectContaining({ type, rawContent: `Hola #tema\n\n#${type} @khara`, displayName: 'Author' }));
    expect(result.body.payload.htmlContent).toContain(`<a>#${type}</a>`);
    expect(result.body.payload.htmlContent).toContain('<a>@khara</a>');
    expect(repository.prototype.save).toHaveBeenCalledWith(expect.objectContaining({ parentId: 10, projectId: 20, workspaceId: 5 }), true);
    expect(TaggableService.prototype.create).toHaveBeenCalledWith(expect.objectContaining({ postType: parentType, hashtags: ['tema', type], mentions: ['khara'] }), 100);
    expect(MentionService.prototype.create).toHaveBeenCalledWith([expect.objectContaining({ id: 30, parentId: 20, parentType: 'project' })], 100, 7, parentType);
  });

  test('keeps metadata visible and indexed after an unclosed code block', async () => {
    const result = await handler(event('```\nCódigo'));
    expect(result.body.payload.htmlContent).toContain(`<p><a>#${type}</a> <a>@khara</a></p>`);
  });

  test('creates the parent project mention if it does not exist', async () => {
    jest.mocked(GlobalMentionRepository.prototype.findByParentIdAndParentTypeAndStatusActive).mockResolvedValue(new GlobalMention());
    await handler(event('Hola'));
    expect(GlobalMentionService.prototype.add).toHaveBeenCalledWith('khara', ['Khara'], 20, 'project');
  });

  test.each(['   ', null, 123])('rejects invalid content: %p', async content => {
    expect((await handler(event(content))).body.status).toBe(400);
    expect(repository.prototype.save).not.toHaveBeenCalled();
  });

  test.each([{ workspaceId: 99 }, { status: 'deleted' }])('rejects an inaccessible parent: %p', async changes => {
    jest.mocked(PostRepository.prototype.findByUid).mockResolvedValue(Object.assign(new Post(), { id: 10, workspaceId: 5, status: 'active' }, changes));
    expect((await handler(event('Hola'))).body.status).toBe(404);
    expect(repository.prototype.save).not.toHaveBeenCalled();
  });
});
