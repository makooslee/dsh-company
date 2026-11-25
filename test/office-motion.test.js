import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as next } from 'node:timers/promises';
import { createGroupService } from '../groups.js';
import { workRoster } from '../quant-roster.js';

const employees=[{id:'a',name:'A',role:'product'},{id:'b',name:'B',role:'qa'},{id:'c',name:'C',role:'engineer'}];
const project=(groups,now=40000, workflows=[])=>Object.fromEntries(workRoster({employees,groupRuns:groups,now,workflows}).employees.map(e=>[e.id,e]));
function deferred(){let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej;});return {promise,resolve,reject};}
async function eventually(predicate){for(let i=0;i<200;i++){if(predicate())return;await next();}assert.fail('timed out');}

test('creation and scheduling are not group participation; only accepted employee turn qualifies',async()=>{
 let t=39000;
 const pending = new Map();
 const persist=async()=>{};
 const service=createGroupService({ownerScope:'owner',getEmployee:id=>employees.find(e=>e.id===id),persist,now:()=>++t,
   runTurn:params=>{const gate=deferred();pending.set(params.employee.id,{...params,gate});return gate.promise;}});
 const room=await service.create({name:'Synthetic collaboration',employeeIds:['a','b']});
 assert.equal(project(service.workStates()).a.motion.kind,'idle');
 await service.send({id:room.id,text:'Fake prompt'});
 await eventually(()=>pending.size===2);
 assert.equal(project(service.workStates()).a.motion.kind,'idle');
 assert.equal(project(service.workStates()).a.active[0].status,'queued');
 pending.get('a').markParticipated();
 const roster=project(service.workStates());
 assert.equal(roster.a.motion.kind,'group'); assert.equal(roster.a.motion.groupId,room.id);
 assert.equal(roster.b.motion.kind,'idle'); assert.equal(roster.c.motion.kind,'idle');
 pending.get('a').gate.resolve('Fixture reply not in roster'); pending.get('b').gate.reject(Error('No reply'));
 await eventually(()=>service.list().groups[0].runStatus==='failed');
 const done=project(service.workStates());
 assert.equal(done.a.motion.kind,'reply');
 assert.equal(done.a.latestReply.eventId,done.a.motion.eventId);
 assert.equal(done.b.latestReply,null);
 assert.equal(done.c.latestReply,null);
 assert.ok(!JSON.stringify(done).includes('Fixture reply not in roster'));
 assert.equal(project(service.workStates(),60000).a.motion.kind,'idle');
 await service.close();
});
test('reply is not projected before a successful checkpoint, and reconstruction keeps attribution',async()=>{
 const hold=deferred();let committed,t=39500;
 const sm=createGroupService({ownerScope:'owner',getEmployee:id=>employees.find(e=>e.id===id),now:()=>++t,
  async persist({record}){if(record.messages.some(m=>m.kind==='reply'))await hold.promise;committed=record;},
  async runTurn({employee,markParticipated}){markParticipated();if(employee.id==='b')throw Error('Synthetic failure');return 'Stored reply';}});
 const group=await sm.create({name:'Persist test',employeeIds:['a','b']});
 await sm.send({id:group.id,text:'Synthetic'});
 await eventually(()=>sm.read({id:group.id}).messages.some(m=>m.kind==='reply'));
 assert.equal(project(sm.workStates()).a.latestReply,null);
 hold.resolve();
 await eventually(()=>sm.list().groups[0].runStatus==='failed');
 const event=project(sm.workStates()).a.latestReply;
 const restored=createGroupService({ownerScope:'owner',getEmployee:id=>employees.find(e=>e.id===id),now:()=>++t,persist:async()=>{},runTurn:async()=>''});
 restored.restore([committed]);
 assert.deepEqual(project(restored.workStates()).a.latestReply,event);
 assert.equal(project(restored.workStates()).b.latestReply,null);
 await restored.close();await sm.close();
});
test('group/current and recent reply stay independently attributed; office priority favors live work',()=>{
 const rooms=[{id:'room1',run:{id:'run1',status:'running',workers:[{employeeId:'a',status:'running',participatedAt:39300}]},replies:[{employeeId:'b',at:39100,eventId:'r1'}]},
 {id:'room2',run:null,replies:[{employeeId:'a',at:39250,eventId:'r2'},{employeeId:'c',at:43000,eventId:'forged-future'}]}];
 const workflows=[{kind:'company-run',lastRun:{status:'running',graph:{nodes:[{id:'n',employeeId:'b'}]},nodeRuns:[{nodeId:'n',status:'running',startedAt:39300}]}}];
 const result=project(rooms,40000,workflows);
 assert.equal(result.a.motion.kind,'group');assert.equal(result.a.motion.groupId,'room1');
 assert.equal(result.a.latestReply.groupId,'room2');
 assert.equal(result.b.motion.kind,'typing');assert.equal(result.b.latestReply.groupId,'room1');
 assert.equal(result.c.motion.kind,'idle');assert.equal(result.c.latestReply,null);
});
