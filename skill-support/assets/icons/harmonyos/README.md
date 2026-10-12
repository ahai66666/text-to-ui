# HarmonyOS Symbol assets

This folder vendors the HarmonyOS Symbol resources used by the Text to UI component system.

- Official library: https://developer.huawei.com/consumer/cn/design/harmonyos-symbol/
- Retrieved: 2026-07-14
- Data version: 1.0
- Font metadata: HM Symbol Regular, Version 1.000; Glyphs 3.1.2 (3151)
- Default export: Monochrome, Regular (`wght=400`), 24 × 24 viewBox

## Folder contract

- `source/` contains the official font and metadata snapshot used for reproducible export.
- `catalog/regular/` contains all 404 unique SVGs represented by the official page's 433 category entries.
- `catalog.json` preserves official names, Unicode values, and all category memberships.
- `regular/` contains the approved, product-named SVG aliases used directly by components and Pixso components.
- `manifest.json` maps stable product aliases to official glyph names and Unicode values.
- `tools/export-selected-symbols.py` regenerates the SVG subset from the source font.

Do not hotlink the Huawei website from product UI. Do not redraw, convert to Lucide geometry, or simulate a filled variant. Add an alias to the export script only after confirming that the official glyph is semantically appropriate.

The official page describes these assets as free downloads but does not expose a standalone redistribution license alongside the files. Keep this snapshot project-local; review Huawei's current terms before publishing the complete font or metadata as a public package.
