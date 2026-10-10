# 贡献指南

感谢参与 Text-to-UI Monorepo。这个仓库面向 HarmonyOS PC，目标是让需求、Pattern、Tokens、组件契约、HTML/React/Vue 实现和 Pixso 映射可以被多人复用和审查。

## 开始开发

环境要求：Node.js 22、pnpm 10。

```bash
git clone https://github.com/ahai66666/text-to-ui.git
cd text-to-ui
pnpm install
pnpm test
```

组件画廊：

```bash
pnpm gallery:build
pnpm --filter @text-to-ui/component-gallery dev
```

Coremail 示例：

```bash
pnpm --filter @text-to-ui/coremail-workbench dev
```

## 修改规则

1. 仓库根目录 `SKILL.md` 是唯一可导入入口，`text-to-ui/` 是规范支持资料；`skill/` 仅是本机生成的交付镜像，不提交，也不要在内层新增 `SKILL.md`。
2. HTML、React、Vue 必须实现同一份组件契约，不能用外观相似的临时标记替代真实源码。
3. Pattern 是页面组合契约；组件适配器不得重新定义页面结构、插槽或布局策略。
4. Token、组件、Pattern、Pixso 映射的生成文件必须由仓库脚本生成，并保持可重复。
5. 不要提交 `.text-to-ui/` 运行状态、`node_modules/`、构建目录、缓存、临时截图、个人测试文档、密钥或本机绝对路径。

## 分支与 Pull Request

- 新工作使用 `codex/<topic>` 或清晰的功能分支名。
- `main` 只接受 Pull Request，不直接推送功能变更。
- PR 说明应写清楚范围、组件/Pattern 影响、生成文件、验证命令和已知限制。
- 跨框架组件变更至少运行：

```bash
pnpm delivery:validate
pnpm contracts:validate
pnpm styles:validate
pnpm frameworks:validate
pnpm tokens:validate
pnpm pixso:mapping:test
pnpm test
```

## 新增组件

新增组件需要同时更新组件契约、HTML/React/Vue 源码、共享样式、Gallery fixture、Pixso 逻辑映射、生成索引和对应文档。未完成视觉、行为、可访问性或 Token 证据时，状态必须保持 `partial`，不能标记为 `ready`。
