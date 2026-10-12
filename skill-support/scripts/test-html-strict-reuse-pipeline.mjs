import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { collectHtmlComponentEvidence, renderHtmlComponent } from "../../packages/components-html/src/index.js";

const sidebar = renderHtmlComponent("sidebar", { items: [{ label: "收件箱", count: 23, selected: true }, { label: "草稿", count: 3 }] });
assert.match(sidebar, /收件箱/);
assert.match(sidebar, /data-renderer-key="sidebar"/);
assert.doesNotMatch(sidebar, />项目</);
const listCard = renderHtmlComponent("list-card", { title: "设计评审", description: "今天 10:42", content: '<span data-slot="title">自定义业务内容</span>', actions: '<button data-slot="action">归档</button>' });
assert.match(listCard, /自定义业务内容/);
assert.match(listCard, /data-slot="actions"/);
const listRow = renderHtmlComponent("list-card", { title: "任务", supporting: "明天", trailingSlot: '<span data-slot="trailing">待处理</span>' });
assert.match(listRow, /待处理/);
const checkbox = renderHtmlComponent("checkbox", { label: "", description: "", checked: false, ariaLabel: "选择任务" });
assert.match(checkbox, /aria-label="选择任务"/);
assert.doesNotMatch(checkbox, /同步到云端/);
const attachment = renderHtmlComponent("attachment", { type: "DOCX", name: "需求说明.docx", meta: "1.2 MB" });
assert.match(attachment, /需求说明\.docx/);
assert.match(attachment, /data-renderer-key="attachment"/);
assert.equal(typeof collectHtmlComponentEvidence, "function");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tui-strict-pipeline-"));
const sourceDir = path.join(temp, "src");
fs.mkdirSync(sourceDir, { recursive: true });
const repoRelativeSource = path.relative(process.cwd(), sourceDir);
const layoutContractPath = path.join(temp, "layout-contract.json");
fs.writeFileSync(layoutContractPath, JSON.stringify({ pattern: "pattern-b-three-pane", paneOrder: ["primary-navigation", "secondary-list", "main-detail"] }));
const manifest = {
  schemaVersion: 2,
  targetFramework: "html",
  enforcement: "strict-source",
  registry: "packages/component-contracts/src/components.json",
  sourceRoots: [repoRelativeSource],
  layout: { contractPath: "layout-contract.json", pattern: "pattern-b-three-pane", paneOrder: ["primary-navigation", "secondary-list", "main-detail"], patternDigest: "test-pattern", structureDigest: "test-structure" },
  renderer: { package: "@text-to-ui/components-html", factoryImport: "renderHtmlComponent", styleImports: ["@text-to-ui/tokens", "@text-to-ui/components-html/styles.css", "@text-to-ui/components-html/pattern-shell.css"] },
  registered: [{ logicalName: "Titlebar/Default", rendererKey: "titlebar", usage: "global title", requiredCallSites: 1, expectedRuntimeCount: 1, readinessLevel: "provisional", unresolvedParity: ["visualParity", "behaviorParity", "accessibilityParity"] }],
  contractBased: [], custom: [], previousOutputReuse: false
};
const manifestPath = path.join(temp, "component-usage.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
const validator = path.resolve("skill-support/scripts/validate-web-component-reuse.mjs");
const run = () => spawnSync(process.execPath, [validator, "--manifest", manifestPath, "--project-root", process.cwd()], { encoding: "utf8" });
const validSource = `import "@text-to-ui/tokens";\nimport "@text-to-ui/components-html/styles.css";\nimport "@text-to-ui/components-html/pattern-shell.css";\nimport { renderHtmlComponent } from "@text-to-ui/components-html";\nexport const titlebar = renderHtmlComponent("titlebar", { label: "任务" });\n`;
fs.writeFileSync(path.join(sourceDir, "main.js"), validSource);
assert.equal(run().status, 0, run().stderr);
fs.writeFileSync(path.join(sourceDir, "main.js"), validSource + `titlebar.replaceChildren(document.createElement("span"));\n`);
const destructive = run();
assert.notEqual(destructive.status, 0);
assert.match(destructive.stderr, /destructively rewritten/);
fs.writeFileSync(path.join(sourceDir, "main.js"), validSource.replace('renderHtmlComponent("titlebar", { label: "任务" })', '`<header class="tui-titlebar">任务</header>`'));
const lookalike = run();
assert.notEqual(lookalike.status, 0);
assert.match(lookalike.stderr, /never rendered enough times|handwritten registered-component/);
fs.writeFileSync(path.join(sourceDir, "main.js"), validSource);
fs.writeFileSync(path.join(sourceDir, "page.css"), `.page-toolbar .tui-button { height: 40px; border-radius: 12px; background: red; }\n`);
const protectedOverride = run();
assert.notEqual(protectedOverride.status, 0, "page CSS must not restyle registered component internals");
assert.match(protectedOverride.stderr, /protected registered-component properties/);
fs.writeFileSync(path.join(sourceDir, "page.css"), `.page-toolbar .tui-button { width: 100%; margin-inline: auto; }\n`);
assert.equal(run().status, 0, run().stderr);

const runtimeValidator = path.resolve("skill-support/scripts/validate-runtime-component-reuse.mjs");
const evidencePath = path.join(temp, "runtime.json");
fs.writeFileSync(evidencePath, JSON.stringify({ schemaVersion: 1, url: "http://127.0.0.1/", pattern: "pattern-b-three-pane", structureDigest: "test-structure", stylesheets: [{ href: "fixture.css", loaded: true, ruleCount: 1 }], patternLayout: { display: "grid", regions: [
  { region: "primary-navigation", display: "block", bounds: { x: 0, y: 0, width: 240, height: 720 } },
  { region: "secondary-list", display: "block", bounds: { x: 240, y: 0, width: 360, height: 720 } },
  { region: "main-detail", display: "block", bounds: { x: 600, y: 0, width: 600, height: 720 } }
] }, customRegions: [], contractRegions: [], unclassifiedInteractive: [], components: [{ rendererKey: "titlebar", logicalName: "Titlebar/Default", state: "default", variant: "medium", region: null, slots: ["label"], visible: true }] }));
const runtimeGood = spawnSync(process.execPath, [runtimeValidator, "--manifest", manifestPath, "--evidence", evidencePath], { encoding: "utf8" });
assert.equal(runtimeGood.status, 0, runtimeGood.stderr);
for (const framework of ["react", "vue"]) {
  const strictWebPath = path.join(temp, `${framework}-usage.json`);
  const strictEvidencePath = path.join(temp, `${framework}-runtime.json`);
  fs.writeFileSync(strictWebPath, JSON.stringify({ ...manifest, schemaVersion: 3, targetFramework: framework, registered: manifest.registered.map((item) => ({ ...item, rendererKey: null, exportName: "Titlebar" })) }));
  const runtime = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  runtime.components = runtime.components.map((item) => ({ ...item, framework }));
  fs.writeFileSync(strictEvidencePath, JSON.stringify(runtime));
  const accepted = spawnSync(process.execPath, [runtimeValidator, "--manifest", strictWebPath, "--evidence", strictEvidencePath], { encoding: "utf8" });
  assert.equal(accepted.status, 0, accepted.stderr);
  runtime.components[0].framework = "html";
  fs.writeFileSync(strictEvidencePath, JSON.stringify(runtime));
  const wrongFramework = spawnSync(process.execPath, [runtimeValidator, "--manifest", strictWebPath, "--evidence", strictEvidencePath], { encoding: "utf8" });
  assert.notEqual(wrongFramework.status, 0, "lookalike HTML markers cannot prove React/Vue runtime reuse");
}
const stacked = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
stacked.patternLayout.regions = stacked.patternLayout.regions.map((region, index) => ({ ...region, bounds: { ...region.bounds, x: 0, y: index * 240 } }));
fs.writeFileSync(evidencePath, JSON.stringify(stacked));
const runtimeStacked = spawnSync(process.execPath, [runtimeValidator, "--manifest", manifestPath, "--evidence", evidencePath], { encoding: "utf8" });
assert.notEqual(runtimeStacked.status, 0, "vertically stacked Pattern panes must fail runtime layout validation");
assert.match(runtimeStacked.stderr, /overlap or stack/);
fs.writeFileSync(evidencePath, JSON.stringify({ schemaVersion: 1, components: [] }));
const runtimeMissing = spawnSync(process.execPath, [runtimeValidator, "--manifest", manifestPath, "--evidence", evidencePath], { encoding: "utf8" });
assert.notEqual(runtimeMissing.status, 0);

fs.rmSync(temp, { recursive: true, force: true });
console.log("HTML strict reuse pipeline tests passed.");
