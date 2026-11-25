import test from 'node:test';
import assert from 'node:assert/strict';
import {selectEntry,compileWorkflow,buildCompanyDraft,reviseCompanyDraft,approveCompanyDraft,assertCompanyApproval} from '../dual-entry.js';
const employees=['product','techlead','engineer','qa','reviewer'].map(role=>({role,id:`e-${role}`}));
const base={projectId:'demo-project',brief:'Create a report from verified public documents',employees};
const draft=()=>buildCompanyDraft(base);
const approvalFor=(plan,optionId='evidence')=>approveCompanyDraft(plan,{fingerprint:plan.fingerprint,optionId,projectId:plan.projectId,actorId:'local-owner'},()=>42);
const wf=d=>structuredClone(d.options[1].graph);
test('entry discriminant rejects missing, combined or invented entry',()=>{
  for (const value of [null,{}, {entry:['company','workflow']},{entry:'both'},{entry:'auto'}]) assert.throws(()=>selectEntry(value),/exactly one/);
  assert.equal(selectEntry({entry:'company'}),'company');
  assert.equal(selectEntry({entry:'workflow'}),'workflow');
});
test('draft selects deterministic active role holders and no implicit approval',()=>{
  const candidate={id:'aaa',role:'product'};
  const result=buildCompanyDraft({...base,employees:[...employees,{...candidate,id:'aa',fired:true},candidate]});
  assert.equal(result.options[0].assignments.requirements,'aaa');
  assert.ok(!('approval' in result));
  assert.throws(()=>buildCompanyDraft({...base,employees:employees.filter(e=>e.role!=='qa')}),/Missing active employee/);
});
test('two genuine graph variants, evidence splits work and both have independent review',()=>{
  const result=draft();
  const edge=(option,s,t)=>option.graph.edges.some(e=>e.source===s&&e.target===t);
  assert.equal(result.options[0].id,'lean');
  assert.ok(edge(result.options[0],'requirements','technical'));
  assert.ok(edge(result.options[1],'start','technical'));
  assert.ok(edge(result.options[1],'requirements','implementation'));
  assert.ok(edge(result.options[1],'technical','implementation'));
  for(const option of result.options) {
    assert.notEqual(option.assignments.implementation,option.assignments.test);
    assert.notEqual(option.assignments.test,option.assignments.review);
    assert.ok(edge(option,'implementation','review'));
    assert.ok(edge(option,'test','review'));
    assert.deepEqual(option.graph.edges.filter(e=>e.target==='review').map(e=>e.source),['implementation','test']);
    assert.ok(!option.graph.edges.some(e=>e.source==='review'));
    assert.match(option.graph.nodes.find(n=>n.id==='review').instruction,/exactly VERDICT: PASS or VERDICT: FAIL/);
  }
});
test('revision and option are exact; approval does not authorize a different project',()=>{
  const result=draft(), approved=approvalFor(result);
  assert.equal(approved.approvedAt,42);
  assert.equal(assertCompanyApproval(result,approved,base).id,'evidence');
  assert.throws(()=>assertCompanyApproval(result,approved,{projectId:'different'}),/matching project/);
  assert.throws(()=>assertCompanyApproval(result,null,base),/approval/);
  assert.throws(()=>approveCompanyDraft(result,{...approved,optionId:'workflow'}),/exactly one/);
  assert.throws(()=>approveCompanyDraft(result,{...approved,fingerprint:'old'}),/exact current/);
});
test('revising outcome, risk, or brief invalidates previous approval',()=>{
  const plan=draft();
  for(const changes of [{outcome:'Changed acceptance criteria'},{brief:'Different request'},{risks:['Different material risk']}]) {
    const revised=reviseCompanyDraft(plan,changes);
    assert.notEqual(revised.fingerprint,plan.fingerprint);
    assert.throws(()=>assertCompanyApproval(revised,approvalFor(plan),base),/exact plan/);
  }
  assert.throws(()=>reviseCompanyDraft(plan,{projectId:'other'}),/project/);
});
test('edited option text invalidates approval, reviewer binding and terminal condition cannot be weakened',()=>{
  const plan=draft();
  const options=structuredClone(plan.options);
  options[1].summary='Changed summary before approval';
  assert.notEqual(reviseCompanyDraft(plan,{options}).fingerprint,plan.fingerprint);
  options[1].graph.nodes.find(n=>n.id==='review').instruction='Trust implementation';
  assert.throws(()=>reviseCompanyDraft(plan,{options}),/explicit verdict/);
  options[1].assignments.review='other-worker';
  assert.throws(()=>reviseCompanyDraft(plan,{options}),/bindings/);
});
test('tampered plan cannot reuse old stored fingerprint; returned approval and graph are immutable',()=>{
  const result=draft(), approved=approvalFor(result);
  assert.throws(()=>{result.options[0].graph.nodes[0].type='worker';},TypeError);
  assert.throws(()=>{approved.optionId='lean';},TypeError);
  const tampered={...result,brief:'tampered'};
  assert.throws(()=>assertCompanyApproval(tampered,approved,base),/stale or invalid/);
});
test('fixed workflow validates known employee IDs, strips accidental credential/cwd fields',()=>{
  const source=wf(draft());
  source.nodes[1].shell='not copied';
  source.cwd='/ignored';
  const current=compileWorkflow(source,{employees});
  assert.ok(!('cwd' in current));
  assert.ok(!('shell' in current.nodes[1]));
  const invalid=employees.map(e=>e.role==='product'?{...e,fired:true}:e);
  assert.throws(()=>compileWorkflow(source,{employees:invalid}),/outside the project roster/);
});
test('fixed workflow rejects duplicate edges, no start, unreachable nodes, and cycles',()=>{
  const check=(mutate,expected)=>{const source=wf(draft()); mutate(source); assert.throws(()=>compileWorkflow(source),expected);};
  check(s=>s.edges.push({...s.edges[0]}),/Duplicate workflow edge/);
  check(s=>s.nodes.shift(),/exactly one start/);
  check(s=>{s.edges=s.edges.filter(e=>e.target!=='review');},/unreachable/);
  check(s=>s.edges.push({source:'review',target:'technical'}),/cycle/);
});
test('fixed workflow preserves meaningful fan-in order and is isolated from future template mutations',()=>{
  const source=wf(draft());
  const before=compileWorkflow(source);
  const inputOrder=before.edges.filter(edge=>edge.target==='implementation').map(e=>e.source);
  assert.deepEqual(inputOrder,['requirements','technical']);
  [source.edges[2],source.edges[3]]=[source.edges[3],source.edges[2]];
  assert.notEqual(compileWorkflow(source).fingerprint,before.fingerprint);
  assert.deepEqual(before.edges.filter(edge=>edge.target==='implementation').map(e=>e.source),inputOrder);
});

test('bilingual display fields are bound to approval without changing executable graph',()=>{
  const plan=draft(), prior=approvalFor(plan);
  assert.equal(plan.options[1].titleEn,'Evidence-first plan');
  assert.deepEqual(plan.options[1].assignmentLabels.test,{zh:'独立验证',en:'Independent QA'});
  const options=structuredClone(plan.options);
  options[1].titleEn='Revised display title';
  options[1].assignmentLabels.test.en='QA verification';
  const current=reviseCompanyDraft(plan,{options});
  assert.deepEqual(current.options[1].graph,plan.options[1].graph);
  assert.notEqual(current.fingerprint,plan.fingerprint);
  assert.throws(()=>assertCompanyApproval(current,prior,base),/exact plan/);
});
