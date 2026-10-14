---
name: text-to-ui
description: 'Build and revise HarmonyOS PC desktop interfaces with the Text-to-UI workflow router, Blueprint gate, canonical Tokens, Patterns, HTML/React/Vue components, and Pixso mapping. Use for new pages, exact revisions, existing HTML imports, Pixso library work, converter diagnosis, or Skill maintenance.'
---

# Text to UI

Use this file as the only entry point for a Text-to-UI task. Choose one route,
read its named materials, and work from the current canonical sources. Do not
substitute a delivery mirror, installed copy, old checkout, or generated page.

## Lock the Skill entry and locate the source

In the full repository, `REPO_ROOT` is the folder containing this file and
`RULES_ROOT` is its `skill-support/` child. In the separately installed Skill,
`RULES_ROOT` is the Skill folder; locate the full repository separately. Verify
`pnpm-workspace.yaml`, `packages/component-contracts`, `packages/tokens`, and
all three component packages before executing a page workflow. The canonical
Git source is <https://github.com/ahai66666/text-to-ui>. If the source is not
available, stop and report what is missing. The separately distributed
HTML-only edition includes its own component runtime and has its own entry
point; do not mix its files with this repository.

Paths under `references/`, `scripts/`, `assets/`, and `preview/` resolve from
`RULES_ROOT`. Paths under `packages/`, `apps/`, and `tools/` resolve from
`REPO_ROOT`. Run repository commands from `REPO_ROOT`. Read
`references/component-package-integration.md` for package integration.

## Select the workflow

| Request | Workflow route | Read next |
| --- | --- | --- |
| Import an approved HTML page into Pixso | `existing-html-to-pixso` | `references/routes/existing-html-to-pixso.md` |
| Create or redesign a page | `new-page` | `references/routes/new-page.md` |
| Revise an approved artifact exactly | `micro-revision` | `references/routes/micro-revision.md` |
| Build or synchronize Pixso components | `pixso-component-library` | `references/routes/pixso-component-library.md` |
| Diagnose converter or import failure | `converter-diagnosis` | `references/routes/converter-diagnosis.md` |
| Audit or maintain this Skill | `skill-maintenance` | `references/routes/skill-maintenance.md` |

The workflow route chooses the operation; a task route chooses the product
domain, Pattern, and component capabilities. Resolve task ambiguity through the
route catalog, never by guessing from a component list. Route definitions and
material hashes live in `references/routes/index.json`,
`references/routes/materials.source.json`, and
`references/index/task-routes.source.json`. Run `pnpm index:check`, then the
route resolver and receipt verifier named by the selected route. Stale or
missing materials block execution. Read only the selected route and relevant
registry entries, not the entire Skill.

## Generate or revise a page

**Mandatory Gate 0: analyze and build the page blueprint.** For a new page,
build `page-blueprint.json` before selecting components. Record
the user's task, information hierarchy, region responsibilities, content
groups, interactions, states, and success criteria. The blueprint decides the
page. The blueprint is the design decision layer; `page-bindings.json` names
concrete components, props, and slots. Use the
selected Pattern and real content width. Follow
`references/page-blueprint-design.md` and `references/page-design-guidance.md`.

Use `scripts/generate-compliant-page.mjs` as the generation entry. It checks
route and context receipts, blueprint, recipes, component selection, layout,
CSS boundaries, and component usage before writing output. Current component
usage is schemaVersion 3 and requires a component-selection receipt. Do not
repair generated HTML, JSX, Vue, or CSS after a failed gate; fix its source
inputs. For HTML, inspect the exact browser artifact and
`collectHtmlComponentEvidence(document)`. See `references/routes/new-page.md`
and `references/web-component-reuse-gate.md` for the complete commands.

Resolve reusable UI in this order: real target-framework adapter, matching
canonical component contract, then Token-based custom composition where the
library has no matching capability. A page-owned composite may arrange
registered controls but must not redraw them. Components share the
`data-component`, `data-logical-component`, `data-variant`, and `data-state`
contract. Framework-specific previews must load the actual adapter source.
Do not report visual lookalikes as library reuse.

Pattern Runtime owns pane order, shell geometry, slots, surfaces, scroll
regions, dividers, minimum window, and Titlebar placement. Page content fills
declared slots; page CSS must not override Pattern geometry or component
internals. Use canonical Tokens and semantic icon aliases. Unknown icon
aliases stop the binding. Align related content on shared visual axes without
adding a second pane inset. For Pattern B, the renderer owns primary
navigation, secondary list, and main detail insets. For repeated disclosures,
use the `tui-disclosure-group` parent gap rather than per-instance margins.
Read the selected layout reference and `packages/pattern-runtime/README.md`.

A Secondary Page is a page frame choice: `continuation` retains the current
shell and replaces its owning content; `new-page` uses a standalone frame.
Opening it from a button does not make it a Dialog. The matching Semi-modal
size Token may size a `new-page` host without changing the page type. Read
`references/components/page-composition.md` when composing overlays and
secondary flows.

## Preview, Pixso, and maintenance

Start managed services with
`node skill-support/scripts/start-text-to-ui-services.mjs start`. Show the
first interactive preview after source and layout checks, then revise that
same artifact from browser feedback. Build success alone does not prove runtime
behavior or visual alignment. For Pixso, follow the selected route and
`references/pixso-execution-invariants.md`; read back native nodes, component
links, Variables, and icons after import.

Maintain root `SKILL.md`, `skill-support/`, and `packages/` as source. Rebuild
indexes and plugin artifacts, validate the changed behavior, then synchronize
managed mirrors with `pnpm skill:sync` and verify with `pnpm skill:check`.
Follow `references/routes/skill-maintenance.md` and the major-version
checklist when applicable. Do not author in `skill/` or an installed mirror.
Report the selected route, delivered paths, checks performed, and unresolved
limitations. Stop at failed gates rather than silently changing workflows.
