import { InsightBrickRepository } from '../../../src/adapters/persistence/InsightBrickRepository';
import { MySQLClient } from '../../../src/deepcore/infrastructure/persistence/MySQLClient';

jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: jest.fn() } }));

test('reads all four bricks of an insight, including bricks without attributes, with their database ids', async () => {
  const rows = [
    { id: 1, uid: 'brick-1', parentId: 3, status: 'pending', attributes: '{"time":{"measurements":[]}}' },
    { id: 2, uid: 'brick-2', parentId: 3, status: 'pending', attributes: '{}' },
    { id: 3, uid: 'brick-3', parentId: 3, status: 'done', attributes: '' },
    { id: 4, uid: 'brick-4', parentId: 3, status: 'reported', attributes: null },
  ];
  // Return only columns actually selected by the repository, as MySQL would.
  const prepare = jest.fn().mockImplementation(async builder => rows.map(row =>
    Object.fromEntries(builder.getFields().map((field: { name: string; alias: string }) =>
      [field.alias, row[field.name as keyof typeof row]]))));
  jest.mocked(MySQLClient.getInstance).mockReturnValue({ prepare } as any);

  const bricks = await new InsightBrickRepository().findByParentId(3);
  const sql = prepare.mock.calls[0][0].build();

  expect(bricks.map(brick => ({ id: brick.id, uid: brick.uid, attributes: brick.attributes })))
    .toEqual(rows.map(({ id, uid, attributes }) => ({ id, uid, attributes })));
  expect(sql.query).toContain('.id AS t0_id');
  expect(sql.query).toContain('WHERE `t0`.parentId = ? AND `t0`.status <> ?');
  expect(sql.query).not.toContain('LIMIT');
  expect(sql.parameters).toEqual(['3', 'deleted']);
});
