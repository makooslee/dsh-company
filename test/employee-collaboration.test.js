import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGroupService} from '../groups.js';

test('employee group lookup is stable-ID scoped, separates membership from accepted turns and saved replies',async()=>{
  const people=new Map(['first','second','other'].map(id=>[id,{id,name:'Same name'}]));
  const records=new Map(), pending=new Map();let now=1;
  const create=scope=>createGroupService({ownerScope:scope,getEmployee:id=>people.get(id),now:()=>++now,
    persist:async({id,record})=>{records.set(id,record);},runTurn:async ({employee,markParticipated})=>{
      return new Promise(resolve=>pending.set(employee.id,{resolve,markParticipated}));
    }});
  const roomA=create('scope-A'),roomB=create('scope-B');
  const group=await roomA.create({name:'Room A',employeeIds:['first','other']});
  await roomB.create({name:'Room B',employeeIds:['first','second']});
  const row=()=>roomA.employeeGroups({employeeId:'first'}).groups[0];
  assert.equal(row().latestRound,null);
  assert.equal(row().lastReplyAt,0);
  assert.deepEqual(roomA.employeeGroups({employeeId:'second'}).groups,[]);
  assert.throws(()=>roomA.employeeGroups({employeeId:'Same name'}),/not found/);
  await roomA.send({id:group.id,text:'fixture'});
  assert.equal(row().latestRound.status,'queued');
  pending.get('first').markParticipated();
  assert.equal(row().latestRound.status,'running');
  pending.get('first').resolve('first fixture reply');
  for(let i=0;i<30&&!row().lastReplyAt;i++) await new Promise(resolve=>setImmediate(resolve));
  assert.equal(row().latestRound.status,'done');
  assert.ok(row().lastReplyAt>0);
  assert.ok(!JSON.stringify(row()).includes('first fixture reply'));
  pending.get('other').resolve('other fixture reply');
  await roomA.close();
  const restart=create('scope-A'); restart.restore([...records.values()]);
  const visible=restart.employeeGroups({employeeId:'first'}).groups;
  assert.deepEqual(visible.map(item=>item.id),[group.id]);
  assert.ok(visible[0].lastReplyAt>0);
  assert.deepEqual(restart.employeeGroups({employeeId:'second'}).groups,[]);
  await restart.close(); await roomB.close();
});
