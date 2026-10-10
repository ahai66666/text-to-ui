#!/usr/bin/env node
import assert from "node:assert/strict";
import { readPatternRegistry, resolvePatternContract } from "./pattern-contract-lib.mjs";

const registry = readPatternRegistry();
const pageSpec = {
  shell: {
    pattern: "pattern-b-three-pane",
    paneOrder: ["primary-navigation", "secondary-list", "main-detail"],
    requiredSlots: ["primary-navigation-shell", "global-title-layer", "global-primary-action", "main-detail-actions"]
  }
};
const layoutContract = {
  pattern: "pattern-b-three-pane",
  paneOrder: ["primary-navigation", "secondary-list", "main-detail"],
  requiredSlots: ["primary-navigation-shell", "global-title-layer", "global-primary-action", "main-detail-actions"]
};
const resolved = resolvePatternContract("pattern-b-three-pane", { registry, pageSpec, layoutContract });
assert.equal(resolved.authority, "assets/design-system/pattern-contracts.json");
assert.deepEqual(resolved.pattern.paneOrder, layoutContract.paneOrder);
assert.equal(resolved.pattern.regions[1].surface, "surface");
assert.deepEqual(resolved.pattern.regions[1].dividerEdges, ["left", "right"]);
const actionSlot = resolved.pattern.slots.find((slot) => slot.id === "main-detail-actions");
assert.deepEqual(actionSlot.allowedComponentModes, ["icon", "icon-text-ghost"]);
assert.equal(actionSlot.overflow, "more-menu");
assert.throws(() => resolvePatternContract("pattern-b-three-pane", { registry, pageSpec: { shell: { pattern: "pattern-a-two-pane" } } }), /does not match/);
assert.throws(() => resolvePatternContract("pattern-b-three-pane", { registry, layoutContract: { pattern: "pattern-b-three-pane", paneOrder: ["secondary-list", "primary-navigation", "main-detail"] } }), /paneOrder/);
console.log("Pattern Contract resolution tests passed.");
