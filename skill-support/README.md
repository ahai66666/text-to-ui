# Text-to-UI 规则与工具 / Rules and Tools

此目录存放完整仓库的 Skill 支持资料：路由、设计规范、索引、脚本和预览资源。**它不是导入入口，也没有第二个 `SKILL.md`。** 下载或克隆完整仓库时，选择仓库根目录导入；唯一入口是根目录的 `SKILL.md`。

独立 Skill ZIP 把根目录 `SKILL.md` 与这里的资料打包为一个顶层 `text-to-ui/` 文件夹。它可供 AI 读取规则，但不携带完整的 HTML、React、Vue 生产组件及 Token 包；执行依赖真实组件的流程仍须提供完整仓库。

## 路由与精确资料

先按 [`references/routes/index.json`](references/routes/index.json) 选择一个工作流，再按 [`references/index/task-routes.source.json`](references/index/task-routes.source.json) 解析产品任务、Pattern 和初始能力。工作流与任务路由不是同一层：

| 工作流 | 入口说明 |
| --- | --- |
| `existing-html-to-pixso` | [`existing-html-to-pixso.md`](references/routes/existing-html-to-pixso.md) |
| `new-page` | [`new-page.md`](references/routes/new-page.md) |
| `micro-revision` | [`micro-revision.md`](references/routes/micro-revision.md) |
| `pixso-component-library` | [`pixso-component-library.md`](references/routes/pixso-component-library.md) |
| `converter-diagnosis` | [`converter-diagnosis.md`](references/routes/converter-diagnosis.md) |
| `skill-maintenance` | [`skill-maintenance.md`](references/routes/skill-maintenance.md) |

新页面先用 `scripts/resolve-context.mjs --discover` 取得 Context Packet。读取其中的 `exactReferencesToRead`、`componentReadMap` 和选定组件的 `contractPointer`；前者定位 Pattern 与任务规范，后两者定位精确组件契约和目标框架源码。新增能力先用 `scripts/query-components.mjs` 查询，不能由组件名称或旧预览猜测。`card` 不等于 List Item；设置页和仪表盘的业务卡片在未登记通用 Card 契约前是页面级组合。

路由资料由 [`references/routes/materials.source.json`](references/routes/materials.source.json) 管理。路由与 Context Packet 回执覆盖选定的规则、组件选择与就绪策略及目标框架实现；缺失或哈希过期时停止执行并刷新回执。只读取所选路由和组件所需资料，不把整个注册表当作提示词。

HTML-first、Pixso-first 与直接 HTML 是已选工作流里的执行方式，不是额外的 V1/V2/V3 Skill 入口。组件包边界见 [`references/component-package-integration.md`](references/component-package-integration.md)。完整架构与中英文框架图见仓库根目录 `README.md`。

## 维护与交付

规范源只有仓库根目录 `SKILL.md`、此目录及 `packages/` 的生产契约。`skill/` 是本机按需生成且被 Git 忽略的交付镜像，不能与完整仓库作为两个同名 Skill 同时导入。修改规则后从完整仓库根目录依次重建索引、校验源文件、同步镜像并检查独立 ZIP：

```bash
pnpm index:build
pnpm index:check
pnpm catalog:check
pnpm skill:sync
pnpm skill:check
pnpm delivery:validate
pnpm skill:package:check
```
