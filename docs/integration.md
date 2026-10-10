# 接入组件包

## 先确认交付形态

推荐使用完整代码仓：仓库根目录 `SKILL.md` 是唯一导入入口，`text-to-ui/` 提供规则与工具，`packages/` 提供生产组件库。`skill/` 仅是本机按需生成的独立安装镜像，不属于 GitHub 源码交付；不能把它误认为包含生产组件源码。

```bash
pnpm install
pnpm delivery:validate
```

如果只安装独立 Skill ZIP，可以调用 Text to UI 的规则，但不能直接导入本仓库的 HTML、React、Vue 组件。Skill 找不到 `packages/component-contracts` 或任一框架包时，必须报告组件库不可用/partial；它不会因为存在旧预览或相似 HTML 就自动变成生产组件复用。克隆完整仓库也不会自动向 Codex 注册 Skill；应在宿主环境中选择仓库根目录导入，且不要同时启用独立 ZIP 的同名副本。

## 选择组件

页面生成先产出 `page-spec.json`，再用 `packages/component-contracts/src/components.json` 的
`logicalName` 和 Variant 查询实现。不要用 CSS 类名或展示文案作为组件身份。

## HTML

引入 `@text-to-ui/components-html/styles.css`，通过 HTML 片段或
`renderHtmlComponent()` 渲染；页面中的 `data-component`、
`data-logical-component`、`data-variant` 和 `data-state` 必须保留，便于浏览器检查和 Pixso 导入。

组件画廊的 `apps/component-gallery/gallery.css` 是静态预览入口，直接打开
`apps/component-gallery/index.html` 时也会加载同一套 canonical CSS；不要为文件预览另写一套样式。

## React / Vue

分别引入对应框架包和 `styles.css`。React、Vue 不共享源码，而是共享契约、Token、状态和视觉验收标准。
只有三套实现都通过契约校验时，注册表才可以把组件标记为 `ready`；否则只能标记 `partial`。

实现来源由契约的 `sourceStrategy` 决定。简单的 HarmonyOS 控件直接复用旧 Skill 的结构规则；复杂键盘和弹层行为可以以 shadcn（React）或 shadcn-vue（Vue）为行为底座，但必须覆盖 canonical 样式，不能把默认 shadcn 皮肤带入页面。`@text-to-ui/component-styles` 是三个框架的统一 CSS 入口。

## Pixso

`packages/pixso-mapping` 只保存逻辑映射，不保存永久 GUID。运行时读取目标文件的 `NewComponents`，
按逻辑名和 Variant 解析当前 Component Key，再插入 linked instance 并读回变量绑定。解析失败时严格通道必须停止，
不能用普通图层假装组件实例；视觉快速通道可先导入 HTML 和 SVG，之后再做精化。
