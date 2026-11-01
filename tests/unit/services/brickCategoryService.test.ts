import { BrickCategoryService } from '../../../src/core/services/BrickCategoryService';
import { BrickCategoryRepository } from '../../../src/adapters/persistence/BrickCategoryRepository';
import { BrickCategory } from '../../../src/core/domain/BrickCategory';
jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));
afterEach(() => jest.restoreAllMocks());
test.each([[' Desarrollo ', 'Desarrollo'], ['Análisis', 'Análisis'], [' Revisión   de código / QA ', 'Revisión de código / QA'], ['x'.repeat(128), 'x'.repeat(128)]])('normalizes %s', (value, name) => {
  expect(BrickCategoryService.normalize(value)).toBe(name);
});
test.each(['', ' ', 'x'.repeat(129), null, 1])('rejects invalid category %p', value => expect(() => BrickCategoryService.normalize(value)).toThrow());
test('lists the whole dictionary exposing only id and name ordered by id', async () => {
  jest.spyOn(BrickCategoryRepository.prototype, 'findAll').mockResolvedValue([
    Object.assign(new BrickCategory(), { id: 4, name: 'Análisis' }),
    Object.assign(new BrickCategory(), { id: 1, name: 'General' }),
  ]);
  expect(await new BrickCategoryService().list()).toEqual([{ id: 1, name: 'General' }, { id: 4, name: 'Análisis' }]);
});

test.each([['MiCategoria', 'micategoria'], ['Análisis', 'analisis'], [' Revisión de código / QA ', 'revisiondecodigoqa'], ['QA_Test-1', 'qa_test-1']])('derives a lowercase hashtag from %s', (category, hashtag) => {
  expect(BrickCategoryService.hashtag(category)).toBe(hashtag);
});
