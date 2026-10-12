#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync, spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tui-framework-page-"));
const node = process.execPath;
const run = (script, args) => spawnSync(node, [path.join(root, "skill-support/scripts", script), ...args], { cwd: root, encoding: "utf8" });
const contexts = {};
for (const framework of ["html", "react", "vue"]) {
  const output = path.join(temp, `${framework}-context.json`);
  const result = run("resolve-context.mjs", ["--task", "tasks", "--framework", framework, "--mode", "fast-preview", "--confirmed", "--out", output]);
  assert.equal(result.status, 0, result.stderr);
  contexts[framework] = JSON.parse(fs.readFileSync(output, "utf8"));
  assert.equal(contexts[framework].renderer.framework, framework);
}
assert.equal(new Set(Object.values(contexts).map((context) => context.patternContract.patternDigest)).size, 1, "all framework Context Packets must share one Pattern digest");

const layout = path.join(temp, "layout-contract.json");
let result = run("generate-layout-contract.mjs", ["--context", path.join(temp, "html-context.json"), "--out", layout]);
assert.equal(result.status, 0, result.stderr);
const blueprint = path.join(temp, "page-blueprint.json");
const testBlueprint = { schemaVersion: 1, id: "task-workbench", task: "任务工作台", user: "工作人员", workObject: "task", primaryJob: "处理任务", designRationale: "列表驱动详情并保持稳定导航", pattern: { id: "pattern-b-three-pane" }, regions: [{ id: "primary-navigation", purpose: "应用和导航" }, { id: "secondary-list", purpose: "任务列表" }, { id: "main-detail", purpose: "任务详情" }], contentGroups: [{ id: "navigation-content", region: "primary-navigation", purpose: "导航内容", order: 0, priority: "supporting" }, { id: "task-list", region: "secondary-list", purpose: "任务列表", order: 1, priority: "primary", dataEntities: ["task"] }, { id: "task-detail", region: "main-detail", purpose: "任务详情", order: 2, priority: "primary", dataEntities: ["task"] }], dataEntities: [{ id: "task", fields: ["title", "assignee", "status"] }], interactions: [{ id: "compose", sourceGroup: "navigation-content", targetGroup: "task-detail", trigger: "activate create", stateChange: "open task panel", preserves: ["Pattern shell"], taskOutcome: "打开任务面板" }, { id: "select-route", sourceGroup: "navigation-content", targetGroup: "task-list", trigger: "select route", stateChange: "replace task collection", preserves: ["Pattern shell"], taskOutcome: "切换任务分组" }, { id: "select-app", sourceGroup: "navigation-content", targetGroup: "task-list", trigger: "select app", stateChange: "replace task collection", preserves: ["Pattern shell"], taskOutcome: "切换应用" }, { id: "filter-list", sourceGroup: "task-list", targetGroup: "task-list", trigger: "type query", stateChange: "filter task collection", preserves: ["Pattern shell"], taskOutcome: "筛选任务" }, { id: "more-actions", sourceGroup: "task-detail", targetGroup: "task-detail", trigger: "activate more", stateChange: "open actions", preserves: ["Pattern shell"], taskOutcome: "打开操作菜单" }], states: [{ id: "selected", kind: "selection", appliesTo: ["task-list", "task-detail"] }, { id: "empty", kind: "empty", appliesTo: ["task-list"] }], successCriteria: ["能够选择并处理任务"], recoveryPaths: ["无结果时可恢复查看全部"], design: { readingOrder: ["primary-navigation", "secondary-list", "main-detail"], informationPriority: ["task-list", "task-detail"], regionResponsibilities: [{ region: "primary-navigation", responsibility: "应用和导航" }, { region: "secondary-list", responsibility: "任务筛选和选择" }, { region: "main-detail", responsibility: "任务处理" }], contentDensity: { "primary-navigation": "compact", "secondary-list": "comfortable", "main-detail": "comfortable" }, primaryActionIds: ["compose"], secondaryActionIds: ["select-route", "select-app", "filter-list", "more-actions"], relationships: [{ from: "task-list", to: "task-detail", kind: "selection" }], stateMatrix: [{ stateId: "selected", appliesTo: ["task-list", "task-detail"], entryCondition: "选择任务", recovery: "恢复默认任务" }, { stateId: "empty", appliesTo: ["task-list"], entryCondition: "筛选无结果", recovery: "清除筛选" }] } };
testBlueprint.design = { readingOrder: ["primary-navigation", "secondary-list", "main-detail"], informationPriority: ["task-list", "task-detail"], regionResponsibilities: [{ region: "primary-navigation", responsibility: "应用和导航" }, { region: "secondary-list", responsibility: "任务筛选和选择" }, { region: "main-detail", responsibility: "任务处理" }], contentDensity: { "primary-navigation": "compact", "secondary-list": "comfortable", "main-detail": "comfortable" }, primaryActionIds: ["compose"], secondaryActionIds: ["select-route", "select-app", "filter-list", "more-actions"], relationships: [{ from: "task-list", to: "task-detail", kind: "selection" }], stateMatrix: [{ stateId: "selected", appliesTo: ["task-list", "task-detail"], entryCondition: "选择任务", recovery: "恢复默认任务" }, { stateId: "empty", appliesTo: ["task-list"], entryCondition: "筛选无结果", recovery: "清除筛选" }] };
fs.writeFileSync(blueprint, JSON.stringify(testBlueprint, null, 2));
const bindings = path.join(temp, "bindings.json");
const contentRecipes = path.join(temp, "page-content-recipes.json");
const pageCss = path.join(temp, "page.css");
fs.writeFileSync(pageCss, ".task-list { display: grid; gap: var(--gap-button-group); color: var(--color-text); }\n");
fs.writeFileSync(contentRecipes, JSON.stringify({ schemaVersion: 1, blueprintRef: { id: "task-workbench" }, recipes: [
  { id: "navigation-recipe", contentGroupId: "navigation-content", region: "primary-navigation", compositionId: "nav-stack", kind: "registered-composition", bindingIds: ["title", "compose", "navigation", "primary-nav"] },
  { id: "task-row-recipe", contentGroupId: "task-list", region: "secondary-list", compositionId: "search-area", kind: "page-composite", entityId: "task", bindingIds: ["search"], fields: ["title", "assignee", "status"], states: ["default", "selected"], missingCapability: "task work-item row with assignee and status", registryQueries: ["repeated-list-row"], reviewedCandidates: [{ logicalName: "List Item/White Surface/Default", rejectionReason: "does not expose task assignee and status fields" }], tokenRoles: ["spacing.component-gap", "color.surface"], disposition: "page-owned" },
  { id: "detail-recipe", contentGroupId: "task-detail", region: "main-detail", compositionId: "detail-actions", kind: "registered-composition", bindingIds: ["detail-titlebar"] }
] }, null, 2));
fs.writeFileSync(bindings, `${JSON.stringify({ componentBindings: [
  { id: "title", logicalName: "Titlebar/Default", semanticContext: "global-titlebar", options: { layout: "three-column", segmentRole: "primary-navigation" }, slots: { label: "任务" }, region: "primary-navigation", slot: "global-title-layer" },
  { id: "compose", logicalName: "Button/Primary/Default", semanticContext: "page-primary-action", behaviorId: "compose", options: { label: "新增", variant: "primary", size: "standard", mode: "text" }, region: "primary-navigation", slot: "global-primary-action" },
  { id: "navigation", logicalName: "Sidebar Item/Default", semanticContext: "secondary-navigation", behaviorId: "select-route", options: { items: [{ label: "任务", icon: "navigation/grid", selected: true }] }, region: "primary-navigation", slot: "secondary-navigation-content" },
  { id: "primary-nav", logicalName: "Primary Navigation Item/Level 1", semanticContext: "primary-navigation-shell", behaviorId: "select-app", options: { label: "任务", ariaLabel: "任务", icon: "navigation/mail-unread", selected: true }, region: "primary-navigation", slot: "primary-navigation-bottom" },
  { id: "search", logicalName: "Search/White Surface/Default", semanticContext: "secondary-list-search", behaviorId: "filter-list", options: { surface: "white" }, region: "secondary-list", slot: "secondary-list-title" },
  { id: "detail-titlebar", logicalName: "Titlebar/Default", semanticContext: "main-detail-titlebar", options: { layout: "three-column", segmentRole: "main-detail" }, slots: { "main-detail-actions": [{ id: "more", label: "更多", icon: "action/more", buttonType: "icon" }] }, actionBehaviors: { more: "more-actions" }, region: "main-detail", slot: "main-detail-title" }
], patternMode: { navigation: "two-level" }, patternShell: { navigation: { mode: "two-level", slots: {
  "global-title-layer": [{ kind: "component", bindingId: "title" }],
  "global-primary-action": [{ kind: "component", bindingId: "compose" }],
  "secondary-navigation-content": [{ kind: "group", id: "nav-stack", tag: "nav", children: [{ kind: "component", bindingId: "navigation" }] }],
  "primary-navigation-bottom": [{ kind: "component", bindingId: "primary-nav" }]
} } }, stylePlan: { schemaVersion: 1, compositions: [
  { id: "nav-stack", region: "primary-navigation", tokenRoles: ["spacing.component-gap"], componentBoundary: "preserve" },
  { id: "search-area", region: "secondary-list", tokenRoles: ["spacing.component-gap"], componentBoundary: "preserve" },
  { id: "detail-actions", region: "main-detail", tokenRoles: ["spacing.component-gap"], componentBoundary: "preserve" }
] }, behaviorPlan: { schemaVersion: 1, interactions: [
  { id: "compose", kind: "open-overlay", triggerBindingIds: ["compose"], outcome: "打开新建面板" },
  { id: "select-route", kind: "set-selected", triggerBindingIds: ["navigation"], outcome: "切换二级导航" },
  { id: "select-app", kind: "set-selected", triggerBindingIds: ["primary-nav"], outcome: "切换一级应用" },
  { id: "filter-list", kind: "filter-collection", triggerBindingIds: ["search"], outcome: "更新列表结果" },
  { id: "more-actions", kind: "component-native", triggerBindingIds: ["detail-titlebar"], outcome: "打开操作菜单" }
] }, composition: { regions: {
  "secondary-list": [{ kind: "group", id: "search-area", tag: "section", children: [{ kind: "text", id: "heading", tag: "h1", text: "任务" }, { kind: "component", bindingId: "search" }] }],
  "main-detail": [{ kind: "group", id: "detail-actions", tag: "section", children: [{ kind: "component", bindingId: "detail-titlebar" }] }]
} } }, null, 2)}\n`);

const iconFallbackFixture = JSON.parse(fs.readFileSync(bindings, "utf8"));
iconFallbackFixture.componentBindings.find((binding) => binding.id === "detail-titlebar").slots["main-detail-actions"][0].icon = "mail/does-not-exist";
const invalidIconBindings = path.join(temp, "invalid-icon-bindings.json");
fs.writeFileSync(invalidIconBindings, JSON.stringify(iconFallbackFixture));

const manifests = [];
fs.writeFileSync(path.join(temp, 'business-list.js'), `export function mount(host, { renderComponent }) {
  const rows = ['路线评审', '设计更新'];
  host.innerHTML = '<h2>收件箱</h2>' + rows.map((label, index) => '<div data-row="' + index + '" tabindex="0" role="button">' + label + '</div>').join('') + renderComponent('button', { label: '刷新', variant: 'ghost', size: 'small', mode: 'text' }) + '<p data-selection>请选择邮件</p>';
  const select = (event) => { const row = event.target.closest('[data-row]'); if (row && (event.type === 'click' || event.key === 'Enter')) host.querySelector('[data-selection]').textContent = rows[Number(row.dataset.row)]; };
  host.addEventListener('click', select); host.addEventListener('keydown', select);
  return () => { host.removeEventListener('click', select); host.removeEventListener('keydown', select); };
}`);
for (const framework of ["html", "react", "vue"]) {
  const bindingInput = JSON.parse(fs.readFileSync(bindings, 'utf8'));
  bindingInput.pageModules = framework === 'html' ? [{ compositionId: 'search-area', source: './business-list.js' }] : [];
  fs.writeFileSync(bindings, JSON.stringify(bindingInput));
  const output = path.join(temp, `page-${framework}.${framework === "react" ? "jsx" : "js"}`);
  const manifest = path.join(temp, `${framework}-manifest.json`);
  const componentUsage = path.join(temp, `${framework}-component-usage.json`);
  const componentSelection = path.join(temp, `${framework}-component-selection.json`);
  const entry = path.join(temp, `entry-${framework}.${framework === "react" ? "jsx" : "js"}`);
  result = run("resolve-component-selection.mjs", ["--repo", root, "--context", path.join(temp, `${framework}-context.json`), "--bindings", bindings, "--recipes", contentRecipes, "--out", componentSelection]);
  assert.equal(result.status, 0, result.stderr);
  const generationArgs = ["--context", path.join(temp, `${framework}-context.json`), "--layout-contract", layout, "--bindings", bindings, "--out", output, "--entry-out", entry, "--manifest", manifest];
  generationArgs.push("--component-usage", componentUsage, "--component-selection", componentSelection);
  generationArgs.push("--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots");
  result = run("generate-framework-page.mjs", generationArgs);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(fs.readFileSync(manifest, "utf8"));
  assert.equal(parsed.targetFramework, framework);
  assert.equal(parsed.iconResolution.policy, "registered-alias-required");
  assert.equal(parsed.iconResolution.diagnostics.length, 0);
  assert.ok(parsed.generatedSource?.sha256);
  assert.ok(parsed.generatedEntry?.sha256);
  assert.ok(parsed.uiScene?.sha256);
  assert.equal(parsed.titlebarScene?.preset, "pattern-b-three-pane-default-titlebar", "Pattern B pages must emit their resolved Titlebar Scene");
  const titlebarScene = JSON.parse(fs.readFileSync(path.join(path.dirname(manifest), parsed.titlebarScene.path), "utf8"));
  assert.deepEqual(titlebarScene.segments.map((segment) => segment.id), ["primary-navigation", "secondary-list", "main-detail"]);
  assert.equal(titlebarScene.pagePolicy.required, true);
  assert.equal(titlebarScene.segments[0].size, "large");
  assert.equal(titlebarScene.segments[2].size, "large");
  assert.equal(titlebarScene.segments[1].verticalAlignment, "center");
  assert.equal(titlebarScene.segments[1].inlineInsetToken, "space/5");
  assert.deepEqual(titlebarScene.segments[2].windowControls.actions, ["minimize", "maximize", "close"]);
  assert.equal(JSON.parse(fs.readFileSync(path.join(path.dirname(manifest), parsed.uiScene.path), "utf8")).kind, "text-to-ui-scene");
  assert.ok(fs.existsSync(entry));
  {
    assert.ok(parsed.componentUsage?.sha256);
    const usage = JSON.parse(fs.readFileSync(componentUsage, "utf8"));
    assert.equal(usage.schemaVersion, 3);
    assert.equal(usage.enforcement, "strict-source");
    assert.equal(usage.registered.length, 5);
    const reuse = run("validate-web-component-reuse.mjs", ["--manifest", componentUsage, "--project-root", root, "--skill-root", path.join(root, "skill-support")]);
    assert.equal(reuse.status, 0, reuse.stderr);
  }
  manifests.push(parsed);
  const source = fs.readFileSync(output, "utf8");
  assert.match(source, /"structureDigest"/);
  assert.match(source, /export const stylePlan/);
  assert.match(source, /export const titlebarScene/);
  assert.match(source, /export const behaviorPlan/);
  assert.match(source, /export const pageContentRecipes/);
  assert.match(fs.readFileSync(entry, "utf8"), /GeneratedPage|mountGeneratedPage/);
  assert.match(source, new RegExp(`@text-to-ui/components-${framework}`));
  if (framework === "html") {
    assert.match(source, /renderPatternHtml/);
    assert.match(source, /"primary-navigation-bottom"/);
    assert.match(source, /@text-to-ui\/pattern-runtime\/styles\.css/);
    assert.match(source, /tui-pattern-runtime__title-segments/, "Pattern B title slots must compose into one pane-aligned global title layer");
    assert.match(source, /data-tui-action-behaviors/, "Final Titlebar actions must keep their behavior map inside the component boundary");
    const entrySource = fs.readFileSync(entry, "utf8");
    assert.match(entrySource, /bindTitlebarOverflow/, "HTML entries must mount Titlebar overflow behavior");
    assert.match(entrySource, /bindInputTagEntry/, "HTML entries must mount Input Tag Entry suggestion/tag behavior");
    assert.match(entrySource, /tuiActionBehaviors/, "HTML entries must resolve business actions from the final Titlebar rather than separate page buttons");
  }
}
const stackedNavBindings = JSON.parse(fs.readFileSync(bindings, "utf8"));
stackedNavBindings.patternShell.navigation.slots["primary-navigation-bottom"] = [{
  kind: "group", id: "app-switcher", tag: "div", className: "app-switcher",
  children: [{ kind: "component", bindingId: "primary-nav" }]
}];
stackedNavBindings.stylePlan.compositions.push({ id: "app-switcher", region: "primary-navigation", className: "app-switcher", tokenRoles: ["spacing.component-gap"], componentBoundary: "preserve" });
const stackedNavPath = path.join(temp, "stacked-nav-bindings.json");
fs.writeFileSync(stackedNavPath, JSON.stringify(stackedNavBindings));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", stackedNavPath, "--out", path.join(temp, "stacked-nav.js"), "--entry-out", path.join(temp, "stacked-nav-entry.js"), "--manifest", path.join(temp, "stacked-nav-manifest.json"), "--component-usage", path.join(temp, "stacked-nav-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "a generic group must not silently stack level-one navigation items");
assert.match(result.stderr, /primary-navigation-bottom group.*tui-primary-navigation-items/);
assert.equal(fs.existsSync(path.join(temp, "stacked-nav.js")), false);
const horizontalNavBindings = structuredClone(stackedNavBindings);
horizontalNavBindings.patternShell.navigation.slots["primary-navigation-bottom"][0].tag = "nav";
horizontalNavBindings.patternShell.navigation.slots["primary-navigation-bottom"][0].className = "app-switcher tui-primary-navigation-items";
horizontalNavBindings.stylePlan.compositions.find((entry) => entry.id === "app-switcher").className = "app-switcher tui-primary-navigation-items";
const horizontalNavPath = path.join(temp, "horizontal-nav-bindings.json");
const verticalNavCss = path.join(temp, "vertical-nav.css");
fs.writeFileSync(horizontalNavPath, JSON.stringify(horizontalNavBindings));
fs.writeFileSync(verticalNavCss, ".app-switcher { flex-direction: column; }\n");
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", horizontalNavPath, "--out", path.join(temp, "vertical-nav.js"), "--entry-out", path.join(temp, "vertical-nav-entry.js"), "--manifest", path.join(temp, "vertical-nav-manifest.json"), "--component-usage", path.join(temp, "vertical-nav-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", verticalNavCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "page CSS must not turn the registered level-one rail vertical");
assert.match(result.stderr, /primary-navigation-bottom group.*cannot set its axis/);
assert.equal(fs.existsSync(path.join(temp, "vertical-nav.js")), false);
const mailComposeBindings = JSON.parse(fs.readFileSync(bindings, "utf8"));
const mailComposeBinding = mailComposeBindings.componentBindings.find((binding) => binding.id === "compose");
mailComposeBinding.options.label = "写邮件";
mailComposeBinding.behaviorId = "compose-message";
const mailComposeInteraction = mailComposeBindings.behaviorPlan.interactions.find((interaction) => interaction.id === "compose");
mailComposeInteraction.id = "compose-message";
mailComposeInteraction.kind = "open-overlay";
mailComposeInteraction.triggerBindingIds = ["compose"];
const mailComposeContext = JSON.parse(fs.readFileSync(path.join(temp, "html-context.json"), "utf8"));
mailComposeContext.route.id = "communication-workbench";
const mailComposeContextPath = path.join(temp, "mail-compose-context.json");
fs.writeFileSync(mailComposeContextPath, JSON.stringify(mailComposeContext));
const mailComposePath = path.join(temp, "mail-compose-bindings.json");
fs.writeFileSync(mailComposePath, JSON.stringify(mailComposeBindings));
const mailComposeArgs = ["--context", mailComposeContextPath, "--layout-contract", layout, "--bindings", mailComposePath, "--out", path.join(temp, "mail-compose.js"), "--entry-out", path.join(temp, "mail-compose-entry.js"), "--manifest", path.join(temp, "mail-compose-manifest.json"), "--component-usage", path.join(temp, "mail-compose-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"];
result = run("generate-framework-page.mjs", mailComposeArgs);
assert.notEqual(result.status, 0, "a button-triggered mail pop-up must still use the Secondary Page new-page frame, not Dialog behavior");
assert.match(result.stderr, /must use Secondary Page Runtime layout=new-page/);
mailComposeInteraction.kind = "open-secondary-page";
mailComposeInteraction.secondaryPage = { layout: "new-page" };
const secondaryPageModulePath = path.join(temp, "secondary-page-module.js");
fs.writeFileSync(secondaryPageModulePath, `import { createSecondaryPageRuntime } from "@text-to-ui/pattern-runtime";\nexport function mount(host, { renderComponent }) { const runtime = createSecondaryPageRuntime({ layout: "new-page", mode: "runtime", slots: { titlebar: renderComponent("titlebar", { size: "small", layout: "standalone", paneRole: "final-pane", paneTitle: "新建" }), content: "" } }); runtime.mount(host.ownerDocument.getElementById("app")); }\n`);
mailComposeBindings.pageModules = [{ compositionId: "search-area", source: "./secondary-page-module.js" }];
fs.writeFileSync(mailComposePath, JSON.stringify(mailComposeBindings));
result = run("generate-framework-page.mjs", mailComposeArgs);
assert.equal(result.status, 0, result.stderr);
const literalPageCss = path.join(temp, "literal-page.css");
fs.writeFileSync(literalPageCss, ".task-list { color: #123456; padding: 12px; }\n");
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", bindings, "--out", path.join(temp, "literal-page.js"), "--entry-out", path.join(temp, "literal-page-entry.js"), "--manifest", path.join(temp, "literal-page.json"), "--component-usage", path.join(temp, "literal-page-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", literalPageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "literal page CSS must block generation before an artifact is written");
assert.match(result.stderr, /Page CSS Token preflight failed/);
assert.equal(fs.existsSync(path.join(temp, "literal-page.js")), false, "failed Token preflight must not leave a page module");
const framedPageCss = path.join(temp, "framed-page.css");
fs.writeFileSync(framedPageCss, "html, body { margin: 0; }\n#app { max-width: 1200px; margin: auto; }\n");
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", bindings, "--out", path.join(temp, "framed-page.js"), "--entry-out", path.join(temp, "framed-page-entry.js"), "--manifest", path.join(temp, "framed-page.json"), "--component-usage", path.join(temp, "framed-page-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", framedPageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "a centered HTML canvas must block generation");
assert.match(result.stderr, /viewport boundary preflight failed/);
assert.equal(fs.existsSync(path.join(temp, "framed-page.js")), false, "failed viewport preflight must not leave a page module");
const shellStrokePageCss = path.join(temp, "shell-stroke-page.css");
fs.writeFileSync(shellStrokePageCss, ".task-pane-shell { border: 2px solid var(--color-border); }\n");
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", bindings, "--out", path.join(temp, "shell-stroke-page.js"), "--entry-out", path.join(temp, "shell-stroke-page-entry.js"), "--manifest", path.join(temp, "shell-stroke-page.json"), "--component-usage", path.join(temp, "shell-stroke-page-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", shellStrokePageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "page-owned shell strokes must block generation before an artifact is written");
assert.match(result.stderr, /Page CSS stroke boundary preflight failed/);
assert.equal(fs.existsSync(path.join(temp, "shell-stroke-page.js")), false, "failed stroke preflight must not leave a page module");
const resizerStrokePageCss = path.join(temp, "resizer-stroke-page.css");
fs.writeFileSync(resizerStrokePageCss, ".content-resizer::before { border-inline-start: 2px solid var(--color-border); }\n");
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", bindings, "--out", path.join(temp, "resizer-stroke-page.js"), "--entry-out", path.join(temp, "resizer-stroke-page-entry.js"), "--manifest", path.join(temp, "resizer-stroke-page.json"), "--component-usage", path.join(temp, "resizer-stroke-page-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", resizerStrokePageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "a thick draggable divider stroke must block page generation");
assert.match(result.stderr, /divider\/separator\/resizer.*--layout-navigation-divider-width/);
assert.equal(fs.existsSync(path.join(temp, "resizer-stroke-page.js")), false, "failed resizer stroke preflight must not leave a page module");
const shellBlockStrokePageCss = path.join(temp, "shell-block-stroke-page.css");
fs.writeFileSync(shellBlockStrokePageCss, ".task-pane-shell { border-block-end: 2px solid var(--color-border); }\n");
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", bindings, "--out", path.join(temp, "shell-block-stroke-page.js"), "--entry-out", path.join(temp, "shell-block-stroke-page-entry.js"), "--manifest", path.join(temp, "shell-block-stroke-page.json"), "--component-usage", path.join(temp, "shell-block-stroke-page-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", shellBlockStrokePageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "page-owned block-direction shell strokes must block generation before an artifact is written");
assert.match(result.stderr, /Page CSS stroke boundary preflight failed/);
assert.equal(fs.existsSync(path.join(temp, "shell-block-stroke-page.js")), false, "failed block-direction stroke preflight must not leave a page module");
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", invalidIconBindings, "--out", path.join(temp, "invalid-icon.js"), "--entry-out", path.join(temp, "invalid-icon-entry.js"), "--manifest", path.join(temp, "invalid-icon.json"), "--component-usage", path.join(temp, "invalid-icon-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "unregistered icons must block page generation");
assert.match(result.stderr, /Icon resolution failed/);
const galleryDefaultBindings = JSON.parse(fs.readFileSync(bindings, "utf8"));
delete galleryDefaultBindings.componentBindings.find((binding) => binding.id === "navigation").options;
const galleryDefaultPath = path.join(temp, "gallery-default-bindings.json");
fs.writeFileSync(galleryDefaultPath, JSON.stringify(galleryDefaultBindings));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", galleryDefaultPath, "--out", path.join(temp, "gallery-default.js"), "--entry-out", path.join(temp, "gallery-default-entry.js"), "--manifest", path.join(temp, "gallery-default.json"), "--component-usage", path.join(temp, "gallery-default-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "business pages must not inherit Sidebar gallery defaults");
assert.match(result.stderr, /business-page Sidebar requires explicit options\.items or options\.groups/);
const overlappingCustom = JSON.parse(fs.readFileSync(bindings, "utf8"));
overlappingCustom.custom = [{ id: "handwritten-button", missingCapability: "custom button", registryQueries: ["button"], contractQueries: ["canonical button contract"], reviewedCandidates: [], tokenRoles: ["color.primary"], disposition: "page-owned", exceptionKind: "no-matching-component" }];
const overlappingCustomPath = path.join(temp, "overlapping-custom.json");
fs.writeFileSync(overlappingCustomPath, JSON.stringify(overlappingCustom));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", overlappingCustomPath, "--out", path.join(temp, "overlapping-custom.js"), "--entry-out", path.join(temp, "overlapping-custom-entry.js"), "--manifest", path.join(temp, "overlapping-custom.json"), "--component-usage", path.join(temp, "overlapping-custom-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "page-owned custom UI must not overlap an available component");
assert.match(result.stderr, /overlaps available html component/);
assert.equal(new Set(manifests.map((manifest) => manifest.patternContract.structureDigest)).size, 1, "HTML, React, and Vue must share one structure digest");
assert.equal(new Set(manifests.map((manifest) => manifest.navigationMode)).size, 1, "HTML, React, and Vue must share one navigation shell mode");

// A navigation shell must not wrap the primary Titlebar or place a second
// control beside it. This is the regression fixture for the bad email page:
// the wrapper painted a second background under the logo and visually split
// the shell into an extra column.
const nestedTitlebarBindings = JSON.parse(fs.readFileSync(bindings, "utf8"));
nestedTitlebarBindings.patternShell.navigation.slots["global-title-layer"] = [{
  kind: "group",
  id: "nested-titlebar-wrapper",
  tag: "header",
  children: [{ kind: "component", bindingId: "title" }]
}];
nestedTitlebarBindings.stylePlan.compositions.push({ id: "nested-titlebar-wrapper", region: "primary-navigation", tokenRoles: ["spacing.component-gap"], componentBoundary: "preserve" });
const nestedTitlebarPath = path.join(temp, "nested-titlebar-bindings.json");
fs.writeFileSync(nestedTitlebarPath, JSON.stringify(nestedTitlebarBindings));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", nestedTitlebarPath, "--out", path.join(temp, "nested-titlebar.js"), "--entry-out", path.join(temp, "nested-titlebar-entry.js"), "--manifest", path.join(temp, "nested-titlebar.json"), "--component-usage", path.join(temp, "nested-titlebar-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "Pattern B must reject a wrapped primary Titlebar");
assert.match(result.stderr, /global-title-layer must be one direct Titlebar component/);

const unboundSearchBindings = JSON.parse(fs.readFileSync(bindings, "utf8"));
delete unboundSearchBindings.componentBindings.find((binding) => binding.id === "search").slot;
const unboundSearchPath = path.join(temp, "unbound-search-bindings.json");
fs.writeFileSync(unboundSearchPath, JSON.stringify(unboundSearchBindings));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", unboundSearchPath, "--out", path.join(temp, "unbound-search.js"), "--entry-out", path.join(temp, "unbound-search-entry.js"), "--manifest", path.join(temp, "unbound-search.json"), "--component-usage", path.join(temp, "unbound-search-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "Pattern B Search must declare its renderer-owned title slot");
assert.match(result.stderr, /requires Pattern slot secondary-list-title/);

const missingFinalTitlebarBindings = JSON.parse(fs.readFileSync(bindings, "utf8"));
missingFinalTitlebarBindings.componentBindings = missingFinalTitlebarBindings.componentBindings.filter((binding) => binding.id !== "detail-titlebar");
missingFinalTitlebarBindings.composition.regions["main-detail"][0].children = [];
missingFinalTitlebarBindings.behaviorPlan.interactions = missingFinalTitlebarBindings.behaviorPlan.interactions.filter((interaction) => interaction.id !== "more-actions");
const missingFinalTitlebarPath = path.join(temp, "missing-final-titlebar-bindings.json");
fs.writeFileSync(missingFinalTitlebarPath, JSON.stringify(missingFinalTitlebarBindings));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", missingFinalTitlebarPath, "--out", path.join(temp, "missing-final-titlebar.js"), "--entry-out", path.join(temp, "missing-final-titlebar-entry.js"), "--manifest", path.join(temp, "missing-final-titlebar.json"), "--component-usage", path.join(temp, "missing-final-titlebar-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "Pattern B must require a final-pane Titlebar");
assert.match(result.stderr, /main-detail-title must resolve to exactly one final Titlebar/);

const directDetailActionBindings = JSON.parse(fs.readFileSync(bindings, "utf8"));
directDetailActionBindings.componentBindings.push({ id: "legacy-action", logicalName: "Button/Primary/Default", semanticContext: "titlebar-main-detail-actions", behaviorId: "legacy-action", options: { label: "旧操作", variant: "ghost", size: "small", mode: "icon", icon: "action/more" }, region: "main-detail", slot: "main-detail-actions" });
directDetailActionBindings.behaviorPlan.interactions.push({ id: "legacy-action", kind: "component-native", triggerBindingIds: ["legacy-action"], outcome: "执行旧操作" });
directDetailActionBindings.composition.regions["main-detail"][0].children.push({ kind: "component", bindingId: "legacy-action" });
const directDetailActionPath = path.join(temp, "direct-detail-action-bindings.json");
fs.writeFileSync(directDetailActionPath, JSON.stringify(directDetailActionBindings));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", directDetailActionPath, "--out", path.join(temp, "direct-detail-action.js"), "--entry-out", path.join(temp, "direct-detail-action-entry.js"), "--manifest", path.join(temp, "direct-detail-action.json"), "--component-usage", path.join(temp, "direct-detail-action-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "Pattern B must reject direct page-level action buttons in its final title segment");
assert.match(result.stderr, /main-detail-actions is component-owned/);

const implicitTitlebarMode = JSON.parse(fs.readFileSync(bindings, "utf8"));
const implicitDetailTitlebar = implicitTitlebarMode.componentBindings.find((binding) => binding.id === "detail-titlebar");
implicitDetailTitlebar.slots["main-detail-actions"] = [
  { id: "reply", label: "回复", icon: "action/reply" },
  { id: "more", label: "更多", icon: "action/more", buttonType: "icon" }
];
implicitDetailTitlebar.actionBehaviors = { reply: "more-actions", more: "more-actions" };
const implicitTitlebarModePath = path.join(temp, "implicit-titlebar-mode.json");
const implicitTitlebarModeManifest = path.join(temp, "implicit-titlebar-mode-manifest.json");
fs.writeFileSync(implicitTitlebarModePath, JSON.stringify(implicitTitlebarMode));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", implicitTitlebarModePath, "--out", path.join(temp, "implicit-titlebar-mode.js"), "--entry-out", path.join(temp, "implicit-titlebar-mode-entry.js"), "--manifest", implicitTitlebarModeManifest, "--component-usage", path.join(temp, "implicit-titlebar-mode-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.equal(result.status, 0, result.stderr);
const implicitTitlebarModeScene = JSON.parse(fs.readFileSync(path.join(temp, JSON.parse(fs.readFileSync(implicitTitlebarModeManifest, "utf8")).titlebarScene.path), "utf8"));
assert.equal(implicitTitlebarModeScene.segments[2].businessActions.mode, "icon-text-ghost", "unspecified business action mode must inherit the current Titlebar Scene default");
assert.equal(implicitTitlebarModeScene.segments[2].businessActions.actions.find((action) => action.id === "reply").buttonType, "icon-text-ghost");

const mixedTitlebarActions = JSON.parse(fs.readFileSync(bindings, "utf8"));
const mixedDetailTitlebar = mixedTitlebarActions.componentBindings.find((binding) => binding.id === "detail-titlebar");
mixedDetailTitlebar.slots["main-detail-actions"] = [
  { id: "reply", label: "回复", icon: "action/reply", buttonType: "icon-text-ghost" },
  { id: "archive", label: "归档", icon: "action/archive", buttonType: "icon" }
];
mixedDetailTitlebar.actionBehaviors = { reply: "more-actions" };
const mixedTitlebarActionsPath = path.join(temp, "mixed-titlebar-actions.json");
fs.writeFileSync(mixedTitlebarActionsPath, JSON.stringify(mixedTitlebarActions));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", mixedTitlebarActionsPath, "--out", path.join(temp, "mixed-titlebar-actions.js"), "--entry-out", path.join(temp, "mixed-titlebar-actions-entry.js"), "--manifest", path.join(temp, "mixed-titlebar-actions.json.out"), "--component-usage", path.join(temp, "mixed-titlebar-actions-usage.json"), "--blueprint", blueprint, "--content-recipes", contentRecipes, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "Pattern B must reject mixed Titlebar business action modes instead of silently normalizing them");
assert.match(result.stderr, /main-detail actions must use one uniform mode/);

const navigationCompositeSource = path.join(temp, "navigation-composite.js");
fs.writeFileSync(navigationCompositeSource, `export function mount(host, { renderComponent }) {
  host.innerHTML = '<div class="mail-nav"><div role="button">收件箱</div>' + renderComponent('button', { label: '写邮件', variant: 'primary', size: 'standard', mode: 'text' }) + '</div>';
}`);
const navigationCompositeBindings = JSON.parse(fs.readFileSync(bindings, "utf8"));
navigationCompositeBindings.pageModules = [{ compositionId: "nav-stack", source: "./navigation-composite.js" }];
const navigationCompositeRecipes = JSON.parse(fs.readFileSync(contentRecipes, "utf8"));
navigationCompositeRecipes.recipes[0] = {
  ...navigationCompositeRecipes.recipes[0],
  kind: "page-composite",
  fields: ["label"],
  states: ["default"],
  missingCapability: "specialized navigation business content",
  registryQueries: ["specialized-navigation-business-content"],
  reviewedCandidates: [],
  tokenRoles: ["spacing.component-gap"],
  disposition: "page-owned"
};
const navigationCompositeBindingsPath = path.join(temp, "navigation-composite-bindings.json");
const navigationCompositeRecipesPath = path.join(temp, "navigation-composite-recipes.json");
fs.writeFileSync(navigationCompositeBindingsPath, JSON.stringify(navigationCompositeBindings));
fs.writeFileSync(navigationCompositeRecipesPath, JSON.stringify(navigationCompositeRecipes));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", navigationCompositeBindingsPath, "--out", path.join(temp, "navigation-composite.js.out"), "--entry-out", path.join(temp, "navigation-composite-entry.js"), "--manifest", path.join(temp, "navigation-composite-manifest.json"), "--component-usage", path.join(temp, "navigation-composite-usage.json"), "--blueprint", blueprint, "--content-recipes", navigationCompositeRecipesPath, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "navigation composites must not recreate Pattern shell responsibilities");
assert.match(result.stderr, /owns Pattern navigation slot .*renders/);

const detailCompositeSource = path.join(temp, "detail-composite.js");
fs.writeFileSync(detailCompositeSource, `export function mount(host) {
  host.innerHTML = '<div class="detail-toolbar"><span>−</span></div><article>邮件正文</article>';
}`);
const detailCompositeBindings = JSON.parse(fs.readFileSync(bindings, "utf8"));
detailCompositeBindings.pageModules = [{ compositionId: "detail-actions", source: "./detail-composite.js" }];
const detailCompositeRecipes = JSON.parse(fs.readFileSync(contentRecipes, "utf8"));
detailCompositeRecipes.recipes[2] = {
  ...detailCompositeRecipes.recipes[2],
  kind: "page-composite",
  fields: ["body"],
  states: ["default"],
  missingCapability: "specialized mail detail body",
  registryQueries: ["mail-detail-body"],
  reviewedCandidates: [],
  tokenRoles: ["spacing.component-gap"],
  disposition: "page-owned"
};
const detailCompositeBindingsPath = path.join(temp, "detail-composite-bindings.json");
const detailCompositeRecipesPath = path.join(temp, "detail-composite-recipes.json");
fs.writeFileSync(detailCompositeBindingsPath, JSON.stringify(detailCompositeBindings));
fs.writeFileSync(detailCompositeRecipesPath, JSON.stringify(detailCompositeRecipes));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", detailCompositeBindingsPath, "--out", path.join(temp, "detail-composite.js.out"), "--entry-out", path.join(temp, "detail-composite-entry.js"), "--manifest", path.join(temp, "detail-composite-manifest.json"), "--component-usage", path.join(temp, "detail-composite-usage.json"), "--blueprint", blueprint, "--content-recipes", detailCompositeRecipesPath, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes", "--require-slots"]);
assert.notEqual(result.status, 0, "Main Detail composites must not recreate a pane-local Titlebar");
assert.match(result.stderr, /owns Pattern Main Detail slot .*renders/);

const invalidBindings = path.join(temp, "invalid-bindings.json");
fs.writeFileSync(invalidBindings, JSON.stringify({ componentBindings: [{ logicalName: "Button/Primary/Default", semanticContext: "page-primary-action", options: { label: "新增", variant: "primary", size: "standard", mode: "text" }, region: "invented-pane" }] }));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", bindings, "--out", path.join(temp, "missing-blueprint.js"), "--entry-out", path.join(temp, "missing-blueprint-entry.js"), "--manifest", path.join(temp, "missing-blueprint.json"), "--component-usage", path.join(temp, "missing-blueprint-usage.json"), "--require-blueprint"]);
assert.notEqual(result.status, 0, "new page generation must require a page blueprint");
assert.match(result.stderr, /requires --blueprint/);
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", invalidBindings, "--out", path.join(temp, "invalid.js"), "--entry-out", path.join(temp, "invalid-entry.js"), "--manifest", path.join(temp, "invalid.json")]);
assert.notEqual(result.status, 0, "an adapter must not invent a Pattern region");
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", bindings, "--out", path.join(temp, "missing-usage.js"), "--entry-out", path.join(temp, "missing-usage-entry.js"), "--manifest", path.join(temp, "missing-usage.json")]);
assert.notEqual(result.status, 0, "HTML generation must require component-usage evidence output");
const flatBindings = path.join(temp, "flat-bindings.json");
const flatInput = JSON.parse(fs.readFileSync(bindings, "utf8"));
delete flatInput.composition;
fs.writeFileSync(flatBindings, JSON.stringify(flatInput));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", flatBindings, "--out", path.join(temp, "flat.js"), "--entry-out", path.join(temp, "flat-entry.js"), "--manifest", path.join(temp, "flat.json"), "--component-usage", path.join(temp, "flat-usage.json")]);
assert.notEqual(result.status, 0, "HTML generation must reject a flat component inventory without page composition");
assert.match(result.stderr, /flat component list is not a complete page/);
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", bindings, "--out", path.join(temp, "missing-recipes.js"), "--entry-out", path.join(temp, "missing-recipes-entry.js"), "--manifest", path.join(temp, "missing-recipes.json"), "--component-usage", path.join(temp, "missing-recipes-usage.json"), "--blueprint", blueprint, "--page-css", pageCss, "--require-blueprint", "--require-content-recipes"]);
assert.notEqual(result.status, 0, "new page generation must require content recipes");
assert.match(result.stderr, /requires --content-recipes/);
const ambiguousBindings = JSON.parse(fs.readFileSync(bindings, "utf8"));
delete ambiguousBindings.componentBindings.find((binding) => binding.logicalName === "Button/Primary/Default").semanticContext;
const ambiguousPath = path.join(temp, "ambiguous-bindings.json");
fs.writeFileSync(ambiguousPath, JSON.stringify(ambiguousBindings));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", ambiguousPath, "--out", path.join(temp, "ambiguous.js"), "--entry-out", path.join(temp, "ambiguous-entry.js"), "--manifest", path.join(temp, "ambiguous.json"), "--component-usage", path.join(temp, "ambiguous-usage.json")]);
assert.notEqual(result.status, 0, "ambiguous component families must require semanticContext");
assert.match(result.stderr, /semanticContext is required/);
const misplacedNavigation = JSON.parse(fs.readFileSync(bindings, "utf8"));
misplacedNavigation.componentBindings.find((binding) => binding.id === "primary-nav").slot = "secondary-navigation-content";
const misplacedPath = path.join(temp, "misplaced-navigation.json");
fs.writeFileSync(misplacedPath, JSON.stringify(misplacedNavigation));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", misplacedPath, "--out", path.join(temp, "misplaced.js"), "--entry-out", path.join(temp, "misplaced-entry.js"), "--manifest", path.join(temp, "misplaced.json"), "--component-usage", path.join(temp, "misplaced-usage.json"), "--require-slots"]);
assert.notEqual(result.status, 0, "two-level navigation must reject a primary item outside its bottom slot");
assert.match(result.stderr, /requires semanticContext secondary-navigation/);
const missingStylePlan = JSON.parse(fs.readFileSync(bindings, "utf8"));
delete missingStylePlan.stylePlan;
const missingStylePlanPath = path.join(temp, "missing-style-plan.json");
fs.writeFileSync(missingStylePlanPath, JSON.stringify(missingStylePlan));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", missingStylePlanPath, "--out", path.join(temp, "missing-style.js"), "--entry-out", path.join(temp, "missing-style-entry.js"), "--manifest", path.join(temp, "missing-style.json"), "--component-usage", path.join(temp, "missing-style-usage.json")]);
assert.notEqual(result.status, 0, "page-owned composition must declare its Style Plan before generation");
assert.match(result.stderr, /requires stylePlan/);
const missingBehaviorPlan = JSON.parse(fs.readFileSync(bindings, "utf8"));
delete missingBehaviorPlan.behaviorPlan;
const missingBehaviorPlanPath = path.join(temp, "missing-behavior-plan.json");
fs.writeFileSync(missingBehaviorPlanPath, JSON.stringify(missingBehaviorPlan));
result = run("generate-framework-page.mjs", ["--context", path.join(temp, "html-context.json"), "--layout-contract", layout, "--bindings", missingBehaviorPlanPath, "--out", path.join(temp, "missing-behavior.js"), "--entry-out", path.join(temp, "missing-behavior-entry.js"), "--manifest", path.join(temp, "missing-behavior.json"), "--component-usage", path.join(temp, "missing-behavior-usage.json")]);
assert.notEqual(result.status, 0, "interactive components must declare their Behavior Plan before generation");
assert.match(result.stderr, /requires behaviorPlan/);

// The normal authoring path is the one-shot compliant pipeline. It owns the
// route/context receipts and only commits final output after the strict
// generator succeeds.
const oneShotRouteReceipt = path.join(temp, "one-shot-route-read-receipt.json");
result = run("resolve-workflow-route.mjs", ["--route", "new-page", "--repo", root, "--receipt-out", oneShotRouteReceipt]);
assert.equal(result.status, 0, result.stderr);
const oneShotContext = path.join(temp, "one-shot-context.json");
const oneShotContextReceipt = path.join(temp, "one-shot-context-material-receipt.json");
result = run("resolve-context.mjs", ["--task", "tasks", "--repo", root, "--skill-root", path.join(root, "skill-support"), "--framework", "html", "--mode", "fast-preview", "--auto", "--confirmed", "--blueprint", blueprint, "--out", oneShotContext, "--receipt-out", oneShotContextReceipt]);
assert.equal(result.status, 0, result.stderr);
const oneShotDir = path.join(temp, "one-shot-output");
fs.mkdirSync(oneShotDir, { recursive: true });
const oneShotReceipt = path.join(oneShotDir, "generation-receipt.json");
result = run("generate-compliant-page.mjs", [
  "--project", oneShotDir,
  "--repo", root,
  "--framework", "html",
  "--task", "workbench",
  "--task-route", "record-management-workbench",
  "--route-receipt", oneShotRouteReceipt,
  "--layout-contract", layout,
  "--blueprint", blueprint,
  "--content-recipes", contentRecipes,
  "--bindings", bindings,
  "--page-css", pageCss,
  "--out", path.join(oneShotDir, "generated-page.js"),
  "--entry-out", path.join(oneShotDir, "generated-entry.js"),
  "--manifest", path.join(oneShotDir, "framework-page-manifest.json"),
  "--component-usage", path.join(oneShotDir, "component-usage.json"),
  "--ui-scene", path.join(oneShotDir, "ui-scene.json"),
  "--receipt-out", oneShotReceipt
]);
assert.equal(result.status, 0, result.stderr);
const oneShotContextPacket = JSON.parse(fs.readFileSync(path.join(oneShotDir, ".text-to-ui", "context-packet.json"), "utf8"));
assert.equal(oneShotContextPacket.route.id, "record-management-workbench", "the one-shot generator must pass --task-route to context resolution");
assert.equal(oneShotContextPacket.request.task, "workbench", "explicit routing must preserve the original task description");
const oneShotManifest = JSON.parse(fs.readFileSync(path.join(oneShotDir, "framework-page-manifest.json"), "utf8"));
const oneShotGenerationReceipt = JSON.parse(fs.readFileSync(oneShotReceipt, "utf8"));
assert.equal(oneShotGenerationReceipt.kind, "text-to-ui-compliant-generation-receipt");
assert.equal(JSON.parse(fs.readFileSync(path.join(oneShotDir, "component-usage.json"), "utf8")).schemaVersion, 3);
assert.ok(oneShotGenerationReceipt.componentSelection?.sha256);
assert.equal(oneShotGenerationReceipt.pattern.patternDigest, oneShotManifest.patternContract.patternDigest);
assert.ok(oneShotGenerationReceipt.gates.every((gate) => gate.status === "passed"));
assert.equal(oneShotManifest.titlebarScene?.preset, "pattern-b-three-pane-default-titlebar");
assert.ok(oneShotGenerationReceipt.gates.some((gate) => gate.id === "titlebar-scene"));
assert.ok(fs.existsSync(path.join(oneShotDir, "titlebar-scene.json")), "one-shot generation must commit the resolved Titlebar Scene with the page");
assert.ok(fs.existsSync(path.join(oneShotDir, "package.json")), "empty targets must be scaffolded by the one-shot entry");
assert.match(fs.readFileSync(path.join(oneShotDir, "main.js"), "utf8"), /generated-entry\.js/);
assert.match(fs.readFileSync(path.join(oneShotDir, "generated-entry.js"), "utf8"), /generated-page\.js/);
assert.doesNotMatch(fs.readFileSync(path.join(oneShotDir, "generated-entry.js"), "utf8"), /\.tmp/);

const oneShotInvalidCss = path.join(temp, "one-shot-invalid.css");
fs.writeFileSync(oneShotInvalidCss, ".task-list { color: #123456; padding: 12px; }\n");
const failedOneShotSource = path.join(oneShotDir, "failed-page.js");
result = run("generate-compliant-page.mjs", [
  "--project", oneShotDir,
  "--repo", root,
  "--framework", "html",
  "--context", oneShotContext,
  "--route-receipt", oneShotRouteReceipt,
  "--context-receipt", oneShotContextReceipt,
  "--layout-contract", layout,
  "--blueprint", blueprint,
  "--content-recipes", contentRecipes,
  "--bindings", bindings,
  "--page-css", oneShotInvalidCss,
  "--out", failedOneShotSource,
  "--entry-out", path.join(oneShotDir, "failed-entry.js"),
  "--manifest", path.join(oneShotDir, "failed-manifest.json"),
  "--component-usage", path.join(oneShotDir, "failed-usage.json"),
  "--ui-scene", path.join(oneShotDir, "failed-scene.json"),
  "--receipt-out", path.join(oneShotDir, "failed-receipt.json")
]);
assert.notEqual(result.status, 0, "one-shot pipeline must block invalid Token CSS");
assert.equal(fs.existsSync(failedOneShotSource), false, "failed one-shot generation must not commit a page module");
assert.equal(fs.existsSync(path.join(oneShotDir, "failed-manifest.json")), false, "failed one-shot generation must not commit a manifest");
if (process.env.TUI_PLAYWRIGHT_MODULE) {
  result = run('scaffold-standalone-project.mjs', ['--project', temp, '--repo', root, '--entry', './entry-html.js']);
  assert.equal(result.status, 0, result.stderr);
  result = spawnSync('pnpm', ['install', '--ignore-scripts'], { cwd: temp, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  result = spawnSync('pnpm', ['build'], { cwd: temp, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const { chromium } = await import(pathToFileURL(process.env.TUI_PLAYWRIGHT_MODULE));
  const server = spawn(process.execPath, [path.join(temp, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '0'], { cwd: temp, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  try {
    const url = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Preview startup timed out')), 15000);
      server.stdout.on('data', (chunk) => { const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+\//); if (match) { clearTimeout(timeout); resolve(match[0]); } });
      server.on('exit', (code) => { clearTimeout(timeout); reject(new Error('Preview exited: ' + code)); });
    });
    browser = await chromium.launch({ headless: true, ...(process.env.TUI_BROWSER_EXECUTABLE ? { executablePath: process.env.TUI_BROWSER_EXECUTABLE } : {}) });
    const page = await browser.newPage({ viewport: { width: 1728, height: 1152 } });
    const errors = []; page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url);
    await page.locator('[data-row="1"]').click();
    assert.equal(await page.locator('[data-selection]').textContent(), '设计更新');
    await page.locator('[data-row="0"]').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-selection]').textContent(), '路线评审');
    const geometry = await page.evaluate(() => {
      const box = (selector) => document.querySelector(selector).getBoundingClientRect().toJSON();
      const style = (selector) => {
        const node = document.querySelector(selector);
        const computed = getComputedStyle(node);
        return { paddingInlineStart: computed.paddingInlineStart, paddingInlineEnd: computed.paddingInlineEnd, paddingBlockStart: computed.paddingBlockStart, paddingBlockEnd: computed.paddingBlockEnd };
      };
      return { nav: box('[data-pattern-region="primary-navigation"]'), list: box('[data-pattern-region="secondary-list"]'), title: box('[data-pattern-title-segment="secondary-list"]'), bottom: box('[data-pattern-shell-slot="primary-navigation-bottom"]'), listBody: style('[data-pattern-region="secondary-list"] > [data-pattern-scroll-body]'), detailBody: style('[data-pattern-region="main-detail"] > [data-pattern-scroll-body]') };
    });
    assert.equal(geometry.nav.width, 240); assert.equal(geometry.list.width, 360); assert.equal(geometry.title.height, 64);
    assert.deepEqual(geometry.listBody, { paddingInlineStart: "16px", paddingInlineEnd: "16px", paddingBlockStart: "8px", paddingBlockEnd: "0px" });
    assert.deepEqual(geometry.detailBody, { paddingInlineStart: "24px", paddingInlineEnd: "24px", paddingBlockStart: "16px", paddingBlockEnd: "0px" });
    assert.ok(geometry.bottom.y > 1000); assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(temp, 'browser-proof.png'), fullPage: true });
    // A second imported CSS file must not bypass build-time shell ownership.
    fs.writeFileSync(path.join(temp, 'extra.css'), '[data-pattern] { grid-template-columns: 264px 512px 1fr; }');
    fs.appendFileSync(path.join(temp, 'main.js'), '\nimport "./extra.css";\n');
    result = spawnSync('pnpm', ['build'], { cwd: temp, encoding: 'utf8' });
    assert.notEqual(result.status, 0); assert.match(result.stderr + result.stdout, /Pattern-owned/);
    console.log('Browser verified: mounted entry, executable composite, pointer/keyboard interaction, 240/360 panes, 64px title, bottom navigation, imported CSS protection.');
  } finally { await browser?.close(); server.kill(); }
}
if (process.env.TUI_KEEP_FIXTURE) console.log('Fixture retained: ' + temp);
else fs.rmSync(temp, { recursive: true, force: true });
console.log("Cross-framework Pattern page generation tests passed.");
