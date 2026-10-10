# shadcn Adapter

Use this reference for new reusable Next.js projects or when adapting shadcn/ui components to the project design system.

## Component Baseline

Default preset:

```text
b7ClMfrGK
```

Initialize a new Next.js project with:

```bash
npx shadcn@latest init --preset b7ClMfrGK --template next
```

Use this command only for a new project. For an existing project, inspect `components.json`, global CSS, installed components, dependencies, and local edits before deciding whether to add components or apply a preset.

## Authority Order

```text
1. Project Pixso library and approved screens
2. design.md and project tokens
3. Project Tailwind/global CSS mappings
4. Existing product component modifications
5. shadcn component structure and behavior
6. Preset visual defaults
```

shadcn supplies component source, composition, behavior, and accessibility foundations. It does not replace project tokens or product-specific component rules.

## Token Adapter

Keep project tokens intact and map shadcn variables to them in global CSS:

```css
:root {
  --background: var(--color-bg);
  --foreground: var(--color-text);
  --card: var(--color-surface);
  --card-foreground: var(--color-text);
  --popover: var(--color-surface-raised);
  --popover-foreground: var(--color-text);
  --primary: var(--color-primary);
  --primary-foreground: var(--color-primary-text);
  --muted: var(--color-surface-muted);
  --muted-foreground: var(--color-text-muted);
  --destructive: var(--color-danger);
  --border: var(--color-border);
  --input: var(--color-input-border);
  --ring: var(--color-focus-ring);
  --chart-1: var(--color-chart-1);
  --chart-2: var(--color-chart-2);
  --chart-3: var(--color-chart-3);
  --chart-4: var(--color-chart-4);
  --chart-5: var(--color-chart-5);
  --radius: var(--radius-3);
}
```

Use `assets/design-system/tokens.shadcn-map.css`, `tokens.shadcn-map.json`, and `shadcn-token-map.md` as the baseline mapping state instead of recreating the adapter. Project-supplied mappings may override it when they have higher authority.

Define missing project semantics before overriding `secondary`, `secondary-foreground`, `accent`, `accent-foreground`, and sidebar accent tokens. The current default shadcn theme uses `destructive` without requiring `destructive-foreground`; add the foreground token only when the preset or a custom component references it.

## Component Adaptation

- Replace shadcn default heights with project `tokens.size` semantic values.
- Replace default padding and gaps with project `tokens.spacing` semantics.
- Replace component radius utilities with project semantic radius tokens.
- Apply project typography roles instead of preset font and text-size defaults.
- Keep state behavior and accessibility attributes from the shadcn component source.
- Add components on demand and preserve local edits when checking registry updates.
- Adapt Button at component-variant level: standard is 40px, small is 28px, and no Large variant is defined. Both approved sizes expose Primary, Secondary, Ghost, and Danger. Danger uses the Secondary background with `function/danger/100` text, while Ghost uses brand-colored text on a transparent background. Every variant supports Disabled by applying `--state-disabled-opacity` (40%) once to the whole control.
- Adapt Icon + Text Button separately: it is 40px only and exposes Primary, Secondary, and Ghost. Reuse Primary and Secondary Button colors; override Ghost content to `--color-icon-text-button-ghost-content`. Resolve the icon through the pinned Lucide semantic alias, set the nested icon box to `--icon-size-md`, preserve the 24 × 24 source viewBox, and keep the project Regular stroke rule.
- Adapt Icon Button as a 40px square control whose default variant is Ghost. The unspecified/default variant uses a transparent resting background and `--color-icon`; map Secondary only when explicitly requested. All nested HarmonyOS icon library assets use `--icon-size-md`. Do not install or substitute Lucide unless the user explicitly approves it.
- Adapt Dialog and AlertDialog as the fixed 400px Dialog family: 56px centered Title_S header with the shared 8px Semi-modal top inset, no top-right close control, 24px content padding, and one full-width or two equal-width 40px actions. Preserve the Radix focus and announcement foundations, but do not keep shadcn's default max-width, close placement, padding, or action alignment.
- Implement Semi-modal as a product composition with exact 480px, 640px, and 800px sizes; White and Gray surface variants; a 56px left-title header with the existing Ghost Icon Button close control; content padding of X 24px and Y 0px; and an 80px right-aligned action footer. Compose its body only from existing Input, Search, Select, Textarea, Button, and Icon Button components; apply White/Gray through their existing surface context rather than creating modal-local styles. Treat `modal` versus `non-modal` as behavior passed to the underlying primitive, never as a color or size token. Non-modal is the default.
- Adapt Tabs from the shadcn composition `Tabs / TabsList / TabsTrigger / TabsContent`. Support Filled, Line, Vertical, Disabled, and Icon + Text presentations. Map Filled height to `--height-chips-tab`, Line and Vertical triggers to their semantic 40px tokens, and keep the primitive's orientation, activation mode, roving focus, and disabled behavior. Do not replace Tabs semantics with a generic button group.
- Do not map the Button Danger appearance by changing the global `--destructive` semantic; alerts and destructive feedback still use the global danger semantics.

## Product Components

Compose product-specific components under `components/product/` from primitives in `components/ui/`. Keep Titlebar, Selection Block, List Card, Semi-modal, business tables, and other domain patterns outside the generic shadcn component folder.

## Static HTML

Do not initialize shadcn for a one-file static HTML deliverable. Reuse the same project tokens and visual rules with semantic HTML and CSS instead.
