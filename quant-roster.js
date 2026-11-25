const roles=['quote','theme','candidate','risk','delivery'];
const activeStates=new Set(['running','queued','pending','bidding','working']);
const terminalStates=new Set(['done','failed','skipped','interrupted','cancelled']);
const isoMs=n=>Number.isFinite(n)&&n>0&&n<8.64e15?new Date(n).toISOString():null;
const limit=(value,len=180)=>typeof value==='string'?value.trim().slice(0,len):'';
const replyLifetimeMs=9000;
const inProgress=new Set(['running','working','bidding']);
const validEventId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value);
const minStatus='idle';

export function quantAssignments(input, activeIds) {
  if(!input || typeof input!=='object'||Array.isArray(input)||
    Object.keys(input).some(key=>!roles.includes(key))) throw new Error('量化岗位配置无效。');
  const out={};
  for (const role of roles) {
    const value=input[role];
    if(value===''||value===null||value===undefined) continue;
    if(typeof value!=='string'||!activeIds.has(value)) throw new Error('请只分配在岗员工。');
    out[role]=value;
  }
  return out;
}
export function visibleAssignments(input,activeIds) {
  const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  return Object.fromEntries(roles.filter(role=>typeof source[role]==='string'&&activeIds.has(source[role]))
    .map(role=>[role,source[role]]));
}

/**
 * Build an employee-ID-based projection from trusted company run state.
 * SQL/log scanner output is never used as evidence an employee executed anything.
 */
export function workRoster({employees=[],workflows=[],missions=[],groupRuns=[],assignments={},assignmentsAvailable=false,now=Date.now()}={}) {
  const out=new Map(employees.filter(e=>e?.id&&!e.fired).map(e=>[e.id,{
    id:e.id,name:limit(e.name),title:limit(e.title),role:limit(e.role),active:[],last:null,motion:{kind:'idle'},latestReply:null,
  }]));
  function add(employeeId,origin,title,status,at,{output,active}={}) {
    const row=out.get(employeeId);
    if(!row||typeof status!=='string')return;
    const item={origin,title:limit(title)||'—',status,at:isoMs(at)};
    if(active&&activeStates.has(status)) row.active.push(item);
    if(terminalStates.has(status)&&item.at&&(!row.last||item.at>=row.last.at)) row.last={...item,output:limit(output,320)};
  }
  for(const flow of workflows) {
    const run=flow?.lastRun;
    // No fallback to a changed draft when a frozen graph wasn't recorded by older builds.
    if(!run||!Array.isArray(run.graph?.nodes)||!Array.isArray(run.nodeRuns))continue;
    const nodes=new Map(run.graph.nodes.map(node=>[node.id,node]));
    const origin=flow.kind==='company-run'?'company':'workflow';
    for(const slot of run.nodeRuns) {
      const node=nodes.get(slot.nodeId);
      if(!node?.employeeId)continue;
      const actualTitle=[run.graph.name,node.title].filter(Boolean).join(' / ');
      add(node.employeeId,origin,actualTitle,slot.status,slot.finishedAt||slot.startedAt||run.startedAt,
        {active:run.status==='running',output:origin==='company'&&slot.status==='done'?slot.output:undefined});
    }
  }
  for (const mission of missions) for (const slot of mission?.results||[]) {
    if (!slot?.employeeId || slot.bid==='decline') continue;
    // A notified non-owner does not bid or execute in direct assignment.
    if (mission.assigneeId && slot.employeeId!==mission.assigneeId) continue;
    // After bidding only accepted staff have work to wait for.
    if (!mission.assigneeId && mission.status==='working' && slot.bid!=='accept') continue;
    const status=slot.bid==='thinking'?'bidding':slot.status;
    const at=slot.finishedAt||slot.endedAt||slot.startedAt||mission.finishedAt||mission.createdAt;
    add(slot.employeeId,'mission',mission.title,status,at,{active:['bidding','working'].includes(mission.status)});
  }
  const motionByEmployee = new Map(), replyByEmployee = new Map();
  const setGroupMotion=(employeeId,event,rank)=>{
    if(!out.has(employeeId) || !validEventId(event.groupId) || !Number.isFinite(event.at) || event.at<=0 || event.at>now) return;
    const destination = rank===2?motionByEmployee:replyByEmployee;
    const old=destination.get(employeeId);
    if(!old || event.at>old.event.at) destination.set(employeeId,{event,rank});
  };
  for(const entry of groupRuns) {
    const run=entry?.run;
    for(const slot of run?.workers||[]) {
      const groupState=slot.status==='running'&&!slot.participatedAt?'queued':slot.status;
      add(slot.employeeId,'group',entry.name,groupState,slot.finishedAt||slot.participatedAt||run.startedAt,
        {active:run.status==='running'});
      if(run.status==='running' && slot.status==='running' && validEventId(run.id))
        setGroupMotion(slot.employeeId,{kind:'group',groupId:entry.id,at:slot.participatedAt,eventId:run.id},2);
    }
    for(const reply of entry?.replies||[]) if(validEventId(reply.eventId)&&now-reply.at<replyLifetimeMs)
      setGroupMotion(reply.employeeId,{kind:'reply',groupId:entry.id,eventId:reply.eventId,at:reply.at},1);
  }
  for(const row of out.values()){
    row.active.sort((a,b)=>(b.at||'').localeCompare(a.at||''));
    row.active = row.active.slice(0,12);
    // Empty active means not attributed by this projection, not evidence from quote logs.
    row.status = row.active[0]?.status || minStatus;
    const group=motionByEmployee.get(row.id), reply=replyByEmployee.get(row.id);
    row.latestReply=reply?.event||null;
    const doingDeskWork=row.active.some(item=>item.origin!=='group'&&inProgress.has(item.status));
    // Current attributable work wins over the brief, historical reply illustration.
    row.motion=group?group.event:doingDeskWork?{kind:'typing'}:reply?.event||{kind:'idle'};
  }
  return {employees:[...out.values()],assignments:visibleAssignments(assignments,new Set(out.keys())),assignmentsAvailable};
}
