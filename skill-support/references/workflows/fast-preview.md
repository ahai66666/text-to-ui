# Fast Preview

Use this mode to reach the first real, interactive browser page quickly. It is a review gate, not final delivery.

## Required sequence

1. Record the task, Pattern, states and content hierarchy in the blueprint.
   Continue automatically unless a consequential user decision is missing.
2. Generate a Context Packet using `--auto --blueprint <file>`. Include task
   capabilities using `--capabilities`; route defaults are discovery seeds,
   not an exhaustive library inventory.
3. Use `generate-compliant-page.mjs` as the single generation entry point. It
   resolves `layout-contract.json`, verifies route/context material receipts,
   validates the blueprint, content recipes, bindings, composition CSS and
   schemaVersion 2 `component-usage.json`, then calls the strict framework
   generator with atomic output. React/Vue retain the compatibility manifest.
   The lower-level `generate-framework-page.mjs` command is for maintenance and
   regression fixtures only.
5. Import real target-framework components. Use contract implementation only for indexed library misses; use Token-based custom work only after both searches miss.
6. Run source reuse and page Token audits, then build or open the real page.
   Capture `collectHtmlComponentEvidence(document)` and run the runtime reuse
   audit before verifying viewport, framework geometry, primary path, one
   critical overlay, and keyboard recovery.
7. Show the page and pause for browser comments. Iterate on the same preview until the user explicitly approves the direction.

Do not run full repository, Pixso parity, packaging, mirror, or exhaustive state validation before direction approval unless a specific failure requires it.

## Minimum evidence

- Valid `context-packet.json` with `request.confirmed: true`.
- Valid `layout-contract.json` with a canonical Pattern ID.
- Valid `page-spec.json` whose Pattern and pane order match the layout contract.
- Valid `component-usage.json` with source level and evidence for every region.
- Page root and every pane carry the contract Pattern and pane-role markers.
- Strict HTML only: passing source-call, Token, and runtime-component evidence.
- Browser-openable real artifact.
- Target viewport and shell/pane check.
- Operable primary path.
- Review status: `pending`, `changes-requested`, or `direction-approved`.

Run `verify-fast-preview.mjs` for the deterministic portion. It blocks in this
order: layout contract, page spec, Pattern binding, structural markers,
component reuse, Token usage, and runtime component evidence. Browser
observations remain explicit manual evidence.
