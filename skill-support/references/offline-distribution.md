# Text-to-UI 离线包

规则版 Skill 只携带指令；Windows x64 离线包携带同版组件/Token 源码、Vite 构建依赖和 Windows x64 Node。完整仓库可用时应直接让 AI 使用仓库，不需要离线包；离线包只用于 Windows AI 环境无法访问仓库或安装依赖的情况。解压目录名为 `text-to-ui`，`SKILL.md` 是唯一 Skill 入口。

## 获取与使用

在 Windows x64 打包机或 GitHub Actions 的 Windows runner 运行 `pnpm install --frozen-lockfile`、`pnpm index:build`、`pnpm exec playwright install chromium`、`pnpm skill:offline:package`。生成 `release/text-to-ui-offline-v<version>-win32-x64.zip` 和 `.sha256`。打包过程会将压缩包解压到新目录，使用随包 Node 在含中文和空格的路径创建项目、构建并以浏览器检查 HTML/React/Vue；有任何失败就不应交付。macOS 上的 `pnpm skill:offline:package:check` 只做临时本机烟测，不会生成可分发的 macOS 离线包。

目标 Windows x64 机器不需要安装 Node/npm/pnpm，也不需要网络。运行 `text-to-ui.cmd`：

```text
text-to-ui doctor
text-to-ui new-project "包含空格的项目路径"
text-to-ui generate --project "包含空格的项目路径" --framework html --task "任务说明" --blueprint ... --content-recipes ... --bindings ... --page-css ...
text-to-ui build "包含空格的项目路径"
text-to-ui preview "包含空格的项目路径"
```

`generate` 是现有 `generate-compliant-page.mjs` 的离线入口，其 Blueprint、Context Packet、Pattern、选择凭证与预览证据门槛均不降低。`new-project` 只建立项目与依赖，不凭空创造设计决策文件。预览地址由 Vite 输出；浏览器检查仍须真实执行。

## 修改组件

`text-to-ui fork-source "空目录"` 创建可写源码副本。AI 在此副本修改 `packages/component-contracts` 和三框架适配器，运行副本中的 `text-to-ui refresh-index`，再运行相应测试并生成页面。原解压 Skill 保持不变；评审后把差异回收至规范来源仓库，按正常 Skill 镜像同步流程交付。已有组件能力不足不可直接在页面手绘替代。

`offline-runtime.json` 检查 Windows OS/CPU、Node 和组件契约摘要。`doctor` 成功只证明包装完整性；不能替代页面的源码与浏览器复用校验。当前 Windows x64 包尚未在干净 Windows 机器上验收，必须标记为“未验证”，直至完成相应记录。Pixso 映射不随本流程变更。
