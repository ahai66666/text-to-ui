# Pixso component-library route

Read `references/pixso-import-details.md` and
`references/pixso-execution-invariants.md` for mapping and executor rules.

Read only the references needed for the requested operation:

- cross-source relationship selection and maintenance: `references/mapping-registry.md`
- component creation/synchronization: `references/pixso-component-maintenance.md`
- page instance usage and slots: `references/pixso-component-usage.md`
- native renderer structure: `references/pixso-native-scene.md`

## Import preflight

Resolve the active Monorepo root before using repository-relative paths. It
contains both `skill-support/` and `packages/component-contracts/src/components.json`.
If the task's working directory lacks those sources, check the configured
project location and the managed Preview Hub's working directory before
reporting them missing. The installed Skill and Gallery exports are delivery
copies; a generated index is evidence, not the editable component contract.
Record the source checkout actually inspected.

For each requested component or variant, compare these layers before deciding
what to import:

1. The HTML component contract, implementation, selected design rules, and
   current Gallery example: identity, props, slots, behavior, and surfaces.
2. `mapping-registry.json` formal `componentMappings`, `componentAliases`, and
   `endpointComponentMappings`, including policy, Variant bindings, and slots;
   then the generated Pixso specs and the component-facts capture date.
3. The live `NewComponents` library: exact component names, Variant properties,
   and relevant child layers and exposed properties. Variant axes alone do not
   reveal whether a child control already exists.

Record which capabilities are already present, partial, or missing, and change
only the missing layers. If a requested component is currently excluded from
Pixso mapping, treat its import as a scope change and update the canonical
registry after the new target passes the component gate. If the contract source
is unavailable after locating the active repository, report that specific
component-library blocker; do not infer that the existing HTML page-import
workflow is unavailable.

Use the HTML component contract as identity, props, slots, and source evidence.
Resolve current Pixso Variables, Styles, Components, and Variant GUIDs at
runtime. Production components target `NewComponents`; `Components` is
review-only when explicitly requested. A missing slot or mapped component blocks
only that component path—never create a lookalike and call it an Instance.

Build and test the plugin package only when renderer/API behavior changes.
