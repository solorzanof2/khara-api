import { UpdatePostHandler } from '../../../src/adapters/handlers/posts/UpdatePostHandler';
import { PostRepository } from '../../../src/adapters/persistence/PostRepository';
import { WorkspaceRepository } from '../../../src/adapters/persistence/WorkspaceRepository';
import { ProjectRepository } from '../../../src/adapters/persistence/ProjectRepository';
import { GlobalMentionRepository } from '../../../src/adapters/persistence/GlobalMentionRepository';
import { PostMapperService } from '../../../src/core/services/PostMapperService';
import { TaggableService } from '../../../src/core/services/TaggableService';
import { PostDataDTO } from '../../../src/core/contracts/datatransfers/PostDataDTO';
import { Post } from '../../../src/core/domain/Post';
import { Workspace } from '../../../src/core/domain/Workspace';
import { Project } from '../../../src/core/domain/Project';
import { GlobalMention } from '../../../src/core/domain/GlobalMention';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));
jest.mock('../../../src/deepcore/application/middlify/Middlify', () => ({ Middlify: (handler: unknown) => handler }));

const event = (body = {}): any => ({ body: { content: 'Editado', workspaceUid: 'workspace', projectUid: 'project', postUid: 'child', ...body }, principalUser: { id: 7 }, requestId: 'test' });

describe('UpdatePostHandler', () => {
  let child: Post;
  beforeEach(() => {
    child = Object.assign(new Post(), { id: 2, uid: 'child', parentId: 1, workspaceId: 5, projectId: 10, createdAt: 123 });
    jest.spyOn(WorkspaceRepository.prototype, 'findByUidAndStatusNotDeleted').mockResolvedValue(Object.assign(new Workspace(), { id: 5 }));
    jest.spyOn(ProjectRepository.prototype, 'findByUidAndStatusNotDeleted').mockResolvedValue(Object.assign(new Project(), { id: 10, workspaceId: 5 }));
    jest.spyOn(GlobalMentionRepository.prototype, 'findByUserIdAndStatusActive').mockResolvedValue(Object.assign(new GlobalMention(), { id: 8 }));
    jest.spyOn(PostRepository.prototype, 'findByUid').mockImplementation(async uid => uid === 'child' ? child : Object.assign(new Post(), { id: 1, uid: 'parent' }));
    jest.spyOn(PostRepository.prototype, 'save').mockImplementation(async post => post);
    jest.spyOn(PostMapperService.prototype, 'parse').mockResolvedValue(Object.assign(new PostDataDTO(), { post: '<p>Editado</p>' }));
    jest.spyOn(TaggableService.prototype, 'create').mockResolvedValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  test('edita el hijo indicado por postUid cuando se envía parentUid', async () => {
    const response = await UpdatePostHandler(event({ parentUid: 'parent' }));
    expect(response.body.status).toBe(200);
    expect(PostRepository.prototype.save).toHaveBeenCalledWith(expect.objectContaining({ id: 2, uid: 'child', parentId: 1, createdAt: 123, markdownSource: 'Editado' }), true);
    expect(TaggableService.prototype.create).toHaveBeenCalledWith(expect.any(PostDataDTO), 2);
  });
  test('edita una raíz conservando parentId NULL', async () => {
    child.parentId = null;
    expect((await UpdatePostHandler(event())).body.status).toBe(200);
    expect(PostRepository.prototype.save).toHaveBeenCalledWith(expect.objectContaining({ parentId: null }), true);
  });
  test('rechaza un parentUid que no corresponde al hijo', async () => {
    child.parentId = 99;
    expect((await UpdatePostHandler(event({ parentUid: 'parent' }))).body.status).toBe(404);
    expect(PostRepository.prototype.save).not.toHaveBeenCalled();
  });
  test('rechaza editar un Post de otro contexto', async () => {
    child.workspaceId = 99;
    expect((await UpdatePostHandler(event())).body.status).toBe(404);
    expect(PostRepository.prototype.save).not.toHaveBeenCalled();
  });
});
