#!/usr/bin/env node

import assert from "node:assert/strict";
import { compileOperationPlan } from "./pixso-native-scene-lib.mjs";

const semanticIcon = {
  alias: "action/add",
  source: "fixture",
  svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>',
};
const iconNode = (id, size) => ({
  id,
  name: id,
  type: "icon",
  region: "main",
  icon: { alias: semanticIcon.alias, size },
  layout: { direction: "VERTICAL", width: "fixed", height: "fixed", padding: {}, gap: null, align: "CENTER", clipsContent: false },
  style: { fill: { ref: "$variable/neutral-dark/90" } },
  metadata: { source: "semantic-icon" },
  children: [],
});
const scene = {
  page: { name: "Generic Tool", targetPage: "generic" },
  resources: { componentLibraryPage: "NewComponents", variableAliases: {}, variables: [], styles: [], icons: [semanticIcon] },
  nodes: [{
    id: "root",
    name: "Generic Tool",
    type: "frame",
    region: "global",
    layout: { direction: "HORIZONTAL", width: "hug", height: "hug", padding: {}, gap: null, align: "MIN", clipsContent: false },
    style: {},
    metadata: {},
    children: [iconNode("leading-icon", 20), iconNode("trailing-icon", 24)],
  }],
};

const plan = compileOperationPlan(scene, { componentMap: { libraryPage: "NewComponents" } });
const slots = plan.operations.filter((operation) => operation.op === "create-icon-slot");
const hydration = plan.operations.filter((operation) => operation.op === "hydrate-icon");
assert.deepEqual(plan.phases.map((phase) => phase.id), ["resources", "layout", "icon-hydration"]);
assert.deepEqual(slots.map((operation) => operation.nodeId), ["leading-icon", "trailing-icon"]);
assert.deepEqual(hydration.map((operation) => operation.targetNodeId), ["leading-icon", "trailing-icon"]);
assert.ok(hydration.every((operation) => !operation.iconRef.svg));
assert.ok(slots.every((operation) => operation.iconSlot.hotZone?.alignment === "CENTER" && operation.iconSlot.hotZone?.axes === "BOTH"));
assert.ok(hydration.every((operation) => operation.iconRef.hotZone?.alignment === "CENTER" && operation.iconRef.hotZone?.axes === "BOTH"));
assert.equal(plan.resources.icons.length, 1);
assert.equal((JSON.stringify(plan).match(/<svg/g) ?? []).length, 1, "SVG payload must occur once in the complete plan");
assert.ok(plan.operations.indexOf(slots.at(-1)) < plan.operations.indexOf(hydration[0]), "all layout Slots must precede icon hydration");
console.log("Pixso two-phase icon pipeline test passed for a generic Scene.");
