---
name: text-to-ui
description: Build HarmonyOS PC pages with canonical HTML components, Tokens, Patterns, and Pixso support. Use for new pages, exact revisions, HTML component work, Pixso handoff, and Skill maintenance.
---

# Text to UI · HTML

This folder is a complete HTML-only Text-to-UI repository. Treat this file as
the entry point and this folder as `REPO_ROOT`. The actual component adapter is
`packages/components-html/src/index.js`; use `renderHtmlComponent` for registered
controls. The Pattern shell is owned by `packages/pattern-runtime`. Never
substitute hand-drawn controls for a registered component.

## Choose a task

- **New page:** define information hierarchy and interactions in a page spec,
  select a Pattern from `assets/design-system/pattern-contracts.json`, then
  use `scripts/generate-page.mjs`. Read `references/html-page.md`.
- **Exact revision:** change only the requested page spec, shared component, or
  Token owner; regenerate and inspect the rendered page.
- **Component work:** update the HTML adapter, its contract, and shared styles
  together. Check real DOM state, keyboard behavior, and computed style.
- **Pixso handoff:** use the active plugin packages in `pixso/`. Read
  `references/pixso.md` and preserve linked component and Token evidence.
- **Maintenance:** edit the full source repository, then regenerate this folder
  with `tools/export-compact-html.mjs`. `PROVENANCE.json` identifies its source.

## Create and inspect a page

From this repository root:

```bash
node scripts/scaffold-project.mjs --project /absolute/path/to/page
node scripts/generate-page.mjs --project /absolute/path/to/page --spec examples/page-spec.json
cd /absolute/path/to/page && pnpm install && pnpm build && pnpm dev
```

The generator accepts only the HTML page spec described in
`references/html-page.md`. It checks Pattern slots and registered HTML renderers
before writing output. Provide business content through component options; do
not reuse gallery fixture text. It creates an entry module that imports the real
HTML adapter and Pattern runtime. Review the page in a browser at the actual
viewport, including interactions and accessibility attributes. A build alone
does not establish visual or runtime correctness.

Keep page CSS on page-owned content. Do not override Pattern panes, insets,
dividers, navigation, Titlebar internals, or component state rules. Resolve
colors, spacing, type, radii, and icons from the included Tokens and aliases.

For public distribution, use the source repository's reproducible export. The
full source keeps additional framework adapters; this package exposes HTML only.
