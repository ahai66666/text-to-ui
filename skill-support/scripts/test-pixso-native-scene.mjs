#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectSceneStats, compileOperationPlan, loadComponentMap, loadTokenResources, readJson } from "./pixso-native-scene-lib.mjs";
import { buildCoremailScene, validateCoremailSecondaryListScene } from "./coremail-semantic-adapter.mjs";

const repo = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const fixtureRoot = path.join(repo, "fixtures/mail-workbench-native-scene");
const pageSpec = readJson(path.join(fixtureRoot, "page-spec.json"));
const layoutContract = readJson(path.join(fixtureRoot, "layout-contract.json"));
const pageDataPath = path.join(fixtureRoot, "page-data.json");
const pageData = readJson(pageDataPath);
const visualSnapshot = readJson(path.join(fixtureRoot, "html-visual-snapshot.json"));
const iconAliases = readJson(path.join(repo, "skill-support/assets/icons/icon-aliases.json")).aliases;
const componentMap = loadComponentMap(path.join(repo, "skill-support/assets/design-system/pixso-native-component-map.json"));
const tokens = loadTokenResources();
const scene = buildCoremailScene({ pageSpec, layoutContract, pageData, componentMap, visualSnapshot, tokens, assetBaseDir: path.dirname(pageDataPath) });
const stats = collectSceneStats(scene);
const bareLayoutTokens = [];
const scanLayout = (value, location, key = "") => {
  if (typeof value === "string" && key !== "tokenRef" && key !== "variableRef" && key !== "name" && /^(space|size|radius|layout)\//.test(value)) bareLayoutTokens.push(`${location}:${value}`);
  if (value && typeof value === "object") {
    for (const [nestedKey, nested] of Object.entries(value)) scanLayout(nested, `${location}.${nestedKey}`, nestedKey);
  }
};
const scanNode = (node) => {
  scanLayout(node.layout, node.id);
  for (const child of node.children ?? []) scanNode(child);
};
for (const root of scene.nodes ?? []) scanNode(root);
assert.equal(bareLayoutTokens.length, 0, `layout tokens must be variable references: ${bareLayoutTokens.slice(0, 3).join(", ")}`);
const findNode = (node, id) => node.id === id ? node : (node.children ?? []).map((child) => findNode(child, id)).find(Boolean);
const sceneRoot = scene.nodes[0];
assert.deepEqual(sceneRoot.children.map((node) => node.id), ["mail-shell"], "HTML desktop-stage must contain one mail-shell child");
assert.equal(sceneRoot.layout.padding?.top?.name, "space/6", "desktop-stage must preserve the 24px outer inset");
assert.equal(sceneRoot.layout.padding?.right?.name, "space/6", "desktop-stage must preserve the 24px outer inset");
assert.equal(sceneRoot.style.fill?.kind, "linear-gradient", "desktop-stage must preserve the HTML gradient canvas");
assert.equal(findNode(sceneRoot, "mail-shell")?.style?.stroke?.name, "neutral-dark/10", "mail-shell must own the outer border");
assert.equal(findNode(sceneRoot, "mail-shell")?.style?.radius?.name, "radius/16", "mail-shell must own the window radius");
assert.equal(findNode(sceneRoot, "mail-shell")?.style?.effectStyle, undefined, "mail-shell must remain shadow-free");
for (const segmentId of ["global-primary-title-segment", "global-secondary-title-segment", "global-detail-title-segment"]) {
  assert.equal(findNode(sceneRoot, segmentId)?.layout?.height?.name, "size/64", `${segmentId} must use the 64px Titlebar token`);
}
assert.equal(findNode(sceneRoot, "pane-primary-navigation")?.layout?.width?.name, "layout/width/240");
assert.equal(findNode(sceneRoot, "pane-secondary-list")?.layout?.width?.name, "layout/width/360");
assert.equal(findNode(sceneRoot, "pane-main-detail")?.layout?.width, "fill");
assert.deepEqual(validateCoremailSecondaryListScene(scene), { ok: true, signature: "coremail-secondary-list-v2" });
assert.deepEqual(findNode(sceneRoot, "pane-secondary-list")?.children?.map((node) => node.id), ["secondary-list-shell"]);
assert.deepEqual(findNode(sceneRoot, "secondary-list-shell")?.children?.map((node) => node.id), ["secondary-list-heading", "mail-list-content"]);
assert.equal(findNode(sceneRoot, "secondary-list-shell")?.layout?.padding?.left?.name, "space/5");
assert.equal(findNode(sceneRoot, "secondary-list-shell")?.layout?.padding?.right?.name, "space/5");
assert.equal(findNode(sceneRoot, "secondary-list-heading")?.layout?.height?.name, "size/40");
assert.equal(findNode(sceneRoot, "secondary-list-heading-actions")?.children?.length, 3);
assert.equal(findNode(sceneRoot, "me-folder-0")?.layout?.height?.name, "size/40");
assert.equal(findNode(sceneRoot, "brand-titlebar-content")?.layout?.gap?.name, "space/4", "brand logo and label must use the Titlebar brand gap Token");
assert.equal(findNode(sceneRoot, "me-folder-0")?.layout?.gap?.name, "space/3", "Sidebar Item content must use the canonical icon-label-count gap Token");
assert.equal(findNode(sceneRoot, "me-folder-0-icon")?.layout?.width?.name, "size/20", "sidebar icon slot width must be Token-bound");
assert.equal(findNode(sceneRoot, "me-folder-0-icon")?.layout?.height?.name, "size/20", "sidebar icon slot height must be Token-bound");
assert.equal(findNode(sceneRoot, "me-folder-0")?.style?.fill?.name, "brand/10", "selected navigation item must use the selected-state Token");
assert.equal(findNode(sceneRoot, "me-folder-1")?.style?.fill?.kind, "transparent", "unselected navigation item must be transparent");
assert.equal(findNode(sceneRoot, "app-0")?.layout?.width, "fill");
assert.equal(findNode(sceneRoot, "app-0")?.layout?.gap?.name, "space/1", "primary level navigation icon and label must use the small gap Token");
assert.equal(findNode(sceneRoot, "app-0-label")?.style?.textAlignHorizontal, "CENTER", "primary level navigation labels must preserve centered HTML alignment");
assert.equal(findNode(sceneRoot, "app-1")?.style?.fill?.kind, "transparent", "unselected primary navigation item must be transparent");
assert.deepEqual(findNode(sceneRoot, "global-primary-title-segment")?.style?.strokeEdges, ["right"], "brand segment must own only the right divider");
assert.deepEqual(findNode(sceneRoot, "global-secondary-title-segment")?.style?.strokeEdges, ["right"], "search segment must own only the right divider");
assert.deepEqual(findNode(sceneRoot, "pane-primary-navigation")?.style?.strokeEdges, ["right"], "primary navigation pane must own only the right divider");
assert.deepEqual(findNode(sceneRoot, "pane-secondary-list")?.style?.strokeEdges, ["right"], "secondary list pane must own only the right divider");
assert.deepEqual(findNode(sceneRoot, "global-detail-title-segment")?.style?.strokeEdges, ["bottom"], "detail segment must own the titlebar bottom divider");
assert.equal(findNode(sceneRoot, "pane-primary-navigation")?.style?.fill?.name, "neutral-dark/05", "surface owners must retain their explicit surface Token");
assert.equal(findNode(sceneRoot, "brand-logo")?.type, "image", "brand logo must remain a raster image node");
assert.equal(scene.resources.images?.[0]?.ref, "brand/harmony-mail-logo");
assert.ok(scene.resources.images?.[0]?.dataBase64?.length > 100, "raster image bytes must be embedded in the Scene resource packet");
assert.equal(findNode(sceneRoot, "global-detail-title-segment")?.layout?.distribution, "SPACE_BETWEEN", "detail segment must distribute pane actions and window controls");
assert.equal(findNode(sceneRoot, "detail-titlebar-actions")?.children?.length, pageData.detailActions.length, "all detail actions must be expanded into the HTML action slot");
assert.deepEqual(findNode(sceneRoot, "detail-titlebar-actions")?.children?.map((node) => node.id), visualSnapshot.regions.detailTitlebarActions.order.map((id) => `detail-titlebar-${id}`), "titlebar action order must come from the live HTML DOM snapshot");
assert.equal(findNode(sceneRoot, "detail-titlebar-window-actions")?.children?.length, 3, "window minimize/maximize/close controls must be expanded into the native Titlebar slot");
for (const actionId of ["reply", "reply-all", "forward", "archive", "delete", "unread", "more", "help"]) {
  const action = findNode(sceneRoot, `detail-titlebar-${actionId}`);
  const isIconText = actionId !== "more";
  assert.equal(action?.component?.logicalName, isIconText ? "Icon Text Button/Ghost/Default" : "Icon Button/Ghost/Default", `${actionId} must follow the HTML computed button state`);
  assert.equal(action?.component?.props?.mode, isIconText ? "icon-text" : "icon", `${actionId} must follow the HTML computed mode`);
  assert.equal(action?.metadata?.visualSource, "html-live-computed-style");
}
assert.equal(findNode(sceneRoot, "detail-titlebar-delete")?.metadata?.iconColor, "neutral-dark/90", "delete must follow the normal HTML icon color by default");
const dangerDeleteSnapshot = structuredClone(visualSnapshot);
dangerDeleteSnapshot.regions.detailTitlebarActions.actions.delete.color = "rgba(232, 64, 38, 1)";
const dangerDeleteScene = buildCoremailScene({ pageSpec, layoutContract, pageData, componentMap, visualSnapshot: dangerDeleteSnapshot, tokens, assetBaseDir: path.dirname(pageDataPath) });
assert.equal(findNode(dangerDeleteScene.nodes[0], "detail-titlebar-delete")?.metadata?.iconColor, "function/danger/100", "delete may opt into an explicit danger Token when the HTML supplies it");
assert.equal(findNode(sceneRoot, "quick-action-reply")?.component?.logicalName, "Icon Text Button/Ghost/Default", "message-header quick actions remain text-bearing in the HTML visual state");
assert.deepEqual(scene.page.visualSnapshot?.viewport, visualSnapshot.viewport, "Scene must carry the HTML visual snapshot viewport separately from the canvas viewport");
assert.equal(findNode(sceneRoot, "mail-scope")?.component?.logicalName, "Selection Dropdown/Default", "scope control must remain a separate HTML titlebar segment control");
assert.equal(findNode(sceneRoot, "mail-search")?.component?.logicalName, "Search/White Surface/Default", "search must remain a separate HTML titlebar segment control");
assert.equal((findNode(sceneRoot, "global-title-layer")?.children ?? []).filter((node) => node.type === "component" && node.component?.logicalName === "Titlebar/L/Normal").length, 0, "Pixso must not depend on an opaque whole Titlebar instance");
for (const compositionId of ["mail-0-copy", "mail-0-meta", "detail-sender-row", "meeting-copy", "attachment-0-copy"]) {
  assert.ok(findNode(sceneRoot, compositionId), `${compositionId} must exist as an explicit business composition`);
}
assert.equal(findNode(sceneRoot, "main-detail-shell")?.layout?.padding?.top?.name, "space/5", "main detail shell must own the HTML top inset");
assert.equal(findNode(sceneRoot, "main-detail-shell")?.layout?.padding?.right?.name, "space/6", "main detail shell must own the HTML horizontal inset");
assert.equal(findNode(sceneRoot, "main-detail-shell")?.layout?.padding?.bottom?.name, "size/64", "main detail shell must preserve the titlebar bottom inset");
assert.equal(findNode(sceneRoot, "mail-message")?.layout?.maxWidth, 920, "mail message must preserve the approved HTML max-width structural parameter");
assert.equal(findNode(sceneRoot, "mail-message")?.layout?.counterAlign, "CENTER", "mail message must be centered inside the detail shell");
assert.equal(findNode(sceneRoot, "meeting-card-slot")?.layout?.padding?.top?.name, "space/5", "meeting card margin-top must remain an explicit layout slot");
assert.equal(findNode(sceneRoot, "meeting-card")?.style?.fill?.kind, "linear-gradient", "meeting card must preserve the HTML gradient instead of flattening to a surface token");
assert.deepEqual(findNode(sceneRoot, "meeting-card")?.style?.fill?.stops?.map((stop) => stop.color?.name), ["brand/05", "neutral-light/100"]);
assert.equal(findNode(sceneRoot, "attachment-0")?.style?.fill?.name, "neutral-dark/05", "attachment surface must match HTML surface-muted");
assert.equal(findNode(sceneRoot, "attachment-0")?.layout?.gap?.name, "space/3", "attachment gap must match the component contract");
assert.equal(findNode(sceneRoot, "attachment-0")?.layout?.padding?.top?.name, "space/3", "attachment vertical padding must match HTML");
assert.equal(findNode(sceneRoot, "attachment-0")?.layout?.padding?.left?.name, "space/4", "attachment horizontal padding must match HTML");
assert.deepEqual(findNode(sceneRoot, "attachment-0")?.children?.map((child) => child.id), ["attachment-0-type-badge", "attachment-0-copy", "attachment-0-actions"], "attachment actions must stay inside the component root");
assert.equal(findNode(sceneRoot, "attachment-0-row"), undefined, "attachment must not be wrapped with an external actions row");
assert.equal(findNode(sceneRoot, "attachment-0-type-badge")?.style?.fill?.name, "function/danger/10", "attachment type badge must use danger-subtle");
assert.equal(findNode(sceneRoot, "roadmap-illustration"), undefined, "sections not visible in the HTML default snapshot must not be materialized in Pixso");
assert.equal(findNode(sceneRoot, "ai-assistant"), undefined, "sections not visible in the HTML default snapshot must not be materialized in Pixso");
assert.equal(findNode(sceneRoot, "quoted-mail"), undefined, "sections not visible in the HTML default snapshot must not be materialized in Pixso");
const sceneIcons = new Set();
const collectIcons = (node) => {
  if (node.icon?.alias) sceneIcons.add(node.icon.alias);
  for (const child of node.children ?? []) collectIcons(child);
};
for (const root of scene.nodes ?? []) collectIcons(root);
assert.deepEqual([...sceneIcons].filter((alias) => !iconAliases[alias]), [], "all Scene icons must resolve through icon-aliases.json");
assert.equal(scene.page.stateScope, "default-visible");
assert.equal(pageData.mailList.items.length, 11);
assert.ok(stats.mappedInstances > 0);
assert.ok(stats.nativeFallbacks > 0);
assert.ok(stats.texts > 50);
assert.ok(stats.icons > 10);
const plan = compileOperationPlan(scene, { componentMap, tokens });
assert.equal(plan.kind, "pixso-operation-plan");
assert.equal(plan.execution.resolveGuidsAtRuntime, true);
assert.equal(plan.execution.targetPage, "mail-workbench-fixture");
assert.equal(plan.execution.preserveExistingFrames, true);
assert.equal(plan.execution.minimumRuntimeVersion, "5.0.0");
assert.equal(plan.execution.agentContract.protocolVersion, 4);
assert.equal(plan.execution.agentContract.executorProtocol, 1);
assert.deepEqual(plan.execution.agentContract.requiredCapabilities, ["executor.data-plan.v1", "executor.transaction.v1", "executor.assets.deferred.v1", "executor.readback.v1"]);
assert.equal(plan.execution.outputPolicy, "single-managed-artboard");
assert.equal(plan.execution.preserveFailedDraft, false);
assert.equal(plan.execution.cleanupPolicy, "single-canonical-output-after-readback");
assert.ok(plan.operations.some((operation) => operation.op === "create-instance"));
assert.equal(plan.operations.find((operation) => operation.nodeId === "app-0-label")?.style?.textAlignHorizontal, "CENTER", "operation plan must preserve text alignment for the Pixso runtime");
const searchOperation = plan.operations.find((operation) => operation.nodeId === "mail-search");
const searchMapping = componentMap.map.get("Search/White Surface/Default");
assert.deepEqual(searchOperation?.componentRef, {
  logicalName: "Search/White Surface/Default",
  pixsoName: searchMapping.pixsoName,
  componentSetName: searchMapping.componentSetName,
  variant: searchMapping.variant,
  iconColorSource: "variant-content",
}, "mail search must reuse the existing Search component variant");
const composeOperation = plan.operations.find((operation) => operation.nodeId === "compose-button");
assert.equal(composeOperation?.componentRef?.pixsoName, "icon-text", "Primary icon-text button must use the current Pixso component-set name");
assert.equal(composeOperation?.componentRef?.variant?.type, componentMap.map.get("Icon Text Button/Primary/Default")?.variant?.type, "Primary icon-text button must use the current Pixso variant value");
assert.equal(composeOperation?.props?.variant, componentMap.map.get("Icon Text Button/Primary/Default")?.variant?.type, "Primary icon-text props must carry the exact live variant value");
assert.equal(composeOperation?.componentRef?.contentColor, undefined, "Primary icon-text content must remain owned by its Pixso Variant");
assert.equal(composeOperation?.componentRef?.iconColorSource, "variant-content", "Primary icon replacement must inherit the selected Pixso Variant color");
assert.equal(plan.operations.some((operation) => operation.componentRef?.logicalName === "Search/White Surface/Advanced"), false, "page plans must not create a Search Advanced component");
assert.equal(plan.operations.some((operation) => /^mail-\d+-checkbox$/.test(operation.nodeId ?? "")), false, "default-visible Pixso snapshots must omit hover/row-selection checkboxes");
assert.equal(plan.operations.some((operation) => operation.nodeId === "select-all"), false, "legacy list-toolbar select-all must not be regenerated");
for (const actionId of ["refresh-mail", "multi-select-mail", "filter-sort"]) {
  assert.equal(plan.operations.find((operation) => operation.nodeId === actionId)?.props?.mode, "icon", `${actionId} must remain icon-only`);
}
assert.deepEqual(plan.operations.find((operation) => operation.nodeId === "refresh-mail")?.slots, { icon: "action/refresh" }, "icon-only buttons must not declare a visible label slot");
assert.ok(plan.operations.filter((operation) => operation.op === "create-instance").every((operation) => operation.componentRef.componentSetName));
assert.ok(plan.operations.some((operation) => operation.source === "native-composition"));
assert.ok(plan.operations.some((operation) => operation.op === "ensure-variable"));
assert.ok(plan.operations.some((operation) => operation.op === "ensure-image" && operation.imageRef?.ref === "brand/harmony-mail-logo"));
assert.ok(plan.operations.some((operation) => operation.op === "create-image" && operation.nodeId === "brand-logo"));
assert.ok(plan.operations.some((operation) => operation.nodeId === "detail-titlebar-reply" && operation.op === "create-instance"));
assert.ok(plan.operations.some((operation) => operation.nodeId === "window-close" && operation.op === "create-instance"));
assert.equal(plan.execution.pipeline, "layout-then-icon-hydration-then-image-optimization");
assert.deepEqual(plan.phases.map((phase) => phase.id), ["resources", "layout", "icon-hydration", "image-optimization"]);
assert.deepEqual(plan.modules.map((module) => module.id), ["shell", "primary-navigation", "secondary-list", "main-detail", "icon-hydration", "image-optimization"]);
const moduleOperationIndexes = plan.modules.flatMap((module) => module.operationIndexes);
assert.deepEqual([...moduleOperationIndexes].sort((a, b) => a - b), plan.operations.map((_, index) => index), "every operation must belong to exactly one import module");
const moduleById = new Map(plan.modules.map((module) => [module.id, module]));
assert.ok(moduleById.get("shell")?.operationIds.includes("global-title-layer"), "Titlebar shell must be imported as its own module");
assert.ok(moduleById.get("primary-navigation")?.operationIds.includes("me-folder-0"), "primary navigation must be isolated from the mail list");
assert.ok(moduleById.get("secondary-list")?.operationIds.includes("mail-list-content"), "secondary list must be isolated from the detail pane");
assert.ok(moduleById.get("main-detail")?.operationIds.includes("meeting-card"), "detail content must be isolated from the navigation panes");
assert.ok(moduleById.get("icon-hydration")?.operationIds.length === 0, "icon hydration is operation-index based because hydrate-icon has no nodeId");
assert.ok(moduleById.get("image-optimization")?.operationIds.includes("brand-logo"), "images must be deferred until the final optimization module");
const iconSlots = plan.operations.filter((operation) => operation.op === "create-icon-slot");
const iconHydration = plan.operations.filter((operation) => operation.op === "hydrate-icon");
assert.ok(iconSlots.length > 10);
assert.equal(iconHydration.length, iconSlots.length);
assert.ok(iconHydration.every((operation) => operation.targetNodeId && operation.iconRef?.alias && !operation.iconRef?.svg));
assert.ok(iconSlots.every((operation) => operation.iconSlot?.hotZone?.alignment === "CENTER" && operation.iconSlot?.hotZone?.axes === "BOTH"), "every native icon slot must declare two-axis centring");
assert.ok(iconHydration.every((operation) => operation.iconRef?.hotZone?.alignment === "CENTER" && operation.iconRef?.hotZone?.axes === "BOTH"), "every native icon hydration must retain two-axis centring");
assert.ok(plan.resources.icons.every((icon) => typeof icon.svg === "string" && icon.svg.includes("<svg")));
assert.equal(plan.summary.iconSlotCount, iconSlots.length);
assert.equal(plan.summary.hydratedIconCount, iconSlots.length);
assert.deepEqual(plan.operations.filter((operation) => operation.op === "create-frame" && (operation.layout?.width === "fixed" || operation.layout?.height === "fixed")), [], "native Frames cannot use fixed sizing without an explicit Token value");
const serialized = JSON.stringify(plan);
assert.equal(/variantGuid|documentGuid|nodeGuid|componentGuid|documentId/i.test(serialized), false);
const operationIds = new Set(plan.operations.map((operation) => operation.nodeId).filter(Boolean));
for (const operation of plan.operations.filter((item) => item.parentId)) assert.ok(operationIds.has(operation.parentId), `missing parent ${operation.parentId}`);
console.log(`Pixso native Scene tests passed: ${stats.mappedInstances} mapped instances, ${stats.nativeFallbacks} native fallbacks, ${plan.operations.length} operations.`);
