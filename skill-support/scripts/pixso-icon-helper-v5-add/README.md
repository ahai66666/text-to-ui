# Text-to-UI Semantic Icon Helper v5 Add

这是一次性、单目标的 Pixso 开发插件。它只在 `NewComponents` 创建
`Text-to-UI Icon/action/add` 这个语义 SVG 共享组件，不读取或修改 Coremail，
也不替换任何现有组件槽位。

运行后先由 Codex MCP 重新读取组件 GUID、24×24 viewBox 与路径几何；验证通过后，
再单独执行一个 MCP 槽位替换操作。若 SVG 注册失败，插件会尝试删除刚导入的临时节点。

安装时请作为新的本地开发插件加载本目录的 `manifest.json`，避免 Pixso 复用旧插件缓存。
