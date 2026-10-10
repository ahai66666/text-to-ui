# Vue Token Mapping

Use this reference for Vue SFCs, scoped CSS, CSS Modules, and Vue component
libraries.

## Source Contract

- Import the canonical Token CSS once at the application root.
- Give every reusable or audited component a stable
  `data-component="<page-spec id>"` attribute.
- Express visual state with stable attributes such as
  `data-state="selected"`, `aria-selected`, `aria-disabled`, or native
  pseudo-classes. Do not use a generated Vue scope attribute or hashed class in
  `page-spec.json`.
- Record each visible selector, property, and canonical CSS variable in
  `tokenContract.webCoverage`.

```vue
<template>
  <button
    data-component="navigation-item"
    :data-state="selected ? 'selected' : 'default'"
  >
    <AppIcon class="navigation-item__icon" />
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
[data-component="navigation-item"] {
  color: var(--color-text);
  background: var(--color-surface);
}

[data-component="navigation-item"][data-state="selected"] {
  color: var(--color-primary);
  background: var(--color-sidebar-selected);
}

.navigation-item__icon {
  color: currentColor;
}
</style>
```

Vue may compile the first selector to
`[data-component="navigation-item"][data-v-xxxx]`. Keep the stable selector in
the contract; the dual-output validator removes the generated scope attribute
when checking coverage.

## CSS Modules

- Keep the Module class for local structure, but also attach the stable
  `data-component` contract in the template.
- Consume Tokens inside the Module rule. A generated selector such as
  `.navigationItem_a91f[data-component="navigation-item"]` is valid because the
  stable selector and mapped declaration remain inspectable.
- Never put the generated hash in `webCoverage`.

## Third-Party Vue Components

- Alias a library theme variable to a canonical CSS variable only when its
  meaning is one-to-one. Example:
  `--library-text-color: var(--color-text)`.
- When one library variable is reused for multiple semantic roles, override at
  the owning `data-component` wrapper instead of changing it globally.
- Use scoped `:deep(...)` only beneath that stable wrapper. The compiled rule
  must still consume the canonical variable.
- Do not pass literal colors through component props, JavaScript theme objects,
  computed styles, or inline `:style`. Define a semantic CSS alias and map it
  through the page contract.
- Preserve icon inheritance with `currentColor`; replace icon-font or image
  treatments that require color filters.

## Build Audit

1. Validate `page-spec.json`.
2. Build the Vue application.
3. Audit the delivered HTML/CSS, not only the SFC source.
4. Confirm every `webCoverage` entry survives scoped-CSS and CSS-Module
   compilation.
5. Confirm runtime states render stable `data-state` or ARIA attributes.
6. Import the checked page into Pixso and run the same Variable-binding audit
   used for static HTML and React.

Vue and Pixso do not need separate Token sets. Vue consumes the Web CSS variable
from the canonical mapping; Pixso consumes the corresponding primitive Variable
recorded in the same `usedTokens` entry.
