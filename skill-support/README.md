# Text-to-UI 规则与工具 / Rules and Tools

此目录是完整仓库的 Skill 支持资料规范源，包含工作流路由、设计系统规则、索引、脚本和预览资料。**它不是导入入口，也不包含第二个 `SKILL.md`。** 从 GitHub 克隆或下载完整仓库时，请选择仓库根目录导入，读取仓库根目录的 `SKILL.md`。

独立 Skill ZIP 由根目录 `SKILL.md` 与此目录内容共同打包，解压后顶层目录名为 `text-to-ui`，该顶层才包含 `SKILL.md`。独立包只提供规则与工具；真实 HTML、React、Vue 组件及 Token 包仍在完整仓库的 `packages/`。缺少完整组件仓时必须停止需要组件的执行流程，不能以旧预览或截图充当生产组件。

## 先锁定入口，再选择路由

完整仓库只有一个 Skill 入口。执行时先确认入口来自当前仓库根目录，再按 [`references/routes/index.json`](references/routes/index.json) 选择一个工作流：

| 工作流路由 | 适用任务 | 必读资料 |
| --- | --- | --- |
| `existing-html-to-pixso` | 将已确认的 HTML 导入 Pixso | [`existing-html-to-pixso.md`](references/routes/existing-html-to-pixso.md) |
| `new-page` | 新页面或大幅重新设计 | [`new-page.md`](references/routes/new-page.md) |
| `micro-revision` | 已确认产物的精确微调 | [`micro-revision.md`](references/routes/micro-revision.md) |
| `pixso-component-library` | Pixso 组件库建设和同步 | [`pixso-component-library.md`](references/routes/pixso-component-library.md) |
| `converter-diagnosis` | 转换或导入故障诊断 | [`converter-diagnosis.md`](references/routes/converter-diagnosis.md) |
| `skill-maintenance` | Skill、映射和交付维护 | [`skill-maintenance.md`](references/routes/skill-maintenance.md) |

工作流路由决定操作类型；任务路由决定产品领域、Pattern 和初始能力。两者不能混为一谈。新页面必须先完成 `page-blueprint.json` 的分析与方案门禁，之后才可按路由调用 `scripts/generate-compliant-page.mjs`。HTML-first、Pixso-first 或直接 HTML 是路由内的执行方式，不是旧版 V1/V2/V3 的替代入口，也不能跳过所选路由的验收门禁。

```text
唯一 SKILL.md 入口
  → 锁定完整仓库与规则目录
  → 选择工作流路由并验证资料回执
  → 解析任务路由、Pattern、组件和 Token 契约
  → 新页面完成 Blueprint 与方案确认
  → 生成、真实浏览器预览、迭代与交付校验
```

组件包接入边界见 [`references/component-package-integration.md`](references/component-package-integration.md)。完整仓库的架构和中英文框架图见仓库根目录 `README.md`；独立 ZIP 使用者应以其顶层 `SKILL.md` 和本目录资料为准，不依赖相对路径跨出安装目录。

## 维护与发布

只修改仓库根目录 `SKILL.md` 和此目录的支持资料。索引与交付镜像是生成物，不是另一套规则源。修改路由或资料后在完整仓库根目录依次运行：

```bash
pnpm index:build
pnpm catalog:check
pnpm skill:sync
pnpm skill:check
pnpm delivery:validate
pnpm skill:package:check
```

`pnpm skill:sync` 可在本机生成被 Git 忽略的 `skill/` 镜像并同步已安装的副本；公开的独立 Skill ZIP 由 `pnpm skill:package` 从规范源构建。不要提交 `skill/`，也不要把它和完整仓库作为两个同名 Skill 同时导入。
