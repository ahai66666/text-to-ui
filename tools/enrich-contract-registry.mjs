#!/usr/bin/env node

/**
 * Add the stable comparison metadata used by the contract and runtime galleries.
 * This is deliberately separate from adapter generation: normalization may be
 * rerun without losing the canonical order, fixtures, or honest readiness.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "packages/component-contracts/src/components.json");
const registry = JSON.parse(await fs.readFile(file, "utf8"));

const additions = [
  {
    id: "segmented-button",
    logicalName: "Segmented Button/Default",
    variants: ["default"],
    states: ["default", "hover", "focus", "selected", "disabled"],
    props: ["options", "value", "defaultValue", "label", "disabled", "onChange"],
    slots: ["option"],
    tokenRoles: ["color.surface", "color.text", "color.primary", "radius.tab", "spacing.padding-segmented-control", "typography.body-m"],
    source: "canonical-custom",
    visualAuthority: "apps/component-gallery/index.html#runtime-view",
    sourceStrategy: "canonical-custom",
    implementations: {
      html: "packages/components-html/src/index.js#segmentedButton",
      react: "packages/components-react/src/index.jsx#SegmentedButton",
      vue: "packages/components-vue/src/SegmentedButton.vue"
    }
  },
  {
    id: "number-selector",
    logicalName: "Number Selector/Default",
    variants: ["default"],
    states: ["default", "hover", "focus", "disabled"],
    props: ["label", "value", "defaultValue", "min", "max", "step", "disabled", "onChange"],
    slots: ["label", "decrement", "value", "increment"],
    tokenRoles: ["color.input-bg", "color.text", "color.border", "color.primary", "size.input-height", "radius.input", "typography.body-m"],
    source: "canonical-custom",
    visualAuthority: "apps/component-gallery/index.html#runtime-view",
    sourceStrategy: "canonical-custom",
    implementations: {
      html: "packages/components-html/src/index.js#numberSelector",
      react: "packages/components-react/src/index.jsx#NumberSelector",
      vue: "packages/components-vue/src/NumberSelector.vue"
    }
  },
  {
    id: "sub-tabs",
    logicalName: "Sub Tabs/Default",
    variants: ["default"],
    states: ["default", "hover", "focus", "selected", "disabled"],
    props: ["tabs", "value", "defaultValue", "disabled", "onChange"],
    slots: ["label", "content"],
    tokenRoles: ["color.neutral-dark-05", "color.text-muted", "color.brand-10", "color.brand-100", "spacing.gap-subtab-item", "spacing.space-5", "radius.subtab", "size.size-10", "typography.subtitle-m"],
    source: "canonical-custom",
    visualAuthority: "apps/component-gallery/index.html#runtime-view",
    sourceStrategy: "canonical-custom",
    implementations: {
      html: "packages/components-html/src/index.js#subTabs",
      react: "packages/components-react/src/index.jsx#SubTabs",
      vue: "packages/components-vue/src/SubTabs.vue"
    }
  },
  {
    id: "tree-view",
    logicalName: "Tree View/Default",
    variants: ["default"],
    states: ["default", "hover", "focus", "selected", "expanded", "disabled"],
    props: ["nodes", "selectedId", "expandedIds", "defaultSelectedId", "defaultExpandedIds", "disabled", "onSelect", "onToggle"],
    slots: ["node-leading", "node-label", "node-trailing"],
    tokenRoles: ["color.text", "color.surface", "color.border", "color.primary", "spacing.menu-item-content", "size.tree-item-height", "radius.subtab", "typography.body-m"],
    source: "canonical-custom",
    visualAuthority: "apps/component-gallery/index.html#runtime-view",
    sourceStrategy: "canonical-custom",
    implementations: {
      html: "packages/components-html/src/index.js#treeView",
      react: "packages/components-react/src/index.jsx#TreeView",
      vue: "packages/components-vue/src/TreeView.vue"
    }
  }
];
for (const component of additions) {
  if (!registry.components.some((item) => item.id === component.id)) registry.components.push(component);
}

const sections = [
  ["navigation", "导航类"],
  ["actions", "操作类"],
  ["display", "展示类"],
  ["input", "输入类"],
  ["choices", "选择类"],
  ["containers", "容器类"],
  ["specialized", "特殊组件"]
];
const sectionLabels = Object.fromEntries(sections);
const order = {
  titlebar: 10, "primary-navigation-item": 11, sidebar: 12, tabs: 13, "sub-tabs": 13.5, "tree-view": 14.5, breadcrumb: 14, menubar: 16, pagination: 17, accordion: 18, collapsible: 19,
  button: 110, chips: 111, "context-menu": 112, "dropdown-menu": 113,
  alert: 210, snackbar: 211, tooltip: 212, popover: 213, "hover-card": 214, avatar: 215, badge: 216, "color-picker": 217, card: 217, table: 218, "data-table": 219, progress: 220, chart: 221, empty: 222,
  input: 310, search: 311, textarea: 312, field: 313, label: 314, combobox: 315, "number-selector": 316,
  checkbox: 410, radio: 411, "radio-group": 412, switch: 413, "segmented-button": 414, select: 415, "native-select": 416, slider: 417, calendar: 419, "date-picker": 420, "time-picker": 421,
  "form-field": 509, "list-card": 510, dialog: 512, "alert-dialog": 513, "semi-modal": 514,
  attachment: 610
};
const sectionFor = {
  titlebar: "navigation", "primary-navigation-item": "navigation", sidebar: "navigation", tabs: "navigation", "sub-tabs": "navigation", "tree-view": "navigation", breadcrumb: "navigation", menubar: "navigation", pagination: "navigation", accordion: "navigation", collapsible: "navigation",
  button: "actions", chips: "actions", "context-menu": "actions", "dropdown-menu": "actions",
  alert: "display", snackbar: "display", tooltip: "display", popover: "display", "hover-card": "display", avatar: "display", badge: "display", card: "display", table: "display", "data-table": "display", progress: "display", chart: "display", empty: "display",
  input: "input", search: "input", textarea: "input", field: "input", label: "input", combobox: "input", "number-selector": "input",
  "color-picker": "display",
  checkbox: "choices", radio: "choices", "radio-group": "choices", switch: "choices", "segmented-button": "choices", select: "choices", "native-select": "choices", slider: "choices", calendar: "choices", "date-picker": "choices", "time-picker": "choices",
  "form-field": "containers", "list-card": "containers", dialog: "containers", "alert-dialog": "containers", "semi-modal": "containers",
  attachment: "specialized"
};
const coreIds = new Set(["button", "input", "search", "primary-navigation-item", "sidebar", "list-card", "titlebar", "textarea", "field", "form-field", "select", "combobox", "native-select", "checkbox", "radio", "radio-group", "switch", "segmented-button", "number-selector", "tabs", "sub-tabs", "tree-view", "accordion", "collapsible", "avatar", "badge", "card", "table", "data-table", "pagination", "breadcrumb", "progress", "empty", "label", "alert", "tooltip", "snackbar", "attachment"]);
const fillIds = new Set(["input", "search", "textarea", "sidebar", "list-card", "form-field", "table", "data-table", "accordion", "collapsible", "tree-view"]);
const overlayIds = new Set(["dialog", "alert-dialog", "semi-modal", "popover", "hover-card", "context-menu", "dropdown-menu"]);
const behaviorMap = {
  button: ["click", "keyboard-activation", "disabled"],
  input: ["input", "focus", "disabled", "error"],
  "form-field": ["slot-control", "validation", "disabled"],
  search: ["input", "clear", "focus", "disabled"],
  radio: ["select", "keyboard-activation", "disabled"],
  textarea: ["input", "focus", "disabled", "error"],
  "primary-navigation-item": ["select", "keyboard-activation", "disabled"],
  sidebar: ["select", "keyboard-activation", "disabled"],
  "list-card": ["select", "keyboard-activation", "disabled"],
  tabs: ["select", "arrow-keys", "focus"],
  "sub-tabs": ["select", "arrow-keys", "focus"],
  "tree-view": ["select", "toggle", "arrow-keys", "focus"],
  accordion: ["toggle", "keyboard-activation", "focus"],
  collapsible: ["toggle", "keyboard-activation", "focus"],
  combobox: ["open", "select", "escape", "arrow-keys"],
  "dropdown-menu": ["open", "select", "escape", "arrow-keys"],
  dialog: ["open", "confirm", "cancel", "escape", "focus-return", "no-outside-dismiss"],
  "alert-dialog": ["open", "confirm", "cancel", "escape", "focus-return", "no-outside-dismiss"],
  "semi-modal": ["open", "confirm", "cancel", "close", "escape", "focus-return", "no-outside-dismiss", "modal-focus-trap"],
  calendar: ["select", "arrow-keys"],
  "date-picker": ["open", "select", "escape"],
  "time-picker": ["open", "select", "escape"],
  "color-picker": ["select", "input", "focus", "disabled"],
  "segmented-button": ["select", "keyboard-activation", "disabled"],
  "number-selector": ["input", "increment", "decrement", "focus", "disabled"],
  menubar: ["open", "select", "escape", "arrow-keys", "hover-submenu", "focus", "disabled"],
  attachment: ["open", "select", "preview", "download", "escape", "outside-click", "disabled"],
  snackbar: ["action", "close"]
};

const typographyRoles = {
  button: ["label:body-l", "small-label:body-m"],
  input: ["value:body-l", "placeholder:body-l", "label:body-m", "help:body-s"],
  "form-field": ["label:subtitle-s", "error:body-s"],
  search: ["value:body-l", "placeholder:body-l"],
  radio: ["label:body-m"],
  textarea: ["value:body-l", "placeholder:body-l", "label:body-m", "help:body-s"],
  "primary-navigation-item": [],
  sidebar: ["label:body-l", "count:body-m"],
  "list-card": ["title:title-s", "description:body-m", "meta:body-m"],
  table: ["header:body-m", "cell:body-l"],
  "data-table": ["header:body-m", "cell:body-l"],
  tabs: ["label:body-m"],
  "sub-tabs": ["label:subtitle-m", "unselected-label:body-l", "content:body-l"],
  "tree-view": ["node-label:body-l", "node-trailing:body-m"],
  attachment: ["title:subtitle-s", "content:body-m", "description:body-s", "help:body-s"],
  alert: ["content:subtitle-s"],
  tooltip: ["content:body-l"],
  snackbar: ["title:subtitle-s", "subtitle:body-s", "action:body-m"],
  badge: ["label:body-s"],
  "color-picker": ["title:title-s", "content:body-l", "description:body-m", "help:body-s"]
};

const explicitStates = {
  input: ["default", "hover", "focus", "filled", "error", "disabled"],
  search: ["default", "focus", "typing", "filled", "hover-left", "hover-right", "pressed-left", "pressed-right", "disabled"],
  textarea: ["default", "hover", "focus", "filled", "error", "disabled"]
};

// Every runtime adapter must declare the semantic icon it renders.  This is
// deliberately explicit rather than inferred from a generic fallback so an
// unknown alias fails during generation instead of silently turning into an
// unrelated glyph.
const iconAliases = {
  titlebar: ["window/minimize", "window/maximize", "window/close"],
  button: ["action/add", "action/download", "action/settings", "action/close", "navigation/chevron-down", "action/refresh", "action/more"],
  input: [],
  "form-field": [],
  search: ["field/search", "action/close"],
  textarea: [],
  select: ["navigation/chevron-down"],
  field: [],
  checkbox: ["choice/check"],
  radio: [],
  "radio-group": ["action/check"],
  switch: ["action/check"],
  "primary-navigation-item": ["navigation/grid", "field/calendar", "navigation/mail-unread", "action/settings"],
  sidebar: ["navigation/grid", "navigation/recent", "action/more"],
  "list-card": ["navigation/list"],
  tabs: ["navigation/list"],
  "sub-tabs": [],
  "tree-view": ["navigation/chevron-right", "navigation/grid", "object/file"],
  breadcrumb: ["navigation/chevron-down"],
  pagination: ["navigation/back", "navigation/forward"],
  avatar: [],
  badge: [],
  card: [],
  table: [],
  "data-table": [],
  progress: ["status/success"],
  empty: ["action/add"],
  accordion: ["navigation/chevron-right"],
  collapsible: ["navigation/chevron-down"],
  menubar: ["navigation/grid", "navigation/chevron-right"],
  dialog: [],
  "alert-dialog": ["status/warning"],
  "semi-modal": ["action/close"],
  popover: ["action/more"],
  "hover-card": ["action/more"],
  "context-menu": ["action/more"],
  "dropdown-menu": ["action/more"],
  label: ["field/search"],
  combobox: ["navigation/chevron-down"],
  "native-select": ["navigation/chevron-down"],
  slider: ["action/more"],
  "input-otp": ["action/check"],
  kbd: ["action/more"],
  chart: ["navigation/grid"],
  calendar: ["field/calendar"],
  "date-picker": ["field/calendar"],
  "time-picker": ["field/clock"],
  "color-picker": [],
  attachment: ["navigation/chevron-down"],
  alert: ["status/info", "status/success", "status/warning", "status/danger", "status/neutral", "action/close"],
  tooltip: ["status/info"],
  snackbar: ["status/info", "action/close"]
};

const coreSpecimens = {
  titlebar: [
    { id: "small-normal", variant: "small", state: "default" },
    { id: "small-unfocus", variant: "small", state: "unfocus" },
    { id: "medium-normal", variant: "medium", state: "default" },
    { id: "medium-unfocus", variant: "medium", state: "unfocus" },
    { id: "large-normal", variant: "large", state: "default" },
    { id: "large-unfocus", variant: "large", state: "unfocus" },
    { id: "xlarge-normal", variant: "xlarge", state: "default" },
    { id: "xlarge-unfocus", variant: "xlarge", state: "unfocus" }
  ],
  button: [
    { id: "primary", variant: "primary", state: "default", mode: "text" },
    { id: "secondary", variant: "secondary", state: "default", mode: "text" },
    { id: "ghost", variant: "ghost", state: "default", mode: "text" },
    { id: "danger", variant: "danger", state: "default", mode: "text" },
    { id: "small-primary", variant: "primary", state: "default", mode: "text", size: "small" },
    { id: "small-secondary", variant: "secondary", state: "default", mode: "text", size: "small" },
    { id: "small-ghost", variant: "ghost", state: "default", mode: "text", size: "small" },
    { id: "small-danger", variant: "danger", state: "default", mode: "text", size: "small" },
    { id: "icon", variant: "ghost", state: "default", mode: "icon" },
    { id: "icon-text-primary", variant: "primary", state: "default", mode: "icon-text" },
    { id: "icon-text-secondary", variant: "secondary", state: "default", mode: "icon-text" },
    { id: "icon-text-ghost", variant: "ghost", state: "default", mode: "icon-text" },
    { id: "split-dropdown", variant: "ghost", state: "default", mode: "split-dropdown" },
    { id: "split-dropdown-icon", variant: "ghost", state: "default", mode: "split-dropdown", iconOnly: true }
  ],
  chips: [
    { id: "default", variant: "default", state: "default" },
    { id: "hover", variant: "with-icon", state: "hover" },
    { id: "pressed", variant: "closable", state: "pressed" },
    { id: "disabled", variant: "closable", state: "disabled" }
  ],
  input: [
    { id: "white-surface", variant: "default", state: "default", surface: "white" },
    { id: "gray-surface", variant: "default", state: "default", surface: "gray" }
  ],
  snackbar: [
    { id: "title-only", variant: "title-only", state: "default", leftArea: "1" },
    { id: "title-subtitle", variant: "title-subtitle", state: "default", leftArea: "2" }
  ],
  search: [
    { id: "white-surface", variant: "default", state: "default", surface: "white" },
    { id: "gray-surface", variant: "default", state: "default", surface: "gray" }
  ],
  textarea: [
    { id: "white-surface", variant: "default", state: "default", surface: "white" },
    { id: "gray-surface", variant: "default", state: "default", surface: "gray" }
  ],
  "form-field": [
    { id: "default-white", variant: "input", state: "default", surface: "white" },
    { id: "default-gray", variant: "input", state: "default", surface: "gray" },
    { id: "required-white", variant: "select", state: "default", surface: "white", required: true },
    { id: "required-gray", variant: "select", state: "default", surface: "gray", required: true },
    { id: "error-white", variant: "input", state: "error", surface: "white" },
    { id: "error-gray", variant: "input", state: "error", surface: "gray" }
  ],
  select: [
    { id: "white-surface", variant: "default", state: "default", surface: "white" },
    { id: "gray-surface", variant: "default", state: "default", surface: "gray" }
  ],
  "sub-tabs": [{ id: "default", variant: "default", state: "default" }],
  "tree-view": [{ id: "default", variant: "default", state: "default" }],
  radio: [
    { id: "unselected", variant: "unselected", state: "default", checked: false },
    { id: "selected", variant: "selected", state: "selected", checked: true }
  ],
  "primary-navigation-item": [{ id: "default", variant: "default", state: "default", surface: "white" }],
  sidebar: [{ id: "default", variant: "default", state: "default", surface: "white" }],
  "list-card": [
    { id: "single-text-arrow", variant: "single-line", state: "default", lines: 1, trailing: "text-arrow" },
    { id: "double-icon", variant: "double-line", state: "default", lines: 2, trailing: "icon" },
    { id: "triple-radio", variant: "triple-line", state: "default", lines: 3, trailing: "radio" },
    { id: "single-checkbox", variant: "single-line", state: "default", lines: 1, trailing: "checkbox" },
    { id: "single-switch", variant: "single-line", state: "default", lines: 1, trailing: "switch" },
    { id: "single-notification-arrow", variant: "single-line", state: "default", lines: 1, trailing: "notification-arrow" }
  ],
  avatar: [
    { id: "fallback-32", variant: "size-32", state: "default", size: 32, content: "initials" },
    { id: "fallback-40", variant: "size-40", state: "default", size: 40, content: "initials" }
  ],
  dialog: [
    { id: "single-default", variant: "single", state: "closed", actionLayout: "single", intent: "default" },
    { id: "double-default", variant: "double", state: "closed", actionLayout: "double", intent: "default" },
    { id: "triple-default", variant: "triple", state: "closed", actionLayout: "triple", intent: "default" }
  ],
  "alert-dialog": [
    { id: "danger-confirm", variant: "danger", state: "closed", actionLayout: "double", intent: "danger" }
  ],
  "semi-modal": [
    { id: "s-white-non-modal", variant: "s-white-non-modal", state: "closed", size: "s", surface: "white", mode: "non-modal" },
    { id: "m-white-non-modal", variant: "m-white-non-modal", state: "closed", size: "m", surface: "white", mode: "non-modal" },
    { id: "l-white-non-modal", variant: "l-white-non-modal", state: "closed", size: "l", surface: "white", mode: "non-modal" },
    { id: "s-gray-non-modal", variant: "s-gray-non-modal", state: "closed", size: "s", surface: "gray", mode: "non-modal" },
    { id: "m-gray-non-modal", variant: "m-gray-non-modal", state: "closed", size: "m", surface: "gray", mode: "non-modal" },
    { id: "l-gray-non-modal", variant: "l-gray-non-modal", state: "closed", size: "l", surface: "gray", mode: "non-modal" },
    { id: "m-white-modal", variant: "m-white-modal", state: "closed", size: "m", surface: "white", mode: "modal" }
  ],
  alert: [
    { id: "info", variant: "info", state: "default", label: "Info / 信息", message: "系统将在今晚自动完成更新。", action: "查看详情" },
    { id: "success", variant: "success", state: "default", label: "Success / 成功", message: "所有修改已经同步到云端。", action: "查看详情" },
    { id: "warning", variant: "warning", state: "default", label: "Warning / 警告", message: "连接不稳定，部分内容可能暂时无法加载。", action: "重新连接" },
    { id: "danger", variant: "danger", state: "default", label: "Danger / 危险", message: "存储空间不足，请清理空间后重试。", action: "清理空间" },
    { id: "neutral", variant: "neutral", state: "default", label: "Neutral / 中性", message: "当前为只读模式，部分编辑操作暂不可用。", action: "知道了" }
  ],
  "color-picker": [{ id: "default", variant: "default", state: "default" }]
};

for (const component of registry.components) {
  if (component.id === "titlebar") {
    delete component.slotContracts?.leading;
    component.props = [...new Set([...(component.props ?? []), "segmentRole", "slots", "showWindowControls", "showLogo", "logoSrc", "logoAlt"])];
    component.segmentContract = {
      owner: "pattern-title-layer", orderedBy: "titleLayer.segments", widthOwner: "pattern-renderer",
      roles: ["primary-navigation", "secondary-list", "main-content", "main-detail"],
      middleSegments: "optional-registered-content; alignment-owned-by-titlebar", windowControls: "final-segment-only",
      slotAPI: "declarative-content; no arbitrary HTML"
    };
    component.slotContracts = { ...component.slotContracts,
      logo: { cardinality: "0..1", valueType: "image-object", activeRoles: ["global", "primary-navigation", "secondary-pane", "final-pane"], fields: ["src", "alt"], visibilityProp: "showLogo" },
      leading: { cardinality: "0..1", valueType: "image-object", activeRoles: ["global", "primary-navigation"], fields: ["src", "alt"], deprecatedAliasFor: "logo" },
      label: { cardinality: "0..1", valueType: "text", activeRoles: ["global", "primary-navigation"] },
      actions: { cardinality: "0..1", valueType: "boolean", activeRoles: ["global", "final-pane"], implementation: "component-owned-window-controls" }
    };
  }
  if (component.id === "button") component.props = [...new Set([...(component.props ?? []), "icon"])];
  const section = sectionFor[component.id] ?? "specialized";
  const specimens = coreSpecimens[component.id] ?? [{ id: "default", variant: component.variants?.[0] ?? "default", state: "default" }];
  // A source adapter is not evidence of visual/behavior parity. Start every
  // component as Partial and promote only from browser-level evidence.
  const ready = false;
  component.category = section;
  component.categoryLabel = sectionLabels[section] ?? section;
  component.order = order[component.id] ?? 999;
  component.visualAuthority = "apps/component-gallery/index.html#runtime-view";
  component.canonicalSection = `[data-runtime-category="${section}"]`;
  component.canonicalSelector = `#runtime-view [data-runtime-category="${section}"] .tui-runtime-card__preview[data-fixture-id="fixture-${component.id}"]`;
  component.comparisonGroup = section;
  component.canonicalSpecimen = `gallery:${section}:${component.id}`;
  component.specimens = specimens;
  component.fixtureId = `fixture-${component.id}`;
  component.surface = component.id === "input" || component.id === "search" || component.id === "textarea" || component.id === "semi-modal"
    ? ["white", "gray"]
    : component.id === "dialog" || component.id === "alert-dialog"
      ? "white"
      : overlayIds.has(component.id) ? ["white", "gray"] : "white";
  component.sizing = overlayIds.has(component.id) ? "overlay" : fillIds.has(component.id) ? "fill" : "intrinsic";
  component.allowedStates = explicitStates[component.id] ?? component.states ?? ["default", "hover", "focus", "disabled"];
  component.behaviors = behaviorMap[component.id] ?? ["focus", "disabled"];
  component.textRoles = typographyRoles[component.id] ?? ["title:title-s", "content:body-l", "description:body-m", "help:body-s"];
  if (component.id === "primary-navigation-item") {
    component.tokenRoles = (component.tokenRoles ?? []).map((role) => role === "icon-size-md" ? "icon-size-lg" : role);
  }
 component.iconAliases = iconAliases[component.id] ?? [];
  const iconKind = "regular";
 component.iconSlots = component.id === "pagination"
   ? [
       { slot: "previous", alias: "navigation/back", displaySizes: [16, 20, 24], kind: "regular" },
       { slot: "next", alias: "navigation/forward", displaySizes: [16, 20, 24], kind: "regular" }
     ]
      : component.iconAliases.map((alias) => ({
        slot: component.id === "menubar" ? (alias === "navigation/chevron-right" ? "item-trailing" : "item-leading") : undefined,
        alias,
        displaySizes: component.id === "primary-navigation-item" || component.id === "menubar" ? [24] : ["accordion", "collapsible"].includes(component.id) ? [20] : [16, 20, 24],
        kind: iconKind
      })).map((entry) => Object.fromEntries(Object.entries(entry).filter(([, value]) => value !== undefined)));
 component.iconSemantic = component.iconAliases[0] ?? null;
  if (component.id === "snackbar") {
    component.variants = ["title-only", "title-subtitle"];
    component.allowedStates = ["default"];
    component.props = ["title", "subtitle", "actionLabel", "leftArea", "closable", "onAction", "onClose"];
    component.slots = ["leading", "title", "subtitle", "action", "close"];
    component.iconAliases = ["status/info", "action/close"];
    component.iconSlots = [
      { slot: "leading", alias: "status/info", displaySizes: [24], kind: "regular" },
      { slot: "close", alias: "action/close", displaySizes: [20], kind: "regular" }
    ];
    component.slotContracts = {
      ...component.slotContracts,
      leading: { cardinality: "1", scope: "snackbar-main", iconAlias: "status/info", iconSize: "24px", source: "lucide" },
      title: { cardinality: "1", scope: "snackbar-content", typographyRole: "subtitle-s" },
      subtitle: { cardinality: "0..1", scope: "snackbar-content", typographyRole: "body-s", activeWhen: "variant=title-subtitle" },
      action: { cardinality: "0..1", scope: "snackbar-actions", control: "small-button-slot", acceptedComponentContract: "button", requiredSize: "small", accepts: "any shared Button mode and variant at small size", defaultControl: "Button/Ghost/Default" },
      close: { cardinality: "0..1", scope: "snackbar-actions", control: "icon-button", iconAlias: "action/close", iconSize: "20px", hotZone: "40px", requiresAccessibleName: true }
    };
  }
  if (component.id === "primary-navigation-item") {
    component.slots = ["icon", "tooltip"];
    component.structuralAxes = {
      placement: ["primary-navigation-shell"],
      alignment: ["bottom"],
      presentation: ["icon-only"],
    };
    component.slotContracts = {
      ...component.slotContracts,
      icon: { ...component.slotContracts?.icon, cardinality: "1", scope: "primary-navigation-item", displaySize: "24px", kind: "regular", source: "lucide" }
    };
  }
  if (component.id === "menubar") {
    component.props = ["label", "value", "items", "disabled", "state", "className"];
    component.slots = ["label", "content", "description", "item-leading", "item-label", "item-trailing"];
    component.tokenRoles = [...new Set([...(component.tokenRoles ?? []), "icon-size-lg", "spacing.menu-item-content"])]
    component.slotContracts = {
      ...component.slotContracts,
      "item-leading": { cardinality: "0..1", scope: "menubar-item", iconSize: "24px", iconToken: "icon-size-lg", gapToken: "gap-menu-item-content", gap: "8px", source: "lucide" },
      "item-label": { cardinality: "1", scope: "menubar-item", typographyRole: "body-l" },
      "item-trailing": { cardinality: "0..1", scope: "menubar-item", iconAlias: "navigation/chevron-right", iconSize: "24px", iconToken: "icon-size-lg", activeWhen: "hasSubmenu", placement: "trailing-end" }
    };
  }
  if (component.id === "semi-modal") {
    component.slots = ["title", "description", "content", "actions", "close"];
    component.iconAliases = ["action/close"];
    component.iconSlots = [{ slot: "close", alias: "action/close", displaySizes: [20], kind: "regular" }];
    component.slotContracts = {
      ...component.slotContracts,
      close: { cardinality: "1", scope: "semi-modal-header", control: "icon-button", iconAlias: "action/close", iconSize: "20px", trailingInsetToken: "space/5", trailingInset: "16px" }
    };
  }
 if (component.id === "search") {
    component.variants = ["default", "focused", "with-value", "advanced-search", "scoped-search", "scoped-advanced-search"];
    component.props = ["value", "defaultValue", "placeholder", "disabled", "state", "surface", "scope", "defaultScope", "scopeOptions", "scopeLabel", "onScopeChange", "advancedSearch", "advancedSearchLabel", "onAdvancedSearch", "onChange", "onClear"];
    component.slots = ["scope-selector", "leading", "value", "clear", "advanced-search"];
    component.slotContracts = {
      ...component.slotContracts,
      "scope-selector": {
        cardinality: "0..1",
        optional: true,
        configurable: true,
        configurationProps: ["scopeOptions", "scope", "defaultScope", "scopeLabel", "onScopeChange"],
        scope: "search-query-builder",
        defaultPlacement: "leading-before-search-icon",
        control: "dropdown-menu",
        defaultLabel: "搜索范围",
        defaultValue: "first-scope-option",
        dividerToken: "color.border",
        interaction: "change-search-scope",
        coexistenceOrder: ["scope-selector", "leading", "value", "clear", "advanced-search"]
      },
      "advanced-search": {
        cardinality: "0..1",
        optional: true,
        configurable: true,
        configurationProps: ["advancedSearch", "advancedSearchLabel", "onAdvancedSearch"],
        scope: "search-query-builder",
        defaultPlacement: "trailing-after-clear",
        control: "small-text-button",
        variant: "ghost",
        size: "small",
        mode: "text",
        textColorToken: "color.text-muted",
        trailingInsetToken: "space/2",
        requiresAccessibleName: true,
        interaction: "open-advanced-search-layer",
        coexistenceOrder: ["clear", "advanced-search"]
      }
    };
    component.behaviors = ["input", "scope-select", "clear", "advanced-search", "focus", "disabled"];
  }
  if (component.id === "attachment") {
    component.iconSlots = [{ slot: "menu-trigger", alias: "navigation/chevron-down", displaySizes: [20], kind: "regular" }];
    component.props = ["type", "name", "meta", "leading", "content", "actions", "disabled", "onAction", "onPreview", "onDownload"];
    component.slots = ["leading", "title", "content", "description", "actions", "menu-trigger", "menu"];
    component.slotContracts = {
      actions: {
        cardinality: "0..1",
        scope: "attachment-surface",
        defaultPlacement: "trailing-end",
        control: "attachment-action-menu",
        interaction: "open-attachment-action-menu",
        menuItems: ["preview", "download"]
      },
      "menu-trigger": {
        cardinality: "0..1",
        scope: "attachment-action-menu",
        defaultVisibility: "visible",
        iconAlias: "navigation/chevron-down",
        iconSize: "20px",
        ariaHasPopup: "menu"
      },
      menu: {
        cardinality: "0..1",
        scope: "attachment-action-menu",
        role: "menu",
        items: ["preview", "download"],
        closeOn: ["escape", "outside-click", "select"]
      }
    };
  }
  if (component.id === "titlebar") {
    component.variants = ["small", "medium", "large", "xlarge"];
    component.structuralAxes = {
      size: ["small", "medium", "large", "xlarge"],
      layout: ["standalone", "two-column", "three-column"],
      paneRole: ["global", "primary-navigation", "secondary-pane", "final-pane"],
      segmentRole: ["global", "primary-navigation", "secondary-list", "main-content", "main-detail", "secondary-pane", "final-pane"]
    };
    component.props = ["label", "paneTitle", "size", "layout", "segmentRole", "slots", "showWindowControls", "showLogo", "logoSrc", "logoAlt", "disabled", "state", "mainDetailActions", "onMainDetailAction", "onAction", "className"];
    component.slots = ["logo", "label", "secondary-pane-content", "main-content-title", "main-detail-actions", "actions"];
    component.slotContracts = {
      ...component.slotContracts,
      logo: {
        cardinality: "0..1",
        scope: "titlebar-logo",
        valueType: "image-object",
        activeRoles: ["global", "primary-navigation", "secondary-pane", "final-pane"],
        fields: ["src", "alt"],
        visibilityProp: "showLogo",
        defaultVisibility: { global: true, "primary-navigation": true, "secondary-pane": false, "final-pane": false }
      },
      "main-content-title": {
        cardinality: "0..1",
        scope: "main-content-pane-global",
        valueType: "text",
        activeWhen: { layout: "two-column", paneRole: "final-pane" },
        defaultPlacement: "final-pane-leading-slot",
        leadingInsetToken: "layout/main-title-leading-padding"
      },
      "main-detail-actions": {
        ...component.slotContracts?.["main-detail-actions"],
        cardinality: "0..n",
        scope: "main-detail-pane-global",
        valueType: "action-array",
        activeWhen: { layout: "three-column", paneRole: "final-pane" },
        defaultPlacement: "final-pane-leading-slot",
        layout: "compact-horizontal-group",
        leadingInsetToken: "layout/main-detail-action-leading-padding",
        allowedButtonVariants: ["ghost"],
        allowedButtonTypes: ["icon", "icon-text-ghost"],
        forbidden: ["page-global-primary", "card-action", "field-action", "section-action", "selection-action", "inline-action"]
      }
    };
    component.dividerRules = {
      default: "no-horizontal-divider",
      standalone: "no-horizontal-divider",
      "two-column": {
        "primary-navigation": "no-horizontal-divider",
        "final-pane": "no-horizontal-divider"
      },
      "three-column": {
        "primary-navigation": "no-horizontal-divider",
        "secondary-pane": "no-horizontal-divider",
        "final-pane": "bottom-divider"
      },
      verticalPaneDividers: "owned-by-layout-and-continuous"
    };
  }
  if (component.id === "dialog") {
    component.variants = ["single", "double", "triple"];
    component.states = ["closed", "open"];
    component.allowedStates = ["closed", "open"];
    component.structuralAxes = { actionLayout: ["single", "double", "triple"], intent: ["default", "danger"] };
    component.interactionStates = ["closed", "open"];
    component.props = ["open", "title", "description", "intent", "actionLayout", "confirmLabel", "cancelLabel", "thirdActionLabel", "onConfirm", "onCancel", "onThirdAction", "onOpenChange"];
  }
  if (component.id === "alert-dialog") {
    component.variants = ["danger"];
    component.states = ["closed", "open"];
    component.allowedStates = ["closed", "open"];
    component.structuralAxes = { actionLayout: ["double"], intent: ["danger"], mode: ["modal"] };
    component.interactionStates = ["closed", "open"];
    component.props = ["open", "title", "description", "confirmLabel", "cancelLabel", "statusIcon", "onConfirm", "onCancel", "onOpenChange"];
  }
  if (component.id === "semi-modal") {
    component.variants = ["s", "m", "l", "white", "gray", "non-modal", "modal"];
    component.states = ["closed", "open"];
    component.allowedStates = ["closed", "open"];
    component.structuralAxes = { size: ["s", "m", "l"], surface: ["white", "gray"], mode: ["non-modal", "modal"] };
    component.interactionStates = ["closed", "open"];
    component.props = ["open", "size", "surface", "mode", "title", "onConfirm", "onCancel", "onClose", "onOpenChange"];
  }
  component.readiness = {
    sourceReady: true,
    contractReady: true,
    visualParity: ready,
    behaviorParity: ready,
    accessibilityParity: ready,
    tokenParity: true
  };
  component.status = ready ? "ready" : "partial";
  component.frameworks = Object.fromEntries(["html", "react", "vue"].map((framework) => [framework, {
    ...component.frameworks?.[framework],
    status: ready ? "ready" : "partial"
  }]));
  component.contractNotes = ready
    ? "三框架核心适配器已按统一组件契约和同一 fixture 对齐；运行时只展示结构性 Variant，交互状态由组件触发。"
    : "已保留当前组件契约；运行时适配器仍需按本组件真实结构、行为和可访问性逐批验收。";
}

const comparisonGroups = sections.map(([id, label]) => ({ id, label, componentIds: [] }));
const comparisonGroupById = new Map(comparisonGroups.map((group) => [group.id, group]));
for (const component of registry.components) {
  comparisonGroupById.get(component.category)?.componentIds.push(component.id);
}
const preferredComparisonOrder = {
  navigation: ["titlebar", "primary-navigation-item", "sidebar", "tabs", "sub-tabs", "tree-view", "breadcrumb", "menubar", "pagination", "accordion", "collapsible"],
  actions: ["button", "chips", "context-menu", "dropdown-menu"],
  display: ["alert", "snackbar", "tooltip", "popover", "hover-card", "avatar", "badge", "color-picker", "card", "table", "data-table", "progress", "chart", "empty"],
  input: ["input", "search", "textarea", "field", "label", "combobox", "number-selector"],
  choices: ["checkbox", "radio", "radio-group", "switch", "segmented-button", "select", "native-select", "slider", "calendar", "date-picker", "time-picker"],
  containers: ["form-field", "list-card", "dialog", "alert-dialog", "semi-modal"],
  specialized: ["attachment"]
};
for (const [groupId, preferredIds] of Object.entries(preferredComparisonOrder)) {
  const group = comparisonGroupById.get(groupId);
  if (!group) continue;
  const current = new Set(group.componentIds);
  group.componentIds = [
    ...preferredIds.filter((componentId) => current.has(componentId)),
    ...group.componentIds.filter((componentId) => !preferredIds.includes(componentId))
  ];
}

registry.registryPolicy = {
  ...(registry.registryPolicy ?? {}),
  visualAuthority: "apps/component-gallery/index.html#runtime-view",
  readinessDimensions: ["sourceReady", "contractReady", "visualParity", "behaviorParity", "accessibilityParity", "tokenParity"],
  readyWhen: "all readinessDimensions are true",
  runtimeRule: "只显示结构性 specimens；hover/pressed/focus/open/close 由真实组件交互触发",
  comparisonRule: "Framework comparison uses the Monorepo Component Gallery runtime view as its sole visual authority; historical Skill preview pages are not part of the delivery.",
  categoryOrder: sections.map(([id]) => id),
  comparisonGroups,
  partialMustNotBeUsedFor: ["strict-pixso-component-parity", "cross-framework-component-claim"]
};

await fs.writeFile(file, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Enriched ${registry.components.length} contracts: ${registry.components.filter((item) => item.status === "ready").length} ready, ${registry.components.filter((item) => item.status === "partial").length} partial.`);
