# Pixso 视觉快速通道与 Token/组件精化通道

HTML 与 Pixso 不是同一个步骤的两种写法。接到同时交付 HTML 和 Pixso 的任务时，先在需求确认阶段选择且只选择一条 Pixso 通道；不能在导入失败后悄悄从严格通道降级到快速通道，也不能把快速导入的结果描述成 Pixso 原生组件实例和变量都已绑定。

## 1. 通道选择

| 通道 | 目标 | NewComponents | Token/变量 | 组件实例 | `code_to_design` |
| --- | --- | --- | --- | --- | --- |
| 视觉快速通道 (`fast visual import`) | 尽快得到与已验收 HTML 同状态、同几何的可编辑 Pixso Frame | 首次导入不要求 | 导入值先视为字面值；只记录实际读回成功的绑定 | 页面自有 Frame；只替换能准确验证的局部实例 | 浏览器验收后的静态快照只调用一次 |
| Token/组件精化通道 (`strict structured reuse`) | 得到可复用的 Pixso 原生组件实例、完整变量绑定和可审计的设计稿 | 必须先在 `NewComponents` 阶段验证 | 所有使用到的颜色、间距、尺寸、字体和效果都必须绑定 Pixso 变量/样式 | 每个声称复用的区域必须是真实 `type: "instance"`，指向新鲜 Variant GUID | 只导入低复杂度 Pattern 骨架和页面自有内容；组件区域由实例装配 |

### 视觉快速通道

适用于“先看效果、速度优先、允许页面自有 Frame”的任务：

1. 使用浏览器已验收的 `1728 × 1152 CSS px` 静态导入副本和同一个 `data-visual-state-id`。
2. 通过 ZIP 防错检查后调用一次 `code_to_design`，不把动态运行时空壳送入 Pixso。
3. 先验收边界、列表/详情内容、字体、图标裁切和交互快照；不等待组件库审计。
4. 可选地运行非严格复用规划，只有能读回真实 Variant、槽位和颜色变量的区域才做局部替换。
5. 交付记录必须区分：`visualImported: true`、已证明的 Token 数量、已证明的实例数量和仍为字面值/页面自有 Frame 的区域。

快速通道的最低要求不是“什么都不绑定”，而是“不要虚报绑定”：颜色、间距或组件若没有实时读回 `$variable`、共享样式或 `type: instance`，就列为已知限制。

### Token/组件精化通道

适用于用户要求“引用组件库、所有变量绑定、可复用 Pixso 原生组件实例”时：

1. 先运行严格复用规划和 Token 映射检查，确认 `NewComponents` 页面、真实组件/Variant、可编辑文字槽位、精确 SVG 图标和变量集合均可用。
2. 在 `NewComponents` 完成源组件阶段验证后，再切换到目标产品页并重新核对页面身份；任何 stale GUID、同名 Frame、`icon_font`、detached node 或找不到槽位都是硬阻塞。
3. HTML 仍使用 canonical CSS 变量；导入 ZIP 中必须保留 `data-px-key`/`px-key:` 语义标记，作为页面层到 Pixso 层的绑定桥。`class` 只负责浏览器视觉，不能作为唯一绑定凭证。
4. 组件区域只使用真实 linked instance；读回必须同时证明 `type: "instance"`、`mainComponent`、Variant/override 映射和槽位可编辑。`data-component` 只是逻辑标记，不等于 Pixso 实例。
5. 所有颜色必须使用变量颜色：
   - HTML 的 `color`、`background`、边框、阴影、SVG `currentColor` 和状态色都从 canonical CSS 变量消费；页面/组件 CSS 禁止 hex、RGB/HSL、命名色或任意 Tailwind 色值。
   - Pixso 的每个颜色承载节点都必须读回 Color collection 中的 `$brand/*`、`$neutral-*/*`、`$function/*` 或 `$multi/*` 变量；`fillPaints`/`strokePaints` 写入 `$token` 后，再用 `query_nodes`/节点读回证明。
   - SVG 图标默认继承绑定后的 `currentColor`；多色图标的每个可编辑 paint 都要分别绑定变量。透明遮罩只能作为明确记录的 intrinsic alpha 例外，不能用来掩盖不透明硬编码颜色。
   - 导入前 ZIP 检查只能证明源码没有硬编码颜色；严格通道仍必须在 Pixso 导入后做变量读回，`variableBoundColorNodes === colorBearingNodes`（或加上已记录的 intrinsic alpha）才算通过。
6. 严格通道任何一项未通过都停止 Pixso 写入，保留已验证 HTML 和导入包，报告缺失的组件/变量/槽位以及下一步修复，不用页面自绘样式冒充组件库。

## 2. 两条通道共用的导入包契约

无论通道，送入 Pixso 的 ZIP 都必须是“单入口、可静态还原、同状态”的导入包：

- 只允许一个入口 HTML（默认 `index.html`），包含 `<!doctype html>`、`<html>`、`<body>`。
- 入口引用的本地 CSS/SVG/脚本必须全部存在于 ZIP 内，禁止绝对路径、`..` 穿越、`node_modules`、`.git` 和空壳运行时依赖。
- 必须保留 `data-visual-state-id` 和 `data-canvas-size="1728x1152"`；页面契约声明的列表、详情、表格或图表等动态区域必须有静态子节点、可见文本和非零尺寸。
- 严格包还必须包含足够的 `px-key:` 绑定标记、Token Classes/语义键和变量颜色写法；没有这些标记只能按快速视觉包处理。
- 防错检查应在 `code_to_design` 前运行；失败时不调用 Pixso，修复并重新生成唯一的 canonical ZIP。

## 3. 推荐命令顺序

```bash
# 视觉快速通道
node scripts/validate-pixso-import-package.mjs \
  --zip /absolute/path/to/pixso-import.zip \
  --mode fast \
  --manifest /absolute/path/to/visual-parity.json

# Token/组件精化通道
node scripts/plan-registered-reuse.mjs \
  --page-spec /absolute/path/to/page-spec.json \
  --out /absolute/path/to/registered-reuse-plan.json \
  --strict
node scripts/validate-pixso-import-package.mjs \
  --zip /absolute/path/to/pixso-binding-import.zip \
  --mode strict \
  --manifest /absolute/path/to/visual-parity.json
```

包检查通过只代表“可以安全送入 Pixso”；严格通道的最终通过仍需要 Pixso 实时读回组件实例和 `$variable` 绑定。
