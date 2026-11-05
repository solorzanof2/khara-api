// Requires an independently initialized temporary MySQL server. Never loads .env.
const assert = require('node:assert/strict');
const path = require('node:path');
const mysql = require('mysql');
require('ts-node').register({ transpileOnly: true });
const { MigrationManager } = require('../../src/deepcore/infrastructure/persistence/MigrationManager');
const { MySQLClient } = require('../../src/deepcore/infrastructure/persistence/MySQLClient');
const { PostRepository } = require('../../src/adapters/persistence/PostRepository');
const { MentionService } = require('../../src/core/services/MentionService');
const { TaggableService } = require('../../src/core/services/TaggableService');
const { PostDataDTO } = require('../../src/core/contracts/datatransfers/PostDataDTO');
const { Post } = require('../../src/core/domain/Post');

const port = Number(process.env.KHARA_SCHEMA_TEST_PORT);
assert.ok(Number.isInteger(port) && port >= 1024 && port <= 65535, 'Set KHARA_SCHEMA_TEST_PORT to a dedicated temporary MySQL port.');
const connection = mysql.createConnection({ host: '127.0.0.1', port, user: 'root', password: '' });
const query = (sql, params = []) => new Promise((resolve, reject) => connection.query(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));
const schema = 'khara_unified_test_' + Date.now();
let created = false;
let app;
async function main() {
  const [server] = await query('SELECT @@datadir AS datadir');
  assert.match(server.datadir.replace(/\\/g, '/'), /\/khara-schema-step2-[a-f0-9]{32}\/data\/$/i, 'Refusing a server outside a dedicated temporary test datadir');
  await query('CREATE DATABASE ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci', [schema]);
  created = true;
  await query('USE ??', [schema]);
  app = MySQLClient.getInstance({ host: '127.0.0.1', port, user: 'root', password: '', name: schema, logginSQL: false });
  const migrations = path.resolve(__dirname, '../../migrations');
  await MigrationManager.getInstance(migrations).initialize();
  const changelog = await query('SELECT * FROM databasechangelog');
  await MigrationManager.getInstance(migrations).initialize();
  assert.deepEqual(await query('SELECT * FROM databasechangelog'), changelog);
  const tables = (await query('SHOW TABLES')).map(row => Object.values(row)[0]);
  for (const retired of ['posts_comments', 'posts_insights', 'insights_comments', 'insights_bricks', 'brick_categories']) assert.ok(!tables.includes(retired));
  assert.ok(tables.includes('post_capabilities') && tables.includes('capability_records'));

  const [context] = await query("SELECT p.id AS projectId, p.workspaceId, g.id AS authorId, g.parentId AS userId FROM projects p JOIN global_mentions g ON g.parentType = 'user' LIMIT 1");
  assert.ok(context, 'Seed migrations must provide project and author');
  const create = async (uid, parentId = null, status = 'active') => new PostRepository().save(Object.assign(new Post(), context, { uid, parentId, status, htmlSource: '<p>Test</p>', markdownSource: 'Test', createdAt: 1700000000000, updatedAt: 1700000000000, attributes: { sample: true } }), true);
  const root = await create('root');
  assert.equal(root.parentId, null);
  const child = await create('child', root.id);
  const grandchild = await create('grandchild', child.id);
  await create('deleted-child', root.id, 'deleted');
  await create('second-root');
  let full = await new PostRepository().findFullPostByUidAndStatusActive(root.uid);
  assert.deepEqual(full.postsCollection.map(post => post.uid), ['child']);
  assert.equal(full.postsCollection[0].parentId, root.id);
  assert.deepEqual(full.attributes, { sample: true });
  assert.deepEqual((await new PostRepository().findFullPostByUidAndStatusActive(child.uid)).postsCollection.map(post => post.uid), [grandchild.uid]);
  const page = await new PostRepository().findAllPaginatedByProjectIdAndStatusActive(context.projectId, 0, 2);
  assert.equal(page.length, 2, 'Pagination counts posts, not joined children');
  assert.ok(page.every(post => post.author.id === context.authorId));
  const projectPosts = await new PostRepository().findAllPaginatedByProjectIdAndStatusActive(context.projectId, 0, 10);
  assert.equal(projectPosts.find(post => post.id === root.id).postsCollection.length, 1);
  const ownerPage = await new PostRepository().findAllPaginatedByUserIdAndStatusActive(context.userId, 0, 10);
  assert.equal(ownerPage.find(post => post.id === root.id).postsCollection.length, 1);
  assert.ok(await new PostRepository().countByUserIdAndStatusActive(context.userId) >= 4);
  const counts = await new PostRepository().countByParentIdIn([root.id, child.id]);
  assert.equal(counts.find(row => row.parentId === root.id).total, 1);
  assert.deepEqual(await new PostRepository().countByParentIdIn([]), []);
  root.markdownSource = 'Edited root';
  await new PostRepository().save(root, true);
  assert.equal((await new PostRepository().findById(root.id)).parentId, null);
  child.markdownSource = 'Edited child';
  await new PostRepository().save(child); // Must persist even without getLastInserted.
  assert.equal((await new PostRepository().findById(child.id)).markdownSource, 'Edited child');
  await assert.rejects(create('orphan', 999999), error => error.code === 'ER_NO_REFERENCED_ROW_2');

  const tag = await query("INSERT INTO tags (name, category, link, usageCount, userId) VALUES ('unified-test', 'hashtag', '/test', 1, ?)", [context.userId]);
  const dto = Object.assign(new PostDataDTO(), { userId: context.userId, hashtagEntities: [{ id: tag.insertId }] });
  await new TaggableService().create(dto, child.id);
  await new MentionService().create([{ id: context.authorId }], child.id, context.userId);
  assert.equal((await query('SELECT * FROM taggables WHERE parentId = ?', [child.id])).length, 1);
  assert.equal((await query('SELECT * FROM mentions WHERE parentId = ?', [child.id])).length, 1);
  const { TaggableRepository } = require('../../src/adapters/persistence/TaggableRepository');
  const { MentionRepository } = require('../../src/adapters/persistence/MentionRepository');
  await new TaggableRepository().deleteByParentId(child.id);
  await new MentionRepository().deleteByParentId(child.id);
  assert.equal((await query('SELECT * FROM taggables WHERE parentId = ?', [child.id])).length, 0);
  assert.equal((await query('SELECT * FROM mentions WHERE parentId = ?', [child.id])).length, 0);
  console.log('PASS: migrations 01-06, repeat application, Post hierarchy, pagination, NULL roots, saves, FK, tags and mentions.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (app) await new Promise(resolve => app.connection.end(resolve));
  if (created) await query('DROP DATABASE ??', [schema]);
  await new Promise(resolve => connection.end(resolve));
});
