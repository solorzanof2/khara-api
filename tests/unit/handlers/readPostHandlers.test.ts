import { ReadPostHandler } from '../../../src/adapters/handlers/posts/ReadPostHandler';
import { ReadPostsCollectionHandler } from '../../../src/adapters/handlers/posts/ReadPostsCollectionHandler';
import { PostRepository } from '../../../src/adapters/persistence/PostRepository';
import { ProjectRepository } from '../../../src/adapters/persistence/ProjectRepository';
import { GlobalMentionRepository } from '../../../src/adapters/persistence/GlobalMentionRepository';
import { Post } from '../../../src/core/domain/Post';
import { Project } from '../../../src/core/domain/Project';
import { GlobalMention } from '../../../src/core/domain/GlobalMention';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));
jest.mock('../../../src/deepcore/application/middlify/Middlify', () => ({ Middlify: (handler: unknown) => handler }));
const event = (query: any = { ref: 'post', page: '0', perPage: '10' }): any => ({ queryStringParameters: query, principalUser: { id: 7 }, requestId: 'test' });

describe('Lecturas de Posts unificados', () => {
  let post: Post;
  beforeEach(() => {
    const author = Object.assign(new GlobalMention(), { id: 8, displayName: 'Autor', mention: 'autor' });
    post = Object.assign(new Post(), { id: 1, uid: 'post', projectId: 10, author, postsCollection: [Object.assign(new Post(), { id: 2, uid: 'child', parentId: 1, authorId: 8, markdownSource: 'Hijo' })] });
    const project = Object.assign(new Project(), { id: 10, uid: 'project' });
    jest.spyOn(PostRepository.prototype, 'countByParentIdIn').mockResolvedValue([{ parentId: 2, total: 3 }]);
    jest.spyOn(PostRepository.prototype, 'findFullPostByUidAndStatusActive').mockResolvedValue(post);
    jest.spyOn(PostRepository.prototype, 'findAllPaginatedByProjectIdAndStatusActive').mockResolvedValue([post]);
    jest.spyOn(PostRepository.prototype, 'countByProjectIdAndStatusActive').mockResolvedValue(1);
    jest.spyOn(ProjectRepository.prototype, 'findByIdAndStatusNotDeleted').mockResolvedValue(project);
    jest.spyOn(ProjectRepository.prototype, 'findByUidAndStatusNotDeleted').mockResolvedValue(project);
    jest.spyOn(GlobalMentionRepository.prototype, 'findAllByIdIn').mockResolvedValue([author]);
  });
  afterEach(() => jest.restoreAllMocks());
  test('devuelve childs y totalChilds en el detalle', async () => {
    const response = await ReadPostHandler(event());
    expect(response.body.status).toBe(200);
    expect(response.body.payload).toEqual(expect.objectContaining({ totalChilds: 1, childs: [expect.objectContaining({ uid: 'child', totalChilds: 3, type: 'post', rawContent: 'Hijo', displayName: 'Autor' })] }));
    expect(response.body.payload).not.toHaveProperty('insights');
    expect(response.body.payload).not.toHaveProperty('comments');
  });
  test('cuenta los hijos en la colección del proyecto', async () => {
    const response = await ReadPostsCollectionHandler(event());
    expect(response.body.status).toBe(200);
    expect(response.body.payload.collection[0]).toEqual(expect.objectContaining({ totalChilds: 1 }));
  });
  test('devuelve 404 para un Post inexistente', async () => {
    jest.mocked(PostRepository.prototype.findFullPostByUidAndStatusActive).mockResolvedValue(new Post());
    expect((await ReadPostHandler(event())).body.status).toBe(404);
  });
  test('devuelve 400 sin referencia', async () => {
    expect((await ReadPostHandler(event({}))).body.status).toBe(400);
  });
  test('no busca autores para un Post sin hijos', async () => {
    post.postsCollection = [];
    const response = await ReadPostHandler(event());
    expect(response.body.payload).toEqual(expect.objectContaining({ childs: [], totalChilds: 0 }));
    expect(GlobalMentionRepository.prototype.findAllByIdIn).not.toHaveBeenCalled();
  });
});
