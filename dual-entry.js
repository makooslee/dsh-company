import { createHash } from 'node:crypto';

const MAX_NODES = 24;
const MAX_EDGES = 120;
const ID = /^[A-Za-z0-9_-]{1,100}$/;
const ensure = (value, message) => { if (!value) throw new Error(message); };
const id = (value, label) => {
  ensure(typeof value === 'string' && ID.test(value), `Invalid ${label}`);
  return value;
};
function text(value, label, max, optional = false) {
  if (optional && (value == null || value === '')) return '';
  ensure(typeof value === 'string' && value.trim() && value.length <= max, `Invalid ${label}`);
  return value;
}
const freeze = value => Array.isArray(value)
  ? Object.freeze(value.map(freeze))
  : value && typeof value === 'object'
    ? Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, freeze(item)])))
    : value;
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const compareIds = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

export function selectEntry(input) {
  ensure(input && (input.entry === 'company' || input.entry === 'workflow'), 'Choose exactly one explicit entry');
  return input.entry;
}

export function compileWorkflow(template, {employees} = {}) {
  ensure(template && Array.isArray(template.nodes) && template.nodes.length >= 2 && template.nodes.length <= MAX_NODES, 'Invalid workflow nodes');
  ensure(Array.isArray(template.edges) && template.edges.length <= MAX_EDGES, 'Invalid workflow edges');
  const eligible = employees ? new Set(employees.filter(e=>e && !e.fired).map(e=>e.id)) : null;
  const nodes = template.nodes.map(raw => {
    ensure(raw && ['start', 'employee'].includes(raw.type), 'Unsupported workflow node type');
    const node = {id:id(raw.id,'node ID'),type:raw.type,title:text(raw.title,'node title',100,true),
      x:Number.isFinite(raw.x) ? raw.x : 0,y:Number.isFinite(raw.y) ? raw.y : 0};
    if (raw.type === 'employee') {
      node.employeeId = id(raw.employeeId,'employee ID');
      ensure(!eligible || eligible.has(node.employeeId),'Workflow employee is unavailable or outside the project roster');
      node.instruction = text(raw.instruction,'employee instruction',2800,true);
    }
    return node;
  });
  const ids = new Set(nodes.map(n=>n.id));
  ensure(ids.size === nodes.length, 'Duplicate workflow node');
  const starts = nodes.filter(n=>n.type==='start');
  ensure(starts.length===1,'Workflow needs exactly one start');
  const start = starts[0].id;
  const inbound = new Map(nodes.map(n=>[n.id,0])), outgoing = new Map(nodes.map(n=>[n.id,[]]));
  const pairs=new Set(), edgeIds=new Set();
  const edges = template.edges.map((edge,index)=>{
    ensure(edge && ids.has(edge.source) && ids.has(edge.target) && edge.source!==edge.target && edge.target!==start,'Invalid workflow edge');
    const pair=edge.source+'→'+edge.target;
    ensure(!pairs.has(pair),'Duplicate workflow edge');
    pairs.add(pair);
    const edgeId=id(edge.id ?? `e${index}`,'edge ID');
    ensure(!edgeIds.has(edgeId),'Duplicate workflow edge ID');
    edgeIds.add(edgeId);
    inbound.set(edge.target,inbound.get(edge.target)+1);
    outgoing.get(edge.source).push(edge.target);
    return {id:edgeId,source:edge.source,target:edge.target};
  });
  const reachable=new Set([start]), queue=[start];
  for(const source of queue) for(const target of outgoing.get(source)) if(!reachable.has(target)){reachable.add(target);queue.push(target);}
  ensure(reachable.size===nodes.length,'Workflow contains unreachable nodes');
  let ready=[start], visited=0;
  while(ready.length){
    const next=[];
    for(const source of ready){
      visited++;
      for(const target of outgoing.get(source)){
        inbound.set(target,inbound.get(target)-1);
        if(inbound.get(target)===0) next.push(target);
      }
    }
    ready=next;
  }
  ensure(visited===nodes.length,'Workflow contains a dependency cycle');
  // Preserve edge order: the legacy engine's fan-in concatenation uses it.
  const graph = {name:text(template.name,'workflow name',80),description:text(template.description,'workflow description',500,true),nodes,edges};
  if(template.id != null) graph.id=id(template.id,'workflow ID');
  return freeze({...graph,fingerprint:digest(graph)});
}

const stages = [['requirements','product','需求与验收','Requirements and acceptance'],['technical','techlead','技术选型','Technical selection'],['implementation','engineer','实现','Implementation'],['test','qa','独立验证','Independent QA'],['review','reviewer','最终审核','Independent review']];
const stageIds = stages.map(row=>row[0]);
const specialistStages = [...stages.slice(0,2),['evidence','analyst','证据与风险','Evidence and risk'],...stages.slice(2)];
export const specializedRoles = Object.freeze(Object.fromEntries(specialistStages.map(([stage,role])=>[stage,role])));
const rationale = {
  requirements:['产品经理负责目标拆解与验收边界。','Product owns scope, requirements and acceptance.'],
  technical:['技术负责人独立评估可行路线和依赖。','Technical lead independently compares feasible approaches and dependencies.'],
  evidence:['分析师核对现有证据，明确缺口与风险。','Analyst checks supplied evidence, gaps and risks.'],
  implementation:['工程师汇总三路产出，按已批准范围交付。','Engineer integrates three inputs into the approved deliverable.'],
  test:['独立测试员按既定标准复核交付物。','Independent QA checks the deliverable against the agreed criteria.'],
  review:['独立审核员交叉检验交付与测试证据。','Independent reviewer cross-checks delivery and QA evidence.'],
};
const waveOf={requirements:1,technical:1,evidence:1,implementation:2,test:3,review:4};
const commonEdges = [['implementation','test'],['implementation','review'],['test','review']];
const optionEdges = {
  lean: [['start','requirements'],['requirements','technical'],['technical','implementation'],...commonEdges],
  evidence: [['start','requirements'],['start','technical'],['requirements','implementation'],['technical','implementation'],...commonEdges],
  specialized: [['start','requirements'],['start','technical'],['start','evidence'],['requirements','implementation'],['technical','implementation'],['evidence','implementation'],...commonEdges],
};

function companySnapshot(value) {
  ensure(value?.entry === 'company', 'Expected a company draft');
  const projectId = id(value.projectId,'project ID');
  const brief = text(value.brief,'company brief',6000);
  const outcome = text(value.outcome,'accepted outcome',1200);
  const risks = value.risks;
  ensure(Array.isArray(risks) && risks.length<=8, 'Invalid risk list');
  const specialized = value.intake?.parallelSpecialists === true;
  const wantedIds = specialized ? ['specialized'] : ['lean','evidence'];
  const selectedStages=specialized?specialistStages:stages;
  const selectedIds=selectedStages.map(([stage])=>stage);
  ensure(Array.isArray(value.options) && value.options.length===wantedIds.length && wantedIds.every((option,i)=>value.options[i]?.id===option), 'Company options do not match the selected planning mode');
  const options = value.options.map(option=>{
    const graph=compileWorkflow(option.graph);
    ensure(option.assignments && selectedIds.every(stage=>typeof option.assignments[stage]==='string'), 'Missing company role binding');
    const assignments=Object.fromEntries(selectedIds.map(stage=>[stage,id(option.assignments[stage],'bound employee ID')]));
    const entries=new Map(graph.nodes.map(node=>[node.id,node]));
    ensure(entries.size===selectedIds.length+1 && entries.get('start')?.type==='start' &&
      selectedIds.every(stage=>entries.get(stage)?.employeeId===assignments[stage]), 'Company graph no longer uses its approved role bindings');
    ensure(new Set(Object.values(assignments)).size===selectedIds.length,'Company stages require independent employees');
    const expected=optionEdges[option.id];
    ensure(graph.edges.length===expected.length && expected.every(([s,t])=>graph.edges.some(e=>e.source===s&&e.target===t)),
      'Company stages must retain independent testing and final review');
    ensure(graph.nodes.find(n=>n.id==='review').instruction.includes('VERDICT: PASS') &&
      graph.nodes.find(n=>n.id==='review').instruction.includes('VERDICT: FAIL'), 'Independent reviewer must return an explicit verdict');
    const assignmentLabels = Object.fromEntries(selectedStages.map(([stage,,cn,en])=>{
      const input=option.assignmentLabels?.[stage];
      return [stage,{zh:text(input?.zh ?? cn,'assignment label (Chinese)',100),en:text(input?.en ?? en,'assignment label (English)',100)}];
    }));
    const steps = specialized ? selectedStages.map(([stage])=>{
      const proposed=option.steps?.find(step=>step.id===stage);
      ensure(proposed, 'Missing specialized step rationale');
      return {id:stage,employeeId:assignments[stage],title:assignmentLabels[stage].zh,titleEn:assignmentLabels[stage].en,
        reason:text(proposed.reason,'assignment rationale',280),reasonEn:text(proposed.reasonEn,'assignment rationale English',280),
        dependsOn:graph.edges.filter(edge=>edge.target===stage&&edge.source!=='start').map(edge=>edge.source),wave:waveOf[stage]};
    }):null;
    return {id:option.id,title:text(option.title,'option title',80),titleEn:text(option.titleEn,'option title (English)',80,true),
      summary:text(option.summary,'option summary',400),summaryEn:text(option.summaryEn,'option summary (English)',400,true),
      risk:text(option.risk,'option risk',400),riskEn:text(option.riskEn,'option risk (English)',400,true),
      feasibility:text(option.feasibility,'option feasibility',400),feasibilityEn:text(option.feasibilityEn,'option feasibility (English)',400,true),
      graph,assignments,assignmentLabels,...(steps?{steps}:{})};
  });
  if(!specialized) ensure(stageIds.every(stage=>options[0].assignments[stage]===options[1].assignments[stage]),'Company options must preserve the same roster assignment');
  const intake = value.intake == null ? {} : {intake:normalizeIntake(value.intake)};
  return {entry:'company',projectId,brief,outcome,risks:risks.map(r=>text(r,'risk',280)),options,...intake};
}

function normalizeIntake(intake) {
  ensure(typeof intake === 'object' && !Array.isArray(intake), 'Invalid intake');
  ensure(typeof intake.showTradeoff === 'boolean', 'Invalid tradeoff flag');
  return { boundaries:text(intake.boundaries,'scope boundaries',1200,true),
    checks:text(intake.checks,'acceptance checks',1200,true),
    showTradeoff:intake.showTradeoff, generation:id(intake.generation,'intake generation'), ...(intake.parallelSpecialists===true?{parallelSpecialists:true}:{}) };
}

// Legacy plans retain both choices and their original fingerprints.
export function offeredCompanyOptions(draft) {
  return !draft.intake || draft.intake.showTradeoff || draft.intake.parallelSpecialists ? draft.options : draft.options.filter(option=>option.id==='lean');
}

function sealCompany(value) {
  const snapshot=companySnapshot(value);
  return freeze({...snapshot,fingerprint:digest(snapshot)});
}
function verifyDraft(draft) {
  const current=sealCompany(draft);
  ensure(draft.fingerprint===current.fingerprint,'Company draft fingerprint is stale or invalid');
  return current;
}

/** Bounded deterministic draft variants, not feasibility claims, model output, or permission grants. */
export function buildCompanyDraft({brief,employees,projectId,title,outcome,risks,intake}={}) {
  const active = (Array.isArray(employees) ? employees : []).filter(e=>e && !e.fired).slice().sort(compareIds);
  const specialized=intake?.parallelSpecialists===true;
  function choose(role) {
    const match=active.find(employee=>employee.role===role || (!specialized && role==='reviewer' && employee.role==='audit'));
    ensure(match,specialized ? `缺少在岗专员 / Missing active specialist: ${role}` : `Missing active employee for ${role}`);
    return id(match.id,'employee ID');
  }
  const guidance = [
    'Deliver scope, exclusions, acceptance criteria and missing information. Do not approve or execute.',
    'Technical director: choose a viable option based on evidence; report risks and assumptions. Report material business exceptions separately.',
    'Implement only the approved scope. This task grants no additional tools, network, filesystem, publication or irreversible permissions.',
    'Independently verify output against the approved acceptance criteria. For each criterion, report criterion ID or text, observed result, check performed, and exact reviewed artifact/evidence reference. Mark untested or unavailable evidence explicitly and do not claim a pass without it.',
    'First line must be exactly VERDICT: PASS or VERDICT: FAIL. Use both the actual implementation deliverable and independent QA evidence. Correlate each decision with the approved criteria, and do not claim that code or tools ran unless the evidence demonstrates it. If a required criterion failed or lacks verifiable evidence, return FAIL and explain. This is a report only; do not execute follow-up actions or publish.',
  ];
  const assignments=Object.fromEntries((specialized?specialistStages:stages).map(([stage,role])=>[stage,choose(role)]));
  const task=text(brief,'company brief',6000);
  const acceptedOutcome=outcome ?? '交付可验收产出、独立测试结果与尚未解决的风险。';
  const headings = {
    lean: ['精简方案','先明确需求，再做选型，然后实现、独立测试和审核。','技术选型需等待需求，早期较慢，但减少返工。','仅编排估计；待确认范围、专长和执行权限。'],
    evidence: ['证据优先方案','需求澄清与技术调研并行，在实现前汇合，随后独立验证和审核。','必须在实现前解决需求与技术结论冲突。','仅编排估计；适用于目标较明确、可先并行收集证据的任务。'],
  };
  const headingsEn = {
    lean: ['Lean plan','Clarify requirements, choose an approach, implement, then run independent QA and review.',
      'Research waits for requirements. This is slower to start but may reduce rework.',
      'Planning estimate only. Confirm scope, available expertise and execution permissions.'],
    evidence: ['Evidence-first plan','Clarify requirements and research options in parallel, join before implementation, then run independent QA and review.',
      'Resolve conflicts between requirements and technical findings before implementation.',
      'Planning estimate only. Useful when the goal is clear enough for parallel evidence gathering.'],
  };
  const graphName=title ?? '公司模式执行计划';
  const options=Object.entries(headings).map(([optionId,[optionTitle,summary,risk,feasibility]])=> ({
    id:optionId,title:optionTitle,summary,risk,feasibility,assignments,
    titleEn:headingsEn[optionId][0],summaryEn:headingsEn[optionId][1],riskEn:headingsEn[optionId][2],feasibilityEn:headingsEn[optionId][3],
    graph:{name:graphName,description:summary,
      nodes:[{id:'start',type:'start',title:'开始',x:30,y:60},...stages.map(([stage,,label],i)=> ({
        id:stage,type:'employee',employeeId:assignments[stage],title:label,
        x:optionId==='evidence' ? [280,280,505,730,955][i] : 280+i*225,
        y:optionId==='evidence' && i===1 ? 205 : 60,
        instruction:guidance[i]+'\nInput or previous deliverable:\n{{input}}',
      }))],
      edges:optionEdges[optionId].map(([source,target])=>({source,target})),
    },
  }));
  if(specialized){
    const specific = {
      requirements: 'Independently restate requirements, exclusions, measurable acceptance and unresolved owner decisions from only the approved input.',
      technical: 'Independently select a technical approach within the approved owner scope and documented capabilities. Explain alternatives and dependencies. Do not assume missing access or approvals.',
      evidence: 'Independently inventory evidence explicitly supplied in the owner input, identify gaps and material risks, and mark unverified facts. Do not browse, fabricate evidence, or infer authorization.',
      implementation: 'Read all three upstream deliverables. Reconcile contradictions, respect the approved scope, and write the integrated text deliverable. Do not expand tools, budget, external access or release permissions. If required evidence is missing or a material decision is unresolved, give the blocker instead of inventing resolution.',
      test: guidance[3],
      review: guidance[4],
    };
    const risk='同时占用三个专员，模型开销可能更高；任一必需分支失败，后续步骤停止。';
    const summary='产品、技术、分析并行，汇总后独立验证和审核。';
    const graph={name:graphName,description:summary,
      nodes:[{id:'start',type:'start',title:'开始',x:30,y:180},...specialistStages.map(([stage,,label],i)=>({
        id:stage,type:'employee',employeeId:assignments[stage],title:label,x:i<3?265:490+(i-3)*225,y:i<3?50+i*140:190,
        instruction:specific[stage]+(stage==='review'?'':' If required work cannot be completed in scope, start your response with BLOCKED: followed by the reason.')+'\nInput or previous deliverables:\n{{input}}',
      }))],edges:optionEdges.specialized.map(([source,target])=>({source,target}))};
    return sealCompany({entry:'company',projectId,brief:task,outcome:acceptedOutcome,risks:risks??[],intake,
      options:[{id:'specialized',title:'专员并行方案',titleEn:'Parallel specialists',
        summary,summaryEn:'Product, technology and evidence run in parallel, then integrate, verify and review.',
        risk,riskEn:'Uses three specialists concurrently; costs may be higher. A failed required branch stops downstream work.',
        feasibility:'固定的文字任务编排，需要六个不同的有效岗位。',feasibilityEn:'Structured, text-only plan; requires six distinct active roles.',
        assignments,graph,steps:specialistStages.map(([stage])=>({id:stage,reason:rationale[stage][0],reasonEn:rationale[stage][1]}))}]});
  }
  return sealCompany({entry:'company',projectId,brief:task,outcome:acceptedOutcome,risks:risks ?? [],options,intake});
}

export function reviseCompanyDraft(draft, changes={}) {
  const current=verifyDraft(draft);
  ensure(changes && typeof changes==='object' && Object.keys(changes).every(k=>['brief','outcome','risks','options','title','intake'].includes(k)),
    'Cannot change company entry or project');
  const options=changes.options ?? current.options;
  ensure(Array.isArray(options) && options.every((option,i) =>
    JSON.stringify(option.assignments)===JSON.stringify(current.options[i]?.assignments)), 'Cannot revise employee role bindings');
  return sealCompany({...current,...changes,options:changes.title==null ? options : options.map(o=>({...o,graph:{...o.graph,name:changes.title}}))});
}

export function approveCompanyDraft(draft, {fingerprint,optionId,actorId,projectId}={}, now=Date.now) {
  const current=verifyDraft(draft);
  ensure(projectId==null || current.projectId===projectId,'Company draft belongs to another project');
  ensure(typeof fingerprint==='string' && fingerprint===current.fingerprint,'Approve the exact current company plan');
  ensure(offeredCompanyOptions(current).some(option=>option.id===optionId),'Choose exactly one current company option');
  // API must gate this with a trusted owner identity.
  return freeze({fingerprint,optionId,projectId:current.projectId,actorId:id(actorId,'approver ID'),approvedAt:now()});
}

export function assertCompanyApproval(draft,approval,{projectId}={}) {
  const current=verifyDraft(draft);
  ensure(current.projectId===projectId && approval?.projectId===projectId && approval.fingerprint===current.fingerprint
    && typeof approval.actorId === 'string' && ID.test(approval.actorId) && Number.isFinite(approval.approvedAt),
    'Company execution needs matching project and exact plan approval');
  const selected=offeredCompanyOptions(current).find(option=>option.id===approval.optionId);
  ensure(selected,'No approved company option');
  return selected;
}
