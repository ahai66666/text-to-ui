#!/usr/bin/env python3
"""Export the full HarmonyOS Symbol catalog and approved product aliases."""

from __future__ import annotations

import json
import re
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.roundingPen import RoundingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.misc.transform import Transform


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source"
OUTPUT = ROOT / "regular"
CATALOG_OUTPUT = ROOT / "catalog" / "regular"

# Product aliases stay stable even if an official glyph name is awkward in UI code.
ICONS = {
    "add": "plus",
    "close": "xmark",
    "disclosure-down": "chevron_down",
    "download": "arrow_down_circle",
    "grid": "square_grid_2x2",
    "history": "clock",
    "more": "more",
    "refresh": "arrow_clockwise",
    "search": "magnifyingglass",
    "settings": "gearshape",
    "trash": "trash",
    "user": "person",
}


def load_catalog() -> tuple[dict[str, int], dict[str, list[str]]]:
    document = json.loads((SOURCE / "name-map-new.json").read_text(encoding="utf-8"))
    codepoints: dict[str, int] = {}
    categories: dict[str, list[str]] = {}
    for category, items in document["data"].items():
        for item in items:
            name = item["name"]
            codepoints.setdefault(name, int(item["unicode"], 16))
            categories.setdefault(name, []).append(category)
    return codepoints, categories


def path_for_glyph(glyph_set, glyph_name: str, transform: Transform) -> str:
    svg_pen = SVGPathPen(glyph_set)
    rounded_pen = RoundingPen(svg_pen, roundFunc=lambda value: round(value, 3))
    glyph_set[glyph_name].draw(TransformPen(rounded_pen, transform))
    return re.sub(
        r"-?\d+\.\d+(?:e[+-]?\d+)?",
        lambda match: f"{float(match.group()):.3f}".rstrip("0").rstrip("."),
        svg_pen.getCommands(),
        flags=re.IGNORECASE,
    )


def write_svg(path: Path, official_name: str, path_data: str) -> None:
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" '
        f'role="img" data-harmonyos-symbol="{official_name}" '
        'fill="currentColor">\n'
        f'  <path d="{path_data}"/>\n'
        '</svg>\n'
    )
    path.write_text(svg, encoding="utf-8")


def main() -> None:
    font = TTFont(SOURCE / "HMSymbol.ttf")
    glyph_set = font.getGlyphSet(location={"wght": 400})
    cmap = font.getBestCmap()
    name_map, categories = load_catalog()
    scale = 24 / font["head"].unitsPerEm
    transform = Transform(scale, 0, 0, -scale, 0, font["hhea"].ascent * scale)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    CATALOG_OUTPUT.mkdir(parents=True, exist_ok=True)

    catalog = []
    for official_name, codepoint in sorted(name_map.items()):
        glyph_name = cmap[codepoint]
        path_data = path_for_glyph(glyph_set, glyph_name, transform)
        write_svg(CATALOG_OUTPUT / f"{official_name}.svg", official_name, path_data)
        catalog.append(
            {
                "name": official_name,
                "unicode": f"{codepoint:04X}",
                "categories": categories[official_name],
                "file": f"catalog/regular/{official_name}.svg",
            }
        )

    for alias, official_name in ICONS.items():
        codepoint = name_map[official_name]
        glyph_name = cmap[codepoint]
        path_data = path_for_glyph(glyph_set, glyph_name, transform)
        write_svg(OUTPUT / f"{alias}.svg", official_name, path_data)

    (ROOT / "catalog.json").write_text(
        json.dumps(
            {
                "source-count": 433,
                "unique-count": len(catalog),
                "weight": 400,
                "style": "monochrome",
                "icons": catalog,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
