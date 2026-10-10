#!/usr/bin/env python3

import argparse
import hashlib
import re
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parent.parent
PREVIEW_ROOT = SKILL_ROOT / "preview"


def digest(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()[:12]


def main() -> int:
    parser = argparse.ArgumentParser(description="Fingerprint local preview CSS and JavaScript dependencies.")
    parser.add_argument("--write", action="store_true", help="Update stale dependency fingerprints.")
    parser.add_argument("--check", action="store_true", help="Fail when dependency fingerprints are stale.")
    args = parser.parse_args()
    check_mode = args.check or not args.write
    desired_content: dict[Path, str] = {}

    css_pattern = re.compile(r'@import\s+url\((["\'])([^"\']+?\.css)(?:\?v=[^"\']*)?\1\)')
    for css_file in sorted(PREVIEW_ROOT.glob("*.css")):
        original = css_file.read_text(encoding="utf-8")

        def replace_import(match: re.Match[str]) -> str:
            dependency = (css_file.parent / match.group(2)).resolve()
            if not dependency.is_file():
                raise FileNotFoundError(f"Missing CSS dependency: {match.group(2)} in {css_file.relative_to(SKILL_ROOT)}")
            version = digest(dependency.read_bytes())
            return f'@import url({match.group(1)}{match.group(2)}?v={version}{match.group(1)})'

        desired_content[css_file] = css_pattern.sub(replace_import, original)

    html_pattern = re.compile(r'\b(href|src)=(["\'])([^"\']+?\.(?:css|js))(?:\?v=[^"\']*)?\2')
    for html_file in sorted(PREVIEW_ROOT.glob("*.html")):
        original = html_file.read_text(encoding="utf-8")

        def replace_reference(match: re.Match[str]) -> str:
            reference = match.group(3)
            if re.match(r"^(?:https?:|data:|//)", reference):
                return match.group(0)
            dependency = (html_file.parent / reference).resolve()
            if not dependency.is_file():
                raise FileNotFoundError(f"Missing preview dependency: {reference} in {html_file.relative_to(SKILL_ROOT)}")
            content = desired_content.get(dependency)
            version = digest(content.encode("utf-8") if content is not None else dependency.read_bytes())
            return f'{match.group(1)}="{reference}?v={version}"'

        desired_content[html_file] = html_pattern.sub(replace_reference, original)

    changed: list[Path] = []
    for file, desired in desired_content.items():
        if file.read_text(encoding="utf-8") == desired:
            continue
        changed.append(file.relative_to(SKILL_ROOT))
        if args.write:
            file.write_text(desired, encoding="utf-8")

    if check_mode and changed:
        print("Preview cache fingerprints are stale:")
        for file in changed:
            print(f"- {file}")
        print("Run: python3 scripts/update_preview_cache.py --write")
        return 1
    if changed:
        print("Updated preview cache fingerprints:")
        for file in changed:
            print(f"- {file}")
    else:
        print("Preview cache fingerprints are current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
