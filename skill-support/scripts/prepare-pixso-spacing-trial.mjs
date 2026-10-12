#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const [inputPath, outputPath, ...rest] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: prepare-pixso-spacing-trial.mjs <scene.json> <out.json> [trial-name]");
}

const trialName = rest.join(" ").trim() || "[text-to-ui:b9c64f0d127d3b39:coremail-native-root] Coremail Mail Workbench / v6 Native / Trial - secondary rail";
const scene = JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8"));
const spacingToken = (name) => ({
  tokenRef: name,
  variableRef: `$variable/${name}`,
  name,
});

const root = scene.nodes?.[0];
if (!root) throw new Error("Scene has no root node");

let changed = 0;
function setHorizontalRail(node) {
  node.layout ??= {};
  node.layout.padding = {
    ...(node.layout.padding ?? {}),
    left: spacingToken("space/4"),
    right: spacingToken("space/4"),
  };
  node.metadata = {
    ...(node.metadata ?? {}),
    spacingRail: "secondary-list/space-4",
  };
  changed += 1;
}

function visit(node) {
  if (node.id === "global-secondary-title-segment") setHorizontalRail(node);
  if (node.id === "secondary-list-heading" || node.id === "secondary-list-meta" || /^mail-group-\d+-heading$/.test(node.id)) {
    setHorizontalRail(node);
  }
  if (/^mail-\d+$/.test(node.id)) {
    node.layout ??= {};
    node.layout.padding = {
      ...(node.layout.padding ?? {}),
      left: spacingToken("space/4"),
      right: spacingToken("space/4"),
    };
    node.metadata = {
      ...(node.metadata ?? {}),
      spacingRail: "secondary-list/space-4",
    };
    changed += 1;
  }
  for (const child of node.children ?? []) visit(child);
}

visit(root);
root.name = trialName;
root.metadata = {
  ...(root.metadata ?? {}),
  targetFrame: trialName,
  spacingTrial: "secondary-list-outer-rail-space-4",
};
scene.page = {
  ...(scene.page ?? {}),
  name: trialName,
};
scene.execution = {
  ...(scene.execution ?? {}),
  canonicalKey: trialName,
  reimportTrial: "secondary-list-outer-rail-space-4",
};
scene.metadata = {
  ...(scene.metadata ?? {}),
  spacingTrial: {
    rail: "space/4",
    changedNodes: changed,
    note: "Second-pane direct section edges share one 12px outer rail; mail-item internal padding remains nested content spacing.",
  },
};

fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(scene, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, output: path.resolve(outputPath), trialName, changed }, null, 2));
