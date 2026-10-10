# Pixso MCP Workflow

Use this reference before reading or writing a Pixso design.

For Text-to-UI whole-page HTML imports, this is not the normal executor. The
native Text-to-UI Pixso plugin is required because it provides the higher-
fidelity single-transaction path. Use MCP whole-page execution only in an
explicit converter diagnosis or after the user approves an emergency fallback;
never switch automatically because the plugin is disconnected.

## Connection

- MCP server name: `pixso`
- Default endpoint: `http://127.0.0.1:3667/mcp`
- Keep Pixso running with the target design file open and active.
- Inspect the live tool schemas before the first operation. Treat them as authoritative because the desktop MCP may evolve.
- The installed official Codex plugin may add workflow guidance, but it does
  not replace this local Desktop MCP or add a second HTML renderer. Do not
  register a remote STDIO proxy under the same `pixso` server name for this
  local-file workflow.
- If the server reports a missing session ID during a raw HTTP probe, complete the MCP `initialize` handshake and reuse the returned `mcp-session-id`. A normally configured Codex MCP connection handles this automatically.

## Target page and path preflight (failure-derived)

Treat the destination as an explicit identity, not as whatever Pixso currently
has selected. Keep these values separate in the task record:

- `browserHtmlPath`: the browser-checked source artifact;
- `pixsoImportHtmlPath` and any ZIP/HTML entry: the Pixso-specific import copy;
- `libraryPageName`/`libraryPageId`: normally `NewComponents` for strict reuse;
- `targetPageName`/`targetPageId`: the product page that owns the final Pattern;
- `targetFrameScope` and the freshly read `sourceFrameId`/component GUIDs.

An absolute file path is not a Pixso page ID. Do not derive a page from a
current selection, a same-name Frame, an old screenshot, an import archive, or
a cached GUID. Before every write, call `fetch_context` and enumerate pages with
`get_top_level_frames({"type":"page"})`; compare the active page ID and name
with the recorded phase target. Normalize only harmless case/whitespace; do
not accept a near match or an ambiguous duplicate.

Strict reuse has two explicit phases:

1. Focus `NewComponents`, verify the active page, and resolve/read back each
   source component, its containing page, variant, slots, SVGs, and Tokens.
2. Re-read the active page after the library phase, focus the recorded product
   page, re-enumerate pages, and only then create linked instances or page-owned
   content there.

If any page ID/name, frame scope, or source GUID is missing, stale, foreign, or
unexpected—or if the MCP cannot switch/focus pages—stop all writes, including
`code_to_design`, `apply_design`, bindings, replacement, and deletion. Preserve
the prepared HTML/import artifacts and ask the user to focus the exact target
page, using a fixed confirmation such as `已切换 Coremail`. Treat that reply as
a request to re-check, not as proof. If three consecutive checks still show the
same page, mark the Pixso stage blocked and report that no Pixso write occurred;
do not keep polling or create a replacement Frame on the wrong page.

## Creation Sequence

1. Read the active profile in `assets/design-system/mapping-registry.json`, then run
   `node scripts/validate-mapping-registry.mjs` and
   `node scripts/sync-mapping-registry.mjs --check`.
2. Run `node scripts/build-pixso-token-manifest.mjs --check`,
   `node scripts/build-token-runtime-map.mjs --check`, and
   `node scripts/build-dual-output-token-map.mjs --check`. If any output is
   stale, regenerate the chain in that order, then rerun all three checks. Read
   the active mapping profile and the generated
   `pixso-variables.json`, `token-runtime-map.json`,
   `dual-output-token-map.json`, and `references/pixso-component-bindings.md`.
3. Call `fetch_context` with `include_schema: false`; use `include_map: false` for a new creation task.
4. Load the relevant Pixso guideline topic, usually `web-app` and `design-system` for HarmonyOS PC application work.
5. Read variables, shared styles, components, and top-level Frames in grouped calls. Reuse approved resources before creating one-off layers.
6. Create the first editable direction:
   - In `html-first`, use the exact HTML draft already browser-checked at the
     approved viewport as the Web checkpoint.
   - In `visual-first`, generate a temporary static HTML renderer from the
     validated `page-spec.json`.
   - For fast visual import (`reuseStrategy: "import-and-repair"`), use
     `code_to_design` once to import the complete browser-checked composition;
     NewComponents discovery is optional and cannot block this call.
   - For strict structured reuse, when the strict registered-reuse plan
     contains registered regions, use `code_to_design` only for a
     low-complexity Pattern skeleton and page-owned content. Insert the
     registered regions as linked instances from NewComponents before local
     refinement.
   - When no registered regions are in scope, use `code_to_design` once to
     import the composed screen layout.
   - Use `apply_design` only for variable/style bindings, linked atomic
     component replacement, and small local corrections. Do not use it as a
     second independent whole-page layout engine.
   - Assume every imported style is a literal until live read-back proves a
     `$variable/path` or shared Style binding. Repair the complete Frame before
     requesting visual approval.
   - Before `code_to_design`, run `scripts/validate-pixso-import-package.mjs`
     against the exact import ZIP with the recorded `fast` or `strict` mode.
     A failed package check is a local artifact failure; do not spend a Pixso
     call on it. In strict mode, the check must pass semantic markers and
     variable-color source usage, but only live Pixso read-back proves the
     component instances and `$variable` bindings.
   - The call must receive exactly one final `htmlStr` or `htmlBufferBase64`.
     A ZIP is required when CSS, fonts, SVGs, or images are external to the
     entry HTML; never pass a URL, path, placeholder, or both input fields.
6. Obtain the new top-level Frame ID with `get_top_level_frames` or the returned operation result.
7. Run `check_layout` with `problemsOnly: true` on the affected Frame.
8. Run `take_screenshot` on the affected Frame. Inspect content completeness,
   page and pane dimensions, typography (font, size, weight, line-height and
   wrapping), whitespace, sizing, color/opacity, border/radius/shadow,
   responsive or minimum-window behavior, missing assets/icons, clipping, and
   overlap. Report concrete node IDs or selectors for every finding.
9. Fix every visible or reported issue, then repeat layout check and screenshot.

10. Run a structural read-back in addition to `check_layout`. For the affected
    Frame, compare every descendant's `absoluteBoundingBox` with the root
    bounds and record the count and examples outside the root. Also inspect
    the auto-layout direction of major shell containers. `check_layout: null`
    is not visual proof: the HTML converter can produce a formally valid
    horizontal stack in which the body starts at `x = root.width`, leaving
    most of the page outside the frame. Repair that same container direction,
    size, or child position before style or component work.

## Registered reuse, performance, and icon gates

Read `pixso-fidelity-routing.md`, `registered-reuse-mode.md`, and
`pixso-performance.md` before a Pixso write. The selected route is part of the
write contract: fast visual import may keep page-owned literals, while strict
structured reuse must bring verified NewComponents instances and Pixso
Variables into the target page together.
For fast visual import, the HTML draft remains the source for the Web
checkpoint and Pixso imports the complete composition once; do not block on a
component-library audit. For strict structured reuse, when the planner finds
registered regions, the HTML draft remains the source for the Web checkpoint,
but Pixso imports only a low-complexity Pattern skeleton and page-owned
content. The registered components are inserted as linked instances from the
exact component-library page; code_to_design must not be used as a second
renderer for those regions.

The component-library page for strict structured reuse is NewComponents.
Follow the Target page and path preflight above for both phases. During the
library phase, compare the active page from fetch_context and each candidate
component's containing page; after switching to the target product page,
re-enumerate and compare again immediately before creating instances. The
target page does not need to be NewComponents. A same-name Frame, stale GUID,
detached node, icon_font, imported layer name, or component from another page is
not component reuse. Fast visual import may keep a page-owned Frame instead of
an instance and must report that distinction.

After import, run an icon crop audit on every generated icon wrapper and
linked icon slot. The wrapper must not clip content, the SVG root and
internal vector must use the same 24 by 24 source geometry, and the visible
16px, 20px, or approved 24px display size must be centered without cropping.
For outline icons, the same audit must preserve the effective stroke mapping:
24px = 1.5px, 20px = 1.25px, and 16px = 1px. Keep the 1.5px source stroke on
the 24 by 24 artboard and scale the root and internal vectors together; do not
correct stroke weight by independently scaling or redrawing a path.
Do not pass the browser sprite artifact directly to `code_to_design`. Create
the Pixso-specific import copy first:

```bash
node scripts/prepare-pixso-html.mjs --in /absolute/path/to/browser.html --out /absolute/path/to/browser.pixso.html --strict
```

The import copy contains inline exact-source SVG geometry and carries
`data-icon-alias`, `data-icon-source`, `data-display-size-token`, and
`data-pixso-overflow="visible"` on each icon wrapper. Do not leave sprite use
elements or `icon_font` conversions as final Pixso icons. A crop finding blocks
strict parity until the exact SVG or linked NewComponents instance is repaired.

Use one grouped discovery pass, one code_to_design call, batched edits, and
targeted read-backs. Record call count, slowest call, code_to_design duration,
node count, retries, and whether the performance budget aborted the stage.
After one bounded retry for a failed call, return the HTML draft and report
the Pixso limitation instead of continuing serial full-frame retries.

## Page Binding Bridge（页面 Token 快速通道）

当目标是“先把 HTML 页面视觉稿导入，再低成本补齐页面 Token”时，使用
`scripts/pixso-page-binding-bridge-plugin`，不要调用组件注册同步插件代替它。两者边界如下：

### 双轨标记协议

HTML 使用 `assets/design-system/tokens.utility.css` 提供的 Tailwind-like `u-`
前缀 Class 控制浏览器视觉，例如 `u-bg-neutral-light-100`、`u-p-space-5`
和 `u-type-body-l`。这些 Class 不是 Pixso 绑定凭证，因为 `code_to_design`
可能不会保留原始 Class 名称。

每个要映射到 Pixso 的页面目标同时带有稳定的
`data-px-key="pane.primary.surface"`。预处理脚本把它转为
`id="px-key:pane.primary.surface"`，插件按语义 key 查找节点，再按
`page-binding-manifest.json` 的 `token` 与 `property` 绑定变量。插件不按
hex、图层可见名称或 CSS Class 猜测变量。

1. `prepare-pixso-html.mjs` 负责把精确 SVG 复制到 Pixso 导入副本；随后
   `prepare-pixso-binding-html.mjs` 为带 `data-px-key` 的页面节点补充稳定语义标记。
2. 在 Pixso 中确认活动页严格为目标产品页（当前 Coremail 为 `coremail`），并选中最终 Frame。
3. 运行“预检当前页面绑定（只读）”。页面不匹配、Frame 不唯一、标记缺失或变量名重复时，预检失败且后续绑定不执行。
4. 预检通过后运行“批量绑定当前页面 Token”，只绑定 manifest 声明的 `fills`/`strokes`，每个写入都必须 read-back 验证。
5. 运行“审计当前页面绑定（只读）”，使用 `scripts/validate-page-binding-audit.mjs` 检查 `schemaVersion: 1`、一致的受管分母与零未验证绑定。

这是页面 Token 的快速通道，不等于 strict registered reuse：它不创建或替换 NewComponents 实例，也不宣称整页所有文字、间距和组件都已绑定。需要 Pixso 原生组件实例时，仍回到 NewComponents 的严格两阶段解析，并使用新鲜的 Variant GUID。

## Token Gate

Use `assets/design-system/pixso-core-baseline.json` as the complete Pixso
variable scope: 127 production variables across four collections.
The Color collection contains the complete 56-variable primitive palette from
`assets/design-system/core-color-token-table.md`: Brand, Neutral Dark, Neutral
Light, Function, and Multi. Do not create semantic color aliases in Pixso;
components bind these core variables directly. Spacing, Size & Layout, and
Typography likewise contain primitives only. Code-side semantic and component
aliases resolve through `token-runtime-map.json`; they never become additional
Pixso variables.
Use the generated `scripts/pixso-token-sync-plugin/manifest.json` to update the
baseline in Pixso. It idempotently creates or updates the four approved
collections and 127 variables.
Use `assets/design-system/pixso-manual-additions.json` as the complete list of
approved additions. Its current count is zero.

### Manually added variables

Do not manually add page, component, or semantic variables. Reuse the approved
primitive that resolves to the same value and keep the semantic name in
CSS/JSON:

| Collection | Use for | Naming examples |
| --- | --- | --- |
| `Color` / `Light` | 56 approved colors | `brand/100`, `neutral-dark/05` |
| `Spacing` / `Compact` | Eight spacing primitives | `space/3`, `space/6` |
| `Size & Layout` / `Desktop` | Size, radius, width, height, divider, opacity primitives | `size/40`, `radius/08`, `layout/width/360`, `opacity/40` |
| `Typography` / `HarmonyOS Sans` | Atomic font family, size, line-height, weight, letter spacing | `font/size/14`, `font/weight/500` |

To extend the baseline, first add a genuinely new primitive to the Token source,
update the baseline, regenerate all three mapping artifacts, and pass the
release gate. Never solve a page-level need by adding `component/*`,
`layout/shell/*`, `gap/*`, or `padding/*` variables. Create shadows as Effect
Styles and complete text treatments as Text Styles.

Do not create components or patterns until the active Pixso file passes this gate:

For a free team or a file at the variable-collection limit, first load
`scripts/pixso-token-probe-plugin/manifest.json` and run “写入 3 个测试变量”.
The probe reuses `Color`, `Size & Layout`, and `Typography`; it does not create
another collection. Run “清理测试变量” after verification.

1. Confirm the target file is active and its intended font appears in `fetch_context`.
2. Create temporary color, number, and string variables in the existing approved collections. Do not create a fifth collection.
3. Verify persistence with all three read paths: `read_variables`, `get_variable_sets`, and `get_variables`. A generated GUID from `write_variables` is not proof of persistence.
4. Bind a temporary node to the probe color and number. Treat every unresolved-variable warning as a failed gate.
5. Delete the temporary node and collection.
6. Only after the probe passes, sync the generated manifest in small batches and compare the Pixso read-back count to the manifest summary.

## Binding Audit

After import or repair, query the top-level Frame without resolving variables.
In strict structured reuse, record every mapped binding, linked component
instance, and remaining literal style finding in `pixso-binding-audit.json` and
validate it with:

```bash
node scripts/validate-dual-output.mjs \
  --page-spec /absolute/path/to/page-spec.json \
  --pixso-audit /absolute/path/to/pixso-binding-audit.json
```

An empty hardcoded-color search is not enough in strict mode: every page-spec
variable must appear in the live binding list. In fast visual import, record the
bindings that were actually proven and list remaining literals as known import
limits; do not run the strict zero-literal claim. Read
`dual-output-contract.md` for the complete contract.

Also record a whole-Frame `coverageSummary`: unique nodes, color-bearing nodes,
variable-bound color nodes, literal-paint nodes, layer-opacity literal nodes,
and intrinsic-alpha paints. The zero-literal gate applies only to strict
structured reuse; fast visual import reports the same counts without treating
remaining literals as a blocker.

Pixso may serialize a translucent variable such as `$neutral-dark/90` as both
the variable name and its intrinsic alpha (for example, `opacity: 0.898`) on the
paint. Do not classify that read-back as double opacity. Rebind one
representative node to the same variable, read it again, and separately inspect
the node-level opacity. Only an additional node/layer opacity is a second
opacity operation.

If a linked component's internal icon or text layer exposes no bindable color
property, record it in `componentColorFindings` as a component-library gap.
Do not detach or locally restyle the instance to make the page audit pass.

If `write_variables` returns GUIDs but both native read tools remain empty, the desktop MCP variable writer is not persisting data. Do not hardcode component values. Generate the fallback artifacts with:

```bash
node scripts/build-pixso-token-manifest.mjs --write
```

Then load `scripts/pixso-token-sync-plugin/manifest.json` as a Pixso development plugin and run “同步 Token” in the target file. The plugin uses Pixso's official `pixso.variables` API and is idempotent. `assets/design-system/pixso-tokens-studio.json` is the alternative Tokens Studio import file. After either fallback, rerun all three read checks before continuing.

## Existing Design and HTML Handoff

1. Re-read the current Pixso document after the user has made edits.
2. Resolve the exact page and top-level Frame; do not rely on a stale GUID from a previous active document.
3. Synchronize approved structural, content, state, and interaction changes into `page-spec.json`.
4. Use `get_screenshot` for visual reference and `design_to_code` for supported output stacks (`html`, `react`, `vue`, `arkui`, or `flutter`) when the live tools provide them.
5. Treat the latest Pixso state as authoritative over the initial HTML draft, previous HTML, or cached observations.
6. Regenerate or reconcile the final implementation from the synchronized contract, then compare it at the approved desktop viewport, normally `1728 × 1152px`.

## Failure Handling

- `please open a design file`: ask the user to open and focus the intended Pixso design file, then call `fetch_context` again before any retry.
- `activePageMismatch`: when `get_all_components` reports a component in a different Pixso page than the page returned by `fetch_context`, treat the component as read-only discovery evidence. Do not mutate it by guessed or colliding node ID. Ask the user to open/focus the component-library page, refresh `fetch_context`, and re-resolve the component GUID before any repair or linked-instance replacement.
- A read returns nodes from an unexpected file: stop mutations, refresh context, confirm the active page/Frame, and never edit by a stale GUID.
- `code_to_design` succeeds but native edits fail: report partial capability honestly; do not claim full structured-edit QA.
- `code_to_design` succeeds but the Frame has major absolute-bounds overflow,
  clipped regions, or an obviously wrong auto-layout direction: classify it as
  an import-geometry failure. Repair the existing Frame when the cause is
  deterministic; otherwise preserve the artifact and report the limitation.
  Do not invoke a second whole-page renderer to mask the mismatch without
  explicit user approval.
- Do not fall back to Sketch or Figma unless the user explicitly requests that tool in the current task.

## Deliverable Reference

Report the Pixso page name, top-level Frame name, GUID, and Pixso URL when available. Include the final screenshot and HTML path after the approval-to-code phase.
