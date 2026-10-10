#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

const adapter = readJson(
  "assets/design-system/framework-component-adapter-map.json",
);
const registry = readJson("assets/design-system/pixso-component-registry.json");
const fixture = readJson("fixtures/framework-component-contract/contract.json");
const registered = new Set(Object.values(registry.categories).flat());
const failures = [];

if (adapter.schemaVersion !== 1) failures.push("adapter schemaVersion must equal 1");
if (adapter.contractVersion !== 2) failures.push("contractVersion must equal 2");

const requiredModes = [
  "source-component",
  "third-party-wrapper",
  "compiled-runtime-fallback",
];
for (const mode of requiredModes) {
  if (!adapter.connectionModes?.[mode]) {
    failures.push(`missing connection mode: ${mode}`);
  }
}
if (adapter.connectionModes?.["compiled-runtime-fallback"]?.strictEligible !== false) {
  failures.push("compiled-runtime-fallback must not be strict eligible");
}

const requiredFrameworks = ["react", "vue", "html"];
const canonicalAttributes = Object.values(adapter.canonicalAttributes ?? {});
for (const framework of requiredFrameworks) {
  const definition = adapter.frameworks?.[framework];
  if (!definition) {
    failures.push(`missing framework adapter: ${framework}`);
    continue;
  }
  for (const attribute of canonicalAttributes) {
    if (!definition.requiredAttributes?.includes(attribute)) {
      failures.push(`${framework} does not require ${attribute}`);
    }
  }
}

if (!registered.has(fixture.logicalName)) {
  failures.push(`fixture logicalName is not registered: ${fixture.logicalName}`);
}
if (fixture.pixsoBinding?.registryName !== fixture.logicalName) {
  failures.push("fixture Pixso registryName must equal logicalName");
}
if (fixture.pixsoBinding?.linkedInstanceRequired !== true) {
  failures.push("fixture must require a linked Pixso instance");
}

for (const framework of requiredFrameworks) {
  const implementation = fixture.implementations?.[framework];
  if (!implementation) {
    failures.push(`fixture implementation is missing: ${framework}`);
    continue;
  }
  if (!adapter.connectionModes?.[implementation.connectionMode]?.strictEligible) {
    failures.push(`${framework} fixture is not strict eligible`);
  }
  const absolutePath = path.join(
    root,
    "fixtures/framework-component-contract",
    implementation.path,
  );
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${framework} fixture source is missing: ${implementation.path}`);
    continue;
  }
  const source = fs.readFileSync(absolutePath, "utf8");
  for (const value of [
    fixture.componentId,
    fixture.logicalName,
    "data-component",
    "data-logical-component",
    "data-variant",
    "data-state",
  ]) {
    if (!source.includes(value)) {
      failures.push(`${framework} fixture does not contain ${value}`);
    }
  }
  if (/\b(?:bg|text|border|fill|stroke)-\[#/i.test(source)) {
    failures.push(`${framework} fixture contains arbitrary Tailwind values`);
  }
}

if (failures.length > 0) {
  console.error("Framework component adapter map is invalid:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Framework component adapter map valid: ${requiredFrameworks.length} frameworks, ` +
    `${requiredModes.length} connection modes, 1 cross-framework fixture.`,
);
