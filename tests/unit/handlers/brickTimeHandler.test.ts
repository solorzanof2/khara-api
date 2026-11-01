import { UpdateInsightBrickTimeHandler, UpdateInsightBrickHandler } from '../../../src/adapters/handlers/posts/UpdateInsightBrickHandler';
import { InsightBrickRepository } from '../../../src/adapters/persistence/InsightBrickRepository';
import { WorkspaceRepository } from '../../../src/adapters/persistence/WorkspaceRepository';
import { GlobalMentionRepository } from '../../../src/adapters/persistence/GlobalMentionRepository';
import { PostInsightRepository } from '../../../src/adapters/persistence/PostInsightRepository';
import { ProjectRepository } from '../../../src/adapters/persistence/ProjectRepository';
import { PostReplyService } from '../../../src/core/services/PostReplyService';
import { BrickTimeService } from '../../../src/core/services/BrickTimeService';
import { InsightBrick } from '../../../src/core/domain/InsightBrick';
import { Workspace } from '../../../src/core/domain/Workspace';
import { GlobalMention } from '../../../src/core/domain/GlobalMention';
import { PostInsight } from '../../../src/core/domain/PostInsight';
import { Project } from '../../../src/core/domain/Project';
import { PostRouting } from '../../../src/adapters/handlers/posts/PostRouting';
jest.mock('../../../src/deepcore/infrastructure/persistence/MySQLClient', () => ({MySQLClient:{getInstance:()=>({})}}));
jest.mock('../../../src/deepcore/application/middlify/Middlify', () => ({Middlify:(handler:unknown)=>handler}));
const now=1793555027614;
const event=(action:unknown='start', extra:object={}):any=>({body:{replyUid:'brick',parentUid:'insight',workspaceUid:'workspace',action,...extra},principalUser:{id:7}});
let entity:InsightBrick;
beforeEach(()=>{
  jest.spyOn(Date,'now').mockReturnValue(now);
  entity=Object.assign(new InsightBrick(),{id:1,uid:'brick',category:'General',parentId:10,projectId:20,workspaceId:30,userId:7,updatedAt:100,createdAt:now-10000000,
    markdownSource:'Original',htmlSource:'<p>Original</p>',attributes:JSON.stringify({time:BrickTimeService.initial(7200000,now-1000,true)}),status:'pending'});
  jest.spyOn(WorkspaceRepository.prototype,'findByUidAndStatusNotDeleted').mockResolvedValue(Object.assign(new Workspace(),{id:30}));
  jest.spyOn(GlobalMentionRepository.prototype,'findByUserIdAndStatusActive').mockResolvedValue(Object.assign(new GlobalMention(),{id:8}));
  jest.spyOn(PostInsightRepository.prototype,'findByUid').mockResolvedValue(Object.assign(new PostInsight(),{id:10,projectId:20,workspaceId:30,status:'active'}));
  jest.spyOn(ProjectRepository.prototype,'findByIdAndStatusNotDeleted').mockResolvedValue(Object.assign(new Project(),{id:20,workspaceId:30}));
  jest.spyOn(InsightBrickRepository.prototype,'findByUid').mockResolvedValue(entity);
  jest.spyOn(InsightBrickRepository.prototype,'saveChanges').mockResolvedValue(true);
  jest.spyOn(PostReplyService.prototype,'prepare').mockResolvedValue({data:{post:'Rendered'},markdown:'Generated'} as any);
  jest.spyOn(PostReplyService.prototype,'replaceReferences').mockResolvedValue();
});
afterEach(()=>jest.restoreAllMocks());
test('registers the timer endpoint',()=>expect(PostRouting).toContainEqual({path:'/api/v1/posts/insights/bricks/time',method:'post',handler:UpdateInsightBrickTimeHandler}));
test('starts using server time and retains category, description and reported duration',async()=>{
  const previous=entity.attributes;
  const response=await UpdateInsightBrickTimeHandler(event('start',{startedAt:1,finishedAt:2,millis:9999}));
  expect(response.body.status).toBe(200);
  expect(response.body.payload).toMatchObject({rawContent:'Original',category:'General',attributes:{time:{totals:{label:'2h',reported:'2h'}}}});
  expect(response.body.payload.attributes.time.measurements[1]).toMatchObject({startedAt:now,finishedAt:null,millis:0,reported:false});
  expect(InsightBrickRepository.prototype.saveChanges).toHaveBeenCalledWith(entity,{attributes:previous,updatedAt:100});
});
test('finishes exactly the active measurement and accumulates totals',async()=>{
  entity.attributes=JSON.stringify(BrickTimeService.apply(JSON.parse(entity.attributes),'start',now-10800000));
  const response=await UpdateInsightBrickTimeHandler(event('finish'));
  expect(response.body.payload.attributes.time.totals).toMatchObject({millis:18000000,label:'5h',reported:'2h'});
});
test('reports one selected measurement without adding time',async()=>{
  const attributes=JSON.parse(entity.attributes);attributes.time.measurements[0].reported=false;entity.attributes=JSON.stringify(attributes);
  const response=await UpdateInsightBrickTimeHandler(event('report',{measurementIndex:0}));
  expect(response.body.payload.attributes.time.totals).toMatchObject({millis:7200000,reported:'2h'});
});
test('rejects another author, parent, workspace or deleted brick without updating',async()=>{
  entity.userId=999;expect((await UpdateInsightBrickTimeHandler(event())).body.status).toBe(403);
  entity.userId=7;entity.parentId=999;expect((await UpdateInsightBrickTimeHandler(event())).body.status).toBe(404);
  entity.parentId=10;entity.workspaceId=999;expect((await UpdateInsightBrickTimeHandler(event())).body.status).toBe(404);
  entity.workspaceId=30;entity.status='deleted';expect((await UpdateInsightBrickTimeHandler(event())).body.status).toBe(404);
  expect(InsightBrickRepository.prototype.saveChanges).not.toHaveBeenCalled();
});
test('a stale concurrent action returns 409 rather than overwriting another measurement',async()=>{
  jest.mocked(InsightBrickRepository.prototype.saveChanges).mockResolvedValue(false);
  expect((await UpdateInsightBrickTimeHandler(event())).body.status).toBe(409);
  expect(PostReplyService.prototype.replaceReferences).not.toHaveBeenCalled();
});
test('editing description keeps the history and uses the same concurrency check',async()=>{
  const attributes=entity.attributes;
  const response=await UpdateInsightBrickHandler(event(undefined,{content:'Edited'}));
  expect(response.body.status).toBe(200);
  expect(entity.markdownSource).toBe('Edited');expect(entity.attributes).toBe(attributes);
  expect(InsightBrickRepository.prototype.saveChanges).toHaveBeenCalled();
});
test('rejects malformed timer requests',async()=>{
  expect((await UpdateInsightBrickTimeHandler(event('delete'))).body.status).toBe(400);
  expect((await UpdateInsightBrickTimeHandler(event('start',{replyUid:''}))).body.status).toBe(400);
});
test('repository compares the original JSON and timestamp and only changes brick content/time',async()=>{
  jest.mocked(InsightBrickRepository.prototype.saveChanges).mockRestore();
  const repository=new InsightBrickRepository();
  const query=jest.spyOn(repository,'queryBySql').mockResolvedValue({affectedRows:0});
  expect(await repository.saveChanges(entity,{attributes:entity.attributes,updatedAt:100})).toBe(false);
  expect(query).toHaveBeenCalledWith(expect.stringContaining('BINARY CAST(attributes AS CHAR) = BINARY ?'),expect.arrayContaining(['100',entity.attributes]));
});
