import { BrickCategoryRepository } from '../../../src/adapters/persistence/BrickCategoryRepository';
import { MySQLClient } from '../../../src/deepcore/infrastructure/persistence/MySQLClient';
jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: jest.fn() } }));
test('selects id and name and maps every dictionary row with its database id', async () => {
  const rows = ['General', 'Desarrollo', 'Testing', 'Análisis'].map((name, index) => ({ t0_id: index + 1, t0_name: name }));
  const prepare = jest.fn().mockResolvedValue(rows);
  jest.mocked(MySQLClient.getInstance).mockReturnValue({ prepare } as any);
  const result = await new BrickCategoryRepository().findAll();
  const sql = prepare.mock.calls[0][0].build().query;
  expect(sql).toContain('.id AS t0_id');
  expect(sql).toContain('.name AS t0_name');
  expect(result.map(row => ({ id: row.id, name: row.name }))).toEqual(rows.map(row => ({ id: row.t0_id, name: row.t0_name })));
});
