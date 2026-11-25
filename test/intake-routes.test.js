import test from 'node:test';
import assert from 'node:assert/strict';
import { apply } from '../index.js';
import { setTimeout as wait } from 'node:timers/promises';

function host(tables = {}, verdict = 'PASS', guardAvailable = true, manual = null) {
  const routes = new Map(), commands = new Map(), tools = new Map(), prompts = [], guards = [];
  const storage = { loadAll: async()=>({tables:structuredClone(tables)}), close:async()=>{},
    putRecord: async(table,id,value)=>{ (tables[table] ||= {})[id] = structuredClone(value); },
    deleteRecord:async(table,id)=>{delete tables[table]?.[id];} };
  apply({
    logger:{warn(error){throw new Error(error);}},
    get(name){ if(name==='storage') return {backend:{get:()=>({kv:{open:async()=>storage}})}};
      if(name==='dshHomePath') return (...paths)=>['/tmp/dsh-intake-test-unwritten',...paths].join('/');
      if(name==='commands') return {register: c=>{commands.set(c.name,c);return ()=>{};}}; },
    effect(fn){fn();}, tools:{schemas:()=>[],register(c){tools.set(c.name,c); return ()=>{};}},
    connection:{fetch:{register(route){routes.set(route.path,route);return ()=>{};}}},
    sessions:{},
    agents:{async create(input){
      input.setup({tools:{restrict:()=>{},...(guardAvailable ? {guard:fn=>guards.push(fn)} : {})},systemPrompt:{getSectionOrder:()=>0,section:()=>{}}});
      const events=[];
      return {dispose:async()=>{},agent:{status:'idle',session:{get seq(){return events.length;},snapshotEvents:from=>events.slice(from)},
        followup(message){
          const payload=JSON.stringify(message);
          prompts.push(payload);
          const answer=payload.includes('First line must be exactly VERDICT') ? (`VERDICT: ${verdict}\nQA evidence checked`) : 'Fixture evidence';
          const settle=(reply=answer)=>events.push({type:'assistant/message',data:{message:{content:[{type:'text',text:reply}]}}},{type:'turn/end',data:{reason:{kind:'completed'}}});
          if(manual) manual.push({payload,settle}); else settle();
        },cancel(){}}};
    }},
  },{workTimeoutMs:500});
  return {tables,prompts,guards, async post(route,body={}){
    const r=await routes.get('/api/dsh-company/'+route).fetch({json:async()=>body});
    return await r.json();
  }};
}
const briefing={brief:'Prepare a synthetic user guide',outcome:'Guide ready',boundaries:'No production edits',checks:'A: cite the fixture'};
const auth=(p, optionId='lean')=>({id:p.id,revision:p.revision,optionId});
async function get(h, route, body={}) {const r=await h.post(route, body);assert.equal(r.ok,true,JSON.stringify(r));return r.value;}
async function until(h, predicate) {
  for(let i=0;i<100;i++) {const state=await get(h,'state');const item=predicate(state);if(item)return item;await wait(10);}
  assert.fail('fixture timed out');
}
test('default plan is deterministic and does not invoke agents before explicit approve and run',async()=>{
  const h=host(), p=await get(h,'company-plan-create',briefing);
  assert.equal(p.status,'awaiting_approval');
  assert.deepEqual(p.options.map(o=>o.id),['lean']);
  assert.equal(p.intake.boundaries,briefing.boundaries);
  assert.equal(p.intake.checks,briefing.checks);
  assert.equal((await h.post('company-plan-approve',auth(p,'evidence'))).ok,false);
  assert.equal((await h.post('company-plan-run',auth(p))).ok,false);
  assert.equal(h.prompts.length,0);
  const results=await Promise.all([h.post('company-plan-approve',auth(p)),h.post('company-plan-approve',auth(p))]);
  assert.equal(results.filter(r=>r.ok).length,1);
  assert.equal(h.prompts.length,0);
  const started=await Promise.all([h.post('company-plan-run',auth(p)),h.post('company-plan-run',auth(p))]);
  assert.equal(started.filter(r=>r.ok).length,1);
  const completed=await until(h,s=>s.companyPlans.find(i=>i.id===p.id&&i.status==='completed'));
  assert.equal(h.prompts.length,5); assert.equal(h.guards.length,5);
  assert.ok(h.guards.every(fn=>fn().includes('text-only')));
  assert.ok(h.prompts.every(input=>input.includes(briefing.boundaries)&&input.includes(briefing.checks)));
  assert.equal((await h.post('workflow-run',{id:completed.workflowId,input:'bypass'})).ok,false);
  assert.equal((await h.post('company-plan-run',auth(p))).ok,false);
});
test('reject and same-content reproposal invalidate every older revision',async()=>{
  const h=host(), p=await get(h,'company-plan-create',{...briefing,showTradeoff:true});
  assert.deepEqual(p.options.map(o=>o.id),['lean','evidence']);
  await get(h,'company-plan-approve',auth(p,'evidence'));
  assert.equal((await get(h,'company-plan-reject',auth(p))).status,'rejected');
  assert.equal((await h.post('company-plan-run',auth(p,'evidence'))).ok,false);
  const newer=await get(h,'company-plan-revise',{...auth(p),...briefing,showTradeoff:true});
  assert.notEqual(newer.revision,p.revision);
  assert.equal((await h.post('company-plan-approve',auth(p,'evidence'))).ok,false);
  assert.equal((await h.post('company-plan-run',auth(newer,'evidence'))).ok,false);
  const h2=host(h.tables);
  assert.equal((await get(h2,'state')).companyPlans[0].revision,newer.revision);
  assert.equal(h2.prompts.length,0);
});
test('deliberate fixed workflow runs independently with fresh input',async()=>{
 const h=host();
 const {employees}=await get(h,'state');
 const p=await get(h,'company-plan-create',briefing);
 const w=await get(h,'workflow-save',{name:'Synthetic fixed',nodes:[{id:'start',type:'start',title:'Start'},{id:'work',type:'employee',title:'Work',employeeId:employees[0].id,instruction:'{{input}}'}],edges:[{source:'start',target:'work'}]});
 await get(h,'workflow-run',{id:w.id,input:'Fresh fixed input'});
 await until(h,s=>s.workflows.find(i=>i.id===w.id&&i.lastRun?.status==='done'));
 assert.equal(h.prompts.length,1); assert.match(h.prompts[0],/Fresh fixed input/);
 assert.equal((await get(h,'state')).companyPlans.find(i=>i.id===p.id).status,'awaiting_approval');
});

test('a delayed duplicate cannot retry failure; retry is tied to the observed attempt',async()=>{
 const h=host({},'FAIL'), p=await get(h,'company-plan-create',briefing);
 await get(h,'company-plan-approve',auth(p));
 await get(h,'company-plan-run',auth(p));
 const failed=await until(h,s=>s.companyPlans.find(i=>i.id===p.id&&i.status==='failed'));
 assert.equal((await h.post('company-plan-run',auth(p))).ok,false);
 assert.equal((await h.post('company-plan-run',{...auth(p),retryRunId:'older'})).ok,false);
 assert.equal(h.prompts.length,5);
 const again=await get(h,'company-plan-run',{...auth(p),retryRunId:failed.runId});
 assert.notEqual(again.runId,failed.runId);
 await until(h,s=>s.companyPlans.find(i=>i.runId===again.runId&&i.status==='failed'));
 assert.equal((await h.post('company-plan-run',{...auth(p),retryRunId:failed.runId})).ok,false);
 assert.equal(h.prompts.length,10);
});

test('unsupported host guard never falls back to an unguarded intake turn',async()=>{
 const h=host({},'PASS',false), p=await get(h,'company-plan-create',briefing);
 await get(h,'company-plan-approve',auth(p));
 await get(h,'company-plan-run',auth(p));
 await until(h,s=>s.companyPlans.find(i=>i.id===p.id&&i.status==='failed'));
 assert.equal(h.prompts.length,0);
});
test('editing an already approved proposal clears approval; no execution of edited scope',async()=>{
 const h=host(), p=await get(h,'company-plan-create',briefing);
 await get(h,'company-plan-approve',auth(p));
 const revised=await get(h,'company-plan-revise',{...auth(p),...briefing,checks:'B: new criterion'});
 assert.equal(revised.status,'awaiting_approval');
 assert.notEqual(revised.revision,p.revision);
 assert.equal((await h.post('company-plan-run',auth(p))).ok,false);
 assert.equal((await h.post('company-plan-run',auth(revised))).ok,false);
 assert.equal(h.prompts.length,0);
});

test('specialized plan launches three independent workers before any release and joins their exact results',async()=>{
 const pending=[],h=host({},'PASS',true,pending);
 const p=await get(h,'company-plan-create',{...briefing,parallelSpecialists:true});
 const option=p.options[0];
 assert.equal(option.id,'specialized');
 assert.deepEqual(option.steps.map(s=>s.wave),[1,1,1,2,3,4]);
 assert.equal(new Set(option.steps.map(s=>s.employeeId)).size,6);
 assert.deepEqual(option.steps[3].dependsOn,['requirements','technical','evidence']);
 assert.deepEqual(option.steps[5].dependsOn,['implementation','test']);
 assert.equal((await h.post('company-plan-run',auth(p,'specialized'))).ok,false);
 await get(h,'company-plan-approve',auth(p,'specialized'));
 assert.equal(h.prompts.length,0);
 await get(h,'company-plan-run',auth(p,'specialized'));
 await until(h,()=>pending.length===3);
 assert.ok(pending.every(x=>x.payload.includes(briefing.boundaries)));
 assert.equal(pending.filter(x=>x.payload.includes('Independently')&&x.payload.includes('BLOCKED:')).length,3);
 pending[0].settle('RESULT_REQUIREMENTS');pending[1].settle('RESULT_TECH');
 await wait(65);assert.equal(pending.length,3);
 pending[2].settle('RESULT_EVIDENCE');
 await until(h,()=>pending.length===4);
 assert.ok(['RESULT_REQUIREMENTS','RESULT_TECH','RESULT_EVIDENCE'].every(s=>pending[3].payload.includes(s)));
 pending[3].settle('RESULT_DELIVERY');
 await until(h,()=>pending.length===5);
 assert.ok(pending[4].payload.includes('RESULT_DELIVERY'));
 pending[4].settle('RESULT_QA');
 await until(h,()=>pending.length===6);
 assert.ok(pending[5].payload.includes('RESULT_DELIVERY')&&pending[5].payload.includes('RESULT_QA'));
 pending[5].settle();
 await until(h,s=>s.companyPlans.find(x=>x.id===p.id&&x.status==='completed'));
 const template=await get(h,'company-plan-promote',{id:p.id});
 assert.equal(template.kind,'company-template');
 assert.ok(Object.values(h.tables).some(table=>table[template.id]?.specialized===true));
 assert.equal((await h.post('workflow-run',{id:template.id,input:''})).ok,false);
 await get(h,'workflow-run',{id:template.id,input:'NEW_TEMPLATE_INPUT'});
 await until(h,()=>pending.length===9);
 assert.ok(pending.slice(6).every(x=>x.payload.includes('NEW_TEMPLATE_INPUT')&&!x.payload.includes(briefing.brief)));
 pending[6].settle('BLOCKED: unavailable');pending[7].settle('Fixture');pending[8].settle('Fixture');
 await until(h,s=>s.workflows.find(x=>x.id===template.id&&x.lastRun?.status==='failed'));
 assert.equal(pending.length,9);
});
test('specialized failure stops join; independent other branches still settle',async()=>{
 const pending=[],h=host({},'PASS',true,pending);
 const p=await get(h,'company-plan-create',{...briefing,parallelSpecialists:true});
 await get(h,'company-plan-approve',auth(p,'specialized'));await get(h,'company-plan-run',auth(p,'specialized'));
 await until(h,()=>pending.length===3);
 pending[0].settle('BLOCKED: owner decision needed'); pending[1].settle('Second branch');pending[2].settle('Third branch');
 const failed=await until(h,s=>s.companyPlans.find(x=>x.id===p.id&&x.status==='failed'));
 const s=await get(h,'state');
 assert.equal(h.prompts.length,3);
 const run=s.workflows.find(x=>x.id===failed.workflowId).lastRun;
 assert.deepEqual(run.nodeRuns.filter(n=>n.status==='skipped').map(n=>n.nodeId),['implementation','test','review']);
});
test('specialized lookup refuses missing dedicated employee or stale assignment',async()=>{
 const h=host();
 const state=await get(h,'state'), analyst=state.employees.find(e=>e.role==='analyst');
 const p=await get(h,'company-plan-create',{...briefing,parallelSpecialists:true});
 await get(h,'fire',{id:analyst.id});
 assert.match((await h.post('company-plan-create',{...briefing,parallelSpecialists:true})).error.message,/Missing active specialist: analyst/);
 assert.equal((await h.post('company-plan-approve',auth(p,'specialized'))).ok,false);
 assert.equal(h.prompts.length,0);
});
