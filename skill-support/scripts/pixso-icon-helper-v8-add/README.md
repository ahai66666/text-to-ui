# Text-to-UI Semantic Icon Helper v8 Add

这是一个范围受限的 Pixso 开发插件，用于创建一个语义图标共享组件：
`Text-to-UI Icon/action/add`。

## 运行顺序

1. 在 Pixso 的本地开发插件入口加载本目录的 `manifest.json`。
2. 先运行“连接自检（只读）”。它只检查当前文档上下文、`NewComponents` 页面和直接子节点读取能力，不写入任何节点，也不执行全量 `findAllAsync` 扫描。
3. 自检通过后，运行“创建 action/add 共享组件（仅 NewComponents）”。
4. 插件会检查同名组件、创建原生几何组件，并回读确认；回读失败不会再次写入。

## v8 针对本次故障的修复

- 创建前增加只读连接预检，先暴露认证、协作会话、页面缺失和 API 能力问题。
- 组件存在性检查只读取 `NewComponents` 的直接子节点，避免协作重连期间的全页面异步扫描超时。
- 不再调用 `createNodeFromSvg` 或 `createComponentFromNode`；改用 `createComponent` 加两个原生矩形，避开当前文件触发 `S_Guid not exist` 的导入/转换路径。
- 组件仍保持 24×24 的 action/add 几何和语义元数据，后续槽位绑定不受影响。
- 每个写入阶段都有明确名称；错误会指出失败阶段，并区分 Pixso 连接/协作异常与 API 能力异常。
- 原生几何只使用 `createComponent`、`createRectangle` 与 `appendChild`；不依赖 SVG 节点导入或转换 API。
- 清理失败节点会先检查 `removed`，避免对已经被 Pixso 自动移除的节点再次调用 `remove()`。
- 写入后进行有限次数回读确认；连接超时不会自动重试创建，避免产生重复组件。
- 不使用 `commitUndo`，不读取或修改 `Coremail`，不移动旧节点，不替换任何现有组件槽位。
- 使用新的插件 ID，保留 v5 作为回滚版本，避免 Pixso 继续复用旧缓存。

## 当前不负责的内容

- 不会把图标实例插入 Button、Input、Search 或 Sidebar。
- 不会修改已有共享组件、页面模板或实例。
- 槽位绑定与页面替换仍由后续 MCP 在实时读取 GUID 后单步执行。

## 故障恢复

如果出现 `S_Guid not exist`、`token expired`、`timeout` 或 `server`：

1. 关闭 Pixso 当前插件并重新登录/重新打开文件。
2. 重新加载 v8 的 `manifest.json`。
3. 只运行“连接自检（只读）”；自检未通过前不要运行创建命令。
4. 自检通过后再运行创建命令；若提示已存在，以回读到的组件 ID 为准，不要重复创建。
