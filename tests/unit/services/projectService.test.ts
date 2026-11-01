import { ProjectService } from '../../../src/core/services/ProjectService';
import { ProjectRepository } from '../../../src/adapters/persistence/ProjectRepository';
import { CompanyRepository } from '../../../src/adapters/persistence/CompanyRepository';
import { Project } from '../../../src/core/domain/Project';
import { Company } from '../../../src/core/domain/Company';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));

describe('Proyecto General', () => {
  beforeEach(() => {
    jest.spyOn(ProjectRepository.prototype, 'findByWorkspaceIdAndProjectKeyAndStatusNotDeleted').mockResolvedValue(new Project());
    jest.spyOn(CompanyRepository.prototype, 'findInternalByWorkspaceIdAndStatusNotDeleted').mockResolvedValue(Object.assign(new Company(), { id: 9 }));
    jest.spyOn(ProjectService.prototype, 'add').mockResolvedValue(Object.assign(new Project(), { id: 20 }));
  });
  afterEach(() => jest.restoreAllMocks());

  test('crea General en la compañía interna del workspace', async () => {
    expect((await new ProjectService().getOrCreateDefault(5)).id).toBe(20);
    expect(CompanyRepository.prototype.findInternalByWorkspaceIdAndStatusNotDeleted).toHaveBeenCalledWith(5);
    expect(ProjectService.prototype.add).toHaveBeenCalledWith(9, 5, ['General'], ['__general__'], 'internal');
  });

  test('reutiliza General existente sin crear otro proyecto', async () => {
    jest.mocked(ProjectRepository.prototype.findByWorkspaceIdAndProjectKeyAndStatusNotDeleted).mockResolvedValue(Object.assign(new Project(), { id: 22 }));
    expect((await new ProjectService().getOrCreateDefault(5)).id).toBe(22);
    expect(ProjectService.prototype.add).not.toHaveBeenCalled();
    expect(CompanyRepository.prototype.findInternalByWorkspaceIdAndStatusNotDeleted).not.toHaveBeenCalled();
  });

  test('no intenta insertar con una FK de compañía inválida', async () => {
    jest.mocked(CompanyRepository.prototype.findInternalByWorkspaceIdAndStatusNotDeleted).mockResolvedValue(new Company());
    await expect(new ProjectService().getOrCreateDefault(5)).rejects.toThrow('compañía interna');
    expect(ProjectService.prototype.add).not.toHaveBeenCalled();
  });
});
