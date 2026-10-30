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
        title: '公司',
        subtitle: 'CEO 工作台',
        star: 'Star',
        starHint: '给项目点个 Star，比什么都管用。',
        sponsor: '赞赏',
        sponsorTitle: '赞赏支持',
        sponsorThanks: '谢谢你看完这一段。',
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
        skillsHint: '勾选这名员工可以使用的工具；不勾就是全部可用。',
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
        title: 'Company',
        subtitle: 'CEO console',
        star: 'Star',
        starHint: 'A star on the repo helps more than you think.',
        sponsor: 'Sponsor',
        sponsorTitle: 'Support this plugin',
        sponsorThanks: 'Thanks for reading this far.',
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
        skillsHint: 'Tick the tools this employee may use; none ticked means all tools.',
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
        const tag = String((typeof navigator !== 'undefined' && navigator.language) || 'zh').toLowerCase();
        return tag.startsWith('zh') ? DICT.zh : DICT.en;
      }, []);
      return useCallback(
        (key) => {
          if (typeof translate === 'function') {
            const value = translate(key);
            if (value && value !== key) return value;
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

    function EmployeeDetail({ employee, onClose, onToast, t }) {
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
          links.sponsorImage
            ? h('img', { className: 'dsc-qr', src: links.sponsorImage, alt: 'WeChat sponsor QR', loading: 'lazy' })
            : null,
          links.sponsorText ? h('div', { className: 'dsc-sponsor-text' }, links.sponsorText) : null,
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
    const WF_NODE_H = 68;
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

    function WorkflowCard({ workflow, t, onEdit, onRemove }) {
      const [confirming, setConfirming] = useState(false);
      const [busy, setBusy] = useState(false);
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

    function WorkflowEditor({ draft, employees, lastRun, t, onPatch, onBack, onSave, onRun, onToast }) {
      const [selectedNodeId, setSelectedNodeId] = useState('');
      const [selectedEdgeId, setSelectedEdgeId] = useState('');
      const [runInput, setRunInput] = useState('');
      const [confirmNodeId, setConfirmNodeId] = useState('');
      const [linking, setLinking] = useState(null);
      const [busy, setBusy] = useState(false);
      const stageRef = useRef(null);
      const dragRef = useRef(null);

      const nodes = wfNodes(draft);
      const edges = wfEdges(draft);
      const selectedNode = wfNodeById(nodes, selectedNodeId);
      const runState = lastRun && lastRun.status ? lastRun.status : '';

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
        if (!run || !run.status) return '';
        return run.status;
      };

      const nodeCard = (node) => {
        const employee = node.type === 'employee' ? wfEmployeeById(employees, node.employeeId) : null;
        const nodeRun = nodeRuns.get(node.id);
        const status = nodeRun && nodeRun.status ? nodeRun.status : '';
        const title =
          String((node && node.title) || '') ||
          (node.type === 'start' ? t('workflowNodeStart') : employee ? employee.name : t('workflowSelectEmployee'));
        return h(
          'div',
          {
            key: node.id,
            className: 'dsc-wf-node',
            'data-node-id': node.id,
            'data-sel': selectedNodeId === node.id ? '1' : '0',
            style: { left: `${Number(node.x) || 0}px`, top: `${Number(node.y) || 0}px` },
            onClick: (event) => {
              event.stopPropagation();
              setSelectedNodeId(node.id);
              setSelectedEdgeId('');
            },
          },
          status
            ? h(
                'span',
                { className: 'dsc-wf-node-status' },
                h('span', { className: 'dsc-badge', 'data-s': status }, t(status) || status),
              )
            : null,
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

      const nodeRun = selectedNode ? nodeRuns.get(selectedNode.id) : null;

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
        h('div', { className: 'dsc-wf-canvas-wrap' }, canvas, inspector),
      );
    }

    function CompanyPanel({ t: translate }) {
      const [state, setState] = useState(null);
      const [error, setError] = useState('');
      const [tab, setTab] = useState('roster');
      const [editing, setEditing] = useState(null);
      const [detail, setDetail] = useState(null);
      const [title, setTitle] = useState('');
      const [brief, setBrief] = useState('');
      const [picked, setPicked] = useState(() => new Set());
      const [busy, setBusy] = useState(false);
      const [toast, setToast] = useState('');
      const [models, setModels] = useState(EMPTY);
      const [modelsLoading, setModelsLoading] = useState(false);
      const [sponsorOpen, setSponsorOpen] = useState(false);
      const [workflowDraft, setWorkflowDraft] = useState(null);

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

      const stats = useMemo(() => {
        const running = missions.filter((mission) => mission.status === 'bidding' || mission.status === 'working').length;
        const done = missions.filter((mission) => mission.status === 'done').length;
        return { employees: employees.length, running, done };
      }, [employees, missions]);

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
          await call('dispatch', { title: title.trim(), brief, employeeIds: ids });
          setTitle('');
          setBrief('');
          setPicked(new Set());
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
        try {
          await call('workflow-run', { id, input });
          await refresh();
          setToast(t('workflowRunStarted'));
        } catch (caught) {
          setToast(caught && caught.message ? caught.message : String(caught));
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
          { className: 'dsc-root' },
          h('style', null, CSS),
          h(
            'div',
            { className: 'dsc-body' },
            h('div', { className: 'dsc-empty' }, `${t('loadFailed')}: ${error}`),
            h('div', { style: { textAlign: 'center' } }, h('button', { className: 'dsc-btn', onClick: refresh }, t('retry'))),
          ),
        );
      }

      return h(
        'div',
        { className: 'dsc-root' },
        h('style', null, CSS),
        h(
          'div',
          { className: 'dsc-head' },
          h(
            'div',
            null,
            h('div', { className: 'dsc-name' }, state ? state.companyName : t('loading')),
            h(
              'div',
              { className: 'dsc-sub' },
              links.version ? `${t('subtitle')} · v${links.version}` : t('subtitle'),
            ),
          ),
          h('div', { className: 'dsc-spacer' }),
          h(
            'div',
            { className: 'dsc-stats' },
            h('div', { className: 'dsc-stat' }, h('b', null, String(stats.employees)), h('span', null, t('employees'))),
            h('div', { className: 'dsc-stat' }, h('b', null, String(stats.running)), h('span', null, t('runningCount'))),
            h('div', { className: 'dsc-stat' }, h('b', null, String(stats.done)), h('span', null, t('doneCount'))),
          ),
          links.repo
            ? h(
                'a',
                {
                  className: 'dsc-btn dsc-star',
                  href: links.repo,
                  target: '_blank',
                  rel: 'noreferrer',
                  title: t('starHint'),
                },
                '\u2605 ',
                t('star'),
              )
            : null,
          links.sponsorImage || links.sponsorText
            ? h('button', { className: 'dsc-btn', 'data-kind': 'ghost', onClick: () => setSponsorOpen(true) }, t('sponsor'))
            : null,
        ),
        h(
          'div',
          { className: 'dsc-tabs' },
          h(
            'button',
            { className: 'dsc-tab', 'data-on': tab === 'roster' ? '1' : '0', onClick: () => setTab('roster') },
            t('tabRoster'),
          ),
          h(
            'button',
            { className: 'dsc-tab', 'data-on': tab === 'missions' ? '1' : '0', onClick: () => setTab('missions') },
            t('tabMissions'),
          ),
          h(
            'button',
            {
              className: 'dsc-tab',
              'data-on': tab === 'workflow' ? '1' : '0',
              onClick: () => {
                setTab('workflow');
                setWorkflowDraft(null);
              },
            },
            t('tabWorkflow'),
          ),
        ),
        h(
          'div',
          { className: tab === 'workflow' ? 'dsc-body dsc-body-workflow' : 'dsc-body' },
          tab === 'roster'
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
            : tab === 'workflow'
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
                    workflows.length === 0
                      ? h('div', { className: 'dsc-empty' }, t('workflowEmpty'))
                      : h(
                          'div',
                          { className: 'dsc-list' },
                          workflows.map((workflow) =>
                            h(WorkflowCard, {
                              key: workflow.id,
                              workflow,
                              t,
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
                            onClick: () => togglePick(employee.id),
                          },
                          h(Dot, { state: employee.status === 'running' ? 'running' : 'idle' }),
                          employee.name,
                        ),
                      ),
                    ),
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
