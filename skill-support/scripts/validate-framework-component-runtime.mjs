#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(root, "fixtures/framework-component-contract");
const read = (relativePath) => fs.readFileSync(path.join(fixture, relativePath), "utf8");
const readRoot = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const failures = [];

const requiredSharedTokens = [
  "--height-button",
  "--padding-button-x",
  "--radius-button",
  "--color-primary",
  "--color-primary-text",
  "--type-body-l-size"
];
const sharedCss = read("shared/primary-action.css");
for (const token of requiredSharedTokens) {
  if (!sharedCss.includes(token)) failures.push(`shared primary action CSS misses ${token}`);
}
if (/#(?:[0-9a-f]{3,8})\b/i.test(sharedCss)) {
  failures.push("shared primary action CSS contains a literal color");
}

const sources = [
  ["React", "react/PrimaryAction.jsx", "className=\"hm-primary-action\""],
  ["Vue", "vue/PrimaryAction.vue", "class=\"hm-primary-action\""],
  ["HTML", "html/primary-action.html", "class=\"hm-primary-action\""]
];
for (const [name, sourcePath, classEvidence] of sources) {
  const source = read(sourcePath);
  if (!source.includes(classEvidence)) failures.push(`${name} does not render the shared primary-action class`);
  if (!source.includes("fixture-primary-action")) failures.push(`${name} is missing the stable component id`);
  if (!source.includes("Button/Primary/Default")) failures.push(`${name} is missing the logical component name`);
}

const interactiveComponents = [
  ["fixture-search", "Search/White Surface/Default"],
  ["fixture-sidebar-item", "Sidebar Item/Default"],
  ["fixture-list-item", "List Item/White Surface/Default"]
];
const interactiveSources = [
  ["React", ["react/SearchField.jsx", "react/SidebarItem.jsx", "react/ListItem.jsx"]],
  ["Vue", ["vue/SearchField.vue", "vue/SidebarItem.vue", "vue/ListItem.vue"]],
  ["HTML", ["html/primary-action.html"]]
];
for (const [framework, paths] of interactiveSources) {
  const source = paths.map(read).join("\n");
  for (const [componentId, logicalName] of interactiveComponents) {
    if (!source.includes(componentId) || !source.includes(logicalName)) {
      failures.push(`${framework} does not render ${logicalName} from the shared interactive contract`);
    }
  }
}

const coverage = JSON.parse(read("contract.json")).interactiveCoverage ?? [];
if (coverage.length !== interactiveComponents.length + 1) {
  failures.push("interactive coverage must enumerate Button, Search, Sidebar Item, and List Item");
}

const preview = read("preview.html");
if (preview.includes("contract-button") || preview.includes("data-framework")) {
  failures.push("preview still contains a hand-drawn framework button");
}
for (const sourcePath of ["./runtime/react.html", "./runtime/vue.html", "./html/component-playground.html"]) {
  if (!preview.includes(sourcePath)) failures.push(`preview does not load ${sourcePath}`);
}

const gallery = readRoot("preview/component-gallery.html");
const galleryManifest = readRoot("preview/framework-component-manifest.js");
const galleryRuntime = readRoot("preview/framework-component-gallery.js");
const galleryInteractionAudit = readRoot("preview/framework-component-interaction-audit.js");
const galleryCss = readRoot("preview/component-gallery.css");
const catalogModuleCss = read("shared/catalog-module.css");
const fixtureViteConfig = read("vite.config.js");
for (const state of ["default", "hover", "pressed", "selected"]) {
  if (!gallery.includes('data-component="Sidebar Item/Default"') || !gallery.includes(`data-state="${state}"`)) {
    failures.push(`Sidebar fallback matrix is missing its ${state} state.`);
  }
}
const buttonLogicalGroups = ["Button/Size/Standard", "Button/Size/Small", "Button/Icon Text/Default", "Button/Icon/Default", "Button/Split Dropdown/Default"];

const catalogModules = {
  buttons: ["Button/Primary/Default", "Button/Secondary/Default", "Button/Ghost/Default", "Button/Danger/Default", "Button/Icon Text/Default", "Button/Icon/Default", "Button/Split Dropdown/Default"],
  titlebars: ["Titlebar"],
  fields: ["Input", "Search", "Textarea", "Select"],
  choices: ["Checkbox", "Radio Group", "Switch", "Badge"],
  navigation: ["Tabs", "List"],
  "data-display": ["Avatar", "Badge", "Card", "Table", "Data Table", "Progress", "Pagination", "Empty"],
  disclosure: ["Breadcrumb", "Accordion", "Collapsible", "Menubar", "Separator", "Sidebar", "Item"],
  overlays: ["Dialog", "Alert Dialog", "Semi-modal", "Popover", "Hover Card", "Context Menu"],
  "form-plus": ["Field", "Label", "Combobox", "Native Select", "Slider", "Toggle", "Input OTP", "Kbd"],
  "loading-data": ["Skeleton", "Spinner", "Chart", "Calendar", "Date Picker", "Time Picker"],
  specialized: ["Attachment", "Carousel"],
  feedback: ["Alert", "Tooltip", "Snackbar"]
};
const catalogLoader = read("shared/catalog-module.js");
function catalogSelectFailures(source) {
  const requiredSelectEvidence = [
    "function hydrateSelects(root)",
    "trigger.addEventListener(\"click\"",
    "trigger.addEventListener(\"keydown\"",
    "event.key === \"ArrowDown\"",
    "event.key === \"Home\"",
    "event.key === \"End\"",
    "event.key === \"Enter\"",
    "event.key === \"Escape\"",
    "option.addEventListener(\"click\"",
    "root.ownerDocument.addEventListener(\"pointerdown\"",
    "root.ownerDocument.addEventListener(\"focusin\"",
    "trigger.setAttribute(\"aria-activedescendant\"",
    "item.setAttribute(\"aria-selected\""
  ];
  return requiredSelectEvidence
    .filter((evidence) => !source.includes(evidence))
    .map((evidence) => `catalog Select adapter is missing ${evidence}`);
}
failures.push(...catalogSelectFailures(catalogLoader));
function catalogOverlayFailures(source) {
  const requiredOverlayEvidence = [
    "function hydrateDropdowns(root)",
    "function hydratePopovers(root)",
    "function hydrateMenubars(root)",
    "function hydrateContextMenus(root)",
    "function hydrateLayers(root)",
    "data-catalog-overlay-layer",
    "event.key === \"ArrowDown\"",
    "event.key === \"Home\"",
    "event.key === \"End\"",
    "event.key === \"Escape\"",
    "root.ownerDocument.addEventListener(\"pointerdown\"",
    "root.ownerDocument.addEventListener(\"focusin\"",
    "event.shiftKey && event.key === \"F10\"",
    "aria-expanded"
  ];
  return requiredOverlayEvidence
    .filter((evidence) => !source.includes(evidence))
    .map((evidence) => `catalog dropdown and overlay adapter is missing ${evidence}`);
}
failures.push(...catalogOverlayFailures(catalogLoader));
function catalogFeedbackFailures(source) {
  const evidence = ["syncModalLock", "event.key !== \"Tab\"", "has-modal-layer", "function hydrateFeedback(root)", "data-catalog-feedback-layer", "setTimeout", "function hydrateAttachments(root)", "input[type='file']"];
  return evidence.filter((item) => !source.includes(item)).map((item) => `catalog feedback and recovery adapter is missing ${item}`);
}
failures.push(...catalogFeedbackFailures(catalogLoader));
function catalogTooltipFailures(source) {
  const evidence = [
    "function hydrateTooltips(root)",
    "root.querySelectorAll(\"[data-tooltip]\")",
    "tooltip.classList.add(\"is-visible\")",
    "tooltipRoot.addEventListener(\"mouseenter\"",
    "tooltipRoot.addEventListener(\"mouseleave\"",
    "tooltipRoot.addEventListener(\"focusin\"",
    "tooltipRoot.addEventListener(\"focusout\"",
    "event.key === \"Escape\"",
    "hydrateTooltips(root)"
  ];
  return evidence.filter((item) => !source.includes(item)).map((item) => `catalog Tooltip adapter is missing ${item}`);
}
failures.push(...catalogTooltipFailures(catalogLoader));
function catalogCompositeFailures(source) {
  const evidence = [
    "function hydrateComposites(root)", "function hydrateCalendar(root)", "function hydrateDateTimePickers(root)",
    "function hydrateNavigationControls(root)",
    "[data-combobox]", "clipboardData", "[data-date-picker]", "[data-time-picker]",
    "[data-time-confirm]", "[data-time-now]", "[data-date-clear]", "[data-date-today]",
    "[data-carousel]", "[data-calendar]", ".pagination", "[data-tabs]", "event.key === \"Escape\"",
    "dataset.activation === \"manual\"", "orientation === \"vertical\"", "visibleOptions",
    "event.key === \"Enter\"", "event.key === \"ArrowDown\"", "event.key === \"Home\"", "event.key === \"End\""
  ];
  return evidence.filter((item) => !source.includes(item)).map((item) => `catalog composite adapter is missing ${item}`);
}
failures.push(...catalogCompositeFailures(catalogLoader));
const catalogSources = [
  ["React", read("react/CatalogModule.jsx")],
  ["Vue", read("vue/CatalogModule.vue")],
  ["HTML", read("html/catalog-module.html")]
];
for (const [framework, source] of catalogSources) {
  if (!source.includes("mountCatalogModule")) failures.push(`${framework} does not use the shared catalog module source adapter`);
}
for (const [moduleId, logicalNames] of Object.entries(catalogModules)) {
  const moduleDefinitionKey = /^[a-z]+$/.test(moduleId) ? `${moduleId}:` : `\"${moduleId}\":`;
  if (!catalogLoader.includes(moduleDefinitionKey)) failures.push(`catalog source loader is missing ${moduleId}`);
  if (!galleryManifest.includes(`moduleId: \"${moduleId}\"`)) failures.push(`framework registry is missing ${moduleId}`);
  for (const logicalName of logicalNames) {
    if (!galleryManifest.includes(`\"${logicalName}\"`)) failures.push(`framework registry does not cover ${logicalName}`);
  }
}
if (!gallery.includes('framework-component-interaction-audit.js')) {
  failures.push("component gallery does not load the framework interaction audit");
}
for (const moduleId of Object.keys(catalogModules)) {
  const scenarioSignature = /^[a-z]+$/.test(moduleId) ? `${moduleId}(root)` : `"${moduleId}"(root)`;
  if (!galleryInteractionAudit.includes(scenarioSignature)) {
    failures.push(`framework interaction audit is missing ${moduleId}`);
  }
}
for (const evidence of ["runTextToUiFrameworkInteractionAudit", "frameworkInteractionAudit", "frame.offsetHeight", "host.dataset.framework", "status: \"failed\"", "[data-tooltip]", "Tooltip did not appear on hover", "await scenarios[contract.moduleId](root)"]) {
  if (!galleryInteractionAudit.includes(evidence)) failures.push(`framework interaction audit is missing ${evidence}`);
}
if (galleryManifest.includes('runtimeKey: "button-gallery"') || !galleryManifest.includes('moduleId: "buttons"')) {
  failures.push("Button gallery must use the registered shared catalog module adapter");
}
for (const logicalGroup of buttonLogicalGroups) {
  if (!gallery.includes(logicalGroup)) failures.push(`Button source matrix misses ${logicalGroup}`);
}
if (!galleryRuntime.includes("installRegisteredModuleSlots") || !galleryRuntime.includes("catalog-module")) {
  failures.push("gallery runtime does not install registered full-module framework adapters");
}
if (!/modulePreload:\s*\{\s*polyfill:\s*false/s.test(fixtureViteConfig)) {
  failures.push("framework fixture build must disable the unnecessary modulepreload MutationObserver polyfill");
}

function galleryLayoutFailures(runtimeSource, cssSource, htmlSource) {
  const layoutFailures = [];
  if (runtimeSource.includes("framework-adapter-preview") || runtimeSource.includes("framework-adapter-head")) {
    layoutFailures.push("framework selector creates a second visible preview card or header");
  }
  if (!runtimeSource.includes("framework-adapter-probe")) {
    layoutFailures.push("framework selector is missing its non-layout runtime probe");
  }
  if (!runtimeSource.includes("framework-adapter-frame") || !runtimeSource.includes("coverageScope")) {
    layoutFailures.push("card-level framework selector does not replace the complete registered module matrix");
  }
  if (!runtimeSource.includes("ResizeObserver") || !runtimeSource.includes("frameworkPlacement")) {
    layoutFailures.push("framework selector is missing collision-aware stacked placement");
  }
  if (!runtimeSource.includes("observeModuleFrame") || !runtimeSource.includes("frameResizeObserver")) {
    layoutFailures.push("framework module frame does not keep its height synchronized after asynchronous renderer updates");
  }
  if (!runtimeSource.includes("text-to-ui:catalog-module-height") || !runtimeSource.includes("setModuleFrameHeight")) {
    layoutFailures.push("framework module frame does not accept post-mount height updates from its real renderer");
  }
  if (!catalogLoader.includes("function reportModuleHeight(root, moduleId)") || !catalogLoader.includes("ResizeObserver") || !catalogLoader.includes("postMessage")) {
    layoutFailures.push("catalog module does not report its mounted content height to the gallery frame");
  }
  if (!runtimeSource.includes("notifyFrameworkLoaded") || !runtimeSource.includes('frameworkState = "loading"')) {
    layoutFailures.push("framework selector is missing visible loaded-state feedback");
  }
  if (!/\.framework-adapter-slot\s*\{[^}]*position:\s*absolute/s.test(cssSource)) {
    layoutFailures.push("framework selector is not anchored in the module card top-right tool slot");
  }
  if (!cssSource.includes('[data-framework-placement="stacked"]')) {
    layoutFailures.push("framework selector cannot reflow below crowded module content");
  }
  if (!/\.section\.framework-module-card\s*\{[^}]*--framework-adapter-inset:\s*var\(--space-0\)/s.test(cssSource)) {
    layoutFailures.push("catalog module selector is not aligned to the module header top edge");
  }
  if (!/\.framework-catalog-module\s*>\s*\.section\s*>\s*\.section-head\s*\{[^}]*padding-right:\s*calc\(var\(--size-17\)\s*\*\s*3\)/s.test(catalogModuleCss)) {
    layoutFailures.push("catalog module header does not reserve the framework selector tool slot");
  }
  if (!/html\s+body:has\(\.framework-catalog-module\)\s*\{[^}]*padding:\s*var\(--space-0\)/s.test(catalogModuleCss)) {
    layoutFailures.push("catalog module does not neutralize framework demo-shell padding");
  }
  if (!/html\s+body:has\(\.framework-catalog-module\)\s*\{[^}]*overflow:\s*visible/s.test(catalogModuleCss)) {
    layoutFailures.push("catalog module clips its mounted contents before the frame height can synchronize");
  }
  if (!/\.field-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(260px,\s*1fr\)\)/s.test(cssSource)) {
    layoutFailures.push("field surface contexts do not preserve the required desktop two-column layout");
  }
  const mediumWidthRule = cssSource.match(/@media\s*\(max-width:\s*1180px\)\s*\{([\s\S]*?)\n\}/);
  if (mediumWidthRule?.[1].includes(".field-grid")) {
    layoutFailures.push("field surface contexts collapse at the generic medium-width breakpoint");
  }
  if (!/@media\s*\(max-width:\s*560px\)\s*\{\s*\.field-grid\s*\{[^}]*grid-template-columns:\s*1fr/s.test(cssSource)) {
    layoutFailures.push("field surface contexts are missing their narrow-width one-column fallback");
  }
  if (!/\.primary-navigation-shell-pattern\[data-navigation-levels="two"\]\s+\.pattern-primary-level-icons\s*\{[^}]*margin-block-start:\s*auto/s.test(cssSource)) {
    layoutFailures.push("expanded first-level navigation is not anchored to the bottom of Primary Navigation");
  }
  if (!/\.primary-navigation-shell-pattern\[data-navigation-collapsed="true"\]\[data-navigation-levels="two"\]\s+\.pattern-primary-level-icons\s*\{[^}]*margin-block-start:\s*auto[^}]*flex-direction:\s*column[^}]*justify-content:\s*flex-end/s.test(cssSource)) {
    layoutFailures.push("collapsed first-level navigation is not stacked from the bottom upward");
  }
  if (!/<div class="panel button-matrix">\s*<div class="framework-adapter-slot" data-framework-component="button"><\/div>\s*<div class="framework-native-surface">/s.test(htmlSource)) {
    layoutFailures.push("Button framework selector is not inside the original Button module card");
  }
  return layoutFailures;
}

failures.push(...galleryLayoutFailures(galleryRuntime, galleryCss, gallery));
if (gallery.includes('id="framework-component-contract"') || gallery.includes('href="#framework-component-contract"')) {
  failures.push("component gallery still exposes a duplicated standalone cross-framework section");
}
for (const [componentKey, logicalName] of [
  ["button", "Button/Module/Complete"],
  ["search", "Search/White Surface/Default"],
  ["sidebar", "Sidebar Item/Default"],
  ["list", "List Item/White Surface/Default"]
]) {
  if (!gallery.includes(`data-framework-component="${componentKey}"`)) {
    failures.push(`formal component gallery is missing the ${componentKey} framework slot`);
  }
  if (!galleryManifest.includes(`${componentKey}:`) || !galleryManifest.includes(logicalName)) {
    failures.push(`framework preview registry is missing ${logicalName}`);
  }
}
for (const sourcePath of [
  "./framework-component-contract/runtime/react.html",
  "./framework-component-contract/runtime/vue.html",
  "./framework-component-contract/html/component-playground.html"
]) {
  if (!galleryRuntime.includes(sourcePath)) failures.push(`gallery runtime does not load ${sourcePath}`);
}
for (const script of ["framework-component-manifest.js", "framework-component-gallery.js"]) {
  if (!gallery.includes(script)) failures.push(`component gallery does not load ${script}`);
}

if (process.argv.includes("--negative-layout-test")) {
  const invalidRuntime = galleryRuntime
    .replaceAll("framework-adapter-probe", "framework-adapter-preview")
    .replaceAll("ResizeObserver", "StaticLayoutObserver");
  const negativeFailures = galleryLayoutFailures(invalidRuntime, galleryCss, gallery);
  if (!negativeFailures.some((failure) => failure.includes("second visible preview"))) {
    failures.push("layout guard failed to reject an intentional second framework preview card");
  }
  if (!negativeFailures.some((failure) => failure.includes("stacked placement"))) {
    failures.push("layout guard failed to reject an intentional non-adaptive framework selector");
  }
  const invalidFieldLayoutCss = galleryCss.replace(
    /\.field-grid\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(2,\s*minmax\(260px,\s*1fr\)\);/,
    ".field-grid { display: grid; grid-template-columns: 1fr;"
  );
  const fieldLayoutFailures = galleryLayoutFailures(galleryRuntime, invalidFieldLayoutCss, gallery);
  if (!fieldLayoutFailures.some((failure) => failure.includes("desktop two-column layout"))) {
    failures.push("layout guard failed to reject an intentional collapsed field-surface layout");
  }
  const invalidPrimaryNavigationCss = galleryCss
    .replaceAll("margin-block-start: auto", "margin-block-start: 0")
    .replaceAll("justify-content: flex-end", "justify-content: flex-start");
  const primaryNavigationFailures = galleryLayoutFailures(galleryRuntime, invalidPrimaryNavigationCss, gallery);
  if (!primaryNavigationFailures.some((failure) => failure.includes("first-level navigation"))) {
    failures.push("layout guard failed to reject first-level navigation that is not bottom-aligned");
  }
  const missingEscapeSelectFailures = catalogSelectFailures(
    catalogLoader.replaceAll('event.key === "Escape"', 'event.key === "Cancelled"')
  );
  if (!missingEscapeSelectFailures.some((failure) => failure.includes('event.key === "Escape"'))) {
    failures.push("Select interaction guard failed to reject a missing Escape handler");
  }
  const missingDropdownHydrationFailures = catalogOverlayFailures(
    catalogLoader.replace("function hydrateDropdowns(root)", "function omittedDropdownHydration(root)")
  );
  if (!missingDropdownHydrationFailures.some((failure) => failure.includes("hydrateDropdowns(root)"))) {
    failures.push("Dropdown and overlay interaction guard failed to reject missing shared dropdown hydration");
  }
  const missingCompositeFailures = catalogCompositeFailures(catalogLoader.replace("function hydrateComposites(root)", "function omittedComposites(root)"));
  if (!missingCompositeFailures.some((failure) => failure.includes("hydrateComposites(root)"))) {
    failures.push("Composite interaction guard failed to reject missing shared composite hydration");
  }
  const missingFeedbackFailures = catalogFeedbackFailures(catalogLoader.replace("function hydrateFeedback(root)", "function omittedFeedback(root)"));
  if (!missingFeedbackFailures.some((failure) => failure.includes("hydrateFeedback(root)"))) {
    failures.push("Feedback interaction guard failed to reject missing shared toast hydration");
  }
  const missingTooltipFailures = catalogTooltipFailures(catalogLoader.replace("function hydrateTooltips(root)", "function omittedTooltips(root)"));
  if (!missingTooltipFailures.some((failure) => failure.includes("hydrateTooltips(root)"))) {
    failures.push("Tooltip interaction guard failed to reject missing shared tooltip hydration");
  }
}

if (failures.length > 0) {
  console.error("Framework runtime fixture invalid:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(process.argv.includes("--negative-layout-test")
  ? "Framework gallery layout guard passed: intentional second-card and non-adaptive selector regressions were rejected."
  : "Framework runtime fixture valid: every catalog module keeps its original layout while switching React, Vue, and HTML adapters through the shared tokenized source contract.");
