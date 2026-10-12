#!/usr/bin/env node

/**
 * Normalize the generated registry into an honest cross-framework contract.
 *
 * The Monorepo Component Gallery is the sole visual review surface.
 * Every registered component declares its real HTML/React/Vue source when
 * that source exists; unavailable adapters remain null instead of pointing
 * to a historical preview page.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "packages/component-contracts/src/components.json");
const registry = JSON.parse(await fs.readFile(registryPath, "utf8"));
registry.components = registry.components.filter((component) => !["item", "navigation-menu", "chart", "empty", "data-table"].includes(component.id));

const readyIds = new Set();
const customIds = new Set([
  "button", "input", "search", "titlebar", "field", "form-field", "textarea", "select", "combobox", "native-select", "checkbox", "radio", "radio-group", "switch", "segmented-button", "number-selector", "chips", "tabs", "sub-tabs", "tree-view", "accordion", "collapsible", "primary-navigation-item", "sidebar", "list-card", "avatar", "badge", "table", "data-table", "pagination", "breadcrumb", "progress", "empty", "label", "alert", "tooltip", "snackbar",
  "dialog", "alert-dialog", "semi-modal", "menubar", "context-menu", "dropdown-menu", "popover", "hover-card", "slider", "color-picker", "input-otp", "kbd", "chart", "calendar", "date-picker", "time-picker", "attachment"
]);
const shadcnIds = new Set([
  "accordion", "alert-dialog", "calendar", "checkbox", "collapsible",
  "combobox", "context-menu", "dialog", "dropdown-menu", "hover-card", "input-otp",
  "menubar", "pagination", "popover", "radio-group", "select",
  "slider", "switch", "tabs", "tooltip"
]);

const sourceStrategy = (id) => {
  if (customIds.has(id)) return "canonical-custom";
  if (shadcnIds.has(id)) return "shadcn-behavior-canonical-style";
  return "canonical-static";
};

const implementationPaths = {
  button: { html: "packages/components-html/src/button.html", react: "packages/components-react/src/index.jsx#Button", vue: "packages/components-vue/src/Button.vue" },
  input: { html: "packages/components-html/src/input.html", react: "packages/components-react/src/index.jsx#Input", vue: "packages/components-vue/src/Input.vue" },
  search: { html: "packages/components-html/src/index.js#search", react: "packages/components-react/src/index.jsx#Search", vue: "packages/components-vue/src/Search.vue" },
  titlebar: { html: "packages/components-html/src/index.js#titlebar", react: "packages/components-react/src/index.jsx#Titlebar", vue: "packages/components-vue/src/Titlebar.vue" },
  textarea: { html: "packages/components-html/src/index.js#textarea", react: "packages/components-react/src/index.jsx#Textarea", vue: "packages/components-vue/src/Textarea.vue" },
  field: { html: "packages/components-html/src/index.js#field", react: "packages/components-react/src/index.jsx#Field", vue: "packages/components-vue/src/Field.vue" },
  "form-field": { html: "packages/components-html/src/index.js#form-field", react: "packages/components-react/src/index.jsx#FormField", vue: "packages/components-vue/src/FormField.vue" },
  select: { html: "packages/components-html/src/index.js#select", react: "packages/components-react/src/index.jsx#Select", vue: "packages/components-vue/src/Select.vue" },
  combobox: { html: "packages/components-html/src/index.js#combobox", react: "packages/components-react/src/index.jsx#Combobox", vue: "packages/components-vue/src/Combobox.vue" },
  "native-select": { html: "packages/components-html/src/index.js#nativeSelect", react: "packages/components-react/src/index.jsx#NativeSelect", vue: "packages/components-vue/src/NativeSelect.vue" },
  checkbox: { html: "packages/components-html/src/index.js#checkbox", react: "packages/components-react/src/index.jsx#Checkbox", vue: "packages/components-vue/src/Checkbox.vue" },
  radio: { html: "packages/components-html/src/index.js#radio", react: "packages/components-react/src/index.jsx#Radio", vue: "packages/components-vue/src/Radio.vue" },
  "radio-group": { html: "packages/components-html/src/index.js#radioGroup", react: "packages/components-react/src/index.jsx#RadioGroup", vue: "packages/components-vue/src/RadioGroup.vue" },
  switch: { html: "packages/components-html/src/index.js#switch", react: "packages/components-react/src/index.jsx#Switch", vue: "packages/components-vue/src/Switch.vue" },
  "segmented-button": { html: "packages/components-html/src/index.js#segmentedButton", react: "packages/components-react/src/index.jsx#SegmentedButton", vue: "packages/components-vue/src/SegmentedButton.vue" },
  "number-selector": { html: "packages/components-html/src/index.js#numberSelector", react: "packages/components-react/src/index.jsx#NumberSelector", vue: "packages/components-vue/src/NumberSelector.vue" },
  chips: { html: "packages/components-html/src/index.js#chips", react: "packages/components-react/src/Chips.jsx#Chips", vue: "packages/components-vue/src/Chips.vue" },
  tabs: { html: "packages/components-html/src/index.js#tabs", react: "packages/components-react/src/index.jsx#Tabs", vue: "packages/components-vue/src/Tabs.vue" },
  "sub-tabs": { html: "packages/components-html/src/index.js#subTabs", react: "packages/components-react/src/index.jsx#SubTabs", vue: "packages/components-vue/src/SubTabs.vue" },
  "tree-view": { html: "packages/components-html/src/index.js#treeView", react: "packages/components-react/src/index.jsx#TreeView", vue: "packages/components-vue/src/TreeView.vue" },
  accordion: { html: "packages/components-html/src/index.js#accordion", react: "packages/components-react/src/index.jsx#Accordion", vue: "packages/components-vue/src/Accordion.vue" },
  collapsible: { html: "packages/components-html/src/index.js#collapsible", react: "packages/components-react/src/index.jsx#Collapsible", vue: "packages/components-vue/src/Collapsible.vue" },
  avatar: { html: "packages/components-html/src/index.js#avatar", react: "packages/components-react/src/index.jsx#Avatar", vue: "packages/components-vue/src/Avatar.vue" },
  badge: { html: "packages/components-html/src/index.js#badge", react: "packages/components-react/src/index.jsx#Badge", vue: "packages/components-vue/src/Badge.vue" },
  table: { html: "packages/components-html/src/index.js#table", react: "packages/components-react/src/index.jsx#Table", vue: "packages/components-vue/src/Table.vue" },
  "data-table": { html: "packages/components-html/src/index.js#dataTable", react: "packages/components-react/src/index.jsx#DataTable", vue: "packages/components-vue/src/DataTable.vue" },
  pagination: { html: "packages/components-html/src/index.js#pagination", react: "packages/components-react/src/index.jsx#Pagination", vue: "packages/components-vue/src/Pagination.vue" },
  breadcrumb: { html: "packages/components-html/src/index.js#breadcrumb", react: "packages/components-react/src/index.jsx#Breadcrumb", vue: "packages/components-vue/src/Breadcrumb.vue" },
  progress: { html: "packages/components-html/src/index.js#progress", react: "packages/components-react/src/index.jsx#Progress", vue: "packages/components-vue/src/Progress.vue" },
  empty: { html: "packages/components-html/src/index.js#empty", react: "packages/components-react/src/index.jsx#Empty", vue: "packages/components-vue/src/Empty.vue" },
  label: { html: "packages/components-html/src/index.js#label", react: "packages/components-react/src/index.jsx#Label", vue: "packages/components-vue/src/Label.vue" },
  alert: { html: "packages/components-html/src/index.js#alert", react: "packages/components-react/src/index.jsx#Alert", vue: "packages/components-vue/src/Alert.vue" },
  tooltip: { html: "packages/components-html/src/index.js#tooltip", react: "packages/components-react/src/index.jsx#Tooltip", vue: "packages/components-vue/src/Tooltip.vue" },
  snackbar: { html: "packages/components-html/src/index.js#snackbar", react: "packages/components-react/src/index.jsx#Snackbar", vue: "packages/components-vue/src/Snackbar.vue" },
  "primary-navigation-item": { html: "packages/components-html/src/primary-navigation-item.html", react: "packages/components-react/src/index.jsx#PrimaryNavigationItem", vue: "packages/components-vue/src/PrimaryNavigationItem.vue" },
  sidebar: { html: "packages/components-html/src/sidebar.html", react: "packages/components-react/src/index.jsx#Sidebar", vue: "packages/components-vue/src/Sidebar.vue" },
  "list-card": { html: "packages/components-html/src/list-card.html", react: "packages/components-react/src/index.jsx#ListCard", vue: "packages/components-vue/src/ListCard.vue" },
  dialog: { html: "packages/components-html/src/advanced.js#dialog", react: "packages/components-react/src/advanced.jsx#Dialog", vue: "packages/components-vue/src/advanced.js#Dialog" },
  "alert-dialog": { html: "packages/components-html/src/advanced.js#alert-dialog", react: "packages/components-react/src/advanced.jsx#AlertDialog", vue: "packages/components-vue/src/advanced.js#AlertDialog" },
  "semi-modal": { html: "packages/components-html/src/advanced.js#semi-modal", react: "packages/components-react/src/advanced.jsx#SemiModal", vue: "packages/components-vue/src/advanced.js#SemiModal" },
  menubar: { html: "packages/components-html/src/advanced.js#menubar", react: "packages/components-react/src/advanced.jsx#Menubar", vue: "packages/components-vue/src/advanced.js#Menubar" },
  "context-menu": { html: "packages/components-html/src/advanced.js#context-menu", react: "packages/components-react/src/advanced.jsx#ContextMenu", vue: "packages/components-vue/src/advanced.js#ContextMenu" },
  "dropdown-menu": { html: "packages/components-html/src/advanced.js#dropdown-menu", react: "packages/components-react/src/advanced.jsx#DropdownMenu", vue: "packages/components-vue/src/advanced.js#DropdownMenu" },
  popover: { html: "packages/components-html/src/advanced.js#popover", react: "packages/components-react/src/advanced.jsx#Popover", vue: "packages/components-vue/src/advanced.js#Popover" },
  "hover-card": { html: "packages/components-html/src/advanced.js#hover-card", react: "packages/components-react/src/advanced.jsx#HoverCard", vue: "packages/components-vue/src/advanced.js#HoverCard" },
  slider: { html: "packages/components-html/src/advanced.js#slider", react: "packages/components-react/src/advanced.jsx#Slider", vue: "packages/components-vue/src/advanced.js#Slider" },
  "color-picker": { html: "packages/components-html/src/advanced.js#color-picker", react: "packages/components-react/src/advanced.jsx#ColorPicker", vue: "packages/components-vue/src/advanced.js#ColorPicker" },
  "input-otp": { html: "packages/components-html/src/advanced.js#input-otp", react: "packages/components-react/src/advanced.jsx#InputOtp", vue: "packages/components-vue/src/advanced.js#InputOtp" },
  kbd: { html: "packages/components-html/src/advanced.js#kbd", react: "packages/components-react/src/advanced.jsx#Kbd", vue: "packages/components-vue/src/advanced.js#Kbd" },
  chart: { html: "packages/components-html/src/advanced.js#chart", react: "packages/components-react/src/advanced.jsx#Chart", vue: "packages/components-vue/src/advanced.js#Chart" },
  calendar: { html: "packages/components-html/src/advanced.js#calendar", react: "packages/components-react/src/advanced.jsx#Calendar", vue: "packages/components-vue/src/advanced.js#Calendar" },
  "date-picker": { html: "packages/components-html/src/advanced.js#date-picker", react: "packages/components-react/src/advanced.jsx#DatePicker", vue: "packages/components-vue/src/advanced.js#DatePicker" },
  "time-picker": { html: "packages/components-html/src/advanced.js#time-picker", react: "packages/components-react/src/advanced.jsx#TimePicker", vue: "packages/components-vue/src/advanced.js#TimePicker" },
  attachment: { html: "packages/components-html/src/advanced.js#attachment", react: "packages/components-react/src/advanced.jsx#Attachment", vue: "packages/components-vue/src/advanced.js#Attachment" },
  
};

const pascal = (value) => value.split(/[-_]/g).map((part) => part[0].toUpperCase() + part.slice(1)).join("");
const sourcePathsFor = (component) => implementationPaths[component.id] ?? {
  html: `packages/components-html/src/generated/${component.id}.html`,
  react: `packages/components-react/src/generated/${pascal(component.id)}.jsx#${pascal(component.id)}`,
  vue: `packages/components-vue/src/generated/${pascal(component.id)}.vue`
};

const sourceExists = async (source) => {
  const file = source.split("#", 1)[0];
  try {
    await fs.access(path.join(root, file));
    return true;
  } catch {
    return false;
  }
};

for (const component of registry.components) {
  const sources = sourcePathsFor(component);
  const ready = (await Promise.all(Object.values(sources).map(sourceExists))).every(Boolean);
  if (ready) readyIds.add(component.id);
  const strategy = sourceStrategy(component.id);
  component.source = strategy;
  component.visualAuthority = "apps/component-gallery/index.html#runtime-view";
  component.sourceStrategy = strategy;
  // Source files are necessary but not sufficient for cross-framework Ready.
  // Preserve enriched readiness metadata when normalization is rerun.
  const readiness = component.readiness ?? {
    sourceReady: ready,
    contractReady: Boolean(component.slots?.length && component.variants?.length),
    visualParity: false,
    behaviorParity: false,
    accessibilityParity: false,
    tokenParity: true
  };
  readiness.sourceReady = ready;
  component.readiness = readiness;
  const isReady = Object.values(readiness).every(Boolean);
  component.status = isReady ? "ready" : "partial";
  const availableSources = Object.fromEntries(await Promise.all(Object.entries(sources).map(async ([framework, source]) => [
    framework,
    await sourceExists(source) ? source : null
  ])));
  component.frameworks = Object.fromEntries(["html", "react", "vue"].map((framework) => [framework, {
    ...(component.frameworks?.[framework] ?? {}),
    status: isReady ? "ready" : "partial",
    source: availableSources[framework]
  }]));
  component.implementations = availableSources;
  component.pixso = {
    status: "logical-mapping",
    libraryPage: "NewComponents",
    resolveGuidsAtRuntime: true,
    linkedInstanceRequired: true,
    variableReadbackRequired: true
  };
  component.contractNotes = component.contractNotes ?? "独立 HTML、React、Vue 源码由统一契约入口管理；视觉值由 canonical Skill Token 提供，可被 Skill 组装。";
}

const subTabs = registry.components.find((component) => component.id === "sub-tabs");
if (subTabs) {
  subTabs.tokenRoles = [
    "color.neutral-dark-05",
    "color.text-muted",
    "color.brand-10",
    "color.brand-100",
    "spacing.gap-subtab-item",
    "spacing.space-5",
    "radius.subtab",
    "size.size-10",
    "typography.subtitle-m"
  ];
}

registry.registryPolicy = {
  ...(registry.registryPolicy ?? {}),
  visualAuthority: "apps/component-gallery/index.html#runtime-view",
  readyRequires: ["sourceReady", "contractReady", "visualParity", "behaviorParity", "accessibilityParity", "tokenParity"],
  partialMayBeUsedFor: [],
  partialMustNotBeUsedFor: ["strict-pixso-component-parity"],
  comparisonRule: "Framework comparison uses the Monorepo Component Gallery runtime view as its sole visual authority; historical Skill preview pages are not part of the delivery.",
  deletedComponents: ["drawer", "sonner", "marker", "message-scroller", "toggle", "spinner", "skeleton", "aspect-ratio", "bubble", "typography", "chart", "empty", "data-table"]
};

await fs.writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Normalized ${registry.components.length} contracts: ${readyIds.size} ready, ${registry.components.length - readyIds.size} partial.`);
