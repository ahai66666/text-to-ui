#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileUiScene, loadComponentMap, loadTokenResources, readJson } from "./ui-scene-lib.mjs";

const repo = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const uiScene = readJson(path.join(repo, "fixtures/mail-workbench-native-scene/ui-scene-complex-benchmark.json"));
const componentMap = loadComponentMap(path.join(repo, "text-to-ui/assets/design-system/pixso-native-component-map.json"));
const { pixsoScene, plan } = compileUiScene(uiScene, { componentMap, tokens: loadTokenResources() });
const operations = new Map(plan.operations.filter((operation) => operation.nodeId).map((operation) => [operation.nodeId, operation]));

assert.equal(plan.execution.sourceKind, "canonical-ui-scene");
assert.equal(operations.get("benchmark-primary")?.layout?.width?.value, 240);
assert.equal(operations.get("benchmark-secondary")?.layout?.width?.value, 360);
assert.deepEqual(operations.get("benchmark-secondary")?.style?.strokeEdges, ["left", "right"]);
for (const id of ["benchmark-primary-titlebar", "benchmark-secondary-titlebar", "benchmark-detail-titlebar"]) {
  assert.equal(operations.get(id)?.layout?.height?.value, 64, `${id} must use the canonical 64px Titlebar Token`);
}
assert.equal(operations.get("benchmark-nav-default")?.style?.fill?.kind, "transparent");
assert.equal(operations.get("benchmark-nav-selected")?.style?.fill?.name, "brand/10");
assert.equal(operations.get("benchmark-search")?.op, "create-frame", "Search must fall back when the mapped appearance is not approved");
assert.equal(operations.get("benchmark-search")?.style?.fill?.name, "neutral-dark/05");
assert.equal(operations.get("benchmark-dropdown")?.op, "create-instance");
for (const id of ["benchmark-reply", "benchmark-reply-all", "benchmark-forward", "benchmark-more"]) assert.equal(operations.get(id)?.op, "create-instance", `${id} must remain a real Instance`);
for (const id of ["benchmark-reply", "benchmark-reply-all", "benchmark-forward"]) assert.equal(operations.get(id)?.layout?.width, "hug", `${id} must fit its label content instead of using an equal fixed width`);
assert.equal(operations.get("benchmark-detail-titlebar")?.layout?.distribution, "SPACE_BETWEEN");
assert.equal(operations.get("benchmark-inbox-description")?.layout?.maxLines, 2);
assert.equal(operations.get("benchmark-inbox-description")?.layout?.overflow, "truncate");
assert.equal(plan.summary.instanceCount, 7);
assert.equal(plan.summary.iconSlotCount, 1);
assert.ok(plan.operations.filter((operation) => operation.op === "create-icon-slot").every((operation) => operation.iconSlot?.hotZone?.alignment === "CENTER" && operation.iconSlot?.hotZone?.axes === "BOTH"));
assert.ok(plan.operations.filter((operation) => operation.op === "hydrate-icon").every((operation) => operation.iconRef?.hotZone?.alignment === "CENTER" && operation.iconRef?.hotZone?.axes === "BOTH"));
for (const icon of plan.resources.icons.filter((item) => item.source === "lucide")) assert.ok(icon.svg.includes('stroke-width="1.5"'), `${icon.alias} must preserve the canonical Lucide Regular 1.5px source stroke`);
assert.equal(pixsoScene.source.kind, "canonical-ui-scene");
console.log(`Canonical UI Scene benchmark passed: ${plan.summary.nodeCount} nodes, ${plan.summary.instanceCount} Instances, ${plan.summary.tokenBindingCount} styled nodes.`);
