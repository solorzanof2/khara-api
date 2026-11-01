import { CreatePostHandler } from '../../../src/adapters/handlers/posts/CreatePostHandler';
import { WorkspaceRepository } from '../../../src/adapters/persistence/WorkspaceRepository';
import { GlobalMentionRepository } from '../../../src/adapters/persistence/GlobalMentionRepository';
import { ProjectRepository } from '../../../src/adapters/persistence/ProjectRepository';
import { PostRepository } from '../../../src/adapters/persistence/PostRepository';
import { MentionService } from '../../../src/core/services/MentionService';
import { ProjectService } from '../../../src/core/services/ProjectService';
import { TaggableService } from '../../../src/core/services/TaggableService';
import { PostMapperService } from '../../../src/core/services/PostMapperService';
import { PostDataDTO } from '../../../src/core/contracts/datatransfers/PostDataDTO';
import { Workspace } from '../../../src/core/domain/Workspace';
import { Project } from '../../../src/core/domain/Project';
import { GlobalMention } from '../../../src/core/domain/GlobalMention';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));
jest.mock('../../../src/deepcore/application/middlify/Middlify', () => ({ Middlify: (handler: unknown) => handler }));

const event = (body: any): any => ({ body, principalUser: { id: 7, username: 'author' }, requestId: 'test' });
describe('CreatePostHandler', () => {
  beforeEach(() => {
    jest.spyOn(WorkspaceRepository.prototype, 'findByUidAndStatusNotDeleted').mockResolvedValue(Object.assign(new Workspace(), { id: 5 }));
    jest.spyOn(GlobalMentionRepository.prototype, 'findByUserIdAndStatusActive').mockResolvedValue(Object.assign(new GlobalMention(), { id: 8 }));
    jest.spyOn(ProjectRepository.prototype, 'findByUidAndStatusNotDeleted').mockResolvedValue(Object.assign(new Project(), { id: 10, workspaceId: 5, companyId: 9, visibility: 'private' }));
    jest.spyOn(PostMapperService.prototype, 'parse').mockResolvedValue(Object.assign(new PostDataDTO(), { post: '<p>Hola</p>', userId: 7 }));
    jest.spyOn(MentionService.prototype, 'resolve').mockResolvedValue({ mentions: [], projects: [] });
    jest.spyOn(MentionService.prototype, 'create').mockResolvedValue();
    jest.spyOn(ProjectService.prototype, 'getOrCreateDefault').mockResolvedValue(Object.assign(new Project(), { id: 20, visibility: 'internal' }));
    jest.spyOn(PostRepository.prototype, 'save').mockImplementation(async post => Object.assign(post, { id: 100 }));
    jest.spyOn(TaggableService.prototype, 'create').mockResolvedValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  test('guarda desde Home sin projectUid y usa General', async () => {
    const response = await CreatePostHandler(event({ content: 'Hola', workspaceUid: 'workspace' }));
    expect(response.body.status).toBe(200);
    expect(ProjectService.prototype.getOrCreateDefault).toHaveBeenCalledWith(5);
    expect(PostRepository.prototype.save).toHaveBeenCalledWith(expect.objectContaining({ projectId: 20, workspaceId: 5, userId: 7 }), true);
  });

  test('asocia el primer proyecto mencionado y todas las referencias', async () => {
    const mentions = [Object.assign(new GlobalMention(), { id: 30 }), Object.assign(new GlobalMention(), { id: 31 })];
    jest.mocked(MentionService.prototype.resolve).mockResolvedValue({ mentions, projects: [Object.assign(new Project(), { id: 21, visibility: 'private' }), Object.assign(new Project(), { id: 22 })] });
    await CreatePostHandler(event({ content: '@uno @dos', workspaceUid: 'workspace' }));
    expect(PostRepository.prototype.save).toHaveBeenCalledWith(expect.objectContaining({ projectId: 21, visibility: 'private' }), true);
    expect(MentionService.prototype.create).toHaveBeenCalledWith(mentions, 100, 7, 'post');
    expect(ProjectService.prototype.getOrCreateDefault).not.toHaveBeenCalled();
  });

  test('conserva el proyecto explícito al publicar desde su timeline', async () => {
    await CreatePostHandler(event({ content: 'Hola', workspaceUid: 'workspace', projectUid: 'project' }));
    expect(PostRepository.prototype.save).toHaveBeenCalledWith(expect.objectContaining({ projectId: 10, visibility: 'private' }), true);
    expect(MentionService.prototype.resolve).toHaveBeenCalledWith([], { workspaceId: 5, companyId: 9, visibility: 'private' });
    expect(ProjectService.prototype.getOrCreateDefault).not.toHaveBeenCalled();
  });

  test('rechaza un proyecto perteneciente a otro workspace', async () => {
    jest.mocked(ProjectRepository.prototype.findByUidAndStatusNotDeleted).mockResolvedValue(Object.assign(new Project(), { id: 10, workspaceId: 99 }));
    const response = await CreatePostHandler(event({ content: 'Hola', workspaceUid: 'workspace', projectUid: 'project' }));
    expect(response.body.status).toBe(404);
    expect(PostRepository.prototype.save).not.toHaveBeenCalled();
  });

  test('rechaza contenido compuesto sólo por espacios', async () => {
    const response = await CreatePostHandler(event({ content: '   ', workspaceUid: 'workspace' }));
    expect(response.body.status).toBe(400);
    expect(PostRepository.prototype.save).not.toHaveBeenCalled();
  });
});
