# Design System

> Fill this file first. This is the human-readable source of truth for UI design, Pixso generation, HTML/CSS, and Tailwind output.

## 1. Product Context

### Product

- Product name:
- Product type: HarmonyOS desktop application
- Industry:
- One-sentence description:

### Platform Contract

```text
Target OS: HarmonyOS
Device class: PC desktop
Interface type: desktop application UI
Primary language: Simplified Chinese
Mobile output: out of scope
Visual output: editable high-fidelity Pixso
Interaction output: browser-runnable HTML prototype
```

Pixso and HTML must be generated from the same source-of-truth tokens, component variants, state rules, layout rules, and content hierarchy. HTML is an interactive desktop application prototype and behavior reference, not a generic responsive website or marketing page. Do not introduce page-specific visual values when an approved token or component rule exists.

Reusable and dual-output pages must first declare the same structure in a
validated `page-spec.json`: Shell and Pane roles, layout Tokens, logical atomic
components, text slots, semantic icon aliases and display sizes, interactions,
and preserved state. HTML renders this specification directly. Pixso imports
the specification's temporary HTML layout, then binds Tokens and replaces only
eligible atomic nodes with the active registered providers. Shell, Pane, and
List Detail structures remain rule-composed Auto Layout Frames.

### Users

- Primary users:
- User goals:
- User skill level:
- Usage frequency:

### Primary Workflow

- Main workflow:
- Primary user action:
- Secondary actions:
- Success state:

### Tone

- Brand personality:
- UI tone:
- Copywriting tone:
- Style keywords:

Examples:

```text
calm, enterprise, focused, precise, modern, warm, technical, editorial, playful
```

## 2. Source of Truth

### Priority Order

Fill or adjust the priority for this project:

```text
1. Pixso components / Color Variables / Text and Layer Styles:
2. design.md:
3. tailwind.config.js:
4. global.css / CSS variables:
5. Existing page/component code:
6. User description:
7. shadcn preset/component defaults:
```

### Existing Sources

- Pixso file:
- Pixso library:
- Existing codebase:
- Existing global CSS:
- Tailwind config:
- Component library: shadcn/ui
- shadcn preset: b7ClMfrGK
- New Next.js init: `npx shadcn@latest init --preset b7ClMfrGK --template next`
- Brand guide:
- Reference pages:

shadcn is the default component source for new reusable Next.js projects. Its preset defaults are implementation assets, not design truth; map this document's tokens over the generated theme and component variants.

## 3. Assets

### Asset Folder

```text
assets/
├── logos/
├── icons/
├── images/
├── illustrations/
├── screenshots/
└── fonts/
```

### Logos

- Primary logo:
- Mark/icon:
- Dark version:
- Light version:

### Icons

- Source priority: user-provided exact SVG → approved project semantic alias → Lucide → HarmonyOS Symbol → documented manual fallback. A higher-priority asset must not be silently replaced by a lower-priority source.
- Lucide is the default broad-coverage library for common product, business, navigation, file, communication, data, device, and industry concepts. It is installed locally as the `lucide` package and must be accessed through project semantic aliases rather than guessed raw icon names in reusable components.
- Lucide source geometry is generated only through `scripts/export-icon-sprite.mjs` from `assets/icons/icon-aliases.json`. Never hand-author or approximate a Lucide path that exists in the pinned package; every HTML output containing icons must pass `scripts/audit-icons.mjs --strict`.
- HarmonyOS Symbol remains the source for HarmonyOS-specific concepts and already-approved HarmonyOS glyphs. It is vendored under `assets/icons/harmonyos/`; the official 433 category entries resolve to 404 unique SVG files in `catalog/regular/`.
- Source artboard: 24 × 24.
- Lucide is the single general-purpose icon library. Use the pinned package geometry with project stroke width `1.5px`, `stroke-linecap: round`, and `stroke-linejoin: round`.
- HarmonyOS Filled is not part of the Text-to-UI icon system. Do not generate, map, or select Filled variants.
- Special assets such as Titlebar controls and the Checkbox mark remain exact vendored SVGs and are resolved only through semantic aliases.
- Installation: `lucide@1.24.0` is project-managed through `package.json` and `pnpm-lock.yaml`. HarmonyOS Symbol remains project-vendored SVG.
- Selection: define the action/object/state meaning first, search Lucide using canonical English concepts, shortlist 2–3 candidates, render them at the actual 16/20/24px usage size, visually compare, then bind the chosen asset to a semantic alias. Never select solely from a Chinese label or the first filename match.
- Manual fallback: draw a 1.5px icon only when no approved source has a suitable glyph. Mark the asset as a fallback and keep it outside official library folders.
- Full selection and alias rules: `references/icon-selection.md`.

### Images / Illustrations

- Image style:
- Illustration style:
- Product screenshot style:

### Fonts

- Font files:
- External font allowed: yes/no
- Fallback fonts:

## 4. Tokens

## 4.1 Colors

Color source of truth:

```text
Machine-readable values: tokens.colors.json
Pixso adjustment table: core-color-token-table.md
Pixso collection: Color / Light
Core families only: Brand, Neutral Dark, Neutral Light, Function, Multi
```

The complete palette has 56 variables. Brand, Neutral Dark, and Neutral Light
each use `05, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100`. Function contains
only Success, Warning, and Danger at `10, 20, 100`. Multi contains eight unique
categorical colors. No two core variables share the same canonical value.

In Pixso, bind components directly to these core variables. Do not create
additional `surface/*`, `text/*`, `status/*`, `badge/*`, `gray/*`, `black`, or
`white` variables. In implementation code, the compact semantic aliases below
may remain for component readability, but each must resolve to one core color
and must never be synchronized back to Pixso as another color variable.

Opacity scales use 8-digit hex values. The number key represents intended
opacity percentage. Pixso may round the displayed alpha channel while
preserving the same percentage.

### Core

```css
--color-bg: var(--color-neutral-light-100);
--color-bg-subtle: var(--color-neutral-dark-05);
--color-surface: var(--color-neutral-light-100);
--color-surface-raised: var(--color-neutral-light-100);
--color-surface-muted: var(--color-neutral-dark-05);
--color-titlebar-normal-bg: transparent;
--color-titlebar-unfocus-bg: transparent;
--color-overlay: var(--color-neutral-dark-40);
--color-dialog-bg: var(--color-surface-raised);
--color-modal-bg-white: var(--color-surface-raised);
--color-modal-bg-gray: var(--color-surface-muted);
--color-secondary: var(--color-neutral-dark-05);
--color-secondary-hover: var(--color-neutral-dark-10);
--color-accent: var(--color-brand-100);
--color-accent-hover: var(--color-accent);
--color-accent-hover-layer: var(--color-neutral-dark-05);
--color-sidebar-bg: var(--color-neutral-dark-05);
--color-sidebar-accent: var(--color-neutral-dark-05);
--color-sidebar-accent-text: var(--color-brand-100);
--color-sidebar-selected: var(--color-brand-10);
--color-sidebar-selected-text: var(--color-brand-100);
--color-tab-list-bg: var(--color-neutral-dark-05);
--color-tab-text: var(--color-neutral-dark-60);
--color-tab-hover-bg: var(--color-neutral-dark-10);
--color-tab-selected-bg: var(--color-white);
--color-tab-selected-text: var(--color-neutral-dark-90);
--color-tooltip-bg: var(--color-surface);
--color-tooltip-text: var(--color-text);

--color-input-border: transparent;

/* Fields on white/default page surfaces. */
--color-input-bg: var(--color-neutral-dark-05);
--color-input-bg-on-default: var(--color-neutral-dark-05);
--color-input-hover-bg: var(--color-neutral-dark-10);
--color-input-hover-bg-on-default: var(--color-neutral-dark-10);
--color-input-focus-bg: var(--color-neutral-dark-05);
--color-input-focus-bg-on-default: var(--color-neutral-dark-05);
--color-input-error-bg: var(--color-neutral-dark-05);
--color-input-error-bg-on-default: var(--color-neutral-dark-05);

/* Fields on gray/subtle page surfaces. */
--color-input-bg-on-subtle: var(--color-white);
--color-input-hover-bg-on-subtle: var(--color-white);
--color-input-hover-bg-on-subtle-layer: var(--color-neutral-dark-05);
--color-input-hover-border-on-subtle: var(--color-white);
--color-input-focus-bg-on-subtle: var(--color-white);
--color-input-error-bg-on-subtle: var(--color-white);

--color-input-error-border: var(--color-function-danger-100);
```

Input, search, textarea, and form Select controls use the same state system. Accent hover keeps `--color-accent-hover` as its base and applies `--color-accent-hover-layer` above it.

Input, search, textarea, and form Select Focus states have no border or outer focus outline. Preserve the approved focus background and text caret; Error keeps its danger border. Render remaining field outlines as inset strokes, or reserve their maximum width with a transparent border, so visual states never change component dimensions. On subtle surfaces, compose the hover background from the white base plus the `neutral-dark/05` layer.

Sidebar and its Titlebar Brand Anchor use the subtle
`--color-sidebar-bg` surface (`--color-neutral-dark-05`) over the white
application base. They form the secondary visual layer: persistent and
structurally clear, but quieter than the user's primary content.

### Text

```css
--color-text: var(--color-neutral-dark-90);
--color-text-muted: var(--color-neutral-dark-60);
--color-text-subtle: var(--color-neutral-dark-40);
--color-text-inverse: var(--color-neutral-light-100);
--color-text-brand: var(--color-brand-100);
--color-link: var(--color-neutral-dark-100);
```

Links must use an underline or another non-color affordance so they remain distinguishable from body text.

### Icon

```css
--color-icon: var(--color-neutral-dark-90);
--color-icon-muted: var(--color-neutral-dark-60);
--color-primary-level-unselected: var(--color-icon-subtle);
--color-icon-subtle: var(--color-neutral-dark-40);
--color-icon-inverse: var(--color-neutral-light-100);
```

### Border

```css
--color-border: var(--color-neutral-dark-10);
--color-divider: var(--color-neutral-dark-20);
--color-focus-ring: var(--color-brand-100);
--border-width-divider: 0.5px;
--border-width-input-default: 0px;
--border-width-input-hover: 0px;
--border-width-input-hover-on-subtle: 2px;
--border-width-input-error: 1px;
--opacity-input-disabled: 0.3;
```

### Brand

```css
--color-primary: var(--color-brand-100);
--color-primary-text: var(--color-neutral-light-100);
```

Primary hover and pressed states keep `--color-primary` as the base and apply the matching state layer above it. Do not flatten these layered states into unrelated palette values.

### State

```css
--color-success: var(--color-function-success-100);
--color-success-subtle: var(--color-function-success-10);
--color-warning: var(--color-function-warning-100);
--color-warning-subtle: var(--color-function-warning-10);
--color-danger: var(--color-function-danger-100);
--color-danger-subtle: var(--color-function-danger-10);
--color-info: var(--color-brand-100);
--color-info-subtle: var(--color-brand-10);
--color-alert-neutral: var(--color-text-muted);
--color-alert-neutral-subtle: var(--color-neutral-dark-05);
--color-badge-neutral-text: var(--color-text-muted);
--color-badge-neutral-bg: var(--color-neutral-dark-10);
--color-badge-info-text: var(--color-info);
--color-badge-info-bg: var(--color-brand-10);
--color-badge-success-text: var(--color-function-success-100);
--color-badge-success-bg: var(--color-function-success-10);
--color-badge-warning-text: var(--color-function-warning-100);
--color-badge-warning-bg: var(--color-function-warning-10);
```

### Data Visualization

```css
--color-chart-1: var(--color-multi-01);
--color-chart-2: var(--color-multi-02);
--color-chart-3: var(--color-multi-03);
--color-chart-4: var(--color-multi-04);
--color-chart-5: var(--color-multi-05);
```

### Interaction State Layers

```css
--state-layer-hover: var(--color-neutral-dark-05);
--state-layer-pressed: var(--color-neutral-dark-10);
--state-layer-selected: var(--color-neutral-dark-10);
--state-layer-focus: var(--color-brand-10);
--state-disabled-opacity: 0.4;
--state-window-unfocus-opacity: 0.4;
```

`click` is an event rather than a persistent visual state. Components should use `pressed`, `selected`, or `focus` as appropriate.

Disabled is a whole-component state. Apply `--state-disabled-opacity` (40%) once to the component root, including its background, border, text, icon, and indicators. Do not combine it with a separate disabled foreground or background color token, and do not apply opacity independently to nested children.

Window Unfocus is not Disabled. Keep the Titlebar component transparent so the owning shell segment continues to match its pane surface, then apply `--state-window-unfocus-opacity` (40%) only to the application-title group and window-control group.

Overlay uses `--color-overlay`, which directly references `--color-neutral-dark-40` (`#00000066`). Do not add another opacity layer to the overlay element.

## 4.2 Typography

Current scope: Chinese-only HarmonyOS PC desktop applications using locally installed system fonts. Mobile typography, number formatting, currency, dates, and truncation rules are deferred. Fill the primitive values first, then define semantic type roles. Pixso text styles, CSS, and Tailwind must use the same role combinations.

### Font Sources

```text
Primary UI font: system font stack
Chinese font order: HarmonyOS Sans, HarmonyOS Sans SC, PingFang SC, Microsoft YaHei
Latin font: not defined separately in the current Chinese-only scope
Display font: use the primary UI font
Monospace font: not defined in the current scope
Font source or file path: locally installed system fonts; no bundled font files
Allowed font weights: 400, 500, 700
Variable font: depends on the locally installed font; do not require variable-font features
External font loading allowed: no
License notes: rely on fonts installed on the user's operating system
```

### Font Family Tokens

Use the font stack in this exact order. `HarmonyOS Sans` is the first-priority HarmonyOS Sans family name; `HarmonyOS Sans SC` follows for installations that expose the Simplified Chinese family separately. If neither is available, macOS falls back to PingFang SC and Windows falls back to Microsoft YaHei.

```css
--font-sans: "HarmonyOS Sans", "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
--font-display: var(--font-sans);
```

Do not use `@font-face` or remote font services in the current project scope.

### Font Size Tokens

```css
--font-size-10: 10px;
--font-size-12: 12px;
--font-size-14: 14px;
--font-size-16: 16px;
--font-size-18: 18px;
--font-size-20: 20px;
--font-size-24: 24px;
--font-size-30: 30px;
--font-size-38: 38px;
--font-size-48: 48px;
--font-size-56: 56px;
```

### Line Height Tokens

Use exact pixel values for Pixso parity.

```css
--line-height-12: 12px;
--line-height-14: 14px;
--line-height-16: 16px;
--line-height-20: 20px;
--line-height-22: 22px;
--line-height-24: 24px;
--line-height-28: 28px;
--line-height-36: 36px;
--line-height-44: 44px;
--line-height-58: 58px;
--line-height-66: 66px;
```

### Font Weight Tokens

Numeric values are authoritative. Use Regular=`400`, Medium=`500`, and Bold=`700` consistently across Pixso, CSS, and generated code.

```css
--font-weight-400: 400;
--font-weight-500: 500;
--font-weight-700: 700;
```

Microsoft YaHei may synthesize `500` or `700`; visually verify these weights on Windows before release.

### Letter Spacing Tokens

```css
--letter-spacing-normal: 0;
```

### Semantic Type Styles

All styles use `--font-sans` and `--letter-spacing-normal`. Source names such as `Display_L` are normalized to kebab-case in code.

| Token | Size | Line height | Weight | Description | Usage |
|---|---:|---:|---:|---|---|
| `display-l` | 56px | 66px | 400 | 展示类标题 | 大号展示标题 |
| `display-m` | 48px | 58px | 400 | 展示类标题 | 中号展示标题 |
| `display-s` | 38px | 44px | 400 | 展示类标题 | 小号展示标题 |
| `title-l` | 30px | 36px | 700 | 主标题 | 页面主标题 |
| `title-m` | 24px | 28px | 700 | 主标题 | 标题栏文本 |
| `title-s` | 20px | 24px | 700 | 主标题 | 卡片标题、半模态弹窗标题、弹窗标题 |
| `subtitle-l` | 18px | 22px | 500 | 次标题 | 普通内容子标题、菜单标题 |
| `subtitle-m` | 16px | 20px | 500 | 次标题 | 标题辅助文本、列表文本、气泡提示主标题 |
| `subtitle-s` | 14px | 16px | 500 | 次标题 | 列表子标题、普通副标题 |
| `body-l` | 16px | 20px | 400 | 主文本 | 客户端默认正文、Sidebar、表格单元格、列表主文本、40px 菜单与操作控件 |
| `body-m` | 14px | 16px | 400 | 副文本 | 列表摘要与时间、普通描述、Toast、Label、表格表头、Checkbox / Radio / Switch 标签、Tabs 与 28px Small Button |
| `body-s` | 12px | 14px | 400 | 小号正文 | 辅助文本、次要说明、字段帮助与错误、状态标签 |
| `caption-m` | 10px | 12px | 400 | 小号说明 | 极小字号的辅助说明 |

Use each semantic style as a complete combination. Machine-readable mappings are stored in `tokens.typography.css` and `tokens.typography.json`.

### HTML ↔ Pixso Typography Mapping

Use `typography-style-map.json` as the single mapping table. New visible UI is limited to its 13 `formalStyles`: each HTML semantic role maps one-to-one to the identically sized Pixso shared Text Style under `Typography/*`.

- HTML always uses `--font-sans`, which is a browser fallback stack.
- Pixso uses only `font/family/sans = HarmonyOS Sans` and the 13 formal Text Styles. A fallback family never becomes a separate Pixso Text Style.
- `body-s` and `caption-m` are formal Pixso Text Style counterparts. The old `caption-l` token is deprecated: migrate 12px supporting text to `body-s` and 10px supporting text to `caption-m`; do not create `Typography/Caption_L`.
- `Typography/Component/*` are imported native-component dependencies, not public Text to UI styles. Do not select them for new page content; audit component references before any deletion. The unused legacy `Body_YaHei14` and `Body_YaHei16` styles were removed from Pixso.

### HTML ↔ Pixso Effect Mapping

Use `effect-style-map.json` as the single mapping table. Pixso exposes six physical styles `Effect/Foundation/shadow-1` through `shadow-6`; shared shadow Token roles are registered for Snackbar, Tooltip, Popover, Hover Card, Dialog, Alert Dialog, Semi-modal, Dropdown Menu, and Context Menu. HTML semantic names resolve to those standard component contexts. `shadow-6` is retained but has no standard role. Imported `Effect/Component/*` effects are native-component implementation dependencies, never public Text to UI effects.

### Platform Scope

```text
Platform: HarmonyOS PC desktop application
Default design frame: 1728px × 1152px
Primary design width: 1728px
Primary design height: 1152px
Supported desktop width range:
Minimum supported viewport width:
Mobile output: not in current scope
Responsive type scaling: not in current scope; support approved desktop window widths only
```

Do not scale font size continuously with viewport width. Keep semantic type roles stable across supported desktop widths.

### Deferred Rules

```text
Language scope: Simplified Chinese
Mobile typography: deferred
Number typography and formatting: deferred
Currency formatting: deferred
Date formatting: deferred
Text truncation and line-clamp rules: deferred
```

### Typography QA

- Confirm every selected font weight is available in each system-font fallback or that synthesized rendering is acceptable.
- Compare HarmonyOS Sans, HarmonyOS Sans SC, PingFang SC, and Microsoft YaHei at the same size and line height.
- Check common and long Simplified Chinese labels at supported desktop widths.
- Check text does not clip when browser zoom or system font scaling increases.
- Verify the interface remains usable when both HarmonyOS Sans family names are unavailable and the browser falls back to the next font.

## 4.3 Spacing

Current scope: HarmonyOS PC desktop application. Define spacing independently from component width and height.

### Spacing Foundation

```text
Base spacing unit: 2px
Scale type: compact hybrid scale
Minimum spacing increment: 2px
Default interface density: compact
Compact density required: yes
Negative spacing allowed: no
Arbitrary spacing values allowed: no
```

Rules:

- Use whole-pixel spacing values.
- Reserve `0.5px` for borders or dividers, not layout spacing.
- Pixso Auto Layout gaps and padding must use the same scale as CSS and Tailwind.
- Use primitive spacing tokens to build semantic spacing roles; components should prefer semantic roles.

### Primitive Spacing Scale

The token index is an ordered scale name, not a multiplier. Use the exact values below.

| Token | Value | Typical use |
|---|---:|---|
| `--space-0` | `0px` | No spacing |
| `--space-1` | `2px` | Minimum item separation and compact container inset |
| `--space-2` | `4px` | Icon-label gap and compact menu/card inset |
| `--space-3` | `8px` | Default control, field, and inline-content gap |
| `--space-4` | `12px` | Brand lockup gap and common control horizontal padding |
| `--space-5` | `16px` | Cross-group gap and standard component padding |
| `--space-6` | `24px` | Module gap and dialog padding |
| `--space-7` | `32px` | Major page-section gap |

CSS template:

```css
--space-0: 0px;
--space-1: 2px;
--space-2: 4px;
--space-3: 8px;
--space-4: 12px;
--space-5: 16px;
--space-6: 24px;
--space-7: 32px;
```

### Semantic Gap Tokens

Gap is owned by the parent Pixso Auto Layout, CSS Flex, or Grid container. Child components should not recreate the same relationship with margins.

| Token | Reference | Value | Usage |
|---|---|---:|---|
| `--gap-list-item` | `--space-1` | 2px | List 集合内相邻子项的纵向间距 |
| `--gap-selection-option` | `--space-1` | 2px | 单选块中相邻选项或按钮 |
| `--gap-tabs-list` | `--space-1` | 2px | Filled Tabs 相邻触发项 |
| `--gap-menu-item` | `--space-1` | 2px | 同一菜单中相邻菜单项 |
| `--gap-nav-item` | `--space-1` | 2px | 导航菜单中相邻选项 |
| `--gap-button-icon-label` | `--space-3` | 8px | Button 与 Split Button 中图标和文字 |
| `--gap-button-group` | `--space-3` | 8px | 同组图标按钮或同组按钮 |
| `--gap-menu-item-content` | `--space-3` | 8px | 菜单项中的图标与文字 |
| `--gap-breadcrumb-item` | `--space-3` | 8px | Breadcrumb 相邻项 |
| `--gap-subtab-item` | `--space-3` | 8px | 子页签中的相邻页签项 |
| `--gap-alert-content` | `--space-3` | 8px | 公告或 Alert 中的图标与文字 |
| `--gap-field-label` | `--space-3` | 8px | 表单标题与输入内容框 |
| `--gap-form-field` | `--space-5` | 16px | 相邻表单字段，以及多列表单的行列间距 |
| `--gap-choice-label` | `--space-3` | 8px | Checkbox、Radio 与文字 |
| `--gap-titlebar-brand` | `--space-4` | 12px | Titlebar 中 App Icon 与应用名称 |
| `--gap-cross-group-control` | `--space-5` | 16px | 非同组控件，例如输入框与操作按钮 |
| `--gap-menu-section` | `--space-6` | 24px | 导航或菜单中的不同功能模块 |
| `--gap-page-section` | `--space-7` | 32px | 页面主要内容区块 |

```css
--gap-list-item: var(--space-1);
--gap-selection-option: var(--space-1);
--gap-tabs-list: var(--space-1);
--gap-menu-item: var(--space-1);
--gap-nav-item: var(--space-1);
--gap-button-icon-label: var(--space-3);
--gap-button-group: var(--space-3);
--gap-menu-item-content: var(--space-3);
--gap-breadcrumb-item: var(--space-3);
--gap-subtab-item: var(--space-3);
--gap-alert-content: var(--space-3);
--gap-field-label: var(--space-3);
--gap-form-field: var(--space-5);
--gap-choice-label: var(--space-3);
--gap-titlebar-brand: var(--space-4);
--gap-cross-group-control: var(--space-5);
--gap-menu-section: var(--space-6);
--gap-page-section: var(--space-7);
```

### Semantic Padding Tokens

Container tokens apply on all sides. Tokens ending in `-x` are horizontal padding for fixed-height controls; their vertical alignment is controlled by component height.

| Token | Reference | Value | Usage |
|---|---|---:|---|
| `--padding-segmented-control` | `--space-1` | 2px | 分段按钮容器与内部按钮项 |
| `--padding-popup-menu` | `--space-2` | 4px | 悬浮菜单、下拉菜单容器 |
| `--padding-list-card` | `--space-2` | 4px | List Card 与内部菜单项 |
| `--padding-tooltip` | `--space-3` | 8px | 气泡提示 |
| `--padding-alert` | `--space-3` | 8px | 公告提示旧版兼容值；新实现使用左右独立 Token |
| `--padding-alert-left` | `--space-3` | 8px | 40px 公告提示左内边距 |
| `--padding-alert-right` | `--space-2` | 4px | 40px 公告提示右内边距 |
| `--padding-selection-option` | `--space-3` | 8px | 单选块中的单选项 |
| `--padding-tab-x` | `--space-4` | 12px | Tabs Trigger 水平内边距 |
| `--padding-tab-panel` | `--space-5` | 16px | Tabs Panel 内容内边距 |
| `--padding-titlebar-leading` | `--space-6` | 24px | PC Titlebar S / M / L / XL 统一左侧内边距 |
| `--padding-titlebar-trailing-s` | `--space-0` | 0px | S Titlebar 右侧内边距 |
| `--padding-titlebar-trailing-m` | `--space-3` | 8px | M Titlebar 右侧内边距 |
| `--padding-titlebar-trailing-l` | `--space-4` | 12px | L Titlebar 右侧内边距；一级页面默认规格 |
| `--padding-titlebar-trailing-xl` | `--space-5` | 16px | XL Titlebar 右侧内边距 |
| `--padding-button-sm-x` | `--space-3` | 8px | Small Button 水平内边距 |
| `--padding-split-button-main-x` | `--space-3` | 8px | Split Dropdown 左侧快捷按钮水平内边距 |
| `--padding-split-button-trigger` | `--space-0` | 0px | Split Dropdown 右侧下拉按钮内边距 |
| `--padding-list` | `--space-3` | 8px | List 容器 |
| `--padding-tag-x` | `--space-4` | 12px | 标签水平内边距 |
| `--padding-select-x` | `--space-4` | 12px | 下拉框水平内边距 |
| `--padding-textarea-x` | `--space-4` | 12px | Textarea 水平内边距 |
| `--padding-textarea-y` | `--space-3` | 8px | Textarea 垂直内边距 |
| `--padding-search-x` | `--space-4` | 12px | 搜索框水平内边距 |
| `--padding-menu-item-x` | `--space-4` | 12px | 菜单项水平内边距 |
| `--padding-button-x` | `--space-5` | 16px | 标准 40px Button 水平内边距；图标 + 文本按钮使用 `--padding-button-sm-x` |
| `--padding-card` | `--space-6` | 24px | 卡片容器 |
| `--padding-table` | `--space-6` | 24px | Table 外层容器的四边内边距 |
| `--padding-dialog` | `--space-6` | 24px | 弹窗容器 |
| `--padding-dialog-content` | `--space-6` | 24px | Dialog 内容区 |
| `--padding-modal-content-x` | `--space-6` | 24px | 半模态内容区左右内边距 |
| `--padding-modal-content-y` | `--space-0` | 0px | 半模态内容区上下内边距 |
| `--padding-modal-header-top` | `--space-3` | 8px | 半模态标题区顶部内边距 |
| `--padding-modal-header-x` | `--space-6` | 24px | 半模态标题区左右内边距 |
| `--padding-modal-footer-x` | `--space-6` | 24px | 半模态操作区左右内边距 |

```css
--padding-segmented-control: var(--space-1);
--padding-popup-menu: var(--space-2);
--padding-list-card: var(--space-2);
--padding-tooltip: var(--space-3);
--padding-alert: var(--space-3);
--padding-alert-left: var(--space-3);
--padding-alert-right: var(--space-2);
--padding-selection-option: var(--space-3);
--padding-tab-x: var(--space-4);
--padding-tab-panel: var(--space-5);
--padding-titlebar-leading: var(--space-6);
--padding-titlebar-trailing-s: var(--space-0);
--padding-titlebar-trailing-m: var(--space-3);
--padding-titlebar-trailing-l: var(--space-4);
--padding-titlebar-trailing-xl: var(--space-5);
--padding-button-sm-x: var(--space-3);
--padding-split-button-main-x: var(--space-3);
--padding-split-button-trigger: var(--space-0);
--padding-list: var(--space-3);
--padding-tag-x: var(--space-4);
--padding-select-x: var(--space-4);
--padding-textarea-x: var(--space-4);
--padding-textarea-y: var(--space-3);
--padding-search-x: var(--space-4);
--padding-menu-item-x: var(--space-4);
--padding-button-x: var(--space-5);
--padding-card: var(--space-6);
--padding-table: var(--space-6);
--padding-dialog: var(--space-6);
```

### Layout Spacing

```css
--layout-main-content-padding-x: var(--space-6);
--layout-main-content-padding-top: var(--space-5);
--layout-main-content-padding-bottom: var(--space-0);
--layout-grid-gutter: var(--space-6);
--layout-content-max-width: none;
--layout-header-padding-x: var(--space-6);
--layout-main-title-leading-padding: var(--space-6);
--layout-main-detail-action-leading-padding: var(--space-5);
--layout-sidebar-padding-x: var(--space-5);
--layout-sidebar-padding-y: var(--space-5);
--layout-primary-action-slot-gap-top: var(--space-3);
--layout-primary-action-slot-gap-bottom: var(--space-4);
--layout-secondary-list-card-inset-x: var(--space-5);
--layout-secondary-list-card-padding-x: var(--space-3);
--layout-secondary-content-axis-x: var(--space-6);
--layout-secondary-pane-padding-x: var(--layout-secondary-list-card-inset-x);
--layout-secondary-pane-padding-y: var(--space-3);
--layout-main-detail-padding-x: var(--space-6);
--layout-main-detail-padding-top: var(--space-5);
--layout-main-detail-padding-bottom: var(--space-0);
```

Multi-pane inset rules are fixed, not discretionary:

| Pane content wrapper | Left / Right | Top / Bottom | Rule |
|---|---:|---:|---|
| Primary Navigation | 16px | 16px | Navigation owns the inset once. |
| Secondary List Search / Card state envelope | 16px | 16px | Standalone Search frame and Selected/Hover/Pressed background edge. |
| Secondary List aligned content | 24px | — | Title, toolbar/meta copy, states, and row content share this x-axis. |
| Two-pane Main Content | 24px | 16px top / 0px bottom | Default page-content scroll wrapper. |
| Three-pane Main Detail | 24px | 16px top / 0px bottom | Default detail scroll wrapper; left and right remain symmetric. |

- Measure from the pane's inner edge after the 0.5px divider. The divider does not count toward padding.
- The direct scroll wrapper owns pane padding. Children use gaps for sibling relationships and never recreate pane padding with margins.
- Secondary List Pane uses a 16px surface axis and a nested 24px content axis. Keep the standalone Search frame and row state background at 16px from the pane edge. In Pattern B, Search occupies the Secondary Pane Titlebar row, while filter/sort/view actions share the 40px in-pane title row on its right. Use `--layout-secondary-list-card-padding-x` inside each row so its content lands at 24px, and align title, action group, meta copy, and list states to `--layout-secondary-content-axis-x`. State changes never move content or resize the envelope.
- Main Content and Main Detail use 24px left/right, 16px top, and 0px bottom. Their direct content wrapper owns vertical scrolling; do not add a viewport-bottom inset. Main Detail uses `default-content` unless the requirement contract explicitly names `edge-aligned`. In `edge-aligned`, only editor canvases, data grids, media, maps, or file workspaces reach the pane edge; toolbars, headers, forms, empty states, and readable copy still use the directional safe-area inset.
- Cards retain `--padding-card` internally. This internal padding is separate from the surrounding 24px pane inset and must not be applied to the page wrapper a second time.

### Desktop Grid

```text
Default design frame: 1728px × 1152px
Primary design width: 1728px
Primary design height: 1152px
Minimum supported desktop size: 1100px × 720px
Maximum content width: none
Grid columns: 12
Grid gutter: 24px
Outer margin:
Sidebar-to-content gap:
Fixed or fluid content width: fluid; right Main/Detail pane fills remaining width
```

### Density Rules

```text
Default density: compact
Compact density supported: yes, this is the default mode
Components affected by compact density: menus, navigation, segmented controls, lists, buttons, form controls
Values that change in compact density: component height and vertical padding may vary by component size
Values that must remain unchanged: primitive space scale and semantic horizontal relationships
```

### Spacing Usage Rules

```text
Page to section relationship: use --gap-page-section
Section title to content relationship: define when section-title patterns are specified
Parent padding vs child gap rule: parent owns padding and gap; children do not duplicate the same spacing with margin
Form Field / 表单字段: title and control stack vertically. The title uses the complete body-m style and --color-text; title-to-control uses --gap-field-label (8px). Adjacent fields use --gap-form-field (16px). Selection-control labels (Checkbox, Radio, Switch) use body-m. The standalone Label uses body-m, exact --height-tag (28px), --padding-tag-x (12px) on both horizontal sides, flex alignment so its text is vertically centered, --radius-tag (8px), and --color-neutral-dark-05 (neutral-dark.5) as its background.

Native Select / 原生选择器: use a real HTML `select` whose interactive box covers the complete visible control. Clicking the value, internal empty space, or trailing chevron region opens the browser or operating-system native option menu. The chevron is visual-only with `pointer-events: none`; do not replace Native Select with a custom menu, button, or partial-width hit target.
Card internal rhythm: outer inset uses --padding-card; internal content gaps remain component-specific
List and table row rhythm: standalone List containers use --padding-list. In Secondary List Pane, the scroll wrapper owns the 16px surface inset, the standalone Search frame and List Card state background fill that width, and each row uses the approved 8px horizontal padding. The resulting 24px content axis aligns title, toolbar/meta copy, states, and row content. Row height and vertical padding remain component-specific.

Pattern B Secondary List Pane anatomy: compose the second column as `standalone Search in the transparent Titlebar segment -> one scrolling inset owner -> List title + action row -> optional meta row -> List collection`. Search fills the Secondary Pane Titlebar row at the 16px surface axis without a title or adjacent action. The Renderer-owned scrolling inset owner applies 16px horizontally, `space/3` on the top, and `space/0` on the bottom. The first content row is 40px high through `--height-list-heading`; its title uses the complete `title-s` style and its Ghost actions sit on the right in the same row. The title, actions, optional meta row, and list states add the tokenized 8px nested inset and therefore align to the 24px content axis. Rows fill the 16px surface width and apply 8px horizontal padding. Selection updates Main Detail in place and does not replace the three-pane shell.

Secondary Page has two approved forms. **Continuation form:** keeps the current application shell, pane boundaries, and parent navigation selection stable while replacing only the owning Main pane. Its final-pane leading group uses a 40px Ghost Back Icon Button to the left of the `title-s` page title at the normal 24px Main Content axis. The body reuses the existing Main Content/Main Detail scroll wrapper and insets; never add a second page-padding wrapper. Back restores parent state and focus to the opening control. **New-page form:** opens an independent secondary page with a vertical layout: `Titlebar S` (40px) at the top, then content designed for the task below. Its standalone title uses `Subtitle_M` (16px / 20px / 500), not the larger `Title_S`; the component owns this size-specific typography. It does not inherit the original page's sidebar or pane layout. Hide a parent-specific Global Primary action at child depth, but retain a genuinely application-global action when valid. Do not use Dialog or Semi-modal for ordinary full-page hierarchy.

Vertical-axis alignment principle: classify edges before aligning them. Comparable control/state surfaces share a surface axis, while readable content shares a nested content axis. In Secondary List Pane, Search and List Card state backgrounds use 16px; title, toolbar/meta copy, states, and row content use 24px. Never align a full-width Search frame to the nested card-content axis or repair alignment with per-child margins and literal pixel offsets.
Dialog internal rhythm: outer inset uses --padding-dialog; header/body/footer gaps remain component-specific
Empty-state spacing: pending
Margin rule: do not create a parallel margin scale; use margin only for exceptional external placement
```

### Spacing QA

- Check every implemented spacing value resolves to a primitive or semantic token.
- Check repeated component instances use identical padding and gaps.
- Check nested layouts do not accidentally double page, section, or card padding.
- Check compact controls remain readable and clickable on desktop.
- Check Pixso Auto Layout values match CSS and Tailwind mappings exactly.
- Flag arbitrary spacing values before delivery.

## 4.4 Radius

### Primitive Radius Scale

```css
--radius-0: 0px;
--radius-1: 4px;
--radius-2: 6px;
--radius-3: 8px;
--radius-4: 12px;
--radius-5: 16px;
--radius-full: 999px;
```

`--radius-4` is the standard container radius for Cards and Tables.

### Semantic Radius Tokens

| Token | Reference | Value | Usage |
|---|---|---:|---|
| `--radius-popup-menu-item` | `--radius-1` | 4px | 悬浮菜单中的菜单项 |
| `--radius-checkbox` | `--radius-1` | 4px | Checkbox |
| `--radius-subtab` | `--radius-3` | 8px | 子页签 |
| `--radius-sidebar-nav-item` | `--radius-3` | 8px | 左侧导航菜单项 |
| `--radius-button` | `--radius-3` | 8px | 标准 Button |
| `--radius-icon-text-button` | `--radius-3` | 8px | 图标文本按钮 |
| `--radius-icon-button` | `--radius-3` | 8px | Icon Button |
| `--radius-status-button` | `--radius-3` | 8px | 状态按钮 |
| `--radius-dropdown-button` | `--radius-3` | 8px | 下拉按钮 |
| `--radius-alert` | `--radius-3` | 8px | 公告提示和 Alert |
| `--radius-select` | `--radius-3` | 8px | 下拉框 |
| `--radius-input` | `--radius-3` | 8px | 文本输入框 |
| `--radius-textarea` | `--radius-3` | 8px | 多行文本框 |
| `--radius-tooltip` | `--radius-2` | 6px | Tooltip |
| `--radius-search` | `--radius-3` | 8px | 搜索框 |
| `--radius-number-input` | `--radius-3` | 8px | 数字选择器 |
| `--radius-tag` | `--radius-3` | 8px | 标签 |
| `--radius-selection-block` | `--radius-3` | 8px | 单选块 |
| `--radius-selection-option` | `--radius-2` | 6px | 单选块中的单选项 |
| `--radius-tab` | `--radius-3` | 8px | Tab |
| `--radius-list` | `--radius-4` | 12px | List 集合容器 |
| `--radius-list-item` | `--radius-3` | 8px | List 子项 |
| `--radius-badge` | `--radius-full` | 999px | Badge |
| `--radius-progress` | `--radius-full` | 999px | Progress 轨道与指示条 |
| `--radius-avatar` | `--radius-full` | 999px | Avatar |
| `--radius-card` | `--radius-4` | 12px | Card 与 Metric Card |
| `--radius-table` | `--radius-4` | 12px | Table 外框 |
| `--radius-pagination-item` | `--radius-3` | 8px | Pagination 项 |
| `--radius-dialog` | `--radius-5` | 16px | 弹窗 |
| `--radius-modal` | `--radius-5` | 16px | 模态弹窗 |

```css
--radius-popup-menu-item: var(--radius-1);
--radius-checkbox: var(--radius-1);
--radius-subtab: var(--radius-3);
--radius-sidebar-nav-item: var(--radius-3);
--radius-button: var(--radius-3);
--radius-icon-text-button: var(--radius-3);
--radius-icon-button: var(--radius-3);
--radius-status-button: var(--radius-3);
--radius-dropdown-button: var(--radius-3);
--radius-alert: var(--radius-3);
--radius-select: var(--radius-3);
--radius-input: var(--radius-3);
--radius-textarea: var(--radius-3);
--radius-tooltip: var(--radius-2);
--radius-search: var(--radius-3);
--radius-number-input: var(--radius-3);
--radius-tag: var(--radius-3);
--radius-selection-block: var(--radius-3);
--radius-selection-option: var(--radius-2);
--radius-tab: var(--radius-3);
--radius-list: var(--radius-4);
--radius-list-item: var(--radius-3);
--radius-badge: var(--radius-full);
--radius-progress: var(--radius-full);
--radius-avatar: var(--radius-full);
--radius-card: var(--radius-4);
--radius-table: var(--radius-4);
--radius-pagination-item: var(--radius-3);
--radius-dialog: var(--radius-5);
--radius-modal: var(--radius-5);
```

Pending semantic role: popup menu container. No circular Button component or circular-button size token is defined; do not invent one.

## 4.5 Size and Dimensions

The token index is an ordered scale name, not a multiplier. Use exact pixel values in Pixso and CSS.

### Primitive Size Scale

```css
--size-1: 4px;
--size-2: 6px;
--size-3: 8px;
--size-4: 12px;
--size-5: 16px;
--size-6: 20px;
--size-7: 24px;
--size-8: 28px;
--size-9: 32px;
--size-10: 36px;
--size-11: 40px;
--size-12: 44px;
--size-13: 48px;
--size-14: 56px;
--size-15: 64px;
--size-16: 72px;
--size-17: 80px;
```

### Icon Size Tokens

All rendered sizes scale from the HarmonyOS Symbol 24 × 24 source artboard. The
24 × 24 coordinate system is not the default display size. Every icon request
declares a semantic size Token and resolves to 16px, 20px, or an explicitly
approved 24px. Preserve the original viewBox while scaling the SVG root and its
internal vector geometry together. In Pixso, shrinking only the outer container
around unchanged 24px geometry is invalid. Official SVG paths use Regular
weight and `currentColor`; do not apply a page-level stroke width.

For outline icons, the source stroke is 1.5px on the 24 × 24 artboard. Scale
the root and internal vectors uniformly so the effective display stroke is
1.5px at 24px, 1.25px at 20px, and 1px at 16px. Filled HarmonyOS glyphs keep
their official filled geometry and receive no stroke.

| Token | Reference | Value |
|---|---|---:|
| `--icon-size-xs` | `--size-4` | 12px |
| `--icon-size-sm` | `--size-5` | 16px |
| `--icon-size-md` | `--size-6` | 20px |
| `--icon-size-lg` | `--size-7` | 24px |

```css
--icon-source-size: 24px;
--icon-weight-regular: 400;
--icon-outline-source-stroke-width: 1.5;
--icon-outline-stroke-width-16: 1;
--icon-outline-stroke-width-20: 1.25;
--icon-outline-stroke-width-24: 1.5;
--icon-manual-fallback-stroke-width: 1.5;
--icon-size-xs: var(--size-4);
--icon-size-sm: var(--size-5);
--icon-size-md: var(--size-6);
--icon-size-lg: var(--size-7);
```

### Indicator and Selection Sizes

| Token | Reference | Value | Usage |
|---|---|---:|---|
| `--notification-dot-sm` | `--size-2` | 6px | 新事件提示小红点 |
| `--notification-badge-size` | `--size-5` | 16px | 带数字的新事件提示 |
| `--checkbox-size` | `--size-6` | 20px | Checkbox |
| `--radio-size` | `--size-6` | 20px | Radio |
| `--switch-height` | `--size-6` | 20px | Switch 高度 |
| `--switch-width` | `--size-11` | 40px | Switch 宽度 |
| `--height-badge` | `--size-7` | 24px | Badge 高度 |
| `--height-progress` | `--size-3` | 8px | Progress 轨道高度 |
| `--size-avatar-sm` | `--size-9` | 32px | Small Avatar |
| `--size-avatar-md` | `--size-11` | 40px | Medium Avatar |

### Component Heights

Standard desktop controls are 40px high. Small 28px variants remain available where already approved. No Large control variant is defined; do not scale a standard control above 40px without a new explicit specification.

| Token | Reference | Value | Usage |
|---|---|---:|---|
| `--height-button-sm` | `--size-8` | 28px | Small Button |
| `--height-input-sm` | `--size-8` | 28px | Small 文本框 |
| `--height-select-sm` | `--size-8` | 28px | Small 下拉框 |
| `--height-search-sm` | `--size-8` | 28px | Small 搜索框 |
| `--height-tag` | `--size-8` | 28px | 标签 |
| `--height-selection-option` | `--size-8` | 28px | 单选块子项 |
| `--height-selection-block` | `--size-9` | 32px | 单选块 |
| `--height-chips-tab` | `--size-10` | 36px | Chips Tab |
| `--height-tab-line` | `--size-11` | 40px | Line Tab Trigger |
| `--height-tab-vertical` | `--size-11` | 40px | Vertical Tab Trigger |
| `--height-menu-item` | `--size-11` | 40px | 菜单项 |
| `--height-list-item` | `--size-11` | 40px | List 子项 |
| `--height-list-heading` | `--size-11` | 40px | Secondary List 标题与操作行 |
| `--height-tree-item` | `--size-11` | 40px | Tree 子项 |
| `--height-button` | `--size-11` | 40px | 标准 Button |
| `--size-icon-button` | `--size-11` | 40px | Icon Button 外框尺寸 |
| `--height-icon-text-button` | `--size-11` | 40px | 图标文本按钮 |
| `--height-dropdown-control` | `--size-11` | 40px | 下拉菜单触发控件 |
| `--width-split-button-trigger` | `--size-5` | 16px | Split Dropdown 右侧下拉按钮固定宽度 |
| `--height-select` | `--size-11` | 40px | 标准下拉控件 |
| `--height-search` | `--size-11` | 40px | 标准搜索框 |
| `--height-input` | `--size-11` | 40px | 标准文本框 |
| `--min-height-textarea` | `--size-17` | 80px | Textarea 默认最小高度 |
| `--height-alert` | `--size-11` | 40px | 单行公告提示和 Alert 固定高度 |
| `--height-snackbar` | `--size-13` | 48px | Snackbar |
| `--height-pagination-item` | `--size-9` | 32px | Pagination 项 |
| `--height-table-header` | `--size-11` | 40px | Table 表头行 |
| `--height-table-row` | `--size-13` | 48px | Table 数据行 |
| `--height-titlebar-sm` | `--size-11` | 40px | Small Titlebar |
| `--height-titlebar-md` | `--size-14` | 56px | Medium Titlebar |
| `--height-titlebar-lg` | `--size-15` | 64px | Large Titlebar |
| `--height-titlebar-xl` | `--size-16` | 72px | Extra Large Titlebar |

```css
--notification-dot-sm: var(--size-2);
--notification-badge-size: var(--size-5);
--checkbox-size: var(--size-6);
--radio-size: var(--size-6);
--switch-height: var(--size-6);
--switch-width: var(--size-11);
--height-badge: var(--size-7);
--height-progress: var(--size-3);
--size-avatar-sm: var(--size-9);
--size-avatar-md: var(--size-11);
--height-button-sm: var(--size-8);
--height-input-sm: var(--size-8);
--height-select-sm: var(--size-8);
--height-search-sm: var(--size-8);
--height-tag: var(--size-8);
--height-selection-option: var(--size-8);
--height-selection-block: var(--size-9);
--height-chips-tab: var(--size-10);
--height-tab-line: var(--size-11);
--height-tab-vertical: var(--size-11);
--height-menu-item: var(--size-11);
--height-list-item: var(--size-11);
--height-tree-item: var(--size-11);
--height-button: var(--size-11);
--size-icon-button: var(--size-11);
--height-icon-text-button: var(--size-11);
--height-dropdown-control: var(--size-11);
--width-split-button-trigger: var(--size-5);
--height-select: var(--size-11);
--height-search: var(--size-11);
--height-input: var(--size-11);
--min-height-textarea: var(--size-17);
--height-alert: var(--size-11);
--min-height-alert: var(--height-alert); /* compatibility alias */
--height-snackbar: var(--size-13);
--height-pagination-item: var(--size-9);
--height-table-header: var(--size-11);
--height-table-row: var(--size-13);
--height-titlebar-sm: var(--size-11);
--height-titlebar-md: var(--size-14);
--height-titlebar-lg: var(--size-15);
--height-titlebar-xl: var(--size-16);
--height-dialog-header: var(--size-14);
--height-modal-header: var(--size-14);
--height-modal-footer: var(--size-17);
```

### Modal Widths

| Token | Value | Usage |
|---|---:|---|
| `--width-modal-sm` | 480px | Small semi-modal |
| `--width-modal-md` | 640px | Medium modal or denser form |
| `--width-modal-lg` | 800px | Large modal with structured content |
| `--width-dialog` | 400px | Dialog and Alert Dialog fixed width |

```css
--width-modal-sm: 480px;
--width-modal-md: 640px;
--width-modal-lg: 800px;
--width-dialog: 400px;
```

Dialog and Alert Dialog always use the fixed 400px `--width-dialog`. Semi-modal width is selected from exactly 480px, 640px, or 800px. At constrained window widths, preserve the selected token as the maximum width and subtract the approved page inset to prevent viewport overflow.

Shell dimensions are owned by Layout tokens: the expanded Sidebar is 240px, the collapsed Sidebar is 64px, the Secondary Pane is 360px, and the default first-level Titlebar is 64px. Component-specific Titlebar variants remain 40px, 56px, 64px, and 72px.

## 4.6 Shadows

```css
--shadow-1: 0 0 4px 0 rgb(0 0 30 / 15%);
--shadow-2: 0 0 20px 0 rgb(0 0 30 / 8%);
--shadow-3: 0 10px 50px 0 rgb(0 0 30 / 15%);
--shadow-4: 0 10px 50px 0 rgb(0 0 30 / 30%);
--shadow-5: 0 10px 55px 0 rgb(0 0 30 / 25%);
--shadow-6: 0 10px 70px 0 rgb(0 0 30 / 45%);
```

`elevation` is interpreted as the blur radius for CSS and Pixso shadow effects. Spread is `0` for every level. The shared shadow color is `#00001E`; opacity is stored independently in machine-readable tokens.

### Projection Usage Policy

```text
共享投影 Token 的常规使用场景只有以下九类浮层的外层容器：
Snackbar: shadow-1
Tooltip: shadow-1
Popover: shadow-2
Hover Card: shadow-2
Dropdown Menu: shadow-2
Context Menu: shadow-3
Dialog: shadow-4
Alert Dialog: shadow-4
Semi-modal: shadow-5

其他场景一般不使用投影，默认以边框或批准的表面色差区分层级；Focus 使用 Focus Ring Token。普通 Toast、Select/Combobox 的选项列表、独立 Calendar、Menubar 栏本体、卡片、页面面板、窗口壳层、选中和聚焦状态默认无投影。Dropdown Menu（含 Menubar 展开的命令菜单）的面板使用 shadow-2；Input / Tag Entry 的建议列表复用 Dropdown Menu 面板与菜单项样式（含 shadow-2），但仍保留 listbox/option 语义，这属于 Dropdown Menu 样式复用而非新增通用投影场景；Context Menu 的面板使用 shadow-3。若具体项目确需例外，须在该项目设计系统中明确场景与效果，不自动扩展为 Text-to-UI 的通用投影 Token 角色。shadow-6 保留为兼容性基础样式，不分配常规场景。
```

Context Menu / 上下文菜单: every menu item uses a horizontal semantic icon + text structure. The leading icon is exactly 24×24px (`--icon-size-lg`) and the icon-to-text gap uses `--gap-menu-item-content` (8px). Do not render Context Menu commands as text-only rows.

Dropdown Menu and Context Menu panels use `--padding-popup-menu` on both horizontal sides (4px). Therefore the hover/focus surface of each menu item starts 4px inside the panel's left and right border; keep the item text inset at `--padding-menu-item-x` (12px) and do not remove the panel inset or compensate it with a negative margin.

### Date Picker · 日期选择器

- 客户端日期选择器使用组件库自绘的 Calendar Popover，不使用浏览器原生 `input[type="date"]` 下拉层。
- 触发字段高度引用 `--height-input`，Popover 使用 raised surface、`--radius-card`、边框色与 `--shadow-2`。
- 月份栏高度 40px；日期固定为完整 6×7 网格，日期热区 32px，星期标签使用 Caption L，月份标题使用 Subtitle S。
- 默认日期使用一级文本色，相邻月份使用次级文本色；选中日期使用品牌背景与反白文字；今天在未选中时使用品牌色描边。Hover、Pressed 与 Focus 分别引用对应状态层和 focus ring。
- 底部“清除”“今天”使用 Small Ghost Button。方向键按日/周移动，Escape 关闭且焦点返回触发字段。

### Time Picker · 时间选择器

- 客户端时间选择器使用组件库自绘 Popover，默认采用 24 小时制，分钟步进为 5；不要使用浏览器原生 `input[type="time"]` 下拉层。
- 触发字段高度引用 `--height-input`；Popover 使用 raised surface、`--radius-card`、边框色与 `--shadow-2`。
- 小时与分钟分列为两个透明背景的 Listbox，不使用灰色列底；列标题使用 Caption L，弹层标题使用 Subtitle S，选项使用 Body L；列表高度 144px，单项高度 32px。触发字段右侧使用 16px `field/time` 时钟图标，展开时保持静止。
- 默认选项使用一级文本色，选中项使用 Ghost 样式：品牌色文字、透明背景；Hover、Pressed 与 Focus 引用对应状态层和 focus ring，不得使用品牌实底与反白文字。
- “清除”“现在”使用 Small Ghost Button，“确定”使用 Small Primary Button。时/分选择先保留为草稿，确定后提交；Escape 或点按外部放弃草稿并关闭。

## 4.7 Breakpoints

```css
--breakpoint-mobile: ;
--breakpoint-tablet: ;
--breakpoint-desktop: ;
--breakpoint-wide: ;
```

Recommended behavior:

```text
Mobile:
Tablet:
Desktop:
Wide:
```

## 4.8 Motion

```css
--duration-fast: ;
--duration-normal: ;
--duration-slow: ;
--ease-standard: ;
--ease-emphasized: ;
```

Rules:

```text
Hover:
Focus:
Page transition:
Loading:
Disabled:
```

## 4.9 Z-Index

```css
--z-base: ;
--z-dropdown: ;
--z-sticky: ;
--z-overlay: ;
--z-modal: ;
--z-toast: ;
```

## 5. Component Rules

## 5.1 Buttons

### Classes

```text
.btn
.btn-primary
.btn-secondary
.btn-ghost
.btn-danger
.btn-icon
.btn-icon-text
.btn-icon-text-ghost
.icon-btn
.icon-btn-secondary
.icon-btn-ghost
.split-control
.split-main
.split-main-icon
.split-trigger
.dropdown-menu
.dropdown-menu-item
```

### Rules

| Rule | Standard | Small |
|---|---:|---:|
| Height | `--height-button` (40px) | `--height-button-sm` (28px) |
| Horizontal padding | `--padding-button-x` (16px) | `--padding-button-sm-x` (8px) |
| Radius | `--radius-button` (8px) | `--radius-button` (8px) |
| Typography | `body-l` (16px / 22px / Regular 400) | `body-m` (14px / 20px / Regular 400) |
| Variants | Primary, Secondary, Ghost, Danger | Primary, Secondary, Ghost, Danger |

Variant colors:

- Primary uses `--color-primary` with inverse text.
- Secondary uses `--color-button-secondary-bg` and `--color-button-secondary-text`.
- Ghost uses a transparent background and `--color-button-ghost-text` (`brand-100`).
- Danger uses the same background as Secondary and `--color-button-danger-text` (`function/danger/100`).
- Button typography uses Body roles instead of Subtitle roles. Standard and 40px action controls use `body-l`. Only 28px Small Buttons use `body-m`; menu items and Accordion triggers use `body-l`. Tabs remain the single compact-navigation exception and use `body-m`. State changes should rely on color, background, border, and indicators rather than increasing the label weight.

Icon + Text Button is a separate 40px-only component:

- Variants: Primary, Secondary, and Ghost. It has no 28px size and no Danger variant.
- Horizontal padding uses `--padding-button-sm-x` (8px), matching the current Pixso `icon-text` master.
- Icon and text use `--gap-button-icon-label` (`--space-3`, 8px). Apply this token to every Button and Split Button icon + text pair; do not use literal gaps.
- Primary and Secondary reuse the matching standard Button colors.
- Ghost uses `--color-icon-text-button-ghost-content` (`neutral-dark-90`) for both text and icon.
- Every icon defaults to `--icon-size-md` (20px).
- Disabled is supported by all three variants with whole-control opacity at 40% through `--state-disabled-opacity`.

Icon Button:

- Size is `--size-icon-button` (40px square); nested icons default to `--icon-size-md` (20px).
- Default variant is Ghost. A plain `.icon-btn` must render with a transparent resting background and `--color-icon` (`neutral-dark-90`) content; Hover and Pressed use `--state-layer-hover` and `--state-layer-pressed`.
- Secondary remains available only as an explicitly requested `.icon-btn-secondary` variant. Never give an unspecified Icon Button a persistent fill. `.icon-btn-ghost` is a compatibility alias for the default Ghost rendering, not a separate required declaration.
- Both variants support Disabled with whole-control opacity at 40% through `--state-disabled-opacity`.

Checkbox, Radio, and Switch are compact selection controls. Their visible labels use `body-m` (14px / 20px / Regular 400) with primary text color; label-to-control spacing uses `--gap-choice-label` (8px). This compact-label rule does not apply to the 40px Select or Combobox field controls.

Split Dropdown Button is a 40px Ghost action control with two independent hit targets:

- Content combinations: Icon + Text main action + Chevron trigger, or Icon main action + Chevron trigger.
- The left main button immediately performs the component's default shortcut action. It never opens the menu.
- The right Chevron button only opens lower-priority folded actions. It owns `aria-haspopup`, `aria-expanded`, and `aria-controls`.
- Default background is transparent. Each hit target independently uses `--state-layer-hover` on Hover, matching the Ghost Icon + Text Button behavior.
- Content uses `--color-icon-text-button-ghost-content` (`neutral-dark-90`), not the brand-colored standard Ghost Button text.
- Left main actions use `--padding-split-button-main-x` (`--space-3`, 8px) and `body-l`. Icon-only main actions retain a stable 40px width while applying the same 8px horizontal inset.
- Right Chevron triggers use `--width-split-button-trigger` (`--size-5`, 16px) and `--padding-split-button-trigger` (`--space-0`, 0px). The 16px Chevron is horizontally and vertically centered inside the fixed-width trigger.
- Leading icons use `--icon-size-md` (20px). The disclosure chevron uses `--icon-size-sm` (16px).
- Disabled applies 40% opacity to the complete split control through `--state-disabled-opacity` and prevents both hit targets from activating.

Split Dropdown action menus:

- Menu items use the complete `body-l` style (16px / 22px / Regular 400).
- Split Dropdown action-menu items use Icon + Text. Icons use `--icon-size-md` (20px), text uses `body-l`, and their gap uses `--gap-menu-item-content` (`--space-3`, 8px). Use semantic HarmonyOS Symbol aliases; do not substitute character glyphs.
- Opening the trigger sets `aria-expanded="true"`. Selecting an item closes the menu; `Escape` closes it and returns focus to the trigger; clicking outside closes it.
- Do not hide the page's primary action inside the folded menu. Use Split Dropdown only when lower-priority actions do not fit or would add avoidable clutter.

### States

```text
Default:
Hover:
Active:
Focus:
Disabled: Every variant and both sizes support Disabled. Apply `--state-disabled-opacity` (40%) once to the whole button and prevent activation.
Loading:
```

## 5.2 Inputs

### Classes

```text
.field
.form-field
.form-field-title
.field-label
.input
.search-shell
.search-icon
.search-clear
.textarea
.select
.select-trigger
.select-listbox
.select-option
.input-error
.field-hint
.field-error
```

### Rules

Input, Search, Textarea, field Select/Combobox, Date Picker, Time Picker, and Input OTP use the complete `body-l` text style (16px / 22px / Regular 400) for their displayed or entered value. Input and Search use `--height-input` (40px). Search uses a leading search icon sized with `--icon-size-sm` (16px), never a text glyph or the 20px medium icon token. When Search contains text, show a trailing quick-clear button whose icon also uses `--icon-size-sm`; clearing empties the value, hides the button, and returns focus to Search. Reserve the trailing button space so text does not shift when the button appears. Textarea uses `--min-height-textarea` (80px), `--padding-textarea-x` (12px), and `--padding-textarea-y` (8px), with vertical resize enabled by default.

Search matches the current Pixso component set's nine states on both surfaces (18 combinations total): `default`, `focus`, `typing`, `filled`, `hover-left`, `hover-right`, `pressed-left`, `pressed-right`, and `disabled`. There is no Error state: never render a Search Error variant, error border, or `aria-invalid`. With default state behavior, focus on an empty field resolves to Focus; entering text while focused resolves to Typing; a non-empty field after blur resolves to Filled; Disabled overrides the other states. Hover and Pressed are transient and region-specific: left means the complete scope selector; right means the input region, including search icon, value, clear action, and optional Advanced action. Never use generic Search `hover` or `pressed` states.

Input / Tag Entry is one structural Input variant (`variant="tag-entry"`), not separate white- and gray-surface components. Set its existing `surface` prop from the containing content surface: `white` uses the default gray input fill; `gray` uses the subtle white input fill. The single row places a left label and a flexible, bottom-underlined editor slot on the right. The label uses Body_L (16px / 22px / Regular 400) and `--color-text-muted` (secondary text); the empty-slot hint uses Body_L and `--color-text-subtle` (tertiary text); entered text uses Body_L and `--color-text` (primary text). The outer Input surface, label, and selected Chips have no hover treatment or enlarged hover hit area. Hover feedback is limited to the right editor slot's underline, which changes from `--color-border` to `--color-icon` (primary icon color); do not add an outer fill, border, or layout shift. Selected values reuse the existing removable Chips component. Free text remains ordinary editable input text unless the user chooses a suggestion. Enter opens a filtered suggestion listbox; Arrow Up/Down changes the active option; Enter or pointer selection converts that option into a removable tag and clears the query; Escape closes without committing. Omit already-selected suggestions, preserve focus on the input after selection/removal, and expose the combobox/listbox relationship with `aria-expanded`, `aria-controls`, and `aria-activedescendant`. The listbox reuses the Dropdown Menu panel and item visual styles, including the `shadow-2` panel; keep its combobox/listbox and option semantics rather than changing it to a command menu. Keep one Tag Entry catalog entry and reuse it across both surfaces; do not define surface-specific component variants.

Search is one reusable component across content surfaces: white content uses the gray Search fill (`neutral-dark/05`); gray content uses the white Search fill (`neutral-light/100`). Its 324×40 root has an 8px radius, zero outer padding, and zero root gap. The left scope selector is 73×40 with a 12px leading inset, 4px internal spacing, and a 1×16 divider; the right input region fills the remaining width with 8px leading and 4px trailing inset and 8px spacing between slots. The scope label uses `Typography/Body_L` and primary text (`neutral-dark/90`); its 20px chevron also uses primary icon color. The leading search icon is 16px and secondary (`neutral-dark/60`); the placeholder uses Body_L and secondary text, while entered text uses Body_L and primary text. The clear icon is 16px and primary (`neutral-dark/90`). The optional Advanced action remains a small Ghost text action with secondary text and a stable 4px trailing inset.

Keep the two sibling hit regions independent: scope selector on the left; search icon, value, clear action, and optional Advanced action on the right. Hover and Pressed affect only their named region and never change the 324×40 geometry or resize the root. On the gray Search fill, the left scope selector Hover overlays `neutral-dark/05`, the right input region Hover uses `neutral-dark/10`, and Pressed uses `neutral-dark/15`. On the white Search fill, Hover uses a `neutral-dark/05` layer and Pressed uses `neutral-dark/10`, each with a 2px white outline. Do not recolor the opposite region. Keyboard focus remains visible on the Dropdown Menu trigger; the Advanced action keeps the same trailing inset in resting, hover, and focus-within states.

Form Field / 表单字段 stacks its title above its control. The title uses `body-m` (14px / 20px / Regular 400), `--color-text`, and a tokenized `--gap-field-label` (8px) before the control. Adjacent fields use `--gap-form-field` (16px). In a multi-column form grid, the grid owns both axes with that same 16px row and column gap: all same-row fields start on the same horizontal baseline, and sibling vertical margins are reset to zero. Textarea and form Select inherit the same white/default and gray/subtle surface state mappings as Input. Default and Hover have no visible border on white surfaces. Focus retains the approved background with no focus border. Error uses a 1px `--color-input-error-border`; Disabled applies `--state-disabled-opacity` (40%) once to the complete control.

Whenever white/default and gray/subtle surface examples are presented together, keep their component matrix semantically identical: the same Input, Search, Textarea, form Select, Input/Field Error, and Disabled examples in the same order. Only the surface-specific fill and hover treatment may differ. Both contexts must include an operable form Select, visible Error examples attached to Input/Field controls only, and Disabled Input, Search, and Select examples. Search never has an Error state. At supported desktop widths, present the two surface contexts as equal left/right columns; do not collapse them merely because an embedded framework preview is narrower than the page canvas. A one-column fallback is reserved for genuinely narrow widths below the two-column minimum.

Form Select presents a field value, uses `role="combobox"`, controls a `role="listbox"`, and exposes `aria-expanded`, `aria-controls`, and `aria-activedescendant` when open. Pointer click, `Enter`, or `Space` opens it; Arrow keys, Home, and End move the active option; `Enter` or `Space` commits the active option; `Escape` closes without changing the value and restores focus to the trigger. A pointer or focus move outside the Select closes the listbox without committing a draft value.

## 5.3 Cards

### Classes

```text
.card
.card-header
.card-title
.card-body
.card-footer
.metric-card
```

### Rules

Cards use `--color-surface` with a 1px `--color-border`, `--radius-card` (12px), and `--padding-card` (`--space-6`, 24px). Default cards remain flat; use elevation only for draggable, floating, or explicitly raised surfaces.

Card content follows Header → Body → Footer order. A Card title uses `title-s` (20px / 28px / Bold 700); header and footer actions align to the trailing edge, while the parent owns vertical gaps. Interactive cards use a native `button` or `a`, apply `--state-layer-hover` and `--state-layer-pressed`, expose a visible focus ring, and never hide the only action behind a whole-card click.

Metric Cards use the same shell and show one `title-s` Card title, one primary value, and optional trend/context. Do not mix unrelated metrics in one card. Trends use semantic status color plus a text or icon affordance so meaning never depends on color alone.

## 5.4 Tabs, Navigation, and Lists

### Classes

```text
.nav
.nav-item
.nav-item-active
.sidebar
.topbar
.breadcrumb
.accordion
.accordion-trigger
.accordion-chevron
.accordion-panel
.tabs
.tabs-list
.tab
.tab-panel
.tabs-filled
.tabs-line
.tabs-vertical
.tab-icon
.list-context-demo.on-white
.list-context-demo.on-gray
.list-card
.list-item
```

### Rules

Breadcrumb separators between every hierarchy level use the secondary icon color `--color-icon-muted` (`--color-neutral-dark-60`). Separator color does not inherit from the adjacent link or current-page text.

Accordion triggers use `body-l` (16px / 22px / Regular 400). The label and chevron both use secondary text color `--color-text-muted`; the icon inherits the trigger color. The default trigger is a transparent Ghost row with no outer border, uses 8px horizontal padding, 8px button radius, and fills its available frame. Put one 20px SVG `navigation/chevron-right` before the title with an 8px token gap; collapsed points right and expanded rotates 90 degrees to point down. Keep the label/icon order, SVG geometry, and fixed icon box unchanged across states.

When multiple Accordion instances are composed in one region, the parent wrapper
uses the canonical `tui-disclosure-group` class and owns a `--space-5` (16px)
gap between Accordion instances. The individual Accordion keeps its own
trigger-to-panel spacing; do not add per-instance margins.

Collapsible triggers vertically center the label and one fixed 20px SVG `navigation/chevron-down` on the right. The label and chevron both use secondary text color `--color-text-muted`; the icon inherits the trigger color. The trigger fills its available frame, uses 8px horizontal padding and 8px button radius, keeps the label on the left and the icon on the right, and has no outer border on the default transparent Ghost surface. The label and icon positions never change when content opens. Collapsed rotates the same icon 180 degrees to point up; expanded leaves it pointing down. Do not use a text character as the disclosure icon.

Independent Collapsible navigation groups are separated by a parent-owned
`--space-5` (16px) gap. The gap from each group heading to its own route list
remains `--space-1` (2px); these are separate spacing responsibilities.

Accordion and Collapsible trigger labels are single-line content. When a label is too long for the available width, keep the fixed chevron and hit area in place and truncate the label with an ellipsis (`text-overflow: ellipsis`); do not wrap the trigger or increase its height. Put the complete explanation in the expanded content region instead.

Tabs switch between peer panels inside one page. Use them for content views at the same hierarchy level; do not use Tabs for primary application navigation, sequential steps, filters that do not replace a panel, or independent toggle actions.

Composition is `Tabs → TabsList → Tab Trigger + TabPanel`. The root owns value, orientation, and activation mode. Every `TabsList` uses `role="tablist"` and an accessible label. Every trigger uses `role="tab"`, `aria-selected`, `aria-controls`, and roving `tabindex`; every panel uses `role="tabpanel"` and `aria-labelledby`. The active panel remains the only displayed panel.

Approved variants:

- **Filled:** the default compact desktop variant. The list is 36px high with `--padding-segmented-control`, `--gap-tabs-list`, and `--radius-tab`. Selected uses a white surface and subtle elevation.
- **Line:** for wider content headers and dense tool views. Triggers are 40px high with `--padding-tab-x`; Selected uses brand text plus a 2px bottom indicator. The list has a bottom divider and no filled container.
- **Vertical:** for settings/property groups when labels are longer or there are 4–8 stable categories. Triggers are 40px high, left aligned, and at least 160px wide. The panel occupies the remaining width. Do not use vertical Tabs as a substitute for the application sidebar.
- **Icon + Text:** allowed in Filled or Line variants. Use 16px SVG icons bound to `--icon-size-sm`; do not use font glyphs because their baselines create inconsistent optical alignment. The trigger centers the fixed icon box and the text line box independently on the vertical axis. Icons must accompany visible text. Icon-only Tabs are not approved for ordinary product navigation.

Tab trigger text uses `body-m` (14px / 20px / Regular 400) in every state. Default text uses `--color-tab-text`; Hover uses `--color-tab-hover-bg`; Selected uses `--color-tab-selected-text` and the variant-specific indicator without increasing font weight. Focus uses the standard external focus ring. Disabled applies `--state-disabled-opacity` (40%) once to the complete trigger and cannot receive selection.

Horizontal Tabs use Left/Right; Vertical Tabs use Up/Down. Home and End move to the first and last enabled trigger. Automatic activation is the default when panels render immediately. Use manual activation only when panel changes are expensive or asynchronous; in manual mode arrow keys move focus, while Enter or Space activates. Navigation loops and skips disabled triggers.

When labels overflow, preserve every trigger's readable label and use horizontal scrolling with scroll affordance. Do not shrink text, wrap labels, or introduce a “More” menu that hides the currently selected Tab. Changing Tabs must preserve user-entered state when the workflow expects return navigation.

List collection surfaces adapt to the canvas context:

- **White canvas:** the List collection has no visible container fill. Keep `.list-card` transparent so rows sit directly on the white canvas.
- **Gray/subtle canvas:** the List collection uses `--color-surface` (white) as its container fill, with `--radius-list` (`--radius-4`, 12px) and `--padding-list-card`.
- In both canvas contexts, `.list-card` owns the vertical spacing between every adjacent `.list-item` through `--gap-list-item`, which references `--space-1` (2px). Do not add item margins or collapse the gap in Selected, Hover, or Disabled states.
- Every `.list-item` uses `--radius-list-item`, which references `--radius-3` (8px), independent of the List container radius.

Do not use a gray List container on a white canvas. Row Hover uses `--state-layer-hover`; Selected uses `--color-sidebar-selected` and `--color-sidebar-selected-text`. The surrounding page or preview owns any documentation border; it is not part of the white-canvas List component.

List primary labels use `body-l`; timestamps, summaries, and secondary copy use `body-m`. Do not use `caption-m` for visible list metadata.

List Item trailing text and chevrons use the secondary text color `--color-text-muted`; unselected leading and trailing icons use the secondary icon color `--color-icon-muted`. Semantic notification dots keep their status color and are not recolored as neutral icons. A multi-item group draws a `--layout-navigation-divider-width` (0.5px) divider in `--color-neutral-dark-20` (the `neutral-dark.20` token) only before each subsequent item, inset by `--space-3` (8px) on both sides so the line aligns with the row content; a single item and the final item have no divider.

### List Item row contract

- List Item content rows use `--height-list-item-single-line` (48px), `--height-list-item-double-line` (56px), and `--height-list-item-triple-line` (80px). Do not stretch a one-line row merely because the List container is taller.
- Every row uses horizontal padding `--space-3` (8px). The leading icon box is `--icon-size-lg` (24px), and the icon-to-content gap is `--gap-menu-item-content` (8px).
- Approved trailing slots are: text plus right chevron, icon, radio, checkbox, switch, and notification dot plus right chevron. The leading 24px icon remains present unless a named variant explicitly omits it.
- A multi-row List Item group places a divider only before each subsequent child. The last child and a single Item have no bottom divider.

## 5.5 Data Display

### Classes

```text
.table
.table-row
.table-cell
.badge
.status
.chart-card
.empty-state
.progress
.pagination
.pagination-item
.avatar
```

### Rules

Table uses `--color-surface`, `--radius-table` (12px), and a 1px `--color-border` outer stroke. The outer Table container owns `--padding-table` (`--space-6`, 24px) on all four sides, so its toolbar, row backgrounds, dividers, and pagination never touch the outer stroke. Header rows are 40px and data rows are 48px; the first header cell and every first-column body cell add `--space-5` (16px) from the inner Table edge. Internal columns may retain `--space-5` spacing. When the first-column name includes a leading Avatar, icon, thumbnail, or file-type visual, the gap between that visual and the name also uses `--space-5` (16px). Headers use muted `body-m` (14px / 16px / Regular 400); cells use `body-l` (16px / 20px / Regular 400); numeric values align right, and the first column owns the row label. Hover applies `--state-layer-hover`; selected rows use `--color-sidebar-selected`. Sortable headers are buttons with `aria-sort`, not clickable text containers.

Badge is 24px high, uses `--radius-badge`, `body-s`, and 8px horizontal padding. Approved variants are neutral (gray), info (blue), success (green), warning (orange), and danger (red). Each uses a readable foreground color with a background from the same core family at 10% opacity. Badge/status labels and Alert backgrounds both use the approved 10% family surface; their component anatomy, height, typography, and actions provide the distinction. Every status label includes text; do not use a colored dot alone.

Progress uses an 8px neutral track with a brand indicator. Determinate progress exposes `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`; visible percentage text is required when precise completion matters.

Pagination items are 32px square. Current page uses `aria-current="page"`; previous/next buttons carry explicit accessible labels; unavailable controls are disabled. Keyboard order follows visual order and changing page preserves focus on the activated item.

Avatar sizes are 32px and 40px with `--radius-avatar` (`--radius-full`, 999px) so both sizes render as circles. Initials and fallback icons remain readable and use deterministic semantic surfaces. Adjacent text owns the person's full name; Avatar alone is not the only identity affordance.

Empty State centers one short explanation and one recovery action inside the data region. It must describe what is missing and the next useful step, not only display an illustration.

Charts use `--color-chart-1` through `--color-chart-5` in order and provide non-color legends or direct labels.

## 5.6 Modals / Toasts

### Classes

```text
.modal
.toast
.overlay
```

### Rules

Dialog and Semi-modal are separate component families.

- **Dialog / 对话弹窗:** use fixed `--width-dialog` (400px) for deletion confirmation, update guidance, download progress, warnings, and other short focused flows. Use `--height-dialog-header` (56px) with a centered `title-s` title, `--padding-modal-header-top` (8px) from the top edge to match Semi-modal, and no top-right close control. The content area uses `--padding-dialog-content` (24px). A single 40px action fills the available width; two actions form equal-width columns using `--gap-button-group`, with Secondary on the left and Primary or Danger on the right. Do not dismiss destructive or incomplete work through outside click.
- **Semi-modal / 半模态弹窗:** has three independent dimensions. **Size** is exactly S `--width-modal-sm` (480px), M `--width-modal-md` (640px), or L `--width-modal-lg` (800px). **Surface** is either White `--color-modal-bg-white` or Gray `--color-modal-bg-gray`; every size supports both surfaces. On a White surface, input, search, select, and textarea components use the gray `--color-input-bg-on-default` surface. On a Gray surface, those components use the white `--color-input-bg-on-subtle` surface. **Behavior** defaults to `non-modal`. The 56px header uses `title-s`, 8px top padding, 24px horizontal padding, left-aligned title, and a right Ghost Icon Button close control. The content area uses `--padding-modal-content-x` (24px) horizontally and `--padding-modal-content-y` (0px) vertically. A two-column form grid owns row and column gaps, so fields on the same row align their title and control start edges without inherited vertical sibling margins. The 80px footer vertically centers 40px content-width actions and aligns the group right; Secondary precedes Primary.
- **Composition rule:** Dialog and Semi-modal own only the container, header, body layout, and footer. Every child control must be a component-library instance: Button, Icon Button, Input, Search, Select, Textarea, and their established states. Do not create modal-only field, search, button, or icon styles. Surface switching must use the existing component context (`on-white` or `on-gray`) so all child states remain identical to the component gallery.
- **Behavior variants are not Tokens:** `non-modal` has no overlay, does not lock background interaction, and uses `aria-modal="false"`; `modal` uses `--color-overlay`, makes the background inert, constrains focus, locks background scrolling, and uses `aria-modal="true"`. Both variants share the same size and surface tokens. Escape closes only when the task permits dismissal and always restores focus to the trigger.

- **Snackbar:** use `--height-snackbar` (48px), a white `--color-surface` background, primary text color `--color-text`, and `--shadow-1`. It is short-lived, non-blocking feedback. A separate Toast component has no shadow.

Dialog and Alert Dialog use `--radius-dialog` and `--shadow-4`; Semi-modal uses `--radius-modal` and `--shadow-5`. Constrain width to the available viewport inset without inventing another width.

### Alert / 公告提示

Alert is a single-line, fixed-height announcement bar. Its anatomy is `Status Icon + Detail + Text Action + Close` and its complete height uses `--height-alert` (`--size-11`, 40px). The left group contains the status icon and detail; the right group contains the text action and close button. Both groups are vertically centered, the detail expands and truncates before the action group, and the right controls never wrap.

- The container uses `--padding-alert-left` (`--space-3`, 8px) and `--padding-alert-right` (`--space-2`, 4px). The status icon and detail use `--gap-alert-content` (`--space-3`, 8px).

- The status icon is 20px (`--icon-size-md`) and uses a circle plus a centered semantic mark: information, check, exclamation, cross, or neutral minus. Bind the reusable aliases `status/info`, `status/success`, `status/warning`, `status/danger`, and `status/neutral`; do not use text characters as icons.
- Detail text uses the complete `subtitle-s` style (14px / 20px / Medium 500) and always uses the primary text color `--color-text`. The 20px status icon alone uses the current semantic status color. The text action reuses the approved Small Ghost Button component (`.btn.btn-ghost.btn-sm`) including its typography, foreground, Hover, Pressed, Focus, and Disabled behavior; do not recolor it with the Alert status. The close control uses the primary icon color `--color-icon` with a 20px close glyph inside a 32px hit area.
- Approved variants are Info, Success, Warning, Danger, and Neutral gray. Info uses `brand/100` with `brand/10`; Success, Warning, and Danger use their `function/*/100` foreground with the matching `function/*/10` background. The semantic `*-subtle` aliases must resolve to these 10% surfaces. Neutral uses `--color-alert-neutral` with `--color-alert-neutral-subtle`.
- The text action and close button form one vertically centered trailing group. Text action comes before close. The Ghost Button owns the text-action states; close Hover and Pressed change only its background feedback while preserving `--color-icon`.
- The text action is optional only when no recovery, details, or undo path exists. The close button is optional only for a persistent non-dismissible system condition. When present, both are keyboard reachable and have accessible names; closing removes the announcement without changing unrelated state.

## 5.7 Tooltip

Tooltip (Tips) is supporting text for an unfamiliar control, never the only place for essential information. It shares the Snackbar visual surface: white `--color-tooltip-bg` / `--color-surface`, primary `--color-tooltip-text` / `--color-text`, a 1px `--color-border` outline, and `--shadow-1`. The outline matches the List Selection dropdown menu. Keep `--radius-tooltip` (6px) and `--padding-tooltip` (8px), keep copy concise, and place it at least 4px from its trigger. Tooltip is one complete rounded rectangular floating surface and does not use a directional caret or arrow.

Show Tooltip on pointer hover and keyboard focus after a short delay. The trigger references the tooltip through `aria-describedby`. Hide it when pointer and focus leave, on `Escape`, or when the trigger is disabled. Tooltip itself is non-interactive and must not receive focus.

## 5.8 Titlebar

Pixso is the source of truth for the HarmonyOS PC Titlebar component family. Use the local component set `0. Publis 公共/.titlebar` (`1129:9276`) with two variant axes: `大小` and `状态`.

| Pixso component | Size | Height |
|---|---|---:|
| `.titlebar / 大小=S` | S | `--height-titlebar-sm` (40px) |
| `.titlebar / 大小=M` | M | `--height-titlebar-md` (56px) |
| `.titlebar / 大小=L` | L | `--height-titlebar-lg` (64px) |
| `.titlebar / 大小=XL` | XL | `--height-titlebar-xl` (72px) |

All four sizes expose `状态=Normal` and `状态=unfocus`, producing eight variants. First-level pages use L by default. Choose another size only when the page hierarchy or window specification explicitly requires it. They share the same structure:

- The master component is 1100px wide for documentation but instances resize horizontally to their window.
- S, M, L, and XL all use `--padding-titlebar-leading` (`--space-6`, 24px) on the left. Their right padding is size-specific: S uses `--padding-titlebar-trailing-s` (`--space-0`, 0px), M uses `--padding-titlebar-trailing-m` (`--space-3`, 8px), L uses `--padding-titlebar-trailing-l` (`--space-4`, 12px), and XL uses `--padding-titlebar-trailing-xl` (`--space-5`, 16px).
- The left title group is 192×24px and remains vertically centered.
- The application icon is 24px. The application name uses `subtitle-m` (16px / 22px / Medium 500), matching Pixso style `Font/Subtitle_M/Medium`.
- The trailing window-control group is 120×40px and sits inside the size-specific right padding. It contains three 40×40px hit areas; do not add any un-tokenized inset.
- S uses the Small control glyphs at 16px. M, L, and XL use the Normal control glyphs at 24px. The hit areas remain 40px in every size.
- Window controls use the approved user-supplied 24×24 SVG assets in this order: `window-minimize`, `window-maximize`, and `window-close`, stored under `assets/icons/titlebar/`. Preserve their supplied geometry, render them through `currentColor`, and never substitute text characters, CSS shapes, HarmonyOS Symbol, or Lucide geometry unless the assets are explicitly replaced again.
- `Normal` has a transparent component background through `--color-titlebar-normal-bg`. Host each Titlebar segment on the same surface as the pane below it; do not retain the former standalone white/blur fill.
- `unfocus` also keeps a transparent component background through `--color-titlebar-unfocus-bg`. Apply 40% opacity only to the title and control groups through `--state-window-unfocus-opacity`; the owning shell surface remains unchanged.
- Ordinary product-operation buttons placed in the Titlebar use the Ghost Button or Ghost Icon Button variant. Their resting background is transparent; Hover, Pressed, and Focus use the approved state layers. Do not use a persistent Secondary or filled background in the Titlebar. Window controls remain a separate system-control group and continue to follow the Titlebar asset and state rules.
- App icon, application name, and nested window-control content remain overridable at the component-instance level.
- Size changes only the overall height; the title group and 40px control hit areas stay vertically centered and must not scale.
- Reuse these components directly in Pixso. Do not redraw or detach them for individual screens.

## 5.9 Multi-Pane Title Layer Placement

Primary Navigation Shell defaults Main Content to the White surface (`--color-surface`); Gray (`--color-bg-subtle`) remains an approved optional variant. The shell supports two navigation-hierarchy variants. Its Brand Anchor and Primary Navigation share a continuous right divider using `--layout-navigation-divider-width` (0.5px) and `--color-border`; Primary Navigation keeps `--space-4` (12px) bottom margin from the shell edge. Expanded navigation uses `--layout-sidebar-width` (240px). A 40px collapse button sits at the Brand Anchor's right edge. Activating it reduces the navigation column to `--layout-sidebar-width-collapsed` (64px), hides the application Logo and name, hides route labels, and preserves the current selection. In the collapsed Brand Anchor, a 40px expand button occupies the former Logo position. Both controls use semantic Lucide aliases, expose `aria-expanded` and `aria-controls`, support native button keyboard activation, and transfer focus to the newly visible counterpart. A single-level shell uses the Sidebar directly for its route list. In a two-level shell, first-level functional-space entries appear as icon-only controls at the bottom-left of the navigation region, while the second-level routes continue to use the Sidebar component above. The complete first-level group is always anchored to the bottom edge of Primary Navigation; it must never be placed directly after the second-level menu at the top or middle. This is the client system's only approved first-level menu, and every entry uses the same pinned Lucide Regular semantic-alias rule as ordinary navigation and component actions; HarmonyOS Filled icons are prohibited. Unselected first-level icons use the tertiary icon color through `--color-primary-level-unselected`, which resolves to `--color-icon-subtle` (`--color-neutral-dark-40`); Selected uses the brand foreground on a transparent background. Hover may add the Sidebar accent background but must preserve the current icon color. Expanded mode uses a fixed `--size-11` (40px) high horizontal group anchored at the bottom and distributes every first-level entry across the Sidebar content width. When the entire navigation is collapsed to 64px, every first-level entry remains visible as a 40×40 icon-only control and the group stacks them vertically from the bottom upward; never hide the unselected entries. Second-level navigation is organized into one or more independent collapsible menu groups. Each group heading is a button that toggles only its associated route list, preserves selection while collapsed, exposes `aria-expanded` and `aria-controls`, support native button keyboard activation, and uses `subtitle-s` (14px / 20px / Medium 500) with `--color-text-muted`. The gap between a group heading and its route list uses `--space-1` (2px). Reuse one 16px Chevron for both states and animate it through a 180-degree rotation; do not swap icon assets. Keep independent Selected states for both navigation levels; changing the first level updates the second-level Sidebar context.

The component-gallery preview for Primary Navigation Shell must keep only the shell-defining content real: Brand Anchor, Global Primary Action Slot, navigation hierarchy, selection, and collapse controls. Represent the non-focused adjacent Main Content title and body with neutral static skeletons and no business copy or data. Keep window controls visible because they communicate the shell boundary. This is a documentation-preview focus rule, not a runtime loading-state requirement for generated product pages.

Titlebar rendering and page-action ownership add these mandatory shell rules: keep the Titlebar component transparent with no bottom divider by default; host each segment on the same surface as its pane below; in a two-column shell keep both the branded left segment and the final title/window-control segment divider-free; in a three-column shell keep the branded Primary Navigation and Secondary Pane segments divider-free and add the only bottom divider to the final Main Detail segment, which owns the operation slot. Keep vertical pane dividers continuous. Add a Global Primary Action Slot inside Primary Navigation Shell between Brand Anchor and Sidebar navigation. Every page-global Primary Button must use this slot, with exactly one such CTA per page. The Primary Navigation owns a 16px horizontal inset and the slot itself adds `--space-3` (8px) horizontal inner padding, so the expanded button aligns to the Brand Anchor / Logo's 24px content axis. The slot keeps 8px below Brand Anchor / Titlebar through `--layout-primary-action-slot-gap-top` and 12px before the first Sidebar navigation component through `--layout-primary-action-slot-gap-bottom`; these values belong only to the action slot and must not be reused as whole-navigation padding, generic component gaps, or menu-row spacing. Collapsed 64px mode uses a 40px icon-only Primary Button with an accessible name and Tooltip; its dedicated slot compensation keeps the icon centered in the collapsed rail. Secondary, Ghost, Icon, and local buttons may appear elsewhere according to scope.

The Global Title Layer must share the Workspace column boundaries. Treat the top-left of the final pane as `final-pane-leading-slot`:

- Two-column layout (`Primary Navigation | Main Content`): the slot contains the current Main Content title.
- Three-column layout (`Primary Navigation | Secondary Pane | Main Detail`): the slot contains only non-Primary Main Detail/Editor operations whose scope is the complete current detail/editor workspace, such as save, share, expand, open separately, layout, or mode actions. The page-global Primary CTA stays in Primary Navigation Shell between Brand Anchor and Sidebar navigation. Keep Detail operations in one compact, task-priority-ordered group and do not repeat the page/list title in this position. Card-, field-, section-, selection-, and inline-scoped actions stay next to their targets.
- The slot container aligns to the final pane boundary. In two-column layouts, the Main Content title is inset by `--layout-main-title-leading-padding` (`--space-6`, 24px). In three-column layouts, the first Main Detail operation is inset by `--layout-main-detail-action-leading-padding` (`--space-5`, 16px). Do not use one-off absolute coordinates.
- Application-wide actions not owned by Main Detail and the three window controls remain pinned to the far right of the Global Title Layer.
- When responsive desktop behavior changes a three-column layout into two columns, change the slot from `pane-global-actions` to `title` as part of the layout transition.
- Pixso Frames and HTML Grid must use the same column boundaries and slot semantics.

## 6. Pixso Mapping

Map design components to code components.

Generate Pixso variables from the machine-readable Token files; never maintain a smaller manual subset. Run `node scripts/build-pixso-token-manifest.mjs --check` before Pixso work. The generated manifest uses three collections—Color, Dimension, and Typography—with `foundation/`, `semantic/`, `component/`, and `layout/` name prefixes. Text role combinations remain shared Text Styles, and shadows remain shared Effect Styles.

Before creating a reusable component or Pattern, prove that one color, number, and string variable can be written, read back through Pixso's native variable APIs, and bound to a test node. A returned write GUID alone is not proof. If the desktop MCP writer does not persist variables, run the bundled `HarmonyOS PC Token Sync` development plugin or import `pixso-tokens-studio.json`, then repeat the read-and-bind check. Do not continue by replacing variables with hardcoded values.

```text
Pixso Button -> .btn / .btn-primary / .btn-secondary
Pixso Input -> .field / .input
Pixso Textarea -> .field / .textarea
Pixso Select -> .field / .select
Pixso Tabs -> .tabs / .tab / .tab-panel
Pixso Tooltip -> .tooltip
Pixso Card -> .card
Pixso Data Card -> .metric-card
Pixso Nav Item -> .nav-item
Pixso Badge -> .badge
Pixso Table -> .data-table / .data-row / .data-cell
Pixso Progress -> .progress / .progress-indicator
Pixso Pagination -> .pagination / .pagination-item
Pixso Empty State -> .empty-state
Pixso Modal -> .modal
```

## 7. Tailwind Mapping

If using TailwindCSS:

```text
Colors -> theme.extend.colors
Typography -> theme.extend.fontFamily / fontSize
Spacing -> theme.extend.spacing
Radius -> theme.extend.borderRadius
Shadows -> theme.extend.boxShadow
Breakpoints -> theme.screens
Components -> @layer components
```

### Preferred Component Layer

```css
@layer components {
  .btn-primary {
    @apply inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white;
  }

  .input {
    @apply h-11 rounded-lg border border-transparent bg-surface px-3 text-sm text-text outline-none;
  }

  .card {
    @apply rounded-xl border border-border bg-surface;
  }
}
```

### shadcn Token Map

Use shadcn/ui preset `b7ClMfrGK` for new reusable Next.js projects. Load project tokens after the preset and use `tokens.shadcn-map.css` as the adapter.

Mapping artifacts:

```text
tokens.shadcn-map.css   Runtime CSS adapter
tokens.shadcn-map.json  Machine-readable mapping state
shadcn-token-map.md     Human review table and missing decisions
```

Project tokens remain authoritative. `secondary`, `accent`, sidebar accent, and dedicated input-state semantics are approved and mapped. `accent-foreground` remains inherited from the preset, while optional feedback foreground aliases remain pending until explicitly approved.

## 8. Page Templates

List common page types this system should support:

```text
Login:
Dashboard:
Settings:
User management:
Order management:
Pricing:
Landing page:
Profile:
Report:
```

## 9. Responsive Rules

```text
Desktop layout:
Tablet layout:
Mobile layout:
Navigation collapse:
Card stacking:
Table behavior:
Form behavior:
```

## 10. Do / Avoid

### Do

```text
-
-
-
```

### Avoid

```text
-
-
-
```

## 11. Implementation Notes

```text
Preferred output:
Single-page rule:
Multi-page rule:
Tailwind rule:
Existing project rule:
Asset rule:
QA rule:
```
