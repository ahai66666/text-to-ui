---
name: text-to-ui
description: 'Build and revise HarmonyOS PC desktop interfaces with the Text-to-UI workflow router, Blueprint gate, canonical Tokens, Patterns, HTML/React/Vue components, and Pixso mapping. Use for new pages, exact revisions, existing HTML imports, Pixso library work, converter diagnosis, or Skill maintenance.'
---

# Text to UI

Build HarmonyOS PC interfaces from the canonical components, Tokens, and
Patterns in this Monorepo. Choose one workflow, read its route and only the
selected supporting material, then follow its acceptance gates.

## 0. Lock the Skill entry and check runtime availability

Use this `SKILL.md` as the only Text-to-UI entry for the current task. Do not
discover or substitute another copy from an installed Skill, old checkout,
delivery mirror, preview, or task output. Resolve paths once before choosing a
route:

- In the complete repository, this file is at the repository root. Set
  `REPO_ROOT` to this directory and `RULES_ROOT` to its `skill-support/` child.
- In the separately packaged Skill, this file is beside `references/` and
  `scripts/`. Set `RULES_ROOT` to this directory, then locate the complete
  repository separately and set `REPO_ROOT` to that repository root.
- Every `references/`, `scripts/`, `assets/`, and `preview/` path below is
  relative to `RULES_ROOT`; every `packages/`, `apps/`, `tools/`, and root
  `package.json` path is relative to `REPO_ROOT`. Never resolve a missing
  reference against a different Skill copy.

Importing this Skill lets an AI tool discover its instructions; it does not
install the Monorepo's HTML, React, and Vue component packages. Before running
an executable workflow, verify that `REPO_ROOT` contains
`pnpm-workspace.yaml`, `packages/component-contracts`,
`packages/components-html`, `packages/components-react`,
`packages/components-vue`, and `packages/tokens`. If these are unavailable,
stop and report the missing dependency. Do not run repository checks from a
standalone Skill folder or claim production components were reused. See
`RULES_ROOT/references/component-package-integration.md` for the integration
contract.

Run repository checks from the Monorepo root. Invoke the route scripts from its
canonical `skill-support/scripts/` directory (or from `RULES_ROOT/scripts/` with
`--repo` pointing to that root). The commands below show the Monorepo-root
form. If the repository cannot be found, stop before route execution.

## 1. Choose one workflow

Classify the requested operation before loading detailed references:

| Request | Workflow route | Read next |
| --- | --- | --- |
| Import an approved existing HTML page into Pixso | `existing-html-to-pixso` | `references/routes/existing-html-to-pixso.md` |
| Create or materially redesign a page or flow | `new-page` | `references/routes/new-page.md` |
| Make an exact change to an approved artifact | `micro-revision` | `references/routes/micro-revision.md` |
| Build, repair, or synchronize Pixso components | `pixso-component-library` | `references/routes/pixso-component-library.md` |
| Diagnose a failed converter/import | `converter-diagnosis` | `references/routes/converter-diagnosis.md` |
| Audit or change this Skill and its mappings | `skill-maintenance` | `references/routes/skill-maintenance.md` |

A workflow route selects the operation. A task route selects the product domain,
Pattern, and initial component capabilities. Do not treat these as the same
router. The maintained workflow directory is
`references/routes/index.json`; route materials and hashes are maintained in
`references/routes/materials.source.json`; task-route IDs, aliases, and
domains are maintained in `references/index/task-routes.source.json`. Generated
indexes are rebuilt and checked from these sources.

Use the route resolver and receipt verifier when executing a workflow:

```bash
pnpm index:check
node skill-support/scripts/resolve-workflow-route.mjs --route <workflow-route> --repo . --receipt-out <route-receipt.json>
node skill-support/scripts/verify-route-materials.mjs --route <workflow-route> --repo . --receipt <route-receipt.json>
```

Receipts verify that the selected material closure is current. They do not mean
the model should load every registry or asset: read the route instructions,
their named references, and only the matching registry entries needed by the
task. Missing files, stale hashes, or partial receipts block the workflow.

## 2. Resolve the task and design

For a new page, **Mandatory Gate 0: analyze and build the page blueprint**
before component selection or generation. Require `page-blueprint.json` as the
page-design contract; a component list or generated page is not a substitute.
Read `references/routes/new-page.md` and follow its discovery, blueprint,
generation, and preview sequence. The blueprint is the design decision layer;
bindings implement those decisions. Keep the user's task, information
hierarchy, region responsibilities, content groups, interactions, and states
in the blueprint; keep component instances, props, and slot assignments in
`page-bindings.json`. Use the selected Pattern geometry and actual content
width, and design for the user's task rather than the component list.
Read `references/page-design-guidance.md` and
`references/page-blueprint-design.md` as directed by that route.

When resolving task context, use the canonical task route ID when the request
is ambiguous. `--task-route <route-id>` selects a specific task route while
preserving the original `--task` description. Ambiguous terms must return their
candidate IDs instead of selecting the first route. Unknown tasks require an
explicit approved Pattern and capability list; never infer a Pattern from a
component inventory.

Before binding components, inspect the selected Context Packet, exact Pattern
references, supported component inputs, and canonical icon aliases. Do not read
the entire component or Token registry when a targeted entry is sufficient.

## 3. Shared implementation rules

- The Pattern renderer owns shell geometry, pane order, slots, scroll regions,
  surfaces, dividers, and minimum window. Page content fills declared slots;
  it does not recreate the shell.
- Treat the opening trigger and Secondary Page layout as separate choices: a
  button can pop up a Secondary Page without making it a Dialog. Secondary
  Pages have two forms: `continuation` keeps the primary shell and replaces
  only the owning right/main content; `new-page` opens the standalone page
  frame through Secondary Page Runtime. Frame choice and presentation size are
  independent: when a user requests modal sizing for a `new-page`, size its host
  with the matching Semi-modal size Token (L is `--width-modal-lg`, 800px)
  without replacing the Secondary Page Runtime with a Dialog. For mail
  composition, read
  `references/domains/email-workbench.md` and use `new-page`; reserve Dialog
  and `open-overlay` for genuinely transient decisions or content that must
  keep the background visible.
- Resolve UI in this order: real target-framework component, matching
  canonical component contract, then Token-based custom composition for a
  capability the library does not provide. Use mapped/registered Pixso
  components for reuse. A Pixso target marked `excluded` is not a missing
  library component: for Dropdown Menu, compose the required menu directly
  from Token-bound native nodes and never import or reference a reusable master.
  Record registry evidence for custom work.
- Page CSS uses canonical Tokens and styles declared business-content groups.
  It must not override component internals, add a second pane inset, or redraw
  Pattern-owned borders, dividers, Titlebars, or navigation.
- Parent composition owns spacing between disclosure instances: second-level
  Sidebar groups use a `--space-5` (16px) gap, and repeated Accordion or
  Collapsible instances use the `tui-disclosure-group` wrapper with the same
  `--space-5` gap. Keep the individual `.tui-disclosure` internal
  trigger-to-content gap at `--space-1` (2px); never add per-instance margins.
- The shared shadow Tokens have nine standard contexts: the outer surfaces of
  Snackbar, Tooltip, Popover, Hover Card, Dialog, Alert Dialog, Semi-modal,
  Dropdown Menu, and Context Menu. Follow `assets/design-system/design.md`
  §4.6 for the exact roles. Other components and page surfaces normally use
  no shadow; a project-specific exception needs an explicit design rule and
  must not become a general Text-to-UI shadow Token role.
- Resolve icons through the registered semantic aliases. Unknown aliases stop
  the owning binding; do not substitute raw icon names, Unicode, or hand-drawn
  glyphs.
- Keep Pattern, component, Token, and behavior contracts authoritative across
  HTML, React, Vue, and Pixso. Follow
  `references/layouts/framework-layout-routing.md`, the selected Pattern
  references, `references/components/page-composition.md`, and
  `references/components/titlebar-segments.md` when applicable.

New pages use `scripts/generate-compliant-page.mjs`. It owns route/context
receipts, layout-contract creation, strict framework compilation, and atomic
output. Do not repair generated HTML, React, Vue, or CSS by hand after a failed
gate. For HTML, verify the exact browser artifact and its component evidence.
Use `references/workflows/fast-preview.md` for the first interactive review;
release checks follow only after the user approves the direction.

For browser previews and generated pages, use `@text-to-ui/pattern-runtime`
and `@text-to-ui/secondary-page-runtime` for their contracted shells. The
renderer owns regions and geometry; callers provide declared slot content.
Read `packages/pattern-runtime/README.md` for its callable APIs; Pattern
geometry and Titlebar composition remain in the selected layout references.

Visual contrast/parity comparisons are not default generation blockers when
canonical Tokens and components are used. Run broader visual review when the
user asks for an audit or release-readiness assessment.

## 4. Preview and Pixso

Start the managed Preview Hub, Component Gallery, and Pixso Bridge through:

```bash
node skill-support/scripts/start-text-to-ui-services.mjs start
```

Do not start a per-page server on `4173` or terminate an unknown service to
free a port; use the managed service entry.

For new HTML/React/Vue pages, show an early interactive preview after source
and layout checks. Keep the preview running for browser comments and iterate on
the same artifact until the user approves the direction.

For Pixso execution, read `references/pixso-execution-invariants.md`. For
component/Token mapping or HTML-to-Pixso conversion, use the matching Pixso
route and read its named mapping/import references. Do not redesign an
approved source when the request is an import.

## 5. Skill maintenance and completion

The normative entry is the repository-root `SKILL.md`; its supporting rules
and scripts live in `skill-support/`. A separately installed copy is not an
authoring source. For Skill maintenance, work in the repository, inspect
existing changes, rebuild and validate
the relevant indexes, and run source checks before synchronizing mirrors.
Follow `references/routes/skill-maintenance.md` and, for a major update,
`references/governance/major-version-update-checklist.md`. Never edit a
delivery mirror as the source of truth.

Report the delivered artifact paths, the selected workflow, validation status,
and any remaining limitation. Stop at the failed gate and report it; do not
silently switch workflows or reuse an unapproved generated page as a design
reference.
