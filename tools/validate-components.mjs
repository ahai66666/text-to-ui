#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const contractPath = path.join(root, "packages/component-contracts/src/components.json");
const pixsoPath = path.join(root, "packages/pixso-mapping/index.json");
const contracts = JSON.parse(await fs.readFile(contractPath, "utf8"));
const pixso = JSON.parse(await fs.readFile(pixsoPath, "utf8"));
const failures = [];
const warnings = [];
const comparisonGroups = contracts.registryPolicy?.comparisonGroups ?? [];
const comparisonIds = comparisonGroups.flatMap((group) => group.componentIds ?? []);
if (comparisonGroups.length !== 7) failures.push("Component gallery comparison order must define 7 functional sections");
if (comparisonIds.length !== contracts.components.length || new Set(comparisonIds).size !== contracts.components.length) failures.push("Component gallery comparison order must include every registered component exactly once");
if (new Set(contracts.components.map((component) => component.logicalName)).size !== contracts.components.length) failures.push("Component logicalName values must be unique; use logicalName as the public component identity");
if (new Set(contracts.components.map((component) => component.id)).size !== contracts.components.length) failures.push("Component runtime IDs must be unique");

const exists = async (relativePath) => {
  try { await fs.access(path.join(root, relativePath)); return true; } catch { return false; }
};
const read = async (relativePath) => fs.readFile(path.join(root, relativePath), "utf8");
const implementationPath = (component, framework) => String(component.frameworks?.[framework]?.source ?? component.implementations?.[framework] ?? "").split("#")[0];
const runtimeModulePath = "packages/component-contracts/src/components-runtime.js";
const expectedRuntimeModule = [
  "// Generated from components.json. Do not edit by hand.",
  `export default ${JSON.stringify(contracts, null, 2)};`,
  ""
].join("\n");
if (!(await exists(runtimeModulePath))) failures.push("Generated component runtime registry is missing");
else if (await read(runtimeModulePath) !== expectedRuntimeModule) failures.push("components-runtime.js must be regenerated from components.json; do not edit the generated registry directly");

for (const component of contracts.components) {
  if (!component.sourceStrategy || !component.visualAuthority) failures.push(`${component.logicalName}: sourceStrategy and visualAuthority are required`);
  if (!component.frameworks || !component.implementations) failures.push(`${component.logicalName}: framework implementation matrix is missing`);
  const readinessKeys = ["sourceReady", "contractReady", "visualParity", "behaviorParity", "accessibilityParity", "tokenParity"];
  if (!component.readiness || readinessKeys.some((key) => typeof component.readiness[key] !== "boolean")) {
    failures.push(`${component.logicalName}: readiness must contain six boolean dimensions`);
  }
  const calculatedStatus = component.readiness && readinessKeys.every((key) => component.readiness[key]) ? "ready" : "partial";
  if (component.status !== calculatedStatus) failures.push(`${component.logicalName}: status must be derived from readiness dimensions`);
  if (!component.category || !Number.isFinite(component.order) || !component.canonicalSection || !component.fixtureId || !component.sizing) {
    failures.push(`${component.logicalName}: runtime comparison metadata is incomplete`);
  }
  for (const framework of ["html", "react", "vue"]) {
    const file = implementationPath(component, framework);
    if (!(await exists(file))) failures.push(`${component.logicalName}: missing ${framework} implementation ${file}`);
    else {
      const source = await read(file);
      // React adapters use a shared contract helper to emit the four runtime
      // attributes; Vue adapters may be render-function components rather
      // than SFCs, so the validator accepts either an SFC template or a
      // defineComponent/h() implementation.
      const evidenceSource = framework === "react"
        ? `${source}\n${await read("packages/components-react/src/shared.jsx")}`
        : source;
      for (const attribute of ["data-component", "data-logical-component", "data-variant", "data-state"]) {
        if (!evidenceSource.includes(attribute)) failures.push(`${component.logicalName}: ${framework} implementation is missing ${attribute}`);
      }
      if (framework === "react") {
        const exportName = component.frameworks?.react?.source?.split("#")[1];
        if (exportName && !source.includes(`export function ${exportName}`) && !source.includes(`export default ${exportName}`)) failures.push(`${component.logicalName}: React adapter does not export ${exportName}`);
      }
      if (framework === "vue" && !source.includes("<template>") && !(source.includes("defineComponent") && source.includes(" h("))) failures.push(`${component.logicalName}: Vue adapter has no template or render function`);
      if (/(?:color|background|border|fill|stroke)\s*[:=]\s*(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\()/i.test(source)) {
        failures.push(`${component.logicalName}: ${framework} implementation contains a hardcoded color`);
      }
    }
    const expectedFrameworkStatus = component.status === "ready" ? "ready" : "partial";
    if (component.frameworks?.[framework]?.status !== expectedFrameworkStatus) failures.push(`${component.logicalName}: ${framework} framework status does not match component status`);
  }
  if (!pixso.components[component.logicalName]) failures.push(`${component.logicalName}: missing Pixso logical mapping`);
  if (!component.tokenRoles?.length) warnings.push(`${component.logicalName}: no token roles declared`);
  if (!component.slots?.length) failures.push(`${component.logicalName}: slots must not be empty`);
}

const titlebar = contracts.components.find((component) => component.id === "titlebar");
const mainDetailActions = titlebar?.slotContracts?.["main-detail-actions"];
if (JSON.stringify(titlebar?.textRolesByVariant?.small) !== JSON.stringify(["title:subtitle-m"])) failures.push("Titlebar/Default: S title must use Subtitle_M");
for (const size of ["medium", "large", "xlarge"]) {
  if (JSON.stringify(titlebar?.textRolesByVariant?.[size]) !== JSON.stringify(["title:title-s"])) failures.push(`Titlebar/Default: ${size} title must retain Title_S`);
}
for (const role of ["typography.subtitle-m", "typography.title-s"]) {
  if (!titlebar?.tokenRoles?.includes(role)) failures.push(`Titlebar/Default: ${role} token role is required`);
}
if (!titlebar?.slots?.includes("main-detail-actions")) failures.push("Titlebar/Default: main-detail-actions slot is required");
if (!titlebar?.props?.includes("mainDetailActions") || !titlebar?.props?.includes("onMainDetailAction")) failures.push("Titlebar/Default: multi-action framework props are required");
if (mainDetailActions?.cardinality !== "0..n" || mainDetailActions?.scope !== "main-detail-pane-global" || mainDetailActions?.defaultPlacement !== "final-pane-leading-slot") failures.push("Titlebar/Default: Main Detail action slot cardinality, scope, and placement are invalid");
if (mainDetailActions?.leadingInsetToken !== "layout/main-detail-action-leading-padding") failures.push("Titlebar/Default: Main Detail action slot must use the canonical 16px leading inset Token");
if (JSON.stringify(mainDetailActions?.allowedButtonTypes) !== JSON.stringify(["icon", "icon-text-ghost"])) failures.push("Titlebar/Default: Main Detail action slot must allow only icon and icon-text-ghost buttons");
if (JSON.stringify(mainDetailActions?.allowedButtonVariants) !== JSON.stringify(["ghost"])) failures.push("Titlebar/Default: Main Detail action slot must use the ghost Button variant");
if (titlebar?.layoutRules?.secondaryListPane?.surfaceInset !== "16px" || titlebar?.layoutRules?.secondaryListPane?.contentAxis !== "24px") failures.push("Titlebar/Default: Secondary List Pane 16px surface inset and 24px content axis are required");
if (titlebar?.layoutRules?.mainDetailPane?.paddingInline !== "24px" || titlebar?.layoutRules?.mainDetailPane?.paddingTop !== "16px" || titlebar?.layoutRules?.mainDetailPane?.paddingBottom !== "0px") failures.push("Titlebar/Default: Main Detail Pane must use 24px inline, 16px top, and 0px bottom insets");
if (titlebar?.layoutRules?.mainDetailActions?.leadingInset !== "16px") failures.push("Titlebar/Default: Main Detail action slot must begin 16px after the pane divider");

const primaryNavigation = contracts.components.find((component) => component.id === "primary-navigation-item");
const expectedPrimaryNavigationAliases = ["navigation/grid", "field/calendar", "navigation/mail-unread", "action/settings"];
if (!primaryNavigation?.slots?.includes("icon") || primaryNavigation?.slotContracts?.icon?.kind !== "regular") failures.push("Primary Navigation Item: first-level icon slot must use the Lucide Regular rule");
if (primaryNavigation?.slotContracts?.icon?.displaySize !== "24px" || primaryNavigation?.slotContracts?.icon?.source !== "lucide") failures.push("Primary Navigation Item: icon slot must use the 24px Lucide Regular contract");
if (JSON.stringify(primaryNavigation?.iconAliases) !== JSON.stringify(expectedPrimaryNavigationAliases)) failures.push("Primary Navigation Item: icon aliases must use the approved Lucide Regular semantic aliases");

const menubar = contracts.components.find((component) => component.id === "menubar");
if (!menubar?.props?.includes("items")) failures.push("Menubar/Default: menu item data must be exposed through the items prop");
for (const slotName of ["item-leading", "item-label", "item-trailing"]) {
  if (!menubar?.slots?.includes(slotName)) failures.push(`Menubar/Default: ${slotName} slot is required`);
}
if (menubar?.slotContracts?.["item-leading"]?.iconSize !== "24px" || menubar?.slotContracts?.["item-leading"]?.gapToken !== "gap-menu-item-content") failures.push("Menubar/Default: leading icon slot must use a 24px icon and the 8px menu-item gap token");
if (menubar?.slotContracts?.["item-trailing"]?.iconAlias !== "navigation/chevron-right" || menubar?.slotContracts?.["item-trailing"]?.activeWhen !== "hasSubmenu") failures.push("Menubar/Default: trailing submenu slot must use a conditional right chevron");
if (JSON.stringify(menubar?.iconSlots?.map((slot) => slot.displaySizes)) !== JSON.stringify([[24], [24]])) failures.push("Menubar/Default: leading and trailing icons must be restricted to 24px");
for (const [framework, sourcePath] of Object.entries({
  html: "packages/components-html/src/advanced.js",
  react: "packages/components-react/src/advanced.jsx",
  vue: "packages/components-vue/src/advanced.js"
})) {
  const source = await read(sourcePath);
  if (!source.includes('data-slot="leading"') && !source.includes('"data-slot": "leading"')) failures.push(`Menubar/Default: ${framework} adapter is missing the leading icon slot marker`);
  if (!source.includes('data-slot="trailing"') && !source.includes('"data-slot": "trailing"')) failures.push(`Menubar/Default: ${framework} adapter is missing the trailing submenu slot marker`);
  if (!source.includes("navigation/chevron-right")) failures.push(`Menubar/Default: ${framework} adapter is missing the submenu right-chevron alias`);
  if (!source.includes("size={24}") && !source.includes(", 24)") && !source.includes("size: 24")) failures.push(`Menubar/Default: ${framework} adapter is missing the 24px icon size`);
}

const semiModal = contracts.components.find((component) => component.id === "semi-modal");
const semiModalClose = semiModal?.slotContracts?.close;
if (!semiModal?.slots?.includes("close") || semiModalClose?.iconAlias !== "action/close") failures.push("Semi-modal/Default: close slot must be declared in the header");
if (semiModalClose?.iconSize !== "20px" || semiModalClose?.trailingInsetToken !== "space/5" || semiModalClose?.trailingInset !== "16px") failures.push("Semi-modal/Default: close slot must use a 20px icon and 16px trailing inset");
if (JSON.stringify(semiModal?.iconSlots?.[0]?.displaySizes) !== JSON.stringify([20])) failures.push("Semi-modal/Default: close icon display size must be restricted to 20px");

const attachment = contracts.components.find((component) => component.id === "attachment");
const attachmentActions = attachment?.slotContracts?.actions;
const attachmentMenuTrigger = attachment?.slotContracts?.["menu-trigger"];
const attachmentMenu = attachment?.slotContracts?.menu;
if (!attachment?.slots?.includes("actions") || !attachment?.slots?.includes("menu-trigger") || !attachment?.slots?.includes("menu")) failures.push("Attachment/Default: actions, menu-trigger, and menu slots are required");
if (!attachment?.props?.includes("onAction") || !attachment?.props?.includes("onPreview") || !attachment?.props?.includes("onDownload")) failures.push("Attachment/Default: action callbacks are required");
if (!attachment?.tokenRoles?.includes("color.surface-muted") || attachment?.tokenRoles?.includes("color.border")) failures.push("Attachment/Default: surface-muted is required and default border is forbidden");
if (attachmentActions?.defaultPlacement !== "trailing-end" || attachmentActions?.control !== "attachment-action-menu" || JSON.stringify(attachmentActions?.menuItems) !== JSON.stringify(["preview", "download"])) failures.push("Attachment/Default: trailing action menu contract is invalid");
if (attachmentMenuTrigger?.defaultVisibility !== "visible" || attachmentMenuTrigger?.iconAlias !== "navigation/chevron-down" || attachmentMenuTrigger?.iconSize !== "20px") failures.push("Attachment/Default: visible 20px chevron menu trigger is required");
if (attachmentMenu?.role !== "menu" || JSON.stringify(attachmentMenu?.items) !== JSON.stringify(["preview", "download"])) failures.push("Attachment/Default: preview/download menu contract is invalid");

if (!(await exists("packages/tokens/src/index.css"))) failures.push("Token package entry is missing");
if (!(await exists("apps/component-gallery/index.html"))) failures.push("Component gallery is missing");
else {
  const gallery = await read("apps/component-gallery/index.html");
  const galleryRuntime = await read("apps/component-gallery/preview.js");
  if (!gallery.includes('data-component-mount="component-catalog"') || !galleryRuntime.includes("loadRuntimeFramework")) failures.push("Gallery is missing the unified runtime component mount");
  if (!galleryRuntime.includes('data-runtime-framework') || !galleryRuntime.includes("runtime-html.js") || !galleryRuntime.includes("runtime-react.jsx") || !galleryRuntime.includes("runtime-vue.js")) failures.push("Gallery is missing the same-page HTML / React / Vue runtime switch");
  if (!(await exists("apps/component-gallery/runtime-catalog.js"))) failures.push("Runtime catalog order source is missing");
  for (const runtimeEntry of ["runtime-html.js", "runtime-react.jsx", "runtime-vue.js"]) {
    if (!(await exists(`apps/component-gallery/${runtimeEntry}`))) failures.push(`Missing unified runtime renderer ${runtimeEntry}`);
  }
  const htmlRuntime = await read("apps/component-gallery/runtime-html.js");
  const reactRuntime = await read("apps/component-gallery/runtime-react.jsx");
  const vueRuntime = await read("apps/component-gallery/runtime-vue.js");
  for (const componentId of ["button", "input", "search", "primary-navigation-item", "sidebar", "list-card"]) {
    if (!htmlRuntime.includes("renderRuntimeHtmlComponent") || !reactRuntime.includes(`id === \"${componentId}\"`) || !vueRuntime.includes(`id === \"${componentId}\"`)) failures.push(`${componentId}: unified runtime catalog is missing its canonical adapter`);
  }
  for (const frameworkEntry of ["framework-html.html", "framework-react.html", "framework-vue.html"]) {
    if (!(await exists(`apps/component-gallery/${frameworkEntry}`))) failures.push(`Missing framework runtime entry ${frameworkEntry}`);
  }
  if (gallery.includes('data-view="contract"') || gallery.includes('data-view-link="contract"') || gallery.includes('data-view-tab="contract"')) failures.push("Gallery must not expose the contract as a separate visual-preview route");
  if (gallery.includes('class="contract-visual-frame"') || gallery.includes('data-legacy-lazy="true"')) failures.push("Gallery must not embed a separate contract visual baseline iframe");
  if (!gallery.includes('data-view="pattern"') || !gallery.includes('data-view="runtime"')) failures.push("Gallery must expose Pattern and framework runtime as the daily preview routes");
  if (!htmlRuntime.includes("renderContractDialogHtml") || !reactRuntime.includes("ContractDialog") || !vueRuntime.includes("ContractDialog")) failures.push("Each framework runtime card must expose its component specification dialog");
  if (!(await exists("apps/component-gallery/contract-inspector.js"))) failures.push("Shared contract inspector projection is missing");
}
const result = {
  ok: failures.length === 0,
  componentCount: contracts.components.length,
  readyCount: contracts.components.filter((component) => component.status === "ready").length,
  partialCount: contracts.components.filter((component) => component.status === "partial").length,
  frameworks: ["html", "react", "vue"],
  warnings,
  failures
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
