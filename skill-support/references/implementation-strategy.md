# Implementation Strategy

Use this reference when choosing the code output format.

## Decision Tree

1. **Existing project**
   - Follow the existing stack first.
   - If the project already uses TailwindCSS, reuse its `tailwind.config`, tokens, `@layer` components, and class conventions.
   - If the project already uses shadcn/ui, inspect `components.json`, global CSS, installed components, and local modifications before adding or updating components.
   - If the project uses global CSS, CSS modules, Sass, React, Vue, Next, or another setup, integrate with that instead of forcing Tailwind.

2. **One-view interactive demonstration**
   - Prefer a single browser-openable HTML file with embedded CSS and JavaScript.
   - Use this for a focused login, dashboard, settings, editor, or standalone application-view prototype.

3. **Multi-page static project**
   - Prefer a folder structure with `design-strategy.md`, `design.md`, `pages/`, `styles/`, and `assets/`.
   - Use split CSS files: `tokens.css`, `base.css`, `components.css`, and page-specific CSS.

4. **Reusable or long-running UI project**
   - For a new product project, prefer Next.js, TailwindCSS, and shadcn/ui preset `b7ClMfrGK` unless the user asks for another stack.
   - Initialize a new project with `npx shadcn@latest init --preset b7ClMfrGK --template next`.
   - Treat shadcn as the component source layer, not the visual source of truth.
   - Map `design.md` tokens over shadcn semantic theme variables and component variants.
   - Read `shadcn-adapter.md` before initialization or component adaptation.

## Recommended Structures

### Single Page

```text
project-name/
├── design-strategy.md
├── design.md
└── index.html
```

### Multi-page Static CSS

```text
project-name/
├── design-strategy.md
├── design.md
├── pages/
│   ├── index.html
│   ├── login.html
│   └── dashboard.html
├── styles/
│   ├── tokens.css
│   ├── base.css
│   ├── components.css
│   └── pages.css
└── assets/
    ├── images/
    ├── icons/
    └── fonts/
```

### Tailwind Static Project

```text
project-name/
├── design-strategy.md
├── design.md
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── input.css
│   └── pages/
│       ├── index.html
│       ├── login.html
│       └── dashboard.html
├── dist/
│   ├── styles.css
│   └── pages/
└── assets/
```

### Next.js + shadcn Product Project

```text
project-name/
├── design.md
├── components.json
├── app/
├── components/
│   ├── ui/
│   └── product/
├── lib/
├── public/
└── app/globals.css
```

## Tailwind Mapping

- `design.md` colors -> `theme.extend.colors`
- `design.md` typography -> `theme.extend.fontFamily`, `fontSize`, and line-height
- `design.md` spacing -> `theme.extend.spacing`
- `design.md` radius -> `theme.extend.borderRadius`
- `design.md` shadows -> `theme.extend.boxShadow`
- `design.md` components -> `@layer components`

Example component layer:

```css
@layer components {
  .btn-primary {
    @apply inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white;
  }

  .input {
    @apply h-11 rounded-lg border border-transparent bg-surface px-3 text-sm text-text outline-none;
  }

  .card {
    @apply rounded-xl border border-border bg-surface;
  }
}
```

## Guardrails

- Do not use Tailwind just because it is popular; use it when it improves reuse, consistency, or maintainability.
- Do not run the shadcn preset initialization command inside an existing project without inspecting its configuration and local component changes.
- Do not let preset colors, fonts, spacing, radius, or component sizes override `design.md` tokens.
- Add shadcn components on demand; do not install every component unless the requested product needs them.
- Do not scatter one-off utility chains across many pages when components should exist.
- Do not create a build step for a tiny single-file deliverable unless the user wants it.
- If Tailwind installation/build requires network and approval is unavailable, fall back to static CSS and explain the limitation.
