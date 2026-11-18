import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8');
let ui;
const react = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity).filter(x => x != null) }),
  useState: init => [typeof init === 'function' ? init() : init, () => {}],
  useMemo: fn => fn(), useRef: () => ({ current: null }), useEffect: () => {}, useCallback: fn => fn,
};
vm.runInNewContext(source.replace("return { name: 'dsh-company', inject: ['slots', 'locale'], apply };", 'return { ArchitectureView, WorkflowEditor, wfExecutionSignature, useDict, DICT, CSS };'), {
  window: { __ModuleLoader__: { load: mod => { ui = mod.factory(() => react); } } },
});
const walk = (node) => !node || typeof node !== 'object' ? [] : [node, ...node.children.flatMap(walk)];
const t = key => ui.DICT.en[key] || key;
const draft = { id:'wf', name:'Test', nodes:[{id:'s',type:'start',x:30,y:40},{id:'a',type:'employee',employeeId:'e',x:330,y:40}], edges:[{id:'edge',source:'s',target:'a'}] };
function render(status = 'running', from = 'done', to = 'running') {
 return ui.WorkflowEditor({ draft, employees:[], lastRun: {status,graph:draft,nodeRuns:[{nodeId:'s',status:from},{nodeId:'a',status:to}]},t,onPatch(){},onBack(){},onSave(){},onRun(){},onToast(){} });
}
const particles = tree => walk(tree).filter(n => n.props.className === 'dsc-wf-particles');
test('particles follow real upstream and downstream state only during an active run', () => {
 assert.equal(particles(render()).length, 1);
 for (const args of [['done','done','done'],['cancelled','done','running'],['failed','done','running'],['running','pending','running'],['running','done','pending']]) assert.equal(particles(render(...args)).length,0);
});
test('monitor uses actual run counts; keyboard controls expose names', () => {
 const nodes=walk(render());
 assert.equal(nodes.find(n=>n.props.role==='progressbar').props['aria-valuenow'],1);
 assert.equal(nodes.find(n=>n.props.role==='progressbar').props['aria-valuemax'],2);
 const graphNodes=nodes.filter(n=>n.props.className==='dsc-wf-node');
 assert.ok(graphNodes.every(n=>n.props.tabIndex===0 && n.props['aria-label'] && n.props.onKeyDown));
 assert.ok(nodes.find(n=>n.props.className==='dsc-wf-edge-hit').props.onKeyDown);
});
test('all dictionary keys match between Chinese and English', () => {
 assert.deepEqual(Object.keys(ui.DICT.zh).sort(),Object.keys(ui.DICT.en).sort());
 for(const key of Object.keys(ui.DICT.en)) assert.ok(ui.DICT.en[key]);
});
test('architecture counts are supplied data and routes are actionable', () => {
 const visited=[];const tree=ui.ArchitectureView({employees:[{}],missions:[{},{}],workflows:[],t,onNavigate: x=>visited.push(x)});
 const nodes=walk(tree);const counts=nodes.filter(n=>n.props.className==='dsc-arch-kpi').map(n=>n.children[0].children[0]);
 assert.deepEqual(counts,[1,2,0]);
 nodes.filter(n=>n.type==='button').forEach(n=>n.props.onClick());assert.deepEqual(visited,['missions','workflow']);
});
test('reduced motion removes decorative particles and responsive inspector stacks', () => {
 assert.match(ui.CSS,/@media\(prefers-reduced-motion:reduce\).*animation:none;display:none/);
 assert.match(ui.CSS,/@container\(max-width:820px\).*flex-direction:column/);
 assert.ok(ui.CSS.lastIndexOf('.dsc-wf-node-status{position:static')>ui.CSS.indexOf('.dsc-wf-node-status{position:absolute'));
});

test('edited topology or missing historical snapshot cannot display execution particles', () => {
 const base={draft,employees:[],t,onPatch(){},onBack(){},onSave(){},onRun(){},onToast(){}};
 const run={status:'running',graph:draft,nodeRuns:[{nodeId:'s',status:'done'},{nodeId:'a',status:'running'}]};
 const changed={...draft,edges:[]};
 assert.equal(particles(ui.WorkflowEditor({...base,draft:changed,lastRun:run})).length,0);
 assert.equal(particles(ui.WorkflowEditor({...base,lastRun:{...run,graph:null}})).length,0);
 const reassigned={...draft,nodes:draft.nodes.map(n=>n.id==='a'?{...n,employeeId:'other'}:n)};
 assert.equal(particles(ui.WorkflowEditor({...base,draft:reassigned,lastRun:run})).length,0);
});
test('running node text acknowledges employee-lock waiting', () => {
 const nodes=walk(render());
 assert.ok(nodes.some(n=>n.props['aria-label']?.includes('Executing / waiting')));
});
test('execution identity includes workflow and node titles and incoming edge order', () => {
 const graph={name:'Original',nodes:[{id:'s',type:'start'},{id:'a',type:'employee',employeeId:'e',title:'Research'},{id:'b',type:'employee',employeeId:'e'}],edges:[{source:'s',target:'b'},{source:'a',target:'b'}]};
 const signature=ui.wfExecutionSignature(graph);
 assert.notEqual(signature,ui.wfExecutionSignature({...graph,name:'Changed'}));
 assert.notEqual(signature,ui.wfExecutionSignature({...graph,nodes:graph.nodes.map(n=>n.id==='a'?{...n,title:'Changed'}:n)}));
 assert.notEqual(signature,ui.wfExecutionSignature({...graph,edges:[...graph.edges].reverse()}));
 assert.equal(signature,ui.wfExecutionSignature({...graph,nodes:graph.nodes.map(n=>({...n,x:999,y:999}))}));
});

test('plugin owns bilingual rendering without browser translation mutating React text', () => {
 assert.match(source, /className: 'dsc-root', translate: 'no'/);
});

test('host English labels equal to keys do not fall back to browser Chinese', () => {
 const t=ui.useDict(key=>ui.DICT.en[key] || key);
 assert.equal(t('done'),'done'); assert.equal(t('failed'),'failed'); assert.equal(t('skipped'),'skipped');
});

test('node ordering remains part of execution identity for shared employee scheduling', () => {
 const reordered={...draft,nodes:[...draft.nodes].reverse()};
 assert.notEqual(ui.wfExecutionSignature(draft),ui.wfExecutionSignature(reordered));
});
