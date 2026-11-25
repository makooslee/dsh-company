import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../client.js',import.meta.url),'utf8');
function harness(props={}) {
 let ui,cursor=0;const hooks=[],calls=[];
 const react={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(x=>x!=null)}),
 useState(init){const i=cursor++;if(!(i in hooks))hooks[i]=typeof init==='function'?init():init;return [hooks[i],value=>{hooks[i]=typeof value==='function'?value(hooks[i]):value;}];},
 useRef(init){const i=cursor++;return hooks[i]||(hooks[i]={current:init});},useMemo:fn=>fn(),useEffect(){},useCallback:fn=>fn};
 vm.runInNewContext(source.replace("return { name: 'dsh-company', inject: ['slots', 'locale'], apply };",'return {CompanyWorkspace,WorkflowCard,companyChoiceMatches,DICT};'),{
 window:{__ModuleLoader__:{load:mod=>ui=mod.factory(()=>react)}}});
 let current={plans:[],workflows:[],t:key=>ui.DICT.en[key]||key,request:async(op,payload)=>{calls.push({op,payload});return {id:'p'};},refresh:async()=>{},onOpenFixed(){},...props};
 return {calls,renderCard(props){cursor=0;return ui.WorkflowCard({...current,...props});},render(patch={}){current={...current,...patch};cursor=0;return ui.CompanyWorkspace(current);},ui};
}
const walk=n=>!n||typeof n!=='object'?[]:[n,...n.children.flatMap(walk)];
const button=(tree,text)=>walk(tree).find(n=>n.type==='button'&&n.children.includes(text));
const plan={id:'p',brief:'Test task',revision:1,status:'awaiting_approval',options:[{id:'a',title:'Safe',summary:'Text only',risk:'Review',feasibility:'Needs employees'}]};
test('proposal creation does not approve or execute; explicit selection binds exact revision',async()=>{
 const app=harness({plans:[plan]});let tree=app.render();
 assert.equal(button(tree,'Approve selected option and revision').props.disabled,true);
 walk(tree).find(n=>n.type==='input'&&n.props.type==='radio').props.onChange();tree=app.render();
 await button(tree,'Approve selected option and revision').props.onClick();
 assert.equal(app.calls.length,1);assert.equal(app.calls[0].op,'company-plan-approve');
 assert.equal(JSON.stringify(app.calls[0].payload),JSON.stringify({id:'p',revision:1,optionId:'a'}));
 tree=app.render({plans:[{...plan,revision:2}]});
 assert.equal(button(tree,'Approve selected option and revision').props.disabled,true);
 await button(tree,'Approve selected option and revision').props.onClick();assert.equal(app.calls.length,1);
});
test('create sends brief only and never runs implicitly',async()=>{
 const app=harness();let tree=app.render();walk(tree).find(n=>n.type==='textarea').props.onChange({target:{value:'  Draft a report  '}});tree=app.render();
 await button(tree,'Create proposal for review').props.onClick();assert.equal(app.calls.length,1);
 assert.equal(app.calls[0].op,'company-plan-create');assert.equal(app.calls[0].payload.brief,'Draft a report');
});
test('approved proposal requires separate run and blocks double submission',async()=>{
 let resolve;const calls=[];const app=harness({plans:[{...plan,status:'approved',optionId:'a'}],request:(op,payload)=>{calls.push({op,payload});return new Promise(r=>resolve=r);}});
 const tree=app.render();assert.equal(calls.length,0);assert.equal(button(tree,'Approve selected option and revision'),undefined);
 const run=button(tree,'Start approved run');const first=run.props.onClick();await run.props.onClick();assert.equal(calls.length,1);
 assert.equal(calls[0].op,'company-plan-run');resolve({});await first;
});
test('failed proposal cannot run or promote; stale foreign run is not shown',()=>{
 const app=harness({plans:[{...plan,status:'failed',workflowId:'w',runId:'mine',error:'Verification failed'}],workflows:[{id:'w',lastRun:{id:'other',status:'done',nodeRuns:[{nodeId:'n',output:'wrong result',status:'done'}]}}]});
 const tree=app.render();assert.equal(button(tree,'Start approved run'),undefined);assert.equal(button(tree,'Save successful plan as fixed flow'),undefined);
 assert.ok(walk(tree).some(n=>n.props.role==='alert'&&n.children.includes('Verification failed')));
 assert.ok(!walk(tree).some(n=>n.children.includes('wrong result')));
});
test('run monitor preserves skipped/failed states and completed promotion is explicit',async()=>{
 let opened=0;const app=harness({plans:[{...plan,status:'completed',workflowId:'w',runId:'r'}],workflows:[{id:'w',lastRun:{id:'r',status:'done',nodeRuns:[{nodeId:'a',status:'done',output:'<script>not HTML</script>'},{nodeId:'b',status:'skipped'}]}}],onOpenFixed:()=>opened++});
 const tree=app.render();assert.equal(app.calls.length,0);assert.equal(walk(tree).find(n=>n.type==='progress').props.value,2);
 assert.ok(walk(tree).some(n=>n.type==='pre'&&n.children.includes('<script>not HTML</script>')));
 await button(tree,'Save successful plan as fixed flow').props.onClick();assert.equal(app.calls[0].op,'company-plan-promote');assert.equal(opened,1);
});
test('unsupported host disables proposal creation and explains requirement',()=>{
 const app=harness({plans:undefined});const tree=app.render();assert.equal(button(tree,'Create proposal for review').props.disabled,true);
 assert.ok(walk(tree).some(n=>n.children.includes(app.ui.DICT.en.companyUnavailable)));
});

test('switching plans resets explicit selection, even when options share IDs',()=>{
 const other={...plan,id:'other'};const app=harness({plans:[plan,other]});let tree=app.render();
 walk(tree).find(n=>n.type==='input'&&n.props.type==='radio').props.onChange();tree=app.render();
 assert.equal(button(tree,'Approve selected option and revision').props.disabled,false);
 walk(tree).find(n=>n.type==='select').props.onChange({target:{value:'other'}});tree=app.render();
 assert.equal(button(tree,'Approve selected option and revision').props.disabled,true);
});
test('request errors remain visible and busy lock releases for an explicit retry',async()=>{
 const app=harness({plans:[{...plan,status:'approved',optionId:'a'}],request:async()=>{throw Error('Revision changed');}});
 await button(app.render(),'Start approved run').props.onClick();const tree=app.render();
 assert.ok(walk(tree).some(n=>n.props.role==='alert'&&n.children.includes('Revision changed')));
 assert.equal(button(tree,'Start approved run').props.disabled,false);
});

test('optional outcome is bounded, sent on create and shown with risks before approval',async()=>{
 const app=harness({plans:[{...plan,outcome:'Pass 3 tests',risks:['No production writes']}]});let tree=app.render();
 const outcome=walk(tree).find(n=>n.props.id==='dsc-company-outcome');assert.equal(outcome.props.maxLength,1200);
 outcome.props.onChange({target:{value:'  Pass 3 tests  '}});walk(tree).find(n=>n.props.id==='dsc-company-brief').props.onChange({target:{value:'Build'}});tree=app.render();
 await button(tree,'Create proposal for review').props.onClick();assert.equal(app.calls[0].payload.outcome,'Pass 3 tests');
 assert.ok(walk(tree).some(n=>n.children.includes('Pass 3 tests')));assert.ok(walk(tree).some(n=>n.children.includes('No production writes')));
});
test('failed and cancelled retries explicitly submit the same approved revision and option',async()=>{
 for(const status of ['failed','cancelled']) {
  const app=harness({plans:[{...plan,status,optionId:'a'}]});const tree=app.render();
  assert.equal(app.calls.length,0);await button(tree,'Retry the same approved plan').props.onClick();
  assert.equal(app.calls[0].op,'company-plan-run');assert.equal(JSON.stringify(app.calls[0].payload),JSON.stringify({id:'p',revision:1,optionId:'a'}));
  assert.equal(button(tree,'Save successful plan as fixed flow'),undefined);
 }
});
test('English option fields and localized assignment labels are rendered with plain text',()=>{
 const app=harness({plans:[{...plan,options:[{...plan.options[0],title:'精简',titleEn:'Lean option',summaryEn:'English summary',riskEn:'English risk',feasibilityEn:'English feasibility',assignments:{test:'qa1'},assignmentLabels:{test:{zh:'独立验证',en:'Independent testing'}}}]}],employees:[{id:'qa1',name:'QA'}]});
 const nodes=walk(app.render());assert.ok(nodes.some(n=>n.props['aria-label']==='Select option: Lean option'));assert.ok(nodes.some(n=>n.children.includes('Independent testing: QA')));assert.ok(nodes.some(n=>n.children.includes('English summary')));
});

test('room uses three explicit regions and people precede conversations',()=>{
 const app=harness({plans:[plan],employees:[{id:'e',name:'Engineer',role:'engineer'}]});const nodes=walk(app.render());
 assert.ok(nodes.find(n=>n.props.className==='dsc-room-sidebar'));assert.ok(nodes.find(n=>n.props.className==='dsc-room-main'));assert.ok(nodes.find(n=>n.props.className==='dsc-room-review'));
 assert.ok(nodes.findIndex(n=>n.type==='h3'&&n.children.includes('People')) < nodes.findIndex(n=>n.type==='h3'&&n.children.includes('Task conversations')));
 assert.equal(nodes.filter(n=>n.props.className==='dsc-room-message').length,0);
 assert.ok(nodes.some(n=>n.children.includes('These are task inputs and engine node records, not live employee chat.')));
});
test('room log comes only from matching engine records and resolves real assignees',()=>{
 const approved={...plan,optionId:'a',status:'running',workflowId:'w',runId:'r',options:[{...plan.options[0],assignments:{test:'qa'},assignmentLabels:{test:{en:'Independent test',zh:'独立验证'}}}]};
 const app=harness({plans:[approved],employees:[{id:'qa',name:'QA person'}],workflows:[{id:'w',lastRun:{id:'r',status:'running',nodeRuns:[{nodeId:'test',status:'done',output:'Real run evidence'}]}}]});
 const nodes=walk(app.render());const messages=nodes.filter(n=>n.props.className==='dsc-room-message');assert.equal(messages.length,1);
 assert.ok(walk(messages[0]).some(n=>n.children.includes('QA person')));assert.ok(walk(messages[0]).some(n=>n.children.includes('Real run evidence')));
});
test('header statistics count company plans, not legacy mission completions',()=>{
 assert.match(source,/companyPlans \|\| \[\]\)\.filter\(plan => plan.status === 'completed'\)/);
 assert.doesNotMatch(source,/const done = missions.filter/);
});

test('recommended lean is selected but not approved or started automatically',async()=>{
 const app=harness({plans:[{...plan,options:[{...plan.options[0],id:'lean'}]}]});const tree=app.render();assert.equal(app.calls.length,0);
 assert.equal(walk(tree).find(n=>n.type==='input'&&n.props.type==='radio').props.checked,true);
 await button(tree,'Approve selected option and revision').props.onClick();assert.equal(app.calls.length,1);assert.equal(app.calls[0].payload.optionId,'lean');assert.equal(app.calls[0].op,'company-plan-approve');
});
test('template runs directly with fresh input and blocks repeated clicks',async()=>{
 let release;const calls=[];const app=harness();const props={workflow:{id:'fixed',name:'Template',nodes:[],edges:[]},onRun:(...args)=>{calls.push(args);return new Promise(resolve=>release=resolve);}};
 let tree=app.renderCard(props);assert.equal(button(tree,'Run template').props.disabled,true);
 walk(tree).find(n=>n.type==='textarea').props.onChange({target:{value:' fresh task '}});tree=app.renderCard(props);
 const pending=button(tree,'Run template').props.onClick();await button(tree,'Run template').props.onClick();assert.deepEqual(calls,[['fixed','fresh task']]);release();await pending;
});
test('dedicated company workflow cannot be run through template card',async()=>{
 const app=harness();let calls=0;let tree=app.renderCard({workflow:{id:'w',kind:'company-run'},onRun:()=>calls++});walk(tree).find(n=>n.type==='textarea').props.onChange({target:{value:'test'}});tree=app.renderCard({workflow:{id:'w',kind:'company-run'},onRun:()=>calls++});await button(tree,'Run template').props.onClick();assert.equal(calls,0);
});
