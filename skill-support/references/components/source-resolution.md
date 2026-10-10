# Component Source Resolution

Use the generated component index to locate candidates, then read only the exact selected entries in `packages/component-contracts/src/components.json`.

## Mandatory order

1. Import a real component from `@text-to-ui/components-html`, `@text-to-ui/components-react`, or `@text-to-ui/components-vue` when the target framework source exists.
2. When the library lacks the capability, implement from the matching canonical contract and record `matching-contract`.
3. Only when both searches miss, compose page-owned UI with shared Tokens, semantic icons, and HarmonyOS PC rules; record `custom` plus miss evidence.

Lookalike markup, copied DOM/CSS, screenshots, `data-component`, or matching class names do not count as component reuse. Patterns and domain compositions are allowed to arrange components but must not recreate component internals.

The selection result is binding, not advisory. Once a target-framework
implementation is found, page generation must use its registered renderer.
Only a documented missing capability may enter `contractBased` or `custom`;
the preflight rejects a custom registry query that overlaps an available,
source-ready component. This keeps a one-shot page build from silently falling
back to a handwritten visual duplicate.

## Pattern shell versus navigation item

`primary-navigation-shell` is a Pattern layout slot, not a component query. The
icon-only first-level controls placed in that slot must resolve to the native
`primary-navigation-item` component (aliases: `primary-navigation` and
`level-one-navigation`). Never resolve this capability to `sidebar`.

`sidebar` is reserved for labeled, content-bearing navigation rows such as
second-level project or team navigation. The contract gallery remains the
visual and interaction authority for both structures; it is not a second
runtime component package. The HTML/React/Vue packages are the framework
runtime adapter implementation source.

The framework `primary-navigation-item` adapters prefer the approved 24px
Lucide Regular semantic icons: `navigation/grid`, `field/calendar`,
`navigation/contacts`, `navigation/mail-unread`, and `action/settings`. A
direct or not-yet-registered icon is still allowed to render through the shared
icon resolver; it is recorded as a non-blocking diagnostic and must not use
filled or solid geometry when a Lucide source is available.

## Attachment/Default

- Use the native Attachment adapter when the framework package exposes it.
- The default surface has no border and uses `color.surface-muted`, mapped to
  `neutral-dark.5` / `--color-neutral-dark-05`.
- The trailing `actions` slot always exposes a 20px
  `navigation/chevron-down` menu trigger; do not render a direct download
  button on the attachment surface.
- The trigger opens a tokenized menu with exactly two actions: `预览` and
  `下载`. Selecting either action closes the menu and reports `onAction`; the
  compatibility callbacks `onPreview` and `onDownload` may also be emitted.
- Escape, outside click, and action selection close the menu and return focus
  to the trigger when the close was keyboard initiated.

Query example:

```bash
node skill-support/scripts/query-components.mjs \
  --framework react \
  --capabilities search,checkbox,list-item,tooltip
```

When a capability has multiple semantic forms, pass `--context`. A
`context-required` result is a blocking ambiguity, not permission to use the
first variant or draw a custom replacement. Selection recipes are maintained in
`references/components/component-selection-rules.json`.

## Readiness and delivery stage

After resolving the exact logical component, evaluate it with
`references/components/component-readiness-policy.json`:

- `approved`: allowed in Fast Preview and release;
- `provisional`: source and contract are usable, allowed only in Fast Preview
  with unresolved parity dimensions reported;
- `blocked`: do not generate or replace it with page-owned lookalike markup.

Use `scripts/validate-web-component-reuse.mjs --stage release` for formal
delivery. A successful Fast Preview does not promote provisional components.

For staged library acceptance, use
`scripts/build-component-acceptance-report.mjs`. The first maintained batch is
`references/components/core-component-acceptance.json`; it contains the eight
Pattern-critical components. Automated foundation checks prove that the
canonical contract, all framework sources, specimens, Token roles, and declared
behaviors exist. They do not replace visual, interaction, or accessibility
evidence and cannot promote a component by themselves.

## Titlebar/Default · Main Detail action slot

For segmented scenarios and executable slot values, read
`references/components/titlebar-segments.md`. Use the resolved Pattern's
title segments instead of drawing a separate titlebar layout.

- In a three-column shell, place actions scoped to the complete third pane in
  the native `main-detail-actions` slot.
- The slot accepts only the `ghost` Button variant in one of two modes:
  `icon` or `icon-text`.
- Keep page-global Primary actions, Secondary buttons, text-only buttons, and
  dropdown controls outside this slot. Window controls remain in the far-right
  system-action area.
