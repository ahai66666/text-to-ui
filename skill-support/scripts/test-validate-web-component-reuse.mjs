import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { componentPackageDigest } from "./component-selection.mjs";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tui-component-reuse-v3-"));
const sourceDir = path.join(temp, "src");
fs.mkdirSync(sourceDir);
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const registryDigest = sha256(fs.readFileSync("packages/component-contracts/src/components.json"));
const selectionPath = path.join(temp, "component-selection.json");
fs.writeFileSync(selectionPath, JSON.stringify({ targetFramework: "html", registryDigest, packageDigest: componentPackageDigest(process.cwd(), "html"), entries: [{ id: "primary action", logicalName: "Button/Primary/Default", decision: "reuse" }] }));
fs.writeFileSync(path.join(temp, "layout-contract.json"), JSON.stringify({ pattern: "pattern-a-two-pane", paneOrder: ["primary-navigation", "main-content"] }));
const manifestPath = path.join(temp, "component-usage.json");
const manifest = {
  schemaVersion: 3, targetFramework: "html", enforcement: "strict-source", previousOutputReuse: false,
  selection: { path: "component-selection.json", sha256: sha256(fs.readFileSync(selectionPath)), registryDigest },
  registry: "packages/component-contracts/src/components.json", sourceRoots: [path.relative(process.cwd(), sourceDir)],
  renderer: { package: "@text-to-ui/components-html", factoryImport: "renderHtmlComponent", styleImports: ["@text-to-ui/tokens", "@text-to-ui/components-html/styles.css", "@text-to-ui/components-html/pattern-shell.css"] },
  layout: { contractPath: "layout-contract.json", pattern: "pattern-a-two-pane", paneOrder: ["primary-navigation", "main-content"], structureDigest: "test-structure" },
  registered: [{ logicalName: "Button/Primary/Default", rendererKey: "button", usage: "primary action", requiredCallSites: 1, expectedRuntimeCount: 1, readinessLevel: "provisional", unresolvedParity: ["visualParity", "behaviorParity", "accessibilityParity"] }],
  contractBased: [], custom: []
};
const validator = path.resolve("skill-support/scripts/validate-web-component-reuse.mjs");
const run = (stage = "fast-preview") => spawnSync(process.execPath, [validator, "--manifest", manifestPath, "--project-root", process.cwd(), "--stage", stage], { encoding: "utf8" });
const source = 'import "@text-to-ui/tokens";\nimport "@text-to-ui/components-html/styles.css";\nimport "@text-to-ui/components-html/pattern-shell.css";\nimport { renderHtmlComponent } from "@text-to-ui/components-html";\nexport const action = renderHtmlComponent("button", { label: "保存", variant: "primary" });\n';
fs.writeFileSync(path.join(sourceDir, "main.js"), source);
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
assert.equal(run().status, 0, run().stderr);
fs.writeFileSync(path.join(sourceDir, "main.js"), 'document.body.innerHTML = `<button class="tui-button">保存</button>`;');
const lookalike = run();
assert.notEqual(lookalike.status, 0, "handwritten control must fail");
assert.match(lookalike.stderr, /must import|never rendered enough times/);
fs.writeFileSync(path.join(sourceDir, "main.js"), source);
const releaseBlocked = run("release");
assert.notEqual(releaseBlocked.status, 0, "provisional component must not pass release validation");
manifest.schemaVersion = 2;
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
const oldVersion = run();
assert.notEqual(oldVersion.status, 0, "old usage manifests must be rejected");
assert.match(oldVersion.stderr, /requires schemaVersion 3/);
fs.rmSync(temp, { recursive: true, force: true });
console.log("Web component reuse v3 validator tests passed.");
