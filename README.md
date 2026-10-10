# Text-to-UI：HarmonyOS PC 设计开发协同系统

`text-to-ui` 不是一个只把文字生成成页面的工具，也不是单独的一套组件库。它是连接需求分析、设计系统、跨框架 UI 组件实现、Pixso 设计稿、组件验收和页面生成流程的协同桥梁。

它让设计师不再只交付一张静态效果图，也让开发者不再针对每个页面重复还原基础组件。双方围绕同一套组件契约、Tokens、图标、状态和交互规则工作，并通过真实的 HTML、React、Vue 运行时验证结果。

> 项目定位：一个面向 HarmonyOS PC 的 Text-to-UI 设计开发协同系统，包含需求分析 Skill、多框架 UI 组件库、设计系统、Pixso 映射、组件画廊和自动验证流程。

## 系统如何工作

```text
Text-to-UI Skill
    ↓
组件契约、Tokens、图标、视觉规范
    ↓
HTML 组件实现
React 组件实现
Vue 组件实现
    ↓
Pixso 映射、组件画廊、浏览器验证
```

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

其中有一条必须保持清晰的边界：

> Skill 负责分析需求、选择组件、组织页面和调用规范；生产组件包负责真正的 HTML、React、Vue 实现。

Skill 不用视觉相似的临时代码冒充生产组件。页面生成时，它会优先读取组件注册表和设计系统，选择已有组件、Variant 和 Pattern；组件包则提供可在真实工程中使用的结构、状态、行为和样式源码。

## 它解决设计师的什么问题

传统页面交付中，设计师经常遇到这些问题：

- 设计稿只能表达一个静态瞬间，悬停、聚焦、禁用、错误、加载、空状态和弹层行为需要额外口头说明。
- 同一个 Button、Select、Picker、Alert 或 Tooltip 在不同页面被重复设计，尺寸、间距和交互逐渐失去一致性。
- 设计稿中的颜色、字号和间距没有明确对应 Token，开发只能靠目测还原。
- 组件名称、用途、插槽、状态和行为没有统一契约，设计师和开发者对“同一个组件”的理解不一致。
- Pixso 中的组件与代码组件彼此独立，设计系统更新后容易出现两套规范。
- 设计完成后才能看到真实浏览器效果，跨框架差异和交互问题发现得太晚。
- 后台、工作台、设置页等复杂工具需要大量重复布局，设计师把时间消耗在基础拼装而不是关键任务体验上。

Text-to-UI 将这些问题转化为可复用、可实现、可验证的系统能力：

- 直接查看真实组件，而不是只看静态效果图。
- 在组件画廊中检查默认、悬停、聚焦、禁用、错误、加载和弹层等完整状态。
- 设计时复用已有 Tokens、组件、图标和交互规则，减少重复决策。
- 使用组件契约明确组件名称、用途、Variant、状态、插槽、尺寸和行为。
- 让 Pixso 设计与代码组件基于同一套逻辑映射和视觉规范。
- 用文字描述工作目标后，由 Skill 组合已有能力，快速生成工作台、后台、设置页或内容工具的结构草案。
- 通过 HTML、React、Vue 三种运行时预览，提前发现视觉与行为差异。
- 将交付物从“一张需要解释的图”升级为“设计稿 + 组件规则 + 交互状态 + 可运行验证”。

对设计师最核心的价值是：

> 从“设计页面”升级为“设计可复用、可实现、可验证的组件系统”。

## 它如何帮助开发实现

- 开发者获得的不是一次性生成的 HTML，而是真实的框架组件源码。
- 同一个逻辑组件分别提供 HTML、React 和 Vue 实现，并共享组件身份和行为契约。
- 三种框架复用 Tokens、语义图标和 canonical 视觉样式，减少重复实现。
- 组件结构、状态、交互和可访问性要求在开发前已经定义。
- Skill 生成页面时优先组合已有组件，避免每个项目重新实现基础能力。
- 设计决策可以直接对应 Token 和组件属性，降低目测还原和反复沟通成本。
- 组件画廊同时承担开发参考、运行时调试和交付验收环境的职责。
- 契约、样式、框架运行时和 Token 校验可以提前发现跨框架偏差。
- 修改共享 Token 或组件样式后，可以同步影响多个框架和后续生成页面。

对开发者最核心的价值是：

> 从“照着设计稿重复还原”升级为“直接调用统一契约下的 UI 组件”。

## 设计与开发协作流程

默认采用 HTML-first 闭环：

```text
文字需求
  ↓
需求分析与方案确认
  ↓
读取设计系统和组件契约
  ↓
生成 HTML 结构初稿并进行浏览器检查
  ↓
导入 Pixso，进行视觉调整和设计确认
  ↓
基于确认结果生成最终页面
  ↓
HTML / React / Vue 运行时与自动校验
```

根据任务也可以选择 Pixso-first 或 Direct HTML。无论采用哪种流程，页面结构、组件选择、状态和 Token 都应来自同一份规则系统；不能把 Pixso 普通图层宣称为已注册组件实例，也不能把 HTML 外观相似物冒充 React 或 Vue 源组件。

## 核心模块

| 模块 | 职责 |
| --- | --- |
| `text-to-ui/` | Skill 规范源；定义需求分析、页面组织、设计系统复用和验证流程 |
| `skill/` | 可独立安装和发布的 Skill 交付镜像 |
| `packages/tokens/` | 跨设计与代码使用的 canonical Tokens |
| `packages/icons/` | HTML、React、Vue 共用的语义图标 |
| `packages/component-contracts/` | 统一组件身份、Variant、状态、插槽和适配规则 |
| `packages/component-styles/` | 三种框架共用的 canonical 视觉实现 |
| `packages/components-html/` | 语义化 HTML 组件与交互控制器 |
| `packages/components-react/` | 真实 React 组件源码 |
| `packages/components-vue/` | 真实 Vue 组件源码 |
| `packages/pixso-mapping/` | 逻辑组件到 Pixso 组件和变量的运行时映射 |
| `apps/component-gallery/` | 唯一正式的组件预览、对照和验收环境 |
| `tools/` | 契约、样式、运行时、Token 和交付校验工具 |

## 组件契约为什么重要

组件契约是设计和开发之间的共同语言。它不只记录组件叫什么，还定义：

- 组件用于解决什么任务，以及不应该在哪些场景使用。
- 支持哪些 Variant、尺寸、状态和内容插槽。
- 键盘、鼠标、焦点、弹层和错误恢复应该如何工作。
- HTML、React、Vue 分别使用哪个真实源码入口。
- 视觉样式引用哪些 Tokens、图标和共享规则。
- Pixso 中如何解析对应组件，而不把文件内 GUID 固化进仓库。
- 达到 `Ready` 前必须具备哪些可重复运行的验证证据。

这让设计师可以明确表达组件意图，让开发者可以按同一个身份和状态模型实现，也让 Skill 能够可靠选择组件而不是根据外观猜测。

## 组件画廊

`apps/component-gallery/` 是唯一正式组件画廊，用于：

- 设计师查看 Pattern 组合规则与真实组件视觉、状态和交互表现。
- HTML、React、Vue 在相同位置逐项对照，并通过卡片标题栏右侧的“组件规范”弹窗查看契约。
- 开发者调试组件结构和行为。
- 验收 Token、样式和框架适配是否一致。
- 为 Skill 和 Pixso 映射提供可检查的组件目录。

组件契约不是第二套视觉画廊。`packages/component-contracts/src/components.json` 是唯一可编辑的契约源；生成的运行时模块、验收 manifest 和交付镜像只能通过构建更新。对外组件身份使用 `logicalName`，运行时 `id`、fixture 与选择器仅用于内部渲染和测试。

开发服务器启动后，可在浏览器中切换 HTML、React、Vue 运行时。推荐通过 HTTP 访问；`file://` 只支持静态 HTML fallback，不能验证真实 React/Vue 入口。

## 当前覆盖与成熟度

| 组件范围 | HTML | React | Vue | Pixso 映射 |
| --- | --- | --- | --- | --- |
| 49 个登记组件 | Partial | Partial | Partial | Logical mapping |

目前 49 个组件已经具有独立的 HTML、React、Vue 源码入口，并使用 canonical CSS Variables，但仍统一标记为 `Partial`。组件数量以 `packages/component-contracts/src/components.json` 为准。只有以下六项都具有可重复运行的证据后，组件才会标记为 `Ready`：

- `sourceReady`
- `contractReady`
- `visualParity`
- `behaviorParity`
- `accessibilityParity`
- `tokenParity`

当前质量门是 `0 Ready / 49 Partial`。这是一项有意保留的诚实成熟度标记：Skill 和 Pixso 严格通道不能把尚未完成六维验收的组件宣称为完整复用。

Pattern 是页面级组合契约，不是组件注册表条目。目前仓库提供 4 个可解析 Pattern：两栏工作台、三栏工作台、工具工作区和检查器页面。HTML、React、Vue 与 Pixso 必须使用同一份 Pattern 契约，不能在框架适配器中各自重新定义页面结构。

## 完整代码仓交付边界

```text
text-to-ui-monorepo/
├── text-to-ui/                 # Skill 唯一规范源
├── skill/                      # Skill 可安装交付镜像
├── packages/                   # 生产组件、Tokens、契约、图标和 Pixso 映射
├── apps/component-gallery/     # 正式组件画廊
├── fixtures/                   # 最小契约与回归测试输入
├── tools/                      # 生成器和自动校验器
├── docs/                       # 架构、接入和发布文档
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── README.md
```

完整仓库、独立 Skill 和生产组件包是三个不同概念：

- `text-to-ui/` 是 Skill 唯一规范源。规则修改应先发生在这里，再同步到 `skill/`。
- `skill/` 是可独立安装的规则包，但它本身不是生产组件库。
- `packages/` 才包含 HTML、React、Vue 的真实实现和共享设计系统能力。
- 只安装 Skill 而没有组件包时，Skill 必须明确报告组件库不可用，不能静默生成视觉相似替代品。
- 克隆仓库不会自动把 Skill 注册到 AI 工具；仍需按宿主工具的方式导入 Skill 文件夹，并为组件复用提供完整仓库或已发布包。

### 在其他 AI 工具中导入 Skill

部分工具只检查所选文件夹顶层是否存在 `SKILL.md`，也有工具要求文件夹名与其中的 `name: text-to-ui` 一致。下载 GitHub 仓库源码 ZIP 并解压后，推荐选择“解压后的仓库目录”中的 `text-to-ui/`；独立 Skill ZIP 解压后同样选择 `text-to-ui/`。所选文件夹应直接包含 `SKILL.md`、`references/` 和 `scripts/`。仓库内的 `skill/` 是交付镜像，按顶层文件识别的工具也能发现它，但跨工具导入推荐使用 `text-to-ui/`。具体导入入口由所用工具提供。

独立 Skill 包可供工具发现规则和索引，但不包含 `packages/` 中的 HTML、React、Vue 组件与运行时。需要生成使用真实组件的页面时，还须提供完整 Monorepo 或兼容的组件包；缺少这些依赖时，应将组件能力标为不可用。

## Text-to-UI 与 Pixso 插件交付

HTML 导入 Pixso 采用同一条可重复执行的链路：

```text
HTML / 浏览器最终计算样式
  → Visual Manifest
  → DOM Visual IR
  → Operation Plan
  → Text-to-UI Pixso Unified Agent v2
  → Pixso 变量、文字样式和组件实例
```

仓库中的职责边界如下：

| 路径 | 用途 | 是否包含运行缓存 |
| --- | --- | --- |
| `text-to-ui/` | Skill 唯一规范源、导入编译器、映射规则和测试 | 否 |
| `skill/` | 可独立安装的 Skill 同步镜像 | 否；`.text-to-ui/` 运行状态不发布 |
| `text-to-ui/scripts/pixso-unified-agent-plugin/` | Pixso Unified Agent v2 插件源码，包含 `manifest.json` | 否 |
| 使用者自行选择的插件目录 | 在 Pixso Developer Mode 加载该目录中的 `manifest.json`；目录不属于仓库 | 插件包 |
| `packages/` | HTML、React、Vue 组件和共享设计系统源码 | 否 |

插件源码位于 `text-to-ui/scripts/pixso-unified-agent-plugin/`。在 Pixso Developer Mode 中加载该目录下的 `manifest.json`；如需使用仓库外的插件目录，可将构建后的插件包放到自行选择的位置，并设置 `TEXT_TO_UI_UNIFIED_PLUGIN_DELIVERY_ROOT`（兼容变量 `TEXT_TO_UI_PLUGIN_DELIVERY_ROOT`）。仓库文档只记录相对源码位置，不包含个人电脑路径；未设置外部目录时不会写入机器专属位置。

插件包负责在已打开的 Pixso 文件中执行 Operation Plan，并持续监听本地桥接服务；Skill 负责采集 HTML、锁定几何、生成计划和提供规则。正常整页导入只使用插件执行，不与 MCP 整页绘制并行，也不读取旧计划、旧截图、旧 GUID 或旧画板作为新运行输入。插件代码/API 变更后需要重新加载插件包；规则、映射或页面内容变化只需要重新生成并发布新的 Operation Plan。

导入中的关键不变量：普通文字默认内容自适应，只有 HTML 明确使用省略规则且文本超出盒宽时才使用 `TRUNCATE`；图标热区横纵居中，16/20/24px 图标描边分别为 1/1.25/1.5px，并优先绑定 Pixso `Size & Layout` 中的对应变量；几何锁定后才做 Token、文字样式和精确组件映射。缺少精确资源时保留原始 SVG 或普通图层，不用近似组件覆盖真实布局。

插件的本地桥接服务可通过以下命令启动和检查：

```bash
pnpm services:start
node text-to-ui/scripts/pixso-plugin-bridge.mjs status
pnpm --dir text-to-ui pixso:plugin:build
pnpm skill:sync
pnpm --dir text-to-ui pixso:delivery:check
```

`.text-to-ui/` 下的任务状态、归档计划、连接会话和临时结果只属于本机运行时，不应提交到 GitHub；审计截图和一次性回归输出也不属于 Skill 或插件发布包。

## 本地运行

环境要求：Node.js 22、pnpm 10。

```bash
git clone https://github.com/ahai66666/text-to-ui-monorepo.git
cd text-to-ui-monorepo
pnpm install
pnpm test
```

组件画廊开发与构建：

```bash
pnpm gallery:sync-legacy
pnpm --filter @text-to-ui/component-gallery dev

# 或生成正式构建
pnpm gallery:build

```

## 自动验证

```bash
pnpm delivery:validate       # 仓库目录、交付镜像和组件入口
pnpm contracts:validate      # 组件契约完整性
pnpm styles:validate         # 共享视觉规则一致性
pnpm frameworks:validate     # HTML / React / Vue 适配和运行时
pnpm tokens:validate         # Token 源与生成映射
pnpm pixso:mapping:test      # Pixso 逻辑组件解析
pnpm runtime:evidence        # 运行时验收证据
pnpm dialogs:validate        # 弹层组件契约
pnpm gallery:baseline:validate
pnpm test                    # 完整质量门
```

GitHub Actions 会在 push 和 pull request 时运行核心交付、契约、框架、Token 与 Pixso 映射校验。

## 版本与发布

Skill、组件包和 Tokens 使用独立版本，例如：

- `skill-v2.0.0`
- `components-v0.1.0`
- `tokens-v0.1.0`

GitHub Release 可以发布 Skill ZIP 与组件包构建产物；需要作为工程依赖使用时，再发布 React/Vue 等 npm 包。仓库不保存目标 Pixso 文件的运行时 GUID，组件和变量应在当前文件中动态解析。

Text-to-UI Skill v2.0.0 迁移说明见 [`docs/releases/text-to-ui-v2.0.0.md`](docs/releases/text-to-ui-v2.0.0.md)。组件迁移与六维验收规则见 [`docs/component-migration-plan.md`](docs/component-migration-plan.md)。多人协作约定见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

## 许可证

本项目采用 [MIT License](LICENSE)。第三方依赖和外部设计资源仍以其各自许可证或授权范围为准。
