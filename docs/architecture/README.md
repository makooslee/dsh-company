# Architecture supplement / 架构图补充

The Chinese and English PNG/SVG pairs describe v0.6.0 runtime boundaries. They are static documentation, not interactive/live views. The editable SVG files contain no external scripts or linked assets.

This documentation-only supplement does not move tag v0.6.0 or replace its published tarball. The four diagrams are additional GitHub Release assets, and are also in main under docs/architecture. The original v0.6.0 package remains byte-identical.

## Scope / 边界
- Employee global-tool allowlists fail closed; empty skills deny global tools. Scope-local tools follow separate host rules. This is not a complete host security audit.
- Employee turn ownership guards overlapping entry points. It is not a durable distributed task queue.
- Workflow input ≤20,000 characters, expanded node prompt ≤32,000, output ≤6,000. Excess input/output fails explicitly. These are not total conversation/token/cost caps.
- 66 automated tests and real Mac UI checks used the official local mock. No real-model quality claim is made.
- Team-event mirroring is an implemented path; the agent-team UI was not validated in the isolated profile.
- Credentials, private session URLs, user messages and payment details are not embedded in these diagrams.

中文与英文图片均为静态架构示意。运行时粒子仍由真实任务状态和匹配的图快照驱动，不能从这些静态图推断实时执行状态。源码文档和补充 Release 附件已包含四图，旧 tag 和原安装包不变。
