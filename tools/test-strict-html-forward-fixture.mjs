import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { renderHtmlComponent } from "../packages/components-html/src/index.js";

const repo = process.cwd();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tui-forward-list-detail-"));
const run = (script, args) => spawnSync(process.execPath, [path.join(repo, script), ...args], { cwd: repo, encoding: "utf8" });
const contextPath = path.join(temp, "context.json");
const layoutPath = path.join(temp, "layout-contract.json");
let result = run("skill-support/scripts/resolve-context.mjs", ["--task", "tasks", "--framework", "html", "--mode", "fast-preview", "--confirmed", "--out", contextPath]);
assert.equal(result.status, 0, result.stderr);
result = run("skill-support/scripts/generate-layout-contract.mjs", ["--context", contextPath, "--out", layoutPath]);
assert.equal(result.status, 0, result.stderr);
const skeletonPath = path.join(repo, "fixtures/html-strict-list-detail/src/component-skeleton.generated.js");
const manifestPath = path.join(temp, "component-usage.json");
result = run("skill-support/scripts/generate-html-component-skeleton.mjs", ["--context", contextPath, "--layout-contract", layoutPath, "--bindings", "fixtures/html-strict-list-detail/component-bindings.json", "--out", skeletonPath, "--manifest", manifestPath]);
assert.equal(result.status, 0, result.stderr);
let manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.sourceRoots = ["fixtures/html-strict-list-detail/src"];
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
result = run("skill-support/scripts/validate-web-component-reuse.mjs", ["--manifest", manifestPath, "--project-root", repo]);
assert.equal(result.status, 0, result.stderr);
const frameworkPagePath = path.join(temp, "generated-page.mjs");
const frameworkEntryPath = path.join(temp, "generated-page-entry.mjs");
const frameworkManifestPath = path.join(temp, "framework-page-manifest.json");
const frameworkBindingsPath = path.join(temp, "framework-bindings.json");
const blueprintPath = path.join(temp, "page-blueprint.json");
const contentRecipesPath = path.join(temp, "page-content-recipes.json");
const frameworkBindings = JSON.parse(fs.readFileSync(path.join(repo, "fixtures/html-strict-list-detail/component-bindings.json"), "utf8"));
const normalizedRegions = { navigation: "primary-navigation", list: "secondary-list", detail: "main-detail" };
frameworkBindings.componentBindings = frameworkBindings.componentBindings.map((binding) => ({ ...binding, region: normalizedRegions[binding.region] ?? binding.region }));
frameworkBindings.componentBindings.unshift({
  id: "primary-titlebar",
  logicalName: "Titlebar/Default",
  semanticContext: "global-titlebar",
  options: { layout: "three-column", paneRole: "primary-navigation", showWindowControls: false },
  slots: { label: "任务" },
  usage: "一级导航标题",
  region: "primary-navigation",
  slot: "global-title-layer",
  expectedRuntimeCount: 1
});
frameworkBindings.composition.regions["primary-navigation"].unshift({ kind: "component", bindingId: "primary-titlebar" });
frameworkBindings.stylePlan.compositions = frameworkBindings.stylePlan.compositions.map((entry) => ({ ...entry, region: normalizedRegions[entry.region] ?? entry.region }));
frameworkBindings.behaviorPlan.interactions = frameworkBindings.behaviorPlan.interactions.map((interaction) => ({ ...interaction, outcome: `完成 ${interaction.id}` }));
fs.writeFileSync(blueprintPath, JSON.stringify({ schemaVersion: 1, id: "task-list-detail", task: "任务管理", user: "任务处理人员", primaryJob: "查看并完成任务", designRationale: "分类列表驱动详情", pattern: { id: "pattern-b-three-pane" }, regions: [{ id: "primary-navigation", purpose: "任务分类" }, { id: "secondary-list", purpose: "任务列表" }, { id: "main-detail", purpose: "任务详情" }], contentGroups: [{ id: "navigation-content", region: "primary-navigation", purpose: "导航" }, { id: "task-list", region: "secondary-list", purpose: "任务列表", dataEntities: ["task"] }, { id: "task-detail", region: "main-detail", purpose: "任务详情", dataEntities: ["task"] }], dataEntities: [{ id: "task" }], interactions: [{ id: "select-task-category", sourceGroup: "navigation-content", targetGroup: "task-list", taskOutcome: "切换任务分类" }, { id: "filter-tasks", sourceGroup: "task-list", targetGroup: "task-list", taskOutcome: "筛选任务" }, { id: "open-add-task", sourceGroup: "navigation-content", targetGroup: "task-detail", taskOutcome: "打开新增任务" }, { id: "toggle-task-complete", sourceGroup: "task-detail", targetGroup: "task-detail", taskOutcome: "更新完成状态" }], states: [{ id: "selected" }, { id: "empty" }], successCriteria: ["可以查看和完成任务"], recoveryPaths: ["无结果时恢复全部任务"] }, null, 2));
const fixtureBlueprint = JSON.parse(fs.readFileSync(blueprintPath, "utf8"));
fixtureBlueprint.workObject = "task";
fixtureBlueprint.contentGroups = fixtureBlueprint.contentGroups.map((group, index) => ({ ...group, order: index, priority: group.id === "navigation-content" ? "supporting" : "primary" }));
fixtureBlueprint.dataEntities = [{ id: "task", fields: ["title", "assignee", "status"] }];
fixtureBlueprint.interactions = fixtureBlueprint.interactions.map((interaction) => ({ ...interaction, trigger: interaction.id, stateChange: interaction.taskOutcome, preserves: ["Pattern shell"] }));
fixtureBlueprint.states = [{ id: "selected", kind: "selection", appliesTo: ["task-list", "task-detail"] }, { id: "empty", kind: "empty", appliesTo: ["task-list"] }];
fixtureBlueprint.design = { readingOrder: ["primary-navigation", "secondary-list", "main-detail"], informationPriority: ["task-list", "task-detail"], regionResponsibilities: [{ region: "primary-navigation", responsibility: "任务分类" }, { region: "secondary-list", responsibility: "任务筛选和选择" }, { region: "main-detail", responsibility: "任务处理" }], contentDensity: { "primary-navigation": "compact", "secondary-list": "comfortable", "main-detail": "comfortable" }, primaryActionIds: ["open-add-task"], secondaryActionIds: ["select-task-category", "filter-tasks", "toggle-task-complete"], relationships: [{ from: "task-list", to: "task-detail", kind: "selection" }], stateMatrix: [{ stateId: "selected", appliesTo: ["task-list", "task-detail"], entryCondition: "选择任务", recovery: "恢复默认任务" }, { stateId: "empty", appliesTo: ["task-list"], entryCondition: "筛选无结果", recovery: "清除筛选" }] };
fs.writeFileSync(blueprintPath, JSON.stringify(fixtureBlueprint, null, 2));
fs.writeFileSync(contentRecipesPath, JSON.stringify({ schemaVersion: 1, blueprintRef: { id: "task-list-detail" }, recipes: [
  { id: "navigation-recipe", contentGroupId: "navigation-content", region: "primary-navigation", compositionId: "navigation-stack", kind: "registered-composition", bindingIds: ["primary-titlebar", "task-navigation", "add-task"] },
  { id: "task-list-recipe", contentGroupId: "task-list", region: "secondary-list", compositionId: "task-list", kind: "registered-composition", entityId: "task", bindingIds: ["task-search", "task-rows"] },
  { id: "task-detail-recipe", contentGroupId: "task-detail", region: "main-detail", compositionId: "task-detail", kind: "registered-composition", entityId: "task", bindingIds: ["detail-titlebar", "task-checkbox"] }
] }, null, 2));
fs.writeFileSync(frameworkBindingsPath, JSON.stringify(frameworkBindings, null, 2));
result = run("skill-support/scripts/generate-framework-page.mjs", ["--context", contextPath, "--layout-contract", layoutPath, "--blueprint", blueprintPath, "--content-recipes", contentRecipesPath, "--page-css", "fixtures/html-strict-list-detail/src/page.css", "--bindings", frameworkBindingsPath, "--out", frameworkPagePath, "--entry-out", frameworkEntryPath, "--manifest", frameworkManifestPath, "--component-usage", manifestPath]);
assert.equal(result.status, 0, result.stderr);
manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.sourceRoots = ["fixtures/html-strict-list-detail/src"];
const manifestContents = `${JSON.stringify(manifest, null, 2)}\n`;
fs.writeFileSync(manifestPath, manifestContents);
const frameworkManifest = JSON.parse(fs.readFileSync(frameworkManifestPath, "utf8"));
frameworkManifest.componentUsage.sha256 = crypto.createHash("sha256").update(manifestContents).digest("hex");
fs.writeFileSync(frameworkManifestPath, `${JSON.stringify(frameworkManifest, null, 2)}\n`);
result = run("skill-support/scripts/stamp-framework-artifact.mjs", ["--manifest", frameworkManifestPath, "--artifact", "fixtures/html-strict-list-detail/index.html", "--required-stylesheet", "fixtures/html-strict-list-detail/src/page.css"]);
assert.equal(result.status, 0, result.stderr);
result = run("skill-support/scripts/validate-web-component-reuse.mjs", ["--manifest", manifestPath, "--project-root", repo]);
assert.equal(result.status, 0, result.stderr);
result = run("skill-support/scripts/validate-page-token-usage.mjs", ["--project-root", repo, "--source", "fixtures/html-strict-list-detail/src/page.css", "--layout-contract", "fixtures/html-strict-list-detail/layout-contract.json"]);
assert.equal(result.status, 0, result.stderr);
const rendererOptions = {
  "Titlebar/Default": { paneTitle: "任务详情", layout: "three-column", paneRole: "final-pane", mainDetailActions: [{ id: "save", label: "保存", icon: "action/save", buttonType: "icon" }], size: "medium" },
  "Sidebar Item/Default": { items: [{ label: "我的任务", selected: true }] },
  "Search/White Surface/Default": { placeholder: "搜索任务" },
  "List Item/White Surface/Default": { title: "任务", description: "今天" },
  "Button/Primary/Default": { label: "新增任务", variant: "primary" },
  "Checkbox/Default": { label: "标记为完成", description: "同步到任务记录", checked: false }
};
const evidence = { schemaVersion: 1, url: "fixture://html-strict-list-detail", pattern: manifest.layout.pattern, structureDigest: manifest.layout.structureDigest, stylesheets: [{ href: "./src/page.css", loaded: true, ruleCount: 5 }], patternLayout: { display: "grid", regions: [
  { region: "primary-navigation", display: "block", bounds: { x: 0, y: 0, width: 240, height: 720 }, padding: { paddingBlockStart: "8px" }, scrollBody: { padding: { paddingInlineStart: "0px", paddingInlineEnd: "0px", paddingBlockStart: "0px", paddingBlockEnd: "0px" }, overflowY: "auto" }, slots: [{ id: "secondary-navigation-content", padding: { paddingInlineStart: "16px", paddingInlineEnd: "16px" } }, { id: "global-primary-action", padding: { paddingInlineStart: "16px", paddingInlineEnd: "16px" } }] },
  { region: "secondary-list", display: "block", bounds: { x: 240, y: 0, width: 360, height: 720 }, title: { bounds: { x: 240, y: 0, width: 360, height: 64 }, padding: { paddingInlineStart: "16px", paddingInlineEnd: "16px", paddingBlockStart: "0px", paddingBlockEnd: "0px" } }, scrollBody: { padding: { paddingInlineStart: "16px", paddingInlineEnd: "16px", paddingBlockStart: "8px", paddingBlockEnd: "0px" }, overflowY: "auto" } },
  { region: "main-detail", display: "block", bounds: { x: 600, y: 0, width: 600, height: 720 }, title: { bounds: { x: 600, y: 0, width: 600, height: 64 }, padding: { paddingInlineStart: "16px", paddingInlineEnd: "16px", paddingBlockStart: "0px", paddingBlockEnd: "0px" } }, scrollBody: { padding: { paddingInlineStart: "24px", paddingInlineEnd: "24px", paddingBlockStart: "16px", paddingBlockEnd: "0px" }, overflowY: "auto" } }
] }, customRegions: [], contractRegions: [], unclassifiedInteractive: [], components: [] };
for (const usage of manifest.registered) {
  const markup = renderHtmlComponent(usage.rendererKey, rendererOptions[usage.logicalName] ?? {});
  const count = usage.expectedRuntimeCount ?? 1;
  for (let index = 0; index < count; index += 1) evidence.components.push({
    rendererKey: markup.match(/data-renderer-key="([^"]+)"/)?.[1],
    logicalName: markup.match(/data-logical-component="([^"]+)"/)?.[1],
    variant: markup.match(/data-variant="([^"]+)"/)?.[1],
    state: markup.match(/data-state="([^"]+)"/)?.[1],
    region: usage.regions?.[0] ?? null,
    slots: [...markup.matchAll(/data-slot="([^"]+)"/g)].map((match) => match[1]),
    visible: true
  });
}
const evidencePath = path.join(temp, "runtime-evidence.json");
fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
const pageSpecPath = path.join(temp, "page-spec.json");
const pageSpec = JSON.parse(fs.readFileSync(path.join(repo, "fixtures/html-strict-list-detail/page-spec.json"), "utf8"));
pageSpec.layoutContractPath = path.basename(layoutPath);
fs.writeFileSync(pageSpecPath, JSON.stringify(pageSpec, null, 2));
result = run("skill-support/scripts/verify-fast-preview.mjs", ["--context", contextPath, "--layout-contract", layoutPath, "--page-spec", pageSpecPath, "--component-usage", manifestPath, "--framework-manifest", frameworkManifestPath, "--artifact", "fixtures/html-strict-list-detail/index.html", "--runtime-evidence", evidencePath, "--project-root", repo]);
assert.equal(result.status, 0, result.stderr);
result = run("skill-support/scripts/validate-runtime-component-reuse.mjs", ["--manifest", manifestPath, "--evidence", evidencePath]);
assert.equal(result.status, 0, result.stderr);
const wrongInsetEvidencePath = path.join(temp, "runtime-evidence-wrong-inset.json");
const wrongInsetEvidence = structuredClone(evidence);
wrongInsetEvidence.patternLayout.regions[0].slots[0].padding.paddingInlineStart = "24px";
fs.writeFileSync(wrongInsetEvidencePath, JSON.stringify(wrongInsetEvidence));
result = run("skill-support/scripts/validate-runtime-component-reuse.mjs", ["--manifest", manifestPath, "--evidence", wrongInsetEvidencePath]);
assert.notEqual(result.status, 0, "Pattern B Sidebar inset drift must fail runtime verification");
assert.match(result.stderr, /Sidebar slot must own one 16px horizontal inset/);
const handwrittenEvidencePath = path.join(temp, "runtime-evidence-handwritten.json");
fs.writeFileSync(handwrittenEvidencePath, JSON.stringify({ ...evidence, unclassifiedInteractive: [{ tag: "button", role: null, label: "手写按钮" }] }, null, 2));
result = run("skill-support/scripts/verify-fast-preview.mjs", ["--context", contextPath, "--layout-contract", layoutPath, "--page-spec", pageSpecPath, "--component-usage", manifestPath, "--framework-manifest", frameworkManifestPath, "--artifact", "fixtures/html-strict-list-detail/index.html", "--runtime-evidence", handwrittenEvidencePath, "--project-root", repo]);
assert.notEqual(result.status, 0, "an unclassified handwritten control in the final artifact must fail");
const pageCssPath = path.join(repo, "fixtures/html-strict-list-detail/src/page.css");
const originalPageCss = fs.readFileSync(pageCssPath, "utf8");
fs.writeFileSync(pageCssPath, `${originalPageCss}\n/* unexpected post-stamp style edit */\n`);
result = run("skill-support/scripts/verify-fast-preview.mjs", ["--context", contextPath, "--layout-contract", layoutPath, "--page-spec", pageSpecPath, "--component-usage", manifestPath, "--framework-manifest", frameworkManifestPath, "--artifact", "fixtures/html-strict-list-detail/index.html", "--runtime-evidence", evidencePath, "--project-root", repo]);
assert.notEqual(result.status, 0, "a modified linked stylesheet must invalidate the delivery stamp");
fs.writeFileSync(pageCssPath, originalPageCss);
fs.appendFileSync(frameworkPagePath, "\n// unexpected post-generation edit\n");
result = run("skill-support/scripts/verify-fast-preview.mjs", ["--context", contextPath, "--layout-contract", layoutPath, "--page-spec", pageSpecPath, "--component-usage", manifestPath, "--framework-manifest", frameworkManifestPath, "--artifact", "fixtures/html-strict-list-detail/index.html", "--runtime-evidence", evidencePath, "--project-root", repo]);
assert.notEqual(result.status, 0, "a modified generated source must fail provenance verification");
fs.rmSync(skeletonPath, { force: true });
fs.rmSync(temp, { recursive: true, force: true });
console.log("Strict HTML non-mail list-detail forward fixture passed.");
