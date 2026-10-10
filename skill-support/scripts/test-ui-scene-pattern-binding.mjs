#!/usr/bin/env node
import assert from "node:assert/strict";
import { normalizeUiScene } from "./ui-scene-core.mjs";
import { readPatternRegistry } from "./pattern-contract-lib.mjs";

const frame = (id, region, slot, children = []) => ({ id, name: id, type: "frame", region, ...(slot ? { slot } : {}), layout: { direction: "VERTICAL", width: "fill", height: "fill" }, style: { background: { kind: "transparent" } }, children });
const scene = {
  schemaVersion: 1,
  kind: "text-to-ui-scene",
  page: { name: "Pattern binding test", viewport: { width: 1728, height: 1152 }, pattern: "pattern-b-three-pane", stateScope: "default-visible" },
  nodes: [frame("root", "global", null, [
    frame("navigation", "primary-navigation", "primary-navigation-shell"),
    frame("title", "page", "global-title-layer"),
    frame("list", "secondary-list"),
    frame("detail", "main-detail")
  ])]
};
const normalized = normalizeUiScene(scene, { requireSlots: true });
assert.equal(normalized.resolvedPattern.pattern.id, "pattern-b-three-pane");
assert.match(normalized.patternDigest, /^[a-f0-9]{64}$/);
assert.match(normalized.structureDigest, /^[a-f0-9]{64}$/);
assert.throws(() => normalizeUiScene({ ...scene, nodes: [frame("bad", "unknown-pane")] }), /unknown Pattern region/);
assert.throws(() => normalizeUiScene({ ...scene, nodes: [frame("bad", "secondary-list", "main-detail-actions")] }), /belongs to 'main-detail'/);
for (const pattern of readPatternRegistry().patterns) {
  const patternScene = {
    ...scene,
    page: { ...scene.page, name: `${pattern.id} test`, pattern: pattern.id },
    nodes: [frame(`${pattern.id}-root`, "global", null, pattern.regions.map((region) => frame(`${pattern.id}-${region.id}`, region.id)))],
  };
  assert.equal(normalizeUiScene(patternScene).resolvedPattern.pattern.id, pattern.id);
}
console.log("UI Scene Pattern binding tests passed.");
