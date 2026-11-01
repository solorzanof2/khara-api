import { BrickService } from '../../../src/core/services/BrickService';
import { BrickTimeService } from '../../../src/core/services/BrickTimeService';
import { BrickCategoryRepository } from '../../../src/adapters/persistence/BrickCategoryRepository';
import { Project } from '../../../src/core/domain/Project';
import { InsightBrick } from '../../../src/core/domain/InsightBrick';
import { GlobalMention } from '../../../src/core/domain/GlobalMention';
import { GlobalMentionRepository } from '../../../src/adapters/persistence/GlobalMentionRepository';
import { PostMapperService } from '../../../src/core/services/PostMapperService';
import { PostDataDTO } from '../../../src/core/contracts/datatransfers/PostDataDTO';
import { mapInsightResponse } from '../../../src/adapters/handlers/posts/InsightResponseMapper';
import { TagService } from '../../../src/core/services/TagService';
import { Tag } from '../../../src/core/domain/Tag';
jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({ MySQLClient: { getInstance: () => ({}) } }));
const project = Object.assign(new Project(), { id: 20, workspaceId: 30 });
beforeEach(() => {
  jest.spyOn(BrickCategoryRepository.prototype, 'findAll').mockRejectedValue(new Error('Brick saves must not access the dictionary'));
  jest.spyOn(BrickCategoryRepository.prototype, 'save').mockRejectedValue(new Error('Brick saves must not edit the dictionary'));
  jest.spyOn(GlobalMentionRepository.prototype, 'findByParentIdAndParentTypeAndStatusActive').mockResolvedValue(Object.assign(new GlobalMention(), { id: 1, mention: 'proyecto' }));
  jest.spyOn(PostMapperService.prototype, 'parse').mockImplementation(async html => Object.assign(new PostDataDTO(), { post: html, userId: 7 }));
});
afterEach(() => jest.restoreAllMocks());
test.each([[45,'minutes',2700000,'45min'],[2,'hours',7200000,'2h'],['1,5','hours',5400000,'1h 30min'],['0.025','minutes',1500,'1s 500ms']])('normalizes %p %s', (amount, unit, millis, label) => {
  expect(BrickService.duration({ amount, unit })).toEqual({ millis, label });
});
test.each([undefined,null,{}, {amount:0,unit:'minutes'}, {amount:-1,unit:'hours'}, {amount:Infinity,unit:'hours'}, {amount:NaN,unit:'minutes'},
  {amount:true,unit:'hours'}, {amount:'1x',unit:'minutes'}, {amount:'1e3',unit:'minutes'}, {amount:1,unit:'days'}, {amount:1e30,unit:'hours'}, {amount:1e-20,unit:'minutes'}])('rejects %p', value => expect(() => BrickService.duration(value)).toThrow());
test('stores category and original description in the brick, only measurements in attributes', async () => {
  const prepared = await new BrickService().prepare('Implementé el almacenamiento.', {category:'Desarrollo', duration:{amount:2,unit:'hours'}}, project, 7);
  expect(prepared.category).toBe('Desarrollo');
  expect(prepared.reply.markdown).toBe('Implementé el almacenamiento.');
  expect(prepared.reply.data.post).toContain('#desarrollo · Tiempo: 2h');
  expect(Object.keys(prepared.attributes)).toEqual(['time']);
  expect(prepared.attributes.time!.totals).toMatchObject({millis:7200000,label:'2h',reported:'0s'});
  const entity = Object.assign(new InsightBrick(), {category:prepared.category, markdownSource:prepared.reply.markdown, htmlSource:prepared.reply.data.post, attributes:JSON.stringify(prepared.attributes)});
  expect(mapInsightResponse(entity,undefined,'insight-brick')).toMatchObject({category:'Desarrollo',rawContent:'Implementé el almacenamiento.'});
});
test('edits description without rewriting elapsed or reported measurements or duplicating generated metadata', async () => {
  const attributes = {time:BrickTimeService.initial(7200000,Date.now(),true),distance:{millis:5}};
  const existing = Object.assign(new InsightBrick(), {category:'Desarrollo', markdownSource:'Original', attributes:JSON.stringify(attributes)});
  for(let index=0;index<3;index++) {
    const prepared = await new BrickService().prepare('Editado',{},project,7,existing);
    expect(prepared.attributes).toEqual(attributes);
    expect(prepared.reply.markdown).toBe('Editado');
    expect(prepared.reply.data.post.match(/Tiempo:/g)).toHaveLength(1);
    existing.attributes=JSON.stringify(prepared.attributes);
  }
  await expect(new BrickService().prepare('Texto',{duration:{amount:3,unit:'hours'}},project,7,existing)).rejects.toMatchObject({code:400});
});
test('preserves old duration, original description and additional measurements while removing redundant attributes', () => {
  const entity=Object.assign(new InsightBrick(),{createdAt:1793555027614,markdownSource:'Generated',attributes:JSON.stringify({description:'Original',category:{name:'Desarrollo'},measurements:{time:{millis:7200000,label:'2 h'},distance:5}})});
  const attributes=BrickService.attributes(entity.attributes,entity.createdAt);
  expect(attributes).toMatchObject({time:{totals:{millis:7200000,label:'2h',reported:'0s'}},measurements:{distance:5}});
  expect(attributes.description).toBeUndefined();expect(attributes.category).toBeUndefined();
  expect(BrickService.description(entity)).toBe('Original');
});
test('old bricks without measurements stay without invented time', async () => {
  const existing=Object.assign(new InsightBrick(),{category:'General',attributes:'{}'});
  expect((await new BrickService().prepare('Texto',{},project,7,existing)).attributes).toEqual({});
});
test('new bricks can be published without any time configuration', async () => {
  const prepared = await new BrickService().prepare('Texto',{},project,7);
  expect(prepared.attributes).toEqual({});
  expect(prepared.reply.markdown).toBe('Texto');
  expect(prepared.reply.data.post).not.toContain('Tiempo:');
});
test('custom category is indexed as a hashtag without editing the dictionary', async () => {
  jest.mocked(PostMapperService.prototype.parse).mockRestore();
  jest.spyOn(TagService.prototype,'getByNameAndUpdateUsage').mockImplementation(async(name,userId,category)=>Object.assign(new Tag(),{id:1,name,userId,category,link:'<a>#'+name+'</a>'}));
  const prepared=await new BrickService().prepare('Texto',{category:' Categoría propia / soporte ',duration:{amount:2,unit:'hours'}},project,7);
  expect(prepared.category).toBe('Categoría propia / soporte');
  expect(prepared.reply.data.hashtags).toContain('categoriapropiasoporte');
  expect(TagService.prototype.getByNameAndUpdateUsage).toHaveBeenCalledWith('categoriapropiasoporte', 7, 'hashtag');
  expect(prepared.reply.data.post).not.toContain('Categoría propia');
  expect(BrickCategoryRepository.prototype.findAll).not.toHaveBeenCalled();
  expect(BrickCategoryRepository.prototype.save).not.toHaveBeenCalled();
});

test.each(['MiCategoria', 'x'.repeat(128)])('adds the lowercase category hashtag for %s without changing the saved category', async category => {
  jest.mocked(PostMapperService.prototype.parse).mockRestore();
  jest.spyOn(TagService.prototype, 'getByNameAndUpdateUsage').mockImplementation(async (name, userId, type) => Object.assign(new Tag(), { id: 1, name, userId, category: type, link: '<a>#' + name + '</a>' }));
  const prepared = await new BrickService().prepare('Mi contenido', { category }, project, 7);
  expect(prepared.category).toBe(category);
  expect(prepared.reply.markdown).toBe('Mi contenido');
  expect(prepared.reply.data.hashtags).toContain(category.toLowerCase());
  expect(prepared.reply.data.post).toContain('#' + category.toLowerCase());
  expect(BrickCategoryRepository.prototype.save).not.toHaveBeenCalled();
});

test('replaces generated category metadata on repeated edits and category changes', async () => {
  const existing = Object.assign(new InsightBrick(), { category: 'Anterior', markdownSource: 'Texto', attributes: '{}' });
  for (let index = 0; index < 3; index++) {
    const prepared = await new BrickService().prepare(existing.markdownSource, { category: 'MiCategoria' }, project, 7, existing);
    expect(prepared.reply.data.post.match(/#micategoria/g)).toHaveLength(1);
    expect(prepared.reply.data.post).not.toContain('#anterior');
    existing.markdownSource = prepared.reply.markdown;
    existing.category = prepared.category;
  }
});
