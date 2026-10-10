# HTML Output Rules

Use this reference before implementing the final HTML/CSS.

## Default Output

- Create a browser-openable `.html` file with embedded CSS and JavaScript for a simple one-view interactive demonstration.
- Use separate files when the work is multi-page, asset-heavy, or intended to keep growing.
- Use semantic HTML: `main`, `section`, `form`, `label`, `input`, `button`, `nav`, `article` where appropriate.
- Make controls real elements, not only decorative divs.
- Target HarmonyOS PC desktop application windows. Support approved desktop window sizes; do not add mobile behavior unless the platform contract changes.
- Use CSS variables that map to the style library or `design.md` tokens.
- For reusable or dual-output work, copy mappings from
  `assets/design-system/dual-output-token-map.json` into `page-spec.json`.
  Declare and consume the exact CSS custom property; never copy its resolved
  value from Pixso or browser computed styles.
- Reuse component classes (`.button`, `.field`, `.card`, `.nav-item`) instead of one-off selectors when the project may grow.
- Prefer CSS gradients, borders, backdrop-filter, and pseudo-elements for decorative UI. The shared shadow Tokens have nine standard overlay contexts in `assets/design-system/design.md` §4.6; other elements normally have no shadow. Any project-specific exception needs an explicit project design rule.
- Avoid external image or font dependencies unless the user asks or assets are supplied.
- Resolve product icons through `assets/icons/icon-aliases.json`. Generate Lucide and approved asset symbols with `scripts/export-icon-sprite.mjs`; do not hand-author approximate SVG paths.
- In a single-file HTML output, inject the generated sprite into the document and render instances with semantic `<use href="#icon-...">` references. Preserve `data-icon-source` provenance on generated symbols.
- Keep the browser artifact and the Pixso import artifact separate. Before passing
  HTML to `code_to_design`, run
  `node scripts/prepare-pixso-html.mjs --in <browser.html> --out <pixso.html>`.
  The preparation step removes the hidden sprite only in the copy sent to Pixso
  and replaces every resolvable `<use>` with the exact source geometry as an
  inline SVG. Never replace the browser sprite with approximate paths.

For TailwindCSS, read `implementation-strategy.md` first. Use Tailwind for multi-page or reusable work when it fits the existing project.
For Vue SFC, scoped CSS, CSS Modules, or Vue UI libraries, also read
`vue-token-mapping.md`.

## Delivery Folder

Default final folder:

`<workspace>/outputs/` (or the user-configured output root)

If writing there requires approval, request it. If approval is unavailable, save to workspace `outputs/` and clearly tell the user.

## Naming

- Use descriptive kebab-case filenames.
- Avoid overwriting existing user files. If the target exists, use `name-v2.html` or ask before replacing.

## Structure

Use this for one-off pages:

```text
project-name/
├── design.md
└── index.html
```

Use this for multi-page static CSS:

```text
project-name/
├── design-strategy.md
├── design.md
├── pages/
├── styles/
└── assets/
```

## Quality Bar

- The first viewport should show the product/page itself.
- The page should look intentionally designed, not like a raw form demo.
- Text must fit within parent containers at the default `1728 × 1152px` viewport and other approved desktop window sizes.
- Implement the primary workflow and relevant hover, focus, error, disabled, selected, loading, modal, and menu states.
- Do not include visible instructional text about how the UI was built.
- Keep CSS maintainable: variables for colors, grouped component rules, meaningful class names.
- Keep page/component declarations free of hardcoded hex, RGB, HSL, named
  colors, arbitrary color utility values, and resolved copies of any mapped
  size/spacing/radius/layout Token.
- For an existing compiled React/Vue/Tailwind artifact, generated bundle
  `<style>`/`<script>` blocks may use `data-token-audit="vendor"` only when a
  separate `data-token-audit="page"` layer completely controls the delivered
  screen's visible Token, Component, and Pattern styling. This is an audit
  boundary, not permission to hide handwritten hardcoded values.
- When rebuilding a compiled React/Vue/Tailwind bundle is unavailable, keep its
  framework classes as implementation residue and map the delivered UI at
  stable component selectors and states. Record every visible selector,
  property, and CSS-variable mapping in `tokenContract.webCoverage`; declaring
  a Token once at `:root` is not proof that the component consumes it.
- Map framework colors at the component/state layer. Do not globally redefine a
  palette class such as `text-slate-*`, because the same palette value can
  represent text, icon, border, or surface roles in different components.
- SVG and icon-font wrappers must inherit semantic color through
  `currentColor`. Do not use brightness, invert, opacity, or other CSS filters
  to simulate a Token color.

## Verification

- Check file exists and has plausible size.
- Inspect key sections with `sed` or equivalent.
- Run `node scripts/audit-icons.mjs --strict <html-file>` for every output containing SVG icons. Fix unknown aliases, missing symbols, altered source geometry, and unprovenanced inline icon SVGs before visual QA.
- Run `node scripts/validate-page-spec.mjs <page-spec.json>` and
  `node scripts/validate-dual-output.mjs --page-spec <page-spec.json> --html
  <html-file>` for reusable or dual-output work.
- If browser tools are available, inspect and screenshot at `1728 × 1152px`, exercise the primary interactions, and compare the result with Pixso.
- If no browser tool is available, say visual browser QA was not run.
