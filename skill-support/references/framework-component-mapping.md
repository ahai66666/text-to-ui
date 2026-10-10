# Framework Component Mapping

Use this reference whenever a React, Next.js, Vue, Tailwind, compiled bundle,
or static HTML project must reuse the HarmonyOS component system.

## One semantic component, multiple renderers

The registered `logicalName`, variants, states, slots, icons, and Pattern role
are framework-independent. React, Vue, HTML, and Pixso are adapters of that
same contract. A matching color or a `data-component` annotation alone does
not prove component reuse.

Every new reusable or dual-output page uses page-spec schema version 2 and
declares `componentContract`:

```json
{
  "schemaVersion": 2,
  "componentContract": {
    "adapterMap": "assets/design-system/framework-component-adapter-map.json",
    "targetFramework": "react",
    "sourceAvailability": "source",
    "strictComponentParity": true
  }
}
```

Each component declares:

- `logicalName`: exact registry name.
- `connectionMode`: `source-component`, `third-party-wrapper`, or
  `compiled-runtime-fallback`.
- `variantAxes`, `states`, and `slots`: framework-neutral behavior.
- `frameworkBinding`: framework, implementation path, export name, and
  contract evidence.
- `pixsoBinding`: exact registry name, variant axes, property map, and
  `linkedInstanceRequired: true`.

## Framework rules

### React and Next.js

Render the canonical attributes from props and state in JSX/TSX. Next.js uses
the React adapter. Tailwind utilities may arrange implementation details, but
visible values resolve through canonical CSS variables. Prefer a first-party
wrapper when adapting shadcn or another component library.

### Vue

Render the same attributes from props and reactive state in the SFC template.
Do not use generated `data-v-*` attributes or CSS Module hashes as the
component identity.

### Static HTML

Render the attributes in semantic markup and update state attributes from
script. Do not create a separate visual component system for static output.

## Runtime fixture rule

When a component is claimed to work across React, Vue, and static HTML, prove
it with the actual three implementations. Put the visual rules in one shared
component stylesheet that consumes canonical CSS Variables; React imports that
stylesheet, Vue imports it from the SFC, and static HTML links it directly.

The comparison page may compose a shell, but it must load the real framework
outputs (for example, through same-origin frames). It must never redraw three
lookalike controls inside the comparison page. Verify Default and Disabled
states by reading the three rendered controls' stable attributes and computed
Token-resolved values.

## Shared interaction rule

When a formal gallery module exposes a React, Vue, and static HTML selector,
its interaction behavior is part of the same coverage promise as its visual
matrix. Put shared behavior in the registered module adapter, then mount that
adapter from each real renderer; do not make one framework's preview a static
lookalike.

For dropdowns and dismissible overlays, all three adapters must support the
same pointer and keyboard path: open from the trigger, Arrow/Home/End movement
where there is an option list, Enter or Space commit/open as appropriate,
Escape close with trigger-focus restoration, and pointer/focus movement outside
the component closes without committing. Context menus additionally open with
right click and Shift+F10. Menubars use roving top-level focus and open their
command list with Down, Enter, or Space. Add each shared behavior to the
runtime validator, including a negative mutation that proves a missing handler
is rejected.

Tooltip is also shared behavior, not a CSS-only decoration. The registered
module adapter must bind the same tooltip markup in React, Vue, and static HTML,
show it after the pointer enters or the trigger receives focus, hide it on
pointer leave, blur, or Escape, and suppress it for disabled triggers. The
three-framework interaction audit must exercise the show/hide transition;
checking only that tooltip text exists in the DOM is insufficient.

Composite controls follow the same rule: Combobox filtering, keyboard movement
and selection, OTP auto-advance, Backspace recovery and paste, Calendar month
navigation and grid selection, Date Picker grid rendering plus Today/Clear,
Time Picker draft/Now/confirm/clear, and Carousel navigation are shared
adapter behaviors. They must not be reimplemented as framework-specific demo
state. Each behavior needs both a source guard and a browser check in at least
one renderer, with React, Vue, and HTML loading the same registered module.

Modal focus containment, focus restoration, Snackbar lifecycle, Alert recovery
actions, and file-selection status are also shared component behavior. A
framework module cannot claim complete overlay or feedback coverage while any
one renderer only renders the static surface.

## Component gallery rule

Maintain one component gallery. Put the React, Vue, and static HTML selector
inside the formal module for that logical component; do not create a second
"cross-framework components" gallery that duplicates the catalog.

Place the framework selector in the formal module card's top-right tool slot.
Preserve the existing state matrix, content order, spacing, card size, and
surface treatment when switching renderers. Never prepend or append a second
framework-preview card, header, or iframe that changes the gallery layout.
The module header must reserve the selector's complete measured width and
height at every supported desktop window size. When the visible matrix is
rendered inside a same-origin frame, reserve the same tool-slot width inside
the rendered header; do not position the selector over unreserved frame
content or derive collision from a native source surface that becomes hidden
after load.
The renderer surface must remain transparent and inherit the original module
card surface; never add a gray or white nested background behind the switched
matrix.
Make the selected framework visually unambiguous and announce success only
after its real runtime has loaded. If the selector would overlap a title,
state label, or other top-row content, move it into a following row inside the
same card. Derive that decision from the card's measured content and canonical
layout Tokens rather than a page-specific viewport breakpoint.

The selector scope is a coverage promise. A selector attached to a whole card
means every component family, size, Variant, state, icon, and interaction shown
inside that card has a real React, Vue, and static HTML adapter. Switching must
replace the complete registered state matrix. A hidden probe for one sample
component cannot justify a card-level selector. If only part of a card is
adapted, put the selector on that subcomponent or omit unsupported framework
options until the registry and validators prove full coverage.

Drive the framework selectors from one preview registry. Every registry entry
must declare the exact `logicalName`, supported states, runtime key, and real
framework routes. A framework option may be shown only when it loads the real
adapter implementation. The standalone framework fixture page remains a test
artifact, not the primary component documentation surface.

Adding another framework or component requires updating the registry and its
adapter implementation, not copying visual markup into the gallery shell.

When many catalog components share one visual matrix, use a registered module
adapter: the module definition lists every included logical component, and the
React, Vue, and static HTML entries all load that same canonical source matrix
through their own real renderer. This avoids maintaining three visual copies,
but it does not weaken the coverage promise: every component, state, and
interaction inside the registered module must still be present in all three
outputs.

## Preview publication gate

The gallery can serve built framework artifacts rather than the editable
fixture source. After changing an adapter, rebuild the fixture and publish the
new `dist` output into the gallery's served framework-artifact directory before
visual verification. A `ready` status alone is not evidence of success.
Inspect the loaded frame and verify its root has the expected logical component
contract and the complete registered matrix; reject it if the frame still
renders a fallback/demo shell or an older asset. Add this check to the runtime
validator so stale preview assets cannot be reported as cross-framework
coverage.

Use the static HTML renderer as the gallery geometry baseline unless the
component contract names another authority. React and Vue module hosts must
neutralize framework-only demo-shell margin, padding, minimum height, and
background before rendering the shared matrix. Attach a size observer to the
rendered document after every frame load so asynchronous React effects and Vue
mounts trigger a new height measurement; a one-time measurement on `load` is
insufficient. Switching framework must not change the component width,
computed Token sizes, or enclosing card height.

The real renderer must also report its mounted root height to the gallery after
asynchronous content is present, and again whenever that root resizes. The
gallery validates the message belongs to its iframe before applying the height.
Never set `overflow: hidden` on the renderer document merely to hide a demo
shell: that can freeze the iframe at its initial blank height and clip complete
component matrices.

## Compiled-only projects

When source JSX/TSX or Vue SFC files are unavailable, use
`compiled-runtime-fallback`, set `sourceAvailability` to `compiled-only`, and
set strict parity to `false`. The runtime adapter may prove Token and visual
coverage, but the output must not be reported as source-component parity.
Reconstruct or obtain source before enabling strict parity.

## Pixso rules

Resolve current component GUIDs by exact registry name and create linked
instances. Map Web states to Variant axes and content slots to Component
Properties. If the library lacks a component property, Fill variant, Auto
Layout rule, or semantic SVG icon slot, stop strict delivery and repair the
shared library. Never redraw, detach, or locally imitate a registered
component.

## Required validation

### Real interaction acceptance

Source-level event handlers are only a structural check. The component gallery
must also expose and run a browser-side interaction audit against the loaded
React, Vue, and static HTML iframe implementations. For every registered
module and every framework, that audit must verify the relevant combination of
open, keyboard navigation, commit, cancel, Escape, external close, disabled
behavior, state persistence, and post-mount iframe height. Store the result by
module, framework, and scenario; an audit that only confirms that an event
handler exists is not sufficient.

The gallery entry point is `runTextToUiFrameworkInteractionAudit()`. It may be
run manually from the preview page or by opening the preview with
`?frameworkAudit=1`; strict publication requires its result to be `passed`.
The audit must fail with the precise module, framework, and behavior whenever
a loaded renderer does not change state as specified or its measured document
height exceeds the iframe height.

Run:

```bash
node scripts/validate-framework-component-adapter-map.mjs
node scripts/validate-framework-component-contract.mjs \
  --page-spec <page-spec.json> \
  --source-root <project-root>
node scripts/validate-framework-component-runtime.mjs
node scripts/validate-dual-output.mjs \
  --page-spec <page-spec.json> \
  --html <output.html> \
  --pixso-audit <pixso-binding-audit.json>
```

Strict HTML-first or visual-first delivery requires both framework source
evidence and a live Pixso audit. Any runtime fallback, blocked content slot,
unlinked/detached instance, component color finding, or component content
finding fails the gate.
