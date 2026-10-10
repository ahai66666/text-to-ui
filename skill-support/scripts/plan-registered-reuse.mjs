#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");

const defaults = {
  registry: path.join(skillDir, "assets/design-system/pixso-component-registry.json"),
  mappingTable: path.join(
    skillDir,
    "assets/design-system/harmonyos-component-mapping-table.json",
  ),
  adapterMap: path.join(
    skillDir,
    "assets/design-system/framework-component-adapter-map.json",
  ),
};

function usage() {
  console.error(
    "Usage: node scripts/plan-registered-reuse.mjs --page-spec <file> " +
      "[--out <file>] [--strict] [--registry <file>] " +
      "[--mapping-table <file>] [--adapter-map <file>]",
  );
}

function parseArgs(argv) {
  const options = { ...defaults, strict: false, out: null, pageSpec: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--strict") {
      options.strict = true;
      continue;
    }
    const key = {
      "--page-spec": "pageSpec",
      "--out": "out",
      "--registry": "registry",
      "--mapping-table": "mappingTable",
      "--adapter-map": "adapterMap",
    }[arg];
    if (!key || !argv[index + 1]) {
      usage();
      process.exit(2);
    }
    options[key] = path.resolve(argv[index + 1]);
    index += 1;
  }
  if (!options.pageSpec) {
    usage();
    process.exit(2);
  }
  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function actionForStatus(status) {
  return {
    verified: "instantiate-linked-component",
    "mapped-pending-verification": "verify-live-component",
    "mapped-needs-rebuild": "repair-shared-component",
    "missing-target": "create-registered-component",
  }[status] ?? "repair-registry-mapping";
}

const options = parseArgs(process.argv.slice(2));
const pageSpec = readJson(options.pageSpec);
const registry = readJson(options.registry);
const mappingTable = readJson(options.mappingTable);
const adapterMap = readJson(options.adapterMap);

const registered = new Set(Object.values(registry.categories ?? {}).flat());
const mappingRows = new Map(
  (mappingTable.rows ?? []).map((row) => [row.target, row]),
);
const framework = pageSpec.componentContract?.targetFramework ?? "html";
const frameworkSupported = Boolean(adapterMap.frameworks?.[framework]);
const strategy =
  pageSpec.componentContract?.reuseStrategy ?? "import-and-repair";
const pixsoWorkflow = ["html-first", "visual-first"].includes(pageSpec.workflow);
const libraryPage = pageSpec.componentContract?.libraryPage ?? null;
const expectedLibraryPage = registry.pixso?.componentLibraryPage ?? null;

const occurrences = new Map();
for (const component of pageSpec.components ?? []) {
  const current = occurrences.get(component.logicalName) ?? {
    logicalName: component.logicalName,
    count: 0,
    ids: [],
    connectionModes: new Set(),
    instanceContentStatuses: new Set(),
  };
  current.count += 1;
  current.ids.push(component.id);
  if (component.connectionMode) current.connectionModes.add(component.connectionMode);
  if (component.instanceContentStatus) {
    current.instanceContentStatuses.add(component.instanceContentStatus);
  }
  occurrences.set(component.logicalName, current);
}

const components = [...occurrences.values()].map((component) => {
  const row = mappingRows.get(component.logicalName);
  let status = row?.status ?? "missing-mapping-row";
  const blockers = [];
  if (!registered.has(component.logicalName)) {
    status = "unregistered";
    blockers.push("logicalName is absent from the component registry");
  } else if (!row) {
    blockers.push("component has no HarmonyOS mapping-table row");
  } else if (row.status !== "verified" || row.strictEligible !== true) {
    blockers.push(`Pixso registry status is ${row.status}`);
  }
  if (component.connectionModes.has("compiled-runtime-fallback")) {
    blockers.push("Web implementation uses compiled-runtime-fallback");
  }
  if (component.instanceContentStatuses.has("blocked")) {
    blockers.push("instance content slot is blocked");
  }
  return {
    logicalName: component.logicalName,
    occurrences: component.count,
    componentIds: component.ids,
    mappingStatus: status,
    strictEligible:
      status === "verified" && row?.strictEligible === true && blockers.length === 0,
    webAction: component.connectionModes.has("third-party-wrapper")
      ? "render-first-party-wrapper"
      : component.connectionModes.has("compiled-runtime-fallback")
        ? "runtime-adapter-non-strict"
        : "render-source-component",
    pixsoAction: actionForStatus(status),
    blockers,
  };
});

const globalBlockers = [];
if (strategy !== "registered-components") {
  globalBlockers.push("componentContract.reuseStrategy is not registered-components");
}
if (!frameworkSupported) {
  globalBlockers.push(`framework adapter is unavailable: ${framework}`);
}
if (pageSpec.componentContract?.sourceAvailability === "compiled-only") {
  globalBlockers.push("framework source is unavailable");
}
if (pixsoWorkflow && strategy === "registered-components" && !libraryPage) {
  globalBlockers.push(
    "componentContract.libraryPage is required for Pixso reuse",
  );
}
if (
  pixsoWorkflow &&
  strategy === "registered-components" &&
  expectedLibraryPage &&
  libraryPage &&
  libraryPage !== expectedLibraryPage
) {
  globalBlockers.push(
    "component library page must be " +
      expectedLibraryPage +
      ", received " +
      libraryPage,
  );
}

const strictReady =
  globalBlockers.length === 0 &&
  components.length > 0 &&
  components.every((component) => component.strictEligible);
const strictRequested =
  options.strict ||
  pageSpec.componentContract?.strictComponentParity === true ||
  (pixsoWorkflow && strategy === "registered-components");

const plan = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  pageSpec: options.pageSpec,
  strategy,
  pixsoWorkflow,
  libraryPage,
  expectedLibraryPage,
  libraryPageReady:
    !pixsoWorkflow ||
    strategy !== "registered-components" ||
    (Boolean(libraryPage) &&
      (!expectedLibraryPage || libraryPage === expectedLibraryPage)),
  targetFramework: framework,
  frameworkSupported,
  strictRequested,
  strictReady,
  summary: {
    componentOccurrences: [...occurrences.values()].reduce(
      (sum, component) => sum + component.count,
      0,
    ),
    uniqueComponents: components.length,
    verified: components.filter((component) => component.mappingStatus === "verified").length,
    pendingVerification: components.filter(
      (component) => component.mappingStatus === "mapped-pending-verification",
    ).length,
    needsRebuild: components.filter(
      (component) => component.mappingStatus === "mapped-needs-rebuild",
    ).length,
    missing: components.filter((component) =>
      ["missing-target", "missing-mapping-row", "unregistered"].includes(
        component.mappingStatus,
      ),
    ).length,
  },
  generationOrder: [
    "resolve-pattern-and-layout-tokens",
    "render-web-from-framework-adapters",
    "create-pixso-pattern-skeleton",
    "instantiate-verified-linked-components",
    "apply-instance-safe-content",
    "bind-page-only-variables-and-styles",
    "run-dual-output-audit",
  ],
  globalBlockers,
  components,
};

const output = `${JSON.stringify(plan, null, 2)}\n`;
if (options.out) fs.writeFileSync(options.out, output);
process.stdout.write(output);

if (strictRequested && !strictReady) process.exit(1);
