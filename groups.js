import { randomUUID } from 'node:crypto';

export const GROUP_TABLE='chat_groups';
const MAX_GROUPS=32, MAX_MESSAGES=120, MAX_RUNNING=3;
const ID=/^[A-Za-z0-9_-]{1,100}$/;
const verify=(test,message)=>{if(!test) throw new Error(message);};
const clean=(value,max)=>typeof value==='string'&&value.trim()&&value.length<=max;
const safeId=id=>typeof id==='string'&&ID.test(id);

export function createGroupService({ownerScope,getEmployee,persist,runTurn,now=Date.now}) {
  verify(safeId(ownerScope)&&typeof getEmployee==='function'&&typeof persist==='function'&&typeof runTurn==='function','Group service is not initialized');
  const groups=new Map(), active=new Map(), writes=new Map(), committedReplies=new Map();
  let closed=false;
  const enabled=()=>verify(!closed,'Group service is closed');
  function get(raw) {
    enabled();
    const group=safeId(raw?.id)&&groups.get(raw.id);
    verify(group&&group.scope===ownerScope,'Group was not found');
    return group;
  }
  function recordReplies(id,messages) {
    const byEmployee=new Map();
    for(const m of messages) if(m.kind==='reply') byEmployee.set(m.employeeId,{employeeId:m.employeeId,eventId:m.id,at:m.at});
    committedReplies.set(id,[...byEmployee.values()]);
  }
  async function checkpoint(group) {
    const {scope,id}=group;
    const record=structuredClone(group);
    const prior=writes.get(id)||Promise.resolve();
    const task=prior.catch(()=>{}).then(()=>persist({scope,id,record})).then(()=>recordReplies(id,record.messages));
    writes.set(id,task);
    try { await task; } finally { if(writes.get(id)===task) writes.delete(id); }
  }
  const message=(kind,text,by)=>({
    id:randomUUID(),kind,text,at:now(), ...(by?{employeeId:by.id,name:by.name}:{}),
  });
  const summary=group=>({id:group.id,name:group.name,employeeIds:[...group.employeeIds],
    createdAt:group.createdAt,updatedAt:group.updatedAt,runStatus:group.run?.status||'idle',messageCount:group.messages.length});
  const detail=group=>structuredClone({...summary(group),messages:group.messages,run:group.run});
  function employeeIds(raw) {
    verify(Array.isArray(raw)&&raw.length>=2&&raw.length<=6&&raw.every(safeId)&&new Set(raw).size===raw.length,'Choose 2–6 different employees');
    return [...raw];
  }
  function restore(rows) {
    for(const row of rows) {
      if (groups.size>=MAX_GROUPS) break;
      if (!row || row.scope!==ownerScope || !safeId(row.id) || groups.has(row.id) || !clean(row.name,80)
          || !Array.isArray(row.messages)||row.messages.length>MAX_MESSAGES || !Number.isFinite(row.createdAt) || !Number.isFinite(row.updatedAt)) continue;
      try {
        const members=employeeIds(row.employeeIds);
        const valid=row.messages.every(m=>m&&safeId(m.id)&&['user','reply','error'].includes(m.kind)
          && clean(m.text,m.kind==='user'?4000:6000)&&Number.isFinite(m.at)
          && (m.kind==='user'||members.includes(m.employeeId)));
        if(!valid) continue;
        const group=structuredClone(row);
        if(group.run?.status==='running') {
          group.run.status='interrupted';
          group.run.finishedAt=now();
          for(const worker of group.run.workers||[]) if(worker.status==='queued'||worker.status==='running') {
            worker.status='interrupted';worker.finishedAt=group.run.finishedAt;
          }
        }
        groups.set(group.id,group);
        recordReplies(group.id,group.messages);
      } catch { /* Ignore malformed internal records; do not source history from legacy or other scopes. */ }
    }
  }
  async function create(raw) {
    enabled();
    verify(groups.size<MAX_GROUPS,'Group limit reached');
    verify(clean(raw?.name,80),'Group name must contain 1–80 characters');
    const ids=employeeIds(raw.employeeIds);
    verify(ids.every(id=>getEmployee(id)),'Choose active employees only');
    const stamp=now();
    const group={scope:ownerScope,id:randomUUID(),name:raw.name.trim(),employeeIds:ids,createdAt:stamp,updatedAt:stamp,messages:[],run:null};
    groups.set(group.id,group);
    try{await checkpoint(group);}catch(error){groups.delete(group.id);throw error;}
    return detail(group);
  }
  async function send(raw) {
    const group=get(raw);
    verify(!active.has(group.id)&&active.size<MAX_RUNNING,'Group is busy or active group limit reached');
    verify(clean(raw?.text,4000),'Message must contain 1–4000 characters');
    const members=group.employeeIds.map(getEmployee);
    verify(members.every(Boolean),'A group member is no longer active; create a new group');
    verify(group.messages.length+members.length+1<=MAX_MESSAGES,'Group has reached its history limit; create a new group');
    let remaining=16000;
    const history=[];
    for(const item of group.messages.slice(-8).reverse()) {
      if(item.text.length>remaining) break;
      remaining-=item.text.length;
      history.unshift({kind:item.kind,employeeId:item.employeeId,text:item.text});
    }
    const incoming=message('user',raw.text.trim());
    const startedAt=now();
    const run={id:randomUUID(),status:'running',startedAt,finishedAt:0,
      workers:members.map(worker=>({employeeId:worker.id,status:'queued',startedAt:0,finishedAt:0,participatedAt:0}))};
    const prior={messages:group.messages,run:group.run,updatedAt:group.updatedAt};
    const controller=new AbortController();
    const job={controller,done:null};
    active.set(group.id,job);
    group.messages=[...group.messages,incoming];group.run=run;group.updatedAt=startedAt;
    const ready=checkpoint(group);
    job.done=ready.then(async ()=>{
      const payload=JSON.stringify({group:group.name,history,message:incoming.text});
      await Promise.all(members.map(async (employee,i)=>{
        const slot=run.workers[i];
        if(controller.signal.aborted){slot.status='interrupted';slot.finishedAt=now();return;}
        slot.status='running';slot.startedAt=now();
        try {
          const markParticipated=()=>{
            if (slot.participatedAt || slot.status!=='running' || controller.signal.aborted) return;
            slot.participatedAt=now();
            void checkpoint(group).catch(()=>{});
          };
          const reply=await runTurn({groupId:group.id,runId:run.id,employee,payload,signal:controller.signal,markParticipated});
          if(controller.signal.aborted){slot.status='interrupted';return;}
          verify(clean(reply,6000),'Invalid worker reply');
          group.messages.push(message('reply',reply,employee));slot.status='done';
        } catch {
          slot.status=controller.signal.aborted?'interrupted':'failed';
          if(!controller.signal.aborted) group.messages.push(message('error','Worker did not return a valid text reply.',employee));
        } finally {
          slot.finishedAt=now();group.updatedAt=slot.finishedAt;
          // Failure is retried by the final full snapshot.
          await checkpoint(group).catch(()=>{});
        }
      }));
      const terminal={...run,status:controller.signal.aborted?'interrupted':run.workers.every(w=>w.status==='done')?'done':'failed',finishedAt:now()};
      try {await checkpoint({...group,run:terminal,updatedAt:terminal.finishedAt});group.run=terminal;}
      catch {group.run={...terminal,status:'failed',error:'Group history could not be persisted.'};}
      group.updatedAt=terminal.finishedAt;
    },()=>Object.assign(group,prior)).finally(()=>active.delete(group.id));
    await ready;
    return detail(group);
  }
  function employeeGroups(raw) {
    enabled();
    const employeeId=raw?.employeeId;
    verify(safeId(employeeId)&&getEmployee(employeeId),'Employee was not found');
    const rows=[];
    for(const group of groups.values()) {
      if(group.scope!==ownerScope||!group.employeeIds.includes(employeeId)) continue;
      const slot=group.run?.workers?.find(worker=>worker.employeeId===employeeId);
      const reply=committedReplies.get(group.id)?.find(item=>item.employeeId===employeeId);
      // Membership is not evidence that a worker has joined a round.
      const latestRound=slot?{
        status:slot.status==='running'&&!slot.participatedAt?'queued':slot.status,
        participatedAt:slot.participatedAt||0,finishedAt:slot.finishedAt||0
      }:null;
      rows.push({id:group.id,name:group.name,memberCount:group.employeeIds.length,updatedAt:group.updatedAt,
        latestRound,lastReplyAt:reply?.at||0});
    }
    rows.sort((a,b)=>b.updatedAt-a.updatedAt||a.id.localeCompare(b.id));
    return {employeeId,groups:rows};
  }
  return {
    restore,create,send,employeeGroups,read:raw=>detail(get(raw)),list:()=>{enabled();return {groups:[...groups.values()].map(summary).sort((a,b)=>b.updatedAt-a.updatedAt||a.id.localeCompare(b.id))};},
    workStates:()=>{enabled();return [...groups.values()].map(group=>({id:group.id,name:group.name,run:group.run ? structuredClone(group.run) : null, replies:structuredClone(committedReplies.get(group.id)||[])}));},
    async close(){closed=true;const jobs=[...active.values()];for(const job of jobs)job.controller.abort();await Promise.allSettled(jobs.map(job=>job.done));await Promise.allSettled([...writes.values()]);},
  };
}
