# Text-to-UI 资料目录刷新

此文档定义了 Skill 维护路由的**资料闭环**。它让路由在开始维护或生成前，拿到一份有哈希的、跨目录的规范目录；任何缺失或漂移都会在检查阶段失败。

## 权威边界

- 仓库根目录 `SKILL.md` 与 `text-to-ui/` 是可编辑的规范源；本机生成的 `skill/`、已安装 Skill 与 Pixso 插件是交付镜像。GitHub 只发布一个可发现的 `SKILL.md`。
- 路由先生成并校验 Route 读取回执；生成页面再生成并校验 Context Packet 读取回执。
- `references/index/generated/skill-catalog-index.json` 是维护任务的总入口，不替代具体契约；它列出每一类资料的路径和 SHA-256。
- 其余 Generated Index 是派生产品，由 `pnpm index:build` 与 `pnpm index:check` 统一刷新和校验；为避免索引互相哈希循环，它们由目录的 `derivedProducts` 声明追踪，而不嵌入目录哈希。
- 交付镜像由目录的 `deliveryTargets` 声明，并且只能由 `pnpm skill:sync`/`pnpm skill:check` 校验；镜像文件不进入 canonical 目录哈希，避免同步本身制造哈希循环。

## 必须覆盖的资料组

| 资料组 | 维护时必须确认的内容 |
| --- | --- |
| routing-and-receipts | 路由、Context Packet、静态/动态材料闭包与读取回执 |
| patterns-and-runtime | Pattern、Skeleton、Runtime、Pane inset、Title Layer、Secondary Page |
| component-contracts-and-adapters | 组件契约、Props、Slots、框架适配器、可复用性 |
| tokens-type-and-icons | Token、颜色、排版、间距、图标 Alias/Pixso 图标映射 |
| ui-scene-and-generation | UI Scene、页面蓝图、内容配方、严格页面生成器 |
| gates-and-runtime-evidence | 复用校验、Token 校验、布局/制品校验和 Runtime evidence |
| delivery-mirrors | 根目录 `SKILL.md`、`text-to-ui/` 支持资料、本机 `skill/`、已安装 Skill、Pixso 插件镜像 |
| gallery-preview-and-baseline | Gallery、Preview、Generated Index 与 Baseline |

## 刷新协议

任何修改上述资料组的变更（包括非 MAJOR 的补丁）都必须执行：

```bash
pnpm index:build
pnpm catalog:check
pnpm index:check
pnpm route:materials:test
pnpm skill:sync
pnpm skill:check
```

对 Pattern、组件、Token、页面生成器或 Gallery 的实质变更，还要运行对应的契约、Runtime、Token、页面生成和 Gallery 回归。MAJOR 变更继续使用 `major-version-update-checklist.md` 的完整发布清单。

## 维护路由的读取顺序

1. 读取 `skill-catalog-index.json`，确认所有哈希与权威路径。
2. 依据资料组读取受影响的具体契约；不得以 Gallery 示例或镜像文件替代规范源。
3. 更新索引并重新取得 route/context 读取回执。
4. 在所有规范门禁通过后才同步镜像。

`skill-catalog-index.json` 是一个“强制发现层”：它不允许路由只拿到局部资料后就开始修改。
