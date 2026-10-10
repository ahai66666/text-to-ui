# shadcn Token Map

Preset: `b7ClMfrGK`

New Next.js project command:

```bash
npx shadcn@latest init --preset b7ClMfrGK --template next
```

## Mapping Policy

Load the preset first, then load project tokens, then load `tokens.shadcn-map.css`. Project tokens are authoritative. Tokens marked pending remain inherited from the preset until the design decision is approved.

## Completed Mapping

| shadcn token | Project token | Status |
|---|---|---|
| `background` | `--color-bg` | Complete |
| `foreground` | `--color-text` | Complete |
| `card` | `--color-surface` | Complete |
| `card-foreground` | `--color-text` | Complete |
| `popover` | `--color-surface-raised` | Complete |
| `popover-foreground` | `--color-text` | Complete |
| `primary` | `--color-primary` | Complete |
| `primary-foreground` | `--color-primary-text` | Complete |
| `secondary` | `--color-secondary` | Complete |
| `secondary-foreground` | `--color-button-secondary-text` | Complete |
| `accent` | `--color-accent` | Complete; hover uses `--color-accent-hover-layer` |
| `muted` | `--color-surface-muted` | Complete |
| `muted-foreground` | `--color-text-muted` | Complete |
| `destructive` | `--color-danger` | Complete |
| `border` | `--color-border` | Complete |
| `input` | `--color-input-border` | Complete; default border is transparent |
| `ring` | `--color-focus-ring` | Complete |
| `chart-1` to `chart-5` | `--color-chart-1` to `--color-chart-5` | Complete |
| `sidebar` | `--color-sidebar-bg` | Complete |
| `sidebar-foreground` | `--color-text` | Complete default alias |
| `sidebar-primary` | `--color-primary` | Complete default alias |
| `sidebar-primary-foreground` | `--color-primary-text` | Complete default alias |
| `sidebar-accent` | `--color-sidebar-accent` | Complete; menu hover background |
| `sidebar-accent-foreground` | `--color-sidebar-accent-text` | Complete |
| `sidebar-border` | `--color-border` | Complete default alias |
| `sidebar-ring` | `--color-focus-ring` | Complete default alias |
| `radius` | `--radius-3` | Complete |

The stock shadcn sidebar commonly shares `sidebar-accent` between hover and active states. Override its active-state class with `bg-sidebar-active text-sidebar-active-foreground` so hover and selection remain visually distinct. These utilities map to the project's `--color-sidebar-selected` tokens.

## Missing Decisions

Fill the project token or approve the recommendation, then update the CSS and JSON map.

| shadcn token | Meaning | Recommended project token | Value to confirm |
|---|---|---|---|
| `accent-foreground` | Text/icon on accent surface | `--color-accent-text` |  |
## Input And Search States

Input and search fields share one state model and keep content left-aligned.

| Context and state | Background | Border |
|---|---|---|
| Gray background, default | `--color-input-bg-on-subtle` (`white`) | None |
| Gray background, hover | White plus `--color-input-hover-bg-on-subtle-layer` | White, 2px |
| White background, default | `--color-input-bg-on-default` (`neutral-dark/05`) | None |
| White background, hover | `--color-input-hover-bg-on-default` (`neutral-dark-10`) | None |
| White background, focus | `--color-input-focus-bg-on-default` (`neutral-dark/05`) | None |
| White background, error | `--color-input-error-bg-on-default` (`neutral-dark/05`) | `function/danger/100`, 1px |
| Gray background, focus | `--color-input-focus-bg-on-subtle` (`white`) | None |
| Gray background, error | `--color-input-error-bg-on-subtle` (`white`) | `warning`, 1px |
| Both contexts, disabled | Keep current state | Apply `--state-disabled-opacity` (`0.4`) once to the entire component |

Use inset strokes or reserved transparent border space for these visual widths so state changes do not shift layout.

## Optional Foreground Decisions

These are useful for custom feedback components even though all are not required by the default shadcn theme.

| Project token | Meaning | Value to confirm |
|---|---|---|
| `--color-danger-text` | Text/icon on danger background |  |
| `--color-success-text` | Text/icon on success background |  |
| `--color-warning-text` | Text/icon on warning background |  |
| `--color-info-text` | Text/icon on info background |  |
| `--color-placeholder` | Input placeholder text |  |

## Component Readiness

| Component area | Status | Blocker |
|---|---|---|
| Primary Button | Ready | 40px and 28px; Disabled supported |
| Secondary Button | Ready | 40px and 28px; Disabled supported |
| Ghost Button | Ready | Brand text; 40px and 28px; Disabled supported |
| Danger Button | Ready | Secondary background plus `function/danger/100` text; 40px and 28px; Disabled supported |
| Input and Search | Ready | None |
| Card, Dialog, Popover | Ready for color/radius | Shadow tokens pending |
| Sidebar | Ready | Accent, selected, foreground, border, and ring mappings complete |
| Charts | Ready | None |

## Deferred

- Dark mode is outside the current project scope.
- Preset-specific visual defaults remain available only where this map does not override them.
