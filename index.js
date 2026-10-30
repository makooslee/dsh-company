/**
 * dsh-company — Host half.
 *
 * 一家只有一位 CEO（你）的小公司。每个员工是一个长期存活的智能体会话，
 * 有自己的身份（人设）、职位、模型与技能白名单。
 *
 * 关键设计：**认单制，不是流水线**。
 *   1) bidding：任务先广播给全体员工，每个人自己判断「这活该不该我接」，
 *      第一行必须给 接单 / 不接 + 理由（不接要说该谁接）。
 *   2) working：只有 Bidding 阶段接单的人进入执行，并且彼此知道谁也在干。
 *   整个过程按时间汇成一条团队时间线（mission.events），像群聊一样可读。
 *
 * DSH 官方约束（据此实现）：
 * - 员工 = ctx.agents.create() 的真实 Agent，独立 session、独立上下文；
 * - 人设走 setup(agentCtx) 内的 systemPrompt.section()；
 * - 技能走 agentCtx.tools.restrict({ allow })（只在员工自己的 agent scope 生效）；
 * - 派活走 agent.followup(userMessage)，员工自己开新 turn；
 * - 产出与会话记录都从 session 日志派生（日志是唯一真相源）；
 * - 所有注册都在 ctx.effect 内完成并返回清理。
 *
 * v0.4 新增：
 * - /dsh-company 斜杠命令：在当前对话框里直接给团队派活。
 * - 每名员工一个独立记忆目录（DSH home 下 dsh-company/employees/<id>/memory.md），
 *   记忆条目同时进 storage（memories 表），并动态注入员工自己的 system prompt。
 * - 任务可删除；员工与任务同时镜像成 Agent Teams 事件（team/member、team/task），
 *   这样官方 agent-team 面板能直接看到「谁在干什么」。
 */

import { randomUUID } from 'node:crypto';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const name = 'dsh-company';

export const inject = ['connection', 'agents', 'tools', 'systemPrompt', 'sessions', 'commands'];

const STORE_UNIT = 'dsh_company';
const BID_TIMEOUT_MS = 6 * 60 * 1000;
const WORK_TIMEOUT_MS = 30 * 60 * 1000;
const MODEL_CACHE_MS = 60 * 1000;

/** 每名员工的独立记忆目录（相对 DSH home）。 */
const MEMORY_HOME_DIR = 'dsh-company';
const MEMORY_TABLE = 'memories';
/** 记忆种类：note=CEO 备注，bid=认单理由，deliver=交付结果，system=系统事件。 */
const MEMORY_KINDS = new Set(['note', 'bid', 'deliver', 'system']);

/** 包目录：用于伺服包内的赞赏码图片。 */
const PACKAGE_DIR = fileURLToPath(new URL('.', import.meta.url));
const SPONSOR_ROUTE = '/api/dsh-company/sponsor.png';
const IMAGE_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};
const DEFAULT_SPONSOR_TEXT =
  '如果这个插件替你省下了时间，可以扫码请我喝杯咖啡，金额随意。最近投资和工作都不太顺，任何一点支持都是实实在在的帮助。谢谢。';

/** 内置角色：一套小公司该有的班底。 */
const ROLE_TEMPLATES = [
  {
    id: 'director',
    name: '项目总监',
    title: '项目总监',
    accent: '#8B7BF0',
    persona:
      '你是项目总监，直属于 CEO。职责是判断一件事该谁干、盯进度、最后验收，而不是自己动手写稿。' +
      '工作习惯：先把任务拆成可交付的几块并说清边界；再判断该由哪个岗位主责、谁配合；' +
      '验收时只看「可测的标准」，不看态度和形容词。' +
      '交付格式：① 归属判断与理由 ② 拆解与依赖 ③ 里程碑 ④ 验收标准。',
    skills: ['read', 'glob', 'grep', 'todo_write'],
  },
  {
    id: 'product',
    name: '产品经理',
    title: '产品经理',
    accent: '#F2A65A',
    persona:
      '你是产品经理，直属于 CEO。职责是把一句话想法变成可交付的需求。' +
      '工作习惯：先写清用户是谁、痛点是什么、不做会怎样；再写范围（做什么 / 明确不做什么）；' +
      '最后给可测的验收标准。拒绝「优化体验」「提升效率」这类无法验收的表述。' +
      '交付格式：① 问题与目标 ② 方案要点 ③ 范围与不做清单 ④ 验收标准 ⑤ 依赖与风险。',
    skills: ['read', 'write', 'glob', 'grep', 'todo_write'],
  },
  {
    id: 'techlead',
    name: '技术总监',
    title: '技术总监',
    accent: '#4C8DFF',
    persona:
      '你是技术总监，直属于 CEO。职责是定技术方案、划架构边界、判断可行性与成本，对工程师的产出做技术把关。' +
      '工作习惯：先给两三个候选方案并写清取舍（成本、风险、回滚难度），再推荐一个；' +
      '评审代码只看「能不能跑、边界对不对、以后改起来贵不贵」。' +
      '交付格式：① 结论与推荐方案 ② 关键取舍 ③ 风险与回滚 ④ 给工程师的具体要求。',
    skills: ['read', 'write', 'edit', 'glob', 'grep', 'bash', 'todo_write'],
  },
  {
    id: 'engineer',
    name: '工程师',
    title: '高级研发工程师',
    accent: '#3ECFA0',
    persona:
      '你是高级研发工程师，直属于 CEO。职责是把需求落成可运行的代码，并证明它能跑。' +
      '工作习惯：先读现有代码再动手，改动最小化；改完必须自己验证（跑一次、看输出），' +
      '没验证过的结论只能写成「未验证」。' +
      '交付格式：① 改动清单（文件 + 改了什么 + 为什么） ② 验证方式与结果 ③ 已知限制。',
    skills: ['read', 'write', 'edit', 'glob', 'grep', 'bash', 'todo_write'],
  },
  {
    id: 'analyst',
    name: '数据分析师',
    title: '资深数据分析师',
    accent: '#39B8C4',
    persona:
      '你是数据分析师，直属于 CEO。职责是把模糊的业务问题拆成可验证的数据问题，用数据给结论。' +
      '工作习惯：先确认口径（分子分母、时间窗、样本范围），再算数；能取数就先取数，取不到就明确写出假设，绝不编造数字。' +
      '交付格式：① 结论（一句话） ② 关键数据 ③ 口径与假设 ④ 风险与不确定性。',
    skills: ['read', 'write', 'glob', 'grep', 'bash', 'todo_write'],
  },
  {
    id: 'qa',
    name: '测试工程师',
    title: '测试工程师',
    accent: '#E3B23C',
    persona:
      '你是测试工程师，直属于 CEO。职责是想办法把它弄坏，并说清坏在哪。' +
      '工作习惯：先列测试点（正常路径 / 边界 / 异常 / 并发 / 权限），再逐条给实际结果；' +
      '没跑过的用例不许写成通过。' +
      '交付格式：① 结论（通过 / 有条件通过 / 打回） ② 用例与结果表 ③ 缺陷清单（复现步骤 + 期望 vs 实际） ④ 未覆盖范围。',
    skills: ['read', 'glob', 'grep', 'bash', 'todo_write'],
  },
  {
    id: 'reviewer',
    name: '审核员',
    title: '质量审核员',
    accent: '#E36AA6',
    persona:
      '你是质量审核员，直属于 CEO。你不生产方案，你负责挑毛病。' +
      '工作习惯：逐条对照需求核对交付物，任何未经证实的断言都标记为「未验证」；' +
      '把问题分成「事实错误 / 逻辑漏洞 / 口径不一致 / 表达歧义」四类，各给证据与修改建议。' +
      '交付格式：① 是否通过 ② 问题清单 ③ 已核查维度 ④ 未覆盖范围。',
    skills: ['read', 'glob', 'grep', 'todo_write'],
  },
];

const ROLE_BY_ID = new Map(ROLE_TEMPLATES.map((role) => [role.id, role]));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function ok(value) {
  return Response.json({ ok: true, value }, { headers: { 'cache-control': 'no-store' } });
}

function fail(code, message) {
  return Response.json({ ok: false, error: { code, message } }, { headers: { 'cache-control': 'no-store' } });
}

function textOf(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function truncate(text, limit) {
  const value = String(text || '');
  return value.length <= limit ? value : `${value.slice(0, limit)}…`;
}

/** 从会话日志尾段收集本轮产出。 */
function collectTurn(session, fromSeq) {
  let events;
  try {
    events = session.snapshotEvents(fromSeq);
  } catch {
    return { text: '', error: '' };
  }
  let text = '';
  let error = '';
  for (const event of events) {
    if (event.type === 'assistant/message') {
      const part = textOf(event.data && event.data.message && event.data.message.content);
      if (part) text = part;
    } else if (event.type === 'turn/end') {
      const reason = event.data && event.data.reason;
      if (reason && reason.kind === 'error' && reason.error && reason.error.message) error = reason.error.message;
    }
  }
  return { text, error };
}

/** 把整段会话日志折成可读的对话记录（员工详情用）。 */
function transcriptOf(session) {
  let events;
  try {
    events = session.snapshotEvents(0);
  } catch {
    return [];
  }
  const rows = [];
  for (const event of events) {
    if (event.type === 'user/message') {
      const text = textOf(event.data && event.data.content);
      if (text) rows.push({ role: 'user', text, at: event.time });
    } else if (event.type === 'assistant/message') {
      const text = textOf(event.data && event.data.message && event.data.message.content);
      if (text) rows.push({ role: 'assistant', text, at: event.time });
    } else if (event.type === 'tool/call') {
      const name = event.data && event.data.name;
      if (name) rows.push({ role: 'tool', text: String(name), at: event.time });
    }
  }
  return rows;
}

/** 解析认单决定：第一行出现「接单 / 不接」即认定。 */
function parseBid(text) {
  const head = String(text || '').trimStart().slice(0, 40);
  const normalised = head.replace(/[【】\[\]（）()\s]/g, '');
  const decline = normalised.startsWith('不接') || /decline|pass/i.test(normalised);
  if (decline) return 'decline';
  const accept = normalised.startsWith('接单') || /accept|take/i.test(normalised);
  if (accept) return 'accept';
  return 'unclear';
}

export function apply(ctx, config = {}) {
  const logger = ctx.logger ?? console;
  const companyName =
    typeof config.companyName === 'string' && config.companyName.trim() ? config.companyName.trim() : '我的公司';
  const bidTimeoutMs = Number.isFinite(config.bidTimeoutMs) && config.bidTimeoutMs > 0 ? config.bidTimeoutMs : BID_TIMEOUT_MS;
  const workTimeoutMs =
    Number.isFinite(config.workTimeoutMs) && config.workTimeoutMs > 0 ? config.workTimeoutMs : WORK_TIMEOUT_MS;
  const repoUrl =
    typeof config.repoUrl === 'string' && config.repoUrl.trim()
      ? config.repoUrl.trim()
      : 'https://github.com/makooslee/dsh-company';
  const sponsorText =
    typeof config.sponsorText === 'string' && config.sponsorText.trim() ? config.sponsorText.trim() : DEFAULT_SPONSOR_TEXT;
  const sponsorImagePath =
    typeof config.sponsorImage === 'string' && config.sponsorImage.trim()
      ? config.sponsorImage.trim()
      : 'docs/sponsor/wechat.png';
  let sponsorReady = false;
  let pluginVersion = '';

  /** @type {Map<string, object>} 花名册 */
  const employees = new Map();
  /** @type {Map<string, object>} 任务 */
  const missions = new Map();
  /** @type {Map<string, {abort: AbortController}>} 任务运行时 */
  const missionRuntime = new Map();
  /** @type {Map<string, {handle: object, agent: object, fingerprint: string, status: string, sessionId: string}>} 员工运行时 */
  const runtimes = new Map();

  let store = null;
  let storeReady = null;
  let disposed = false;
  let modelCache = null;
  let modelCacheAt = 0;

  // ── 持久化 ───────────────────────────────────────────────────────────────
  function openStore() {
    if (storeReady) return storeReady;
    storeReady = (async () => {
      const storage = ctx.get('storage');
      if (!storage || !storage.backend) return null;
      let backend;
      try {
        backend = storage.backend.get('json');
      } catch {
        return null;
      }
      try {
        // version 保持 1：storage-json 用 acceptedStamps 判定记录归属，
        // 改 version 会让旧 employees/missions 记录整批作废。
        // 新增 memories 表是同一版本内的加表，不影响既有记录。
        return await backend.kv.open({
          name: STORE_UNIT,
          version: 1,
          tables: ['employees', 'missions', MEMORY_TABLE],
          layout: 'per-record',
        });
      } catch (error) {
        logger.warn?.(`dsh-company: storage unavailable (${error?.message ?? error}); using memory only`);
        return null;
      }
    })();
    return storeReady;
  }

  function saveEmployee(employee) {
    if (!store) return;
    Promise.resolve(store.putRecord('employees', employee.id, employee)).catch(() => {});
  }

  function saveMission(mission) {
    if (!store) return;
    const { events, results, ...rest } = mission;
    void events;
    void results;
    Promise.resolve(store.putRecord('missions', mission.id, mission)).catch(() => {});
  }

  async function restore() {
    const unit = await openStore();
    if (!unit) return;
    store = unit;
    try {
      const state = await unit.loadAll();
      const rowsOf = (table) => {
        const rows = state && state.tables ? (state.tables.get ? state.tables.get(table) : state.tables[table]) : undefined;
        if (!rows) return [];
        if (rows instanceof Map) return [...rows.values()];
        if (Array.isArray(rows)) return rows;
        return Object.values(rows);
      };
      for (const row of rowsOf('employees')) {
        if (row && typeof row.id === 'string') employees.set(row.id, row);
      }
      for (const row of rowsOf('missions')) {
        if (row && typeof row.id === 'string') {
          if (row.status === 'bidding' || row.status === 'working') row.status = 'interrupted';
          missions.set(row.id, row);
        }
      }
      for (const row of rowsOf(MEMORY_TABLE)) {
        if (row && typeof row.id === 'string' && typeof row.employeeId === 'string') {
          pushMemoryEntry(row);
        }
      }
    } catch (error) {
      logger.warn?.(`dsh-company: restore failed (${error?.message ?? error})`);
    }
  }

  // ── 每名员工的独立记忆目录 ───────────────────────────────────────────────
  // 目录结构（DSH home 下）：
  //   dsh-company/employees/<employeeId>/memory.md        人类可读的追加式记忆
  //   dsh-company/employees/<employeeId>/memory/<id>.json  结构化单条记忆
  // 同一份内容也进 storage 的 memories 表，方便面板读取与跨目录备份。
  const memoryEntries = new Map();

  function memoryRoot() {
    const dshHomePath = ctx.get('dshHomePath');
    if (typeof dshHomePath === 'function') {
      try {
        return String(dshHomePath(MEMORY_HOME_DIR, 'employees'));
      } catch {
        /* 落到 homedir 兜底 */
      }
    }
    return resolve(homedir(), '.dsh', MEMORY_HOME_DIR, 'employees');
  }

  function memoryDirFor(employeeId) {
    const safe = String(employeeId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    return resolve(memoryRoot(), safe);
  }

  function memoryFileFor(employeeId) {
    return resolve(memoryDirFor(employeeId), 'memory.md');
  }

  function memoryEntriesOf(employeeId) {
    return memoryEntries.get(employeeId) || [];
  }

  function pushMemoryEntry(entry) {
    const list = memoryEntries.get(entry.employeeId) || [];
    list.push(entry);
    list.sort((a, b) => (a.at || 0) - (b.at || 0));
    memoryEntries.set(entry.employeeId, list);
    return entry;
  }

  function saveMemoryEntry(entry) {
    if (!store) return;
    Promise.resolve(store.putRecord(MEMORY_TABLE, entry.id, entry)).catch(() => {});
  }

  function memoryMarkdown(entry) {
    const stamp = new Date(entry.at || Date.now()).toISOString();
    const label = entry.kind === 'deliver' ? '交付' : entry.kind === 'bid' ? '认单' : entry.kind === 'system' ? '系统' : '备注';
    return `## ${stamp} · ${label}\n\n${entry.text}\n`;
  }

  /**
   * 写一条记忆：storage + 员工独立目录（memory.md 与单条 json）。
   * 目录写失败不影响主流程（记忆仍留在 storage）。
   */
  async function appendMemory(employeeId, kind, text) {
    const body = typeof text === 'string' ? text.trim() : '';
    if (!body) throw new Error('记忆内容不能为空');
    const entry = {
      id: randomUUID(),
      employeeId,
      at: Date.now(),
      kind: MEMORY_KINDS.has(kind) ? kind : 'note',
      text: body,
    };
    pushMemoryEntry(entry);
    saveMemoryEntry(entry);
    try {
      const dir = memoryDirFor(employeeId);
      await mkdir(resolve(dir, 'memory'), { recursive: true });
      await writeFile(resolve(dir, 'memory', `${entry.id}.json`), `${JSON.stringify(entry, null, 2)}\n`, 'utf8');
      await appendFile(memoryFileFor(employeeId), memoryMarkdown(entry), 'utf8');
    } catch (error) {
      logger.warn?.(`dsh-company: memory file write failed (${error?.message ?? error})`);
    }
    return entry;
  }

  /** 供 system prompt 动态注入：最近的记忆摘要。 */
  function memoryDigest(employeeId, limit = 8) {
    const list = memoryEntriesOf(employeeId);
    if (list.length === 0) return '';
    const recent = list.slice(-limit);
    const lines = recent.map((entry) => {
      const stamp = new Date(entry.at || Date.now()).toISOString().slice(0, 16).replace('T', ' ');
      const label = entry.kind === 'deliver' ? '交付' : entry.kind === 'bid' ? '认单' : entry.kind === 'system' ? '系统' : '备注';
      return `- [${stamp} ${label}] ${truncate(entry.text, 240)}`;
    });
    return ['## 你自己的记忆（只属于你，不要向同事透露）', ...lines].join('\n');
  }

  // ── Agent Teams 镜像（让官方 agent-team 面板看到「谁在干什么」） ──────────
  // 官方 agent-team 面板读的是当前会话日志里 team/member 与 team/task 事件
  // 折叠出来的投影。我们把员工与任务镜像成这两类事件写进 CEO 所在的会话，
  // 面板里就能直接看到谁在干什么；事件写在哪个会话，就只影响哪个会话。
  const mirrorMembers = new Map(); // sessionId -> Map<memberId, {name, description, provider, phase}>
  const mirrorTasks = new Map(); // taskId -> 已写入的 revision
  let mirrorSessionId = '';

  /** 找到 CEO 当前所在的会话（命令/派单时记住，后续镜像都写这里）。 */
  function rememberMirrorSession(agent) {
    const usable = (candidate) =>
      candidate && candidate.session && typeof candidate.session.append === 'function' ? candidate.session : undefined;
    const remember = (candidate) => {
      const session = usable(candidate);
      if (!session) return undefined;
      mirrorSessionId = session.id;
      return session;
    };
    try {
      const found = remember(agent) || remember(ctx.agents.currentInitiator?.());
      if (found) return found;
    } catch {
      /* ignore */
    }
    if (mirrorSessionId) {
      try {
        const session = ctx.sessions.get(mirrorSessionId);
        if (session && typeof session.append === 'function') return session;
      } catch {
        /* ignore */
      }
    }
    // 退而求其次：找当前还活着的根会话（CEO 会话），把镜像写进去。
    try {
      const roots = ctx.agents.roots?.() || [];
      for (const root of roots) {
        const found = remember(root);
        if (found) return found;
      }
    } catch {
      /* ignore */
    }
    return undefined;
  }

  /** 追加一条 team 事件；失败只记日志，不影响主流程。 */
  function appendTeamEvent(type, payload, agent) {
    const session = rememberMirrorSession(agent);
    if (!session) return false;
    try {
      session.append(type, payload);
      Promise.resolve(ctx.sessions.flush?.(session)).catch(() => {});
      return true;
    } catch (error) {
      logger.warn?.(`dsh-company: team mirror append failed (${error?.message ?? error})`);
      return false;
    }
  }

  /** 成员名在同一个会话里必须唯一（投影对重名会直接失败），冲突时加后缀。 */
  function mirrorMemberName(sessionId, memberId, employee) {
    const table = mirrorMembers.get(sessionId) || new Map();
    const taken = new Set([...table.values()].map((item) => item.name));
    let name = employee.name;
    if (taken.has(name)) {
      const titled = `${employee.name}（${employee.title || employee.role}）`;
      name = taken.has(titled) ? `${employee.name} #${table.size + 1}` : titled;
    }
    return name;
  }

  /**
   * 把员工镜像成 team/member。投影要求 provisioning → active 两步，
   * 且 name/provider/context 一经写入不可更改，所以这里先记下身份字段。
   */
  function mirrorEmployeeMember(employee, agentSessionId, agent) {
    if (!agentSessionId) return;
    const session = rememberMirrorSession(agent);
    if (!session) return;
    const key = session.id;
    const table = mirrorMembers.get(key) || new Map();
    mirrorMembers.set(key, table);
    let entry = table.get(agentSessionId);
    if (!entry) {
      entry = {
        name: mirrorMemberName(key, agentSessionId, employee),
        description: `${employee.title || employee.role}`,
        provider: employee.provider || 'company',
        phase: 'provisioning',
      };
      table.set(agentSessionId, entry);
      const ok = appendTeamEvent(
        'team/member',
        {
          version: 2,
          teamId: key,
          member: {
            id: agentSessionId,
            name: entry.name,
            description: entry.description,
            provider: entry.provider,
            context: 'fresh',
            phase: 'provisioning',
          },
        },
        agent,
      );
      if (!ok) return;
    }
    if (entry.phase !== 'provisioning') return;
    const ok = appendTeamEvent(
      'team/member',
      {
        version: 2,
        teamId: key,
        member: {
          id: agentSessionId,
          name: entry.name,
          description: entry.description,
          provider: entry.provider,
          context: 'fresh',
          phase: 'active',
        },
      },
      agent,
    );
    if (ok) entry.phase = 'active';
  }

  function mirrorTaskId(missionId, employeeId) {
    return `company-${missionId}-${employeeId}`;
  }

  /**
   * 把「某员工在某任务里的进展」镜像成 team/task。
   * 官方 TaskCard 会显示 description 全文与 ownerName，这正是「谁在干什么」。
   */
  function mirrorMissionTask(mission, employee, status, description, agent) {
    const session = rememberMirrorSession(agent);
    if (!session) return;
    const key = session.id;
    const id = mirrorTaskId(mission.id, employee.id);
    const revision = mirrorTasks.get(id) || 0;
    const ownerId = runtimes.get(employee.id)?.sessionId || '';
    const task = {
      id,
      revision: revision + 1,
      subject: mission.title,
      description,
      status,
      blockedBy: [],
      writeScopes: [],
    };
    if (ownerId) task.ownerId = ownerId;
    const ok = appendTeamEvent('team/task', { version: 2, teamId: key, task }, agent);
    if (ok) mirrorTasks.set(id, revision + 1);
  }

  /** 任务被删除时，把镜像任务标成 deleted（官方投影会把它折叠掉）。 */
  function mirrorRemoveMission(mission, agent) {
    const session = rememberMirrorSession(agent);
    if (!session) return;
    for (const employeeId of mission.employeeIds || []) {
      const employee = employees.get(employeeId);
      if (!employee) continue;
      mirrorMissionTask(mission, employee, 'deleted', '任务已删除', agent);
    }
  }

  // ── 模型目录（与 DSH 自己的模型选择同一份来源） ──────────────────────────
  async function listModels(force) {
    const now = Date.now();
    if (!force && modelCache && now - modelCacheAt < MODEL_CACHE_MS) return modelCache;
    const llm = ctx.get('llm');
    const result = { providers: [], models: [] };
    if (llm && typeof llm.listProviders === 'function') {
      let providers = [];
      try {
        providers = llm.listProviders() || [];
      } catch {
        providers = [];
      }
      result.providers = providers.map((provider) => ({ id: provider.id, name: provider.name || provider.id }));
      for (const provider of providers) {
        try {
          const models = await llm.listModels(provider.id);
          for (const model of models || []) {
            result.models.push({
              provider: provider.id,
              id: model.id,
              name: model.name || model.id,
              description: model.description || '',
            });
          }
        } catch {
          /* 单个 provider 不可用时跳过 */
        }
      }
    }
    modelCache = result;
    modelCacheAt = now;
    return result;
  }

  function defaultSelection() {
    try {
      const service = ctx.get('agentDefaultModel');
      const current = service && service.currentSelection ? service.currentSelection() : undefined;
      if (current && current.provider && current.model) return { provider: current.provider, model: current.model };
    } catch {
      /* 无默认模型 */
    }
    return undefined;
  }

  // ── 技能库 ───────────────────────────────────────────────────────────────
  function availableTools() {
    try {
      const schemas = ctx.tools.schemas ? ctx.tools.schemas() : [];
      return (schemas || [])
        .filter((schema) => schema && typeof schema.name === 'string' && schema.name !== 'run_code')
        .map((schema) => ({ name: schema.name, description: schema.description || '' }));
    } catch {
      return [];
    }
  }

  // ── 赞赏码：包内图片由 Host 直接伺服，不依赖外链 ─────────────────────────
  async function loadSponsorImage() {
    const target = resolve(PACKAGE_DIR, sponsorImagePath);
    if (!target.startsWith(PACKAGE_DIR)) throw new Error('sponsor image must stay inside the package');
    const type = IMAGE_TYPES[extname(target).toLowerCase()];
    if (!type) throw new Error('unsupported sponsor image type');
    return { type, bytes: await readFile(target) };
  }

  async function probeSponsor() {
    try {
      await loadSponsorImage();
      sponsorReady = true;
    } catch {
      sponsorReady = false;
    }
    try {
      const manifest = JSON.parse(await readFile(resolve(PACKAGE_DIR, 'package.json'), 'utf8'));
      pluginVersion = typeof manifest.version === 'string' ? manifest.version : '';
    } catch {
      pluginVersion = '';
    }
  }

  // ── 花名册 ───────────────────────────────────────────────────────────────
  function normalizeEmployee(input) {
    const source = input && typeof input === 'object' ? input : {};
    const roleId = typeof source.role === 'string' && ROLE_BY_ID.has(source.role) ? source.role : 'engineer';
    const role = ROLE_BY_ID.get(roleId);
    const skills = Array.isArray(source.skills)
      ? [...new Set(source.skills.filter((name) => typeof name === 'string' && name))]
      : [...role.skills];
    const trimmed = (value, fallback) => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
    return {
      id: trimmed(source.id, '') || randomUUID(),
      name: trimmed(source.name, role.name),
      role: roleId,
      title: trimmed(source.title, role.title),
      persona: trimmed(source.persona, role.persona),
      skills,
      provider: trimmed(source.provider, ''),
      model: trimmed(source.model, ''),
      createdAt: typeof source.createdAt === 'number' ? source.createdAt : Date.now(),
      lastReport: typeof source.lastReport === 'string' ? source.lastReport : '',
      currentMissionId: typeof source.currentMissionId === 'string' ? source.currentMissionId : '',
    };
  }

  function seedRoles() {
    // 逐角色补缺：花名册里已有该角色（含已解雇的记录）就不再重复 seed。
    // 老版本只 seed 过 4 个角色，这样后续版本新增的内置角色能自动补齐。
    const present = new Set([...employees.values()].map((employee) => employee.role));
    for (const role of ROLE_TEMPLATES) {
      if (present.has(role.id)) continue;
      const employee = normalizeEmployee({ role: role.id, name: role.name });
      employees.set(employee.id, employee);
      saveEmployee(employee);
    }
  }

  // 在岗员工（解雇是标记而非删除，避免下个版本把被解雇的人又 seed 回来）
  function activeEmployees() {
    return [...employees.values()].filter((employee) => !employee.fired);
  }

  function publicEmployee(employee) {
    const runtime = runtimes.get(employee.id);
    const role = ROLE_BY_ID.get(employee.role);
    return {
      ...employee,
      skills: Array.isArray(employee.skills) ? [...employee.skills] : [],
      roleName: role ? role.name : employee.role,
      accent: role ? role.accent : '#4C8DFF',
      status: runtime ? runtime.status : 'idle',
      sessionId: runtime ? runtime.sessionId : '',
      activity: activityOf(employee),
      memoryPath: memoryDirFor(employee.id),
      memoryEntries: memoryEntriesOf(employee.id).length,
    };
  }

  /** 员工此刻在干什么：认单 / 执行 / 空闲。 */
  function activityOf(employee) {
    const mission = employee.currentMissionId ? missions.get(employee.currentMissionId) : undefined;
    if (mission) {
      const slot = (mission.results || []).find((item) => item.employeeId === employee.id);
      if (slot) {
        if (slot.bid === 'thinking') return `正在认单：${mission.title}`;
        if (slot.status === 'running') return `正在执行：${mission.title}`;
        if (slot.status === 'done') return `已交付：${mission.title}`;
      }
      return `参与任务：${mission.title}`;
    }
    const runtime = runtimes.get(employee.id);
    if (runtime && runtime.status === 'running') return '工作中';
    return '空闲';
  }

  function rosterText(excludeId) {
    return activeEmployees()
      .filter((employee) => employee.id !== excludeId)
      .map((employee) => `- ${employee.name}（${employee.title || employee.role}）`)
      .join('\n');
  }

  // ── 员工智能体 ───────────────────────────────────────────────────────────
  function fingerprintOf(employee) {
    return JSON.stringify([employee.title, employee.persona, employee.skills, employee.provider, employee.model]);
  }

  function agentOptionsFor(employee) {
    const fallback = defaultSelection();
    const provider = employee.provider || (fallback ? fallback.provider : '');
    const model = employee.model || (fallback ? fallback.model : '');
    if (!provider || !model) return undefined;
    return { provider, model };
  }

  async function spawnEmployeeAgent(employee) {
    const known = new Set(availableTools().map((tool) => tool.name));
    const allow = employee.skills.filter((name) => known.has(name));
    const persona = employee.persona;
    const title = employee.title;
    const displayName = employee.name;
    const sessionId = randomUUID();

    const handle = await ctx.agents.create({
      sessionId,
      meta: config.cwd ? { cwd: String(config.cwd) } : {},
      agentOptions: agentOptionsFor(employee),
      setup(agentCtx) {
        try {
          const base = agentCtx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_PREFIX');
          agentCtx.systemPrompt.section({
            name: `company:persona:${employee.id}`,
            order: base + 1,
            text:
              `你在「${companyName}」工作。你的名字是「${displayName}」，职位是${title}。` +
              '你是 CEO 下属的一名员工智能体，在自己的独立会话里工作。' +
              '团队派活时，先用你收到的任务内容判断该不该你接：不在职责范围内、或者有更合适的人，就明确不接并指出该谁接。' +
              `接下的活要独立完成，最后用一段可直接汇报给 CEO 的结论收尾。\n\n${persona}`,
          });
          // 记忆是动态的：每次装配 system prompt 时重新求值，员工的记忆立刻可见。
          agentCtx.systemPrompt.section({
            name: `company:memory:${employee.id}`,
            order: base + 2,
            text: () => memoryDigest(employee.id),
          });
        } catch (error) {
          logger.warn?.(`dsh-company: persona injection failed (${error?.message ?? error})`);
        }
        if (allow.length > 0) {
          try {
            agentCtx.tools.restrict({ allow });
          } catch (error) {
            logger.warn?.(`dsh-company: tool restriction failed (${error?.message ?? error})`);
          }
        }
      },
    });

    return { handle, agent: handle.agent, fingerprint: fingerprintOf(employee), status: 'idle', sessionId };
  }

  async function ensureRuntime(employee) {
    const existing = runtimes.get(employee.id);
    if (existing && existing.fingerprint === fingerprintOf(employee)) return existing;
    if (existing) {
      runtimes.delete(employee.id);
      try {
        await existing.handle.dispose();
      } catch {
        /* 已释放 */
      }
    }
    const runtime = await spawnEmployeeAgent(employee);
    runtimes.set(employee.id, runtime);
    return runtime;
  }

  function userMessage(text) {
    return { id: randomUUID(), role: 'user', content: [{ type: 'text', text }], source: { kind: 'user' } };
  }

  function bidPrompt(mission, employee) {
    return [
      `# 团队任务派发：${mission.title}`,
      '',
      mission.brief || '（CEO 没写额外说明。）',
      '',
      '## 你是',
      `${employee.name}，${employee.title || employee.role}。`,
      '',
      '## 公司在编（判断归属时参考）',
      rosterText(employee.id) || '（暂无其他同事）',
      '',
      '## 先做一个决定',
      '这活该不该你接？依据：职责范围、你是否能独立完成、团队里是否有更合适的人。',
      '第一行必须只写下面二者之一，前后不要加任何其他字符：',
      '【接单】',
      '【不接】',
      '第二行起写理由，2-4 行。若选择不接，请明确写出你认为该由谁接。',
    ].join('\n');
  }

  function workPrompt(mission, employee, accepted) {
    const mates =
      accepted
        .filter((item) => item.employeeId !== employee.id)
        .map((item) => `- ${item.name}（${item.roleName}）：${truncate(item.bidReason || '已接单', 120)}`)
        .join('\n') || '（这活只有你一个人接）';
    return [
      `# 你已接单：${mission.title}`,
      '',
      mission.brief || '（CEO 没写额外说明。）',
      '',
      '## 同期接单的同事',
      mates,
      '',
      '## 现在开始干活',
      '独立完成你职责范围内的那部分，不要重复同事的活；如果必须有人配合，就在结论里写清要谁配合什么。',
      '最后用一段可直接汇报给 CEO 的结论收尾。',
    ].join('\n');
  }

  async function turnOnce(runtime, text, timeoutMs, label) {
    const session = runtime.agent.session;
    let fromSeq = 0;
    try {
      fromSeq = typeof session.seq === 'number' ? session.seq : 0;
    } catch {
      fromSeq = 0;
    }
    runtime.agent.followup(userMessage(text));
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline && runtime.agent.status !== 'running') await sleep(40);
    while (Date.now() < deadline && runtime.agent.status === 'running') await sleep(250);
    if (runtime.agent.status === 'running') throw new Error(`${label}超过 ${Math.round(timeoutMs / 60000)} 分钟仍未结束`);
    return collectTurn(session, fromSeq);
  }

  function pushEvent(mission, event) {
    mission.events.push({ id: randomUUID(), at: Date.now(), ...event });
    mission.events = mission.events.slice(-400);
    saveMission(mission);
  }

  async function runBid(mission, employee, controller) {
    const slot = mission.results.find((item) => item.employeeId === employee.id);
    const mark = (patch) => {
      if (slot) Object.assign(slot, patch);
      saveMission(mission);
    };
    mark({ bid: 'thinking', startedAt: Date.now() });

    let runtime;
    try {
      runtime = await ensureRuntime(employee);
      if (controller.signal.aborted) throw new Error('任务已取消');
      runtime.status = 'running';
      employee.currentMissionId = mission.id;
      saveEmployee(employee);
      mirrorEmployeeMember(employee, runtime.sessionId, controller.agent);
      mirrorMissionTask(mission, employee, 'in_progress', `${employee.name} 正在认单：${mission.title}`, controller.agent);

      const turn = await turnOnce(runtime, bidPrompt(mission, employee), bidTimeoutMs, '认单');
      if (turn.error && !turn.text) throw new Error(turn.error);

      const verdict = parseBid(turn.text);
      const accepted = verdict !== 'decline';
      mark({
        bid: accepted ? 'accept' : 'decline',
        bidVerdict: verdict,
        bidReason: truncate(turn.text, 400),
        bidOutput: turn.text,
      });
      pushEvent(mission, {
        employeeId: employee.id,
        name: employee.name,
        roleName: employee.title || employee.role,
        accent: ROLE_BY_ID.get(employee.role)?.accent ?? '#4C8DFF',
        kind: accepted ? 'accept' : 'decline',
        text: turn.text,
      });
      mirrorMissionTask(
        mission,
        employee,
        accepted ? 'in_progress' : 'completed',
        accepted
          ? `${employee.name} 接了单：${truncate(turn.text, 120)}`
          : `${employee.name} 拒绝接单：${truncate(turn.text, 120)}`,
        controller.agent,
      );
      if (accepted) {
        await appendMemory(employee.id, 'bid', `${mission.title}\n${truncate(turn.text, 600)}`).catch(() => {});
      }
      return accepted;
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      mark({ bid: 'error', bidReason: message, error: message });
      pushEvent(mission, {
        employeeId: employee.id,
        name: employee.name,
        roleName: employee.title || employee.role,
        accent: ROLE_BY_ID.get(employee.role)?.accent ?? '#4C8DFF',
        kind: 'error',
        text: message,
      });
      return false;
    } finally {
      if (runtime) runtime.status = 'idle';
      employee.currentMissionId = '';
      saveEmployee(employee);
    }
  }

  async function runWork(mission, employee, accepted, controller) {
    const slot = mission.results.find((item) => item.employeeId === employee.id);
    const mark = (patch) => {
      if (slot) Object.assign(slot, patch);
      saveMission(mission);
    };
    mark({ status: 'running', startedAt: Date.now() });

    let runtime;
    try {
      runtime = await ensureRuntime(employee);
      if (controller.signal.aborted) throw new Error('任务已取消');
      runtime.status = 'running';
      employee.currentMissionId = mission.id;
      saveEmployee(employee);
      mirrorEmployeeMember(employee, runtime.sessionId, controller.agent);
      mirrorMissionTask(mission, employee, 'in_progress', `${employee.name} 正在执行：${mission.title}`, controller.agent);

      const turn = await turnOnce(runtime, workPrompt(mission, employee, accepted), workTimeoutMs, '执行');
      if (turn.error && !turn.text) throw new Error(turn.error);
      employee.lastReport = turn.text;
      mark({ status: 'done', output: turn.text, finishedAt: Date.now() });
      pushEvent(mission, {
        employeeId: employee.id,
        name: employee.name,
        roleName: employee.title || employee.role,
        accent: ROLE_BY_ID.get(employee.role)?.accent ?? '#4C8DFF',
        kind: 'deliver',
        text: turn.text,
      });
      mirrorMissionTask(
        mission,
        employee,
        'completed',
        `${employee.name} 已交付：${truncate(turn.text, 160)}`,
        controller.agent,
      );
      await appendMemory(employee.id, 'deliver', `${mission.title}\n${truncate(turn.text, 1200)}`).catch(() => {});
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      mark({ status: controller.signal.aborted ? 'cancelled' : 'failed', error: message, finishedAt: Date.now() });
      pushEvent(mission, {
        employeeId: employee.id,
        name: employee.name,
        roleName: employee.title || employee.role,
        accent: ROLE_BY_ID.get(employee.role)?.accent ?? '#4C8DFF',
        kind: 'error',
        text: message,
      });
    } finally {
      if (runtime) runtime.status = 'idle';
      employee.currentMissionId = '';
      saveEmployee(employee);
    }
  }

  async function runMission(mission, controller) {
    const targets = mission.employeeIds.map((id) => employees.get(id)).filter((employee) => employee && !employee.fired);

    pushEvent(mission, { kind: 'system', name: '系统', text: `任务已下发，${targets.length} 名员工开始认单。` });
    const verdicts = await Promise.all(targets.map((employee) => runBid(mission, employee, controller)));
    if (controller.signal.aborted) {
      mission.status = 'cancelled';
      mission.finishedAt = Date.now();
      saveMission(mission);
      missionRuntime.delete(mission.id);
      return;
    }

    const accepted = mission.results.filter((item) => item.bid === 'accept');
    if (accepted.length === 0) {
      mission.status = 'unclaimed';
      mission.phase = 'closed';
      mission.finishedAt = Date.now();
      pushEvent(mission, { kind: 'system', name: '系统', text: '没人接单。任务关闭，理由见上面各人的回复。' });
      saveMission(mission);
      missionRuntime.delete(mission.id);
      void verdicts;
      return;
    }

    mission.phase = 'working';
    mission.status = 'working';
    saveMission(mission);
    pushEvent(mission, {
      kind: 'system',
      name: '系统',
      text: `${accepted.length} 人接单：${accepted.map((item) => item.name).join('、')}；其余 ${targets.length - accepted.length} 人不接。`,
    });

    await Promise.allSettled(
      accepted.map((item) => {
        const employee = employees.get(item.employeeId);
        return employee ? runWork(mission, employee, accepted, controller) : Promise.resolve();
      }),
    );

    mission.status = controller.signal.aborted ? 'cancelled' : 'done';
    mission.phase = 'closed';
    mission.finishedAt = Date.now();
    pushEvent(mission, { kind: 'system', name: '系统', text: '任务结束。' });
    saveMission(mission);
    missionRuntime.delete(mission.id);
  }

  function publicMission(mission) {
    return {
      id: mission.id,
      title: mission.title,
      brief: mission.brief,
      status: mission.status,
      phase: mission.phase || 'bidding',
      error: mission.error || '',
      createdAt: mission.createdAt,
      finishedAt: mission.finishedAt || 0,
      employeeIds: [...mission.employeeIds],
      results: (mission.results || []).map((item) => ({ ...item })),
      events: (mission.events || []).map((item) => ({ ...item })),
    };
  }

  // ── 调度动作（单一实现：HTTP 与 agent tool 共用） ────────────────────────
  const service = {
    state() {
      return {
        companyName,
        employees: activeEmployees().map(publicEmployee),
        missions: [...missions.values()].sort((a, b) => b.createdAt - a.createdAt).map(publicMission),
        templates: ROLE_TEMPLATES.map((role) => ({
          id: role.id,
          name: role.name,
          title: role.title,
          accent: role.accent,
          persona: role.persona,
          skills: role.skills,
        })),
        tools: availableTools(),
        defaultModel: defaultSelection() || null,
        links: {
          repo: repoUrl,
          sponsorImage: sponsorReady ? SPONSOR_ROUTE : '',
          sponsorText,
          version: pluginVersion,
        },
        version: pluginVersion,
      };
    },

    async models(force) {
      return listModels(force === true);
    },

    async transcript(id) {
      const employee = employees.get(id);
      if (!employee) throw new Error('找不到这名员工');
      const runtime = runtimes.get(id);
      if (!runtime) {
        return { employeeId: id, name: employee.name, sessionId: '', messages: [], status: 'idle' };
      }
      const messages = transcriptOf(runtime.agent.session);
      return {
        employeeId: id,
        name: employee.name,
        sessionId: runtime.sessionId,
        status: runtime.status,
        messages,
      };
    },

    hire(input) {
      const employee = normalizeEmployee(input);
      const previous = employees.get(employee.id);
      if (previous) employee.createdAt = previous.createdAt;
      employees.set(employee.id, employee);
      saveEmployee(employee);
      return publicEmployee(employee);
    },

    async fire(id) {
      if (typeof id !== 'string' || !employees.has(id)) throw new Error('找不到这名员工');
      // 解雇 = 打标记 + 下岗，不物理删记录：seed 逻辑靠记录区分「没招过」和「被解雇」
      const employee = employees.get(id);
      employee.fired = true;
      saveEmployee(employee);
      const runtime = runtimes.get(id);
      if (runtime) {
        runtimes.delete(id);
        try {
          await runtime.handle.dispose();
        } catch {
          /* ignore */
        }
      }
      return { id };
    },

    dispatch(input) {
      const source = input && typeof input === 'object' ? input : {};
      const title = typeof source.title === 'string' ? source.title.trim() : '';
      if (!title) throw new Error('任务标题不能为空');
      const rawIds = Array.isArray(source.employeeIds) ? source.employeeIds : [];
      const employeeIds = [...new Set(rawIds.filter((id) => {
        if (typeof id !== 'string') return false;
        const employee = employees.get(id);
        return Boolean(employee) && !employee.fired;
      }))];
      if (employeeIds.length === 0) throw new Error('至少要通知一名员工');
      const mission = {
        id: randomUUID(),
        title,
        brief: typeof source.brief === 'string' ? source.brief : '',
        employeeIds,
        status: 'bidding',
        phase: 'bidding',
        error: '',
        createdAt: Date.now(),
        finishedAt: 0,
        events: [],
        results: employeeIds.map((id) => {
          const employee = employees.get(id);
          const role = ROLE_BY_ID.get(employee.role);
          return {
            employeeId: id,
            name: employee.name,
            roleName: employee.title || (role ? role.name : employee.role),
            accent: role ? role.accent : '#4C8DFF',
            bid: 'pending',
            bidVerdict: '',
            bidReason: '',
            bidOutput: '',
            status: 'queued',
            output: '',
            error: '',
            startedAt: 0,
            finishedAt: 0,
          };
        }),
      };
      missions.set(mission.id, mission);
      saveMission(mission);
      const controller = new AbortController();
      // 记下派单者所在的会话：镜像事件写回这个会话，官方 agent-team 面板才看得到。
      if (source.agent && source.agent.session && source.agent.session.id) {
        mirrorSessionId = source.agent.session.id;
        controller.agent = source.agent;
      }
      missionRuntime.set(mission.id, { abort: controller });
      runMission(mission, controller).catch((error) => {
        mission.status = 'failed';
        mission.error = error && error.message ? error.message : String(error);
        saveMission(mission);
        missionRuntime.delete(mission.id);
      });
      return publicMission(mission);
    },

    cancel(id) {
      const mission = missions.get(id);
      if (!mission) throw new Error('找不到这个任务');
      const runtime = missionRuntime.get(id);
      if (runtime) runtime.abort.abort();
      return publicMission(mission);
    },

    /** 删除任务：停掉正在跑的、移除记录，并在官方 agent-team 面板里把镜像任务折叠掉。 */
    remove(input) {
      const source = input && typeof input === 'object' ? input : {};
      const id = typeof source.id === 'string' ? source.id : '';
      const mission = missions.get(id);
      if (!mission) throw new Error('找不到这个任务');
      const runtime = missionRuntime.get(id);
      if (runtime) {
        runtime.abort.abort();
        missionRuntime.delete(id);
      }
      missions.delete(id);
      if (store) Promise.resolve(store.deleteRecord('missions', id)).catch(() => {});
      mirrorRemoveMission(mission, source.agent);
      return { id };
    },

    /** 读取某名员工的独立记忆目录内容。 */
    memory(input) {
      const source = input && typeof input === 'object' ? input : {};
      const employeeId = typeof source.employeeId === 'string' ? source.employeeId : '';
      const employee = employees.get(employeeId);
      if (!employee) throw new Error('找不到这名员工');
      return {
        employeeId,
        name: employee.name,
        path: memoryDirFor(employeeId),
        entries: memoryEntriesOf(employeeId).map((entry) => ({
          id: entry.id,
          at: entry.at,
          kind: entry.kind,
          text: entry.text,
        })),
      };
    },

    /** 给某名员工追加一条记忆（CEO 手动记一笔）。 */
    async appendMemoryNote(input) {
      const source = input && typeof input === 'object' ? input : {};
      const employeeId = typeof source.employeeId === 'string' ? source.employeeId : '';
      const text = typeof source.text === 'string' ? source.text.trim() : '';
      const employee = employees.get(employeeId);
      if (!employee) throw new Error('找不到这名员工');
      if (!text) throw new Error('记忆内容不能为空');
      await appendMemory(employeeId, 'note', text);
      return {
        employeeId,
        name: employee.name,
        path: memoryDirFor(employeeId),
        entries: memoryEntriesOf(employeeId).map((entry) => ({
          id: entry.id,
          at: entry.at,
          kind: entry.kind,
          text: entry.text,
        })),
      };
    },
  };

  // ── HTTP API ─────────────────────────────────────────────────────────────
  function route(path, handler) {
    return ctx.effect(() =>
      ctx.connection.fetch.register({
        path,
        methods: ['POST'],
        requestBody: 'buffered',
        async fetch(request) {
          let body = {};
          try {
            body = await request.json();
          } catch {
            body = {};
          }
          try {
            return ok(await handler(body || {}));
          } catch (error) {
            return fail('bad-request', error && error.message ? error.message : String(error));
          }
        },
      }),
    );
  }

  route('/api/dsh-company/state', () => service.state());
  route('/api/dsh-company/models', (body) => service.models(body.force));
  route('/api/dsh-company/transcript', (body) => service.transcript(body.id));
  route('/api/dsh-company/hire', (body) => service.hire(body));
  route('/api/dsh-company/fire', (body) => service.fire(body.id));
  route('/api/dsh-company/dispatch', (body) => service.dispatch(body));
  route('/api/dsh-company/cancel', (body) => service.cancel(body.id));
  route('/api/dsh-company/remove', (body) => service.remove(body));
  route('/api/dsh-company/memory', (body) =>
    typeof body.text === 'string' && body.text.trim()
      ? service.appendMemoryNote(body)
      : service.memory(body),
  );

  ctx.effect(() =>
    ctx.connection.fetch.register({
      path: SPONSOR_ROUTE,
      methods: ['GET'],
      requestBody: 'buffered',
      async fetch() {
        try {
          const { type, bytes } = await loadSponsorImage();
          return new Response(bytes, {
            headers: { 'content-type': type, 'cache-control': 'public, max-age=60' },
          });
        } catch {
          return new Response('sponsor image not found', { status: 404 });
        }
      },
    }),
  );

  // ── agent 侧入口（与 UI 共用同一实现） ───────────────────────────────────
  try {
    const off = ctx.tools.register({
      name: 'company_dispatch',
      description:
        '把一项任务派给公司团队。任务先由员工各自认单（自己判断该不该接），接单的人再并行开工；不指定员工时默认全员收到派单。返回任务号与已通知成员。',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', description: '一句话的任务标题' },
          brief: { type: 'string', description: '任务说明：背景、要什么、交付标准' },
          employees: { type: 'string', description: '逗号分隔的员工名字；留空表示全员' },
        },
        required: ['title'],
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            missionId: { type: 'string' },
            notified: { type: 'array', items: { type: 'string' } },
          },
          required: ['missionId', 'notified'],
        },
        render(_args, value) {
          const names = Array.isArray(value && value.notified) ? value.notified : [];
          return [{ type: 'text', text: `已派单 ${value && value.missionId}，通知：${names.join('、')}（正在各自认单）` }];
        },
      },
      execute(args, exec) {
        const roster = activeEmployees();
        const wanted = String(args.employees || '')
          .split(/[,，\s]+/)
          .map((item) => item.trim())
          .filter(Boolean);
        const selected =
          wanted.length === 0
            ? roster
            : roster.filter((employee) => wanted.includes(employee.name) || wanted.includes(employee.id));
        const mission = service.dispatch({
          title: args.title,
          brief: args.brief || '',
          employeeIds: selected.map((employee) => employee.id),
          agent: exec && exec.agent,
        });
        return Promise.resolve({ missionId: mission.id, notified: mission.results.map((item) => item.name) });
      },
    });
    ctx.effect(() => off);
  } catch (error) {
    logger.warn?.(`dsh-company: agent tool unavailable (${error?.message ?? error})`);
  }

  // ── 斜杠命令：在当前对话框直接给公司派活 ────────────────────────────────
  // 用法：/dsh-company 标题 | 说明 | 员工A,员工B
  //   只写标题          → 派给全员
  //   标题 | 说明       → 派给全员
  //   标题 | 说明 | 员工 → 只派给指定员工
  // 留空                → 只看当前公司状态
  try {
    const commands = ctx.get('commands');
    const off = commands.register({
      name: 'dsh-company',
      description: '给公司团队派活：/dsh-company 标题 | 说明 | 员工A,员工B（省略员工则派给全员）',
      input: { hint: '标题 | 说明 | 员工A,员工B' },
      handler(invocation) {
        try {
          const raw = String(invocation.rawInput || '').trim();
          if (!raw) {
            const roster = activeEmployees()
              .map((employee) => `- ${employee.name}（${employee.title || employee.role}）：${activityOf(employee)}`)
              .join('\n');
            const running = [...missions.values()].filter((mission) => mission.status === 'bidding' || mission.status === 'working');
            return {
              kind: 'success',
              text: [
                `「${companyName}」当前 ${activeEmployees().length} 名员工：`,
                roster || '- （暂无员工）',
                running.length ? `进行中的任务：${running.map((mission) => mission.title).join('、')}` : '进行中的任务：无',
                '用法：/dsh-company 标题 | 说明 | 员工A,员工B',
              ].join('\n'),
            };
          }
          const parts = raw.split('|').map((part) => part.trim());
          const title = parts[0] || '';
          const brief = parts[1] || '';
          const names = (parts[2] || '')
            .split(/[,，、\s]+/)
            .map((item) => item.trim())
            .filter(Boolean);
          const roster = activeEmployees();
          const selected =
            names.length === 0
              ? roster
              : roster.filter((employee) => names.includes(employee.name) || names.includes(employee.id));
          if (selected.length === 0) throw new Error(`没找到叫「${names.join('、')}」的员工`);
          const mission = service.dispatch({
            title,
            brief,
            employeeIds: selected.map((employee) => employee.id),
            agent: invocation.agent,
          });
          return {
            kind: 'success',
            text: `已派单「${mission.title}」，通知 ${selected.length} 名员工：${selected.map((employee) => employee.name).join('、')}。他们正在各自认单，接单的人会并行开工。`,
          };
        } catch (error) {
          return { kind: 'error', text: error && error.message ? error.message : String(error) };
        }
      },
    });
    ctx.effect(() => off);
  } catch (error) {
    logger.warn?.(`dsh-company: slash command unavailable (${error?.message ?? error})`);
  }

  // ── 生命周期 ─────────────────────────────────────────────────────────────
  ctx.effect(() => () => {
    disposed = true;
    for (const runtime of missionRuntime.values()) runtime.abort.abort();
    missionRuntime.clear();
    for (const runtime of runtimes.values()) {
      try {
        if (runtime.agent && runtime.agent.cancel) runtime.agent.cancel({ kind: 'disposed' });
      } catch {
        /* ignore */
      }
      Promise.resolve(runtime.handle && runtime.handle.dispose ? runtime.handle.dispose() : undefined).catch(() => {});
    }
    runtimes.clear();
    if (store && typeof store.close === 'function') Promise.resolve(store.close()).catch(() => {});
    store = null;
  });

  (async () => {
    await probeSponsor();
    await restore();
    if (disposed) return;
    seedRoles();
  })().catch((error) => {
    logger.warn?.(`dsh-company: init failed (${error?.message ?? error})`);
    seedRoles();
  });
}
