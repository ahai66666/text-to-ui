# Registered Reuse Mode

Use this strategy when HTML and Pixso must render the same approved Tokens,
components, variants, states, icons, and Patterns with minimal page-level work.
It is the **strict structured reuse** strategy inside `html-first` or
`visual-first`; it is not another workflow. Fast visual import uses
`import-and-repair` and does not load this gate before the first Pixso Frame.

## Contract

Set page-spec schema version 2 and declare:

```json
{
  "componentContract": {
    "adapterMap": "assets/design-system/framework-component-adapter-map.json",
    "targetFramework": "react",
    "sourceAvailability": "source",
    "reuseStrategy": "registered-components",
    "strictComponentParity": true,
    "libraryPage": "NewComponents"
  }
}
```

Every component uses an exact registry `logicalName`, a stable Web selector,
and a real connection mode. Do not store Pixso GUIDs in the page spec.
The declared libraryPage identifies the source page used during the library
phase; the target product page may be any page in the same Pixso file. This
contract is selected only when the user requires native linked instances,
complete Variable bindings, or reusable library structure.

## Strict Path

1. Validate `page-spec.json`.
2. Run `plan-registered-reuse.mjs` and save `registered-reuse-plan.json`.
3. Render React, Vue, or static HTML from the shared framework adapter and
   canonical CSS Variables.
4. Deliver and browser-check the HTML draft before any Pixso call.
5. Run the Pixso target-page/path preflight in `references/pixso-mcp.md`.
   Confirm the active Pixso page is
   exactly NewComponents, then resolve the current source components and verify
   their live mainComponent/containing page, slots, SVGs, and Tokens.
6. Re-read the active page after the library phase, switch to the recorded
   target product page, and run the preflight again before creating linked
   instances. The target page does not need to be NewComponents; a page-name
   mismatch or unavailable page switch is a hard stop, not a reason to write to
   the currently selected page.
7. Apply only instance-safe text, icon, value, count, and state properties.
8. Bind Variables and Styles only on page-owned Pattern/content nodes.
9. Run the dual-output audit, icon crop audit, and screenshot comparison.

Use `code_to_design` once only when it materially speeds up Pattern geometry or
page-specific content. Do not use it as the component renderer, and do not
re-import for incremental fixes.

## Planner Results

- `verified`: instantiate directly in Pixso and render the framework component.
- `mapped-pending-verification`: verify one temporary linked instance in the
  active component-library page.
- `mapped-needs-rebuild`: repair the shared component once; do not patch pages.
- `missing-target`: create and register the missing shared component later.
- `compiled-runtime-fallback` or blocked content: allow an explicitly
  requested HTML preview only; never send that plan to Pixso as if it were
  strict.

For fast visual import, partial reuse is optional: reuse verified components
only when their exact Variant, slots, and current GUID are proven, and report
all remaining regions as page-owned. Never let a pending, rebuild, missing,
runtime-fallback, or blocked-content row stop the initial visual Frame. Those
rows stop only the strict structured reuse path; preserve the verified HTML
draft and report the exact shared-library repair needed.

## Manual Work Boundary

Manual work belongs in the shared library only when a new component, variant,
semantic SVG slot, editable content property, Auto Layout rule, Variable, or
Style is missing. After that one-time repair becomes `verified`, every page must
reuse it without reconfiguring its internal style.

Strict completion requires the planner to pass with `--strict`, all Web
components to use source or first-party wrapper connections, all Pixso
components to remain linked, and the live Pixso audit to report no hardcoded
styles or blocked component content. Also run
`node scripts/validate-mapping-registry.mjs --strict-component-gates`; a
`pending-review` mapping is acceptable during page import but cannot pass the
shared-library release gate.
