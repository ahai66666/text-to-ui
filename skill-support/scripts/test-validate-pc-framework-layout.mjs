import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readPatternRegistry } from "./pattern-contract-lib.mjs";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tui-layout-contract-"));
const contractPath = path.join(temp, "layout-contract.json");
const validator = path.resolve("skill-support/scripts/validate-pc-framework-layout.mjs");
const contract = {
  schemaVersion: 1,
  platform: "harmonyos-pc",
  pattern: "pattern-b-three-pane",
  references: ["references/harmonyos-layout-patterns.md#pattern-b", "references/layout-system.md"],
  viewport: { width: 1728, height: 1152, minWidth: 1100, minHeight: 720 },
  paneOrder: ["primary-navigation", "secondary-list", "main-detail"],
  globalTitleLayer: true,
  titleSegments: ["primary-navigation", "secondary-list", "main-detail"],
  primaryActionSlot: "primary-navigation-shell",
  finalPaneLeadingSlot: "main-detail-operations",
  requiredSlots: ["primary-navigation-shell", "global-title-layer", "global-primary-action", "main-detail-actions"],
  insetOwners: {
    "primary-navigation": "primary-navigation-shell",
    "secondary-list": "secondary-list-shell",
    "main-detail": "main-detail-shell",
  },
  scrollOwners: ["primary-navigation", "secondary-list", "main-detail"],
  resizeBehavior: "fixed-panes-flexible-final-pane",
  contentMode: "default-content",
  layoutTokens: ["layout/sidebar-width", "layout/secondary-pane-width", "space/6"],
  geometry: readPatternRegistry().patterns.find((entry) => entry.id === "pattern-b-three-pane").geometry,
};
const run = () => spawnSync(process.execPath, [validator, "--contract", contractPath], { encoding: "utf8" });

fs.writeFileSync(contractPath, JSON.stringify(contract));
const valid = run();
assert.equal(valid.status, 0, valid.stderr);

const variants = [
  { pattern: "pattern-a-two-pane", panes: ["primary-navigation", "main-content"], finalSlot: "main-content-title", required: ["primary-navigation-shell", "global-title-layer", "global-primary-action"], inset: { "primary-navigation": "primary-navigation-shell", "main-content": "main-content-shell" }, scroll: ["main-content"] },
  { pattern: "pattern-b-three-pane", panes: ["primary-navigation", "secondary-list", "main-detail"], finalSlot: "main-detail-operations", required: ["primary-navigation-shell", "global-title-layer", "global-primary-action", "main-detail-actions"], inset: { "primary-navigation": "primary-navigation-shell", "secondary-list": "secondary-list-shell", "main-detail": "main-detail-shell" }, scroll: ["secondary-list", "main-detail"] },
  { pattern: "pattern-c-tool-workspace", panes: ["primary-navigation", "tool-workspace"], finalSlot: "main-content-title", required: ["primary-navigation-shell", "global-title-layer", "workspace-toolbar"], inset: { "primary-navigation": "primary-navigation-shell", "tool-workspace": "tool-workspace-shell" }, scroll: ["tool-workspace"] },
  { pattern: "pattern-d-inspector", panes: ["primary-navigation", "secondary-or-canvas", "main-content", "inspector"], finalSlot: "main-content-title", required: ["global-title-layer", "inspector-toggle"], inset: { "primary-navigation": "primary-navigation-shell", "secondary-or-canvas": "workspace-shell", "main-content": "main-content-shell", "inspector": "inspector-shell" }, scroll: ["secondary-or-canvas", "main-content", "inspector"] }
];
const baseContract = JSON.parse(JSON.stringify(contract));
for (const variant of variants) {
  Object.assign(contract, baseContract, { pattern: variant.pattern, paneOrder: variant.panes, titleSegments: variant.panes, finalPaneLeadingSlot: variant.finalSlot, requiredSlots: variant.required, insetOwners: variant.inset, scrollOwners: variant.scroll, geometry: readPatternRegistry().patterns.find((entry) => entry.id === variant.pattern).geometry });
  fs.writeFileSync(contractPath, JSON.stringify(contract));
  const variantResult = run();
  assert.equal(variantResult.status, 0, `${variant.pattern}: ${variantResult.stderr}`);
}
Object.assign(contract, baseContract);
fs.writeFileSync(contractPath, JSON.stringify(contract));

contract.paneOrder = ["main-detail", "primary-navigation", "secondary-list"];
fs.writeFileSync(contractPath, JSON.stringify(contract));
const wrongOrder = run();
assert.notEqual(wrongOrder.status, 0, "incorrect pane order must fail");

contract.paneOrder = ["primary-navigation", "secondary-list", "main-detail"];
contract.globalTitleLayer = false;
fs.writeFileSync(contractPath, JSON.stringify(contract));
const missingTitleLayer = run();
assert.notEqual(missingTitleLayer.status, 0, "missing global title layer must fail");

contract.globalTitleLayer = true;
delete contract.insetOwners["secondary-list"];
fs.writeFileSync(contractPath, JSON.stringify(contract));
const missingInsetOwner = run();
assert.notEqual(missingInsetOwner.status, 0, "missing pane inset owner must fail");

contract.insetOwners["secondary-list"] = "secondary-list-shell";
contract.layoutTokens = ["17px"];
fs.writeFileSync(contractPath, JSON.stringify(contract));
const literalLayout = run();
assert.notEqual(literalLayout.status, 0, "literal layout values must fail");

fs.rmSync(temp, { recursive: true, force: true });
console.log("PC framework layout validator tests passed.");
