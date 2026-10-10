#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPatternRegistry, resolvePatternContract } from "./pattern-contract-lib.mjs";
import { resolveTitlebarScene } from "./titlebar-scene.mjs";

const repositoryRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const registry = readPatternRegistry(path.join(repositoryRoot, "skill-support/assets/design-system/pattern-contracts.json"));

const titlebar = (size) => ({
  id: "page-titlebar",
  logicalName: "Titlebar/Default",
  rendererKey: "titlebar",
  semanticContext: "global-titlebar",
  slot: "global-title-layer",
  options: size ? { size } : {}
});

for (const patternId of ["pattern-a-two-pane", "pattern-c-tool-workspace", "pattern-d-inspector"]) {
  const resolvedPattern = resolvePatternContract(patternId, { registry });
  const scene = resolveTitlebarScene({ repositoryRoot, resolvedPattern, bindings: [titlebar()] });
  assert.equal(scene.kind, "text-to-ui-titlebar-scene");
  assert.equal(scene.fallbackPreset, false);
  assert.equal(scene.preset, `${patternId}-default-titlebar`);
  assert.equal(scene.primaryTitlebar.size, "large");
  assert.equal(scene.pagePolicy.required, true);
  assert.deepEqual(scene.pagePolicy.allowedSizes, ["medium", "large", "xlarge"]);
  assert.equal(scene.segments.length, 1);

  const medium = resolveTitlebarScene({ repositoryRoot, resolvedPattern, bindings: [titlebar("medium")] });
  assert.equal(medium.primaryTitlebar.size, "medium");
  assert.throws(() => resolveTitlebarScene({ repositoryRoot, resolvedPattern, bindings: [titlebar("small")] }), /Titlebar_S/);
  assert.throws(() => resolveTitlebarScene({ repositoryRoot, resolvedPattern, bindings: [] }), /exactly one global Titlebar/);
  assert.throws(() => resolveTitlebarScene({ repositoryRoot, resolvedPattern, bindings: [{ ...titlebar(), logicalName: "Button/Primary/Default", rendererKey: "button" }] }), /registered Titlebar/);
}

console.log("Universal Pattern Titlebar Scene policy passed: all canonical Pattern pages require one Titlebar and a registered M/L/XL size.");
