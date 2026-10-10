# Text-to-UI 大版本更新清单

这份清单用于每次 `text-to-ui/package.json` 的 MAJOR 版本变化（例如
`1.x → 2.x`）。用户只需要告诉我“要更新什么”，我负责根据本清单定位
影响范围、实施修改、同步交付目录并回报结果。

## 触发条件

- MAJOR 版本号发生变化；
- Pattern、组件契约、Token、图标注册表或路由规则发生不兼容变化；
- 用户明确要求更新 Skill 的核心规范，即使版本号尚未修改。

## 必须持续维护的资料

### 1. 路由与资料闭包

- `references/routes/index.json`：工作流路由、别名、任务域、精确阅读资料；
- `references/routes/materials.source.json`：每条路由的资料清单、角色、必读标记；
- `references/index/generated/*-index.json`：路由、组件、布局、Token、验证索引；
- `references/index/generated/route-material-index.json`：资料哈希闭包；
- `references/components/component-selection-rules.json`：语义场景到组件的选择规则；
- `references/index/capability-aliases.source.json`：能力别名和路由查询入口。

### 2. Pattern 与页面组合

- `assets/design-system/pattern-contracts.json`：区域、顺序、插槽、尺寸、分割线、滚动归属；
- `references/layouts/framework-layout-routing.md`：任务到 Pattern 的路由；
- `references/components/page-composition.md`：页面组合与 UI Scene 规则；
- `packages/pattern-runtime`：Skeleton/Runtime、Pane inset、Title Layer、Secondary Page；
- `assets/design-system/ui-scene.schema.json` 与 `scripts/page-ui-scene.mjs`：共享页面中间层。

### 3. 组件、适配器与复用校验

- `packages/component-contracts/src/components.json`：组件、变体、状态、Props、Slots；
- `packages/components-html/src`、`components-react/src`、`components-vue/src`：框架适配器；
- `references/components/source-resolution.md`：组件来源和优先级；
- `references/components/component-readiness-policy.json`：可用性/预览级别；
- `scripts/generate-framework-page.mjs`：生成前硬校验；
- 严格复用、组件使用清单、组件映射和 runtime evidence 校验。

### 4. Token、颜色、排版与图标

- `packages/tokens/src/token-runtime-map.json`；
- `assets/design-system/tokens.*`、`dual-output-token-map.json`；
- `assets/icons/icon-aliases.json`；
- Pixso Token/变量映射与组件映射投影；
- 页面 CSS 边界和禁止硬编码规则。

### 5. 生成、验证与交付脚本

- Context Packet 和路由/资料读取回执；
- `scripts/resolve-workflow-route.mjs`、`resolve-context.mjs`；
- `scripts/verify-route-materials.mjs`、`verify-context-materials.mjs`；
- `scripts/skill-delivery.mjs`：canonical、镜像、已安装 Skill、Pixso 插件；
- 页面生成、Artifact stamp、浏览器 Runtime evidence、发布/导入脚本。

### 6. 文档、示例与派生目录

- `SKILL.md` 与对应 route/reference 文档；
- 组件 Gallery、Pattern 预览、Skeleton/Runtime 示例；
- 本机生成的 `skill/` 镜像（不提交仓库）；
- `$CODEX_HOME/skills/text-to-ui` 已安装镜像；
- Pixso 插件交付目录；
- Gallery legacy baseline 和所有 generated index。

## 每次大版本更新的执行顺序

1. 记录旧版本、新版本、用户要求和可能的破坏性变化。
2. 先修改 canonical `text-to-ui/` 与 `packages/`，不直接编辑镜像。
3. 更新路由资料清单和资料闭包，执行 `pnpm index:build`。
4. 更新 Pattern/组件/Token/图标及 UI Scene 约束。
5. 更新生成器、验证器、示例和对应负向测试。
6. 执行页面、组件、Token、Pixso、Runtime 和交付回归。
7. 执行 `pnpm skill:sync`、`pnpm skill:check`，确认所有目录哈希一致。
8. 检查 `git diff --check`，生成大版本更新回执。

任意核心资料更新（即使不提升 MAJOR）也必须构建并校验
`references/index/generated/skill-catalog-index.json`。它是维护路由的跨目录
资料发现入口；目录漂移、缺失文件或过期哈希不得通过镜像同步。

## 我每次必须回报的内容

- 版本号：旧版本 → 新版本；
- 路由资料：新增、删除、改名、哈希变化；
- Pattern：区域、插槽、尺寸、布局或 Runtime 行为变化；
- 组件：新增/删除组件、Props/Slots、适配器和复用规则变化；
- Token/图标：新增、删除、重命名和迁移方式；
- 生成器与门禁：新增阻断条件和兼容性影响；
- 四个交付目录的同步结果；
- 测试结果、未解决问题和用户需要确认的破坏性变更。

没有完成同步、回归或迁移说明时，不报告为“大版本完成”。
