import { BrickTimeService } from '../../../src/core/services/BrickTimeService';
const now=1793555027614;
test('accumulates 2h reported plus 3h unreported without altering the first measurement',()=>{
  let attributes={time:BrickTimeService.initial(7200000,now,true)};
  const initial={...attributes.time.measurements[0]};
  attributes=BrickTimeService.apply(attributes,'start',now+1000) as typeof attributes;
  expect(attributes.time.measurements[1]).toMatchObject({startedAt:now+1000,finishedAt:null,reported:false});
  expect(attributes.time.totals.millis).toBe(7200000);
  attributes=BrickTimeService.apply(attributes,'finish',now+1000+10800000) as typeof attributes;
  expect(attributes.time.measurements[0]).toEqual(initial);
  expect(attributes.time.totals).toMatchObject({millis:18000000,label:'5h',reported:'2h',createdAt:now,updatedAt:now+1000+10800000});
  attributes=BrickTimeService.apply(attributes,'report',now+10802000,1) as typeof attributes;
  expect(attributes.time.totals.reported).toBe('5h');
});
test('cannot start twice, finish twice, or report a running measurement',()=>{
  const active=BrickTimeService.apply({},'start',now);
  expect(()=>BrickTimeService.apply(active,'start',now+1)).toThrow('ya tiene');
  expect(()=>BrickTimeService.apply(active,'report',now+1,0)).toThrow('Finaliza');
  const finished=BrickTimeService.apply(active,'finish',now+1000);
  expect(()=>BrickTimeService.apply(finished,'finish',now+2000)).toThrow('no tiene');
});
test('report-all includes only finished measurements and is repeatable without inflating reported totals',()=>{
  let attributes=BrickTimeService.apply({time:BrickTimeService.initial(7200000,now)},'start',now+1);
  attributes=BrickTimeService.apply(attributes,'report',now+2);
  expect(attributes.time!.totals.reported).toBe('2h');
  expect(attributes.time!.measurements[1].reported).toBe(false);
  attributes=BrickTimeService.apply(attributes,'report',now+3);
  expect(attributes.time!.totals.reported).toBe('2h');
});
test.each([-1,100,1.5,'0',null])('rejects invalid measurement %p',index=>{
  expect(()=>BrickTimeService.apply({time:BrickTimeService.initial(7200000,now)},'report',now,index)).toThrow();
});
test('rejects unrecognized actions and a finish time before start',()=>{
  expect(()=>BrickTimeService.apply({},'delete',now)).toThrow();
  expect(()=>BrickTimeService.apply(BrickTimeService.apply({},'start',now),'finish',now-1)).toThrow();
});


test('adds a completed interval while retaining an active timer and other attributes', () => {
  const active = BrickTimeService.apply({ distance: 12 }, 'start', now);
  const before = JSON.stringify(active);
  const result = BrickTimeService.apply(active, 'add', now + 1000, undefined, { startedAt: now - 5400000, finishedAt: now });
  expect(result.time!.measurements[0]).toEqual(active.time!.measurements[0]);
  expect(result.time!.measurements[1]).toEqual({ startedAt: now - 5400000, finishedAt: now, millis: 5400000, label: '1h 30min', createdAt: now + 1000, reported: false });
  expect(result.time!.totals).toMatchObject({ millis: 5400000, label: '1h 30min', reported: '0s', createdAt: now });
  expect(result.distance).toBe(12);
  expect(JSON.stringify(active)).toBe(before);
});
test('adds a first interval and includes it in reported totals only after reporting', () => {
  const result = BrickTimeService.apply({}, 'add', now, undefined, { startedAt: now - 7200000, finishedAt: now });
  expect(result.time!.measurements).toHaveLength(1);
  expect(result.time!.totals).toMatchObject({ millis: 7200000, label: '2h', reported: '0s' });
  expect(BrickTimeService.apply(result, 'report', now, 0).time!.totals.reported).toBe('2h');
});
test.each([undefined, {}, {startedAt: null, finishedAt: now}, {startedAt: '1000', finishedAt: now},
  {startedAt: now, finishedAt: now}, {startedAt: now, finishedAt: now - 1}, {startedAt: -1, finishedAt: now},
  {startedAt: NaN, finishedAt: now}, {startedAt: now, finishedAt: Infinity}, {startedAt: 1.5, finishedAt: now},
  {startedAt: now, finishedAt: 8640000000000001}])('rejects malformed manual interval %p', interval => {
  expect(() => BrickTimeService.apply({}, 'add', now, undefined, interval as any)).toThrow();
});
