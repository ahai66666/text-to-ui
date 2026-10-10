# 组件包架构

## 单一逻辑身份

组件通过 `logicalName` 唯一识别，例如 `Button/Primary/Default`。每个实现必须输出相同的 `data-component`、`data-logical-component`、`data-variant` 和 `data-state` 契约属性。

## 三个 Web 适配器

- HTML：语义 DOM + CSS Variables + 原生事件。
- React：JSX/props/state，使用同一套契约属性。
- Vue：SFC/props/reactivity，不能把 `data-v-*` 或 CSS Module hash 当作组件身份。

三种实现不是相互编译，而是同一契约的独立适配器。当前注册表包含 49 个逻辑组件；HTML、React、Vue 适配器必须分别指向真实源码。没有通过六维一致性检查的组件必须标记为 `partial`，不能宣称为完整覆盖。

## 实现来源策略

每条契约都声明 `sourceStrategy`，用来控制成本和视觉一致性：

- `canonical-custom`：依据当前组件契约、Token 和交互规则，为 HarmonyOS PC 实现轻量组件。
- `shadcn-behavior-canonical-style`：只把 shadcn / shadcn-vue 当作键盘、焦点、弹层等行为的起点，再覆盖全部 canonical Token、字体、间距、状态和图标；不能直接展示 shadcn 默认外观。
- `canonical-static`：对不需要复杂框架行为的组件，使用可读的独立静态适配器；视觉值由 canonical Token 和组件样式提供。

React 初始化可以使用项目确认过的命令：

```bash
pnpm dlx shadcn@latest init --preset b1aIcEaeG --base aria --template vite
```

这个命令只初始化 React 工程，不能直接生成 Vue 组件；Vue 需要单独使用 shadcn-vue 的初始化流程。无论选哪种行为基线，都必须把实现接入 `@text-to-ui/component-styles` 和 `@text-to-ui/tokens`，并通过组件契约校验后才可登记。

## 视觉来源优先级

组件包不重新发明一套 CSS。`packages/component-styles/src/index.css` 是 HTML、React、Vue 共用的 canonical CSS 入口，`packages/tokens/` 提供共享设计变量，`apps/component-gallery/` 是唯一正式的组件预览与验收环境。`packages/component-contracts/src/components.css` 只保留兼容导入。

`packages/component-contracts/src/components.json` 是组件契约唯一可编辑源。`components-runtime.js`、验收 manifest 和交付镜像都是确定性投影，文件头或校验会明确它们的生成来源；禁止直接维护这些副本。组件的公开身份始终是 `logicalName`，运行时 `id`、`fixtureId`、视觉选择器只服务内部渲染和测试，不能被业务页面或 Pixso 映射直接拼接使用。

组件画廊的日常入口只保留 Pattern 和真实运行时组件。Pattern 用于查看栏位、滚动和组合规则；运行时入口在同一个一级目录中提供 HTML、React、Vue 三个 Tab，选择 Tab 只替换真实渲染器，不跳转二级页面。每张运行时卡片的标题栏右侧提供“组件规范”按钮；弹窗从同一份契约投影逻辑身份、Variant、状态、Slots、行为、Token、当前框架实现路径和六维验收结果。契约不再作为另一套视觉画廊或 iframe 基线，避免把 fixture 误读为组件的最终视觉规范。

三种渲染器读取 `components.json.registryPolicy.comparisonGroups` 的同一视觉章节和组件顺序，生成同一套卡片外壳，只展示结构性 Variant；Hover、Focus、Pressed、Selected 和点击反馈通过真实控件交互查看。组件自己的 `category/order` 继续服务代码组织，不再改变视觉对比位置。框架切换不是给同一份 HTML 换标签，也不是复制一套假数据：每张卡片都从 `frameworks.<framework>.source` 指向的真实源码加载，根节点声明 `data-framework`。三套实现共享 Token、样式和契约，但渲染、Props、事件与响应式状态由各自框架执行。

运行时目录不把状态矩阵铺成第二套样例。每个卡片只渲染组件的默认态；组件自身仍保留完整状态契约，浏览器里的原生 `:hover`、`:focus-visible`、`:active` 和事件逻辑负责展示状态变化。卡片中的示例文案只是源码默认 Props 的 fixture，不得用来冒充另一框架的渲染结果。直接打开 `file://` 时只运行带内联 SVG 的 HTML 静态 fallback，React/Vue Tab 会明确置灰并提示使用 HTTP；只有 HTTP/Vite 页面才加载真实的 React/Vue 模块并用于三框架验收。

面向使用者的组件预览只有 `apps/component-gallery/index.html#runtime-view`，通过同一入口切换 HTML、React、Vue。测试 fixtures 只供自动化契约测试使用，不作为画廊内容、预览入口或交付副本；仓库不再保留或构建旧版静态画廊。

当前 Gallery 直接加载组件包中的 HTML、React、Vue 适配器；fixture 仅验证契约边界，不复刻或发布另一套组件目录。

如果未来某个组件没有既有实现，才允许以 shadcn 的 HTML/React/Vue 实现作为结构起点；必须先套用 canonical Token、状态矩阵和 HarmonyOS 图标规则，并通过视觉回归后才能登记为组件包实现。shadcn 不是当前组件包的视觉来源，也不能覆盖既有 Skill 规则。

## Pixso

Git 中保存逻辑组件名、Variant 轴、Slots 和 Token 变量角色；不把缓存 GUID 作为唯一来源。运行时先聚焦 `NewComponents`，按逻辑名重新解析当前 Variant，再插入 linked instance 并读回 `mainComponent` 和 `$variable`。
