import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { open, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

const MAX_BYTES = 1024 * 1024;
const ids = ['quote','theme','candidate','risk','delivery'];
const routeKeys = ['approach','neiqie','leader','external','dip'];
const isoRe = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/;
const iso = value => typeof value==='string' && isoRe.test(value) && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
// Older TradingAgents local datetimes omit a zone. Interpret only if the host
// explicitly verified the source zone; never infer it from UI or server location.
function logIso(value, zone) {
  return iso(value) || (zone==='Asia/Shanghai' && typeof value==='string'
    && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?$/.test(value)
    ? iso(value+'+08:00') : null);
}
const toNumber = v => Number.isSafeInteger(v) && v>=0 && v<=1_000_000 ? v : 0;
const blank=id=>({id,status:'unknown',at:null,action:'',reason:'',counts:{}});
const timeFmt=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const parts = t => Object.fromEntries(timeFmt.formatToParts(t).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
const dateKey = t => {const p=parts(t);return `${p.year}${p.month}${p.day}`;};

// UI-only clock phase. 'marketOpen' is separately validated for alert eligibility; weekends alone don't prove a trading day.
export function chinaPhase(time) {
  const p=parts(time), minute=Number(p.hour)*60+Number(p.minute);
  if (p.weekday==='Sat' || p.weekday==='Sun') return 'closed';
  if (minute>=570 && minute<690) return 'morning';
  if (minute>=690 && minute<780) return 'lunch';
  if (minute>=780 && minute<897) return 'afternoon';
  return 'closed';
}

async function tailJson(root, file) {
  let handle;
  try {
    const parent = await realpath(dirname(resolve(root,file)));
    const rel = relative(root,parent);
    if (rel==='..' || rel.startsWith('..'+sep) || isAbsolute(rel)) return {rows:[],ready:false,partial:true};
    handle = await open(resolve(root,file), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const stat=await handle.stat();
    if (!stat.isFile()) return {rows:[],ready:false,partial:true};
    const size = Math.min(MAX_BYTES,stat.size);
    const bytes=Buffer.alloc(size);
    const pos = stat.size-size;
    const {bytesRead}=await handle.read(bytes,0,size,pos);
    const raw=bytes.subarray(0,bytesRead).toString('utf8').split('\n');
    if(pos>0) raw.shift(); // beginning may be a partial line
    let damaged=false;
    const rows=[];
    for (const line of raw) {
      if (!line.trim()) continue;
      try{ const v=JSON.parse(line); if (v && typeof v==='object' && !Array.isArray(v)) rows.push(v); else damaged=true; }
      catch {damaged=true;}
    }
    return {rows,ready:true,partial:pos>0||damaged};
  } catch {return {rows:[],ready:false,partial:false};}
  finally {if(handle) await handle.close().catch(()=>{});}
}
function sortRows(rows,when,date,cutoff,zone) {
  return rows.map(entry=>({entry,at:logIso(when(entry),zone)})).filter(x=>x.at&&dateKey(Date.parse(x.at))===date&&Date.parse(x.at)<=cutoff)
    .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
}
function safeRole(id,{status='unknown',at=null,action='',reason='',counts={}}={}) {return {id,status,at,action,reason,counts};}
const sum = (routes,key) => routes.reduce((n,row)=>n+toNumber(row[key]),0);
const tailRecords = 80;
const eventId = (roleId,kind,at,seed,counts) => createHash('sha256')
  .update(JSON.stringify([roleId,kind,at,seed,counts])).digest('hex').slice(0,24);
function event(roleId,kind,at,seed,action,reason,counts) {
  return {id:eventId(roleId,kind,at,seed,counts),at,roleId,kind,action,reason,counts};
}
function scanCounts(entry) {
  const routes=routeKeys.map(key=>entry?.routes?.[key]).filter(row=>row&&typeof row==='object'&&!Array.isArray(row));
  const nestedCount=field=>Array.isArray(entry?.[field])?entry[field].length
    : routes.reduce((n,row)=>n+(Array.isArray(row[field])?row[field].length:0),0);
  const known=routes.filter(row=>row.coverage?.status==='known_discovery_scope').length;
  const progress=routes.filter(row=>row.coverage?.status==='discovery_started').length;
  return {routes, known, progress, unknown:routes.length-known-progress,
    selected:sum(routes,'selected_count'),evaluated:sum(routes,'evaluated_count'),
    observed:sum(routes,'observation_recorded_count'),skips:nestedCount('notification_skipped'),errors:nestedCount('errors')};
}
// Only genuine journal rows create events. No heartbeat or fabricated progress.
// A scan finish can report distinct candidate, coverage, and skip observations.
function runTimeline(scans,reviews,mailRows) {
  const log=[];
  const freshSlice=rows=>rows.slice(-tailRecords);
  for (const {entry,at} of freshSlice(scans)) {
    const seed=typeof entry.run_id==='string'?entry.run_id.slice(0,128):'';
    if(entry.event==='start')log.push(event('candidate','scan_started',at,seed,'开始盘中扫描','',{}));
    else {
      const x=scanCounts(entry);
      log.push(event('candidate','scan_finished',at,seed,'记录本轮扫描结果',
        entry.run_status==='completed'?'':'该轮没有报告完整结束。',
        {routes:x.routes.length,selected:x.selected,evaluated:x.evaluated,observed:x.observed}));
      if(x.routes.length)log.push(event('quote','scan_finished',at,seed,'记录本轮扫描覆盖证据',
        x.unknown?'部分路径的覆盖范围未知。':'不代表已验证报价时效。',
        {coverageKnown:x.known,coverageUnknown:x.unknown,coverageInProgress:x.progress,errors:x.errors}));
      if(x.skips)log.push(event('delivery','delivery_skipped',at,seed,'本轮存在跳过通知的记录',
        '只显示日志计数；此工作台未发信。',{skipped:x.skips}));
    }
  }
  for(const {entry,at} of freshSlice(reviews)) {
    const pass=entry.approved===true;
    log.push(event('risk',pass?'review_approved':'review_blocked',at,'','记录买入审核结果',
      pass?'审核记录为通过，不等于实盘成交。':'未通过或缺通过证据。',
      {approved:pass?1:0,reviewed:1}));
  }
  for(const {entry,at} of freshSlice(mailRows)) {
    const ok=entry.status==='accepted'||entry.receipt?.status==='accepted';
    log.push(event('delivery',ok?'smtp_accepted':'smtp_other',at,'','读取历史投递回执',
      ok?'SMTP 受理不等于已经投递到收件箱。':'没有可验证的 SMTP 受理结果。',
      {smtpAccepted:ok?1:0,otherStatuses:ok?0:1}));
  }
  const order={scan_started:0,scan_finished:1,review_approved:2,review_blocked:2,delivery_skipped:3,smtp_accepted:3,smtp_other:3};
  return [...new Map(log.map(x=>[x.id,x])).values()].sort((a,b)=>a.at.localeCompare(b.at)||order[a.kind]-order[b.kind]).slice(-tailRecords);
}
const noSource=(mode,time,err)=>({available:false,mode,generatedAt:new Date(time).toISOString(),marketAsOf:null,session:chinaPhase(time),
  source:'TradingAgents',roles:ids.map(blank),timeline:[],outbox:{eligible:0,delivered:0,mode:'dry_run'},error:err});

/**
 * Read-only telemetry projection. Calls no model, daemon, trading provider or email service.
 * Owner supplies quantLogRoot in local host config, never in a request body.
 */
export async function readQuantStatus(config={}, now=Date.now()) {
  const time = Number.isFinite(now) && Math.abs(now)<8.64e15 ? now : Date.now();
  const mode = ['replay','paper','live_readonly'].includes(config.quantMode)?config.quantMode:null;
  if(!mode || typeof config.quantLogRoot!=='string'||!isAbsolute(config.quantLogRoot)) return noSource(mode,time,'未配置本地只读行情日志。');
  let root;
  try {root=await realpath(config.quantLogRoot);} catch {return noSource(mode,time,'本地日志目录当前不可用。');}
  const date = mode==='replay' && typeof config.quantReplayDate==='string'&&/^20\d{6}$/.test(config.quantReplayDate)?config.quantReplayDate:dateKey(time);
  const [scan,llm,mail]=await Promise.all([
    tailJson(root,`leader_scans/${date}.jsonl`),
    tailJson(root,`llm_judgments_${date}.jsonl`),
    tailJson(root,`confirmation_deliveries_${date}.jsonl`),
  ]);
  const scans=sortRows(scan.rows.filter(x=>['start','finish'].includes(x.event)),
    x=>x.event==='start'?x.started_at:x.finished_at,date,time);
  const reviews=sortRows(llm.rows.filter(x=>typeof x.approved==='boolean'),x=>x.at,date,time,config.quantLegacyTimezone);
  const mailRows=sortRows(mail.rows.filter(x=>typeof x.status==='string'),x=>x.at,date,time,config.quantLegacyTimezone);
  const latestScan=scans.at(-1), finished=scans.findLast(x=>x.entry.event==='finish');
  const routes=routeKeys.map(key=>finished?.entry.routes?.[key]).filter(x=>x&&typeof x==='object');
  const selected=sum(routes,'selected_count'), evaluated=sum(routes,'evaluated_count'), observed=sum(routes,'observation_recorded_count');
  const byRoute={};
  for (const key of routeKeys) {
    const row=finished?.entry.routes?.[key];
    if(row && typeof row==='object') {
      byRoute[key+'Selected']=toNumber(row.selected_count);
      byRoute[key+'Evaluated']=toNumber(row.evaluated_count);
    }
  }
  const coverageKnown=routes.filter(r=>r.coverage?.status==='known_discovery_scope').length;
  const coverageInProgress=routes.filter(r=>r.coverage?.status==='discovery_started').length;
  const coverageUnknown=routes.length-coverageKnown-coverageInProgress;
  const countRecorded = field => {
    const top = finished?.entry[field];
    if (Array.isArray(top)) return top.length;
    return routes.reduce((n,row)=>n+(Array.isArray(row[field])?row[field].length:0),0);
  };
  const errors=countRecorded('errors'), skips=countRecorded('notification_skipped');
  const approvals=reviews.filter(x=>x.entry.approved===true).length;
  const accepted=mailRows.filter(x=>x.entry.status==='accepted'||x.entry.receipt?.status==='accepted').length;
  const latestReview=reviews.at(-1), latestMail=mailRows.at(-1);
  const freshScan=latestScan && time-Date.parse(latestScan.at)<=150_000;
  const session=mode==='replay'&&latestScan?chinaPhase(Date.parse(latestScan.at)):chinaPhase(time);
  const activeWindow=['morning','afternoon'].includes(session);
  const pending=latestScan?.entry.event==='start'&&!scans.some(x=>x.entry.event==='finish'&&x.entry.run_id===latestScan.entry.run_id);
  const scanStatus = !latestScan?'unknown':mode==='live_readonly'&&activeWindow&&!freshScan?'stale'
    :pending?(mode==='replay'?'unknown':'running'):finished?.entry.run_status==='completed'?'done':'blocked';
  const roleData=[
    safeRole('quote',{status:routes.length?(coverageUnknown||coverageInProgress||errors?'blocked':'done'):'unknown',at:finished?.at||null,
      action:routes.length?'核对扫描日志中的覆盖证据':'尚无扫描覆盖记录',
      reason:'已知发现范围不是全市场覆盖；逐笔行情日期和新鲜度尚未核实。',
      counts:routes.length?{routes:routes.length,coverageKnown,coverageInProgress,coverageUnknown,errors}:{} }),
    safeRole('theme',{status:'unknown',action:'板块、资金与催化证据未接入',reason:'不以行情或扫描计数推断题材强度。'}),
    safeRole('candidate',{status:scanStatus,at:latestScan?.at||null,
      action:latestScan?'读取盘中扫描的运行与流转记录':'等待扫描日志',
      reason:scanStatus==='stale'?'在盘中未看到新的扫描记录。':pending?'只看到了开始，尚未看到同批次结束。':scan.partial?'日志截尾或有不完整行；计数不是全日统计。':'',
      counts:finished?{routes:routes.length,selected,evaluated,observed,...byRoute}:{} }),
    safeRole('risk',{status:latestReview?(latestReview.entry.approved?'done':'blocked'):'unknown',at:latestReview?.at||null,
      action:latestReview?'汇总买入审核记录':'尚无审核记录',
      reason:'卖出可卖数量遥测未接入；不能把没有邮件当成继续持有的证据。',
      counts:latestReview?{reviewed:reviews.length,approved:approvals,skipped:reviews.length-approvals}:{} }),
    safeRole('delivery',{status:latestMail?(latestMail.entry.status==='accepted'||latestMail.entry.receipt?.status==='accepted'?'done':'blocked'):'unknown',at:latestMail?.at||null,
      action:'只读历史投递回执，不发送邮件',
      reason:session==='lunch'?'午休；不发通知。':'SMTP 受理不代表已到达或已阅读。观察级留在工作台。',
      counts:{...(latestMail?{smtpAccepted:accepted,otherStatuses:mailRows.length-accepted}:{}),...(finished?{skipped:skips}:{})} }),
  ];
  const available = scans.length+reviews.length+mailRows.length>0;
  return {available,mode,generatedAt:new Date(time).toISOString(),marketAsOf:null,session,source:'TradingAgents',roles:roleData,timeline:runTimeline(scans,reviews,mailRows),
    outbox:{eligible:0,delivered:0,mode:'dry_run'},...(!available?{error:'没有可核验的盘中日志。'}:{})};
}

/** A deterministic preflight for a future, separately authorized notification, not a send or an order. */
export function alertGate(input) {
  const reject=reason=>({eligible:false,reason,send:false});
  if(input?.marketOpen!==true) return reject('market_calendar_unconfirmed');
  const time=iso(input.at);
  if(!time || !['morning','afternoon'].includes(chinaPhase(Date.parse(time))))return reject('outside_continuous_session');
  if(input.type!=='buy'&&input.type!=='sell')return reject('observation_only');
  if(input.tier!=='confirmed'||input.audited!==true)return reject('review_unconfirmed');
  const quote=iso(input.quoteAsOf), observed=iso(input.quoteReceivedAt);
  if(!quote||!observed||dateKey(Date.parse(quote))!==dateKey(Date.parse(time))||Date.parse(quote)>Date.parse(observed)
     ||Date.parse(observed)>Date.parse(time)||Date.parse(time)-Date.parse(quote)>120_000||input.quoteConsistent!==true) return reject('missing_or_stale_quote');
  if(input.type==='sell'&&(!Number.isSafeInteger(input.sellableShares)||input.sellableShares<=0))return reject('no_verified_sellable_quantity');
  if(!Number.isFinite(input.referencePrice)||input.referencePrice<=0||!Number.isFinite(input.stopPrice)||input.stopPrice<=0)
    return reject('missing_price_or_risk_level');
  if(input.duplicate===true)return reject('duplicate');
  return {eligible:true,reason:'dry_run_only',send:false};
}
