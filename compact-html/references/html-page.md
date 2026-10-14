# HTML page workflow

1. Write a concise page blueprint: task, audience, content groups, interactions,
   states, and the selected Pattern. Put those decisions in the page spec's
   `blueprint` object before adding component instances.
2. Choose a Pattern ID from `assets/design-system/pattern-contracts.json`.
   Pattern Runtime owns geometry, pane order, slots, scroll areas and dividers.
3. Bind each visible control to an ID in
   `packages/component-contracts/src/components.json`. Use its `implementations.html`
   and `frameworks.html.status` to check availability. Each binding has a
   `component` renderer key and explicit business `options`.
4. Run `scripts/generate-page.mjs --project <directory> --spec <page.json>`.
   The generator rejects unknown components, unregistered slots, missing
   required slots and fixture-like bindings without options. It writes
   `generated-entry.js`, `index.html`, `package.json` and vendored packages.
5. Install dependencies, build, open the page, and inspect the DOM. Registered
   components must have `data-component` and `data-logical-component`; the
   Pattern root must have `data-tui-pattern`. Check layout, interactions,
   keyboard access, focus, ARIA, and computed Token colors.

The spec shape is:

```json
{
  "schemaVersion": 1,
  "title": "项目工作台",
  "blueprint": {"task": "查看项目", "contentGroups": ["导航", "内容"], "interactions": ["打开项目"]},
  "patternId": "pattern-a-two-pane",
  "slots": {
    "global-title-layer": [{"component": "titlebar", "options": {"label": "项目工作台", "size": "small", "layout": "standalone", "segmentRole": "global"}}],
    "primary-navigation-shell": [{"component": "sidebar", "options": {"items": [{"label": "项目", "selected": true}]}}]
  },
  "regionContent": {
    "main-content": [{"component": "button", "options": {"label": "新建项目", "variant": "primary"}}]
  }
}
```

Only registered component entries and escaped text entries (`{"text":"..."}`)
are accepted. For a complex business group, extend a real shared component or
compose it in page-owned content around registered controls; do not redraw a
library control in raw HTML.
