# dsh-company

English · [简体中文](README.md)

A tiny company of employee agents for [DeepSeek Harness](https://github.com/deepseek-ai).

If it helps, a ⭐ star on the repo means a lot.

You are the CEO. Everybody below you **is a real agent session** with its own identity, its own model and its own tool whitelist. You dispatch work; **they decide whether to take it**. Whoever accepts runs in their own session, in parallel; whoever declines has to say who should take it instead. Everything lands in one team timeline — it reads like a group chat, not an assembly line.

## Why it is not a pipeline

Most multi-agent setups chain roles: product → tech lead → engineer → QA, and one stuck stage stalls everything. dsh-company uses **bidding** instead:

1. **Dispatch** — the mission is broadcast to the employees you picked, each with the same brief plus the company roster.
2. **Bid** — each replies with `【接单】` / `【不接】` on the first line and reasons below; declining requires naming a better owner.
3. **Work** — only those who accepted get a second turn, and they are told who else is working so they do not duplicate each other.

"Nobody took it" is a legitimate outcome: the mission is closed as `unclaimed` with the reasons left on the timeline, instead of being forced onto someone.

## Features

- **Seven built-in roles** — Project Director, Product Manager, Tech Lead, Engineer, Data Analyst, QA Engineer, Reviewer. Every persona, title, skill set and model is editable; hire your own too.
- **Bidding-based collaboration** — self-assignment with an owner suggestion on decline; accepted work is mutually visible.
- **Team timeline** — bids, declines and deliverables folded into one readable stream.
- **Employee transcripts** — click anyone in the roster to read *their own session*, tool calls included.
- **Real model picker** — the dropdown is fed by the Harness model catalog, the same source DSH's own model selection uses; set per employee.
- **Skill whitelist** — tick the tools an employee may use; everything else is restricted away inside that agent's scope.
- **Two entry points** — the management page, or the `company_dispatch` tool so the CEO assistant can dispatch from chat. One implementation behind both.

## Install

Requires DeepSeek Harness (with the `plugin_manager` tool) and Node ≥ 20.

```bash
git clone <this-repo> dsh-company
```

Then, from a Harness agent:

```
use plugin_manager install_bundle with target = <absolute path>/dsh-company
```

Reload the page: an org-chart icon appears in the sidebar. If it does not, restart DSH Desktop once.

> Upgrading requires `remove_bundle` → `install_bundle`; reinstalling the same package name is rejected.

## Configuration

Override the row's `config` in the profile's `cordis.patch.yml`:

```yaml
- id: dsh-company
  config:
    companyName: Acme
    cwd: /path/to/workspace
    bidTimeoutMs: 360000
    workTimeoutMs: 1800000
```

Roster and missions persist through the storage service's `json` backend (unit `dsh_company`, per-record layout). Without storage it degrades to memory-only; nothing else changes.

## How it works

- Employees are real Agents from `ctx.agents.create()` — separate sessions, separate contexts, therefore genuinely parallel;
- Identity is injected via `systemPrompt.section()` inside `setup(agentCtx)`;
- Skills are enforced with `agentCtx.tools.restrict({ allow })`, scoped to that one agent;
- Work is delivered with `agent.followup(userMessage)` and the employee opens its own turn;
- Outputs and transcripts are derived from the session log — the log is the source of truth;
- Every registration happens inside `ctx.effect` and returns its cleanup, so unloading disposes agents and closes the storage handle.

## Sponsorship

If this plugin saved you some time, you can buy me a coffee — any amount.

<p align="center">
  <img src="docs/sponsor/wechat.png" alt="WeChat sponsor QR" width="260">
</p>

To be straight with you: I lost a lot in the markets recently and work has been rough too. I wrote this plugin through a bad stretch. It will not fix anything, but if it genuinely helped you, a small tip is real encouragement.

More than money, I would love a ⭐ star — it helps other people find it, and tells me it is actually being used.

> The QR lives at `docs/sponsor/wechat.png`; the "Sponsor" button in the panel reads the same file.

## License

[MIT](LICENSE)
