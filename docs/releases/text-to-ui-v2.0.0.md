# Text-to-UI Skill v2.0.0 更新记录

这是一次 Skill 契约和交付流程的大版本更新。Monorepo 中的组件包继续独立版本管理；本次更新不代表所有组件都已达到 `Ready`。

## 更新内容

- 将任务路由与工作流路由分开。任务使用 canonical route ID 和 `--task-route`；描述匹配有歧义时返回候选项并停止，不再静默选择。
- 新增 `generate-compliant-page.mjs` 页面生成入口，统一解析路由和上下文资料、校验读取凭据与生成前置条件、编译目标框架页面并写入生成回执。
- 补充 Secondary Page 页面续接与布局 Pattern 规则，包括独立页面弹窗和页面内嵌弹窗的尺寸区别。
- 明确 Dropdown Menu 不作为可复用 Pixso 主组件；按契约使用 Pixso 原生节点组合。
- 收紧阴影使用及 Disclosure 间距边界，更新组件、Token 和 Pixso 映射资料。
- 将 Pixso Permanent Agent 与组件注册表同步能力合并为 Pixso Unified Agent v2。

## 升级要点

- 分别维护工作流路由参数（`--route`）和任务路由参数（`--task-route`），不要互换。
- 新页面优先使用 `generate-compliant-page.mjs`，不要自行拼接底层路由、上下文与页面生成步骤。
- 路由器给出多个候选项时先澄清意图，不要猜测并强行继续。
- 替换旧版独立 Permanent Agent 插件为统一 v2 插件，不要同时运行两个插件。

## Pixso 插件源码与安装

仓库中的规范源码目录：`skill-support/scripts/pixso-unified-agent-plugin/`。

将构建后的插件包放在使用者自行选择的位置，并在 Pixso Developer Mode 中加载该目录下的 `manifest.json`。需要把插件包同步到已存在的额外目录时，设置 `TEXT_TO_UI_UNIFIED_PLUGIN_DELIVERY_ROOT`；兼容变量 `TEXT_TO_UI_PLUGIN_DELIVERY_ROOT` 仍可用。未设置交付目录时，脚本不会访问机器专属目录。

在 Monorepo 根目录构建并同步：

```bash
pnpm --dir skill-support pixso:plugin:build
pnpm skill:sync
```

## 版本边界

Skill 版本更新到 `2.0.0`；组件和 Token 仍按各自版本独立演进。组件成熟度继续以组件契约注册表与六维验收证据为准。
