# Text-to-UI v3.0.0：源码清理与独立 HTML 版

完整仓库继续提供 HTML、React、Vue 组件。此版本只在独立清理分支中删除经过引用检查的历史实现，不合并到主分支。

## 完整仓库的变化

- 删除不再使用的 Pixso 旧插件、旧构建脚本和运行时加载测试；保留统一 Agent 插件及当前使用的辅助插件。
- Bridge 只发布协议 v4 和 Operation Plan v5；旧协议不再作为兼容输出。
- `component-usage.json` 只接受 v3。生成页面时必须提供组件选择回执。
- Titlebar 公开配置统一使用 `segmentRole` 和 `slots.left`；旧 `paneRole` 输入及 `slots.leading` 不再接受。
- 移除已废弃的 Caption_L 对应关系、旧 HTML 样式入口及 Fast Preview 的旧导入兜底。
- 缩短根 `SKILL.md`，保留路由、Blueprint、组件和验证门禁。

完整仓库原有的字体、图层配置、组件画廊及 HTML、React、Vue 生产组件继续保留。画廊仍调用 React `Toast`，因此其别名也予以保留；仍被场景和图标查询调用的映射别名没有纳入本次删除。

## 独立 HTML 版

运行 `node tools/export-compact-html.mjs --out <空目录>`，从当前清理分支导出独立仓库。导出包只含 HTML 组件、组件契约、样式、Token、Pattern、精简 Skill 和活跃 Pixso 插件。组件目录只报告 HTML 就绪状态；生成命令默认使用 HTML，拒绝框架参数。

导出目录包含 `PROVENANCE.json`，记录源分支、源提交、版本、逐文件校验值和展开体积。在导出目录运行 `node scripts/scaffold-project.mjs --project <项目目录>` 创建独立项目，再按其 README 生成页面。该项目使用内置 HTML 适配器，不依赖完整仓库路径。

完整仓库执行 `pnpm compact:check`，会在临时目录导出、安装、生成并构建 HTML 页面，同时检查禁用框架引用和 3.3 MiB ZIP 上限。发布 ZIP 不提交到源码仓库。
