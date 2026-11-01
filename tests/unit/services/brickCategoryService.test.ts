import { BrickCategoryService } from '../../../src/core/services/BrickCategoryService';
import { BrickCategoryRepository } from '../../../src/adapters/persistence/BrickCategoryRepository';
import { BrickCategory } from '../../../src/core/domain/BrickCategory';
jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));
afterEach(() => jest.restoreAllMocks());
test.each([[' Desarrollo ', 'Desarrollo', 'desarrollo'], ['Análisis', 'Análisis', 'analisis'], [' Revisión   de código ', 'Revisión de código', 'revisionDeCodigo']])('normalizes %s', (value, name, hashtag) => {
  expect(BrickCategoryService.normalize(value)).toEqual({ name, hashtag });
});
test.each(['', ' ', '#evil', '<script>', 'x'.repeat(81), null, 1])('rejects invalid category %p', value => expect(() => BrickCategoryService.normalize(value)).toThrow());
test('defaults to General and exposes only id and name', async () => {
  const create = jest.spyOn(BrickCategoryRepository.prototype, 'getOrCreate').mockResolvedValue(Object.assign(new BrickCategory(), { id: 1, name: 'General' }));
  expect(await new BrickCategoryService().resolve()).toEqual({ id: 1, name: 'General' });
  expect(create).toHaveBeenCalledWith('General');
});
test('uses one atomic insert for concurrent category creation, then reads the canonical existing name', async () => {
  const repository = new BrickCategoryRepository();
  const query = jest.spyOn(repository, 'queryBySql').mockResolvedValue({});
  jest.spyOn(repository, 'execute').mockResolvedValue([Object.assign(new BrickCategory(), { id: 2, name: 'Desarrollo' })]);
  expect(await repository.getOrCreate('DESARROLLO')).toMatchObject({ id: 2, name: 'Desarrollo' });
  expect(query).toHaveBeenCalledWith('INSERT INTO brick_categories (name) VALUES (?) ON DUPLICATE KEY UPDATE id = id', ['DESARROLLO']);
});
