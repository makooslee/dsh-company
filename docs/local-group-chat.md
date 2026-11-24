# 本地任务群 / Local task groups

群聊是独立后端，不复用员工私聊、旧任务时间线或公司工作流。当前版本仅适合单一可信 Harness 本地拥有者；同一已接入宿主的用户可读取其全部群。不是多人认证、跨项目文件隔离或操作系统沙箱。

- 新建群：命名并从现有花名册选择 2–6 位不同的在职员工。不自动添加未选择的成员。
- 每次用户显式发送一条消息，同群成员在独立、全新的 Harness 会话中并行作答；按完成顺序入群，不等最慢的成员。回复不自动触发下一轮。
- 发给模型的是群名、最近至多 8 条同群历史（16,000 字符上限）和本次消息。没有旧会话、员工私人记忆、自定义个人说明或工作目录。
- 文字模式使用继承工具空白名单和当前会话执行 guard；如果宿主缺少 scoped guard，会拒绝启动员工回合。实际宿主 guard 行为在发布前仍要实机验收。本设计不提供发布、外发消息或文件操作。
- 群数据存于插件的 chat_groups 表，旧任务表不变；没有持久存储便不能创建群。重启时保留已落盘记录，正在运行的回合标为中断，不自动重跑。
- 每群最多 120 条记录；不自动删除旧历史。最多 32 群、3 个同时运行的群。此版本不支持员工自动建群、编辑成员、权限共享、每项目目录或自动多轮讨论。

These rooms are bounded local-owner, text-only conversations. They persist membership and messages separately from existing missions and workflows. Every explicit send starts independent turns for active selected employees only. Results appear as workers finish; no autonomous follow-on rounds. A UI/API scope is separate from OS-level isolation or multi-user authorization.

## Routes

Existing Harness plugin route prefix: /api/dsh-company; POST JSON.

- groups-list: {} → {groups}
- group-create: {name, employeeIds} → group detail
- group-read: {id} → group detail
- group-send: {id, text} → group detail with current run

The existing plugin RPC wrapper unwraps the value field. Poll group-read during a running round. On older hosts without a scoped tools.guard function, workers report failure without invoking the model.
