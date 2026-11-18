# Mac UI validation / 本机界面验证

## Environment and evidence

- Real installed DeepSeek Harness **0.2.2-rc.1**, isolated profile, Chrome on Mac.
- Official local deterministic HTTP/SSE mock through the shipping DeepSeek adapter. No paid model or tool invocation was used for the sample deliveries.
- Captures belong to an **v0.6.0 pre-release working tree**. The UI still displayed the prior 0.5.3 manifest during capture; release packaging updates it to 0.6.0. These images are not a promise about the published npm version or real-model output quality.
- The operator observed the pages and captured the browser directly. Images were not generated or composited.

## Page coverage / 页面覆盖

Both `docs/screenshots/zh/` and `docs/screenshots/en/` contain:

| File | Page / state |
| --- | --- |
| architecture.jpg | Architecture overview / 架构总览 |
| architecture-detail.jpg | Scrolled execution paths / 架构下方执行路径 |
| roster.jpg | Employee roster / 员工管理 |
| missions.jpg | Explicit-owner mock mission and delivery / 指定负责人任务及交付 |
| workflow-list.jpg | Workflow list / 工作流列表 |
| workflow-running.jpg | Real running state, 1/2 settled / 运行中 |
| workflow-completed.jpg | Completed state, 2/2 settled / 已完成 |
| hire.jpg | Initial add-employee form / 添加员工表单 |
| hire-actions.jpg | Scrolled form with action buttons / 招聘表单操作区 |
| employee-edit.jpg | Edit employee / 编辑员工 |
| employee-detail.jpg | Actual transcript and memory / 员工会话和记忆 |
| sponsor.jpg | Sponsor dialog / 赞赏弹窗 |

Hire, hire-actions, employee-edit and sponsor captures in both languages were refreshed after the safety and sponsor-copy changes. The other captures document the earlier UI run.

The old agent-team image remains on disk for history but is not referenced by the current READMEs or screenshot manifest. The isolated host sidebar did not expose this panel; its integration was **not** validated or re-created for this gallery.

## Observed checks

- A real UI workflow moved from running (1/2 settled) to done (2/2). Exactly one particle edge appeared during execution and none after completion.
- Switching edge animation off removed particles; switching it on restored them during the active run.
- Editing workflow identity during execution hid the mismatched run overlay and particles; restoring the matching draft restored the overlay.
- Keyboard Enter on a workflow node opened its inspector.
- A real UI mission with an explicit owner completed and produced the deterministic mock delivery plus an employee memory entry. This does not test bidding behavior.
- Language switching exposed two issues: browser automatic translation mutated plugin React text; same-key English status strings incorrectly fell back to Chinese. Fixes add `translate="no"` at the plugin root and retain nonempty locale results even when equal to their keys.
- After the safety changes, **66/66 automated Node tests passed**. Passing this suite alone is not a claim that every host or model configuration has been tested.

## Limits / 限制

- The browser's automatic translation can still alter the host shell. The plugin root now owns its bilingual rendering, but stored role names, personas, history and runtime summaries are not translated retrospectively.
- The normal 1280 × 640 browser viewport uses internal scrolling. Additional architecture and hire-action captures show lower content; a screenshot is not a claim that the entire scrollable page fits on one screen.
- Employee detail captures can show local test-directory paths and ephemeral session IDs, not credentials. Only isolated test data was used.
- Screenshots are still images: particle motion was checked separately through visible execution state and the DOM, not inferred from a still image.
- No claim of full accessibility certification, all responsive breakpoints, real-model quality, or agent-team end-to-end coverage is made.
- Do not release while safety fixes, updated captions/screenshots, or final regression checks remain pending.

## Safety regression / 安全回归

The following additional checks used the real Mac host and official local mock:

- `safety-budget` failed on the 32,000-character expanded workflow-prompt budget instead of allocating an unbounded expanded prompt.
- `safety-owner-a` completed; overlapping `safety-owner-b` failed as busy rather than taking ownership of the active employee turn.
- With empty employee skills, two captured mock-provider requests contained `tools=[]`. This verifies those observed requests, not every possible host-local tool scope.

Behavior changes: empty skills now deny global tools; failure to apply tool restrictions aborts runtime creation rather than continuing unrestricted. Workflow input is limited to 20,000 characters, the expanded node prompt to 32,000 characters, and node output to 6,000 characters. Exceeding a limit fails the operation rather than presenting a silently truncated output as successful. These are character limits, **not** a total conversation-context limit, token limit, or model-cost cap.

The default sponsor dialog now states in Chinese and English that support is voluntary, does not affect usage and does not include a service. The original QR code was not changed. No payment was sent and receipt/payment collection was not verified.
