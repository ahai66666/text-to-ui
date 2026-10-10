# Framework Component Mapping

Use this reference when a React, Next.js, Vue, or static HTML page must reuse
the HarmonyOS component system.

## One contract, three real adapters

`packages/component-contracts/src/components.json` is the current component
contract source. Its `logicalName`, variants, states, props, slots, Token roles,
and readiness status apply across HTML, React, Vue, and Pixso. A matching
appearance or a `data-component` annotation alone does not prove reuse.

Each framework must use its own editable source adapter:

- HTML: semantic markup and native events from `@text-to-ui/components-html`.
- React: JSX components and props from `@text-to-ui/components-react`.
- Vue: SFC components and reactive props from `@text-to-ui/components-vue`.
- Shared visual rules: `@text-to-ui/component-styles` and `@text-to-ui/tokens`.

Preserve the logical contract attributes `data-component`,
`data-logical-component`, `data-variant`, and `data-state`. Do not treat CSS
Module hashes or framework-generated attributes as component identity. Do not
copy HTML into React/Vue or substitute a lookalike for a registered adapter.

## Page contract

New reusable or dual-output pages use page-spec schema version 2 and declare
`componentContract`:

```json
{
  "schemaVersion": 2,
  "componentContract": {
    "adapterMap": "assets/design-system/framework-component-adapter-map.json",
    "targetFramework": "react",
    "sourceAvailability": "source",
    "strictComponentParity": true
  }
}
```

Each binding uses the exact registry `logicalName`, an allowed `connectionMode`,
declared variants/states/slots, framework implementation evidence, and the
Pixso logical mapping. If editable React or Vue source is unavailable,
`compiled-runtime-fallback` must be explicit and strict parity must be false.

## Preview and verification

The only user-facing component preview is
`apps/component-gallery/index.html#runtime-view`. It renders the registered
runtime components and switches among the real HTML, React, and Vue adapters.
Use the managed HTTP service from the Monorepo root; React and Vue are not
available from a standalone Skill folder or a `file://` page. The Skill package
does not contain a duplicate or historical component gallery. Contract
fixtures are test inputs only, not preview pages or production components.

Run the relevant checks from the Monorepo root:

```bash
pnpm frameworks:validate
pnpm contracts:validate
pnpm runtime:evidence
pnpm gallery:readiness:test
pnpm gallery:build
```

Verify the component in the official Gallery after the checks pass. A
`Provisional` status permits preview, but does not claim visual, behavioral,
accessibility, or Token parity has been approved.

## Pixso rules

Resolve component identities by exact logical registry name. Map Web states to
Variant axes and content slots to component properties; create linked instances
and read back their component and Variable bindings. If a required property,
variant, Auto Layout rule, or semantic icon slot is missing, repair the shared
Pixso library instead of redrawing or detaching a registered component.
