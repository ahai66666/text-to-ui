# Framework Layout Routing

Choose the framework contract before components or page code.

- Navigation to content, dashboard, settings, or content hub: Pattern A.
- Repeated list to detail, including mail, contacts, tasks, and records: Pattern B.
- Command-heavy tool or canvas workspace: Pattern C.
- Add an inspector to B or C only when contextual inspection is necessary: Pattern D.

Use only the canonical Pattern IDs in machine-readable artifacts:
`pattern-a-two-pane`, `pattern-b-three-pane`, `pattern-c-tool-workspace`, or
`pattern-d-inspector`. Names such as `Mail Workbench/Three Pane` and
`three-pane-list-detail` are descriptive labels, not valid Pattern identities.
The selected Pattern must be confirmed before `resolve-context.mjs` is called
with `--confirmed`; unknown tasks require an explicit Pattern ID and capability
list instead of an inferred route.

Resolve the selected ID through
`assets/design-system/pattern-contracts.json` before rendering. HTML, React,
Vue, and Pixso all consume this same resolved object. Framework packages own
component implementations, not separate copies of Pattern geometry or slot
policy. Pixso materializes a Pattern as native Frames containing component
Instances; the Pattern itself is not registered as a component.

Always preserve the Global Title Layer, pane order, inset owners, scroll owners, resize behavior, minimum window, and declared action slots. In Pattern B, every action scoped to the complete third pane belongs in the `main-detail-actions` Titlebar slot (`0..n` actions). That slot accepts only `icon` and `icon-text-ghost` Button types with the `ghost` variant. Components fill slots; they never reshape the shell.

Use `query-layouts.mjs` to locate the exact sections in `harmonyos-layout-patterns.md`, `layout-system.md`, and `pc-framework-layout-gate.md`.

Pattern A navigation starts below Titlebar with `space/2` (8px) top inset:
`global-primary-action` (Button) precedes `primary-navigation-shell` (Sidebar).
The optional `primary-navigation-footer` slot is anchored bottom-left outside
the navigation scroll body. Fill it with a registered Button using
`variant: "ghost", mode: "icon-text"`; its label, icon and action are configurable.
Omit the slot when not needed. Do not move this footer into the scrolling list.

Pattern B two-level navigation uses an 8px (`space/2`) top inset below the
title layer: fixed Button (`global-primary-action`), scrollable Sidebar
(`secondary-navigation-content`), fixed level-one Primary Navigation Items
(`primary-navigation-bottom`). Sidebar overflow is clipped with a bottom fade
mask inside its own bounded scroll region. The primary rail is outside this
region and must never scroll away or be masked. The legacy
`primary-navigation-shell` slot is optional, not a second Sidebar container.
The Sidebar slot's internal padding is `space/4` (16px) on all four sides;
empty optional legacy slots must not create additional spacing.
The `primary-navigation-bottom` slot is a responsive distribution row owned by
the Runtime. When it contains four level-one icon items, the slot fills the
available width, each direct item wrapper receives an equal flexible track,
and the registered icon control is centered in that track. Generated HTML may
emit one behavior/component `span` wrapper per item; legacy content may emit a
direct `nav`, so Runtime selectors must support the actual renderer shapes
instead of assuming only `> nav`. Fixed gaps, leading-edge packing, and
page-owned spacing repairs are invalid. Verify the rendered DOM and computed
positions at the target viewport before accepting the page.
If the items need a shared behavior host, make it a `nav` group with the
`tui-primary-navigation-items` class; keep the behavior module on that group.
Do not give the group a page-owned flex direction, gap, or width. Four icons
must appear on one row at the bottom of the primary pane, not as a vertical
rail. The framework generator rejects grouped content without this container.

For callable Pattern previews and generated pages, use the registered
`@text-to-ui/pattern-runtime` contract. Its Skeleton/Runtime and Secondary Page
APIs are documented in `packages/pattern-runtime/README.md`; geometry and
slot-placement rules remain in `references/harmonyos-layout-patterns.md` and
`references/components/titlebar-segments.md`.
