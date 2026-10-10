# Component Coverage

Use this file when extending the bundled component system or auditing the preview gallery.

Last checked: 2026-07-22

Official source: [shadcn/ui Components](https://ui.shadcn.com/docs/components)

The official directory currently lists 64 component or guide entries. The bundled component system intentionally supports 48 upstream entries, and all 48 have a visible representative example or documented variant in `preview/component-gallery.html`. The project-specific Semi-modal composition raises the visible gallery total to 49. “Covered” means the bundled gallery includes a representative visual and interaction baseline; it does not mean every upstream example or product-specific composition is reproduced.

## Covered In The Gallery — 48/48 Supported Entries

```text
Accordion
Alert
Alert Dialog
Attachment
Avatar
Badge
Breadcrumb
Button
Calendar
Card
Carousel
Checkbox
Collapsible
Combobox
Context Menu
Date Picker
Time Picker
Dialog
Dropdown Menu
Field
Hover Card
Input
Input OTP
Item
Kbd
Label
Menubar
Native Select
Navigation Menu
Pagination
Popover
Progress
Radio Group
Radio
Select
Separator
Sidebar
Skeleton
Slider
Spinner
Switch
Table
Tabs
Sub Tabs
Textarea
Toast
Toggle
Tooltip
Tree View
```

## Project-specific Compositions

These compositions extend the upstream component set. They are not counted in the 51/51 upstream coverage number, but they do count toward the 52-component gallery total:

```text
Semi-modal
```

Semi-modal must have visible S/M/L, White/Gray, and modal/non-modal preview variants before its rules are considered synchronized.

Alert Dialog remains the destructive Dialog variant rather than a second standalone container. It uses the fixed 400px Dialog surface, starts focus on the safe action, names the affected object, and does not dismiss on outside click.

## Coverage Gate

For future additions or upstream changes, keep these synchronized:

1. Semantic tokens and component rules.
2. shadcn and Pixso mapping where applicable.
3. Visible gallery example with realistic content.
4. Pointer, keyboard, focus, disabled, error, loading, and overlay behavior as applicable.
5. Visual QA at 1728×1152 and 1100×720.
