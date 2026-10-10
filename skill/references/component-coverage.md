# Component Coverage

Use this reference when adding a component or auditing framework coverage.

Last checked: 2026-10-10

## Current Source and Gallery

- The authoritative component list and framework adapters are in
  `packages/component-contracts/src/components.json`.
- The sole user-facing component preview is
  `apps/component-gallery/index.html#runtime-view`.
- The registry currently contains 49 components across HTML, React, and Vue.
  Its readiness projection is 0 Approved, 49 Provisional, and 0 Blocked. Read
  current counts from the registry and Gallery instead of maintaining another
  hand-edited inventory.
- An imported standalone Skill does not include the Monorepo component
  packages or a second, older component gallery. Use the full Monorepo for
  component preview and runtime verification.

## Coverage Gate

For each component addition or change, keep these synchronized:

1. The component contract, semantic Tokens, framework adapters, and Pixso
   mapping where applicable.
2. The component's current runtime specimen in the official Gallery.
3. Repeatable interaction, keyboard, accessibility, and visual evidence for
   each supported framework. `Provisional` does not mean fully approved.

Run the affected contract and framework checks, then rebuild and inspect the
Gallery from the Monorepo root. Do not use a fixture, copied preview, or
standalone Skill file as a substitute for the official component runtime.
