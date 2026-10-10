# text-to-ui Skill · v2.0.0

`text-to-ui v2.0.0` 是一个以 `SKILL.md` 为入口的 AI Skill：将文本产品需求转换为符合 HarmonyOS PC 客户端设计语言的可编辑 Pixso 设计稿和可交互 Demo，并让需求、Token、组件、布局和状态在全过程可追溯。Skill 通过 Monorepo 中的组件契约和真实组件包复用 HTML、React/Next、Vue 三种 Web 实现；它本身保存规则和索引，不替代生产组件源码。

## v2.0.0 更新摘要

- 分离任务路由与工作流路由，新增显式 `--task-route`；匹配歧义时列出候选项并停止猜测。
- 新增 `generate-compliant-page.mjs` 一次性页面生成入口，统一路由/上下文凭据、生成预检、页面编译和回执。
- 补齐 Secondary Page 页面续接与 Pattern 约束，并明确 Dropdown Menu 在 Pixso 中采用原生节点组合的边界。
- 更新组件、Token 和 Pixso 映射资料，合并常驻 Agent 与组件映射同步能力为 Pixso Unified Agent v2。

完整迁移说明见仓库文档 [Text-to-UI Skill v2.0.0 更新记录](https://github.com/ahai66666/text-to-ui-monorepo/blob/main/docs/releases/text-to-ui-v2.0.0.md)。

## 与完整组件仓的交付边界

`text-to-ui/` 是 Skill 的规范源，`skill/` 是由它同步生成的独立安装镜像；两者都只承载规则、索引、预览和工具，不等于生产组件库。HTML、React、Vue 真实组件、共享样式、Token、组件契约和 Pixso 映射位于同一代码仓的 `packages/` 下。

## 系统架构 / System Architecture

下面的双语框架图说明 Text-to-UI 从技能入口、设计系统契约、跨框架编译到 Pixso 导入和最终验收的完整职责边界。英文名称用于代码、目录和协作检索，中文名称用于产品与设计沟通。

```text
Text-to-UI Skill（Text-to-UI 技能编排系统）
├── Skill Entry & Task Instructions（技能入口与任务说明）
├── Workflow Router（工作流路由器）
│   ├── Existing HTML to Pixso（已有 HTML 导入 Pixso）
│   ├── New Page（新页面生成）
│   ├── Micro Revision（已确认产物的微调）
│   ├── Pixso Component Library（Pixso 组件库维护）
│   └── Converter Diagnosis（转换链路诊断）
├── Analysis, Proposal & Confirmation Gate（需求分析、方案与确认门禁）
├── Design-System Contract Layer（设计系统契约层）
│   ├── Token Contract（Token 契约）
│   ├── Component Contract（组件契约）
│   ├── Pattern Contract（页面 Pattern 契约）
│   └── Typography & Icon Rules（字排与图标规则）
├── Cross-Source Mapping Registry（跨端映射注册表）
│   ├── Token to Pixso Variable Mapping（Token 到 Pixso Variable 映射）
│   ├── Component to Native Instance Mapping（组件到原生实例映射）
│   ├── Style & Typography Mapping（样式与文字样式映射）
│   └── Component Slot Mapping（组件 Slot 映射）
├── Shared Page Specification & UI Scene（共享页面规格与 UI 场景）
├── Framework Adapters & Page Compiler（框架适配器与页面编译器）
│   ├── HTML Adapter（HTML 适配器）
│   ├── React Adapter（React 适配器）
│   └── Vue Adapter（Vue 适配器）
├── Browser Capture, Preview & Visual Manifest（浏览器采集、预览与视觉清单）
├── Pixso Import Pipeline（Pixso 页面导入管线）
│   ├── DOM Visual IR（DOM 视觉中间表示）
│   ├── Pixso Native Scene（Pixso 原生场景）
│   └── Page Import Operation Plan（页面导入执行计划）
├── Pixso Unified Agent Plugin（Pixso 统一 Agent 插件）
├── Bridge Service & Persistent-Agent Protocol（桥接服务与常驻 Agent 协议）
├── Preview Hub & Component Gallery（预览中心与组件画廊）
└── Readback, Visual QA & Audit（读回、视觉验收与审计）
    ├── Token Usage Audit（Token 使用审计）
    ├── Component Instance Audit（组件实例审计）
    ├── Variable & Style Binding Audit（变量与样式绑定审计）
    └── HTML–Pixso Visual Parity Check（HTML 与 Pixso 视觉一致性检查）
```

推荐上传/克隆完整代码仓，并从根目录运行：

```bash
pnpm install
pnpm delivery:validate
```

从仓库复制或安装 `skill/` 本身不会自动把 `packages/` 注册为组件库，也不会自动把 Skill 注册到宿主工具。独立安装 Skill 时，如果没有可发现的 Monorepo 根目录和组件包，Skill 必须明确报告“组件包不可用”，不能把旧预览、截图或视觉相似物宣称为生产组件复用。完整接入协议见 [`references/component-package-integration.md`](references/component-package-integration.md)。

更新 Skill 时只编辑 `text-to-ui/` 规范源，再将相同文件同步到 `skill/`；不要在两个目录中维护不同规则。

新页面推荐只调用一个入口：

```bash
pnpm page:generate --project <generated-project> --framework html \
  --task "<页面需求>" --blueprint <page-blueprint.json> \
  --content-recipes <page-content-recipes.json> \
  --bindings <page-bindings.json> --page-css <page-composition.css>
```

该入口会自动解析并验证路由、Context Packet、Pattern/Layout Contract、组件
适配器、Token、图标和页面组合边界；所有生成文件通过后才一次性提交，并写出
`.text-to-ui/generation-receipt.json`。普通页面不要直接调用底层
`generate-framework-page.mjs`。

当前配套 Monorepo 提供 49 个组件契约、4 个页面 Pattern，以及 HTML、React、Vue 三套真实 UI 组件实现。组件包、Tokens、共享样式、Pixso 映射和正式画廊位于 Monorepo 的 `packages/` 与 `apps/` 下；本 Skill 负责规则、索引、页面编排和导入工具，不替代生产组件源码。

当前版本提供三条可选工作流：

1. **V1 · HTML 初稿 → Pixso 细化 → 最终 Demo（首推）**：需求分析 → 方案确认 → HTML 初稿 → 浏览器检查 → Pixso 细化 → 人工确认 → 最终 Demo。
2. **V2 · 视觉优先 → 最终 Demo**：需求分析 → 方案确认 → Pixso 高保真设计 → 人工确认 → 最终 Demo。
3. **V3 · 直接生成 HTML**：需求分析 → 方案确认 → HTML 生成 → 浏览器检查。

它不是“生成一张图”或“把设计稿转成静态页面”的工具，而是一条可回溯的交付链路：先分析需求并确认方案，再用同一套 Token、组件和页面规格生成 HTML、细化 Pixso 设计稿，最后从确认后的设计规格生成可交互 Demo。

它以 HarmonyOS PC 客户端为默认场景：遵循桌面窗口、标题栏、侧边栏、分栏内容区、密度、层级、圆角、阴影、排版和状态反馈的客户端设计基线，而不是把通用响应式网页换一套颜色。适用于登录页、仪表盘、后台系统、设置页、列表/详情页、编辑器等桌面应用界面。

## 为什么用它

### 需求不会直接跳成页面

Skill 先把需求拆成产品目标、目标用户、工作对象、主任务、信息架构、关键路径、页面状态、错误/恢复行为和交付范围；将会改变信息架构、关键交互或视觉方向的问题集中澄清。其余低风险假设会被记录，而不是悄悄混进页面。

这一阶段输出可执行的**需求契约**与 `page-spec.json`：它们是 HTML、React、Vue、Pixso 和最终 Demo 共同参照的页面规格，而非只供阅读的文档。

在开始生成任何页面之前，方案确认消息会提供页面结构树，帮助确认页面之间的层级和跳转关系。页面结构确认后，才进入 HTML、Pixso 或代码生成阶段。

### 一套 Token，贯穿设计与实现

颜色、间距、尺寸、圆角、阴影、排版、图标和组件状态都从同一套设计系统出发：

| 环节 | 使用的规则 | 如何保持一致 |
| --- | --- | --- |
| HTML 初稿 | 运行时 CSS/JSON Token、语义组件和页面规格 | 生成前校验 Token 与规格；浏览器检查真实主路径。 |
| Pixso 设计稿 | 同源 Pixso Variables、文字样式、效果样式、组件实例和 Auto Layout | 导入 HTML 后把字面量绑定为变量/样式，并以组件注册表替换原子控件。 |
| 最终 Demo | 确认后的 `page-spec.json`、Pixso 当前层级和同一运行时 Token | 重新读取 Pixso 确认稿再生成，不复用可能过期的初稿结构。 |

这里的“一致”指同一个 Canonical Token Map 和同一个页面规格被全链路使用、校验并可追溯；Pixso 的原生变量命名和 CSS 的运行时语义名可以不同，但每一项都有映射关系，而不是靠人工目测复制颜色或尺寸。Canonical Token 与 Semantic Token 是两层关系；Runtime Semantic Index 由 Semantic Token 和 Runtime-only Alias 自动生成，不需要再维护一份重复的完整表。

### 跨源映射与 Obsidian 维护台

HTML Token、Pixso Variable、HTML `logicalName`、Pixso 注册组件、HarmonyOS 源组件和 Variant 的对应关系统一维护在：

```text
assets/design-system/mapping-registry.json
```

它按 `profile` 隔离“一个 HTML 源 → 一个 Pixso 设计文件 → 一套组件库”的映射方案。现有的 `token-runtime-map.json`、`dual-output-token-map.json`、组件 registry、HarmonyOS adapter map 和覆盖率表都是运行时/审计所需的投影或细节文件，不作为跨源关系的第二个编辑入口。Obsidian 使用单独的映射维护台承接人工修改，修改区经脚本校验后回写中心 registry；详细字段边界和维护流程见 [`references/mapping-registry.md`](references/mapping-registry.md)。要对接新的组件库或 Pixso 文件，新增 source、library 和 profile，不覆盖已有 profile。

修改中心 registry 后运行：

```bash
pnpm mappings:validate
pnpm mappings:sync
pnpm mappings:check
node scripts/build-mapping-registry-doc.mjs --profile html-to-pixso-harmonyos-client
```

如果用户先在 Obsidian 映射维护台填写了 `state=pending`，先运行：

```bash
pnpm mappings:obsidian:check -- --note /absolute/path/to/Text-to-UI-映射维护台.md
pnpm mappings:obsidian:apply -- --note /absolute/path/to/Text-to-UI-映射维护台.md
```

`mappings:obsidian:check` 只预览变更，`mappings:obsidian:apply` 才会写入中心
registry 并把已处理行标记为 `applied`。HTML Component ↔ Pixso Component 的核心
字段是 `profiles[].componentMappings[].pixsoTarget`；它必须是目标组件 registry
中的 exact registered name。`htmlRendererKey` 只是 HTML 实现入口，不是 Pixso 组件名。

Pixso GUID、node ID 和 file key 不进入这张关系表；执行时始终从当前目标文件重新解析。

### HTML、React、Vue 共用一套 Token 和组件契约

项目不是分别维护三套视觉副本，而是维护一套框架无关的逻辑组件契约，再由不同渲染器适配：

| 输出框架 | 组件如何接入 | Token 如何接入 | 状态与交互如何保持一致 |
| --- | --- | --- | --- |
| **静态 HTML** | 使用语义化 DOM、`data-component`、`data-state` 和注册组件逻辑名 | 消费 Canonical Web CSS Variables 与共享组件样式 | 由原生 DOM 事件和同一状态矩阵驱动 |
| **React / Next** | 使用 JSX/TSX 适配器，从 props/state 输出稳定的组件契约属性 | 继续消费 Canonical Web CSS Variables，不把解析后的颜色写进 inline style | 复用同一组件 Variant、slots、键盘和覆盖层行为 |
| **Vue** | 使用 SFC 模板和响应式状态输出相同的组件契约属性 | 继续消费 Canonical Web CSS Variables，不依赖 `data-v-*` 或 CSS Module hash 作为组件身份 | 复用同一组件 Variant、slots、键盘和覆盖层行为 |
| **Pixso** | 通过组件注册表解析精确名称并插入 linked instance | 绑定同源 Pixso Variables、Typography Styles、Effect Styles 和 Auto Layout | 将 Web 状态映射到 Variant、Component Properties 和交互连接 |

统一链路可以概括为：

```text
page-spec.json + component registry + Token runtime map
          ├── static HTML renderer
          ├── React / Next adapter
          ├── Vue adapter
          └── Pixso linked components + variables/styles
```

核心约束：

- `logicalName`、Variant、状态、slots、图标和 Pattern 角色与框架无关；HTML、React、Vue 和 Pixso 只是不同适配器。
- HTML、React 和 Vue 使用同一份 Web CSS Variables；Pixso 使用 `token-runtime-map.json` 和双端映射绑定到对应变量/样式。
- 组件画廊只维护一份逻辑组件矩阵，通过框架选择器切换真实 HTML、React、Vue 渲染器；不复制三套手写视觉样例。
- 只有当某个模块的组件、Variant、状态和交互在三种渲染器中都具备真实适配时，才显示模块级框架选择器；覆盖不完整时会缩小选择器范围或明确标记缺口。
- 发布前运行框架契约、运行时、双端 Token 和交互审计；“页面上出现一个按钮”不等于该组件已经完成跨框架支持。

### 设计稿不是终点，Demo 也不是另画一遍

Pixso 并非直接把画面“导出”为不可维护的代码。确认设计后，Skill 会重新读取目标 Pixso 文件中的页面、顶层 Frame、层级、布局、组件和状态，将有效修改同步回 `page-spec.json`，再据此生成 HTML/CSS/JavaScript、React 或 Vue Demo。这样设计师在 Pixso 中做的结构、内容或状态调整会成为所有 Web 输出的输入；原始 HTML 仅是结构初稿，不能覆盖确认后的设计。

### 面向真实桌面工具，而非静态效果图

- 默认按 HarmonyOS PC `1728 × 1152px` 桌面窗口构建，提供窗口、侧边栏、标题栏、内容区和二级页面 Pattern；布局与组件以客户端操作效率为先，不套用移动端或营销网页结构。
- 内置按钮、表单、导航、卡片、表格、弹窗、菜单、加载和状态反馈规范，并要求主流程与关键状态可操作。
- 使用语义化图标别名，审计 Lucide 图标的精确来源；用组件画廊、图标页和布局页做视觉回归。
- 最终交付是可编辑 Pixso 设计稿与可交互 Demo；Demo 可以是静态 HTML、React/Next 或 Vue，而不是截图或 inert mockup。

## 推荐输入

一句话即可开始；若要让结果可控、方便进 Pixso 细化，请按以下顺序提供信息。这个顺序就是从“为什么做”到“页面如何组织”再到“如何交付”的推导链路。

```text
1. 需求与目标
应用/页面是什么：[例如客服工作台、项目管理、设置中心]
谁在什么场景使用：[角色、频率、桌面端工作环境]
要解决什么问题、成功标准是什么：[主任务与预期结果]

2. 内容与操作
页面里有什么：[数据、字段、列表、详情、表单、图表、操作]
用户怎么完成主任务：[主路径、常用操作、异常/空状态]

3. 信息与容器层次
信息层次：[一级信息、二级信息、优先级]
页面结构：[窗口 / 标题栏 / 导航 / 主内容 / 侧栏 / 覆盖层]
模块结构：[有哪些模块、模块之间的关系]
容器结构：[分栏、卡片、表格、标签页、抽屉、弹窗等]

4. 视觉方向与设计边界
风格/品牌参考：[关键词、参考产品、品牌素材]
必须遵守或避免的内容：[现有设计系统、颜色、组件、禁用样式]
窗口要求：[默认 HarmonyOS PC 1728×1152 / 其他桌面尺寸]

5. 交互与交付
关键交互：[筛选、编辑、校验、选择、弹窗、跳转、权限、危险操作]
已有资料：[目标 Pixso 文件 / design.md / 组件库 / 品牌素材 / 无]
生成方式：[HTML 初稿→Pixso 细化→Demo（默认）/ 视觉优先 / 直接生成 HTML、React 或 Vue]
技术栈：[静态 HTML / React / Next / Vue / 现有项目框架]
交付：[需求契约 + page-spec.json + HTML 初稿 + 可编辑 Pixso 设计稿 + 可交互 Demo]
```

你提供得越完整，Skill 越能直接落到结构和细节；未提供的低风险信息会被合理推断并记录，高风险问题会先向你澄清。

## 工作流详情

### V1 · HTML 初稿 → Pixso 细化 → 最终 Demo（首推）

这是首推流程，适合“先快速看到可用页面结构，再在 Pixso 中把控高保真细节”的场景。

流程固定为：**需求分析 → 方案确认 → HTML 初稿 → 浏览器检查 → Pixso 细化 → 人工确认 → 最终 Demo**。

1. **需求分析**：识别用户、工作对象、主任务、页面结构树、关键路径、状态与交付边界；只澄清会改变结构、交互、风险或视觉方向的问题。
2. **方案确认**：提供设计目标、页面结构树、关键交互与状态、技术选择和重要假设；用户确认后写入需求契约和 `page-spec.json`。
3. **HTML 初稿**：按 Token、组件规范和页面规格生成浏览器可打开的 HTML，先实现主流程、导航、覆盖层和关键状态。
4. **浏览器检查**：在 HarmonyOS PC `1728 × 1152px` 视口打开实际 HTML，检查结构、布局、主交互和关键状态；通过后才进入 Pixso。
5. **Pixso 细化**：导入已检查的 HTML 初稿，将字面量绑定为 Pixso 变量/文字样式/效果样式，恢复 Auto Layout，并用注册组件实例替换可复用控件。
6. **人工确认**：用户在 Pixso 中检查或修改；Skill 回读同一文件的当前页面和顶层 Frame，并把确认后的结构、内容和状态同步回 `page-spec.json`。
7. **最终 Demo**：基于最新回读的 Pixso 设计和同步后的规格重新生成 HTML/CSS/JavaScript、React 或 Vue，验证布局、交互、状态和 Token 映射。

> 使用这一流程时，必须打开**对应的 Pixso 目标文件**和已安装的 Permanent Agent。计划可在插件暂时断线时先排队；恢复连接后自动继续，不会改走低保真 MCP 整页导入。

### V2 · 视觉优先 → 最终 Demo

流程为：**需求分析 → 方案确认 → Pixso 高保真设计 → 人工确认 → 最终 Demo**。适合需要先在 Pixso 中确定视觉和结构，再生成代码的任务。

1. 分析需求并提供方案确认，包括页面结构树和关键状态。
2. 用户确认后，在 Pixso 中创建可编辑高保真界面，复用注册组件、Token、文字样式、效果样式和 Auto Layout。
3. 完成视觉检查，等待用户确认或修改；确认后重新读取最新版 Pixso。
4. 基于回读后的设计生成并验证可交互 HTML。

### V3 · 直接生成 HTML

流程为：**需求分析 → 方案确认 → HTML 生成 → 浏览器检查**。适合明确要求跳过 Pixso 或只需要可交互 HTML 的任务。

1. 分析需求并提供方案确认，包括页面结构树、关键交互和技术选择。
2. 用户确认后，复用或建立设计系统，根据需求契约直接生成可交互 HTML。
3. 在 HarmonyOS PC `1728 × 1152px` 桌面视口下检查布局、主流程和关键状态。

## 最终交付

在默认闭环中，Skill 会输出：

1. **需求理解结果**：目标、用户、主任务、假设、页面层次和关键状态，沉淀为需求契约与 `page-spec.json`。
2. **HarmonyOS PC 客户端 HTML 初稿**：按桌面客户端信息密度、窗口和组件 Pattern 构建，可在浏览器中走通主流程。
3. **对应 Pixso 文件内的可编辑设计稿**：在你指定并打开的 Pixso 文件中生成/更新，包含变量、样式、组件实例和 Auto Layout，而不是一张扁平图片。
4. **可交互 Demo**：基于已确认并回读的 Pixso 设计稿重新生成静态 HTML、React/Next 或 Vue，保持同一套 Token 映射、页面层次、组件状态与关键交互。

## 总结

从需求到设计再到 Demo，`text-to-ui` 不依赖人工复制样式或凭截图重画页面；它以需求契约、页面规格、Token 映射和确认后的 Pixso 设计稿作为共同依据，持续产出符合 HarmonyOS PC 客户端场景的设计与交互结果。

---

## 附录：快速开始、安装与验证

### 快速开始

在 Codex 中直接描述需要的页面即可。未指定模式时，Skill 默认采用首推的 HTML 初稿 → Pixso 细化流程。

```text
用 text-to-ui 帮我做一个 HarmonyOS PC 客服工作台。
页面需要会话列表、客户信息、聊天区、快捷回复和工单侧栏。
请先分析需求；如有会改变信息架构或关键交互的歧义，再向我澄清。
```

若要改用其他模式，请明确写“视觉优先”或“直接生成 HTML”。

### 安装

#### 从独立 Skill ZIP 安装

取得独立 `text-to-ui-skill` ZIP（仓库根目录执行 `pnpm skill:package` 可生成；工作流 Artifact 或另行发布的 [GitHub Release](https://github.com/ahai66666/text-to-ui-monorepo/releases) 也可提供）。解压后，在支持导入 Skill 的工具中选择 `text-to-ui/` 文件夹；其顶层应直接包含 `SKILL.md`。不同工具的导入菜单可能不同，请以所用工具的说明为准。

#### 从完整仓库源码 ZIP 安装

下载 [本仓库](https://github.com/ahai66666/text-to-ui-monorepo) 的源码 ZIP 并解压，推荐在工具中选择“解压后的仓库目录”中的 `text-to-ui/`。该目录顶层有 `SKILL.md`，目录名也与入口中的 `name: text-to-ui` 一致。仓库最外层没有 `SKILL.md`；`skill/` 是交付镜像，按顶层文件识别的工具可发现它，但校验目录名的工具可能拒绝。使用 Git 克隆时同样推荐选择仓库内的 `text-to-ui/`。

这两种导入方式只让工具发现 Skill。需要运行依赖真实组件的页面生成流程时，还须提供包含 `packages/` 的完整 Monorepo 或兼容组件包，并安装相应依赖；只有独立 Skill 时应报告组件能力不可用。

## 项目结构

```text
text-to-ui/
├── SKILL.md                    # Skill 入口与完整执行流程
├── agents/openai.yaml          # Codex 界面元数据
├── assets/
│   ├── design-system/          # 设计规范、Token 与 Pixso Manifest
│   ├── harmonyos-layout-references/
│   └── icons/                  # 图标资源与语义别名
├── preview/                    # 组件、框架矩阵、图标和布局回归页面
├── runtime/                    # React / Vue 运行时适配入口
├── fixtures/                   # HTML、React、Vue 组件契约与构建产物
├── references/                 # 组件、框架映射、布局、交互和输出规则
├── scripts/                    # Token、组件注册、框架和图标验证工具
├── package.json
└── pnpm-lock.yaml
```

## 本地验证

安装依赖后，可以运行以下检查：

```bash
# 检查预览依赖指纹
python3 scripts/update_preview_cache.py --check

# 检查 Pixso Token Manifest 是否为最新
node scripts/build-pixso-token-manifest.mjs --check

# 检查 Pixso Token 与 HTML 运行时 Token 的映射是否完整
node scripts/build-dual-output-token-map.mjs --check

# 检查中心映射 registry 及其运行时投影
node scripts/validate-mapping-registry.mjs --check-projections
node scripts/sync-mapping-registry.mjs --check
node scripts/test-mapping-registry.mjs

# 检查 HTML/Pixso 共用的页面规格
node scripts/validate-page-spec.mjs assets/design-system/page-spec.example.json

# 写入本次运行的 pageSpecSha256，再校验页面硬约束和产物来源
node scripts/stamp-page-contract.mjs \
  --page-spec /absolute/path/to/page-spec.json \
  --run-id <run-id>
node scripts/validate-page-contract.mjs \
  --page-spec /absolute/path/to/page-spec.json \
  --html /absolute/path/to/output.html \
  --manifest /absolute/path/to/run-manifest.json
node scripts/test-validate-page-contract.mjs

# 检查 HTML、React、Vue 共用的组件注册和适配契约
node scripts/validate-framework-component-adapter-map.mjs
node scripts/test-framework-component-contract.mjs
node ../tools/validate-runtime-parity.mjs

# 检查双端 Token 映射与 Web 覆盖
node scripts/validate-dual-output.mjs \
  --page-spec /absolute/path/to/page-spec.json \
  --html /absolute/path/to/output.html

# 审计包含图标的 HTML
node scripts/audit-icons.mjs --strict preview/lucide-source-test.html
```

预览约定：

- 完整 Monorepo 的唯一组件画廊：`apps/component-gallery/index.html#runtime-view`，使用仓库根目录的 Gallery 构建与服务命令。
- 独立 Skill 不打包第二套组件画廊或历史预览；仅包含图标、布局等专项测试页。
- `preview/icon-gallery.html`：HarmonyOS 图标资源。
- `preview/lucide-source-test.html`：图标来源与精确几何验证。
- `preview/layout-inset-test.html`：桌面布局与窗口边距验证。

## Pixso 说明

Pixso 在“HTML 初稿 → Pixso 细化”和“视觉优先”工作流中是必需的。使用这两种模式前，请：

1. 启动 Pixso。
2. 打开目标设计文件。
3. 在 Pixso Developer Mode 加载 Pixso Unified Agent v2 的 `manifest.json`，并确认插件已连接。
4. 确认当前活动文档正确。正常整页导入只发布一次，成功后只保留一个托管画板。

HTML 初稿导入 Pixso 后，代码中的字面量会先成为图层属性；需要再绑定到 Pixso 变量、样式和组件实例，才能保持 Token 可追溯。React 和 Vue 也必须消费同一份 Web CSS Variables 与组件契约；直接生成 HTML、React 或 Vue 时不需要 Pixso。

## 版本与命名

- 当前工作区 Skill 版本：`v2.0.0`（以 `package.json` 为准）
- 工作流编号：`V1`（HTML 初稿 → Pixso 细化）、`V2`（视觉优先）、`V3`（直接生成 HTML）。
- 已发布版本：以 [本仓库 Releases](https://github.com/ahai66666/text-to-ui-monorepo/releases) 为准；工作区版本号不代表独立包已经发布。

完整安装包和历史版本请查看 [本仓库 Releases](https://github.com/ahai66666/text-to-ui-monorepo/releases)。

Pixso 插件源码在 `scripts/pixso-unified-agent-plugin/`。使用者可将构建后的插件包放在自行选择的位置，并在 Pixso Developer Mode 中加载该目录下的 `manifest.json`。如需交付脚本同步到已存在的额外目录，设置 `TEXT_TO_UI_UNIFIED_PLUGIN_DELIVERY_ROOT`（兼容 `TEXT_TO_UI_PLUGIN_DELIVERY_ROOT`）；详见仓库根目录的 Pixso 插件交付说明。

## 许可证

本项目采用 MIT License，详见本目录的 [`LICENSE`](LICENSE)。
