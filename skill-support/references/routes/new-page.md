# New page or redesign route

## Recommended one-shot entry

For ordinary page generation, use the compliant pipeline rather than invoking
the individual route, context, layout, and framework scripts manually:

```bash
node scripts/generate-compliant-page.mjs \
  --project <generated-project> \
  --repo <monorepo> \
  --framework <html|react|vue> \
  --task <request> \
  [--task-route <canonical-task-route-id>] \
  --blueprint <page-blueprint.json> \
  --content-recipes <page-content-recipes.json> \
  --bindings <page-bindings.json> \
  --page-css <page-composition.css>
```

This entry point owns route/context resolution, material-closure verification,
Layout Contract generation, strict page compilation, and atomic output commit.
If a gate fails, repair the named input and rerun; do not patch the generated
entry or CSS by hand. The lower-level commands below remain useful for
diagnosis and Skill maintenance.

First locate the repository and discover the design inputs (no blueprint or
user confirmation is required for discovery). The route material closure is
part of the generation context; do not rely on a partial hand-picked list:

```bash
node scripts/locate-monorepo.mjs --start "$PWD"
node scripts/resolve-workflow-route.mjs --route new-page --repo <monorepo> --receipt-out <route-read-receipt.json>
node scripts/resolve-context.mjs --task <task> --framework <html|react|vue> --mode fast-preview --discover --out <design-context.json>
```

For an unknown task select an approved `--pattern` and explicit
`--capabilities` from the indexes. This selection is a model design decision,
not a reason to make the user choose routine implementation details.

Use the discovery packet to understand the actual Pattern and legal component
inputs before the blueprint gate in `references/page-blueprint-design.md`, then
read only:

1. `references/requirement-spec.md`
2. the discovery packet's `exactReferencesToRead` (read each reference once)
3. exact selected entries from `packages/component-contracts/src/components.json`
4. `references/components/page-composition.md`
5. `references/page-blueprint-design.md`
6. the domain reference selected by the task route, such as
   `references/domains/email-workbench.md`
7. `packages/pattern-runtime/README.md` when building a direct browser Runtime
   or Secondary Page preview

The hash closure is checked by the resolver and receipt verifier. The model
reads the selected route documents, the packet's `exactReferencesToRead`, and
only the matching component/Token/icon registry entries needed for this task;
hash verification does not require loading every registry or asset.

After automatic blueprint planning (ask only if the user must choose a different
Pattern or primary task):

The following expanded sequence documents the gates owned by the one-shot
command. It is a diagnostic/maintenance breakdown, not the normal authoring
entry point.

```bash
node scripts/locate-monorepo.mjs --start "$PWD"
node scripts/resolve-workflow-route.mjs --route new-page --repo <monorepo> --receipt-out <route-read-receipt.json>
node scripts/resolve-context.mjs --task <task> [--task-route <canonical-task-route-id>] --framework <html|react|vue> --mode fast-preview --auto --blueprint <page-blueprint.json> --out <context-packet.json> --receipt-out <context-material-receipt.json>
node scripts/verify-route-materials.mjs --route new-page --repo <monorepo> --receipt <route-read-receipt.json>
node scripts/verify-context-materials.mjs --repo <monorepo> --context <context-packet.json> --receipt <context-material-receipt.json>
node scripts/query-components.mjs --framework <html|react|vue> --capabilities <capability,...> --semantic-context <semantic-context>
node scripts/generate-layout-contract.mjs --context <context-packet.json> --out <layout-contract.json>
node scripts/validate-pc-framework-layout.mjs --contract <layout-contract.json>
node scripts/scaffold-standalone-project.mjs --project <generated-project> --repo <monorepo>
node scripts/generate-framework-page.mjs --context <context-packet.json> --layout-contract <layout-contract.json> --blueprint <page-blueprint.json> --content-recipes <page-content-recipes.json> --page-css <page-composition.css> --bindings <page-bindings.json> --out <page-module> --entry-out <generated-page-entry> --manifest <framework-page-manifest.json> --component-usage <component-usage.json> --require-blueprint --require-content-recipes --require-slots
node scripts/stamp-framework-artifact.mjs --manifest <framework-page-manifest.json> --artifact <final-index.html> --required-stylesheet <bundled-component-and-token.css> --required-stylesheet <page-composition.css>
```

The route resolver returns `materials` with repository-relative paths, roles, and
SHA-256 hashes. The route read receipt must cover that static closure. Context
resolution then adds the selected Pattern/domain/titlebar/validation materials;
`--receipt-out` records that complete dynamic closure and
`verify-context-materials.mjs` checks it immediately before generation. If a
route source, Pattern, component registry, Token registry, or referenced guide
drifts, refresh the index, route receipt, and Context Packet receipt before
compiling. A missing, stale, or partial receipt is a blocking generation error.
Blueprint and recipe validation run inside generation; separate validator
commands are diagnostic tools, not mandatory duplicate passes. Component
queries are targeted to ambiguous or additional capabilities, not a second
whole-library discovery. Run this sequence for the selected framework only;
cross-framework and Skill sync tests belong to maintenance.

If a task description matches several task routes, the resolver stops and
prints the candidate IDs. Pass the intended canonical ID with
`--task-route <canonical-task-route-id>`; the original `--task` description is
kept in the Context Packet. The explicit route must agree with any supplied
Pattern and the blueprint. Exact route terms such as `file-list`, `tasks`,
`mail`, and `settings` keep their existing behavior. Short inputs such as `file` and
`workbench` are intentionally not auto-routed; migrate them by choosing the
intended route, for example `--task-route tool-workspace` or
`--task-route record-management-workbench`.

Run scaffold in the actual project root, not a nested temporary `project/`
directory. Outside the Monorepo, invoke Skill scripts from the canonical or
installed Skill root and pass `--repo <monorepo>`; do not assume the target
project has a `scripts/` directory. `scaffold-standalone-project.mjs` copies
the component, Token, and Runtime packages into `vendor/` and creates a local
`pnpm-workspace.yaml` boundary so an ancestor workspace cannot supply stale
packages. An empty project is scaffolded automatically; use `--scaffold` only
to refresh managed copies in an existing project. For HTML use
`--entry ./generated-entry.js` (or the actual relative generated entry). It
creates package.json, index.html, main.js and Vite config when missing. Install
in that directory, then run its build command before stamping. Do not replace
local dependencies with absolute host aliases.

The route's capability list is only a starting selection. Extend the Context
Packet with `--capabilities attachment,collapsible,...` when the task needs
additional library controls. A component missing from the packet is not proof
that it is absent from the library. Query it and extend context first. The
query's `--context` argument is a semantic-context value, not a Context Packet
file path.

For custom HTML business content use the executable `pageModules` API in
page-composition.md. Create its source before generation. Keep Pattern shell
ownership in the renderer and all business DOM updates inside the provided
host. Generated entry, main.js and dist files need no manual repair.

The scaffold Vite plugin checks all imported page CSS while serving/building,
including secondary stylesheets. Keep business CSS scoped to declared content
groups and reuse the component stylesheet without overrides. Before the
generator writes any page artifact, its CSS preflight checks the same source
against the canonical Token registry. Use `var(--color-...)`,
`var(--space-...)`, `var(--gap-...)`, `var(--padding-...)`, `var(--size-...)`,
`var(--height-...)`, `var(--radius-...)`, `var(--shadow-...)`, and the
canonical typography variables as appropriate. Do not invent a page palette,
put a raw color or metric into a local custom property, or use a literal
fallback inside `var(...)`; add a documented layout-contract exception only
when the value is a true structural parameter.

HTML Runtime is responsive: do not set a fixed page/canvas `width`, `height`,
or `transform: scale(...)` on `html`, `body`, `main`, `#app`, or the Pattern
root. The 1728×1152 board is an import-only Pixso capture setting, never page
layout CSS.

Resolve components in framework component → canonical contract → Token-based
custom order. HTML, React, and Vue must use the renderer contract returned by
the Context Packet and must retain the same Pattern/structure digests. For HTML,
the strict `component-usage.json` is mandatory. Every visible or interactive
element must be classified as registered, contract-based, or custom; custom UI
must include registry-search and missing-capability evidence and must not
overlap an available HTML component. The generation gate checks this before
writing the page module, so a missing-capability claim cannot be used to draw a
library component by hand.

`page-blueprint.json`, `page-content-recipes.json`, `stylePlan`, and `behaviorPlan` are required inputs before generation. The
blueprint records the user, work object, primary job, design rationale, region
responsibilities, content groups, data entities, states, interactions, success
criteria, and recovery paths. Every
content recipe must cover every Blueprint content group. It selects either
registered composition or a page-owned composite. Page-owned composites must
declare the business fields and states, the missing capability, queried and
rejected candidates, Token roles, and whether they remain page-owned or should
be promoted to the component library. Every page-owned composition group must declare its region, Token roles, and
`componentBoundary: "preserve"` in `stylePlan`; a group class name must be
declared there too. Every planned interaction must declare a supported behavior
kind, trigger binding IDs, and an observable `outcome` in `behaviorPlan`; interactive bindings refer to
the plan with `behaviorId`. The generated entry module is the only supported
application entry for the page. Do not recreate its mount or component tree in
a project `main.js`.

The selected Pattern's geometry is equally fixed. Use the resolver-provided
title segments and scroll bodies; do not reproduce pane padding in a page
group. For Pattern B, compose at the actual 360px secondary width and use the
16px surface / 24px content axes defined by the contract. The business model
still decides what the row or card means, which fields lead, what is selected,
and how the detail relates to it.

Every generated Pattern page also has one renderer-owned Titlebar scene. Bind
exactly one registered `Titlebar/Default` to `global-title-layer`; omit
`options.size` for the default `L`/`large`, or explicitly choose `M`/`medium`,
`L`/`large`, or `XL`/`xlarge`. `S`/`small` is reserved for the standalone
Secondary Page runtime and is rejected in a canonical Pattern title layer.
Never recreate a titlebar with page CSS or a page-owned header; the compiler
records the resolved size in `titlebar-scene.json` and fails before writing a
page artifact when the Titlebar is missing or uses an invalid size.

Build each `page-bindings.json` entry from the Context Packet and the exact
`query-components.mjs --context` result. For example, use
`primary-navigation-shell` for Primary Navigation Item,
`secondary-navigation` for Sidebar Item, `secondary-list-search` for Search,
`repeated-list-row` for List Item, and `selection-control` for Checkbox.
Use `primary-navigation-titlebar`, `global-titlebar`, or
`main-detail-titlebar` for the corresponding Titlebar placement.
Regardless of Pattern A/B/C/D, `global-title-layer` must contain exactly one
registered `Titlebar/Default` binding. For a pane-aligned Pattern use
`options.size: "medium" | "large" | "xlarge"` (default `large`); never use
`small` here. This one binding is the page Titlebar baseline; additional
Pattern segments are resolved by the Pattern contract and may not be rebuilt
as page headers.
For Pattern B, Search must use `slot: "secondary-list-title"`. The right title
segment must use one `main-detail-titlebar` binding in
`slot: "main-detail-title"`; its business actions are action objects inside
`slots["main-detail-actions"]`, not separate Button bindings. Use
`actionBehaviors` on that Titlebar when the nested actions need different
Behavior Plan outcomes. This is what preserves vertical centering, responsive
overflow, and the final window controls across HTML, React, and Vue.
The compliant generator derives `titlebar-scene.json` from this binding set and
the canonical Titlebar Scene contract. Treat that output as the exact Titlebar
design proposal for the page: revise the product copy or declared actions and
regenerate if the direction changes; never patch pane placement, title height,
Search alignment, or window controls in page code/CSS.
Do not hand-copy a previous page-bindings file: a stale binding can refer to a
component that is not present in the current renderer contract.

Prefer aliases from `designContext.iconAliases`, including nested navigation
items and Titlebar actions. If a request supplies a direct Lucide/source name
or an icon that is not registered yet, convert it to an approved alias before
generation. Unknown icon aliases are a generation error. Use only aliases
from `assets/icons/icon-aliases.json`; do not rely on a direct-source, suffix,
or visual fallback. This preflight is not a replacement for target-framework
runtime evidence. Do not manually rewrite the generated mount entry after a
failure; repair the owning binding.

Do not use prior generated pages as design references. They are not historical
inputs to this route. Only a user-approved page explicitly named with
`--approved-reference <id>` may be read from `references/approved-pages/`; it
can inform page-level composition only and cannot override the canonical
Pattern, component, Token, or behavior contracts.

If the selected Pattern requires two-level navigation, declare
`patternMode.navigation: "two-level"` and build the left pane through
`patternShell.navigation.slots`, not `composition.regions.primary-navigation`.
The Pattern renderer fixes its order: brand/action at the top, secondary
navigation in the middle scroll area, and icon-only primary navigation at the
bottom. Treat this as a shell constraint, not a model-authored layout choice.

The normal generation gate is the following four-part runtime/delivery check:

1. component contract and mapping resolution, including Pattern binding;
2. selected target-framework adapter load/render checks;
3. interaction and basic semantic continuity (roles, names, states, keyboard
   activation, and event paths);
4. exact project artifact and runtime evidence. Cross-framework tests and Skill
   synchronization run during library/Skill maintenance, not each page build.

Visual parity, contrast, and Token-style comparison are optional audit steps in
this project. Do not block ordinary generation on them unless the user asks for
a visual/style or release-readiness audit.

For HTML, React, and Vue, `page-bindings.json` must include one nested
`composition.regions` tree. The model owns page information architecture and
business grouping in that shared tree; registered leaves still render through
the component package. A flat component list is only an inventory and must not
be delivered as a page.

Start managed services and preview the generated component-backed artifact.
Capture runtime evidence from that exact artifact and run
`scripts/verify-fast-preview.mjs` before reporting it ready. A module or
intermediate manifest passing validation does not authorize delivery of a
separately handwritten HTML file. If the user requests one standalone HTML
file, use an approved bundler that consumes the generated component source; if
the workflow has no such bundler, report the packaging gate as blocked.

The artifact stamp is mandatory after every bundling or HTML/CSS edit. It binds
the exact HTML and every linked local stylesheet to the framework manifest. A
missing, empty, unlinked, or subsequently modified stylesheet is a blocking
failure; never reuse an older validation report or runtime evidence file.

If component lookup, Pattern resolution, or page generation fails, stop and
report the failed gate. Do not switch to editing `main.js`, `index.html`, or
page CSS by hand to keep the preview moving. A Vite/npm build proves only that
the application compiles; it does not prove Pattern composition or component
reuse. The final artifact must be traceable to
`generate-framework-page.mjs`, its `framework-page-manifest.json`, and the
HTML `component-usage.json` when the target is HTML.

Show the first interactive preview and pause for approval before optional
release-readiness validation or Pixso refinement.

Fast Preview may contain `provisional` components, but the result is
preview-only and must say so. Before formal delivery, run
`scripts/validate-web-component-reuse.mjs --stage release`; every registered
component must resolve to `approved` under
`references/components/component-readiness-policy.json`.

Do not use this route merely to import an already approved HTML page unchanged.
