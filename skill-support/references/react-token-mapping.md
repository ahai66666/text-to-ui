# React Token Mapping

Use this reference for React, JSX/TSX, CSS Modules, Tailwind, CSS-in-JS, or a
compiled single-file React bundle.

## Preferred mapping

Render stable semantic contracts directly from React state:

```jsx
<button
  data-component="navigation-item"
  data-state={selected ? "selected" : "default"}
>
  <MailIcon aria-hidden />
  <span>{label}</span>
</button>
```

Consume only canonical Web variables in the authored component layer:

```css
[data-component="navigation-item"] {
  color: var(--color-text);
  border-radius: var(--radius-list-item);
}

[data-component="navigation-item"][data-state="selected"] {
  color: var(--color-primary);
  background: var(--color-sidebar-selected);
}

[data-component="navigation-item"] svg {
  color: currentColor;
}
```

Record each selector, property, and CSS variable in
`tokenContract.webCoverage`. Pixso binds the corresponding `pixsoVariable`
from the same `usedTokens` record.

## Compiled-bundle fallback

Use a runtime adapter only when rebuilding JSX/TSX is unavailable:

1. Mark generated style/script blocks `data-token-audit="vendor"`.
2. Add one authored `data-token-audit="page"` style layer.
3. Locate named component boundaries with stable product attributes.
4. Translate runtime class/state evidence into `data-component`,
   `data-state`, `data-color-role`, `data-surface-role`, or
   `data-border-role` inside those boundaries.
5. Style only the stable attributes with canonical CSS variables.
6. Keep the observer alive when React can replace nodes or class names after
   initial mount.

Do not redefine a Tailwind or library palette globally. The same source shade
may mean text, icon, border, selected surface, or disabled content in different
components. A runtime adapter must name its boundary, for example
`data-token-boundary="primary-navigation"`, before applying semantic roles.
Component-specific state rules must override generic role rules.

Do not resolve geometry Tokens in JavaScript:

```js
// Wrong: loses the Token binding.
pane.style.width = `${computedWidth}px`;

// Right: keep the CSS variable live.
pane.dataset.widthToken = "layout.secondary-pane.width";
```

```css
[data-component="secondary-list"] {
  width: var(--layout-secondary-pane-width);
}
```

Runtime popup coordinates, measured drag positions, and content-dependent
geometry may remain inline values. Fixed component dimensions, spacing,
radius, typography, color, opacity, and effects must remain Token- or
Style-backed.

## Typography and effects

Use `assets/design-system/typography-style-map.json` for Web typography
variables to Pixso Text Styles. Use
`assets/design-system/effect-style-map.json` for Web shadow variables to Pixso
Effect Styles. Do not force typography or shadows into color/number Variable
bindings when Pixso represents them as shared Styles.

## Validation

Before delivery:

1. Confirm every `var(--...)` referenced by the authored page layer is
   declared.
2. Classify every visible variable in `tokenContract.usedTokens`,
   typography/effect Style mapping, or an explicit Web-only responsive
   constraint.
3. Reject hardcoded page colors and fixed design metrics outside approved
   runtime geometry.
4. Confirm state selectors use stable attributes, not generated class hashes
   or palette class names.
5. Syntax-check the runtime adapter and verify it does not write resolved
   Token values into inline styles.
6. Run `scripts/validate-dual-output.mjs` on the delivered HTML.
7. Treat Web mapping and Pixso binding as separate proofs. A canonical
   `pixsoVariable` name does not prove the current Frame is bound; run the live
   Pixso audit in the intended document and report any active-document
   mismatch.

React and Pixso use one Token system: React consumes the canonical Web CSS
variable, while Pixso consumes the mapped primitive Variable or shared
Text/Effect Style.
