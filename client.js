/**
 * dsh-company — Client half.
 *
 * 四个视图：
 *  1) 员工管理：员工的身份证（人设）、职位、模型、技能；点人可看这名员工的完整对话记录。
 *  2) 任务板：派单后团队按「认单 → 执行」汇成一条时间线，像群聊一样读。
 *  3) 工作流：把员工串成一条有向图，一键按顺序跑完。
 *  4) 招聘/编辑：模型来自 Host 的真实模型目录（与 DSH 自己的模型选择同源）。
 *
 * 只依赖浏览器模块表里的 react；控件自写；样式只用宿主 --dsw-alias-* token。
 */
window.__ModuleLoader__.load({
  id: 'dsh-company',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useMemo, useRef, useCallback } = React;

    const NS = 'dsh-company';
    const EMPTY = [];

    const DICT = {
      zh: {
        quantPeople:'已聘员工',quantPeopleHint:'员工活动来自公司任务、固定流程和群聊记录；下方 TradingAgents 遥测不是员工执行记录。',quantNoPeople:'尚无已聘员工，或员工名单尚未载入。',quantIdle:'暂无进行中的工作记录',quantLastResult:'最近有依据的结果',quantNoResult:'暂无结果记录',quantOwner:'遥测负责人',quantUnassigned:'未分配',quantSaveOwners:'保存负责人分配',quantOwnerHint:'负责人只是职责映射，不会启动员工、不代表员工执行了扫描。上游事件不会触发员工动效。',quantOwnersUnavailable:'此宿主尚不支持保存负责人。',quantOwnerInvalid:'所选员工已不在当前名单，请重新选择。',quantSource_company:'公司任务',quantSource_fixed:'固定流程',quantSource_group:'群聊任务',quantTelemetry:'TradingAgents 原始遥测',quantRosterError:'员工状态读取失败；显示的旧记录不代表当前状态。',quantOwnersSaved:'负责人已保存',
        quantPlay:'播放真实记录',quantPause:'暂停',quantReset:'重置回放',quantFollow:'跟随最新记录',quantArchive:'历史记录回放 · 非实时执行',quantEventFeed:'真实事件流',quantNoEvents:'尚无事件。不会自动生成演示活动。',quantReplayReady:'点击播放，逐条回放已记录的事件。',quantBeijing:'北京时间',quantSnapshotDetails:'展开快照指标',quantLiveEvents:'只读事件更新 · 首次加载不冒充新活动',
        quantFlow:'证据处理链',quantFlowHint:'固定职责顺序示意，不代表数据已经通过；状态取自当前快照。',quantLog:'最近活动记录',quantLogHint:'每角色仅展示当前快照中的最近一次活动，不是完整历史日志。',quantNoLog:'没有实际活动时间可供排序。',
        quantSessionMorning:'上午盘',quantSessionAfternoon:'下午盘',quantSessionLunch:'午间休市',quantSessionClosed:'休市',
        quantStatus_idle:'空闲',quantStatus_running:'处理中',quantStatus_done:'本次处理完成',quantStatus_blocked:'阻塞',quantStatus_stale:'陈旧',quantStatus_unknown:'未知',quantDelivery:'通知出站箱',quantDryRun:'演练模式，不发送邮件',quantEligible:'符合条件',quantDelivered:'记录的投递数',quantSession:'时段',quantSource:'来源',
        quantTab: "量化作战室",
        quantSubtitle: "看见数据、判断与阻塞，不发出交易指令",
        quantReadOnly: "仅观测 · 无下单操作 · 无收益目标",
        quantMode: "数据模式",
        quantReplay: "回放",
        quantSimulation: "模拟",
        quantLive: "只读实时",
        quantUnknown: "未知 / 未提供",
        quantHeartbeat: "最近实际活动上报",
        quantFreshness: "行情时间",
        quantProcessing: "正在处理",
        quantCounts: "处理计数",
        quantBlocked: "阻塞原因",
        quantReported: "上报状态",
        quantSnapshot: "快照时间",
        quantMissing: "该角色尚无状态上报。",
        quantError: "状态读取失败，旧数据不代表当前在线。",
        quantUnavailable: "尚未接入量化状态源。不会展示模拟在线信号。",
        quantRefresh: "刷新状态",
        quantDataRole: "行情质检",
        quantSentimentRole: "情绪题材",
        quantOrderbookRole: "盘口候选",
        quantRiskRole: "风控审核",
        quantNotificationRole: "通知投递",
        quantAgo: "秒前",
        quantFuture: "时间戳领先本机，请检查时钟",
        quantOffline: "未收到快照",
        quantHealthNote: "活动上报不是独立心跳。数据时间与接收时间不是同一概念；回放的历史数据不会被标记为实时。缺失指标不会被推断为正常。",

        intakeBoundaries:'范围与禁区（可选）',intakeChecks:'具体验收检查（可选）',intakeTradeoff:'比较顺序与并行方案（仅在取舍重要时）',intakeRevise:'修改并重新提案',intakeEdit:'载入此方案修改',intakeReject:'拒绝方案',intakeRejected:'已拒绝',intakeDefaultBoundary:'不扩大需求范围，不增加权限。',roomDispatch:'下发任务',roomRecommended:'默认推荐：精简方案。检查验收标准与风险后批准，再开始运行。',fixedRunNow:'运行模板',fixedFreshInput:'本次运行输入',fixedRunHint:'模板复用节点与步骤；每次填写新的任务输入。运行可能产生模型费用和工具操作。',
        roomTitle: "协作工作间",
        roomEyebrow: "COMPANY / WORKSPACE",
        roomMembers: "团队成员",
        roomThreads: "任务会话",
        roomFeed: "协作记录",
        roomReview: "审批与证据",
        roomSource: "以下为任务输入和引擎节点记录，不是员工即时聊天。",
        roomScope: "每个方案是一条任务会话；当前不提供项目权限隔离。",
        roomCompose: "发起新任务",
        roomComposeHint: "描述目标，生成方案后再批准。这里不会直接给员工发送聊天消息。",
        roomOwner: "任务发起人",
        roomEngine: "执行引擎",
        roomWaiting: "等待方案批准与执行，尚无节点记录。",
        roomLive: "宿主状态 · 定期同步",
        roomPlanCount: "公司任务运行中",
        roomDoneCount: "公司任务已完成",
        roomNoMembers: "尚无员工，请先在员工管理中配置。",

        companyOutcome: '验收标准（可选）', companyAcceptedOutcome: '本方案验收标准', companyRisks: '方案风险', companyRetry: '重试同一已批准方案', companyRetryHint: '重试会重新执行同一方案，不是从失败节点继续；可能再次产生模型费用。最多 5 次尝试，由宿主校验。',
        companyAssignments: '阶段与负责人',
        companyMode: "AI 公司", groupMode:"群聊", noActiveWork:"当前没有运行中的步骤", activeWork:"正在处理",
        fixedMode: "固定流程",
        companyIntro: "提交目标 → 比较方案 → 批准指定版本 → 单独开始运行",
        fixedIntro: "打开已有工作流，编辑节点与依赖，重复执行已知流程。",
        companyRules: "当前方案由规则模板生成，不是模型量身制定；请先检查适用性、风险和员工配置。",
        companyBrief: "任务目标与约束",
        companyCreate: "生成待审批方案",
        companyPlans: "方案历史",
        companyEmpty: "还没有方案。描述你希望交付什么，以及限制条件。",
        companyRevision: "版本",
        companyRisk: "风险",
        companyFeasibility: "可行性",
        companyApprove: "批准所选方案与版本",
        companyRun: "开始已批准的运行",
        companySeparate: "批准不会启动执行。预览版使用员工模型做文字交付，可能产生模型费用，不会授予员工已配置的全局工具。",
        companySelected: "已批准方案",
        companyPromote: "保存成功方案为固定流程",
        companyPromoteHint: "保存的是可复用文本流程，不包含当前运行结果。",
        companyCancel: "取消运行",
        companyUnavailable: "当前宿主尚不支持公司方案，请更新后再试。",
        companyBusy: "处理中…",
        companyLegacy: "旧版任务板",
        companyNoRun: "尚无可核验的运行记录。",
        companyAwaiting: "待选择与批准",
        companyApproved: "已批准，尚未运行",
        companyCompleted: "完成",
        companyFailed: "失败",
        companyCancelled: "已取消",
        companyRunning: "运行中",
        companyRunStatus: "引擎运行状态",
        companySelect: "选择方案",
        companyHistoryHint: "切换方案不会批准或运行；新目标会创建独立方案。",

        tabArchitecture: '架构总览',
        architectureTitle: '从目标到交付，看清团队如何协作',
        architectureIntro: '派单与工作流是两条独立执行路径，共用员工、模型与会话能力。',
        architectureCEO: '目标与编排',
        architectureCEOText: '在任务板直接指定负责人，或让团队认单；在工作流中用连线定义先后关系。',
        architectureTeam: '员工执行层',
        architectureTeamText: '每位员工使用自己的角色、模型和工具配置，执行结果保留在会话中。',
        architectureHost: 'Harness 运行层',
        architectureHostText: '宿主提供 AgentLoop、模型适配器、工具和会话；本插件负责派单、节点编排与展示。',
        architectureResults: '结果与状态',
        architectureResultsText: '任务板查看交付与失败记录，工作流查看每个节点的输出。页面定期刷新宿主状态。',
        architectureRoutes: '选择执行路径',
        architectureMissionText: '目标驱动：认单 → 执行 → 汇总。也可指定负责人，跳过认单。',
        architectureWorkflowText: '依赖驱动：开始 → 员工节点 → 下游节点。上游失败时，下游可跳过。',
        architectureSnapshot: '当前工作区快照',
        architectureScope: '这是插件的功能架构，不代表模型推理过程或实时网络拓扑。',
        workflowActive: '执行 / 等待员工',
        workflowGraphMismatch: '草稿与运行快照不一致，或该历史记录没有快照。画布不叠加运行状态；下方计数仍是最近一次运行。',
        workflowLive: '运行态监测',
        workflowHistory: '最近一次运行',
        workflowSettled: '已结束节点',
        workflowWaiting: '等待执行',
        workflowMotion: '连线动效',
        workflowMotionHint: '仅在上游完成、下游执行或等待员工时显示；系统减少动态设置优先。',
        workflowPolling: '状态来自宿主，约每 2.5 秒刷新。粒子表示节点执行或等待员工，不表示 token 或实际网络流量。',
        workflowEdgeLabel: '选择连线',
        title: '公司',
        subtitle: 'CEO 工作台',
        star: 'Star',
        starHint: '给项目点个 Star，比什么都管用。',
        sponsor: '赞赏',
        sponsorTitle: '赞赏支持',
        sponsorThanks: '谢谢你的支持。',
        sponsorDescription: '赞赏完全自愿，不影响插件使用，也不包含额外服务。可使用微信扫描下方二维码；付款前请核对微信展示的收款方及金额。',
        sponsorImageError: '二维码加载失败，请稍后重试。未验证收款账户或到账，请勿仅凭截图付款。',
        tabRoster: '员工管理',
        tabMissions: '任务板',
        hire: '招聘员工',
        edit: '编辑',
        fire: '解雇',
        save: '保存',
        cancel: '取消',
        close: '关闭',
        dispatch: '下发任务',
        dispatching: '派单中…',
        emptyMissions: '还没有任务。写下要什么、勾选要通知的人，点「下发任务」——他们会自己决定接不接。',
        missionTitle: '任务标题',
        missionTitlePh: '例如：把上周的投放数据复盘一遍',
        missionBrief: '任务说明',
        missionBriefPh: '背景、要什么、交付标准。写得越具体，认单认得越准。',
        assignees: '通知谁',
        selectAll: '全选',
        clearAll: '清空',
        assigneeLabel: '指定负责人（可选）',
        assigneeNone: '不指定 · 让大家认单',
        assigneeHint: '填了就跳过认单环节，直接把任务压给这个人，不会被拒单。全员拒单时也会由项目总监强行指派。',
        noAssignee: '至少要通知一名员工',
        noTitle: '请先写任务标题',
        employeeName: '姓名',
        employeeRole: '角色模板',
        employeeTitle: '职位',
        employeePersona: '身份设定（人设）',
        employeePersonaPh: '这位员工是谁、怎么工作、交付什么格式。',
        employeeSkills: '技能（可用的工具）',
        employeeModel: '模型',
        modelDefault: '跟随默认模型',
        modelLoading: '读取模型目录…',
        modelEmpty: '没有可用的模型目录',
        reloadModels: '刷新模型列表',
        statusIdle: '待命',
        statusRunning: '工作中',
        skillCount: '项技能',
        employees: '员工',
        runningCount: '进行中',
        doneCount: '已完成',
        skillsHint: '勾选允许使用的全局工具；不勾选则不允许全局工具。宿主的会话内工具另行管理。',
        loadFailed: '连不上插件后端',
        retry: '重试',
        loading: '加载中…',
        expand: '展开',
        collapse: '收起',
        transcriptHint: '这是他自己的会话，不是群聊。',
        transcriptEmpty: '这名员工还没被唤起过。派个活给他就有了。',
        timelineEmpty: '还没有人回复。',
        bidPhase: '认单中',
        workPhase: '执行中',
        closedPhase: '已结束',
        accept: '接单',
        decline: '不接',
        deliver: '交付',
        system: '系统',
        unclaimed: '没人接单',
        interrupted: '已中断',
        queued: '排队中',
        running: '进行中',
        bidding: '认单中',
        working: '执行中',
        done: '已完成',
        failed: '失败',
        cancelled: '已取消',
        error: '出错',
        whoAccepted: '接单',
        detailTitle: '员工详情',
        openSession: '会话',
        refresh: '刷新',
        remove: '删除',
        removing: '删除中…',
        removeConfirm: '确认删除',
        removeTitle: '删除任务「{title}」？',
        removed: '已删除',
        memory: '记忆',
        memoryEmpty: '还没有记忆。',
        memoryEntries: '条记忆',
        memoryDir: '记忆目录',
        addNote: '记一笔',
        notePh: '写一条备注…',
        noteSaved: '已记下',
        saving: '保存中…',
        pending: '待运行',
        skipped: '已跳过',
        tabWorkflow: '工作流',
        workflowNew: '新建工作流',
        workflowEmpty: '还没有工作流。新建一条，把员工串起来。',
        workflowUnnamed: '未命名工作流',
        workflowNodes: '个节点',
        workflowRemoveTitle: '删除工作流「{title}」？',
        workflowBack: '返回',
        workflowName: '名称',
        workflowNamePh: '例如：竞品日报',
        workflowDesc: '描述',
        workflowDescPh: '这条工作流做什么',
        workflowRun: '运行',
        workflowRunning: '运行中…',
        workflowRunStarted: '已开始运行',
        workflowRunInput: '运行输入',
        workflowRunPh: '给开始节点的输入…',
        workflowSaveFirst: '请先保存再运行',
        workflowDeleteEdge: '删除选中连线',
        workflowNodeStart: '开始',
        workflowNodeEmployee: '员工',
        workflowNodeTitle: '节点名称',
        workflowNodeTitlePh: '这一步做什么',
        workflowSelectEmployee: '选择员工',
        workflowInstruction: '指令',
        workflowInstructionPh: '给这名员工的指令，可用 {{input}} 引用上游结果。',
        workflowDeleteNode: '删除节点',
        workflowDeleteNodeTitle: '删除这个节点？相关连线会一并删除。',
        workflowConfirmDelete: '确认删除',
        workflowNodeOutput: '输出',
        workflowNodeError: '错误',
        workflowSaved: '已保存',
        workflowNoRun: '还没有运行记录',
        workflowLastRun: '上次运行',
        workflowNoName: '请先写工作流名称',
        workflowLimitName: '工作流名称最多 80 字',
        workflowNeedStart: '需要恰好一个开始节点',
        workflowNeedEmployee: '员工节点要选一名员工',
        workflowBadEdge: '连线不合法：不能自连、不能重复、不能成环',
        workflowLimitNodes: '节点数量需在 1–60 之间',
        workflowLimitEdges: '连线最多 200 条',
        workflowLimitInstruction: '指令最多 4000 字',
        workflowCanvasHint: '从节点右侧圆点拖出连线，点节点编辑。',
        workflowStartHint: '开始节点接收运行输入。',
        workflowAddNode: '添加员工节点',
      },
      en: {
        quantPeople:'Hired employees',quantPeopleHint:'Employee activity comes from company tasks, fixed workflows and group records. TradingAgents telemetry below is not employee execution history.',quantNoPeople:'No hired employees, or the roster has not loaded.',quantIdle:'No recorded work in progress',quantLastResult:'Latest grounded result',quantNoResult:'No result recorded',quantOwner:'Telemetry owner',quantUnassigned:'Unassigned',quantSaveOwners:'Save owner assignments',quantOwnerHint:'Ownership is a responsibility mapping only. It neither starts employees nor proves they performed a scan. Upstream events never animate employees.',quantOwnersUnavailable:'This host cannot save owner assignments yet.',quantOwnerInvalid:'A selected employee is no longer in the roster. Choose again.',quantSource_company:'Company task',quantSource_fixed:'Fixed workflow',quantSource_group:'Group task',quantTelemetry:'TradingAgents raw telemetry',quantRosterError:'Employee state fetch failed; previous records do not prove current state.',quantOwnersSaved:'Owner assignments saved',
        quantPlay:'Play recorded events',quantPause:'Pause',quantReset:'Reset playback',quantFollow:'Follow latest events',quantArchive:'Archive playback · Not live execution',quantEventFeed:'Recorded event stream',quantNoEvents:'No events yet. Demo activity is never generated.',quantReplayReady:'Press Play to step through recorded events.',quantBeijing:'Beijing time',quantSnapshotDetails:'Snapshot metrics',quantLiveEvents:'Read-only event updates · Initial load is not new activity',
        quantFlow:'Evidence processing path',quantFlowHint:'Responsibility order, not proof that data passed. States come from the snapshot.',quantLog:'Latest activity records',quantLogHint:'One latest activity per role from the current snapshot, not a complete historical log.',quantNoLog:'No actual activity timestamps to order.',
        quantSessionMorning:'Morning session',quantSessionAfternoon:'Afternoon session',quantSessionLunch:'Lunch break',quantSessionClosed:'Closed',
        quantStatus_idle:'Idle',quantStatus_running:'Processing',quantStatus_done:'Completed cycle',quantStatus_blocked:'Blocked',quantStatus_stale:'Stale',quantStatus_unknown:'Unknown',quantDelivery:'Notification outbox',quantDryRun:'Dry run, no email sent',quantEligible:'Eligible',quantDelivered:'Recorded deliveries',quantSession:'Session',quantSource:'Source',
        quantTab: "Quant operations",
        quantSubtitle: "Observe data, decisions and blockers. No order execution.",
        quantReadOnly: "Observation only · No orders · No profit targets",
        quantMode: "Data mode",
        quantReplay: "Replay",
        quantSimulation: "Simulation",
        quantLive: "Read-only live",
        quantUnknown: "Unknown / not provided",
        quantHeartbeat: "Last activity report",
        quantFreshness: "Market data timestamp",
        quantProcessing: "Processing",
        quantCounts: "Counters",
        quantBlocked: "Blocked by",
        quantReported: "Reported status",
        quantSnapshot: "Snapshot time",
        quantMissing: "No status reported for this role yet.",
        quantError: "Status fetch failed. Previous data does not prove current availability.",
        quantUnavailable: "No quant status source connected. No simulated online signals are shown.",
        quantRefresh: "Refresh status",
        quantDataRole: "Market data quality",
        quantSentimentRole: "Sentiment & themes",
        quantOrderbookRole: "Order book candidates",
        quantRiskRole: "Risk review",
        quantNotificationRole: "Notification delivery",
        quantAgo: "seconds ago",
        quantFuture: "Timestamp is ahead of this device. Check clock alignment.",
        quantOffline: "No snapshot received",
        quantHealthNote: "Activity reports are not independent heartbeats. Market data time is not receipt time; replay data is never labeled live. Missing metrics are never treated as healthy.",

        intakeBoundaries:'Scope and exclusions (optional)',intakeChecks:'Concrete acceptance checks (optional)',intakeTradeoff:'Compare sequential and parallel plans when the tradeoff matters',intakeRevise:'Save revised proposal',intakeEdit:'Edit this proposal',intakeReject:'Reject proposal',intakeRejected:'Rejected',intakeDefaultBoundary:'Do not expand the brief or grant permissions.',roomDispatch:'Assign a task',roomRecommended:'Default recommendation: Lean. Review acceptance criteria and risks, approve, then start.',fixedRunNow:'Run template',fixedFreshInput:'Input for this run',fixedRunHint:'A template reuses nodes and steps. Enter a fresh task each time. Running may incur model costs and tool actions.',
        roomTitle: "Team workspace",
        roomEyebrow: "COMPANY / WORKSPACE",
        roomMembers: "People",
        roomThreads: "Task conversations",
        roomFeed: "Collaboration log",
        roomReview: "Approvals & evidence",
        roomSource: "These are task inputs and engine node records, not live employee chat.",
        roomScope: "Each proposal is a task conversation. Project permission isolation is not provided.",
        roomCompose: "Start a new task",
        roomComposeHint: "Describe the goal, then review and approve the proposal. This does not send a chat message to employees.",
        roomOwner: "Task owner",
        roomEngine: "Execution engine",
        roomWaiting: "Waiting for approval and execution. No node records yet.",
        roomLive: "Host state · periodic sync",
        roomPlanCount: "Company tasks running",
        roomDoneCount: "Company tasks completed",
        roomNoMembers: "No employees yet. Configure them in People first.",

        companyOutcome: 'Acceptance criteria (optional)', companyAcceptedOutcome: 'Plan acceptance criteria', companyRisks: 'Plan risks', companyRetry: 'Retry the same approved plan', companyRetryHint: 'Retry executes the same plan again, not just the failed node. Model costs may recur. The host enforces a maximum of 5 attempts.',
        companyAssignments: 'Stages and assignees',
        companyMode: "AI Company", groupMode:"Group chats", noActiveWork:"No steps running now", activeWork:"Working on",
        fixedMode: "Fixed flows",
        companyIntro: "Brief → compare proposals → approve exact revision → start separately",
        fixedIntro: "Open your workflow library, edit nodes and dependencies, and repeat a known process.",
        companyRules: "These proposals use rule-based templates, not bespoke model-generated plans. Review fit, risks and employee configuration first.",
        companyBrief: "Goal and constraints",
        companyCreate: "Create proposal for review",
        companyPlans: "Proposal history",
        companyEmpty: "No proposals yet. Describe the delivery you want and its constraints.",
        companyRevision: "Revision",
        companyRisk: "Risk",
        companyFeasibility: "Feasibility",
        companyApprove: "Approve selected option and revision",
        companyRun: "Start approved run",
        companySeparate: "Approval does not execute. This preview uses employee models for text deliverables and may incur model costs. It does not grant employees their configured global tools.",
        companySelected: "Approved option",
        companyPromote: "Save successful plan as fixed flow",
        companyPromoteHint: "Saves a reusable text workflow, not the current run results.",
        companyCancel: "Cancel run",
        companyUnavailable: "This host does not support company proposals yet. Update it to continue.",
        companyBusy: "Working…",
        companyLegacy: "Legacy task board",
        companyNoRun: "No matching engine run is available yet.",
        companyAwaiting: "Awaiting selection and approval",
        companyApproved: "Approved, not started",
        companyCompleted: "Completed",
        companyFailed: "Failed",
        companyCancelled: "Cancelled",
        companyRunning: "Running",
        companyRunStatus: "Engine run status",
        companySelect: "Select option",
        companyHistoryHint: "Switching proposals never approves or runs them. A new brief creates a separate proposal.",

        tabArchitecture: 'Architecture',
        architectureTitle: 'From a goal to delivery',
        architectureIntro: 'Missions and workflows are separate execution paths sharing employee, model and session capabilities.',
        architectureCEO: 'Goals & orchestration',
        architectureCEOText: 'Assign an owner or invite bids on the mission board. Use workflow edges to define dependencies.',
        architectureTeam: 'Employee execution',
        architectureTeamText: 'Each employee uses its role, model and tool configuration. Results remain in its session.',
        architectureHost: 'Harness runtime',
        architectureHostText: 'The host provides AgentLoop, model adapters, tools and sessions. This plugin dispatches, orchestrates and displays work.',
        architectureResults: 'Results & status',
        architectureResultsText: 'Inspect deliveries and failures on the mission board, and per-node outputs in workflows. Host state is polled periodically.',
        architectureRoutes: 'Choose an execution path',
        architectureMissionText: 'Goal-driven: bid → execute → collect. An explicit owner skips bidding.',
        architectureWorkflowText: 'Dependency-driven: start → employee → downstream nodes. Failed upstream work can skip dependent nodes.',
        architectureSnapshot: 'Workspace snapshot',
        architectureScope: 'A map of plugin capabilities, not model reasoning or a live network topology.',
        workflowActive: 'Executing / waiting',
        workflowGraphMismatch: 'The draft differs from the run snapshot, or this older run has no snapshot. Canvas status is hidden; counts still describe the latest run.',
        workflowLive: 'Execution monitor',
        workflowHistory: 'Latest run',
        workflowSettled: 'Settled nodes',
        workflowWaiting: 'Waiting',
        workflowMotion: 'Edge animation',
        workflowMotionHint: 'Only shown from completed upstream nodes to nodes executing or waiting for an employee. System reduced-motion settings take priority.',
        workflowPolling: 'Host status refreshes about every 2.5 seconds. Particles indicate execution or waiting for an employee, not tokens or network traffic.',
        workflowEdgeLabel: 'Select connection',

        title: 'Company',
        subtitle: 'CEO console',
        star: 'Star',
        starHint: 'A star on the repo helps more than you think.',
        sponsor: 'Sponsor',
        sponsorTitle: 'Support this plugin',
        sponsorThanks: 'Thank you for your support.',
        sponsorDescription: 'Support is optional, does not affect plugin access, and includes no additional services. Scan with WeChat and verify the recipient and amount before paying.',
        sponsorImageError: 'The QR image could not load. Please try again later. Recipient and payment receipt have not been verified; do not pay based on a screenshot alone.',
        tabRoster: 'Employees',
        tabMissions: 'Missions',
        hire: 'Hire',
        edit: 'Edit',
        fire: 'Dismiss',
        save: 'Save',
        cancel: 'Cancel',
        close: 'Close',
        dispatch: 'Dispatch',
        dispatching: 'Dispatching…',
        emptyMissions: 'No missions yet. Describe the work, pick who to notify, then Dispatch — they decide whether to take it.',
        missionTitle: 'Mission title',
        missionTitlePh: 'e.g. review last week’s ad spend',
        missionBrief: 'Brief',
        missionBriefPh: 'Context, what you want, and the delivery bar.',
        assignees: 'Notify',
        selectAll: 'All',
        clearAll: 'None',
        assigneeLabel: 'Assign an owner (optional)',
        assigneeNone: 'No owner · let the team bid',
        assigneeHint: 'If set, bidding is skipped and the task goes straight to this person — they cannot decline. If everyone declines anyway, the project director force-assigns it.',
        noAssignee: 'Notify at least one employee',
        noTitle: 'Mission title is required',
        employeeName: 'Name',
        employeeRole: 'Role template',
        employeeTitle: 'Job title',
        employeePersona: 'Identity (persona)',
        employeePersonaPh: 'Who this employee is, how they work, what they deliver.',
        employeeSkills: 'Skills (allowed tools)',
        employeeModel: 'Model',
        modelDefault: 'Follow default model',
        modelLoading: 'Loading model catalog…',
        modelEmpty: 'No model catalog available',
        reloadModels: 'Reload models',
        statusIdle: 'idle',
        statusRunning: 'working',
        skillCount: 'skills',
        employees: 'Employees',
        runningCount: 'Active',
        doneCount: 'Done',
        skillsHint: 'Select allowed global tools. None selected blocks global tools; host scope-local tools are managed separately.',
        loadFailed: 'Cannot reach the plugin backend',
        retry: 'Retry',
        loading: 'Loading…',
        expand: 'Expand',
        collapse: 'Collapse',
        transcriptHint: 'This is their own session, not the team thread.',
        transcriptEmpty: 'This employee has not been woken up yet.',
        timelineEmpty: 'No replies yet.',
        bidPhase: 'Bidding',
        workPhase: 'Working',
        closedPhase: 'Closed',
        accept: 'Accepted',
        decline: 'Declined',
        deliver: 'Delivered',
        system: 'System',
        unclaimed: 'Nobody took it',
        interrupted: 'interrupted',
        queued: 'queued',
        running: 'running',
        bidding: 'bidding',
        working: 'working',
        done: 'done',
        failed: 'failed',
        cancelled: 'cancelled',
        error: 'error',
        whoAccepted: 'accepted',
        detailTitle: 'Employee detail',
        openSession: 'session',
        refresh: 'Refresh',
        remove: 'Delete',
        removing: 'Deleting…',
        removeConfirm: 'Confirm delete',
        removeTitle: 'Delete mission “{title}”?',
        removed: 'Deleted',
        memory: 'Memory',
        memoryEmpty: 'No memory yet.',
        memoryEntries: 'entries',
        memoryDir: 'Memory dir',
        addNote: 'Add note',
        notePh: 'Write a note…',
        noteSaved: 'Note saved',
        saving: 'Saving…',
        pending: 'pending',
        skipped: 'skipped',
        tabWorkflow: 'Workflows',
        workflowNew: 'New workflow',
        workflowEmpty: 'No workflows yet. Create one to chain your employees.',
        workflowUnnamed: 'Untitled workflow',
        workflowNodes: 'nodes',
        workflowRemoveTitle: 'Delete workflow “{title}”?',
        workflowBack: 'Back',
        workflowName: 'Name',
        workflowNamePh: 'e.g. competitor daily brief',
        workflowDesc: 'Description',
        workflowDescPh: 'What this workflow does',
        workflowRun: 'Run',
        workflowRunning: 'Running…',
        workflowRunStarted: 'Run started',
        workflowRunInput: 'Run input',
        workflowRunPh: 'Input for the start node…',
        workflowSaveFirst: 'Save before running',
        workflowDeleteEdge: 'Delete selected edge',
        workflowNodeStart: 'Start',
        workflowNodeEmployee: 'Employee',
        workflowNodeTitle: 'Node title',
        workflowNodeTitlePh: 'What this step does',
        workflowSelectEmployee: 'Pick an employee',
        workflowInstruction: 'Instruction',
        workflowInstructionPh: 'Instruction for this employee. Use {{input}} for the upstream result.',
        workflowDeleteNode: 'Delete node',
        workflowDeleteNodeTitle: 'Delete this node? Its edges go too.',
        workflowConfirmDelete: 'Confirm delete',
        workflowNodeOutput: 'Output',
        workflowNodeError: 'Error',
        workflowSaved: 'Saved',
        workflowNoRun: 'No run yet',
        workflowLastRun: 'Last run',
        workflowNoName: 'Workflow name is required',
        workflowLimitName: 'Workflow name is limited to 80 characters',
        workflowNeedStart: 'Exactly one start node is required',
        workflowNeedEmployee: 'Employee nodes need an employee',
        workflowBadEdge: 'Invalid edge: no self-loop, no duplicates, no cycles',
        workflowLimitNodes: 'Nodes must be between 1 and 60',
        workflowLimitEdges: 'At most 200 edges',
        workflowLimitInstruction: 'Instruction is limited to 4000 characters',
        workflowCanvasHint: 'Drag from a node’s right dot to connect. Click a node to edit.',
        workflowStartHint: 'The start node takes the run input.',
        workflowAddNode: 'Add employee node',
      },
    };

    const API = (() => {
      try {
        return new URL('api/dsh-company', document.baseURI).pathname;
      } catch {
        return '/api/dsh-company';
      }
    })();

    async function call(op, body) {
      const response = await fetch(`${API}/${op}`, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload || payload.ok !== true) {
        throw new Error((payload && payload.error && payload.error.message) || '请求失败');
      }
      return payload.value;
    }

    /** 侧边栏图标：组织结构图（自绘，currentColor，跟随主题）。 */
    function CompanyIcon({ size }) {
      const edge = typeof size === 'number' && size > 0 ? size : 18;
      return h(
        'svg',
        {
          width: edge,
          height: edge,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          style: { display: 'block' },
        },
        h('rect', { x: 9, y: 2.5, width: 6, height: 5, rx: 1.4 }),
        h('rect', { x: 2.5, y: 16.5, width: 6, height: 5, rx: 1.4 }),
        h('rect', { x: 15.5, y: 16.5, width: 6, height: 5, rx: 1.4 }),
        h('path', { d: 'M12 7.5v4.2M5.5 16.5v-2.4h13v2.4' }),
      );
    }

    const CSS = `
.dsc-groups{display:grid;grid-template-columns:minmax(160px,.68fr) minmax(280px,2.2fr) minmax(170px,.8fr)}
.dsc-groups .dsc-room-sectionhead{flex-wrap:wrap}.dsc-groups .dsc-room-feed{min-height:180px}
.dsc-group-members{border:1px solid var(--room-line);border-radius:10px;display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:8px;padding:12px;margin:12px 0}
.dsc-group-member{display:flex;align-items:center;flex-wrap:wrap;gap:7px;padding:8px;border:1px solid var(--room-line);border-radius:8px;cursor:pointer}
.dsc-group-member small{color:var(--room-muted)}.dsc-room-members{display:grid;gap:10px;margin:12px 0;padding:0;list-style:none}
.dsc-room-members li{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid var(--room-line);padding:8px 0}
.dsc-group-nav{text-align:left}.dsc-room-threads{display:grid;gap:7px;max-height:460px;overflow:auto}
.dsc-work-dot{width:8px;height:8px;background:#13875a;border-radius:100%;display:inline-block;box-shadow:0 0 0 3px #13875a30;margin-left:auto}
@media(max-width:760px){.dsc-room.dsc-groups{display:flex;flex-direction:column}.dsc-room-threads{max-height:150px}}

.dsc-launch{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;padding:12px 18px}
.dsc-launch .dsc-card{text-align:start;color:inherit;font:inherit}
.dsc-launch [aria-pressed="true"]{border-color:var(--dsw-alias-brand-primary,#4C8DFF)}
.dsc-company{display:flex;flex-direction:column;gap:10px;max-width:1100px;margin:auto;width:100%}
.dsc-company-plan{display:flex;flex-direction:column;gap:8px;overflow-wrap:anywhere}
.dsc-company .dsc-card{cursor:default}.dsc-company .dsc-card p{margin:0;white-space:pre-wrap}
.dsc-company .dsc-card-actions{flex-wrap:wrap}.dsc-company progress{width:100%}

.dsc-root{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-layer-1, Canvas);color:var(--dsw-alias-label-primary, CanvasText);font-size:13px}
.dsc-head{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--dsw-alias-border-l1, rgba(128,128,128,.28));flex:none}
.dsc-name{font-size:15px;font-weight:600;letter-spacing:.2px}
.dsc-sub{font-size:12px;color:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9))}
.dsc-spacer{flex:1}
.dsc-stats{display:flex;gap:8px}
.dsc-stat{display:flex;flex-direction:column;align-items:flex-end;padding:2px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-2, rgba(128,128,128,.12))}
.dsc-stat b{font-size:14px;line-height:1.2}
.dsc-stat span{font-size:11px;color:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9))}
.dsc-tabs{display:flex;gap:4px;padding:10px 18px 0;flex:none}
.dsc-tab{padding:6px 14px;border-radius:8px 8px 0 0;border:1px solid transparent;border-bottom:none;background:transparent;color:var(--dsw-alias-label-secondary, CanvasText);cursor:pointer;font-size:13px;font-family:inherit}
.dsc-tab:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.14))}
.dsc-tab[data-on="1"]{background:var(--dsw-alias-bg-layer-2, rgba(128,128,128,.12));border-color:var(--dsw-alias-border-l2, rgba(128,128,128,.34));color:var(--dsw-alias-label-primary, CanvasText)}
.dsc-body{flex:1;min-height:0;overflow:auto;padding:14px 18px 24px}
.dsc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.dsc-card{background:var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2, rgba(128,128,128,.1)));border:1px solid var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l2, rgba(128,128,128,.3)));border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px;cursor:pointer}
.dsc-card:hover{border-color:var(--dsw-alias-brand-primary, #4C8DFF)}
.dsc-card-top{display:flex;align-items:center;gap:10px}
.dsc-avatar{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px;flex:none}
.dsc-card-name{font-weight:600}
.dsc-card-title{font-size:11px;color:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9))}
.dsc-card-sub{font-size:11px;line-height:1.6;color:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9));overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsc-dot{width:7px;height:7px;border-radius:50%;flex:none;display:inline-block;margin-right:5px}
.dsc-chips{display:flex;flex-wrap:wrap;gap:4px}
.dsc-chip{font-size:11px;padding:1px 7px;border-radius:999px;background:var(--dsw-alias-bg-layer-3, rgba(128,128,128,.18));color:var(--dsw-alias-label-secondary, CanvasText)}
.dsc-card-actions{display:flex;gap:6px;margin-top:2px}
.dsc-btn{border:1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.34));background:var(--dsw-alias-button-elevated-fill, var(--dsw-alias-bg-layer-2, rgba(128,128,128,.14)));color:var(--dsw-alias-label-primary, CanvasText);border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer;line-height:1.5;font-family:inherit}
.dsc-btn:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.2))}
.dsc-btn:disabled{opacity:.5;cursor:not-allowed}
.dsc-btn[data-kind="primary"]{background:var(--dsw-alias-button-primary-fill, #4C8DFF);border-color:transparent;color:var(--dsw-alias-label-primary-inverted, #fff)}
.dsc-btn[data-kind="primary"]:hover{background:var(--dsw-alias-button-primary-hover, #3F7FE8)}
.dsc-btn[data-kind="danger"]{color:var(--dsw-alias-state-error-primary, #E5484D)}
.dsc-btn[data-kind="ghost"]{background:transparent;border-color:transparent;color:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9))}
.dsc-missions{display:grid;grid-template-columns:minmax(280px,340px) 1fr;gap:16px;align-items:start}
@media (max-width:900px){.dsc-missions{grid-template-columns:1fr}}
.dsc-panel{background:var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2, rgba(128,128,128,.1)));border:1px solid var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l2, rgba(128,128,128,.3)));border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px}
.dsc-label{font-size:12px;color:var(--dsw-alias-label-secondary, CanvasText);margin-bottom:4px}
.dsc-input,.dsc-area{width:100%;box-sizing:border-box;background:var(--dsw-alias-bg-layer-1, Canvas);border:.5px solid var(--dsw-alias-border-l4, var(--dsw-alias-border-l2, rgba(128,128,128,.34)));border-radius:8px;color:var(--dsw-alias-label-primary, CanvasText);padding:7px 9px;font-size:13px;font-family:inherit}
.dsc-area{resize:vertical;min-height:84px;line-height:1.6}
.dsc-input::placeholder,.dsc-area::placeholder{color:var(--dsw-alias-label-dimmed, rgba(128,128,128,.7))}
.dsc-input:focus,.dsc-area:focus{outline:none;border-color:var(--dsw-alias-state-business-primary, #4C8DFF)}
.dsc-pick{display:flex;flex-wrap:wrap;gap:6px}
.dsc-pickbtn{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.34));border-radius:999px;padding:3px 10px;font-size:12px;cursor:pointer;background:transparent;color:var(--dsw-alias-label-secondary, CanvasText);font-family:inherit}
.dsc-pickbtn[data-on="1"]{background:var(--dsw-alias-button-primary-dimmed, rgba(76,141,255,.2));border-color:var(--dsw-alias-brand-primary, #4C8DFF);color:var(--dsw-alias-label-primary, CanvasText)}
.dsc-list{display:flex;flex-direction:column;gap:10px}
.dsc-mission{border:1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.34));border-radius:10px;padding:11px 12px;background:var(--dsw-alias-bg-layer-2, rgba(128,128,128,.1))}
.dsc-remove-confirm{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;padding:7px 9px;border-radius:8px;border:.5px solid var(--dsw-alias-state-error-secondary, rgba(229,72,77,.45));background:var(--dsw-alias-bg-layer-1, Canvas)}
.dsc-remove-confirm .dsc-hint{margin-top:0;flex:1;min-width:160px}
.dsc-mission-head{display:flex;align-items:center;gap:8px;cursor:pointer}
.dsc-mission-title{font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsc-badge{font-size:11px;padding:1px 8px;border-radius:999px;background:var(--dsw-alias-bg-layer-3, rgba(128,128,128,.18));color:var(--dsw-alias-label-secondary, CanvasText);flex:none;white-space:nowrap}
.dsc-badge[data-s="bidding"],.dsc-badge[data-s="working"],.dsc-badge[data-s="running"],.dsc-badge[data-s="deliver"]{background:var(--dsw-alias-state-business-primary, #4C8DFF);color:var(--dsw-alias-label-primary-inverted, #fff)}
.dsc-badge[data-s="done"],.dsc-badge[data-s="accept"]{background:var(--dsw-alias-state-success-secondary, rgba(62,207,160,.18));color:var(--dsw-alias-state-success-primary, #2FA37C)}
.dsc-badge[data-s="failed"],.dsc-badge[data-s="unclaimed"],.dsc-badge[data-s="error"]{background:var(--dsw-alias-state-error-secondary, rgba(229,72,77,.16));color:var(--dsw-alias-state-error-primary, #E5484D)}
.dsc-badge[data-s="decline"]{background:var(--dsw-alias-state-warn-secondary, rgba(242,166,90,.2));color:var(--dsw-alias-state-warn-primary, #B9772B)}
.dsc-thread{display:flex;flex-direction:column;gap:8px;margin-top:10px;max-height:460px;overflow:auto;padding-right:2px}
.dsc-msg{display:flex;gap:8px;align-items:flex-start}
.dsc-msg-av{width:24px;height:24px;border-radius:8px;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600}
.dsc-msg-body{min-width:0;flex:1}
.dsc-msg-head{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9));margin-bottom:2px;flex-wrap:wrap}
.dsc-msg-name{color:var(--dsw-alias-label-secondary, CanvasText);font-weight:600}
.dsc-bubble{white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.7;background:var(--dsw-alias-bg-layer-1, Canvas);border:.5px solid var(--dsw-alias-border-l1, rgba(128,128,128,.24));border-radius:10px;padding:8px 10px;max-height:320px;overflow:auto}
.dsc-msg[data-k="system"] .dsc-bubble{background:transparent;border-style:dashed;color:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9));font-size:11px}
.dsc-msg[data-k="decline"] .dsc-bubble{border-color:var(--dsw-alias-state-warn-secondary, rgba(242,166,90,.45))}
.dsc-msg[data-k="accept"] .dsc-bubble{border-color:var(--dsw-alias-state-success-tertiary, rgba(62,207,160,.5))}
.dsc-msg[data-k="error"] .dsc-bubble{border-color:var(--dsw-alias-state-error-secondary, rgba(229,72,77,.45));color:var(--dsw-alias-state-error-primary, #E5484D)}
.dsc-err{color:var(--dsw-alias-state-error-primary, #E5484D);font-size:12px;margin-top:6px;white-space:pre-wrap}
.dsc-mask{position:fixed;inset:0;z-index:1000;pointer-events:auto;display:flex;align-items:center;justify-content:center;padding:max(24px,var(--dsh-frame-overlay-top,24px)) 24px;background:var(--dsw-alias-bg-mask-1, rgba(0,0,0,.45));backdrop-filter:var(--dsw-mask-blur, none)}
.dsc-modal{box-sizing:border-box;position:relative;z-index:1;width:min(680px,100%);max-height:100%;overflow:auto;background:var(--dsw-alias-bg-layer-2, Canvas);border:.5px solid var(--dsw-alias-border-l4, transparent);border-radius:16px;box-shadow:var(--dsw-elevation-prominent, 0 12px 32px rgba(0,0,0,.18));padding:18px;display:flex;flex-direction:column;gap:12px}
.dsc-modal-head{display:flex;align-items:center;gap:8px}
.dsc-modal-title{font-size:14px;font-weight:600;flex:1}
.dsc-tools{max-height:190px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:4px;border:.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3));border-radius:8px;padding:8px;background:var(--dsw-alias-bg-layer-1, Canvas)}
.dsc-tool{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary, CanvasText);cursor:pointer;padding:2px 4px;border-radius:6px}
.dsc-tool:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.14))}
.dsc-tool input{accent-color:var(--dsw-alias-brand-primary, #4C8DFF);margin:0}
.dsc-hint{font-size:11px;color:var(--dsw-alias-label-dimmed, rgba(128,128,128,.7));margin-top:3px}
.dsc-empty{color:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9));font-size:12px;padding:16px 0;text-align:center}
.dsc-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:var(--dsw-alias-toast-bg, rgba(20,20,22,.92));color:var(--dsw-alias-toast-label, #fff);padding:7px 14px;border-radius:9px;font-size:12px;z-index:1100;max-width:70vw}
.dsc-drawer{display:flex;flex-direction:column;gap:8px;max-height:62vh;overflow:auto}
.dsc-drawer-msg{white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.7;border-radius:10px;padding:8px 10px;background:var(--dsw-alias-bg-layer-1, Canvas);border:.5px solid var(--dsw-alias-border-l1, rgba(128,128,128,.24))}
.dsc-drawer-msg[data-r="user"]{background:var(--dsw-alias-button-primary-dimmed, rgba(76,141,255,.14));border-color:var(--dsw-alias-border-l2, rgba(128,128,128,.3))}
.dsc-sponsor{width:min(420px,100%)}
.dsc-qr{display:block;width:100%;max-width:260px;margin:4px auto;border-radius:12px;background:#fff;padding:8px;box-sizing:border-box}
.dsc-sponsor-text{font-size:12px;line-height:1.8;color:var(--dsw-alias-label-secondary, CanvasText);white-space:pre-wrap;text-align:center}
.dsc-star{display:inline-flex;align-items:center;gap:4px;text-decoration:none}
.dsc-drawer-msg[data-r="tool"]{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9));padding:2px 8px;border-style:dashed}
.dsc-memory{display:flex;flex-direction:column;gap:6px;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1, rgba(128,128,128,.24))}
.dsc-memory-head{display:flex;align-items:center;gap:8px}
.dsc-memory-title{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary, CanvasText)}
.dsc-memory-path{font-size:11px;color:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9));word-break:break-all}
.dsc-memory-list{display:flex;flex-direction:column;gap:6px;max-height:220px;overflow:auto}
.dsc-memory-item{border:.5px solid var(--dsw-alias-border-l1, rgba(128,128,128,.24));border-radius:8px;background:var(--dsw-alias-bg-layer-1, Canvas);padding:6px 9px}
.dsc-memory-meta{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9));margin-bottom:2px;flex-wrap:wrap}
.dsc-memory-kind{font-size:10px;padding:0 6px;border-radius:999px;background:var(--dsw-alias-bg-layer-3, rgba(128,128,128,.18));color:var(--dsw-alias-label-secondary, CanvasText)}
.dsc-memory-text{font-size:12px;line-height:1.7;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-primary, CanvasText)}
.dsc-memory-body{margin:0;max-height:220px;overflow:auto;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-1, Canvas);border:.5px solid var(--dsw-alias-border-l1, rgba(128,128,128,.24));font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.7;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-primary, CanvasText)}
.dsc-memory-foot{display:flex;gap:8px;align-items:flex-end}
.dsc-memory-foot .dsc-area{flex:1;min-height:56px}
.dsc-badge[data-s="pending"]{background:var(--dsw-alias-bg-layer-3, rgba(128,128,128,.18));color:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9))}
.dsc-badge[data-s="skipped"]{background:var(--dsw-alias-state-warn-secondary, rgba(242,166,90,.2));color:var(--dsw-alias-state-warn-primary, #B9772B)}
.dsc-wf-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-bottom:10px;border-bottom:1px solid var(--dsw-alias-border-l1, rgba(128,128,128,.28));flex:none}
.dsc-body-workflow{display:flex;flex-direction:column;overflow:hidden}
.dsc-wf-list{flex:1;min-height:0;overflow:auto}
.dsc-wf-editor{display:flex;flex-direction:column;gap:10px;flex:1;min-height:0}
.dsc-wf-runinput{width:190px;min-height:32px;height:32px;resize:vertical;font-size:12px;padding:4px 8px}
.dsc-wf-canvas-wrap{display:flex;align-items:stretch;gap:12px;min-height:0;flex:1}
.dsc-wf-canvas{position:relative;overflow:auto;flex:1;min-width:0;min-height:520px;border:.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3));border-radius:12px;background-color:var(--dsw-alias-bg-layer-1, Canvas);background-image:radial-gradient(circle, var(--dsw-alias-border-l2, rgba(128,128,128,.3)) 1px, transparent 1px);background-size:20px 20px}
.dsc-wf-stage{position:relative;width:1500px;height:950px}
.dsc-wf-edges{position:absolute;left:0;top:0;width:1500px;height:950px;overflow:visible;pointer-events:none;z-index:1}
.dsc-wf-edge-hit{stroke:transparent;stroke-width:12;fill:none;pointer-events:stroke;cursor:pointer}
.dsc-wf-edge{stroke:var(--dsw-alias-label-tertiary, rgba(128,128,128,.9));stroke-width:2;fill:none;pointer-events:none}
.dsc-wf-edge[data-sel="1"]{stroke:var(--dsw-alias-brand-primary, #4C8DFF);stroke-width:3.5}
.dsc-wf-edge[data-run="done"]{stroke:var(--dsw-alias-state-success-primary, #2FA37C)}
.dsc-wf-edge[data-run="running"]{stroke:var(--dsw-alias-state-business-primary, #4C8DFF)}
.dsc-wf-edge[data-run="failed"]{stroke:var(--dsw-alias-state-error-primary, #E5484D)}
.dsc-wf-edge[data-run="pending"],.dsc-wf-edge[data-run="skipped"]{stroke:var(--dsw-alias-label-dimmed, rgba(128,128,128,.7));stroke-dasharray:5 4}
.dsc-wf-node{position:absolute;width:210px;z-index:2;border:1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.34));border-radius:10px;background:var(--dsw-alias-bg-layer-2, rgba(128,128,128,.1));box-shadow:0 2px 8px rgba(0,0,0,.08);user-select:none;cursor:pointer}
.dsc-wf-node[data-sel="1"]{border-color:var(--dsw-alias-brand-primary, #4C8DFF);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary, #4C8DFF)}
.dsc-wf-node-head{display:flex;align-items:center;gap:6px;padding:6px 9px;border-bottom:1px solid var(--dsw-alias-border-l1, rgba(128,128,128,.24));cursor:grab;border-radius:9px 9px 0 0;background:var(--dsw-alias-bg-layer-3, rgba(128,128,128,.12))}
.dsc-wf-node-head:active{cursor:grabbing}
.dsc-wf-node-kind{font-size:10px;padding:0 6px;border-radius:999px;background:var(--dsw-alias-button-primary-dimmed, rgba(76,141,255,.2));color:var(--dsw-alias-label-primary, CanvasText);flex:none}
.dsc-wf-node-title{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary, CanvasText);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}
.dsc-wf-node-body{display:flex;align-items:center;gap:7px;padding:8px 9px;font-size:11px;color:var(--dsw-alias-label-secondary, CanvasText);min-height:38px}
.dsc-wf-node-body span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsc-wf-node-status{position:absolute;right:7px;top:7px;z-index:3}
.dsc-wf-port{position:absolute;width:11px;height:11px;border-radius:50%;background:var(--dsw-alias-bg-layer-3, rgba(128,128,128,.3));border:1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.45));z-index:3}
.dsc-wf-port[data-port="out"]{right:-6px;top:50%;margin-top:-6px;cursor:crosshair}
.dsc-wf-port[data-port="in"]{left:-6px;top:50%;margin-top:-6px}
.dsc-wf-port:hover{background:var(--dsw-alias-brand-primary, #4C8DFF)}
.dsc-wf-inspector{width:300px;flex:none;overflow:auto;display:flex;flex-direction:column;gap:10px;padding:12px;border:.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,.3));border-radius:12px;background:var(--dsw-alias-bg-layer-2, rgba(128,128,128,.08))}
.dsc-wf-inspector-title{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary, CanvasText);display:flex;align-items:center;gap:6px}
.dsc-wf-runlog{margin:0;max-height:220px;overflow:auto;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-1, Canvas);border:.5px solid var(--dsw-alias-border-l1, rgba(128,128,128,.24));font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.7;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-primary, CanvasText)}
/* Architecture and execution monitor: container-responsive inside host panels. */
.dsc-architecture,.dsc-wf-editor{container-type:inline-size}
.dsc-arch-hero{padding:24px;border:1px solid var(--dsw-alias-border-l2,#bbc5d5);border-radius:16px;background:linear-gradient(120deg,rgba(76,141,255,.12),rgba(47,163,124,.06));margin-bottom:18px}
.dsc-arch-hero h2{font-size:24px;line-height:1.35;margin:0 0 10px;letter-spacing:-.5px}
.dsc-arch-hero p,.dsc-arch-layer p,.dsc-arch-route p{line-height:1.75;margin:8px 0;color:var(--dsw-alias-label-secondary,CanvasText)}
.dsc-arch-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}
.dsc-arch-kpi{padding:12px 16px;border-radius:12px;background:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.1));display:flex;flex-direction:column;gap:4px}
.dsc-arch-kpi b{font-size:26px;font-variant-numeric:tabular-nums}
.dsc-arch-layers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0 24px;list-style:none;padding:0}
.dsc-arch-layer{border:1px solid var(--dsw-alias-border-l2,#bbc5d5);border-radius:12px;padding:16px;min-width:0}
.dsc-arch-layer h3{font-size:14px;margin:12px 0 8px}
.dsc-arch-number{font:600 12px ui-monospace,monospace;color:var(--dsw-alias-brand-primary,#326bcb);padding:5px 8px;border-radius:7px;background:rgba(76,141,255,.12)}
.dsc-arch-routes{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
.dsc-arch-route{padding:18px;border-radius:12px;border:1px solid var(--dsw-alias-border-l2,#bbc5d5);display:flex;flex-direction:column;align-items:flex-start;gap:8px}
.dsc-arch-route p{flex:1}
.dsc-wf-monitor{padding:12px 14px;border:1px solid var(--dsw-alias-border-l2,#bbc5d5);border-radius:12px;background:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.07));flex:none}
.dsc-wf-monitor-top,.dsc-wf-metrics{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.dsc-wf-monitor-top{justify-content:space-between;margin-bottom:10px}
.dsc-wf-metrics{font-size:12px;margin:8px 0}
.dsc-wf-metric{display:inline-flex;gap:6px;align-items:center}
.dsc-wf-meter{height:6px;border-radius:6px;overflow:hidden;background:rgba(128,128,128,.16)}
.dsc-wf-meter span{display:block;height:100%;background:var(--dsw-alias-brand-primary,#4C8DFF)}
.dsc-wf-motion{display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer}
.dsc-wf-particles{fill:none;stroke:var(--dsw-alias-state-business-primary,#4C8DFF);stroke-width:4;stroke-linecap:round;stroke-dasharray:1 19;pointer-events:none;animation:dsc-flow 2s linear infinite}
@keyframes dsc-flow{to{stroke-dashoffset:-100}}
.dsc-wf-node[data-run="running"]{border-color:var(--dsw-alias-brand-primary,#4C8DFF);box-shadow:0 0 0 2px rgba(76,141,255,.18)}
.dsc-wf-node[data-run="failed"]{border-color:var(--dsw-alias-state-error-primary,#E5484D)}
.dsc-wf-node[data-run="done"]{border-color:var(--dsw-alias-state-success-primary,#2FA37C)}
.dsc-wf-node-status{position:static;display:block;padding:0 9px 8px}
.dsc-wf-node:focus-visible,.dsc-wf-edge-hit:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#4C8DFF);outline-offset:3px}
.dsc-wf-edge-hit:focus-visible{stroke:rgba(76,141,255,.3)}
.dsc-wf-monitor .dsc-hint{margin-top:8px;line-height:1.6}
@media(prefers-reduced-motion:reduce){.dsc-wf-particles{animation:none;display:none}}
@container(max-width:820px){.dsc-arch-layers{grid-template-columns:1fr 1fr}.dsc-wf-canvas-wrap{flex-direction:column;flex:none}.dsc-wf-inspector{width:auto;max-height:340px}.dsc-wf-canvas{height:400px;min-height:400px;flex:none}}
@container(max-width:480px){.dsc-arch-routes,.dsc-arch-layers{grid-template-columns:1fr}.dsc-arch-hero{padding:16px}.dsc-arch-hero h2{font-size:20px}.dsc-arch-kpi{padding:10px}.dsc-arch-kpi b{font-size:22px}.dsc-wf-toolbar input,.dsc-wf-runinput{max-width:100%}.dsc-wf-metrics{gap:8px}}
.dsc-wf-editor{overflow:auto}
@media(max-width:600px){.dsc-head{flex-wrap:wrap;padding:12px}.dsc-tabs{overflow-x:auto;padding-left:12px}.dsc-tab{white-space:nowrap}.dsc-body{padding:12px}.dsc-stats{flex-wrap:wrap}}

.dsc-wf-node{height:96px;box-sizing:border-box}
.dsc-wf-node-body{height:38px;min-height:0;box-sizing:border-box}

/* Company room: intentionally independent of the fixed-flow canvas. */
.dsc-room{--room-bg:#f5f6f8;--room-panel:#ffffff;--room-ink:#202734;--room-muted:#596579;--room-line:#dce1e8;--room-accent:#314ed0;max-width:none;gap:0;background:var(--room-bg);color:var(--room-ink);border:1px solid var(--room-line);border-radius:18px;overflow:hidden;font-size:13px;line-height:1.55}
.dsc-room *{box-sizing:border-box}.dsc-room h2,.dsc-room h3,.dsc-room h4,.dsc-room p{margin:0}.dsc-room h2{font-size:23px;letter-spacing:-.6px;font-weight:650}.dsc-room h3{font-size:13px;font-weight:700}.dsc-room h4{font-size:13px}
.dsc-room-headeractions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.dsc-room-header{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 26px;border-bottom:1px solid var(--room-line);background:var(--room-panel)}
.dsc-room-eyebrow{font-size:10px;letter-spacing:1.8px;color:var(--room-muted);margin-bottom:4px;font-weight:700}.dsc-room-sync{font-size:11px;color:var(--room-muted);border:1px solid var(--room-line);border-radius:20px;padding:5px 10px}
.dsc-room-columns{display:grid;grid-template-columns:218px minmax(260px,1fr) 330px;align-items:start;min-height:650px}
.dsc-room-sidebar{padding:20px 14px;display:flex;flex-direction:column;gap:16px;min-width:0}.dsc-room-sidebar>label{font-size:11px;color:var(--room-muted)}
.dsc-room-main{padding:22px;border-inline:1px solid var(--room-line);background:var(--room-panel);min-width:0;display:flex;flex-direction:column;gap:12px;min-height:650px}
.dsc-room-review{padding:22px 18px;min-width:0;display:flex;flex-direction:column;gap:14px}.dsc-room .dsc-hint{font-size:12px;line-height:1.65;color:var(--room-muted)}.dsc-room .dsc-badge{color:var(--room-ink);background:var(--room-panel);border:1px solid var(--room-line)}.dsc-room .dsc-badge[data-s=running]{color:var(--room-ink);background:var(--room-panel);border-color:var(--room-accent)}
.dsc-room-threadlist{display:flex;flex-direction:column;gap:6px}.dsc-room-thread{font:inherit;text-align:start;background:transparent;color:var(--room-ink);border:1px solid transparent;border-radius:10px;padding:10px;cursor:pointer;display:flex;flex-direction:column;gap:4px;min-width:0}.dsc-room-thread strong{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}.dsc-room-thread span{font-size:11px;color:var(--room-muted)}.dsc-room-thread[aria-current=true]{background:var(--room-panel);border-color:var(--room-line);box-shadow:0 2px 5px #18243808}
.dsc-room-person summary{display:flex;align-items:center;gap:9px;cursor:pointer;font-weight:550}.dsc-room-person p{padding:7px 0 0 39px}.dsc-room-avatar{display:grid;place-items:center;width:29px;height:29px;border:1px solid var(--room-line);border-radius:9px;background:var(--room-panel);color:var(--room-ink);font-size:12px}
.dsc-room-sectionhead,.dsc-room-messagehead{display:flex;align-items:center;justify-content:space-between;gap:12px}.dsc-room-messagehead span{font-size:11px;color:var(--room-muted)}.dsc-room-feed{display:flex;flex-direction:column;gap:14px;min-height:240px}.dsc-room-message{border:1px solid var(--room-line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:9px;background:var(--room-panel);overflow-wrap:anywhere}.dsc-room-owner{background:var(--room-bg);border-inline-start:3px solid var(--room-accent)}.dsc-room-message pre{font:12px/1.7 ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere;max-height:300px;overflow:auto;margin:0}.dsc-room-messagehead [data-status=failed]{color:#b22437}.dsc-room-messagehead [data-status=done]{color:#18734f}.dsc-room-note{padding:20px;color:var(--room-muted);font-size:12px;border:1px dashed var(--room-line);border-radius:12px}.dsc-room-welcome{padding:30px 12px;display:flex;flex-direction:column;gap:10px}
.dsc-room-composer{margin-top:auto;border:1px solid var(--room-line);border-radius:14px;padding:17px;display:flex;flex-direction:column;gap:10px;box-shadow:0 5px 18px #17203508}.dsc-room .dsc-label{color:var(--room-ink);font-size:12px}.dsc-room .dsc-area,.dsc-room .dsc-input{background:var(--room-panel);color:var(--room-ink);border:1px solid var(--room-line);border-radius:8px;width:100%;font:inherit}.dsc-room .dsc-area{min-height:82px;padding:10px;resize:vertical}.dsc-room #dsc-company-outcome{min-height:52px}.dsc-room .dsc-btn{background:var(--room-panel);color:var(--room-ink);border:1px solid var(--room-line);border-radius:9px;min-height:36px;white-space:normal;line-height:1.4}.dsc-room .dsc-btn[data-kind=primary]{background:var(--room-accent);border-color:var(--room-accent);color:#fff}.dsc-room .dsc-btn:disabled{opacity:.55;cursor:not-allowed}.dsc-room :focus-visible{outline:2px solid var(--room-accent);outline-offset:3px}.dsc-room input[type=radio]{accent-color:var(--room-accent)}
.dsc-room .dsc-grid{grid-template-columns:1fr;gap:9px}.dsc-room .dsc-card{background:var(--room-panel);border:1px solid var(--room-line);border-radius:12px;padding:13px;color:var(--room-ink);font-size:12px}.dsc-room .dsc-card:has(input:checked){border-color:var(--room-accent);box-shadow:inset 3px 0 var(--room-accent)}.dsc-room .dsc-card-actions{display:flex;flex-direction:column}.dsc-room .dsc-company-plan{gap:14px}.dsc-room .dsc-company-plan>h3{font-size:15px;line-height:1.5}.dsc-room .dsc-wf-runlog{color:var(--room-ink);background:var(--room-panel);border-color:var(--room-line)}
@media(prefers-color-scheme:dark){.dsc-room{--room-bg:#141820;--room-panel:#1c222d;--room-ink:#eff2f8;--room-muted:#b1bdcf;--room-line:#354051;--room-accent:#829dff}.dsc-room .dsc-btn[data-kind=primary]{color:#10162d}.dsc-room-messagehead [data-status=failed]{color:#ffacb6}.dsc-room-messagehead [data-status=done]{color:#7fdbb2}}
@container(max-width:1100px){.dsc-room-columns{grid-template-columns:180px minmax(240px,1fr)}.dsc-room-review{grid-column:2;border-inline-start:1px solid var(--room-line);border-top:1px solid var(--room-line)}.dsc-room-main{border-inline-end:0}}
@container(max-width:700px){.dsc-room-columns{display:flex;flex-direction:column}.dsc-room-sidebar,.dsc-room-main,.dsc-room-review{width:100%;border:0;min-height:0}.dsc-room-sidebar{border-bottom:1px solid var(--room-line)}.dsc-room-threadlist{max-height:150px;overflow:auto}.dsc-room-header{padding:18px;align-items:flex-start}.dsc-room-sync{max-width:130px}.dsc-room-main,.dsc-room-review{padding:18px}.dsc-room-review{border-top:1px solid var(--room-line)}}


.dsc-quant{--q-bg:#f5f7fa;--q-panel:#fff;--q-ink:#202938;--q-muted:#526278;--q-line:#d6dee9;--q-accent:#3156c7;background:var(--q-bg);color:var(--q-ink);padding:24px;border:1px solid var(--q-line);border-radius:16px;display:flex;flex-direction:column;gap:20px;line-height:1.5;max-width:1500px;margin:auto}
.dsc-quant *{box-sizing:border-box}.dsc-quant h2,.dsc-quant h3,.dsc-quant h4,.dsc-quant p{margin:0}.dsc-quant-head{display:flex;justify-content:space-between;align-items:center;gap:20px}.dsc-quant h2{font-size:25px;letter-spacing:-.5px;margin:6px 0}.dsc-quant-head p,.dsc-quant-note{color:var(--q-muted);font-size:12px}.dsc-quant-kicker{font-size:11px;font-weight:650;letter-spacing:.6px;color:var(--q-accent)}.dsc-quant-meta{padding:13px 16px;border:1px solid var(--q-line);background:var(--q-panel);border-radius:10px;display:flex;gap:16px;justify-content:space-between;flex-wrap:wrap;font-size:12px}.dsc-quant-meta span{color:var(--q-muted)}
.dsc-quant-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}.dsc-quant-role{border:1px solid var(--q-line);border-radius:13px;padding:18px;background:var(--q-panel);display:flex;flex-direction:column;gap:13px;min-width:0;overflow-wrap:anywhere}.dsc-quant-rolehead{display:flex;align-items:center;gap:10px}.dsc-quant-role h3{font-size:14px}.dsc-quant-index{border:1px solid var(--q-line);padding:5px 7px;border-radius:7px;color:var(--q-accent);font:12px ui-monospace,monospace}.dsc-quant-status{font-size:12px;font-weight:600;padding-bottom:12px;border-bottom:1px solid var(--q-line)}.dsc-quant dl{margin:0;font-size:12px}.dsc-quant dt{color:var(--q-muted);margin-bottom:4px}.dsc-quant dd{margin:0 0 12px;font-variant-numeric:tabular-nums}.dsc-quant h4{font-size:12px;margin-bottom:9px}.dsc-quant-counts{border-top:1px solid var(--q-line);padding-top:12px}.dsc-quant-counts dl>div{display:flex;justify-content:space-between;gap:8px}.dsc-quant-counts p{font-size:12px}.dsc-quant-blocker{margin-top:auto;border-left:3px solid var(--q-line);padding:9px 11px;background:var(--q-bg);font-size:12px}.dsc-quant-blocker p{margin-top:5px}.dsc-quant-warning{border:1px solid var(--q-line);border-left:3px solid #ac6b1a;border-radius:8px;padding:12px;font-size:12px;background:var(--q-panel)}.dsc-quant .dsc-btn{background:var(--q-panel);color:var(--q-ink);border:1px solid var(--q-line);min-height:36px}.dsc-quant :focus-visible{outline:2px solid var(--q-accent);outline-offset:3px}
@media(prefers-color-scheme:dark){.dsc-quant{--q-bg:#131a25;--q-panel:#1d2735;--q-ink:#edf3fc;--q-muted:#b3c0d4;--q-line:#3a495f;--q-accent:#9cb9ff}}
@container(max-width:600px){.dsc-quant{padding:15px;gap:14px}.dsc-quant-head{align-items:flex-start;flex-wrap:wrap}.dsc-quant-grid{grid-template-columns:1fr}.dsc-quant h2{font-size:22px}}

.dsc-quant-terminal{display:grid;grid-template-columns:232px minmax(0,1fr);gap:22px;align-items:start}.dsc-quant-roster{display:flex;flex-direction:column;gap:10px}.dsc-quant-person{padding:13px;border:1px solid var(--q-line);border-radius:9px;background:var(--q-panel);display:flex;flex-direction:column;gap:9px;min-width:0;font-size:12px}.dsc-quant-person small{font-size:10px;color:var(--q-muted);overflow-wrap:anywhere}.dsc-quant-person p{color:var(--q-muted)}.dsc-quant-evidence{min-width:0;display:flex;flex-direction:column;gap:18px}.dsc-quant-path{list-style:none;padding:0;margin:14px 0 0;display:flex;gap:8px;flex-wrap:wrap}.dsc-quant-path li{flex:1;min-width:115px;padding:10px;border:1px solid var(--q-line);background:var(--q-panel);border-radius:7px;font-size:11px;display:flex;flex-direction:column;gap:8px}.dsc-quant-pill{font:11px/1.5 ui-monospace,monospace;align-self:flex-start;padding:2px 7px;border-radius:5px;background:var(--q-bg);border:1px solid var(--q-line);color:var(--q-muted)}.dsc-quant-pill[data-status=running]{color:#2359a6;background:#edf4ff}.dsc-quant-pill[data-status=blocked],.dsc-quant-pill[data-status=stale]{color:#8c4d10;background:#fff4df}.dsc-quant-pill[data-status=done]{color:#246946;background:#eaf6ee}.dsc-quant-log{border:1px solid var(--q-line);background:var(--q-panel);border-radius:10px;padding:16px}.dsc-quant-log ol{list-style:none;padding:0;margin:12px 0 0}.dsc-quant-log li{display:flex;gap:8px;flex-wrap:wrap;padding:12px 0;border-top:1px solid var(--q-line);font-size:12px}.dsc-quant-log time{font:10px ui-monospace,monospace;color:var(--q-muted)}.dsc-quant-log p{width:100%}.dsc-quant-grid{grid-template-columns:repeat(auto-fit,minmax(225px,1fr))}.dsc-quant-role{padding:14px}.dsc-quant-role h3{font-size:13px}
@media(prefers-color-scheme:dark){.dsc-quant-pill[data-status=running]{color:#acd0ff;background:#253c60}.dsc-quant-pill[data-status=blocked],.dsc-quant-pill[data-status=stale]{color:#f4ce9a;background:#493922}.dsc-quant-pill[data-status=done]{color:#a4dfbd;background:#243e30}}
@container(max-width:750px){.dsc-quant-terminal{grid-template-columns:1fr}.dsc-quant-roster{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}.dsc-quant-path{display:grid;grid-template-columns:1fr 1fr}.dsc-quant-path li{min-width:0}}

/* Evidence motion is driven only by new IDs or explicit archive playback. */
.dsc-quant{padding:16px;gap:12px;background:var(--q-bg)}.dsc-quant-head h2{font-size:21px}.dsc-quant-meta{padding:8px 12px}.dsc-quant-terminal{gap:14px;grid-template-columns:220px minmax(0,1fr)}.dsc-quant-evidence{gap:12px}.dsc-quant-roster{gap:7px}.dsc-quant-person{padding:11px;gap:6px}.dsc-quant-stream{padding:13px}.dsc-quant-streamhead{display:flex;justify-content:space-between;gap:10px}.dsc-quant-streamhead span{font-size:11px;color:var(--q-muted)}.dsc-quant-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0;font-size:12px}.dsc-quant-controls label{display:flex;align-items:center;gap:6px}.dsc-quant-scroll{height:310px;overflow:auto;overscroll-behavior:contain;scroll-behavior:auto;border-top:1px solid var(--q-line)}.dsc-quant-log .dsc-quant-scroll ol{margin:0}.dsc-quant-scroll li{padding:10px 6px}.dsc-quant-scroll code{font-size:10px;color:var(--q-muted)}.dsc-quant-scroll small{font:10px ui-monospace,monospace;color:var(--q-muted)}.dsc-quant-empty{padding:24px 12px;color:var(--q-muted);font-size:12px}.dsc-quant-eventreason{color:var(--q-muted)}.dsc-quant-metrics>summary{font-size:12px;cursor:pointer;padding:10px;border:1px solid var(--q-line);border-radius:7px;background:var(--q-panel)}.dsc-quant-metrics .dsc-quant-grid{margin-top:10px}
@keyframes dsc-quant-activity{0%{box-shadow:inset 3px 0 var(--q-accent);background:#e8efff}100%{box-shadow:inset 0 0 transparent}}
.dsc-quant-person[data-pulse="1"],.dsc-quant-scroll li[data-new="1"]{animation:dsc-quant-activity .8s ease-out}
@media(prefers-color-scheme:dark){@keyframes dsc-quant-activity{0%{box-shadow:inset 3px 0 var(--q-accent);background:#263c5c}100%{box-shadow:inset 0 0 transparent}}}
@media(prefers-reduced-motion:reduce){.dsc-quant-person[data-pulse="1"],.dsc-quant-scroll li[data-new="1"]{animation:none}.dsc-quant-scroll{scroll-behavior:auto}}
@container(max-width:750px){.dsc-quant-terminal{display:flex;flex-direction:column}.dsc-quant-evidence{order:0;width:100%}.dsc-quant-roster{order:1;width:100%;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}.dsc-quant-scroll{height:280px}}

.dsc-quant-terminal{grid-template-columns:285px minmax(0,1fr)}.dsc-quant-people-sidebar{min-width:0}.dsc-quant-employees{display:flex;flex-direction:column;gap:12px;font-size:12px}.dsc-quant-employee{padding:13px;background:var(--q-panel);border:1px solid var(--q-line);border-radius:10px;display:flex;flex-direction:column;gap:10px;overflow-wrap:anywhere}.dsc-quant-employee header{display:flex;gap:9px;align-items:center}.dsc-quant-employee h4{font-size:14px;margin:0}.dsc-quant-employee header p{color:var(--q-muted);font-size:11px}.dsc-quant-employeeavatar{width:34px;height:34px;border:1px solid var(--q-line);background:var(--q-bg);border-radius:10px;display:grid;place-items:center;font-weight:650;flex:none}.dsc-quant-personwork{display:flex;flex-direction:column;gap:4px;padding:8px 0;border-top:1px solid var(--q-line)}.dsc-quant-workorigin{font-size:10px;font-weight:600;color:var(--q-muted)}.dsc-quant-personwork time{font-size:10px;color:var(--q-muted)}.dsc-quant-employee pre{font:11px/1.6 ui-monospace,monospace;max-height:180px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;padding:8px;background:var(--q-bg);border-radius:6px}.dsc-quant-employee summary{cursor:pointer}.dsc-quant-owners{display:flex;flex-direction:column;gap:9px;padding:13px;border:1px solid var(--q-line);border-radius:10px;background:var(--q-panel)}.dsc-quant-owners label{display:flex;flex-direction:column;gap:4px}.dsc-quant-owners select{padding:8px;border:1px solid var(--q-line);border-radius:6px;background:var(--q-bg);color:var(--q-ink);width:100%;font:inherit}.dsc-quant-raw{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.dsc-quant-raw .dsc-quant-person{font-size:11px}
@container(max-width:750px){.dsc-quant-people-sidebar{order:0;width:100%}.dsc-quant-evidence{order:1}.dsc-quant-employees{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}.dsc-quant-employees>h3,.dsc-quant-employees>.dsc-quant-note,.dsc-quant-owners{grid-column:1/-1}}
/* Neon is scoped to the Quant cockpit, independent of the Host theme. */
.dsc-quant.dsc-quant-neon{
  color-scheme:dark;--q-bg:#000;--q-panel:#090c14;--q-ink:#f1f5ff;
  --q-muted:#aab6cc;--q-line:#283247;--q-accent:#9edfff;
  color:var(--q-ink);background:#000;border:1px solid #313a50;border-radius:16px;
}
.dsc-quant-neon .dsc-quant-kicker{color:#8ce8ff;letter-spacing:.13em}
.dsc-quant-neon .dsc-quant-terminal{gap:16px}
.dsc-quant-neon .dsc-quant-employees{gap:8px}
.dsc-quant-neon .dsc-quant-employee{
  --neon-a:#4fe1ff;--neon-b:#7f83ff;
  border:1px solid transparent;border-radius:11px;min-height:100px;
  background:linear-gradient(155deg,#0d1220,#07090f 70%) padding-box,
    linear-gradient(126deg,var(--neon-a),#292d43 56%,var(--neon-b)) border-box;
}
.dsc-quant-neon .dsc-quant-employee[data-accent="1"]{--neon-a:#c692ff;--neon-b:#fa77d5}
.dsc-quant-neon .dsc-quant-employee[data-accent="2"]{--neon-a:#50f3cf;--neon-b:#6f85ff}
.dsc-quant-neon .dsc-quant-employee[data-accent="3"]{--neon-a:#ffbe63;--neon-b:#f170b3}
.dsc-quant-neon .dsc-quant-employee[data-accent="4"]{--neon-a:#7faaff;--neon-b:#5bf1eb}
.dsc-quant-neon .dsc-quant-employee[data-accent="5"]{--neon-a:#fb79ad;--neon-b:#aa95ff}
.dsc-quant-neon .dsc-quant-employee[data-accent="6"]{--neon-a:#b5f477;--neon-b:#60d2ff}
.dsc-quant-neon .dsc-quant-employeeavatar{color:var(--neon-a);border-color:var(--neon-a);background:#0e1721}
.dsc-quant-neon .dsc-quant-employee[data-working="1"]{
  background:linear-gradient(155deg,#121c2a,#090b13 70%) padding-box,
   linear-gradient(126deg,var(--neon-a),var(--neon-b)) border-box;
  box-shadow:0 0 15px color-mix(in srgb,var(--neon-a) 25%,transparent);
}
.dsc-quant-neon .dsc-quant-workorigin{color:var(--neon-a)}
.dsc-quant-neon .dsc-quant-stream{border:1px solid transparent;
  background:linear-gradient(#090c14,#090c14) padding-box,linear-gradient(133deg,#5babf7,#343153 55%,#8256aa) border-box}
.dsc-quant-neon .dsc-quant-pill[data-status=running]{color:#99ebff;background:#102a3a;border-color:#3b647b}
.dsc-quant-neon .dsc-quant-pill[data-status=done]{color:#89f1bb;background:#142c26;border-color:#335f51}
.dsc-quant-neon .dsc-quant-pill[data-status=blocked],.dsc-quant-neon .dsc-quant-pill[data-status=stale]{color:#ffd396;background:#312314;border-color:#76572d}
.dsc-quant-neon .dsc-quant-scroll li[data-new="1"],.dsc-quant-neon .dsc-quant-person[data-pulse="1"]{animation:dsc-quant-neon-event .8s ease-out}
@keyframes dsc-quant-neon-event{0%{box-shadow:inset 3px 0 #8deaff,inset 0 0 20px #203d59}100%{box-shadow:none}}
@media(prefers-reduced-motion:reduce){.dsc-quant-neon .dsc-quant-scroll li[data-new="1"],.dsc-quant-neon .dsc-quant-person[data-pulse="1"]{animation:none}}

.dsc-root.dsc-workspace{--dsw-alias-bg-layer-1:#080a0f;--dsw-alias-bg-layer-2:#111620;--dsw-alias-bg-layer-3:#1b2330;--dsw-alias-label-primary:#eef1f8;--dsw-alias-label-secondary:#ccd4e3;--dsw-alias-label-tertiary:#a2afc4;--dsw-alias-label-dimmed:#8b9ab0;--dsw-alias-label-primary-inverted:#11192c;--dsw-alias-border-l1:#252d3c;--dsw-alias-border-l2:#354055;--dsw-alias-border-l4:#3b495f;--dsw-alias-settings-card-fill:#121823;--dsw-alias-settings-card-stroke:#344058;--dsw-alias-button-elevated-fill:#192130;--dsw-alias-interactive-bg-hover:#263248;--dsw-alias-brand-primary:#a9bcff;--dsw-alias-state-business-primary:#acc3ff;--dsw-alias-button-primary-fill:#aec0ff;--dsw-alias-button-primary-hover:#c6d1ff;--dsw-alias-button-primary-dimmed:#293557;--dsw-alias-state-success-primary:#81e5be;--dsw-alias-state-success-secondary:#19392f;--dsw-alias-state-error-primary:#ff9ca8;--dsw-alias-state-error-secondary:#482633;--dsw-alias-state-warn-primary:#f2c587;--dsw-alias-state-warn-secondary:#423221;display:grid;grid-template-columns:170px minmax(0,1fr);grid-template-rows:auto auto minmax(0,1fr);container-type:inline-size;color-scheme:dark;position:relative}
.dsc-workspace *{box-sizing:border-box}.dsc-workspace :focus-visible{outline:2px solid #bfd5ff;outline-offset:2px}
.dsc-workspace .dsc-work-head{grid-column:1/-1;min-width:0;gap:10px;background:#0e121a;padding:12px 16px;border-color:#2a3449}
.dsc-work-brand{display:grid;place-items:center;flex:none;width:34px;height:34px;background:#252b46;color:#c5caff;border:1px solid #575d89;border-radius:10px;font-size:20px}
.dsc-work-title{min-width:0}.dsc-work-title .dsc-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:0}
.dsc-workspace .dsc-stat{padding:4px 8px;align-items:flex-start;background:#171e2b}.dsc-workspace .dsc-stat b{font-variant-numeric:tabular-nums}
.dsc-workspace .dsc-work-dispatch{min-height:34px;padding:6px 12px;font-weight:700;white-space:nowrap}
.dsc-work-nav{grid-column:1;grid-row:2/4;min-height:0;overflow:auto;display:flex;flex-direction:column;padding:14px 9px 10px;background:#0c1018;border-right:1px solid #252e40;gap:9px}
.dsc-work-nav-caption{font-size:10px;font-weight:720;letter-spacing:.08em;color:#9caac0;margin:0;padding:0 7px;text-transform:uppercase}
.dsc-work-links{display:flex;flex-direction:column;gap:4px}
.dsc-workspace .dsc-work-link{display:flex;align-items:center;text-align:left;gap:8px;min-height:35px;border:1px solid transparent;border-radius:7px;white-space:normal;padding:6px 8px;font-size:12px}
.dsc-workspace .dsc-work-link[data-on="1"]{border-color:color-mix(in srgb,var(--dsc-route) 48%,#263550);box-shadow:inset 2px 0 var(--dsc-route);background:color-mix(in srgb,var(--dsc-route) 13%,#131926)}
.dsc-work-icon{color:var(--dsc-route);width:16px;flex:none;text-align:center;font-size:15px}
.dsc-work-nav-footer{display:flex;gap:5px;flex-wrap:wrap;margin-top:auto;padding-top:12px}
.dsc-workspace>.dsc-body{grid-column:2;grid-row:2/4;min-width:0;min-height:0;padding:14px 16px 22px}
.dsc-workspace .dsc-work-pagehead{padding:11px 14px;margin-bottom:14px;background:#111724;border:1px solid #2e3a50;border-left:3px solid var(--dsc-page-accent);border-radius:9px;flex:none}
.dsc-work-pagehead h2{font-size:20px;line-height:1.2;margin:3px 0 4px;font-weight:690}.dsc-work-pagehead p{color:#afbbcf;margin:0}.dsc-work-pagehead .dsc-work-nav-caption{padding:0}
.dsc-work-stale{padding:8px 10px;margin-bottom:8px;border:1px solid #5b492b;border-radius:7px;background:#30271c;color:#f0ca91;flex:none}
.dsc-workspace .dsc-grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,218px),1fr))}
.dsc-workspace .dsc-card-actions{flex-wrap:wrap}
.dsc-workspace .dsc-room{--room-bg:#0e131c;--room-panel:#141c29;--room-ink:#edf1fa;--room-muted:#adb9ce;--room-line:#39465e;--room-accent:#a9baff}
.dsc-workspace .dsc-room .dsc-btn[data-kind=primary]{color:#10182a}
.dsc-workspace .dsc-room-messagehead [data-status=failed]{color:#ffacb6}.dsc-workspace .dsc-room-messagehead [data-status=done]{color:#84dfb5}
.dsc-workspace .dsc-room-columns{grid-template-columns:clamp(140px,20%,210px) minmax(0,1fr) clamp(235px,29%,300px)}
@container(max-width:1040px){.dsc-workspace .dsc-room-columns{grid-template-columns:clamp(120px,24%,180px) minmax(0,1fr)}}
@container(max-width:1000px){.dsc-workspace .dsc-body-workflow{overflow:auto}.dsc-workspace .dsc-wf-editor,.dsc-workspace .dsc-wf-list{flex:none}}
@container(max-width:830px){.dsc-workspace .dsc-room-columns{display:flex;flex-direction:column}.dsc-workspace .dsc-room-sidebar,.dsc-workspace .dsc-room-main,.dsc-workspace .dsc-room-review{width:100%;border:0;min-height:0}.dsc-workspace .dsc-room-sidebar,.dsc-workspace .dsc-room-main{border-bottom:1px solid var(--room-line)}}

.dsc-workspace .dsc-of-layout{grid-template-columns:minmax(0,2.8fr) minmax(180px,1fr)}.dsc-workspace .dsc-ofc{--of-bg:#080b12;--of-line:#35415c}
.dsc-workspace .dsc-of-bossnote{display:flex;align-items:center;justify-content:space-between;gap:9px;padding:7px 9px;border:0;border-radius:6px;background:#1a202e}.dsc-workspace .dsc-of-bossnote p{margin:0}
@container(max-width:830px){.dsc-workspace .dsc-of-layout{grid-template-columns:minmax(0,1fr)}.dsc-workspace .dsc-of-rail{grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))}.dsc-workspace .dsc-work-head{padding:9px 12px}}
@container(max-width:650px){
.dsc-workspace .dsc-work-nav{grid-column:1/-1;grid-row:2;flex-direction:row;align-items:center;overflow:auto;padding:3px 8px;border-right:0;border-bottom:1px solid #2a3449;min-height:42px;gap:5px}
.dsc-workspace .dsc-work-nav-caption,.dsc-workspace .dsc-stats{display:none}.dsc-workspace .dsc-work-links,.dsc-workspace .dsc-work-nav-footer{flex-direction:row;flex:none}.dsc-workspace .dsc-work-nav-footer{margin-top:0;padding-top:0;flex-wrap:nowrap}
.dsc-workspace .dsc-work-link{white-space:nowrap;min-height:32px}.dsc-workspace .dsc-work-nav .dsc-btn{white-space:nowrap}
.dsc-workspace>.dsc-body{grid-column:1/-1;grid-row:3;padding:11px 10px 16px}
.dsc-workspace .dsc-room{grid-template-columns:minmax(0,1fr)}
.dsc-workspace .dsc-of-bossnote{align-items:start;flex-direction:column}
}

`;

    function initial(text) {
      const trimmed = String(text || '').trim();
      return trimmed ? trimmed.slice(0, 1) : '·';
    }

    /** 把 {name} 占位符替换成实参；未命中的占位符原样留下。 */
    function fill(template, values) {
      return String(template || '').replace(/\{(\w+)\}/g, (match, key) =>
        values && Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
      );
    }

    /** 毫秒时间戳 / ISO 串 → 本地时区 YYYY-MM-DD HH:mm；解析不了就原样返回。 */
    function formatTime(value) {
      if (value === undefined || value === null || value === '') return '';
      const date = typeof value === 'number' ? new Date(value) : new Date(String(value));
      if (Number.isNaN(date.getTime())) return String(value);
      const pad = (part) => String(part).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function Dot({ state }) {
      const color =
        state === 'running'
          ? 'var(--dsw-alias-state-business-primary, #4C8DFF)'
          : state === 'failed'
            ? 'var(--dsw-alias-state-error-primary, #E5484D)'
            : 'var(--dsw-alias-state-success-primary, #2FA37C)';
      return h('span', { className: 'dsc-dot', style: { background: color } });
    }

    function Avatar({ name, accent }) {
      return h(
        'div',
        { className: 'dsc-msg-av', style: { background: accent || 'var(--dsw-alias-brand-primary, #4C8DFF)' } },
        initial(name),
      );
    }

    function useDict(translate) {
      const dict = useMemo(() => {
        const hostLabel = typeof translate === 'function' ? translate('tabRoster') : null;
        if (hostLabel === DICT.en.tabRoster) return DICT.en;
        if (hostLabel === DICT.zh.tabRoster) return DICT.zh;
        const tag = String((typeof navigator !== 'undefined' && navigator.language) || 'zh').toLowerCase();
        return tag.startsWith('zh') ? DICT.zh : DICT.en;
      }, [translate]);
      return useCallback(
        (key) => {
          if (typeof translate === 'function') {
            const value = translate(key);
            // English labels may intentionally equal their keys (done, failed, skipped).
            if (value && (value !== key || DICT.en[key] === key || DICT.zh[key] === key)) return value;
          }
          return dict[key] || key;
        },
        [translate, dict],
      );
    }

    function ModelPicker({ value, models, loading, onPick, onReload, t }) {
      const groups = useMemo(() => {
        const map = new Map();
        for (const model of models) {
          if (!map.has(model.provider)) map.set(model.provider, []);
          map.get(model.provider).push(model);
        }
        return [...map.entries()];
      }, [models]);
      const current = value && value.provider && value.model ? `${value.provider}||${value.model}` : '';
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'dsc-label', style: { display: 'flex', alignItems: 'center', gap: 8 } },
          t('employeeModel'),
          h('span', { style: { flex: 1 } }),
          h('button', { className: 'dsc-btn', 'data-kind': 'ghost', onClick: onReload }, t('reloadModels')),
        ),
        h(
          'select',
          {
            className: 'dsc-input',
            value: current,
            onChange: (event) => {
              const picked = event.target.value;
              if (!picked) return onPick(null);
              const index = picked.indexOf('||');
              onPick({ provider: picked.slice(0, index), model: picked.slice(index + 2) });
            },
          },
          h('option', { value: '' }, t('modelDefault')),
          groups.map(([provider, list]) =>
            h(
              'optgroup',
              { key: provider, label: provider },
              list.map((model) =>
                h(
                  'option',
                  { key: `${provider}||${model.id}`, value: `${provider}||${model.id}` },
                  model.name && model.name !== model.id ? `${model.name} · ${model.id}` : model.id,
                ),
              ),
            ),
          ),
        ),
        loading ? h('div', { className: 'dsc-hint' }, t('modelLoading')) : null,
        !loading && models.length === 0 ? h('div', { className: 'dsc-hint' }, t('modelEmpty')) : null,
      );
    }

    function EmployeeEditor({ employee, templates, tools, models, modelsLoading, onReloadModels, onClose, onSave, t }) {
      const [draft, setDraft] = useState(() => ({
        ...employee,
        skills: [...(employee.skills || [])],
        provider: employee.provider || '',
        model: employee.model || '',
      }));
      const ref = useRef(null);
      useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onClose();
          }
        };
        document.addEventListener('keydown', onKey);
        if (ref.current) {
          const first = ref.current.querySelector('input');
          if (first) first.focus();
        }
        return () => document.removeEventListener('keydown', onKey);
      }, [onClose]);

      const patch = (next) => setDraft((current) => ({ ...current, ...next }));
      const toggleSkill = (name) =>
        setDraft((current) => ({
          ...current,
          skills: current.skills.includes(name)
            ? current.skills.filter((item) => item !== name)
            : [...current.skills, name],
        }));
      const applyTemplate = (roleId) => {
        const template = templates.find((item) => item.id === roleId);
        if (!template) return;
        setDraft((current) => ({
          ...current,
          role: template.id,
          title: template.title,
          persona: template.persona,
          skills: [...template.skills].filter((name) => tools.some((tool) => tool.name === name)),
        }));
      };

      return h(
        'div',
        {
          className: 'dsc-mask',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          },
        },
        h(
          'div',
          { className: 'dsc-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('edit'), ref },
          h(
            'div',
            { className: 'dsc-modal-head' },
            h('div', { className: 'dsc-modal-title' }, draft.name || t('hire')),
            h('button', { className: 'dsc-btn', 'data-kind': 'ghost', onClick: onClose }, t('close')),
          ),
          h(
            'div',
            null,
            h('div', { className: 'dsc-label' }, t('employeeRole')),
            h(
              'select',
              { className: 'dsc-input', value: draft.role, onChange: (event) => applyTemplate(event.target.value) },
              templates.map((template) => h('option', { key: template.id, value: template.id }, template.name)),
            ),
          ),
          h(
            'div',
            null,
            h('div', { className: 'dsc-label' }, t('employeeName')),
            h('input', {
              className: 'dsc-input',
              value: draft.name,
              onChange: (event) => patch({ name: event.target.value }),
            }),
          ),
          h(
            'div',
            null,
            h('div', { className: 'dsc-label' }, t('employeeTitle')),
            h('input', {
              className: 'dsc-input',
              value: draft.title,
              onChange: (event) => patch({ title: event.target.value }),
            }),
          ),
          h(ModelPicker, {
            value: draft,
            models,
            loading: modelsLoading,
            onReload: onReloadModels,
            t,
            onPick: (picked) =>
              patch(picked ? { provider: picked.provider, model: picked.model } : { provider: '', model: '' }),
          }),
          h(
            'div',
            null,
            h('div', { className: 'dsc-label' }, t('employeePersona')),
            h('textarea', {
              className: 'dsc-area',
              style: { minHeight: 130 },
              value: draft.persona,
              placeholder: t('employeePersonaPh'),
              onChange: (event) => patch({ persona: event.target.value }),
            }),
          ),
          h(
            'div',
            null,
            h('div', { className: 'dsc-label' }, t('employeeSkills')),
            h(
              'div',
              { className: 'dsc-tools' },
              tools.length === 0
                ? h('div', { className: 'dsc-hint' }, '—')
                : tools.map((tool) =>
                    h(
                      'label',
                      { className: 'dsc-tool', key: tool.name, title: tool.description },
                      h('input', {
                        type: 'checkbox',
                        checked: draft.skills.includes(tool.name),
                        onChange: () => toggleSkill(tool.name),
                      }),
                      tool.name,
                    ),
                  ),
            ),
            h('div', { className: 'dsc-hint' }, t('skillsHint')),
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' } },
            h('button', { className: 'dsc-btn', onClick: onClose }, t('cancel')),
            h('button', { className: 'dsc-btn', 'data-kind': 'primary', onClick: () => onSave(draft) }, t('save')),
          ),
        ),
      );
    }

    function EmployeeCoordination({employeeId,t,onOpenGroup,request=call}) {
      const en=t('companyMode')===DICT.en.companyMode;
      const L=(zh,english)=>en?english:zh;
      const [snapshot,setSnapshot]=useState(null);
      useEffect(()=>{
        let alive=true, pending=false;
        async function refresh(){
          if(pending)return;
          pending=true;
          try{
            const value=await request('employee-groups',{employeeId});
            if(!Array.isArray(value?.groups)||value.employeeId!==employeeId) throw new Error('Invalid collaboration response');
            if(alive)setSnapshot({employeeId,rows:value.groups});
          }catch{if(alive)setSnapshot({employeeId,error:true});}
          finally{pending=false;}
        }
        refresh();
        const timer=setInterval(refresh,2500);
        return()=>{alive=false;clearInterval(timer);};
      },[employeeId,request]);
      const state=snapshot?.employeeId===employeeId?snapshot:null;
      const status=round=>({
        queued:L('最近一轮：待开始','Latest round: waiting to start'),
        running:L('最近一轮：回复中','Latest round: responding'),
        done:L('最近一轮：已回复','Latest round: replied'),
        failed:L('最近一轮：未能回复','Latest round: failed to reply'),
        interrupted:L('最近一轮：已中断','Latest round: interrupted'),
      })[round?.status]||L('尚无参与记录','No recorded participation');
      return h('section',{className:'dsc-staff-collab','aria-label':L('协作记录','Collaboration record')},
        h('style',null,'.dsc-staff-collab{border:1px solid #58678355;border-radius:10px;margin:0 14px 12px;padding:12px}.dsc-staff-collab h3{margin:0 0 5px;font-size:14px}.dsc-staff-collab ul{padding:0;margin:8px 0 0;list-style:none}.dsc-staff-collab li{padding:8px 0;border-top:1px solid #58678344;display:flex;gap:8px;justify-content:space-between;align-items:center}.dsc-staff-collab li small{display:block;overflow-wrap:anywhere}.dsc-staff-collab li div{min-width:0;overflow-wrap:anywhere}'),
        h('h3',null,L('协作记录','Collaboration record')),
        h('p',{className:'dsc-hint'},L('群成员身份不代表已参与；只显示真实轮次和已保存回复。','Membership does not mean participation. Only recorded rounds and saved replies are shown.')),
        !state?h('p',{role:'status'},t('loading')):state.error?h('p',{role:'status'},L('暂时无法核对协作记录。','Collaboration records could not be verified.')):
          !state.rows.length?h('p',null,L('此员工尚未加入任何群聊。','This employee has not been added to any group.')):
          h('ul',null,state.rows.map(row=>h('li',{key:row.id},
            h('div',null,h('strong',null,row.name),h('small',null,L(`群成员 · 共 ${row.memberCount} 人`,`Member · ${row.memberCount} people`)),
              h('small',null,status(row.latestRound)),
              row.latestRound?.participatedAt?h('small',null,L('实际开始：','Actual start: ')+formatTime(row.latestRound.participatedAt)):null,
              row.lastReplyAt?h('small',null,L('最近已保存回复：','Last saved reply: ')+formatTime(row.lastReplyAt)):null),
            h('button',{className:'dsc-btn',type:'button','aria-label':L('打开群聊：','Open group: ')+row.name,onClick:()=>onOpenGroup(row.id)},L('打开群聊','Open group'))))));
    }
    function EmployeeDetail({ employee, onClose, onToast, onOpenGroup, t }) {
      const [data, setData] = useState(null);
      const [error, setError] = useState('');
      const [memory, setMemory] = useState(null);
      const [memoryError, setMemoryError] = useState('');
      const [note, setNote] = useState('');
      const [noteBusy, setNoteBusy] = useState(false);
      const ref = useRef(null);

      const load = useCallback(async () => {
        try {
          setData(await call('transcript', { id: employee.id }));
          setError('');
        } catch (caught) {
          setError(caught && caught.message ? caught.message : String(caught));
        }
      }, [employee.id]);

      const loadMemory = useCallback(async () => {
        try {
          const result = await call('memory', { employeeId: employee.id });
          setMemory(result && typeof result === 'object' ? result : null);
          setMemoryError('');
        } catch (caught) {
          setMemoryError(caught && caught.message ? caught.message : String(caught));
        }
      }, [employee.id]);

      useEffect(() => {
        load();
        const timer = setInterval(load, 3000);
        return () => clearInterval(timer);
      }, [load]);

      useEffect(() => {
        loadMemory();
        const timer = setInterval(loadMemory, 10000);
        return () => clearInterval(timer);
      }, [loadMemory]);

      useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onClose();
          }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
      }, [onClose]);

      const messages = data && Array.isArray(data.messages) ? data.messages : EMPTY;

      const submitNote = async () => {
        const text = note.trim();
        if (!text || noteBusy) return;
        setNoteBusy(true);
        try {
          const result = await call('memory', { employeeId: employee.id, text });
          setNote('');
          if (result && typeof result === 'object' && Array.isArray(result.entries)) setMemory(result);
          else await loadMemory();
          if (onToast) onToast(t('noteSaved'));
        } catch (caught) {
          if (onToast) onToast(caught && caught.message ? caught.message : String(caught));
        } finally {
          setNoteBusy(false);
        }
      };

      const memoryPath =
        memory && memory.path
          ? String(memory.path)
          : typeof employee.memoryPath === 'string' && employee.memoryPath
            ? employee.memoryPath
            : '';
      const memoryList = memory && Array.isArray(memory.entries) ? memory.entries : EMPTY;
      const memoryContent = memory && typeof memory.content === 'string' ? memory.content : '';
      const memoryEntries = memoryList.length
        ? memoryList.length
        : memory && typeof memory.entries === 'number' && Number.isFinite(memory.entries)
          ? memory.entries
          : Number.isFinite(Number(employee.memoryEntries))
            ? Number(employee.memoryEntries)
            : 0;

      const formatMemoryTime = formatTime;

      return h(
        'div',
        {
          className: 'dsc-mask',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          },
        },
        h(
          'div',
          { className: 'dsc-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('detailTitle'), ref },
          h(
            'div',
            { className: 'dsc-modal-head' },
            h(Avatar, { name: employee.name, accent: employee.accent }),
            h(
              'div',
              { style: { flex: 1, minWidth: 0 } },
              h('div', { className: 'dsc-modal-title' }, `${employee.name} · ${employee.title || employee.roleName}`),
              h(
                'div',
                { className: 'dsc-hint', style: { marginTop: 0 } },
                `${t('transcriptHint')}${data && data.sessionId ? ` · ${t('openSession')} ${String(data.sessionId).slice(0, 8)}` : ''}`,
              ),
            ),
            h('button', { className: 'dsc-btn', 'data-kind': 'ghost', onClick: onClose }, t('close')),
          ),
          onOpenGroup?h(EmployeeCoordination,{employeeId:employee.id,t,onOpenGroup}):null,
          error ? h('div', { className: 'dsc-err' }, error) : null,
          !data
            ? h('div', { className: 'dsc-empty' }, t('loading'))
            : messages.length === 0
              ? h('div', { className: 'dsc-empty' }, t('transcriptEmpty'))
              : h(
                  'div',
                  { className: 'dsc-drawer' },
                  messages.map((message, index) =>
                    h(
                      'div',
                      { key: index, className: 'dsc-drawer-msg', 'data-r': message.role },
                      message.text,
                    ),
                  ),
                ),
          h(
            'div',
            { className: 'dsc-memory' },
            h(
              'div',
              { className: 'dsc-memory-head' },
              h('span', { className: 'dsc-memory-title' }, t('memory')),
              h('span', { style: { flex: 1 } }),
              memoryEntries > 0
                ? h('span', { className: 'dsc-badge' }, `${memoryEntries} ${t('memoryEntries')}`)
                : null,
            ),
            memoryPath
              ? h(
                  'div',
                  { className: 'dsc-memory-path' },
                  `${t('memoryDir')} · ${memoryPath}`,
                )
              : null,
            memoryError ? h('div', { className: 'dsc-err' }, memoryError) : null,
            memoryList.length
              ? h(
                  'div',
                  { className: 'dsc-memory-list' },
                  memoryList.map((entry, index) =>
                    h(
                      'div',
                      { className: 'dsc-memory-item', key: entry && entry.id ? entry.id : index },
                      h(
                        'div',
                        { className: 'dsc-memory-meta' },
                        entry && entry.kind
                          ? h('span', { className: 'dsc-memory-kind' }, String(entry.kind))
                          : null,
                        formatMemoryTime(entry ? entry.at : ''),
                      ),
                      h('div', { className: 'dsc-memory-text' }, entry && entry.text ? String(entry.text) : ''),
                    ),
                  ),
                )
              : memoryContent
                ? h('pre', { className: 'dsc-memory-body' }, memoryContent)
                : !memoryError
                  ? h('div', { className: 'dsc-empty' }, t('memoryEmpty'))
                  : null,
            h(
              'div',
              { className: 'dsc-memory-foot' },
              h('textarea', {
                className: 'dsc-area',
                value: note,
                placeholder: t('notePh'),
                onChange: (event) => setNote(event.target.value),
              }),
              h(
                'button',
                {
                  className: 'dsc-btn',
                  'data-kind': 'primary',
                  disabled: noteBusy || !note.trim(),
                  onClick: submitNote,
                },
                noteBusy ? t('saving') : t('addNote'),
              ),
            ),
          ),
        ),
      );
    }

    function SponsorModal({ links, onClose, t }) {
      const [imageFailed, setImageFailed] = useState(false);
      const ref = useRef(null);
      useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onClose();
          }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
      }, [onClose]);

      return h(
        'div',
        {
          className: 'dsc-mask',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          },
        },
        h(
          'div',
          { className: 'dsc-modal dsc-sponsor', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('sponsorTitle'), ref },
          h(
            'div',
            { className: 'dsc-modal-head' },
            h('div', { className: 'dsc-modal-title' }, t('sponsorTitle')),
            h('button', { className: 'dsc-btn', 'data-kind': 'ghost', onClick: onClose }, t('close')),
          ),
          links.sponsorImage && !imageFailed
            ? h('img', { className: 'dsc-qr', src: links.sponsorImage, alt: 'WeChat sponsor QR', loading: 'lazy', onError: () => setImageFailed(true) })
            : null,
          imageFailed ? h('div', { className: 'dsc-sponsor-text', role: 'alert' }, t('sponsorImageError')) : null,
          h('div', { className: 'dsc-sponsor-text' }, links.sponsorTextIsDefault ? t('sponsorDescription') : (links.sponsorText || t('sponsorDescription'))),
          links.repo
            ? h(
                'a',
                {
                  className: 'dsc-btn dsc-star',
                  href: links.repo,
                  target: '_blank',
                  rel: 'noreferrer',
                  style: { alignSelf: 'center' },
                },
                '\u2605 ',
                t('star'),
              )
            : null,
          h('div', { className: 'dsc-hint', style: { textAlign: 'center' } }, t('sponsorThanks')),
        ),
      );
    }

    function MissionCard({ mission, t, onRemove }) {
      const [open, setOpen] = useState(mission.status === 'bidding' || mission.status === 'working');
      const [confirming, setConfirming] = useState(false);
      const [busy, setBusy] = useState(false);
      const phaseKey =
        mission.status === 'bidding' ? 'bidPhase' : mission.status === 'working' ? 'workPhase' : mission.phase === 'closed' ? 'closedPhase' : '';
      const results = Array.isArray(mission.results) ? mission.results : EMPTY;
      const accepted = results.filter((item) => item.bid === 'accept');
      const events = Array.isArray(mission.events) ? mission.events : EMPTY;

      const confirmRemove = async () => {
        if (busy || typeof onRemove !== 'function') return;
        setBusy(true);
        try {
          await onRemove(mission);
          setConfirming(false);
        } catch {
          // 宿主错误已由面板 toast 呈现，确认块保留以便重试。
        } finally {
          setBusy(false);
        }
      };

      return h(
        'div',
        { className: 'dsc-mission' },
        h(
          'div',
          { className: 'dsc-mission-head', onClick: () => setOpen((value) => !value) },
          h('span', { className: 'dsc-mission-title' }, mission.title),
          phaseKey ? h('span', { className: 'dsc-badge' }, t(phaseKey)) : null,
          h('span', { className: 'dsc-badge', 'data-s': mission.status }, t(mission.status) || mission.status),
          h('span', { className: 'dsc-badge' }, `${accepted.length}/${results.length} ${t('whoAccepted')}`),
          h('span', { className: 'dsc-btn', 'data-kind': 'ghost' }, open ? t('collapse') : t('expand')),
          h(
            'button',
            {
              className: 'dsc-btn',
              'data-kind': 'danger',
              disabled: busy,
              title: t('remove'),
              onClick: (event) => {
                event.stopPropagation();
                setConfirming((value) => !value);
              },
            },
            busy ? t('removing') : t('remove'),
          ),
        ),
        confirming
          ? h(
              'div',
              { className: 'dsc-remove-confirm' },
              h('div', { className: 'dsc-hint' }, fill(t('removeTitle'), { title: mission.title })),
              h(
                'button',
                {
                  className: 'dsc-btn',
                  'data-kind': 'danger',
                  disabled: busy,
                  onClick: (event) => {
                    event.stopPropagation();
                    confirmRemove();
                  },
                },
                busy ? t('removing') : t('removeConfirm'),
              ),
              h(
                'button',
                {
                  className: 'dsc-btn',
                  'data-kind': 'ghost',
                  disabled: busy,
                  onClick: (event) => {
                    event.stopPropagation();
                    setConfirming(false);
                  },
                },
                t('cancel'),
              ),
            )
          : null,
        open
          ? h(
              'div',
              null,
              mission.brief
                ? h(
                    'div',
                    {
                      style: {
                        fontSize: 12,
                        color: 'var(--dsw-alias-label-tertiary, rgba(128,128,128,.9))',
                        whiteSpace: 'pre-wrap',
                        marginTop: 6,
                      },
                    },
                    mission.brief,
                  )
                : null,
              h(
                'div',
                { className: 'dsc-thread' },
                events.length === 0
                  ? h('div', { className: 'dsc-empty' }, t('timelineEmpty'))
                  : events.map((event) =>
                      event.kind === 'system'
                        ? h(
                            'div',
                            { key: event.id, className: 'dsc-msg', 'data-k': 'system' },
                            h(
                              'div',
                              { className: 'dsc-msg-body' },
                              h('div', { className: 'dsc-msg-head' }, h('span', { className: 'dsc-msg-name' }, t('system'))),
                              h('div', { className: 'dsc-bubble' }, event.text),
                            ),
                          )
                        : h(
                            'div',
                            { key: event.id, className: 'dsc-msg', 'data-k': event.kind },
                            h(Avatar, { name: event.name, accent: event.accent }),
                            h(
                              'div',
                              { className: 'dsc-msg-body' },
                              h(
                                'div',
                                { className: 'dsc-msg-head' },
                                h('span', { className: 'dsc-msg-name' }, event.name),
                                h('span', null, event.roleName || ''),
                                h('span', { className: 'dsc-badge', 'data-s': event.kind }, t(event.kind) || event.kind),
                              ),
                              h('div', { className: 'dsc-bubble' }, event.text),
                            ),
                          ),
                    ),
              ),
            )
          : null,
      );
    }

    const WF_NODE_W = 210;
    const WF_NODE_H = 96;
    const WF_STAGE_W = 1500;
    const WF_STAGE_H = 950;

    function wfNodes(workflow) {
      return workflow && Array.isArray(workflow.nodes) ? workflow.nodes : EMPTY;
    }

    function wfEdges(workflow) {
      return workflow && Array.isArray(workflow.edges) ? workflow.edges : EMPTY;
    }

    function wfNodeById(nodes, id) {
      for (const node of nodes) if (node && node.id === id) return node;
      return null;
    }

    function wfEmployeeById(employees, id) {
      for (const employee of employees) if (employee && employee.id === id) return employee;
      return null;
    }

    function wfPortOut(node) {
      return {
        x: (Number(node && node.x) || 0) + WF_NODE_W,
        y: (Number(node && node.y) || 0) + WF_NODE_H / 2,
      };
    }

    function wfPortIn(node) {
      return { x: Number(node && node.x) || 0, y: (Number(node && node.y) || 0) + WF_NODE_H / 2 };
    }

    function wfEdgePath(from, to) {
      const dx = Math.max(48, Math.abs(to.x - from.x) / 2);
      return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
    }

    /** from 出发能不能走到 to（加边前的成环判定）。 */
    function wfHasPath(edges, from, to) {
      const stack = [from];
      const seen = new Set();
      while (stack.length) {
        const current = stack.pop();
        if (current === to) return true;
        if (seen.has(current)) continue;
        seen.add(current);
        for (const edge of edges) if (edge && edge.source === current) stack.push(edge.target);
      }
      return false;
    }

    /** 保存前自查，返回 DICT 键名；通过则返回空串。 */
    function validateWorkflow(workflow, employees) {
      if (!String((workflow && workflow.name) || '').trim()) return 'workflowNoName';
      if (String((workflow && workflow.name) || '').trim().length > 80) return 'workflowLimitName';
      const nodes = wfNodes(workflow);
      const edges = wfEdges(workflow);
      if (nodes.length < 1 || nodes.length > 60) return 'workflowLimitNodes';
      const ids = new Set();
      for (const node of nodes) {
        const id = String((node && node.id) || '');
        if (!id || ids.has(id)) return 'workflowLimitNodes';
        ids.add(id);
      }
      if (nodes.filter((node) => node && node.type === 'start').length !== 1) return 'workflowNeedStart';
      for (const node of nodes) {
        if (!node) return 'workflowNeedEmployee';
        if (String(node.instruction || '').length > 4000) return 'workflowLimitInstruction';
        if (node.type === 'start') continue;
        if (node.type !== 'employee') return 'workflowNeedEmployee';
        const employeeId = String(node.employeeId || '');
        if (!employeeId || !wfEmployeeById(employees, employeeId)) return 'workflowNeedEmployee';
      }
      if (edges.length > 200) return 'workflowLimitEdges';
      const seen = new Set();
      for (const edge of edges) {
        if (!edge) return 'workflowBadEdge';
        const source = String(edge.source || '');
        const target = String(edge.target || '');
        if (!ids.has(source) || !ids.has(target)) return 'workflowBadEdge';
        if (source === target) return 'workflowBadEdge';
        const key = `${source}->${target}`;
        if (seen.has(key)) return 'workflowBadEdge';
        seen.add(key);
      }
      const adjacency = new Map();
      for (const edge of edges) {
        if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
        adjacency.get(edge.source).push(edge.target);
      }
      const visiting = new Set();
      const settled = new Set();
      const visit = (id) => {
        if (visiting.has(id)) return true;
        if (settled.has(id)) return false;
        visiting.add(id);
        for (const next of adjacency.get(id) || EMPTY) if (visit(next)) return true;
        visiting.delete(id);
        settled.add(id);
        return false;
      };
      for (const id of ids) if (visit(id)) return 'workflowBadEdge';
      return '';
    }

    function WorkflowCard({ workflow, t, onEdit, onRemove, onRun }) {
      const [confirming, setConfirming] = useState(false);
      const [busy, setBusy] = useState(false);
      const [input, setInput] = useState('');
      const [runError, setRunError] = useState('');
      const runLock = useRef(false);
      const startTemplate = async () => {
        if (runLock.current || workflow.kind === 'company-run' || workflow.lastRun?.status === 'running' || !input.trim() || typeof onRun !== 'function') return;
        runLock.current = true; setBusy(true); setRunError('');
        try { await onRun(workflow.id, input.trim()); } catch(error) { setRunError(error?.message || String(error)); }
        finally { runLock.current = false; setBusy(false); }
      };
      const nodes = wfNodes(workflow);
      const lastRun = workflow && workflow.lastRun ? workflow.lastRun : null;
      const status = lastRun && lastRun.status ? lastRun.status : '';

      const confirmRemove = async () => {
        if (busy || typeof onRemove !== 'function') return;
        setBusy(true);
        try {
          await onRemove(workflow);
          setConfirming(false);
        } catch {
          // 宿主错误已由面板 toast 呈现，确认块保留以便重试。
        } finally {
          setBusy(false);
        }
      };

      const badge = status
        ? h('span', { className: 'dsc-badge', 'data-s': status }, t(status) || status)
        : h('span', { className: 'dsc-badge', 'data-s': 'pending' }, t('workflowNoRun'));
      const runMeta =
        lastRun && lastRun.startedAt
          ? h(
              'div',
              { className: 'dsc-card-sub' },
              `${t('workflowLastRun')} · ${formatTime(lastRun.startedAt)}`,
            )
          : null;
      return h(
        'div',
        { className: 'dsc-mission' },
        h(
          'div',
          { className: 'dsc-mission-head' },
          h('span', { className: 'dsc-mission-title' }, String(workflow.name || t('workflowUnnamed'))),
          h('span', { className: 'dsc-badge' }, `${nodes.length} ${t('workflowNodes')}`),
          badge,
        ),
        workflow.description
          ? h(
              'div',
              { style: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary, rgba(128,128,128,.9))', whiteSpace: 'pre-wrap', marginTop: 6 } },
              workflow.description,
            )
          : null,
        runMeta,
        h('p',{className:'dsc-hint'},t('fixedRunHint')),
        h('label',{className:'dsc-label',htmlFor:`dsc-template-input-${workflow.id}`},t('fixedFreshInput')),
        h('textarea',{id:`dsc-template-input-${workflow.id}`,className:'dsc-area',value:input,maxLength:6000,disabled:busy || status==='running',onChange:e=>setInput(e.target.value)}),
        h('button',{className:'dsc-btn','data-kind':'primary',disabled:busy || status==='running' || !input.trim() || workflow.kind==='company-run',onClick:startTemplate},t('fixedRunNow')),
        runError?h('p',{role:'alert'},runError):null,
        lastRun?.nodeRuns?.length ? h('p',{role:'status'},`${t('workflowSettled')} ${lastRun.nodeRuns.filter(n=>['done','failed','skipped','cancelled'].includes(n.status)).length}/${lastRun.nodeRuns.length}`):null,
        h(
          'div',
          { className: 'dsc-card-actions' },
          h('button', { className: 'dsc-btn', onClick: () => onEdit(workflow) }, t('edit')),
          h(
            'button',
            {
              className: 'dsc-btn',
              'data-kind': 'danger',
              disabled: busy,
              onClick: () => setConfirming((value) => !value),
            },
            busy ? t('removing') : t('remove'),
          ),
        ),
        confirming
          ? h(
              'div',
              { className: 'dsc-remove-confirm' },
              h('div', { className: 'dsc-hint' }, fill(t('workflowRemoveTitle'), { title: workflow.name || t('workflowUnnamed') })),
              h(
                'button',
                { className: 'dsc-btn', 'data-kind': 'danger', disabled: busy, onClick: confirmRemove },
                busy ? t('removing') : t('removeConfirm'),
              ),
              h('button', { className: 'dsc-btn', 'data-kind': 'ghost', disabled: busy, onClick: () => setConfirming(false) }, t('cancel')),
            )
          : null,
      );
    }

    // Layout is editable without invalidating execution identity; topology and instructions are not.
    function wfExecutionSignature(graph) {
      if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return '';
      const nodes = graph.nodes.map(n => [n.id, n.type, n.title || '', n.employeeId || '', n.instruction || '']);
      // Incoming edge order changes the order of upstream text in the prompt.
      const edges = graph.edges.map(e => [e.source, e.target]);
      return JSON.stringify([graph.name || '', nodes, edges]);
    }

    function ArchitectureView({ employees, missions, workflows, t, onNavigate }) {
      const layers = ['CEO', 'Team', 'Host', 'Results'];
      return h('section', { className: 'dsc-architecture', 'aria-label': t('tabArchitecture') },
        h('header', { className: 'dsc-arch-hero' },
          h('div', { className: 'dsc-sub' }, t('subtitle')),
          h('h2', null, t('architectureTitle')),
          h('p', null, t('architectureIntro'))),
        h('h3', null, t('architectureSnapshot')),
        h('div', { className: 'dsc-arch-kpis' },
          [[employees.length, 'tabRoster'], [missions.length, 'tabMissions'], [workflows.length, 'tabWorkflow']].map(([count, label]) =>
            h('div', { className: 'dsc-arch-kpi', key: label }, h('b', null, count), h('span', null, t(label))))),
        h('ol', { className: 'dsc-arch-layers' }, layers.map((layer, index) =>
          h('li', { className: 'dsc-arch-layer', key: layer },
            h('span', { className: 'dsc-arch-number' }, `0${index + 1}`),
            h('h3', null, t(`architecture${layer}`)), h('p', null, t(`architecture${layer}Text`))))),
        h('h3', null, t('architectureRoutes')),
        h('div', { className: 'dsc-arch-routes' },
          [['missions', 'tabMissions', 'architectureMissionText'], ['workflow', 'tabWorkflow', 'architectureWorkflowText']].map(([route, label, text]) =>
            h('article', { className: 'dsc-arch-route', key: route }, h('strong', null, t(label)), h('p', null, t(text)),
              h('button', { className: 'dsc-btn', 'data-kind': 'primary', onClick: () => onNavigate(route) }, t(label) + ' →')))),
        h('p', { className: 'dsc-hint' }, t('architectureScope')));
    }

    function WorkflowEditor({ draft, employees, lastRun, t, onPatch, onBack, onSave, onRun, onToast }) {
      const [selectedNodeId, setSelectedNodeId] = useState('');
      const [selectedEdgeId, setSelectedEdgeId] = useState('');
      const [runInput, setRunInput] = useState('');
      const [motionEnabled, setMotionEnabled] = useState(true);
      const [confirmNodeId, setConfirmNodeId] = useState('');
      const [linking, setLinking] = useState(null);
      const [busy, setBusy] = useState(false);
      const stageRef = useRef(null);
      const dragRef = useRef(null);

      const nodes = wfNodes(draft);
      const edges = wfEdges(draft);
      const selectedNode = wfNodeById(nodes, selectedNodeId);
      const runState = lastRun && lastRun.status ? lastRun.status : '';
      const graphMatchesRun = Boolean(lastRun?.graph && wfExecutionSignature(lastRun.graph) === wfExecutionSignature(draft));
      const statusLabel = status => status === 'running' ? t('workflowActive') : t(status);

      const nodeRuns = useMemo(() => {
        const map = new Map();
        if (lastRun && Array.isArray(lastRun.nodeRuns)) {
          for (const item of lastRun.nodeRuns) if (item && item.nodeId) map.set(item.nodeId, item);
        }
        return map;
      }, [lastRun]);

      useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') {
            setSelectedNodeId('');
            setSelectedEdgeId('');
            setConfirmNodeId('');
          }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, []);

      const patchNode = (id, changes) => {
        onPatch({ nodes: nodes.map((node) => (node && node.id === id ? { ...node, ...changes } : node)) });
      };

      const addEmployeeNode = () => {
        const stamp = Date.now().toString(36);
        const rand = Math.random().toString(36).slice(2, 7);
        const id = `n${stamp}${rand}`;
        const index = nodes.length;
        onPatch({
          nodes: nodes.concat([
            {
              id,
              type: 'employee',
              x: 140 + (index % 5) * 250,
              y: 120 + Math.floor(index / 5) * 170,
              title: '',
              employeeId: '',
              instruction: '',
            },
          ]),
        });
        setSelectedNodeId(id);
        setSelectedEdgeId('');
      };

      const deleteNode = (id) => {
        onPatch({
          nodes: nodes.filter((node) => node && node.id !== id),
          edges: edges.filter((edge) => edge && edge.source !== id && edge.target !== id),
        });
        setSelectedNodeId('');
        setConfirmNodeId('');
      };

      const deleteEdge = () => {
        if (!selectedEdgeId) return;
        onPatch({ edges: edges.filter((edge) => edge && edge.id !== selectedEdgeId) });
        setSelectedEdgeId('');
      };

      const stagePoint = (event) => {
        const stage = stageRef.current;
        if (!stage || typeof stage.getBoundingClientRect !== 'function') return { x: 0, y: 0 };
        const rect = stage.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
      };

      const startNodeDrag = (event, node) => {
        if (event.target && event.target.getAttribute && event.target.getAttribute('data-port')) return;
        event.stopPropagation();
        event.preventDefault();
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // 某些环境不支持指针捕获，忽略即可。
        }
        const point = stagePoint(event);
        dragRef.current = {
          kind: 'node',
          nodeId: node.id,
          grabX: point.x - (Number(node.x) || 0),
          grabY: point.y - (Number(node.y) || 0),
        };
      };

      const moveNode = (event) => {
        const drag = dragRef.current;
        if (!drag || drag.kind !== 'node') return;
        const point = stagePoint(event);
        const x = Math.max(0, Math.round(point.x - drag.grabX));
        const y = Math.max(0, Math.round(point.y - drag.grabY));
        patchNode(drag.nodeId, { x, y });
      };

      const endNodeDrag = (event) => {
        if (dragRef.current && dragRef.current.kind === 'node') dragRef.current = null;
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // 忽略。
        }
      };

      const startLink = (event, node) => {
        event.stopPropagation();
        event.preventDefault();
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // 忽略。
        }
        dragRef.current = { kind: 'link', nodeId: node.id };
        const port = wfPortOut(node);
        setLinking({ source: node.id, x: port.x, y: port.y });
      };

      const moveLink = (event) => {
        const drag = dragRef.current;
        if (!drag || drag.kind !== 'link') return;
        const point = stagePoint(event);
        setLinking((current) => (current ? { source: current.source, x: point.x, y: point.y } : current));
      };

      const endLink = (event) => {
        const drag = dragRef.current;
        dragRef.current = null;
        setLinking(null);
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // 忽略。
        }
        if (!drag || drag.kind !== 'link') return;
        const target = typeof document !== 'undefined' && document.elementFromPoint ? document.elementFromPoint(event.clientX, event.clientY) : null;
        if (!target || typeof target.closest !== 'function') return;
        const port = target.closest('[data-port="in"]');
        if (!port) return;
        const host = port.closest('[data-node-id]');
        const targetId = host ? host.getAttribute('data-node-id') : '';
        if (!targetId || targetId === drag.nodeId) return;
        if (edges.some((edge) => edge && edge.source === drag.nodeId && edge.target === targetId)) return;
        if (wfHasPath(edges, targetId, drag.nodeId)) {
          onToast(t('workflowBadEdge'));
          return;
        }
        const id = `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
        onPatch({ edges: edges.concat([{ id, source: drag.nodeId, target: targetId }]) });
      };

      const save = async () => {
        setBusy(true);
        try {
          await onSave(draft);
        } finally {
          setBusy(false);
        }
      };

      const run = async () => {
        if (!draft.id) {
          onToast(t('workflowSaveFirst'));
          return;
        }
        setBusy(true);
        try {
          await onRun(draft.id, runInput);
        } finally {
          setBusy(false);
        }
      };

      const edgeRunState = (edge) => {
        const run = nodeRuns.get(edge.target);
        if (!graphMatchesRun || !run || !run.status) return '';
        return run.status;
      };
      const edgeIsActive = (edge) => graphMatchesRun && runState === 'running' &&
        nodeRuns.get(edge.source)?.status === 'done' && nodeRuns.get(edge.target)?.status === 'running';
      const runSlots = lastRun && Array.isArray(lastRun.nodeRuns) ? lastRun.nodeRuns : [];
      const countStatus = (status) => runSlots.filter(slot => slot.status === status).length;
      const settled = runSlots.filter(slot => ['done', 'failed', 'skipped', 'cancelled'].includes(slot.status)).length;

      const nodeCard = (node) => {
        const employee = node.type === 'employee' ? wfEmployeeById(employees, node.employeeId) : null;
        const nodeRun = nodeRuns.get(node.id);
        const status = graphMatchesRun && nodeRun && nodeRun.status ? nodeRun.status : '';
        const title =
          String((node && node.title) || '') ||
          (node.type === 'start' ? t('workflowNodeStart') : employee ? employee.name : t('workflowSelectEmployee'));
        return h(
          'div',
          {
            key: node.id,
            className: 'dsc-wf-node',
            'data-node-id': node.id,
            'data-run': status,
            role: 'button',
            tabIndex: 0,
            'aria-label': `${title}${status ? ': ' + statusLabel(status) : ''}`,
            'aria-pressed': selectedNodeId === node.id,
            onKeyDown: (event) => {
              if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault(); setSelectedNodeId(node.id); setSelectedEdgeId('');
              }
            },
            'data-sel': selectedNodeId === node.id ? '1' : '0',
            style: { left: `${Number(node.x) || 0}px`, top: `${Number(node.y) || 0}px` },
            onClick: (event) => {
              event.stopPropagation();
              setSelectedNodeId(node.id);
              setSelectedEdgeId('');
            },
          },
          h(
            'div',
            {
              className: 'dsc-wf-node-head',
              onPointerDown: (event) => startNodeDrag(event, node),
              onPointerMove: moveNode,
              onPointerUp: endNodeDrag,
              onPointerCancel: endNodeDrag,
            },
            h('span', { className: 'dsc-wf-node-kind' }, node.type === 'start' ? t('workflowNodeStart') : t('workflowNodeEmployee')),
            h('span', { className: 'dsc-wf-node-title' }, title),
          ),
          h(
            'div',
            { className: 'dsc-wf-node-body' },
            node.type === 'start'
              ? h('span', null, t('workflowRunInput'))
              : h(
                  'span',
                  { style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 } },
                  employee ? h(Avatar, { name: employee.name, accent: employee.accent }) : null,
                  h('span', null, employee ? `${employee.name}${employee.title ? ' · ' + employee.title : ''}` : t('workflowSelectEmployee')),
                ),
          ),
          status
            ? h(
                'span',
                { className: 'dsc-wf-node-status' },
                h('span', { className: 'dsc-badge', 'data-s': status }, statusLabel(status) || status),
              )
            : null,
          node.type === 'start'
            ? null
            : h('span', { className: 'dsc-wf-port', 'data-port': 'in' }),
          h('span', {
            className: 'dsc-wf-port',
            'data-port': 'out',
            onPointerDown: (event) => startLink(event, node),
            onPointerMove: moveLink,
            onPointerUp: endLink,
            onPointerCancel: endLink,
            onClick: (event) => event.stopPropagation(),
          }),
        );
      };

      const canvas = h(
        'div',
        {
          className: 'dsc-wf-canvas',
          onPointerDown: (event) => {
            if (event.target === event.currentTarget || (event.target.classList && event.target.classList.contains('dsc-wf-stage'))) {
              setSelectedNodeId('');
              setSelectedEdgeId('');
            }
          },
        },
        h(
          'div',
          { className: 'dsc-wf-stage', ref: stageRef, style: { width: `${WF_STAGE_W}px`, height: `${WF_STAGE_H}px` } },
          h(
            'svg',
            { className: 'dsc-wf-edges' },
            edges.map((edge) => {
              const source = wfNodeById(nodes, edge.source);
              const target = wfNodeById(nodes, edge.target);
              if (!source || !target) return null;
              const path = wfEdgePath(wfPortOut(source), wfPortIn(target));
              const runStateOfEdge = edgeRunState(edge);
              return h(
                'g',
                { key: edge.id },
                h('path', {
                  className: 'dsc-wf-edge-hit',
                  d: path,
                  tabIndex: 0, role: 'button',
                  'aria-label': `${t('workflowEdgeLabel')}: ${source.title || source.id} → ${target.title || target.id}`,
                  onKeyDown: (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault(); setSelectedEdgeId(edge.id); setSelectedNodeId('');
                    }
                  },
                  onClick: (event) => {
                    event.stopPropagation();
                    setSelectedEdgeId(edge.id);
                    setSelectedNodeId('');
                  },
                }),
                h('path', {
                  className: 'dsc-wf-edge',
                  d: path,
                  'data-sel': selectedEdgeId === edge.id ? '1' : '0',
                  'data-run': runStateOfEdge,
                }),
                motionEnabled && edgeIsActive(edge) ? h('path', {
                  className: 'dsc-wf-particles', d: path, pathLength: 100, 'aria-hidden': true,
                }) : null,
              );
            }),
            linking
              ? (() => {
                  const source = wfNodeById(nodes, linking.source);
                  if (!source) return null;
                  return h('path', {
                    className: 'dsc-wf-edge',
                    'data-sel': '0',
                    d: wfEdgePath(wfPortOut(source), { x: linking.x, y: linking.y }),
                  });
                })()
              : null,
          ),
          nodes.map((node) => nodeCard(node)),
        ),
      );

      const nodeRun = graphMatchesRun && selectedNode ? nodeRuns.get(selectedNode.id) : null;

      const inspector = h(
        'div',
        { className: 'dsc-wf-inspector' },
        selectedNode
          ? h(
              'div',
              null,
              h(
                'div',
                { className: 'dsc-wf-inspector-title' },
                h('span', { className: 'dsc-wf-node-kind' }, selectedNode.type === 'start' ? t('workflowNodeStart') : t('workflowNodeEmployee')),
                h('span', null, String(selectedNode.title || t('workflowUnnamed'))),
              ),
              selectedNode.type === 'start'
                ? h('div', { className: 'dsc-hint' }, t('workflowStartHint'))
                : h(
                    'div',
                    null,
                    h('div', { className: 'dsc-label' }, t('workflowSelectEmployee')),
                    h(
                      'select',
                      {
                        className: 'dsc-input',
                        value: String(selectedNode.employeeId || ''),
                        onChange: (event) => patchNode(selectedNode.id, { employeeId: event.target.value }),
                      },
                      h('option', { value: '' }, t('workflowSelectEmployee')),
                      employees.map((employee) =>
                        h(
                          'option',
                          { key: employee.id, value: employee.id },
                          employee.title ? `${employee.name} · ${employee.title}` : employee.name,
                        ),
                      ),
                    ),
                    h('div', { className: 'dsc-label' }, t('workflowInstruction')),
                    h('textarea', {
                      className: 'dsc-area',
                      value: String(selectedNode.instruction || ''),
                      placeholder: t('workflowInstructionPh'),
                      onChange: (event) => patchNode(selectedNode.id, { instruction: event.target.value }),
                    }),
                  ),
              h('div', { className: 'dsc-label' }, t('workflowNodeTitle')),
              h('input', {
                className: 'dsc-input',
                value: String(selectedNode.title || ''),
                placeholder: t('workflowNodeTitlePh'),
                onChange: (event) => patchNode(selectedNode.id, { title: event.target.value }),
              }),
              nodeRun
                ? h(
                    'div',
                    null,
                    h('div', { className: 'dsc-label' }, t('workflowNodeOutput')),
                    h('pre', { className: 'dsc-wf-runlog' }, String(nodeRun.output || '—')),
                    nodeRun.error
                      ? h(
                          'div',
                          null,
                          h('div', { className: 'dsc-label' }, t('workflowNodeError')),
                          h('pre', { className: 'dsc-wf-runlog' }, String(nodeRun.error)),
                        )
                      : null,
                  )
                : null,
              h(
                'button',
                {
                  className: 'dsc-btn',
                  'data-kind': 'danger',
                  onClick: () => setConfirmNodeId(selectedNode.id),
                },
                t('workflowDeleteNode'),
              ),
              confirmNodeId === selectedNode.id
                ? h(
                    'div',
                    { className: 'dsc-remove-confirm' },
                    h('div', { className: 'dsc-hint' }, t('workflowDeleteNodeTitle')),
                    h(
                      'button',
                      {
                        className: 'dsc-btn',
                        'data-kind': 'danger',
                        onClick: () => deleteNode(selectedNode.id),
                      },
                      t('workflowConfirmDelete'),
                    ),
                    h('button', { className: 'dsc-btn', 'data-kind': 'ghost', onClick: () => setConfirmNodeId('') }, t('cancel')),
                  )
                : null,
            )
          : h('div', { className: 'dsc-hint' }, t('workflowCanvasHint')),
      );

      return h(
        'div',
        { className: 'dsc-wf-editor' },
        h(
          'div',
          { className: 'dsc-wf-toolbar' },
          h('button', { className: 'dsc-btn', 'data-kind': 'ghost', onClick: onBack }, `← ${t('workflowBack')}`),
          h('input', {
            className: 'dsc-input',
            style: { width: 200 },
            value: String(draft.name || ''),
            placeholder: t('workflowNamePh'),
            title: t('workflowName'),
            onChange: (event) => onPatch({ name: event.target.value }),
          }),
          h('input', {
            className: 'dsc-input',
            style: { width: 160 },
            value: String(draft.description || ''),
            placeholder: t('workflowDescPh'),
            title: t('workflowDesc'),
            onChange: (event) => onPatch({ description: event.target.value }),
          }),
          h('span', { className: 'dsc-spacer' }),
          runState === 'running' ? h('span', { className: 'dsc-badge', 'data-s': 'running' }, t('workflowRunning')) : null,
          h('textarea', {
            className: 'dsc-area dsc-wf-runinput',
            value: runInput,
            placeholder: t('workflowRunPh'),
            onChange: (event) => setRunInput(event.target.value),
          }),
          h(
            'button',
            {
              className: 'dsc-btn',
              'data-kind': 'primary',
              disabled: busy || runState === 'running',
              onClick: run,
            },
            busy ? t('workflowRunning') : t('workflowRun'),
          ),
          h('span', { className: 'dsc-spacer' }),
          selectedEdgeId
            ? h('button', { className: 'dsc-btn', 'data-kind': 'danger', onClick: deleteEdge }, t('workflowDeleteEdge'))
            : null,
          h('button', { className: 'dsc-btn', onClick: addEmployeeNode }, t('workflowAddNode')),
          h('button', { className: 'dsc-btn', 'data-kind': 'primary', disabled: busy, onClick: save }, t('save')),
        ),
        h('section', { className: 'dsc-wf-monitor', 'aria-label': t('workflowLive') },
          h('div', { className: 'dsc-wf-monitor-top' },
            h('strong', { role: 'status', 'aria-live': 'polite', 'aria-atomic': true },
              runState ? `${t('workflowHistory')} · ${t(runState)}` : t('workflowNoRun')),
            h('label', { className: 'dsc-wf-motion', title: t('workflowMotionHint') },
              h('input', { type: 'checkbox', checked: motionEnabled, onChange: event => setMotionEnabled(event.target.checked) }),
              t('workflowMotion'))),
          lastRun && !graphMatchesRun ? h('p', { className: 'dsc-hint', role: 'status' }, t('workflowGraphMismatch')) : null,
          h('div', { className: 'dsc-wf-metrics' },
            h('strong', null, `${t('workflowSettled')} ${settled}/${runSlots.length}`),
            ['running', 'done', 'failed', 'skipped', 'pending'].map(status => h('span', { className: 'dsc-wf-metric', key: status },
              h('span', { className: 'dsc-badge', 'data-s': status }, status === 'pending' ? t('workflowWaiting') : statusLabel(status)), countStatus(status)))),
          h('div', { className: 'dsc-wf-meter', role: 'progressbar', 'aria-label': t('workflowSettled'), 'aria-valuemin': 0,
            'aria-valuemax': runSlots.length || 1, 'aria-valuenow': settled },
            h('span', { style: { width: `${runSlots.length ? settled / runSlots.length * 100 : 0}%` } })),
          h('div', { className: 'dsc-hint' }, t('workflowPolling'))),
        h('div', { className: 'dsc-wf-canvas-wrap' }, canvas, inspector),
      );
    }

    function companyChoiceMatches(plan, choice) {
      return !!(plan && choice && choice.id === plan.id && choice.revision === plan.revision &&
        (plan.options || []).some(option => option.id === choice.optionId));
    }

    function ReviewerHandoffCard({ handoff, plan, t }) {
      if (!handoff) return null;
      const en=t('companyMode')===DICT.en.companyMode;
      const L=(zh,english)=>en?english:zh;
      const labels={
        waiting:L('待交接','Waiting for handoff'), admitting:L('待运行端确认接收','Waiting for runtime acceptance'),
        reviewing:L('审核中','Reviewing'), passed:L('审核员已通过','Reviewer passed'),
        rejected:L('审核员未通过','Reviewer did not pass'), blocked:L('审核未继续','Review did not proceed'),
      };
      return h('section',{className:'dsc-card','aria-label':L('交接到人','Reviewer handoff')},
        h('h3',null,L('交接到人 · 独立审核','Reviewer handoff · Independent review')),
        h('strong',null,handoff.name),h('small',{className:'dsc-hint'},handoff.employeeId),
        h('p',{role:'status','data-handoff-status':handoff.status},labels[handoff.status]),
        handoff.acceptedAt?h('small',null,L('运行端已接收：','Runtime accepted: ')+formatTime(handoff.acceptedAt)):null,
        handoff.reviewedAt?h('small',null,L('审核结果已记录：','Review outcome recorded: ')+formatTime(handoff.reviewedAt)):null,
        h('p',{className:'dsc-hint'},handoff.manualOnly
          ?L('上一轮可能已交给审核员。请先人工核对；系统不会重发。','The review may already have reached the reviewer. Check manually; the system will not resend it.')
          :L('此处是员工的审核结论，不代表老板本人验收或授权发布。','This is the reviewer’s decision, not owner sign-off or publication approval.')),
        handoff.manualOnly?h('details',{className:'dsc-wf-runlog'},
          h('summary',null,L('查看人工核对所需记录','Inspect record for manual review')),
          h('dl',null,[
            [L('方案编号','Plan ID'),plan.id],[L('运行编号','Run ID'),plan.runId],
            [L('审核员编号','Reviewer ID'),handoff.employeeId],
            [L('交接已记录','Handoff recorded'),handoff.intentAt?formatTime(handoff.intentAt):'—'],
            [L('运行端确认','Runtime acceptance'),handoff.acceptedAt?formatTime(handoff.acceptedAt):L('未记录；不代表未送达','Not recorded; delivery is unknown')],
            [L('审核结果','Review outcome'),L('未找到已保存结论','No saved verdict found')],
          ].map(([label,value])=>h('div',{key:label,style:{overflowWrap:'anywhere'}},h('dt',null,label),h('dd',null,value)))),
          h('ol',null,
            h('li',null,L('按运行与审核员编号找原来的交付或审核记录，确认是否已有结论。','Use the run and reviewer IDs to locate the original delivery or review and check whether it has a verdict.')),
            h('li',null,L('如果仍无可核对的结论，重新拟定审核任务并走新审批。不要重试旧运行。','If there is no verifiable verdict, draft a new review task and approve it separately. Do not retry the old run.')))) : null);

    }
    function CompanyWorkspace({ plans, workflows, employees = EMPTY, t, refresh, request = call, onOpenFixed, onOpenGroups, focusIntake = false }) {
      const [brief, setBrief] = useState('');
      const [outcome, setOutcome] = useState('');
      const [boundaries, setBoundaries] = useState('');
      const [checks, setChecks] = useState('');
      const [showTradeoff, setTradeoff] = useState(false);
      const [parallelSpecialists, setParallelSpecialists] = useState(false);
      const [edit, setEdit] = useState(null);
      const [planId, setPlanId] = useState('');
      const [choice, setChoice] = useState(null);
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState('');
      const lock = useRef(false);
      const composerRef = useRef(null);
      useEffect(() => {
        if (focusIntake) {
          composerRef.current?.scrollIntoView({block:'center',behavior:'auto'});
          composerRef.current?.focus();
        }
      }, [focusIntake]);
      const plan = (plans || []).find(item => item.id === planId) || (!planId && (plans || [])[0]) || null;
      const defaultOption = plan?.options?.find(option=>option.id==='specialized') || plan?.options?.find(option=>option.id==='lean');
      const selectedChoice = choice || (plan?.status === 'awaiting_approval' && defaultOption ? {id:plan.id,revision:plan.revision,optionId:defaultOption.id} : null);
      const supported = Array.isArray(plans);
      const language = t('companyMode') === DICT.en.companyMode ? 'en' : 'zh';
      const optionText = (option, key) => language === 'en' ? (option[key + 'En'] || option[key]) : option[key];
      const L = (zh,en) => language==='en'?en:zh;
      const specialistPlan = option => {
        if (!option?.steps?.length) return null;
        const stages = new Map(option.steps.map(step=>[step.id,step]));
        const levels = new Map();
        for (const step of option.steps) {
          const wave = Number(step.wave)||1;
          if(!levels.has(wave)) levels.set(wave,[]);
          levels.get(wave).push(step);
        }
        return h('section',{className:'dsc-specialist-board','aria-label':L('专员分工与依赖','Specialists and dependencies')},
          [...levels].sort(([a],[b])=>a-b).map(([wave,steps])=>h('section',{key:wave,className:'dsc-specialist-wave', 'data-wave':wave},
            h('h4',null,L('第 '+wave+' 批','Wave '+wave),' · ',steps.length>1?L('可并行','Can run in parallel'):L('按依赖执行','Runs after dependencies')),
            h('ol',null,steps.map(step=>{
              const name=employees.find(e=>e.id===step.employeeId)?.name || L('原分配员工不在当前名册','Previously assigned staff member is absent');
              const dependencies=(step.dependsOn||[]).map(id=>stages.has(id)?optionText(stages.get(id),'title'):id);
              return h('li',{key:step.id,'data-stage':step.id},
                h('strong',null,optionText(step,'title')),h('span',null,name),h('p',null,optionText(step,'reason')),
                h('small',null,dependencies.length?L('等待：','Waits for: ')+dependencies.join(L('、',', ')):L('启动后可立即开始','Ready when the plan starts')));
            })))));
      };
      const workflow = plan && workflows.find(item => item.id === plan.workflowId);
      const lastRun = workflow && workflow.lastRun;
      const run = lastRun && (!plan.runId || plan.runId === lastRun.id) ? lastRun : null;
      const slots = run && Array.isArray(run.nodeRuns) ? run.nodeRuns : [];
      const settled = slots.filter(item => ['done', 'failed', 'skipped', 'cancelled'].includes(item.status)).length;
      const statusKeys = { awaiting_approval:'companyAwaiting', approved:'companyApproved', running:'companyRunning', completed:'companyCompleted', failed:'companyFailed', cancelled:'companyCancelled', rejected:'intakeRejected' };
      const act = async (op, payload) => {
        if (lock.current) return;
        lock.current = true; setBusy(true); setError('');
        try {
          const result = await request(op, payload);
          if (['company-plan-create','company-plan-revise','company-plan-reject'].includes(op)) { setPlanId(result.id); setChoice(null); setEdit(null); }
          await refresh();
          if (op === 'company-plan-promote') onOpenFixed();
        } catch (caught) { setError(caught && caught.message ? caught.message : String(caught)); }
        finally { lock.current = false; setBusy(false); }
      };
      const editProposal = () => {
        setBrief(plan.brief); setOutcome(plan.outcome || '');
        setBoundaries(plan.intake?.boundaries || ''); setChecks(plan.intake?.checks || '');
        setTradeoff(plan.intake?.showTradeoff === true); setParallelSpecialists(plan.intake?.parallelSpecialists === true); setEdit({id:plan.id, revision:plan.revision});
        composerRef.current?.focus();
      };
      const submitDraft = () => {
        if (!brief.trim()) return;
        return act(edit ? 'company-plan-revise' : 'company-plan-create', {...edit, brief:brief.trim(),
          outcome:outcome.trim(), boundaries:boundaries.trim(), checks:checks.trim(), showTradeoff:!parallelSpecialists && showTradeoff, parallelSpecialists});
      };
      const approve = () => {
        if (plan?.status !== 'awaiting_approval' || !companyChoiceMatches(plan, selectedChoice)) return;
        return act('company-plan-approve', { id: plan.id, revision: plan.revision, optionId: selectedChoice.optionId });
      };
      const start = () => {
        if (!['approved','failed','cancelled'].includes(plan?.status) || !plan.optionId) return;
        return act('company-plan-run', { id: plan.id, revision: plan.revision, optionId: plan.optionId, ...(plan.intake && plan.runId ? {retryRunId:plan.runId} : {}) });
      };
      const selectedOption = plan && (plan.options || []).find(option => option.id === plan.optionId);
      const nodeTitle = slot => selectedOption?.assignmentLabels?.[slot.nodeId]?.[language] || run?.graph?.nodes?.find(node=>node.id===slot.nodeId)?.title || slot.nodeId;
      const nodeEmployee = slot => {
        const id = selectedOption?.assignments?.[slot.nodeId] || run?.graph?.nodes?.find(node=>node.id===slot.nodeId)?.employeeId;
        return employees.find(employee=>employee.id===id)?.name || id || t('roomEngine');
      };
      const employeeActive = new Map();
      for (const flow of workflows) if (flow.lastRun?.status==='running') {
        const graph = flow.lastRun.graph?.nodes || flow.nodes || [];
        for (const slot of flow.lastRun.nodeRuns || []) if (slot.status==='running') {
          const node = graph.find(n=>n.id===slot.nodeId);
          if (node?.employeeId) employeeActive.set(node.employeeId, node.title || node.id);
        }
      }
      return h('section', {className:'dsc-company dsc-room', 'aria-label':t('companyMode')},
        h('style',null,`
          .dsc-specialist-mode{display:grid;gap:8px;padding:10px;border:1px solid #577486;border-radius:9px;background:#45668417}.dsc-specialist-mode label{display:flex;gap:8px;align-items:baseline;margin:0}.dsc-specialist-mode p{margin:0}
          .dsc-specialist-board{display:grid;gap:9px;margin:9px 0}.dsc-specialist-wave{border-left:2px solid #7b9fae;padding:0 0 0 8px;min-width:0}.dsc-specialist-wave h4{margin:0 0 5px;font-size:12px}.dsc-specialist-wave ol{display:grid;gap:4px;padding:0;margin:0;list-style:none}.dsc-specialist-wave li{display:grid;gap:2px;padding:7px;border:1px solid #6e9cab55;background:#58708412;border-radius:6px;overflow-wrap:anywhere}.dsc-specialist-wave li span{font-size:12px;color:inherit;opacity:.9}.dsc-specialist-wave li p,.dsc-specialist-wave li small{margin:0;font-size:11px;color:inherit;opacity:.84}.dsc-specialist-wave li small{font-weight:600}
        `),
        h('header',{className:'dsc-room-header'},h('div',null,h('div',{className:'dsc-room-eyebrow'},t('roomEyebrow')),h('h2',null,t('roomTitle'))),h('div',{className:'dsc-room-headeractions'},h('span',{className:'dsc-room-sync'},t('roomLive')),h('button',{className:'dsc-btn','data-kind':'primary',onClick:()=>{composerRef.current?.scrollIntoView({block:'center',behavior:'auto'});composerRef.current?.focus();}},t('roomDispatch')))),
        h('div',{className:'dsc-room-columns'},
          h('aside',{className:'dsc-room-sidebar','aria-label':t('roomThreads')},
            h('h3',null,t('roomMembers')),
            !employees.length ? h('p',{className:'dsc-hint'},t('roomNoMembers')) : null,
            employees.map(employee=>h('details',{key:employee.id,className:'dsc-room-person'},h('summary',null,h('span',{className:'dsc-room-avatar','aria-hidden':true},String(employee.name || '?').slice(0,1)),h('span',null,employee.name), employeeActive.has(employee.id)?h('span',{className:'dsc-work-dot',title:t('activeWork'),'aria-label':t('activeWork')}):null),h('p',null,employee.title || employee.role),
              h('p',{className:'dsc-hint'},employeeActive.has(employee.id)?`${t('activeWork')} · ${employeeActive.get(employee.id)}`:t('noActiveWork')))),
            onOpenGroups ? h('button',{className:'dsc-btn dsc-group-nav',onClick:onOpenGroups}, t('groupMode')) : null,
            h('h3',null,t('roomThreads')),
        (plans || []).length ? h('label', null, t('companyPlans'), h('select', {className:'dsc-input', value:plan?.id || '', disabled:busy, onChange:e=>{setPlanId(e.target.value);setChoice(null);setEdit(null);setError('');}},
          plans.map(item=>h('option',{key:item.id,value:item.id},`${item.brief} · ${t(statusKeys[item.status] || item.status)}`)))) : null,

            h('div',{className:'dsc-room-threadlist'},(plans || []).map(item=>h('button',{key:item.id,className:'dsc-room-thread','aria-current':plan?.id===item.id?'true':undefined,disabled:busy,onClick:()=>{setPlanId(item.id);setChoice(null);setEdit(null);setError('');}},h('strong',null,item.brief),h('span',null,t(statusKeys[item.status] || item.status))))),
            h('p',{className:'dsc-hint'},t('roomScope'))),
          h('main',{className:'dsc-room-main','aria-label':t('roomFeed')},
            h('div',{className:'dsc-room-sectionhead'},h('h3',null,t('roomFeed')),plan?h('span',{className:'dsc-badge'},t(statusKeys[plan.status] || plan.status)):null),
            h('p',{className:'dsc-hint'},t('roomSource')),
            h('div',{className:'dsc-room-feed'},
              plan ? h('article',{className:'dsc-room-message dsc-room-owner'},h('div',{className:'dsc-room-messagehead'},h('strong',null,t('roomOwner')),h('span',null,`${t('companyRevision')} ${plan.revision}`)),h('p',null,plan.brief),plan.outcome?h('p',{className:'dsc-hint'},`${t('companyAcceptedOutcome')}: ${plan.outcome}`):null) : h('div',{className:'dsc-room-welcome'},h('h3',null,t('companyMode')),h('p',null,t('companyEmpty'))),
              slots.map(slot=>h('article',{key:slot.nodeId,className:'dsc-room-message'},h('div',{className:'dsc-room-messagehead'},h('strong',null,nodeEmployee(slot)),h('span',{'data-status':slot.status},t(slot.status))),h('h4',null,nodeTitle(slot)),slot.output?h('pre',null,String(slot.output)):h('p',{className:'dsc-hint'},t(slot.status)),slot.error?h('p',{role:'alert'},String(slot.error)):null)),
              plan && !slots.length ? h('p',{className:'dsc-room-note'},t('roomWaiting')) : null),
            h('section',{className:'dsc-room-composer','aria-label':t('roomCompose')},h('h3',null,t('roomCompose')),h('p',{className:'dsc-hint'},t('roomComposeHint')),
        !supported ? h('p', {role:'status'}, t('companyUnavailable')) : null,
        h('label', {className:'dsc-label', htmlFor:'dsc-company-brief'}, t('companyBrief')),
        h('textarea', {id:'dsc-company-brief', ref:composerRef, className:'dsc-area', maxLength:6000, value:brief, disabled:busy, onChange:e=>setBrief(e.target.value)}),
        h('label', {className:'dsc-label', htmlFor:'dsc-company-outcome'}, t('companyOutcome')),
        h('textarea', {id:'dsc-company-outcome', className:'dsc-area', maxLength:1200, value:outcome, disabled:busy, onChange:e=>setOutcome(e.target.value)}),
        h('label', {className:'dsc-label', htmlFor:'dsc-intake-boundaries'}, t('intakeBoundaries')),
        h('textarea', {id:'dsc-intake-boundaries', className:'dsc-area', maxLength:1200, value:boundaries, disabled:busy, onChange:e=>setBoundaries(e.target.value)}),
        h('label', {className:'dsc-label', htmlFor:'dsc-intake-checks'}, t('intakeChecks')),
        h('textarea', {id:'dsc-intake-checks', className:'dsc-area', maxLength:1200, value:checks, disabled:busy, onChange:e=>setChecks(e.target.value)}),
        h('div',{className:'dsc-specialist-mode'},
          h('label',null,h('input',{type:'checkbox',checked:parallelSpecialists,disabled:busy,'aria-describedby':'dsc-specialist-hint',onChange:e=>setParallelSpecialists(e.target.checked)}), h('strong',null,L('按专长拆解，并行派工','Split and dispatch to specialists in parallel'))),
          h('p',{id:'dsc-specialist-hint',className:'dsc-hint'},L('适合有多个独立环节的需求。先并行做需求、技术与证据分析，再汇总实现、测试和审核。会比常规方案多一道分析，审批前不会开始。','For requests with independent work: parallel requirements, technical options, and evidence analysis, then implementation, testing, and review. Adds one analysis step; nothing starts before approval.'))),
        !parallelSpecialists ? h('label', null, h('input',{type:'checkbox',checked:showTradeoff,disabled:busy,onChange:e=>setTradeoff(e.target.checked)}), ' ',t('intakeTradeoff')) : null,
        h('button', {className:'dsc-btn', 'data-kind':'primary', disabled:busy || !supported || !brief.trim(), onClick:submitDraft}, busy?t('companyBusy'):t(edit?'intakeRevise':'companyCreate')),
        error ? h('p', {role:'alert'}, error) : null,
)),
          h('aside',{className:'dsc-room-review','aria-label':t('roomReview')},h('h3',null,t('roomReview')),h('p',{className:'dsc-hint'},t('companyRules')),
        !plan ? h('div',{className:'dsc-empty'},t('companyEmpty')) : h('section',{className:'dsc-company-plan'},
          h('h3',null,plan.brief),
          h('p',{role:'status'},`${t('companyRevision')} ${plan.revision} · ${t(statusKeys[plan.status] || plan.status)}`),
          plan.outcome ? h('section',{'aria-label':t('companyAcceptedOutcome')},h('h4',null,t('companyAcceptedOutcome')),h('p',null,String(plan.outcome))) : null,
          plan.intake ? h('section',null,h('h4',null,t('intakeBoundaries')),h('p',null,plan.intake.boundaries || t('intakeDefaultBoundary')),h('h4',null,t('intakeChecks')),h('p',null,plan.intake.checks || plan.outcome)) : null,
          Array.isArray(plan.risks) && plan.risks.length ? h('section',{'aria-label':t('companyRisks')},h('h4',null,t('companyRisks')),h('ul',null,plan.risks.map((risk,i)=>h('li',{key:i},String(risk))))) : null,
          plan.status==='awaiting_approval' && plan.options?.length > 1 && plan.options?.some(option=>option.id==='lean') ? h('p',{className:'dsc-hint'},t('roomRecommended')) : null,
          h('div',{className:'dsc-grid'},(plan.options || []).map(option=>h('label',{className:'dsc-card',key:option.id},
            h('div',{className:'dsc-card-top'},h('input',{type:'radio',name:'dsc-plan-option',value:option.id,
              'aria-label':`${t('companySelect')}: ${optionText(option,'title')}`,
              checked:plan.status==='awaiting_approval' ? companyChoiceMatches(plan,selectedChoice) && selectedChoice.optionId===option.id : plan.optionId===option.id,
              disabled:busy || plan.status!=='awaiting_approval', onChange:()=>setChoice({id:plan.id,revision:plan.revision,optionId:option.id})}),h('strong',null,optionText(option,'title'))),
            h('p',null,optionText(option,'summary')),(plan.options?.length > 1 || option.steps?.length) ? h('p',null,`${t('companyRisk')}: ${optionText(option,'risk') || '—'}`) : null,(plan.options?.length > 1 || option.steps?.length) ? h('p',null,`${t('companyFeasibility')}: ${optionText(option,'feasibility') || '—'}`) : null,
            !option.steps?.length && option.assignments ? h('details',null,h('summary',null,t('companyAssignments')),h('ul',null,Object.entries(option.assignments).map(([stage,id])=>h('li',{key:stage},`${option.assignmentLabels?.[stage]?.[language] || stage}: ${employees.find(e=>e.id===id)?.name || id}`)))) : null))),
          specialistPlan((plan.options||[]).find(option=>option.id===(plan.status==='awaiting_approval'?selectedChoice?.optionId:plan.optionId))),
          h('p',{className:'dsc-hint'},t('companySeparate')),
          h('div',{className:'dsc-card-actions'},
            ['awaiting_approval','approved','rejected'].includes(plan.status) ? h('button',{className:'dsc-btn',disabled:busy,onClick:editProposal},t('intakeEdit')) : null,
            ['awaiting_approval','approved'].includes(plan.status) ? h('button',{className:'dsc-btn',disabled:busy,onClick:()=>act('company-plan-reject',{id:plan.id,revision:plan.revision})},t('intakeReject')) : null,
            plan.status==='awaiting_approval' ? h('button',{className:'dsc-btn',disabled:busy || edit?.id===plan.id || !companyChoiceMatches(plan,selectedChoice),onClick:approve},t('companyApprove')) : null,
            plan.status==='approved' ? h('button',{className:'dsc-btn','data-kind':'primary',disabled:busy || edit?.id===plan.id || !plan.optionId,onClick:start},t('companyRun')) : null,
            plan.status==='running' ? h('button',{className:'dsc-btn','data-kind':'danger',disabled:busy,onClick:()=>act('company-plan-cancel',{id:plan.id,runId:plan.runId})},t('companyCancel')) : null,
            plan.status==='completed' ? h('button',{className:'dsc-btn',disabled:busy,onClick:()=>act('company-plan-promote',{id:plan.id})},t('companyPromote')) : null),
          h(ReviewerHandoffCard,{handoff:plan.reviewerHandoff,plan,t}),
          !plan.reviewerHandoff?.manualOnly && ['failed','cancelled'].includes(plan.status) ? h('div',null,h('p',{className:'dsc-hint'},t('companyRetryHint')),h('button',{className:'dsc-btn',disabled:busy || edit?.id===plan.id || !plan.optionId,onClick:start},t('companyRetry'))) : null,
          plan.status==='completed' ? h('p',{className:'dsc-hint'},t('companyPromoteHint')) : null,
          plan.error ? h('p',{role:'alert'},String(plan.error)) : null,
          run ? h('section',{'aria-label':t('companyRunStatus')},
            h('p',{role:'status'},`${t('companyRunStatus')}: ${t(run.status)} · ${t('workflowSettled')} ${settled}/${slots.length}`),
            slots.length ? h('progress',{max:slots.length,value:settled,'aria-label':t('workflowSettled')}) : null,
            slots.map(slot=>h('details',{key:slot.nodeId},h('summary',null,`${slot.nodeId} · ${t(slot.status)}`),
              h('pre',{className:'dsc-wf-runlog'},String(slot.output || '—')),slot.error?h('pre',{className:'dsc-wf-runlog'},String(slot.error)):null)),
            h('p',{className:'dsc-hint'},t('workflowPolling'))) : h('p',{className:'dsc-hint'},t('companyNoRun'))))));
    }

    function GroupWorkspace({ employees, t, initialGroupId = '', request = call }) {
      const en = t('companyMode') === DICT.en.companyMode;
      const L = en ? {
        title:'Group chats', scope:'Local test workspace', groupList:'Groups', newGroup:'New group', groupName:'Group name',
        choose:'Choose 2–6 employees', create:'Create group', people:'Members', inbox:'Conversation', hint:'Send to the members of this group. Replies may arrive in parallel.',
        prompt:'Message the group', send:'Send to group', empty:'Create a group, or select an existing group.', noMessages:'No messages yet.',
        status:'Reply progress', owner:'You', error:'Reply error', busy:'Working…', cancel:'Cancel', limited:'This preview supports user-created groups in the local workspace. It does not create groups on its own.',
      } : {
        title:'群聊', scope:'本地工作区', groupList:'群组', newGroup:'新建群聊', groupName:'群名称',
        choose:'选择 2 至 6 位员工', create:'创建群聊', people:'群成员', inbox:'对话', hint:'发给本群成员。员工可同时回复，不会通知其他群。',
        prompt:'给群里发消息', send:'发送给群', empty:'新建群聊，或从左侧选一个群。', noMessages:'这里还没有消息。',
        status:'回复进度', owner:'你', error:'回复失败', busy:'处理中…', cancel:'取消', limited:'本预览可由用户在本地拉群，员工暂不能自动拉群。',
      };
      const [groups, setGroups] = useState([]);
      const [id, setId] = useState('');
      const [detail, setDetail] = useState(null);
      const [form, setForm] = useState(false);
      const [name, setName] = useState('');
      const [memberIds, setMemberIds] = useState([]);
      const [draft, setDraft] = useState('');
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState('');
      const lock = useRef(false);
      const openId = useRef('');
      const cursor = useRef(0);
      const employeeName = id => employees.find(employee=>employee.id===id)?.name || id;
      const visible = detail?.id === id ? detail : null;
      const running = visible?.run?.status === 'running';
      useEffect(() => {
        let alive = true;
        request('groups-list').then(value => { if (alive) { const rows=value.groups || []; setGroups(rows); if(initialGroupId&&rows.some(row=>row.id===initialGroupId))openGroup(initialGroupId); } }, err => { if (alive) setError(String(err?.message || err)); });
        return () => { alive = false; };
      }, []);
      useEffect(() => {
        if (!id) return;
        let alive = true, fetching = false;
        const poll = async () => {
          if (fetching || lock.current || openId.current !== id) return;
          const mark = cursor.current;
          fetching = true;
          try {
            const value = await request('group-read', { id });
            if (alive && openId.current===id && mark===cursor.current) setDetail(value);
          } catch(err) {
            if (alive && openId.current===id && mark===cursor.current) setError(String(err?.message || err));
          } finally { fetching = false; }
        };
        poll();
        const timer = setInterval(poll, 1500);
        return () => { alive = false; clearInterval(timer); };
      }, [id]);
      function openGroup(next) {
        if (lock.current || next === openId.current) return;
        cursor.current++;
        openId.current = next;
        setId(next);
        setDetail(null);
        setDraft('');
        setError('');
        setForm(false);
      }
      async function act(op, body) {
        if (lock.current) return;
        lock.current = true;
        cursor.current++;
        setBusy(true);
        setError('');
        try {
          const value = await request(op, body);
          if (!value?.id) throw new Error('Invalid group response');
          openId.current = value.id;
          setId(value.id);
          setDetail(value);
          setGroups(previous => {
            const row={...value,messageCount:value.messages?.length||0};
            return [row,...previous.filter(group=>group.id!==value.id)].map(({id,name,employeeIds,messageCount})=>({id,name,employeeIds,messageCount}));
          });
          setDraft('');
          if (op === 'group-create') {
            setForm(false);
            setName('');
            setMemberIds([]);
          }
        } catch(err) { setError(String(err?.message || err)); }
        finally { lock.current=false;setBusy(false); }
      }
      const labelStatus = status => status==='done'||status==='completed' ? t('done')
        : status==='interrupted' ? t('cancelled') : status==='failed'||status==='error' ? t('failed')
          : status==='running' ? t('companyRunning') : t('workflowWaiting');
      const list = groups.map(group=>h('button',{key:group.id,className:'dsc-room-thread','aria-current':group.id===id ? 'true':undefined,disabled:busy,onClick:()=>openGroup(group.id)},
        h('strong',null,group.name),h('span',null,`${(group.employeeIds||[]).length} · ${L.people}`)));
      return h('section',{className:'dsc-room dsc-groups','aria-label':L.title},
        h('aside',{className:'dsc-room-sidebar','aria-label':L.groupList},
          h('div',{className:'dsc-room-sectionhead'},h('h3',null,L.groupList),h('button',{className:'dsc-btn','data-kind':'primary',disabled:busy,onClick:()=>{setForm(true);setError('');}},L.newGroup)),
          h('div',{className:'dsc-room-threads'},list),
          h('p',{className:'dsc-hint'},L.limited)),
        h('main',{className:'dsc-room-main','aria-label':L.inbox},
          h('div',{className:'dsc-room-sectionhead'},h('h3',null,form?L.newGroup:visible?.name||L.title),h('span',{className:'dsc-badge'},L.scope)),
          error ? h('p',{className:'dsc-room-note',role:'alert'},error) : null,
          form ? h('form',{className:'dsc-room-composer',onSubmit:e=>{e.preventDefault();if(name.trim()&&memberIds.length>=2)act('group-create',{name:name.trim(),employeeIds:memberIds});}},
            h('label',{className:'dsc-label',htmlFor:'dsc-group-name'},L.groupName),
            h('input',{id:'dsc-group-name',className:'dsc-input',value:name,maxLength:80,disabled:busy,onChange:e=>setName(e.target.value)}),
            h('fieldset',{className:'dsc-group-members'},h('legend',null,L.choose),employees.map(employee=>h('label',{key:employee.id,className:'dsc-group-member'},
              h('input',{type:'checkbox',checked:memberIds.includes(employee.id),disabled:busy || (!memberIds.includes(employee.id)&&memberIds.length>=6),
                onChange:e=>setMemberIds(prev=>e.target.checked?[...prev,employee.id]:prev.filter(id=>id!==employee.id))}),
              h('span',null,employee.name),h('small',null,employee.title||employee.role)))),
            h('div',{className:'dsc-card-actions'},h('button',{className:'dsc-btn','data-kind':'primary',type:'submit',disabled:busy||!name.trim()||memberIds.length<2},L.create),
              h('button',{className:'dsc-btn',type:'button',disabled:busy,onClick:()=>setForm(false)},L.cancel)))
          : visible ? h(React.Fragment,null,
            h('div',{className:'dsc-room-feed','aria-label':L.inbox,'aria-live':'polite'},visible.messages?.length
              ? visible.messages.map(message=>h('article',{key:message.id,className:`dsc-room-message ${message.kind==='user'?'dsc-room-owner':''}`},
                  h('div',{className:'dsc-room-messagehead'},h('strong',null,message.kind==='user'?L.owner:message.name||employeeName(message.employeeId)),
                    h('span',null,message.kind==='error'?L.error:formatTime(message.at))),h('pre',null,String(message.text||''))))
              : h('div',{className:'dsc-room-welcome'},h('p',null,L.noMessages))),
            h('form',{className:'dsc-room-composer',onSubmit:e=>{e.preventDefault();if(draft.trim()&&!running)act('group-send',{id,text:draft.trim()});}},
              h('label',{className:'dsc-label',htmlFor:'dsc-group-message'},L.prompt),h('p',{className:'dsc-hint'},L.hint),
              h('textarea',{id:'dsc-group-message',className:'dsc-area',value:draft,maxLength:4000,disabled:busy||running,onChange:e=>setDraft(e.target.value)}),
              h('button',{className:'dsc-btn','data-kind':'primary',type:'submit',disabled:busy||running||!draft.trim()},running?L.busy:L.send)))
          : h('div',{className:'dsc-room-welcome'},h('p',null,id?t('loading'):L.empty))),
        h('aside',{className:'dsc-room-review','aria-label':L.status},h('h3',null,L.status),
          visible?.employeeIds?.length ? h('ul',{className:'dsc-room-members'},visible.employeeIds.map(employeeId=>{
            const slot = visible.run?.workers?.find(worker=>worker.employeeId===employeeId);
            return h('li',{key:employeeId},h('strong',null,employeeName(employeeId)),slot?h('span',{'data-status':slot.status},labelStatus(slot.status)):null);
          })) : h('p',{className:'dsc-hint'},L.people)));
    }

    const QUANT_ROLES = [
      ['quote','quantDataRole'], ['theme','quantSentimentRole'],
      ['candidate','quantOrderbookRole'], ['risk','quantRiskRole'], ['delivery','quantNotificationRole'],
    ];
    function quantStamp(value) {
      if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
      if (typeof value !== 'string' || !/(Z|[+-]\d{2}:?\d{2})$/i.test(value)) return NaN;
      return Date.parse(value);
    }
    function quantBeijingTime(value) {
      const stamp = quantStamp(value);
      if (!Number.isFinite(stamp)) return '';
      // Explicit Asia/Shanghai formatting, independent of browser/device timezone.
      return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(stamp));
    }
    function quantTimestamp(value, now, t) {
      if (value == null || value === '') return t('quantUnknown');
      const stamp = quantStamp(value);
      if (!Number.isFinite(stamp)) return t('quantUnknown');
      const age = Math.floor((now - stamp) / 1000);
      return `${quantBeijingTime(stamp)} ${t('quantBeijing')} · ${age < 0 ? t('quantFuture') : `${age} ${t('quantAgo')}`}`;
    }
    function quantTimeline(input) {
      const rows = new Map();
      for (const event of Array.isArray(input) ? input : []) {
        if (event && typeof event.id === 'string' && event.id && Number.isFinite(quantStamp(event.at)) && QUANT_ROLES.some(([id])=>id===event.roleId)) rows.set(event.id,event);
      }
      return [...rows.values()].sort((a,b)=>quantStamp(a.at)-quantStamp(b.at) || a.id.localeCompare(b.id)).slice(-80);
    }
    function quantNewEventIds(events, seen) {
      return events.filter(event=>!seen.has(event.id)).map(event=>event.id);
    }
    function quantAssignmentsValid(assignments, employees) {
      const ids=new Set(employees.map(employee=>employee.id));
      return Object.entries(assignments).every(([role,id])=>QUANT_ROLES.some(([key])=>key===role) && ids.has(id));
    }
    function QuantPeoplePanel({data,draft=null,error='',notice='',saving=false,t,onChange,onSave}) {
      const employees=Array.isArray(data?.employees)?data.employees:[];
      const assignments=draft || data?.assignments || {};
      const originLabel=origin=>origin==='workflow'?t('quantSource_fixed'):origin==='mission'?t('companyLegacy'):['company','fixed','group'].includes(origin)?t('quantSource_'+origin):String(origin || t('quantUnknown'));
      const work=entry=>h('div',{className:'dsc-quant-personwork'},h('span',{className:'dsc-quant-workorigin'},originLabel(entry.origin)),h('strong',null,String(entry.title || '—')),h('span',null,(['idle','running','done','blocked','stale','unknown'].includes(entry.status) ? t('quantStatus_'+entry.status) : t(entry.status || 'quantUnknown'))),h('time',{dateTime:entry.at || undefined},quantBeijingTime(entry.at) || t('quantUnknown')));
      return h('section',{className:'dsc-quant-employees','aria-label':t('quantPeople')},
        h('h3',null,t('quantPeople')),h('p',{className:'dsc-quant-note'},t('quantPeopleHint')),
        error?h('p',{role:'alert'},`${t('quantRosterError')} ${error}`):null,
        !employees.length?h('p',null,t('quantNoPeople')):null,
        employees.map((employee,index)=>h('article',{key:employee.id,className:'dsc-quant-employee','data-employee-id':employee.id,'data-accent':String(index%7),'data-working':employee.active?.some(entry=>['running','working','bidding'].includes(entry.status))?'1':'0'},
          h('header',null,h('span',{className:'dsc-quant-employeeavatar','aria-hidden':true},String(employee.name || '?').slice(0,1)),h('div',null,h('h4',null,employee.name),h('p',null,employee.title || employee.role || '—'))),
          Array.isArray(employee.active) && employee.active.length ? h('div',{className:'dsc-quant-activework'},employee.active.map((entry,index)=>h('div',{key:`${entry.origin}-${index}`},work(entry)))):h('p',{className:'dsc-quant-note'},t('quantIdle')),
          employee.last ? h('details',null,h('summary',null,t('quantLastResult')),work(employee.last),h('pre',null,String(employee.last.output || '—'))) : h('p',{className:'dsc-quant-note'},t('quantNoResult')))),
        h('section',{className:'dsc-quant-owners','aria-label':t('quantOwner')},h('h3',null,t('quantOwner')),h('p',{className:'dsc-quant-note'},t('quantOwnerHint')),
          QUANT_ROLES.map(([role,label])=>h('label',{key:role},t(label),h('select',{'aria-label':`${t('quantOwner')}: ${t(label)}`,value:assignments[role] || '',disabled:saving || !data?.assignmentsAvailable,onChange:event=>onChange(role,event.target.value)},
            h('option',{value:''},t('quantUnassigned')),
            assignments[role] && !employees.some(employee=>employee.id===assignments[role])?h('option',{value:assignments[role]},`${t('quantUnknown')}: ${assignments[role]}`):null,
            employees.map(employee=>h('option',{key:employee.id,value:employee.id},employee.name))))),
          !data?.assignmentsAvailable?h('p',null,t('quantOwnersUnavailable')):null,
          h('button',{className:'dsc-btn',disabled:saving || !data?.assignmentsAvailable || draft===null || !quantAssignmentsValid(assignments,employees),onClick:onSave},t('quantSaveOwners')),
          draft && !quantAssignmentsValid(assignments,employees)?h('p',{role:'alert'},t('quantOwnerInvalid')):null,
          notice?h('p',{role:'status'},notice):null));
    }
    function QuantPeopleWorkspace({t,request=call}) {
      const [data,setData]=useState(null),[draft,setDraft]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[saving,setSaving]=useState(false);
      const alive=useRef(true),inFlight=useRef(false),saveLock=useRef(false),generation=useRef(0);
      const refresh=useCallback(async()=>{
        if(inFlight.current || saveLock.current)return;
        inFlight.current=true;const revision=generation.current;
        try {const result=await request('quant-roster');if(alive.current && revision===generation.current){setData(result);setError('');}}
        catch(caught){if(alive.current && revision===generation.current)setError(caught?.message || String(caught));}
        finally{inFlight.current=false;}
      },[request]);
      useEffect(()=>{alive.current=true;refresh();const timer=setInterval(refresh,5000);return()=>{alive.current=false;clearInterval(timer);};},[refresh]);
      const change=(role,id)=>{setDraft(current=>{const next={...(current || data?.assignments || {})};if(id)next[role]=id;else delete next[role];return next;});setNotice('');};
      const save=async()=>{
        if(saveLock.current || !data?.assignmentsAvailable || draft===null || !quantAssignmentsValid(draft,data?.employees || []))return;
        saveLock.current=true;generation.current++;setSaving(true);setError('');setNotice('');
        try{const result=await request('quant-roster-save',{assignments:draft});if(alive.current){setData(result);setDraft(null);setNotice(t('quantOwnersSaved'));}}
        catch(caught){if(alive.current)setError(caught?.message || String(caught));}
        finally{saveLock.current=false;if(alive.current)setSaving(false);}
      };
      return h(QuantPeoplePanel,{data,draft,error,notice,saving,t,onChange:change,onSave:save});
    }

    function QuantDashboard({data, error='', loading=false, now=Date.now(), t, onRefresh, request=call}) {
      const [playing,setPlaying]=useState(false),[cursor,setCursor]=useState(0),[frozen,setFrozen]=useState(null),[follow,setFollow]=useState(true),[pulse,setPulse]=useState(null);
      const logRef=useRef(null),seenRef=useRef(new Set()),baselineRef=useRef(false);
      const archive = data?.mode !== 'live_readonly' || data?.session === 'closed';
      const events=useMemo(()=>data?.available ? quantTimeline(data.timeline) : [],[data?.available,data?.timeline]);
      const pool=archive && frozen ? frozen : events;
      const visible=archive ? pool.slice(0,cursor) : events;
      useEffect(()=>{setPlaying(false);setCursor(0);setFrozen(null);setPulse(null);seenRef.current=new Set();baselineRef.current=false;},[archive]);
      useEffect(()=>{
        const ids=quantNewEventIds(events,seenRef.current);
        if(!archive && baselineRef.current && ids.length) {
          const event=events.find(item=>item.id===ids[ids.length-1]);setPulse({id:event.id,ids,roleIds:events.filter(item=>ids.includes(item.id)).map(item=>item.roleId)});
        }
        for(const event of events)seenRef.current.add(event.id);
        if(seenRef.current.size>2000)seenRef.current=new Set([...seenRef.current].slice(-1000));
        if(data?.available && Array.isArray(data?.timeline))baselineRef.current=true;
      },[events,archive]);
      useEffect(()=>{
        if(!playing || !archive)return;
        if(cursor>=pool.length){setPlaying(false);return;}
        const timer=setTimeout(()=>{const event=pool[cursor];if(event){setCursor(cursor+1);setPulse({id:event.id,ids:[event.id],roleIds:[event.roleId]});}},900);
        return()=>clearTimeout(timer);
      },[playing,archive,cursor,pool]);
      useEffect(()=>{if(!pulse)return;const timer=setTimeout(()=>setPulse(null),800);return()=>clearTimeout(timer);},[pulse]);
      const tailId=visible[visible.length-1]?.id;
      useEffect(()=>{if(follow && logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[tailId,follow]);
      const play=()=>{if(!pool.length)return;if(!frozen)setFrozen(events.slice());if(cursor>=pool.length)setCursor(0);setPlaying(true);};
      const reset=()=>{setPlaying(false);setCursor(0);setFrozen(null);setPulse(null);};
      const modes = {replay:'quantReplay',paper:'quantSimulation',live_readonly:'quantLive'};
      const roles = data?.available && Array.isArray(data?.roles) ? data.roles : [];
      const sourceError = error || data?.error || '';
      const statusText = status => t('quantStatus_' + (['idle','running','done','blocked','stale'].includes(status) ? status : 'unknown'));
      return h('section',{className:'dsc-quant dsc-quant-neon','aria-label':t('quantTab')},
        h('header',{className:'dsc-quant-head'},h('div',null,h('div',{className:'dsc-quant-kicker'},t('quantReadOnly')),h('h2',null,t('quantTab')),h('p',null,t('quantSubtitle'))),
          h('button',{className:'dsc-btn',disabled:loading,onClick:onRefresh},t('quantRefresh'))),
        h('div',{className:'dsc-quant-meta'},h('strong',null,`${t('quantMode')}: ${t(modes[data?.mode] || 'quantUnknown')}`),h('span',null,`${t('quantSnapshot')}: ${quantTimestamp(data?.generatedAt,now,t)}`)),
        h('p',{className:'dsc-quant-note'},`${t('quantSource')}: ${data?.source || t('quantUnknown')} · ${t('quantSession')}: ${t(({morning:'quantSessionMorning',afternoon:'quantSessionAfternoon',lunch:'quantSessionLunch',closed:'quantSessionClosed'})[data?.session] || 'quantUnknown')}`),
        sourceError ? h('p',{className:'dsc-quant-warning',role:'alert'},`${t('quantError')} ${String(sourceError)}`) : null,
        (!data || !data.available) ? h('p',{className:'dsc-quant-warning',role:'status'},t('quantUnavailable')) : null,
        h('div',{className:'dsc-quant-terminal'},
          h('aside',{className:'dsc-quant-people-sidebar'},h(QuantPeopleWorkspace,{t,request})),
          h('main',{className:'dsc-quant-evidence'},
            h('section',{className:'dsc-quant-log dsc-quant-stream','aria-label':t('quantEventFeed')},
              h('div',{className:'dsc-quant-streamhead'},h('h3',null,t('quantEventFeed')),h('span',null,`${visible.length}/${pool.length} · ${t('quantBeijing')}`)),
              h('p',{className:'dsc-quant-note'},t(archive?'quantArchive':'quantLiveEvents')),
              h('div',{className:'dsc-quant-controls'},archive ? h('button',{className:'dsc-btn',disabled:!pool.length,onClick:playing?()=>setPlaying(false):play},t(playing?'quantPause':'quantPlay')):null,
                archive ? h('button',{className:'dsc-btn',onClick:reset},t('quantReset')):null,
                h('label',null,h('input',{type:'checkbox',checked:follow,onChange:e=>setFollow(e.target.checked)}),t('quantFollow'))),
              h('div',{className:'dsc-quant-scroll',ref:logRef,tabIndex:0,'aria-label':t('quantEventFeed'),onScroll:e=>{const el=e.currentTarget;if(el.scrollHeight-el.scrollTop-el.clientHeight>24)setFollow(false);}},
                !visible.length ? h('p',{className:'dsc-quant-empty'},t(pool.length?'quantReplayReady':'quantNoEvents')):null,
                h('ol',null,visible.map(event=>h('li',{key:event.id,'data-event-id':event.id,'data-new':pulse?.ids?.includes(event.id)?'1':'0'},
                  h('time',{dateTime:event.at},quantBeijingTime(event.at)),h('strong',null,t(QUANT_ROLES.find(([id])=>id===event.roleId)?.[1] || 'quantUnknown')),
                  h('code',null,String(event.kind || '')),h('p',null,String(event.action || t('quantUnknown'))),
                  event.reason ? h('p',{className:'dsc-quant-eventreason'},String(event.reason)):null,
                  event.counts && Object.keys(event.counts).length ? h('small',null,Object.entries(event.counts).filter(([,value])=>Number.isFinite(value)).map(([key,value])=>`${key}: ${value}`).join(' · ')):null))))),
            h('h3',null,t('quantTelemetry')),
          h('section',{className:'dsc-quant-roster dsc-quant-raw','aria-label':t('quantTelemetry')},QUANT_ROLES.map(([id,label],index)=>{
            const role=roles.find(item=>item.id===id);
            return h('article',{key:id,className:'dsc-quant-person','data-pulse':pulse?.roleIds?.includes(id)?'1':'0'},h('div',{className:'dsc-quant-rolehead'},h('span',{className:'dsc-quant-index'},String(index+1).padStart(2,'0')),h('strong',null,t(label))),h('span',{className:'dsc-quant-pill','data-status':role?.status || 'unknown'},statusText(role?.status)),h('p',null,role?.action || t('quantMissing')),h('small',null,quantTimestamp(role?.at,now,t)));
          })),
            h('section',{'aria-label':t('quantFlow')},h('h3',null,t('quantFlow')),h('p',{className:'dsc-quant-note'},t('quantFlowHint')),
              h('ol',{className:'dsc-quant-path'},QUANT_ROLES.map(([id,label])=>{const role=roles.find(item=>item.id===id);return h('li',{key:id},h('strong',null,t(label)),h('span',{'data-status':role?.status || 'unknown',className:'dsc-quant-pill'},statusText(role?.status)));}))),
        h('details',{className:'dsc-quant-metrics'},h('summary',null,t('quantSnapshotDetails')),h('div',{className:'dsc-quant-grid'},QUANT_ROLES.map(([id,label],index)=>{
          const role = roles.find(item=>item.id===id);
          return h('article',{key:id,className:'dsc-quant-role','aria-label':t(label)},
            h('div',{className:'dsc-quant-rolehead'},h('span',{className:'dsc-quant-index','aria-hidden':true},String(index+1).padStart(2,'0')),h('h3',null,t(label))),
            h('p',{className:'dsc-quant-status'},`${t('quantReported')}: ${statusText(role?.status)}`),
            !role ? h('p',null,t('quantMissing')) : null,
            h('dl',null,h('dt',null,t('quantHeartbeat')),h('dd',null,quantTimestamp(role?.at,now,t)),h('dt',null,t('quantFreshness')),h('dd',null,quantTimestamp(data?.marketAsOf,now,t)),h('dt',null,t('quantProcessing')),h('dd',null,role?.action ? String(role.action) : t('quantUnknown'))),
            h('div',{className:'dsc-quant-counts'},h('h4',null,t('quantCounts')),
              role?.counts && typeof role.counts === 'object' && Object.keys(role.counts).length ? h('dl',null,Object.entries(role.counts).map(([key,value])=>h('div',{key},h('dt',null,key),h('dd',null,Number.isFinite(value)?String(value):t('quantUnknown'))))) : h('p',null,t('quantUnknown'))),
            h('div',{className:'dsc-quant-blocker'},h('strong',null,t('quantBlocked')),h('p',null,role?.reason ? String(role.reason) : t('quantUnknown'))));
        }))),
          )),
          data?.outbox ? h('section',{className:'dsc-quant-meta','aria-label':t('quantDelivery')},h('strong',null,t('quantDelivery')),h('span',null,data.outbox.mode==='dry_run'?t('quantDryRun'):t('quantUnknown')),h('span',null,`${t('quantEligible')}: ${Number.isFinite(data.outbox.eligible)?data.outbox.eligible:t('quantUnknown')} · ${t('quantDelivered')}: ${Number.isFinite(data.outbox.delivered)?data.outbox.delivered:t('quantUnknown')}`)) : null,h('p',{className:'dsc-quant-note'},t('quantHealthNote')));
    }
    function QuantWorkspace({t, request=call}) {
      const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[now,setNow]=useState(Date.now());
      const inFlight=useRef(false),alive=useRef(true);
      const refresh=useCallback(async()=>{
        if(inFlight.current) return;
        inFlight.current=true;setLoading(true);
        try {const result=await request('quant-status');if(alive.current){setData(result);setError('');setNow(Date.now());}}
        catch(caught){if(alive.current)setError(caught?.message || String(caught));}
        finally {inFlight.current=false;if(alive.current)setLoading(false);}
      },[request]);
      useEffect(()=>{alive.current=true;refresh();const timer=setInterval(()=>{setNow(Date.now());refresh();},5000);return()=>{alive.current=false;clearInterval(timer);};},[refresh]);
      return h(QuantDashboard,{data,error,loading,now,t,onRefresh:refresh,request});
    }


    // Illustrated office view.
// Browser-module source. Insert inside the existing client factory with h/useState/useEffect/useRef/call.
const OFFICE_CSS = `
.dsc-ofc{--of-bg:#101417;--of-ink:#edf0f3;--of-dim:#abb6bf;--of-line:#3b474f;color:var(--of-ink);background:var(--of-bg);border:1px solid var(--of-line);border-radius:14px;padding:18px;container-type:inline-size}
.dsc-ofc *{box-sizing:border-box}.dsc-ofc button{font:inherit;color:inherit}.dsc-ofc button:focus-visible{outline:2px solid #ece4b1;outline-offset:3px}
.dsc-ofc h2,.dsc-ofc h3,.dsc-ofc h4,.dsc-ofc p{margin:0}.dsc-ofc small,.dsc-of-muted{color:var(--of-dim)}
.dsc-of-head{display:flex;gap:14px;align-items:center;justify-content:space-between;margin-bottom:16px}.dsc-of-head h2{font-size:24px;font-weight:680;line-height:1.2}.dsc-of-eyebrow{display:block;color:#c4d0d8;margin-bottom:5px;font:700 10px/1.1 system-ui;letter-spacing:.16em;text-transform:uppercase}.dsc-of-head p{margin-top:6px}
.dsc-of-layout{display:grid;grid-template-columns:118px minmax(0,2.8fr) minmax(210px,1fr);gap:14px;align-items:start}
.dsc-of-nav{display:grid;gap:4px;background:#171e23;border:1px solid var(--of-line);border-radius:8px;padding:6px}.dsc-of-nav button{min-width:0;text-align:start;border:1px solid transparent;border-radius:5px;padding:7px 6px;background:transparent;cursor:pointer;font-size:11px;overflow-wrap:anywhere}.dsc-of-nav button:hover,.dsc-of-nav button[aria-current=page]{background:#29333b;border-color:#485863}.dsc-of-nav button[aria-current=page]{font-weight:700;cursor:default}.dsc-of-floor{min-width:0;padding:9px;background:#20272c;border:1px solid #424d54;border-radius:12px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.dsc-of-room{--room:#889baf;border:1px solid #43505a;border-top:3px solid var(--room);border-radius:8px;padding:8px;min-width:0;background:repeating-linear-gradient(90deg,transparent 0 21px,#ffffff07 22px 23px),color-mix(in srgb,var(--room) 14%,#141b20);box-shadow:inset 0 -4px #070a0d4d}
.dsc-of-room[data-room=lead]{--room:#c4a879;grid-column:1/-1;background:repeating-linear-gradient(90deg,transparent 0 29px,#ffffff08 30px 31px),#332a22}
.dsc-of-room[data-room=product]{--room:#a59bc3}.dsc-of-room[data-room=engineering]{--room:#8caaba}.dsc-of-room[data-room=data]{--room:#94aaa1}.dsc-of-room[data-room=quality]{--room:#bd9c98}.dsc-of-room[data-room=team]{--room:#a2a5b0;grid-column:1/-1}
.dsc-of-roomhead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}.dsc-of-roomhead h3{font-size:13px;letter-spacing:.02em}.dsc-of-roomhead small{white-space:nowrap;font-variant-numeric:tabular-nums}.dsc-of-door{width:26px;height:4px;display:block;background:var(--room);opacity:.5;border-radius:5px;margin:8px auto -8px}
.dsc-of-seats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,110px),1fr));gap:8px}.dsc-of-leadgrid{display:grid;grid-template-columns:minmax(100px,2fr) minmax(125px,3fr);gap:9px;align-items:center}
.dsc-of-bossnote{padding:10px;border-left:1px solid #685a46;line-height:1.45}.dsc-of-bossnote p{margin-bottom:8px}.dsc-of-cta{border:1px solid #d2b992;background:#d4bc96;color:#1c1812!important;border-radius:7px;padding:8px 12px;font-weight:700!important;cursor:pointer}.dsc-of-cta:disabled{opacity:.55;cursor:default}
.dsc-of-desk{min-width:0;display:grid;grid-template-rows:auto 55px auto;gap:3px;width:100%;padding:5px;border:1px solid transparent;border-radius:7px;background:none;text-align:center;cursor:pointer}
.dsc-of-desk:hover,.dsc-of-desk[aria-pressed=true]{border-color:var(--room);background:#070a0d30}.dsc-of-desk[data-working=true]{border-color:#84fbd1;box-shadow:0 0 12px #55ffb944}.dsc-of-desk strong{font-size:12px;overflow-wrap:anywhere}.dsc-of-desk small{white-space:normal;font-size:10px;line-height:1.25}.dsc-of-desk[data-working=true] small{color:#9bffdc}
.dsc-of-light{transform-box:fill-box;transform-origin:center}.dsc-of-desk[data-working=true] .dsc-of-light{animation:dsc-of-signal 1.5s ease-in-out infinite alternate}
@keyframes dsc-of-signal{from{opacity:.48}to{opacity:1;filter:drop-shadow(0 0 3px #9bffdc)}}
.dsc-of-goals{list-style:none;margin:0;padding:0;display:grid;gap:10px}.dsc-of-goals li{min-width:0;border-bottom:1px solid #354048;padding-bottom:8px}.dsc-of-goals li:last-child{padding-bottom:0;border:0}.dsc-of-goals strong{font-size:12px;overflow-wrap:anywhere}.dsc-of-goals small{display:block;margin:3px 0;font-size:11px}.dsc-of-goals progress{width:100%;height:7px;accent-color:#9abbad}
.dsc-of-figure{display:block;width:100%;height:55px;overflow:visible}.dsc-of-rail{display:grid;gap:10px;min-width:0}.dsc-of-panel{min-width:0;border:1px solid var(--of-line);border-radius:10px;padding:12px;background:#1a2025}.dsc-of-panel h3{font-size:14px;margin-bottom:8px}.dsc-of-panel h4{font-size:12px;margin:12px 0 5px}
.dsc-of-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin:10px 0 0}.dsc-of-metrics div{min-width:0;background:#11171b;border-radius:6px;padding:7px 4px;text-align:center}.dsc-of-metrics strong{display:block;font:650 20px/1 system-ui;margin-bottom:4px}.dsc-of-metrics span{font-size:10px;color:var(--of-dim);overflow-wrap:anywhere}
.dsc-of-list{list-style:none;margin:0;padding:0;display:grid;gap:7px}.dsc-of-list li{font-size:12px;min-width:0;overflow-wrap:anywhere;padding:0 0 7px;border-bottom:1px solid #353f46}.dsc-of-list li:last-child{border-bottom:0;padding-bottom:0}.dsc-of-list small{display:block;margin-top:2px}.dsc-of-profile{border:1px solid #64747d;border-radius:6px;background:#263038;padding:6px 9px;cursor:pointer;margin-top:8px}.dsc-of-empty{font-size:12px;line-height:1.45;color:var(--of-dim)}
@container(max-width:810px){.dsc-of-layout{grid-template-columns:minmax(0,2.8fr) minmax(185px,1fr)}.dsc-of-nav{grid-column:1/-1;display:flex;flex-wrap:wrap}}
@container(max-width:590px){.dsc-of-layout{grid-template-columns:minmax(0,1fr)}.dsc-of-rail{grid-template-columns:repeat(auto-fit,minmax(min(100%,215px),1fr))}}
@container(max-width:430px){.dsc-of-floor{grid-template-columns:minmax(0,1fr)}.dsc-of-room{grid-column:1}.dsc-of-head{align-items:start}.dsc-of-head h2{font-size:20px}.dsc-of-leadgrid{grid-template-columns:1fr}.dsc-of-bossnote{border-left:0;border-top:1px solid #685a46}}
@media(prefers-reduced-motion:reduce){.dsc-ofc *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
`;

const OFFICE_3D_CSS = `
.dsc-o3{grid-column:1/-1;min-width:0;display:grid;gap:10px;align-content:start}
.dsc-o3-head,.dsc-o3-controls{display:flex;align-items:center;flex-wrap:wrap;gap:7px}
.dsc-o3-head{justify-content:space-between}.dsc-o3-head strong{font-size:13px;letter-spacing:.065em}
.dsc-o3-controls button{border:1px solid #465784;border-radius:8px;background:#1b2946;color:#e7efff!important;padding:6px 9px;cursor:pointer}
.dsc-o3-controls button[aria-pressed=true]{background:#373671;border-color:#b0a8ff}
.dsc-o3-frame{position:relative;isolation:isolate;--office-boss-x:50%;--office-boss-y:62%;border:1px solid #a99d8e;border-radius:11px;overflow:hidden;background:#d3cfc9}.dsc-o3-stage{width:100%;height:auto;aspect-ratio:1.48;position:relative;overflow:hidden;background:#d3cfc9}
.dsc-o3-stage canvas{display:block;width:100%;height:100%;cursor:grab;touch-action:pan-y}
.dsc-o3-labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.dsc-o3-label{position:absolute;left:0;top:0;max-width:110px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;font:650 11px/1.2 system-ui;color:#22202b;background:#fff9f1ef;border:1px solid #989080;padding:3px 6px;border-radius:5px;box-shadow:0 2px 6px #3028194d;}
.dsc-o3-room{font-size:10px;letter-spacing:.025em;color:#24222b;background:#fffaf0;border:1px solid #a69e8d;border-left:3px solid var(--tint);max-width:135px}
.dsc-o3-worker[data-working=true]{border-color:#269274;color:#0b382c;background:#b8f4df;box-shadow:0 0 10px #50a58d55}
.dsc-o3-worker[data-selected=true]{outline:2px solid #6451a2;outline-offset:2px}
.dsc-o3-fallback{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));min-width:0;gap:9px;grid-column:1/-1;padding:0!important;border:0!important;background:none!important}
.dsc-o3-people{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:0;padding:0}
.dsc-o3-people button{white-space:normal;text-align:left;display:flex;align-items:center;flex-wrap:wrap;gap:6px}
.dsc-o3-people small{color:#d5dff2}.dsc-o3-people small[data-working=true]{color:#a6ffe5}
@container(max-width:520px){.dsc-o3-fallback{grid-template-columns:minmax(0,1fr)}.dsc-o3-fallback .dsc-of-room{grid-column:1}.dsc-o3-stage{height:auto;aspect-ratio:1.48}.dsc-o3-label{font-size:8px;padding:2px 3px;max-width:70px}.dsc-o3-room{max-width:68px}}
.dsc-o3-boss-action{position:absolute;z-index:4;left:var(--office-boss-x);top:var(--office-boss-y);transform:translate(-50%,7px);white-space:nowrap;background:#161516;color:#fff6e7!important;border:1px solid #f1d8a9;border-radius:999px;padding:5px 11px;font-size:11px!important;font-weight:750!important;cursor:pointer;box-shadow:0 3px 9px #32231565}
.dsc-o3-boss-action:hover{background:#352726}.dsc-o3-boss-action:focus-visible{outline:2px solid #5344a1!important;outline-offset:2px!important}.dsc-o3-fallback-action{justify-self:start}
.dsc-o3-head .dsc-o3-controls button,.dsc-o3-camera button{min-height:29px;font-size:11px}
.dsc-o3-help{font-size:11px;overflow-wrap:anywhere}
.dsc-ofc[data-office-style=reference]{padding:12px}.dsc-ofc[data-office-style=reference] .dsc-of-head{margin-bottom:10px}
.dsc-ofc[data-office-style=reference] .dsc-of-head h2{font-size:20px}
.dsc-ofc[data-office-style=reference] .dsc-of-floor{padding:0;background:none;border:0;display:block}
@container(max-width:520px){.dsc-o3-boss-action{font-size:9px!important;padding:4px 7px;transform:translate(-50%,3px)}}

`;
function Office3DLayer({people,picked,onPick,onGoal,fallback,language}) {
  const [mode,setMode]=useState('3d');
  const [renderState,setRenderState]=useState('loading');
  const host=useRef(null), controller=useRef(null), callbacks=useRef(null);
  const L=(zh,en)=>language==='en'?en:zh;
  callbacks.current={people,picked,onPick};
  useEffect(()=>{
    if(mode!=='3d')return;
    let disposed=false;let instance=null;setRenderState('loading');
    Promise.resolve().then(()=>import(API+'/office/office3d.js')).then(mod=>{
      if(disposed||!host.current)return;
      instance=mod.mountOffice3D(host.current,{language,pick:id=>callbacks.current.onPick(id),
        onLost:()=>{if(!disposed){instance?.destroy();instance=null;controller.current=null;setRenderState('lost');}}});
      controller.current=instance;
      instance.update(callbacks.current.people,callbacks.current.picked);
      setRenderState('ready');
    }).catch(()=>{
      if(!disposed){instance?.destroy();instance=null;controller.current=null;setRenderState('lost');}
    });
    return()=>{disposed=true;instance?.destroy();controller.current=null;};
  },[mode,language]);
  useEffect(()=>{controller.current?.update(people,picked);},[people,picked]);
  const use3d=mode==='3d'&&renderState==='ready';
  const selectedText=people.find(e=>e.id===picked);
  return h('div',{className:'dsc-o3'},
    h('style',null,OFFICE_3D_CSS),
    h('div',{className:'dsc-o3-head'},
      h('small',{className:'dsc-of-muted'},L('点击工位查看活动','Select a desk to inspect activity')),
      h('div',{className:'dsc-o3-controls','aria-label':L('办公图显示模式','Office display mode')},
        h('button',{type:'button','aria-pressed':mode==='3d',onClick:()=>{if(mode!=='3d'){setRenderState('loading');setMode('3d');}}},L('3D 实景','3D scene')),
        h('button',{type:'button','aria-pressed':mode==='2d',onClick:()=>setMode('2d')},L('2D 平面图','2D floor plan')))),
    mode==='3d'&&renderState==='lost'?h('p',{className:'dsc-of-muted',role:'status'},L('3D 暂不可用，已显示可操作的平面图。','3D is unavailable; the interactive floor plan is shown.')):null,
    mode==='3d'&&renderState==='loading'?h('p',{className:'dsc-of-muted',role:'status'},L('正在加载 3D 办公室。','Loading 3D office.')):null,
    mode==='3d'&&renderState!=='lost'?h('div',{className:'dsc-o3-frame'},
      h('div',{className:'dsc-o3-stage',ref:host,'aria-hidden':'true'}),
      use3d&&onGoal?h('button',{type:'button',className:'dsc-o3-boss-action',onClick:onGoal},L('拆解新目标','Start a new objective')):null):null,
    !use3d&&onGoal?h('button',{type:'button',className:'dsc-of-cta dsc-o3-fallback-action',onClick:onGoal},L('拆解新目标','Start a new objective')):null,
    use3d ? h('div',{className:'dsc-o3-controls dsc-o3-camera','aria-label':L('相机控制','Camera controls')},
      [['left',L('向左旋转','Orbit left')],['right',L('向右旋转','Orbit right')],['in',L('放大','Zoom in')],['out',L('缩小','Zoom out')],['reset',L('重置视角','Reset camera')]].map(([key,label])=>
        h('button',{key,type:'button',onClick:()=>controller.current?.adjust(key)},label))) : null,
    use3d ? h('ul',{className:'dsc-o3-people dsc-o3-controls','aria-label':L('可选择的员工','Selectable employees')},people.map(person=>
      h('li',{key:person.id},h('button',{type:'button','aria-pressed':person.id===picked,onClick:()=>onPick(person.id)},person.name,
        h('small',{'data-working':String(person.working)},person.status))))) : h('div',{className:'dsc-o3-fallback dsc-of-floor'},fallback),
    use3d?h('p',{className:'dsc-of-muted dsc-o3-help',role:'status','aria-live':'polite'},selectedText?selectedText.name+' · '+selectedText.status:L('亮绿标记表示已记录的正在执行；可拖动地图切换视角。','Green markers indicate recorded active work. Drag to orbit.')):null);
}

function OfficeView({employees=[],plans,workflows=[],stateError='',companyName='',t,onOpenCompany,onOpenEmployee,onNavigate,groupsAvailable=false,request=call}) {
  const [data,setData]=useState(null);
  const [failed,setFailed]=useState(false);
  const refreshed=useRef(0);
  const baselineReplies=useRef(null);
  const [picked,setPicked]=useState('');
  useEffect(()=>{
    let alive=true, pending=false;
    async function tick(){
      if(pending)return;
      pending=true;
      try{
        const next=await request('quant-roster');
        if(alive){
          const valid=Array.isArray(next?.employees);
          if(valid&&baselineReplies.current===null) baselineReplies.current=new Set(next.employees.flatMap(row=>row.latestReply?.eventId?[row.latestReply.eventId]:[]));
          refreshed.current=valid?Date.now():0;setData(valid?next.employees:null);setFailed(!valid);
        }
      }catch{if(alive){refreshed.current=0;setData(null);setFailed(true);}}
      finally{pending=false;}
    }
    tick();
    const timer=setInterval(()=>{
      if(refreshed.current && Date.now()-refreshed.current>7500){refreshed.current=0;setData(null);setFailed(true);}
      tick();
    },2500);
    return()=>{alive=false;clearInterval(timer);};
  },[request]);

  const en=t('companyMode')==='AI Company'||t('tabRoster')==='Employees';
  const L=(zh,english)=>en?english:zh;
  const classes=[
    ['lead','总经理办公室','Director’s office'],
    ['product','产品部','Product'],
    ['engineering','研发部','Engineering'],
    ['data','数据分析部','Data & analysis'],
    ['quality','质量与审核部','Quality & review'],
    ['team','共享办公区','Shared office'],
  ];
  const department={director:'lead',product:'product',techlead:'engineering',engineer:'engineering',analyst:'data',qa:'quality',reviewer:'quality'};
  const current=(Array.isArray(employees)?employees:[]).filter(e=>e?.id&&!e.fired);
  const trusted=new Map((data||[]).map(e=>[e.id,e]));
  const workFor=e=>stateError?undefined:trusted.get(e.id);
  const isRunning=work=>['running','working','bidding'].includes(work?.status);
  const working=e=>!stateError&&(workFor(e)?.active||[]).some(isRunning);
  const waiting=e=>(workFor(e)?.active||[]).some(item=>['pending','queued'].includes(item.status));
  const statusLabel=status=>({
    running:L('进行中','Running'),working:L('处理中','Working'),bidding:L('评估中','Evaluating'),
    pending:L('等待','Pending'),queued:L('排队','Queued'),done:L('已完成','Done'),
    failed:L('失败','Failed'),skipped:L('跳过','Skipped'),cancelled:L('取消','Cancelled'),
    interrupted:L('中断','Interrupted'),
  })[status]||L('未验证','Unverified');
  const latestReplyOf=e=>{
    const reply=workFor(e)?.latestReply;
    return reply?.eventId&&!baselineReplies.current?.has(reply.eventId)?reply:null;
  };
  const motionOf=e=>{
    const motion=workFor(e)?.motion;
    return !motion || (motion.kind==='reply'&&baselineReplies.current?.has(motion.eventId))?{kind:'idle'}:motion;
  };
  const motionText=e=>({typing:L('工位处理中','Working at desk'),group:L('正在参与群聊','Participating in group chat'),reply:L('刚已向群内回复','Recently replied to group')})[motionOf(e).kind];
  const personStatus=e=>working(e)
    ? (['typing','group'].includes(motionOf(e).kind)?motionText(e):L('正在工作','Working'))+(waiting(e)?L(' · 另有待办',' · Also waiting'):'')
    : waiting(e)?L('等待开始','Waiting to start')
    : motionText(e) || (workFor(e)?L('暂无进行中记录','No active work recorded'):L('状态未验证','Status unverified'));
  const selected=current.find(e=>e.id===picked);
  const officePeople=current.map(e=>({id:e.id,name:e.name,role:e.role,department:department[e.role]||'team',
    working:working(e),verified:Boolean(workFor(e)),status:personStatus(e),motion:motionOf(e),latestReply:latestReplyOf(e)}));
  const selectDesk=id=>setPicked(previous=>previous===id?'':id);
  const items=!stateError&&Array.isArray(plans)?plans:null;
  const goals=(items||[]).filter(p=>['awaiting_approval','approved','running','completed','failed','cancelled'].includes(p.status)).slice(0,4);
  const planLabel=status=>({awaiting_approval:L('待老板确认','Needs approval'),approved:L('已批准，待启动','Approved, not started'),running:L('执行中','Running'),completed:L('验收通过','Accepted'),failed:L('未通过或中断','Failed or interrupted'),cancelled:L('已取消','Cancelled')})[status];
  function progressOf(plan){
    const run=workflows.find(flow=>flow.id===plan.workflowId)?.lastRun;
    if(!run||run.id!==plan.runId||!Array.isArray(run.nodeRuns))return null;
    const slots=run.nodeRuns.filter(slot=>slot.nodeId!=='start');
    if(!slots.length)return null;
    return {total:slots.length,settled:slots.filter(slot=>['done','failed','skipped','cancelled','interrupted'].includes(slot.status)).length};
  }
  const activity=current.flatMap(e=>{
    const w=workFor(e);
    return [...(w?.active||[]).filter(isRunning),...(w?.last?[w.last]:[])].map(record=>({employee:e,record}));
  }).sort((a,b)=>String(b.record.at||'').localeCompare(String(a.record.at||''))).slice(0,5);
  const timeLabel=at=>{
    if(!at)return '';
    const d=new Date(at);
    return Number.isNaN(d.valueOf())?'':new Intl.DateTimeFormat(en?'en-US':'zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);
  };
  const displayRole=e=>e.title||e.role||L('员工','Employee');
  const roleColor={director:'#bd9473',product:'#a196c5',techlead:'#8fb3c1',engineer:'#7e9ebc',analyst:'#8cad99',qa:'#b48e9e',reviewer:'#be9d86'};
  function seat(e){
    const n=Array.from(String(e.id)).reduce((seed,ch)=>(seed*31+ch.codePointAt(0))>>>0,0);
    const hair=['#201f25','#463529','#31333d','#291f24'][n%4];
    const skin=['#d7aa89','#b58261','#d4a38d','#9c755b'][Math.floor(n/5)%4];
    const shirt=roleColor[e.role]||['#a7aa9e','#959faf','#b29d92'][n%3];
    const workingNow=working(e);
    const rect=(x,y,width,height,rx,fill)=>h('rect',{x,y,width,height,rx,fill});
    const oval=(cx,cy,rx,ry,fill)=>h('ellipse',{cx,cy,rx,ry,fill});
    return h('button',{type:'button',key:e.id,className:'dsc-of-desk','data-employee-id':e.id,'data-working':workingNow?'true':'false','data-motion':motionOf(e).kind,'aria-pressed':picked===e.id,'aria-label':e.name+' · '+personStatus(e),onClick:()=>setPicked(p=>p===e.id?'':e.id)},
      h('strong',null,e.name),
      h('svg',{className:'dsc-of-figure',viewBox:'0 0 120 71','aria-hidden':true,focusable:'false'},
        oval(60,63,33,6,'#0006'),
        rect(13,13,94,30,5,'#11171b'),
        rect(13,8,94,30,5,'#826655'),
        rect(17,9,86,23,3,'#a88870'),
        rect(32,13,29,15,3,'#263645'),
        h('rect',{className:'dsc-of-light',x:35,y:15,width:23,height:9,rx:2,fill:workingNow?'#a3f0da':'#647789'}),
        rect(66,16,16,9,2,'#dfd8be'),
        oval(91,18,4,4,'#d3c3a9'),
        oval(91,18,2.7,2.7,'#684b41'),
        rect(43,45,34,22,9,'#2b3841'),
        h('path',{d:'M42 55c1-10 10-16 18-16s17 6 18 16v4H42Z',fill:shirt}),
        oval(60,39,10,10,skin),
        h('path',{d:['M49 41c-5-14 18-19 22-6l-2 4-6-3-9 5Z','M50 44c-5-7-2-15 7-17 9-2 15 3 14 13l-7-6-6 3-5 7Z','M49 40l2-7 6-2 3-5 4 5 5 2 3 9-8-4-9 2Z','M50 43c-5-8-1-15 9-16 9-1 13 6 12 15l-5-3-5-4-6 4Z'][n%4],fill:hair}),
        rect(46,58,28,7,3,'#56636a')),
      h('small',null,personStatus(e)));
  }
  const renderList=records=>h('ul',{className:'dsc-of-list'},records.map((item,i)=>h('li',{key:i},
    h('strong',null,item.title||L('未命名任务','Untitled task')),
    h('small',null,[statusLabel(item.status),timeLabel(item.at)].filter(Boolean).join(' · ')))));
  return h('section',{className:'dsc-ofc','data-office-style':'reference','aria-label':L('AI 办公室','AI office')},
    h('style',null,OFFICE_CSS),
    h('header',{className:'dsc-of-head'},
      h('h2',null,L('AI 办公室','AI office'))),
    h('div',{className:'dsc-of-layout'},
      h('div',{className:'dsc-of-floor','aria-label':L('部门分区','Departments')},
        h(Office3DLayer,{people:officePeople,picked,onPick:selectDesk,onGoal:onOpenCompany,language:en?'en':'zh',fallback:classes.map(([id,zh,english])=>{
        const members=current.filter(e=>(department[e.role]||'team')===id);
        if(id==='team'&&!members.length)return null;
        const empty=h('p',{className:'dsc-of-empty'},L('当前没有登记员工','No employees assigned'));
        return h('section',{className:'dsc-of-room',key:id,'data-room':id,'aria-label':L(zh,english)},
          h('header',{className:'dsc-of-roomhead'},h('h3',null,L(zh,english)),h('small',null,en?`${members.length} seated`:`${members.length} 人`)),
          h('div',{className:'dsc-of-seats'},members.length?members.map(seat):empty),
          h('i',{className:'dsc-of-door','aria-hidden':true}));
      })})),
      h('aside',{className:'dsc-of-rail','aria-label':L('实时工作概览','Work overview')},
        h('section',{className:'dsc-of-panel'},h('h3',null,L('运营概览','Operations')),
          h('p',{className:'dsc-of-empty'},(failed||stateError)?L('员工任务状态暂不可验证。','Employee work could not be verified.'):L('根据当前公司记录，不含演示数字。','From current company records.')),
          h('div',{className:'dsc-of-metrics'},[
            [current.length,L('在册员工','Employees')],[data&&!stateError?current.filter(working).length:'—',L('工作中','Working')],
            [data&&!stateError?current.filter(waiting).length:'—',L('有任务待开始','With waiting work')],
            [items?items.filter(p=>p.status==='running').length:'—',L('运行方案','Active plans')],
          ].map(([n,label])=>h('div',{key:label},h('strong',null,n),h('span',null,label))))),
        selected?h('section',{className:'dsc-of-panel','aria-label':L('员工工位详情','Employee desk details')},
          h('h3',null,selected.name),h('p',{className:'dsc-of-empty'},displayRole(selected)+' · '+personStatus(selected)),
          (workFor(selected)?.active||[]).length?renderList(workFor(selected).active):null,
          workFor(selected)?.last?h('div',null,h('h4',null,L('最近结果状态','Latest result status')),renderList([workFor(selected).last])):null,
          onOpenEmployee?h('button',{type:'button',className:'dsc-of-profile',onClick:()=>onOpenEmployee(selected)},L('员工详情','Employee profile')):null):null,
        h('section',{className:'dsc-of-panel'},h('h3',null,L('目标进度','Objectives')),
          goals.length?h('ul',{className:'dsc-of-goals'},goals.map(plan=>{
            const progress=progressOf(plan);
            const name=(plan.outcome||plan.brief||L('未命名目标','Untitled')).slice(0,110);
            return h('li',{key:plan.id},h('strong',null,name),h('small',null,planLabel(plan.status),progress?' · '+L(`已结束 ${progress.settled}/${progress.total} 步`,`${progress.settled}/${progress.total} steps settled`):null),
              progress?h('progress',{value:progress.settled,max:progress.total,'aria-label':name}):null);
          })):h('p',{className:'dsc-of-empty'},items?L('还没有目标记录。','No objectives yet.'):L('目标数据暂不可用。','Objectives are unavailable.'))),
        h('section',{className:'dsc-of-panel'},h('h3',null,L('近期任务动态','Recent activity')),
          activity.length?h('ul',{className:'dsc-of-list'},activity.map(({employee,record},i)=>h('li',{key:i},h('strong',null,employee.name+' · '+(record.title||L('未命名任务','Untitled task'))),h('small',null,[statusLabel(record.status),timeLabel(record.at)].filter(Boolean).join(' · '))))):
            h('p',{className:'dsc-of-empty'},data?L('暂无可展示的任务记录。','No activity records to show.'):failed?L('工作状态暂不可用。','Work status is unavailable.'):L('等待工作状态数据。','Waiting for work status.'))))));
}

    function assignmentLabel(employee, roster, english) {
      const departments={director:['总经理办公室','Director’s office'],product:['产品部','Product'],techlead:['研发部','Engineering'],engineer:['研发部','Engineering'],analyst:['数据分析部','Data & analysis'],qa:['质量与审核部','Quality & review'],reviewer:['质量与审核部','Quality & review']};
      const roles={director:'Project director',product:'Product manager',techlead:'Technical director',engineer:'Engineer',analyst:'Data analyst',qa:'QA engineer',reviewer:'Independent reviewer'};
      const dept=departments[employee.role]||['共享办公区','Shared office'];
      const duplicate=roster.filter(person=>person.name===employee.name).length>1;
      return [employee.name,dept[english?1:0],english?(roles[employee.role]||employee.role):(employee.title||employee.roleName||employee.role),
        ...(duplicate?[employee.id]:[])].filter(Boolean).join(' · ');
    }
    function CompanyPanel({ t: translate }) {
      const [state, setState] = useState(null);
      const [error, setError] = useState('');
      const [tab, setTab] = useState('office');
      const [focusIntake, setFocusIntake] = useState(false);
      const workspaceBody = useRef(null);
      const [editing, setEditing] = useState(null);
      const [detail, setDetail] = useState(null);
      const [title, setTitle] = useState('');
      const [brief, setBrief] = useState('');
      const [picked, setPicked] = useState(() => new Set());
      const [assignee, setAssignee] = useState('');
      const [busy, setBusy] = useState(false);
      const [toast, setToast] = useState('');
      const [models, setModels] = useState(EMPTY);
      const [modelsLoading, setModelsLoading] = useState(false);
      const [sponsorOpen, setSponsorOpen] = useState(false);
      const [workflowDraft, setWorkflowDraft] = useState(null);
      const [initialGroupId, setInitialGroupId] = useState('');

      const t = useDict(translate);

      const refresh = useCallback(async () => {
        try {
          setState(await call('state'));
          setError('');
        } catch (caught) {
          setError(caught && caught.message ? caught.message : String(caught));
        }
      }, []);

      const loadModels = useCallback(async (force) => {
        setModelsLoading(true);
        try {
          const catalog = await call('models', { force: force === true });
          setModels(Array.isArray(catalog.models) ? catalog.models : EMPTY);
        } catch {
          setModels(EMPTY);
        } finally {
          setModelsLoading(false);
        }
      }, []);

      useEffect(() => {
        let alive = true;
        const tick = () => {
          if (alive) refresh();
        };
        tick();
        const timer = setInterval(tick, 2500);
        return () => {
          alive = false;
          clearInterval(timer);
        };
      }, [refresh]);

      useEffect(() => {
        loadModels(false);
      }, [loadModels]);

      useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(''), 3200);
        return () => clearTimeout(timer);
      }, [toast]);

      const links = state && state.links ? state.links : { repo: '', sponsorImage: '', sponsorText: '', version: '' };
      const employees = state ? state.employees : EMPTY;
      const missions = state ? state.missions : EMPTY;
      const templates = state ? state.templates : EMPTY;
      const tools = state ? state.tools : EMPTY;
      const workflows = state ? (Array.isArray(state.workflows) ? state.workflows : EMPTY) : EMPTY;

      const fixedWorkflows = workflows.filter(item => item.kind !== 'company-run');

      const stats = useMemo(() => {
        const running = (state?.companyPlans || []).filter(plan => plan.status === 'running').length;
        const done = (state?.companyPlans || []).filter(plan => plan.status === 'completed').length;
        return { employees: employees.length, running, done };
      }, [employees, state?.companyPlans]);

      const togglePick = (id) =>
        setPicked((current) => {
          const next = new Set(current);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });

      const dispatch = async () => {
        if (!title.trim()) {
          setToast(t('noTitle'));
          return;
        }
        const ids = [...picked].filter((id) => employees.some((employee) => employee.id === id));
        if (ids.length === 0) {
          setToast(t('noAssignee'));
          return;
        }
        setBusy(true);
        try {
          await call('dispatch', {
            title: title.trim(),
            brief,
            employeeIds: ids,
            assignee: assignee.trim(),
          });
          setTitle('');
          setBrief('');
          setPicked(new Set());
          setAssignee('');
          setTab('missions');
          await refresh();
        } catch (caught) {
          setToast(caught && caught.message ? caught.message : String(caught));
        } finally {
          setBusy(false);
        }
      };

      const saveEmployee = async (draft) => {
        try {
          await call('hire', draft);
          setEditing(null);
          await refresh();
        } catch (caught) {
          setToast(caught && caught.message ? caught.message : String(caught));
        }
      };

      const fireEmployee = async (employee) => {
        try {
          await call('fire', { id: employee.id });
          await refresh();
        } catch (caught) {
          setToast(caught && caught.message ? caught.message : String(caught));
        }
      };

      const removeMission = async (mission) => {
        try {
          await call('remove', { id: mission.id });
          await refresh();
          setToast(t('removed'));
        } catch (caught) {
          setToast(caught && caught.message ? caught.message : String(caught));
          throw caught;
        }
      };

      const newWorkflow = () => {
        const stamp = Date.now().toString(36);
        const rand = Math.random().toString(36).slice(2, 7);
        setWorkflowDraft({
          id: '',
          name: '',
          description: '',
          nodes: [{ id: `n${stamp}${rand}`, type: 'start', x: 140, y: 120, title: '' }],
          edges: [],
        });
      };

      const openWorkflow = (workflow) => {
        if (workflow.kind === 'company-run') return;
        setWorkflowDraft({
          id: String(workflow.id || ''),
          name: String(workflow.name || ''),
          description: String(workflow.description || ''),
          nodes: wfNodes(workflow).map((node) => ({ ...node })),
          edges: wfEdges(workflow).map((edge) => ({ ...edge })),
        });
      };

      const patchWorkflow = (changes) => {
        setWorkflowDraft((current) => (current ? { ...current, ...changes } : current));
      };

      const saveWorkflow = async (draft) => {
        const problem = validateWorkflow(draft, employees);
        if (problem) {
          setToast(t(problem));
          return;
        }
        try {
          const saved = await call('workflow-save', {
            workflow: {
              id: String(draft.id || ''),
              name: String(draft.name || '').trim(),
              description: String(draft.description || ''),
              nodes: wfNodes(draft),
              edges: wfEdges(draft),
            },
          });
          await refresh();
          setToast(t('workflowSaved'));
          if (saved && saved.id) {
            setWorkflowDraft((current) =>
              current
                ? {
                    ...current,
                    id: String(saved.id),
                    name: String(saved.name || current.name),
                    description: String(saved.description || current.description),
                    nodes: wfNodes(saved).length ? wfNodes(saved) : current.nodes,
                    edges: wfEdges(saved).length ? wfEdges(saved) : current.edges,
                  }
                : current,
            );
          }
        } catch (caught) {
          setToast(caught && caught.message ? caught.message : String(caught));
        }
      };

      const removeWorkflow = async (workflow) => {
        try {
          await call('workflow-remove', { id: workflow.id });
          await refresh();
          setToast(t('removed'));
        } catch (caught) {
          setToast(caught && caught.message ? caught.message : String(caught));
          throw caught;
        }
      };

      const runWorkflow = async (id, input) => {
        if (workflows.find(item => item.id === id)?.kind === 'company-run') return;
        try {
          await call('workflow-run', { id, input });
          await refresh();
          setToast(t('workflowRunStarted'));
        } catch (caught) {
          setToast(caught && caught.message ? caught.message : String(caught));
          throw caught;
        }
      };

      const blankEmployee = () => {
        const template = templates[0];
        return {
          id: '',
          name: '',
          role: template ? template.id : 'engineer',
          title: template ? template.title : '',
          persona: template ? template.persona : '',
          skills: template ? template.skills.filter((name) => tools.some((tool) => tool.name === name)) : [],
          provider: '',
          model: '',
        };
      };

      if (error && !state) {
        return h(
          'div',
          { className: 'dsc-root', translate: 'no' },
          h('style', null, CSS),
          h(
            'div',
            { className: 'dsc-body' },
            h('div', { className: 'dsc-empty' }, `${t('loadFailed')}: ${error}`),
            h('div', { style: { textAlign: 'center' } }, h('button', { className: 'dsc-btn', onClick: refresh }, t('retry'))),
          ),
        );
      }

      const en = t('companyMode') === DICT.en.companyMode;
      const L = (zh, english) => en ? english : zh;
      const pages = [
        ['office', '⌂', L('办公室','Office'), L('团队工位、工作现场和最近活动。','Team desks, current work, and recent activity.'), '#baadff'],
        ['company', '◇', L('目标与方案','Objectives & plans'), L('先拆解和验收，再批准执行。','Define acceptance criteria and approve a plan before execution.'), '#97b9ff'],
        ['roster', '♙', t('tabRoster'), L('查看员工、岗位、模型和工具权限。','Inspect employees, roles, models, and tool access.'), '#90d8c7'],
        ...(state?.groupsAvailable ? [['groups','◫',t('groupMode'),L('选择员工，在独立群聊中讨论任务。','Select employees to discuss work in a group chat.'),'#c19cf5']] : []),
        ['workflow','↳',t('tabWorkflow'),L('管理固定流程、依赖关系与运行记录。','Manage fixed workflows, dependencies, and run history.'),'#8cccf2'],
        ['missions','▤',t('companyLegacy'),L('查看旧任务及竞标结果。','View legacy missions and bids.'),'#efbf83'],
        ['quant','⌁',t('quantTab'),L('只读查看事件、遥测与负责人。','Read events, telemetry, and owner assignments.'),'#98dcff'],
        ['architecture','⊞',t('tabArchitecture'),L('了解公司、员工和工作流之间的关系。','Explore how the company, employees, and workflows fit together.'),'#a9b4cf'],
      ];
      const page = pages.find(p=>p[0]===tab) || pages[0];
      const shownTab = page[0];
      const openWorkspace = (route, intake = false) => {
        if (!pages.some(p=>p[0]===route)) return;
        setFocusIntake(intake);
        setInitialGroupId('');
        if (route==='workflow' && tab!=='workflow') setWorkflowDraft(null);
        setTab(route);
      };
      const startObjective = () => {
        if (shownTab==='company') {
          const input=workspaceBody.current?.querySelector('#dsc-company-brief');
          if(input){input.scrollIntoView({block:'nearest'}); input.focus(); return;}
        }
        openWorkspace('company', true);
      };
      const navRow = ([id,icon,label,,accent]) => h('button', {
        type:'button', key:id, className:'dsc-tab dsc-work-link', 'data-on':shownTab===id?'1':'0', 'data-route':id,
        'aria-current':shownTab===id?'page':undefined, onClick:()=>openWorkspace(id), style:{'--dsc-route':accent},
      }, h('span',{className:'dsc-work-icon','aria-hidden':true},icon), h('span',null,label));

      return h(
        'div',
        { className: 'dsc-root dsc-workspace', 'data-page':shownTab, translate: 'no' },
        h('style', null, CSS),
        h('header',{className:'dsc-head dsc-work-head'},
          h('span',{className:'dsc-work-brand','aria-hidden':true},'▦'),
          h('div',{className:'dsc-work-title'},h('div',{className:'dsc-name'},state ? state.companyName : t('loading')),
            h('div',{className:'dsc-sub'},links.version ? `${t('subtitle')} · v${links.version}` : t('subtitle'))),
          h('div',{className:'dsc-spacer'}),
          h('div',{className:'dsc-stats'},
            h('div',{className:'dsc-stat'},h('b',null,state&&!error?String(stats.employees):'—'),h('span',null,t('employees'))),
            h('div',{className:'dsc-stat'},h('b',null,state&&!error&&Array.isArray(state.companyPlans)?String(stats.running):'—'),h('span',null,t('roomPlanCount'))),
            h('div',{className:'dsc-stat'},h('b',null,state&&!error&&Array.isArray(state.companyPlans)?String(stats.done):'—'),h('span',null,t('roomDoneCount')))),
          h('button',{type:'button',className:'dsc-btn dsc-work-dispatch','data-kind':'primary',onClick:startObjective},L('+ 新建目标','+ New objective'))),
        h('nav',{className:'dsc-work-nav','aria-label':L('公司工作区','Company workspace')},
          h('p',{className:'dsc-work-nav-caption'},L('工作区','Workspace')),
          h('div',{className:'dsc-work-links'},pages.map(navRow)),
          h('footer',{className:'dsc-work-nav-footer'},
            links.repo?h('a',{className:'dsc-btn dsc-star',href:links.repo,target:'_blank',rel:'noreferrer',title:t('starHint')},'★ ',t('star')):null,
            links.sponsorImage||links.sponsorText?h('button',{type:'button',className:'dsc-btn','data-kind':'ghost',onClick:()=>setSponsorOpen(true)},t('sponsor')):null)),
        h(
          'div',
          { className: shownTab === 'workflow' ? 'dsc-body dsc-body-workflow' : 'dsc-body', role:'region', ref:workspaceBody, key:shownTab, 'aria-label':page[2], style:{'--dsc-page-accent':page[4]} },
          error && state?h('div',{className:'dsc-work-stale',role:'status'},L('同步暂不可用。显示最近快照，状态可能滞后。','Sync is unavailable. Showing the last snapshot; statuses may be stale.')):null,
          shownTab!=='office'?h('div',{className:'dsc-work-pagehead'},h('div',null,h('span',{className:'dsc-work-nav-caption'},L('公司工作台','Company workbench')),h('h2',null,page[2]),h('p',null,page[3]))):null,
          shownTab === 'office'
            ? h(OfficeView,{employees,plans:state?.companyPlans,missions,workflows,t,stateError:error,groupsAvailable:state?.groupsAvailable,companyName:state?.companyName,
                onOpenCompany:startObjective,onOpenEmployee:setDetail,onNavigate:openWorkspace})
            : shownTab === 'quant'
            ? h(QuantWorkspace,{t})
            : shownTab === 'company'
            ? h(CompanyWorkspace, {plans:state?.companyPlans, workflows, employees, t, refresh, focusIntake, onOpenFixed:()=>{setWorkflowDraft(null);openWorkspace('workflow');}, onOpenGroups:state?.groupsAvailable ? ()=>openWorkspace('groups') : null})
            : shownTab === 'groups'
            ? h(GroupWorkspace, {employees,t,initialGroupId})
            : shownTab === 'architecture'
            ? h(ArchitectureView, { employees, missions, workflows, t, onNavigate: route=>openWorkspace(route) })
            : shownTab === 'roster'
            ? h(
                'div',
                null,
                h(
                  'div',
                  { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: 10 } },
                  h(
                    'button',
                    { className: 'dsc-btn', 'data-kind': 'primary', onClick: () => setEditing(blankEmployee()) },
                    t('hire'),
                  ),
                ),
                employees.length === 0
                  ? h('div', { className: 'dsc-empty' }, t('loading'))
                  : h(
                      'div',
                      { className: 'dsc-grid' },
                      employees.map((employee) =>
                        h(
                          'div',
                          { className: 'dsc-card', key: employee.id, onClick: () => setDetail(employee) },
                          h(
                            'div',
                            { className: 'dsc-card-top' },
                            h(
                              'div',
                              { className: 'dsc-avatar', style: { background: employee.accent } },
                              initial(employee.name),
                            ),
                            h(
                              'div',
                              { style: { minWidth: 0 } },
                              h('div', { className: 'dsc-card-name' }, employee.name),
                              h('div', { className: 'dsc-card-title' }, employee.title || employee.roleName),
                            ),
                          ),
                          h(
                            'div',
                            { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary, rgba(128,128,128,.9))' } },
                            h(Dot, { state: employee.status === 'running' ? 'running' : 'idle' }),
                            employee.status === 'running' ? t('statusRunning') : t('statusIdle'),
                            ' · ',
                            employee.skills.length,
                            ' ',
                            t('skillCount'),
                            employee.model ? ` · ${employee.model}` : '',
                          ),
                          typeof employee.activity === 'string' && employee.activity
                            ? h(
                                'div',
                                { className: 'dsc-card-sub' },
                                h(Dot, { state: employee.status === 'running' ? 'running' : 'idle' }),
                                employee.activity,
                              )
                            : null,
                          Number.isFinite(Number(employee.memoryEntries)) && Number(employee.memoryEntries) > 0
                            ? h(
                                'div',
                                { className: 'dsc-card-sub' },
                                `${Number(employee.memoryEntries)} ${t('memoryEntries')}`,
                              )
                            : null,
                          h(
                            'div',
                            { className: 'dsc-chips' },
                            employee.skills
                              .slice(0, 6)
                              .map((skill) => h('span', { className: 'dsc-chip', key: skill }, skill)),
                            employee.skills.length > 6
                              ? h('span', { className: 'dsc-chip' }, `+${employee.skills.length - 6}`)
                              : null,
                          ),
                          h(
                            'div',
                            { className: 'dsc-card-actions' },
                            h(
                              'button',
                              {
                                className: 'dsc-btn',
                                onClick: (event) => {
                                  event.stopPropagation();
                                  setEditing({ ...employee });
                                },
                              },
                              t('edit'),
                            ),
                            h(
                              'button',
                              {
                                className: 'dsc-btn',
                                'data-kind': 'ghost',
                                onClick: (event) => {
                                  event.stopPropagation();
                                  fireEmployee(employee);
                                },
                              },
                              t('fire'),
                            ),
                          ),
                        ),
                      ),
                    ),
              )
            : shownTab === 'workflow'
              ? workflowDraft
                ? h(WorkflowEditor, {
                    draft: workflowDraft,
                    employees,
                    lastRun: (workflows.find((item) => item && item.id === workflowDraft.id) || {}).lastRun || null,
                    t,
                    onPatch: patchWorkflow,
                    onBack: () => setWorkflowDraft(null),
                    onSave: saveWorkflow,
                    onRun: runWorkflow,
                    onToast: setToast,
                  })
                : h(
                    'div',
                    { className: 'dsc-wf-list' },
                    h(
                      'div',
                      { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: 10 } },
                      h('button', { className: 'dsc-btn', 'data-kind': 'primary', onClick: newWorkflow }, t('workflowNew')),
                    ),
                    fixedWorkflows.length === 0
                      ? h('div', { className: 'dsc-empty' }, t('workflowEmpty'))
                      : h(
                          'div',
                          { className: 'dsc-list' },
                          fixedWorkflows.map((workflow) =>
                            h(WorkflowCard, {
                              key: workflow.id,
                              workflow,
                              t,
                              onRun: runWorkflow,
                              onEdit: openWorkflow,
                              onRemove: removeWorkflow,
                            }),
                          ),
                        ),
                  )
              : h(
                'div',
                { className: 'dsc-missions' },
                h(
                  'div',
                  { className: 'dsc-panel' },
                  h('div', { className: 'dsc-modal-title' }, t('dispatch')),
                  h(
                    'div',
                    null,
                    h('div', { className: 'dsc-label' }, t('missionTitle')),
                    h('input', {
                      className: 'dsc-input',
                      value: title,
                      placeholder: t('missionTitlePh'),
                      onChange: (event) => setTitle(event.target.value),
                    }),
                  ),
                  h(
                    'div',
                    null,
                    h('div', { className: 'dsc-label' }, t('missionBrief')),
                    h('textarea', {
                      className: 'dsc-area',
                      value: brief,
                      placeholder: t('missionBriefPh'),
                      onChange: (event) => setBrief(event.target.value),
                    }),
                  ),
                  h(
                    'div',
                    null,
                    h(
                      'div',
                      { className: 'dsc-label', style: { display: 'flex', alignItems: 'center', gap: 8 } },
                      t('assignees'),
                      h('span', { style: { flex: 1 } }),
                      h(
                        'button',
                        {
                          className: 'dsc-btn',
                          'data-kind': 'ghost',
                          onClick: () => setPicked(new Set(employees.map((employee) => employee.id))),
                        },
                        t('selectAll'),
                      ),
                      h(
                        'button',
                        { className: 'dsc-btn', 'data-kind': 'ghost', onClick: () => setPicked(new Set()) },
                        t('clearAll'),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'dsc-pick' },
                      employees.map((employee) =>
                        h(
                          'button',
                          {
                            key: employee.id,
                            className: 'dsc-pickbtn',
                            'data-on': picked.has(employee.id) ? '1' : '0',
                            'data-employee-id': employee.id,
                            onClick: () => togglePick(employee.id),
                          },
                          h(Dot, { state: employee.status === 'running' ? 'running' : 'idle' }),
                          assignmentLabel(employee, employees, t('tabRoster')==='Employees'),
                        ),
                      ),
                    ),
                  ),
                  h(
                    'div',
                    null,
                    h('div', { className: 'dsc-label' }, t('assigneeLabel')),
                    h(
                      'select',
                      {
                        className: 'dsc-input',
                        value: assignee,
                        onChange: (event) => setAssignee(event.target.value),
                      },
                      h('option', { value: '' }, t('assigneeNone')),
                      employees.map((employee) =>
                        h('option', { key: employee.id, value: employee.id }, assignmentLabel(employee, employees, t('tabRoster')==='Employees')),
                      ),
                    ),
                    h('div', { className: 'dsc-hint' }, t('assigneeHint')),
                  ),
                  h(
                    'button',
                    { className: 'dsc-btn', 'data-kind': 'primary', disabled: busy, onClick: dispatch },
                    busy ? t('dispatching') : t('dispatch'),
                  ),
                ),
                h(
                  'div',
                  { className: 'dsc-list' },
                  missions.length === 0
                    ? h('div', { className: 'dsc-empty' }, t('emptyMissions'))
                    : missions.map((mission) => h(MissionCard, { key: mission.id, mission, t, onRemove: removeMission })),
                ),
              ),
        ),
        editing
          ? h(EmployeeEditor, {
              employee: editing,
              templates,
              tools,
              models,
              modelsLoading,
              onReloadModels: () => loadModels(true),
              t,
              onClose: () => setEditing(null),
              onSave: saveEmployee,
            })
          : null,
        detail
          ? h(EmployeeDetail, {
              employee: detail,
              t,
              onToast: setToast,
              onOpenGroup: state?.groupsAvailable ? id => { setDetail(null); openWorkspace('groups'); setInitialGroupId(id); } : null,
              onClose: () => setDetail(null),
            })
          : null,
        sponsorOpen ? h(SponsorModal, { links, t, onClose: () => setSponsorOpen(false) }) : null,
        toast ? h('div', { className: 'dsc-toast' }, toast) : null,
      );
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh: DICT.zh, en: DICT.en }), 'dsh-company: dictionaries');
      const t = ctx.locale.bind(NS);

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          { name: 'sidebar.panellist', id: NS, order: 25, label: () => t('title'), locale: NS },
          CompanyIcon,
        ),
      );

      ctx.slots.inject('main', () =>
        ctx.slots.register({ name: 'main', key: NS, locale: NS, inject: () => ({ t }) }, CompanyPanel),
      );
    }

    return { name: 'dsh-company', inject: ['slots', 'locale'], apply };
  },
});
