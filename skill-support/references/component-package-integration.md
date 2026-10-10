# 组件包接入协议

`text-to-ui` Skill 不内嵌完整生产组件源码。它读取 Monorepo 的组件契约、Token 包和框架适配器，再按逻辑组件组装页面。

## 完整代码仓与独立 Skill 的边界

完整接入的根目录必须同时能解析 `pnpm-workspace.yaml`、`packages/component-contracts` 和三个框架组件包。推荐从代码仓根目录执行 `pnpm delivery:validate`，再运行 Skill 的页面生成流程。

仓库根目录 `SKILL.md` 是唯一导入入口，`skill-support/` 是其规范支持资料；`skill/` 只是在本机生成的独立安装镜像，不提交到 GitHub。独立安装镜像可以提供规则和索引，但不会把根仓的 `packages/` 变成 Codex 的全局组件库；克隆仓库也不会自动完成 Skill 注册。若 Skill 运行时找不到组件包，必须把复用能力标记为不可用或 partial，并报告缺失路径，禁止静默回退到截图、旧预览或视觉相似 DOM。

发布时可以把 Skill 与组件包拆开发布，但使用者必须同时安装与当前 Skill 版本兼容的组件包；开发、验收和跨框架复用应优先使用完整代码仓。

默认查找顺序：

1. `packages/component-contracts/src/components.json`：逻辑名、Variant、状态、Props、Slots 和 Token 角色。
2. `packages/components-html`、`packages/components-react`、`packages/components-vue`：真实框架实现。
3. `packages/tokens`：canonical CSS Variables 与 Token 映射。
4. `packages/pixso-mapping`：NewComponents 逻辑映射；GUID 必须在当前 Pixso 文件中运行时解析。

每条契约还声明 `sourceStrategy`：`canonical-custom` 表示按旧 Skill 的结构和规则重写轻量组件；`shadcn-behavior-canonical-style` 表示只借用 shadcn / shadcn-vue 的行为与无障碍基础；`canonical-static` 表示暂时只有旧 Skill 视觉基线。三个框架都通过 `@text-to-ui/component-styles` 进入同一套 CSS，不允许组件包再维护一份默认 shadcn 外观。

只有 HTML、React、Vue 三个实现都通过契约验证，组件才可以标记为跨框架 `ready`；否则标记为 `partial`，Skill 不能自动声称完整复用。
组件预览必须按框架加载真实源码：HTML 使用静态适配器，React 使用 JSX 导出，Vue 使用 SFC；不能通过同一份 HTML、截图或手写 lookalike 伪造其它框架。示例文案可以作为源码默认 Props 的 fixture，但框架身份、Token、状态和事件必须来自对应实现。

## 契约与框架运行时适配器一致性

- `packages/component-contracts/src/components.json` 与 `parity-manifest.json` 是契约视图、HTML、React、Vue 的共同目录。四个视图必须使用相同 `category`、`order`、`fixtureId`、`specimens` 和结构 Variant；禁止各框架单独维护排序或省略结构样例。
- 契约页展示完整视觉规则和状态矩阵；框架运行时页在同一卡片中用 Props 切换尺寸、Surface、Mode、Error、Disabled 等结构轴。Hover、Pressed、Focus、Open 必须由真实鼠标或键盘触发。
- `sourceReady`、`contractReady`、`visualParity`、`behaviorParity`、`accessibilityParity`、`tokenParity` 六项全部有可复跑证据后才能标记 `ready`。文件存在、字段存在或源码包含 Token 名称都不能替代浏览器级证据。
- `file://` 只允许 HTML 静态 fallback，并禁用 React/Vue。三框架数量、顺序、交互和视觉验收必须使用 HTTP 预览；发布目录必须内含 Token 与组件 CSS，不得引用目录外源码。
- 所有图标通过中央内联 SVG Icon Primitive 输出。Outline 图标按 16px/1px、20px/1.25px、24px/1.5px 描边；Filled 图标只使用 fill。禁止外部 SVG `<use>` 和 `icon_font`。已登记别名必须保持精确来源；未登记别名应停止所属绑定并报告，不得擅自换用原始图标名、Unicode 或手绘图形。

## 弹窗族实现边界

- Dialog 固定 400px、White Surface、`shadow-4`；Alert Dialog 使用相同投影。Semi-modal 使用 `shadow-5`。共享投影 Token 的常规使用范围是 `assets/design-system/design.md` §4.6 的九类浮层外壳，其他场景默认无投影。Dialog 的 56px Header 使用居中的 `Title_S`，不显示右上角关闭按钮。单按钮横向填满，双按钮等宽，左 Secondary、右 Primary 或 Danger，外部点击不关闭。
- Alert Dialog 是固定 modal 的危险确认 Dialog 兼容逻辑，不拥有 White/Gray 或 modal/non-modal 结构轴，不显示关闭按钮，不允许遮罩关闭。
- Semi-modal 独立提供 S 480px、M 640px、L 800px，White/Gray Surface，以及默认 non-modal 和显式 modal。Header 左标题、右 40×40 Ghost Close；Content X24/Y0；Footer 80px，40px 操作组右对齐。
- White Semi-modal 组合灰面 Field/Input/Search/Select/Textarea；Gray Semi-modal 组合白面控件。弹窗只负责容器与分区布局，不得创建弹窗专用输入框或按钮样式。

## 生成规则

- PC 页面必须先通过 `references/pc-framework-layout-gate.md`：先选择并验证 Pattern、分栏顺序、全局标题层、全局主操作位、末级窗格起始位、滚动归属、缩放行为和布局 Token，再进入组件检索。组件只填充框架槽位，不得反向改写应用框架。
- Web 页面无论采用 HTML-first、visual-first、direct HTML，还是 Pixso fast/strict，都必须先通过 `references/web-component-reuse-gate.md`。Pixso 快速通道不等于 Web 组件可以手写。
- 先按 `logicalName` 命中组件，再选 Variant 和 state；禁止从视觉相似的 DOM 或同名 Frame 推断组件。
- HTML、React、Vue 分别调用各自适配器，但必须输出同一组 `data-component`、`data-logical-component`、`data-variant`、`data-state` 契约属性。
- `data-component` 只是适配器输出标记，不能替代源码中的真实组件包 import。交付前必须用 `validate-web-component-reuse.mjs` 校验 `component-usage.json` 和可编辑源码。
- HTML 页面必须从 Context Packet 读取 `rendererKey`、`supportedProps`、
  `supportedSlots` 和 `styleImports`。调用 `renderHtmlComponent(rendererKey,
  options)`，通过 props/slots 填入业务内容；不得先渲染组件再清空内部 DOM。
- HTML 适配器的无参数调用保留画廊默认内容；生产页面应显式传入业务
  props。`collectHtmlComponentEvidence(document)` 是浏览器运行时复用证据入口。
- 严格按三级来源处理：组件库有且满足需求时引用真实源码；组件库没有或实现不足但存在契约组件时，严格参考契约的结构、状态、行为、可访问性、图标和 Token 规则实现；两者都没有时才允许自定义绘制。
- 第二级必须标记为“契约适配”，不能声称引用组件库；第三级必须记录组件库检索和契约检索均未命中。两级都必须使用共享 Token、语义图标和 HarmonyOS PC 规范。
- `partial` 组件在 `sourceReady` 且目标框架实现满足当前用途时仍应引用真实源码，并披露未通过的验收维度；若实现确实缺少所需 Slot 或行为，则进入契约适配，不得直接跳到任意自定义。
- 页面颜色、间距、尺寸、字体和效果从 Token 包消费；组件源码禁止硬编码可见颜色。
- Pixso 严格通道先聚焦 `NewComponents`，使用 `packages/pixso-mapping/resolve.js` 生成运行时解析计划，插入 linked instance 后读回 `mainComponent`、槽位和 `$variable`。
- 快速视觉通道可以使用页面自有 Frame，但必须如实报告未绑定的组件和变量。
