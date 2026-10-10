# Icon Selection and Semantic Aliases

Use this reference whenever an icon is selected, replaced, or introduced in Pixso or HTML.

## Source authority

Use the first source that provides an approved match:

1. User-provided exact SVG.
2. Existing approved project semantic alias.
3. Direct Lucide/source name when the page needs an icon that has not been registered yet.
4. Lucide for broad product, business, navigation, communication, file, data, device, and industry concepts.
5. HarmonyOS Symbol for platform-specific concepts and already-approved HarmonyOS glyphs.
6. A documented manual fallback.

Never replace a higher-authority asset silently. The Titlebar window-control SVGs are an example of user-provided exact assets and remain authoritative.

## Selection workflow

1. Write the semantic intent as `category/concept`, separating action, object, and state. Examples: `action/add`, `field/search`, `navigation/sidebar-collapse`, `communication/mail-unread`.
2. Translate the concept into canonical English search terms. Search synonyms when the first term is ambiguous.
3. Use `pnpm icons:search -- <query>` to discover Lucide filenames. Shortlist 2–3 plausible candidates. A direct filename may be used immediately when the alias registry does not yet contain it.
4. Render candidates at the actual component size: 16px, 20px, or 24px. Compare silhouette, direction, density, and neighboring icons.
5. Choose the closest visual and semantic match, then bind it to a stable project semantic alias.
6. Record any intentionally non-obvious choice near the alias map.

Legacy short names and flattened names such as `close`, `disclosure-down`,
`window-minimize`, and `settings` are accepted as non-blocking compatibility
inputs. The shared resolver first maps them to an existing canonical alias;
only an actually unresolvable name receives the explicit manual fallback.

Do not select an icon solely from a Chinese label, the first filename match, or loose visual resemblance. Ask the user only when multiple candidates communicate materially different product meanings.

## Deterministic export workflow

Treat `assets/icons/icon-aliases.json` as the machine-readable source of icon identity. It maps semantic aliases to pinned Lucide names, vendored HarmonyOS SVGs, or exact project assets.

1. Search Lucide by concept when the alias does not exist:

   ```bash
   pnpm icons:search -- reply
   ```

2. Add the approved semantic alias to `assets/icons/icon-aliases.json` when the icon is becoming reusable or needs exact Pixso provenance. Do not invent a semantic alias merely to unblock a page; direct source requests are allowed and receive a runtime diagnostic until registered.
3. Generate exact source geometry from the registry. For a single-file HTML output, inject the sprite directly into the page:

   ```bash
   pnpm icons:export -- \
     --alias action/reply \
     --alias action/forward \
     --html /absolute/path/to/index.html
   ```

   For a multi-file project, emit a shared sprite instead:

   ```bash
   pnpm icons:export -- --aliases action/reply,action/forward --out /absolute/path/to/icons.svg
   ```

4. Reference the generated semantic symbol without copying its geometry:

   ```html
   <svg class="icon" aria-hidden="true">
     <use href="#icon-action-reply"></use>
   </svg>
   ```

5. Run the strict audit before delivery:

   ```bash
   pnpm icons:audit -- /absolute/path/to/index.html
   ```

The exporter imports the installed `lucide@1.24.0` node arrays and serializes them without redrawing paths. Generated symbols record `data-icon-alias`, `data-icon-source`, and the upstream icon name or asset path. The audit regenerates the expected symbol from the pinned source and fails when the delivered geometry differs.

For standalone HTML, prefer the injected sprite because an external `<use>` reference may be restricted when the user opens the page through `file://`. Re-running the exporter replaces the marked sprite block deterministically.

Pixso's HTML importer does not reliably resolve a hidden `<symbol>` sprite.
Keep the browser HTML unchanged, create a separate import copy with
`node scripts/prepare-pixso-html.mjs --in <browser.html> --out <pixso.html>`,
and pass that copy to `code_to_design`. The script preserves the semantic alias,
source provenance, viewBox, display-size token, and source vector geometry while
removing the sprite only from the import copy. A strict Pixso preparation must
resolve every `<use>`. An icon with no semantic alias may still be imported
when its source geometry is present; the preparation keeps its source/sprite
marker and adds an explicit manual-fallback marker. Register it later when it
needs exact reusable library provenance; registration is not a prerequisite
for a runnable page.

Strict audit treats unregistered `<symbol>` elements and unprovenanced inline SVG geometry as errors. Non-icon SVGs must declare `data-svg-role="logo"`, `illustration`, `chart`, or `decoration`. A true manual icon fallback must declare `data-icon-manual-fallback` and be documented in the project alias decision record.

## Rendering rules

- Standard artboard: 24 × 24.
- Client display sizes: 16px, 20px, and 24px. A legacy 12px token may remain for compatibility, but it does not introduce another client stroke rule.
- Outline icon stroke rule: keep a 1.5px source stroke on the 24 × 24 artboard. Uniformly scaling the SVG root and its internal vectors produces the required effective display widths: 24px → 1.5px, 20px → 1.25px, and 16px → 1px.
- Lucide: outline, 1.5px source stroke, round line cap, round line join.
- Lucide geometry must come from the pinned package through `scripts/export-icon-sprite.mjs`. Keep the 1.5px source stroke on the 24 × 24 geometry and scale the rendered `<svg>` root and internal vectors together; do not edit or independently redraw the exported nodes.
- The default global icon style is pinned Lucide Regular outline geometry through semantic aliases. HarmonyOS Filled variants are not a global Text-to-UI icon system and must not be generated or selected as a library.
- `primary-navigation-item` first-level icons use the approved Lucide Regular semantic aliases at 24px. Keep them linear; do not use filled or solid geometry. Sidebar and second-level navigation follow the same Lucide Regular rule.
- Color: inherit `currentColor` from the component state unless a component rule explicitly defines multiple colors.
- Disabled: inherit the component-wide 40% opacity; do not separately fade the icon.
- **Pixso parity:** use `assets/design-system/pixso-icon-map.json`. A Text to UI node must carry a semantic alias, exact SVG source provenance, and a 16px, 20px, or explicitly approved 24px display-size token. `HM Symbol` and `icon_font` are prohibited in newly generated Text to UI components or pages; they may remain only inside unmodified HarmonyOS-native source components.
- Never reduce only a Pixso icon container. Resize the SVG root and its internal vectors together, then centre the resulting geometry in the icon slot.
- **Hot-zone alignment:** the icon slot is a square hit area, separate from the visible vector bounds. Set both the horizontal and vertical alignment to `CENTER`; never inherit top/start alignment from the HTML wrapper or a component master. After hydration, centre the actual vector bounds inside the slot on both axes. This applies equally to page-owned SVGs, generated icon Components, and swapped icon Instances.
- **Stroke verification:** use the design-system table as the authority: 16px = 1px, 20px = 1.25px, and 24px = 1.5px. For another explicitly approved size, use `1.5 × displaySize ÷ 24` after normalizing the source to the 24 × 24 / 1.5px contract. Do not copy an asset's raw stroke-width unchanged to smaller icons.
- **Crop gate:** after code-to-design import, read each icon wrapper and vector
  bounds. The wrapper must use visible overflow, the root and internal vector
  must preserve the same 24 × 24 source geometry, and the display-size token
  must leave the glyph fully inside its slot. A clipped bound, sprite-use
  wrapper, or icon-font conversion fails the Pixso audit; replace it with the
  exact exported SVG or a linked NewComponents instance before continuing.

## Alias contract

Reusable components reference semantic names, not library filenames. An alias may change its underlying source without changing component markup.

```text
field/search              -> lucide/search
field/date                -> harmonyos/calendar
field/time                -> harmonyos/clock
communication/mail       -> lucide/mail
navigation/panel-left    -> lucide/panel-left
navigation/sidebar-collapse -> lucide/panel-left
navigation/sidebar-expand   -> lucide/panel-left
status/info                 -> assets/icons/status/info-circle.svg
status/success              -> assets/icons/status/success-circle.svg
status/warning              -> assets/icons/status/warning-circle.svg
status/danger               -> assets/icons/status/danger-circle.svg
status/neutral              -> assets/icons/status/neutral-circle.svg
window/minimize          -> assets/icons/titlebar/window-minimize.svg
window/maximize          -> assets/icons/titlebar/window-maximize.svg
window/close             -> assets/icons/titlebar/window-close.svg
```

Aliases should be lower-case and slash-separated. Use product meaning in the alias and source identity only on the mapping side.

The code-facing symbol id is deterministic: `action/reply` becomes `#icon-action-reply`. Treat that id as generated output rather than a second hand-maintained alias table.
