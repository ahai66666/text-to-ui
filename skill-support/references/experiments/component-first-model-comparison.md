# Text-to-UI 组件优先复用模型复现实验

本文件是实验协议与当前状态，不是模型测试通过证明。模型组为 DeepSeek V4 Flash 和新增的 GLM V5.1。模型名称不等于已验证可调用：具体模型 ID、代码代理程序、命令和生成目录仍待确认；取得入口前不得声称模型实验已完成。Pixso 映射不参与本实验。

## 模型组

| 模型 | 纳入状态 | 执行约束 |
| --- | --- | --- |
| DeepSeek V4 Flash | 原有复现模型 | 记录提供方返回的精确模型 ID / 版本；不得用近似型号替代 |
| GLM V5.1 | 本次新增 | 记录提供方返回的精确模型 ID / 版本；先确认代码代理可调用，无法调用时记为未验证，不以其他 GLM 型号代跑 |

两组分别建立独立实验记录、上下文和输出目录，不共享前一轮模型输出。尽量使用同一代码代理、相同工具权限和相同提示；若两模型必须使用不同代理或环境，完整记录差异，并将跨模型差异标为不可单独归因于模型。

## 固定条件

- 对照组：保留旧规则版 Skill 和旧组件包快照；实验组：当前经校验的离线包。每个模型分别比较两组，并记录 Skill/registry/组件包 SHA256、提供方精确模型 ID、代理程序版本、系统、启动参数和运行时间。旧包只可用于基线观察，不能用于交付。
- 对每个模型、每个包版本，从独立空目录启动代理，保持相同提示、同一目标系统与相同可用工具，不把前一次输出作为上下文。4 个正向场景 × HTML/React/Vue × 每格 3 次 = 每个模型、每个包版本 36 个主生成样本；旧版与新版合计每模型 72 个，两模型共 144 个。负向实验以及 extend / new-shared 的阻断后修复重试另行计数并报告。某一轮失败或未完成不得从分母剔除。
- 所有正向实验必须留下 `component-selection.json`、`component-usage.json`、生成的可编辑源码、构建产物、浏览器抓取的 `runtime-evidence.json` 和验证日志。模型口头声称、同名 CSS/`data-*` 或截图相似都不算复用。

| ID | 固定任务提示的要点 | 预期选择与可验证结果 |
| --- | --- | --- |
| reuse | 三栏工作台含“保存”Button 和范围 Search，声明状态与点击/输入行为 | Button、Search 为 `reuse`；对应框架包实际导入、调用、运行；状态和交互可用 |
| extend | 项目 Table 显示业务列和行，外加尚不支持的排序能力 | 初次为 `extend-existing` 并阻断；扩展原 Table 契约及 HTML/React/Vue 实现后重新选择为 `reuse`，不得另画 Table |
| new-shared | 需要组件库中确实不存在的通用控件（实验前查询并锁定缺口） | 初次为 `new-shared` 并阻断；在可写源副本建立共享契约和三框架实现，再由页面引用；不预设某个现有控件不存在 |
| composite | 业务专属任务分组，由已有 Button、Search 等控件组成 | 分组为 `page-composite`，内部已有控件仍各自为 `reuse` |
| negative | 歧义名字、缺失组件包、只手绘同名组件、伪造运行标记 | 分别阻断或复用校验失败；不能报告为通过 |

每次正向实验先运行 `resolve-component-selection.mjs` 并检查决策；待扩展和新建情形先在 `fork-source` 副本修改共享源码、`refresh-index`，再生成。正式页面用 `generate-compliant-page.mjs`；之后运行 `validate-web-component-reuse.mjs`、构建、HTTP 预览、浏览器交互和 `validate-runtime-component-reuse.mjs`。Fast Preview 还须运行 `verify-fast-preview.mjs`。这些工具分别验证来源、源码和运行，单个检查通过不算整体通过。

## 跨机器离线验收

只对 Windows x64 做跨机器离线验收：使用全新压缩包和全新解压目录，断网运行 `doctor`、`new-project`、三框架生成、构建、HTTP 预览与浏览器断言；项目路径包含中文和空格，PATH 不含全局 Node/npm/pnpm。当前 `tools/test-offline-bundle.mjs` 自动执行解压后依赖/构建/浏览器烟测；独立模型生成仍需代理入口。记录 Windows x64 压缩包 SHA256、测试日志和浏览器证据。macOS 上的临时打包烟测不等同于 Windows 离线包验收。

## 当前状态（2026-10-12）

| 检查项 | 状态 |
| --- | --- |
| 选择凭证和待扩展/缺包阻断、三框架严格源码/运行校验、Table 业务数据 props | 自动化测试通过 |
| Windows x64 包在干净 Windows 机器离线运行、三框架构建和浏览器烟测 | Windows CI 已配置；尚未运行，未验证 |
| DeepSeek V4 Flash 与 GLM V5.1：旧版 / 新版各 36 个主生成样本及负向实验 | 两模型的精确提供方 ID、代理程序入口和生成目录未提供；未运行、未验证 |
| 全库组件正式就绪 | 不在本实验中改变；仍以现有 readiness gate 为准 |
