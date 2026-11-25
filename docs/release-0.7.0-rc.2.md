# dsh-company v0.7.0-rc.2

预发行候选版 / Release candidate. 不作为稳定版默认升级 / Not a default stable upgrade.

- 工作台：3D 办公室、可操作的 2D 平面图与员工详情；执行与待开始分别显示。
- 目标：先批准指定版本再启动，保留固定流程。可选择预设专长并行方案，不是任意自动拆解。
- 员工：按 ID 指派，防止同名误派。按员工查本地群协作，群成员身份不代表已参与。
- 独立审核：展示实际审核员，运行端确认接收才显示审核中；只在审核结果被记录时展示结论。不等于业主验收、发布批准或第三方执行结果。中断后如不能确认结果，可查看方案及运行编号人工核对；不会重发。
- 群聊是当前本地工作区的功能；不宣称多租户强隔离，不自动拉群、发送消息或发布。
- Candidate recipients should make a cold, private backup of their profile before trying an upgrade. Roll back by closing the host, restoring the pre-upgrade backup in an isolated profile, and reinstalling the exact previous package. This is not a guarantee that older versions can read candidate-created records. Historical legacy employee chat UI is not a durable transcript export.
- Three.js is bundled with its MIT license in `office/LICENSE`; the plugin's own MIT license is in `LICENSE`. No CDN is required by the office renderer.

## Pin the candidate / 指定安装版本

Once publicly listed, install this exact pre-release in a throwaway profile using
`dsh plugin --profile <isolated-profile> add dsh-company@0.7.0-rc.2`
or use a locally verified `dsh-company-0.7.0-rc.2.tgz`.
Do not use an unpinned stable install to test this candidate.

## Existing history / 既有历史

In an isolated Mac test using the canonical registry v0.6.0 package, a fixed
workflow shown as complete while running the old host reopened as interrupted on
the old version itself; all node results remained intact. The candidate preserves
those persisted results and does not infer a successful overall status for an
uncertain old run. This is not a guarantee that every old live session or record
has durable history. Close the host and keep a backup before switching versions.

在 Mac 隔离测试中，发行版 v0.6.0 的旧工作流曾在运行时显示完成，但重启同一旧版
后显示中断，节点与输出仍完整。候选版保留已存储的结果，不将状态不明的旧运行
推断为成功。不能保证旧版的实时会话或记录全部已落盘，切换版本前应关闭宿主并备份。
