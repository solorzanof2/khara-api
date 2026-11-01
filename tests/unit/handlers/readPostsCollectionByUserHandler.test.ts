import { ReadPostCollectionByUserHandler } from '../../../src/adapters/handlers/posts/ReadPostsCollectionByUserHandler';
import { PostRepository } from '../../../src/adapters/persistence/PostRepository';
import { PostInsightRepository } from '../../../src/adapters/persistence/PostInsightRepository';
import { ProjectRepository } from '../../../src/adapters/persistence/ProjectRepository';
import { Post } from '../../../src/core/domain/Post';
import { Project } from '../../../src/core/domain/Project';
import { GlobalMention } from '../../../src/core/domain/GlobalMention';
import { Dates } from '../../../src/core/helpers/DatesHelper';
import { LABEL } from '../../../src/core/helpers/LabelHelper';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));
jest.mock('../../../src/deepcore/application/middlify/Middlify', () => ({ Middlify: (handler: unknown) => handler }));

const event = (query = { page: '0', perPage: '10' }): any => ({
  queryStringParameters: query, principalUser: { id: 7 }, requestId: 'test',
});
const makePost = (id: number, projectId: number): Post => Object.assign(new Post(), {
  id, uid: 'post-' + id, projectId, markdownSource: '**Original**', htmlSource: '<p><strong>Original</strong></p>',
  createdAt: 1793486671624, updatedAt: 1793486671624,
  author: Object.assign(new GlobalMention(), { displayName: 'Félix', mention: 'felixo' }),
});
const project = Object.assign(new Project(), {
  id: 10, uid: 'project-10', name: 'General', projectKey: 'general',
  workspace: { uid: 'workspace-1' }, createdAt: 1793486671624, updatedAt: 1793486671624,
});

describe('ReadPostCollectionByUserHandler', () => {
  beforeEach(() => {
    jest.spyOn(PostRepository.prototype, 'findAllPaginatedByUserIdAndStatusActive').mockResolvedValue([makePost(1, 10)]);
    jest.spyOn(PostRepository.prototype, 'countByUserIdAndStatusActive').mockResolvedValue(11);
    jest.spyOn(PostRepository.prototype, 'countByProjectIdAndStatusActive').mockResolvedValue(99);
    jest.spyOn(PostInsightRepository.prototype, 'countByParentIdIn').mockResolvedValue([{ parentId: 1, total: 2 }]);
    jest.spyOn(ProjectRepository.prototype, 'findByIdAndStatusNotDeleted').mockResolvedValue(project);
  });
  afterEach(() => jest.restoreAllMocks());

  test('incluye el proyecto con el mismo contrato que ReadPostHandler y conserva el contenido', async () => {
    const result = await ReadPostCollectionByUserHandler(event());
    expect(result.body.status).toBe(200);
    const response = result.body.payload;
    expect(response.collection[0]).toEqual(expect.objectContaining({
      uid: 'post-1', rawContent: '**Original**', htmlContent: '<p><strong>Original</strong></p>',
      totalComments: 0, totalInsights: 2, displayName: 'Félix', mention: 'felixo',
      project: {
        uid: project.uid, workspaceUid: 'workspace-1', name: 'General', key: 'general',
        visibility: project.visibility, visibilityLabel: LABEL.parse(project.visibility),
        status: project.status, statusLabel: LABEL.parse(project.status),
        created: project.createdAt, createdLabel: Dates.millisToLocalUserDatetime(project.createdAt),
        updated: project.updatedAt, updatedLabel: Dates.millisToLocalUserDatetime(project.updatedAt),
      },
    }));
    expect(PostRepository.prototype.countByUserIdAndStatusActive).toHaveBeenCalledWith(7);
    expect(PostRepository.prototype.countByProjectIdAndStatusActive).not.toHaveBeenCalled();
    expect(response).toEqual(expect.objectContaining({ totalRows: 11, totalPages: 2, hasNext: true, length: 1 }));
  });

  test('resuelve cada proyecto una vez y asigna a cada publicación el correcto', async () => {
    jest.mocked(PostRepository.prototype.findAllPaginatedByUserIdAndStatusActive).mockResolvedValue([
      makePost(1, 10), makePost(2, 20), makePost(3, 10),
    ]);
    jest.mocked(ProjectRepository.prototype.findByIdAndStatusNotDeleted).mockImplementation(async id =>
      Object.assign(new Project(), project, { id, uid: 'project-' + id }));
    const result = await ReadPostCollectionByUserHandler(event());
    expect(result.body.payload.collection.map((post: any) => post.project.uid)).toEqual(['project-10', 'project-20', 'project-10']);
    expect(ProjectRepository.prototype.findByIdAndStatusNotDeleted).toHaveBeenCalledTimes(2);
  });

  test('devuelve 404 si el proyecto ya no existe, como la lectura individual', async () => {
    jest.mocked(ProjectRepository.prototype.findByIdAndStatusNotDeleted).mockResolvedValue(new Project());
    const result = await ReadPostCollectionByUserHandler(event());
    expect(result.body.status).toBe(404);
  });

  test('conserva la respuesta vacía sin consultar proyectos', async () => {
    jest.mocked(PostRepository.prototype.findAllPaginatedByUserIdAndStatusActive).mockResolvedValue([]);
    jest.mocked(PostRepository.prototype.countByUserIdAndStatusActive).mockResolvedValue(0);
    const result = await ReadPostCollectionByUserHandler(event());
    expect(result.body.status).toBe(200);
    expect(result.body.payload).toEqual(expect.objectContaining({ collection: [], length: 0, totalPages: 0, hasNext: false, hasPrevious: false }));
    expect(ProjectRepository.prototype.findByIdAndStatusNotDeleted).not.toHaveBeenCalled();
  });
});
