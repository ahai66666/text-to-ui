# 发布约定

使用 pnpm workspace 管理包，使用 Changesets（接入后）分别发布：

- `skill-vX.Y.Z`：供支持 `SKILL.md` 的 AI 工具导入的 Skill ZIP。
- `components-vX.Y.Z`：HTML/React/Vue 组件包。
- `tokens-vX.Y.Z`：Token 基础包。

Skill 记录兼容的组件包范围。Token 破坏变化会提升组件包 major；组件实现变化只提升组件包；Skill 规则变化只提升 Skill。GitHub 仓库提交源码、契约、测试、Token 和映射；不提交 `node_modules`、缓存、临时 ZIP 或失效 GUID 快照。

## 完整仓库与独立发布包

### 完整仓库（开发、协作和验收）

完整代码仓必须同时包含：

```text
SKILL.md                # 唯一 Skill 导入入口
agents/openai.yaml      # Skill 界面元数据
text-to-ui/             # Skill 规则、索引、脚本和预览规范源
packages/               # 生产组件、Token、契约和 Pixso 映射
apps/component-gallery/ # 正式组件画廊
tools/                  # 生成与校验脚本
```

上传前从根目录执行：

```bash
pnpm install
pnpm delivery:validate
pnpm test
```

### 独立发布包

独立 `text-to-ui-skill` ZIP 解压后应包含 `text-to-ui/` 文件夹，且该文件夹顶层直接具有 `SKILL.md`。下载完整仓库的源码 ZIP 时，跨工具导入应选择**仓库根目录**，其顶层直接具有唯一 `SKILL.md` 和 `packages/`。如工具要求目录名与 `name: text-to-ui` 一致，把源码 ZIP 解压后的外层目录改名为 `text-to-ui`。不要选择内层规则目录，也不要在同一工具中同时导入完整仓库和独立 Skill ZIP。

在仓库根目录运行 `pnpm skill:package` 可从规范源生成按 `text-to-ui/package.json` 版本命名的 ZIP；`pnpm skill:package:check` 会临时打包、解压并核对入口和文件。手动运行 GitHub Actions 的 `release` 工作流并选择 `skill` 时，ZIP 会作为工作流 Artifact 上传；只有另行附加到 GitHub Release 后才是公开 Release 下载项。

独立 Skill 包只保证规则、索引、工具和预览资源可安装；它不携带 `packages/` 生产组件源码。`text-to-ui-components` 和 `text-to-ui-tokens` 需要作为兼容版本一起安装或作为 Monorepo workspace 依赖提供。

因此，独立安装 Skill 后只能确认“规则已安装”；只有组件包也可发现并通过契约校验时，才能声称使用了注册组件。仓库克隆不会自动完成 Skill 注册，宿主环境仍需按自身的导入方式启用仓库根目录入口。

### 发布门禁

`pnpm delivery:validate` 会阻止以下情况进入发布流程：唯一入口缺失或内层出现第二入口、本机生成镜像（若存在）与规范源不一致、组件契约缺少任一 HTML/React/Vue 源入口、workspace 或正式画廊缺失、根 README 未声明完整仓库边界。

## 多人复用的上传边界

公开 Git 仓库应提交所有可复用、可审查和可重现的工程内容：唯一 Skill 入口与规范源、HTML/React/Vue 组件、Tokens、组件契约、Pattern、Pixso 映射、组件画廊、示例应用、Fixtures、生成器、校验器、文档、锁文件和 CI 配置。本机 `skill/` 镜像不提交；确定性生成文件可以提交，但必须使用仓库相对路径，并在文件头或文档中标记生成来源。

以下内容不属于可复用工程，不应提交：`node_modules`、构建目录、缓存、`.text-to-ui/` 运行状态、登录/连接会话、机器绝对路径、临时截图、一次性测试输出、个人测试文档和任何密钥。需要展示的审计结论应整理为不含敏感信息的 Markdown；可重放的 Pixso Scene 或 Operation Plan 应先清理本机路径和易失字段，再作为示例输入提交。

任何贡献者都应能从干净克隆完成：

```bash
pnpm install
pnpm test
pnpm gallery:build
```

Coremail 的 Pixso MCP 备用计划可按需重生成：

```bash
pnpm pixso:scene:coremail
pnpm pixso:operation-plan:coremail
pnpm pixso:mcp-plan:coremail
```

MCP 计划会按模块裁剪 Token/Style 资源，并使用仓库内的压缩运行时；每个调用都经过 150 KB 上限校验。这样干净克隆后仍可复现计划，不依赖某台机器上的运行时路径。

组件、Skill 和示例应用通过分支与 Pull Request 合并，`main` 只接收通过 CI 和评审的变更。GitHub 源码公开、GitHub Release 和 npm 包发布是三个独立动作，不能用“代码已上传”替代版本发布。
