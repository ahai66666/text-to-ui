# Web Component Reuse Gate

Use this gate for every generated HTML, React, or Vue page. Pixso fidelity and
Web component reuse are independent decisions: `fast visual import` may relax
Pixso instance requirements, but it never permits handwritten Web lookalikes.
This gate runs only after `pc-framework-layout-gate.md` passes. Components fill
the validated framework slots; they cannot alter pane order, title layers,
action slots, scrolling ownership, or resize behavior.
For the DeepSeek V4 Flash and GLM V5.1 comparison cohorts and pass/fail
protocol, see `experiments/component-first-model-comparison.md`; deterministic
tests are not substitutes for independent model generations.

## Required order

1. Confirm that `context-packet.json` is explicitly confirmed, then confirm
   that `layout-contract.json` exists and passes
   `validate-pc-framework-layout.mjs`.
2. Bind `page-spec.json.shell.pattern`, its pane order, and the strict HTML
   manifest layout block to that exact contract. A free-text Pattern fails.
3. Locate the Monorepo root containing `pnpm-workspace.yaml`,
   `packages/component-contracts`, and the three framework component packages.
4. Run `pnpm delivery:validate` from that root.
5. Read `packages/component-contracts/src/components.json` before writing page
   code. Search by task, behavior, logical name, Variant, slots, and states.
6. Select exactly one Web renderer for the product page: HTML, React, or Vue.
7. Resolve `component-selection.json` from the current Context Packet,
   bindings, and content recipes. A registered component that lacks a required
   prop, slot, behavior, or target implementation is `extend-existing`, not a
   custom drawing opportunity. A generic capability without a match is
   `new-shared`; only a specialized business composition may be `page-composite`.
   Pending decisions block generation until the shared packages are updated.
8. New one-shot pages in HTML, React, and Vue generate strict schemaVersion 3
   `component-usage.json` bound to that selection receipt. SchemaVersions 1
   and 2 remain readable for historical artifacts only.
9. Import the selected production package and its shared styles/Tokens in page
   source. Compose registered exports or factories; do not copy component DOM
   or CSS into the page.
10. Run `validate-web-component-reuse.mjs` before browser QA and delivery,
    then compare browser evidence with the same manifest and framework.

## Framework imports

- HTML: import runtime factories from `@text-to-ui/components-html` and load
  `@text-to-ui/components-html/styles.css` plus canonical Tokens.
- React: import components from `@text-to-ui/components-react` and load its
  shared styles plus canonical Tokens.
- Vue: import components from `@text-to-ui/components-vue` and load its shared
  styles plus canonical Tokens.

HTML-first means “use the production HTML renderer first.” It does not mean
“write a standalone imitation first.” A single-file delivery may be produced
only by bundling source that imported the production component package; the
editable source and component-usage evidence must remain in the delivery.

## What counts as reuse

Reuse is proven only when all of these are true:

- The exact registry `logicalName` is recorded in `component-usage.json`.
- The target framework has a real implementation path in the registry.
- Page source imports the matching `@text-to-ui/components-*` package.
- The rendered component carries the canonical contract attributes emitted by
  that adapter.
- Browser QA exercises the relevant state or interaction.

Strict Web additionally requires a named package export/factory import and
real call site in editable source for the selected framework. Strict HTML
additionally requires all of the following:

- every registered entry names the resolved `rendererKey` and a real factory
  call site;
- business content enters through supported renderer props/slots;
- rendered roots are not cleared with `replaceChildren` or `innerHTML`;
- runtime evidence from `collectHtmlComponentEvidence(document)` contains the
  expected logical name, count, region, state, and required slots;
- page-owned CSS passes the Token audit.

Run the generator before page code:

```bash
node skill-support/scripts/generate-html-component-skeleton.mjs \
  --context context-packet.json --layout-contract layout-contract.json \
  --bindings component-bindings.json \
  --out src/component-skeleton.js --manifest component-usage.json
```

The following are markers only and never prove reuse by themselves:

- `data-component` or `data-logical-component` added by page code.
- A matching class name, copied DOM, copied CSS, screenshot, or old preview.
- A Pixso Frame with the same component name.
- A historical generated page that already looks correct.

## Three-level source priority

Apply these levels in order for every UI region:

1. **Registered component:** when the target-framework implementation exists,
   import and render the production package. This is the only level that may be
   reported as component-library reuse.
2. **Contract-based implementation:** when no production implementation can do
   the job but a canonical contract specimen or rule exists, implement from
   that contract's exact structure, Variant, state, behavior, accessibility,
   icon, and Token rules. Record the contract source and why the library
   implementation is unavailable or insufficient. Report this as contract
   adaptation, not component-library reuse.
3. **Custom implementation:** only when neither a production component nor a
   relevant canonical contract exists. Draw it from the current requirement
   and HarmonyOS PC design rules, using shared Tokens, semantic icons, and
   accessibility conventions. Report it as custom.

For each `contractBased` or `custom` item, record:

- a stable page-owned ID;
- the capability that is missing;
- the registry queries used;
- reviewed candidate logical names and why each is insufficient;
- the shared Token roles used;
- whether it should remain page-owned or be promoted into the shared library.

Each `contractBased` item additionally records `contractLogicalName` and exact
contract evidence such as `canonicalSelector`, specimen, reference section, or
contract notes. Each `custom` item records `contractQueries` proving that no
relevant contract exists.

If a second- or third-level capability is reusable across products, promote it
into contracts and framework packages in follow-up work. Do not locally redraw
a Button, Input, Search, Select, Picker, Alert, Tooltip, Dialog, navigation item,
or other capability already available at a higher level.

`partial` does not mean “ignore the component.” When `sourceReady` is true and
the selected framework implementation exists and supports the required job,
use the real source and disclose the unverified readiness dimensions. If source
is absent or cannot satisfy required slots/behavior, continue at level 2 using
the canonical contract evidence. Do not jump directly from a partial component
to unrestricted custom drawing.

Contract-based and custom source must import shared Tokens and canonical
component styles. All visible color, typography, spacing, size, radius, shadow,
opacity, and icon choices must resolve through shared Tokens or semantic icon
aliases; literal values require an explicit intrinsic-content exception.

## Freshness rule

Do not inspect, copy, or extend a previous generated page as implementation
source unless the user explicitly asks to continue that artifact. Prior pages
may be used only as evidence when explicitly authorized. New requests start
from the confirmed requirements, current registry, current Tokens, and current
production adapters.

## Minimal manifest

```json
{
  "schemaVersion": 1,
  "targetFramework": "html",
  "registry": "packages/component-contracts/src/components.json",
  "sourceRoots": ["apps/example/src"],
  "registered": [
    {
      "logicalName": "Button/Primary/Default",
      "usage": "primary action"
    }
  ],
  "contractBased": [],
  "custom": [],
  "previousOutputReuse": false
}
```

This schemaVersion 1 example is historical compatibility only. New HTML,
React, and Vue pages use schemaVersion 3 with `enforcement: "strict-source"`,
the selection receipt hash, a framework-specific renderer factory/export,
`requiredCallSites`, `expectedRuntimeCount`, and declared regions/runtime slots.
Historical HTML schemaVersion 2 artifacts remain valid but are not emitted by
the one-shot route.

Validate it from the Monorepo root:

```bash
node skill-support/scripts/validate-web-component-reuse.mjs \
  --manifest /absolute/path/to/component-usage.json \
  --project-root /absolute/path/to/text-to-ui
```
