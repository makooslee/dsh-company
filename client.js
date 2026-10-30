/**
 * dsh-company — Client half.
 *
 * 三个视图：
 *  1) 花名册：员工的身份证（人设）、职位、模型、技能；点人可看这名员工的完整对话记录。
 *  2) 任务板：派单后团队按「认单 → 执行」汇成一条时间线，像群聊一样读。
 *  3) 招聘/编辑：模型来自 Host 的真实模型目录（与 DSH 自己的模型选择同源）。
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
        tabRoster: '花名册',
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
      },
      en: {
        title: 'Company',
        subtitle: 'CEO console',
        star: 'Star',
        starHint: 'A star on the repo helps more than you think.',
        sponsor: 'Sponsor',
        sponsorTitle: 'Support this plugin',
        sponsorThanks: 'Thanks for reading this far.',
        tabRoster: 'Roster',
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

      const formatMemoryTime = (value) => {
        if (value === undefined || value === null || value === '') return '';
        const date = typeof value === 'number' ? new Date(value) : new Date(String(value));
        if (Number.isNaN(date.getTime())) return String(value);
        const pad = (part) => String(part).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
        ),
        h(
          'div',
          { className: 'dsc-body' },
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
