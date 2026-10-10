#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

const pageSpecPath = valueAfter("--page-spec");
const sourceRootArg = valueAfter("--source-root");
if (!pageSpecPath) {
  console.error(
    "Usage: node scripts/validate-framework-component-contract.mjs " +
      "--page-spec <page-spec.json> [--source-root <project-root>]",
  );
  process.exit(2);
}

const skillRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const spec = JSON.parse(
  fs.readFileSync(path.resolve(pageSpecPath), "utf8"),
);
const adapter = JSON.parse(
  fs.readFileSync(
    path.join(
      skillRoot,
      "assets/design-system/framework-component-adapter-map.json",
    ),
    "utf8",
  ),
);
const registry = JSON.parse(
  fs.readFileSync(
    path.join(skillRoot, "assets/design-system/pixso-component-registry.json"),
    "utf8",
  ),
);
const registered = new Set(Object.values(registry.categories).flat());
const contract = spec.componentContract;
const failures = [];
const warnings = [];

if (spec.schemaVersion !== 2) {
  failures.push("framework component validation requires page-spec schemaVersion 2");
}
if (!contract) {
  failures.push("componentContract is required");
}

const targetFramework = contract?.targetFramework;
if (!adapter.frameworks?.[targetFramework]) {
  failures.push(`unsupported targetFramework: ${targetFramework ?? "missing"}`);
}
if (
  contract?.adapterMap !==
  "assets/design-system/framework-component-adapter-map.json"
) {
  failures.push("componentContract.adapterMap is not canonical");
}

const strict = contract?.strictComponentParity === true;
const sourceRoot = sourceRootArg ? path.resolve(sourceRootArg) : null;
if (strict && !sourceRoot) {
  failures.push("strict component parity requires --source-root");
}
if (
  strict &&
  contract?.sourceAvailability !== "source"
) {
  failures.push("strict component parity requires sourceAvailability=source");
}

for (const [index, component] of (spec.components ?? []).entries()) {
  const label = `components[${index}] ${component.id ?? "unknown"}`;
  if (!registered.has(component.logicalName)) {
    failures.push(`${label}: logicalName is not registered`);
  }
  const mode = adapter.connectionModes?.[component.connectionMode];
  if (!mode) {
    failures.push(`${label}: invalid connectionMode`);
  } else if (strict && mode.strictEligible !== true) {
    failures.push(`${label}: ${component.connectionMode} is not strict eligible`);
  }

  const frameworkBinding = component.frameworkBinding;
  if (!frameworkBinding) {
    failures.push(`${label}: frameworkBinding is required`);
  } else {
    if (frameworkBinding.framework !== targetFramework) {
      failures.push(`${label}: frameworkBinding.framework does not match target`);
    }
    if (!frameworkBinding.implementationPath) {
      failures.push(`${label}: implementationPath is required`);
    } else if (sourceRoot) {
      const absoluteImplementation = path.resolve(
        sourceRoot,
        frameworkBinding.implementationPath,
      );
      const relative = path.relative(sourceRoot, absoluteImplementation);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        failures.push(`${label}: implementationPath escapes source root`);
      } else if (!fs.existsSync(absoluteImplementation)) {
        failures.push(`${label}: implementation source is missing`);
      } else if (mode?.strictEligible) {
        const source = fs.readFileSync(absoluteImplementation, "utf8");
        const expectedExtension =
          adapter.frameworks[targetFramework]?.sourceExtensions ?? [];
        if (!expectedExtension.includes(path.extname(absoluteImplementation))) {
          failures.push(`${label}: implementation extension is not supported`);
        }
        for (const evidence of [
          component.id,
          component.logicalName,
          "data-component",
          "data-logical-component",
          "data-variant",
          "data-state",
        ]) {
          if (!source.includes(evidence)) {
            failures.push(`${label}: source evidence is missing ${evidence}`);
          }
        }
        if (/\b(?:bg|text|border|fill|stroke)-\[#/i.test(source)) {
          failures.push(`${label}: source contains arbitrary Tailwind values`);
        }
      }
    }
  }

  const pixso = component.pixsoBinding;
  if (!pixso) {
    failures.push(`${label}: pixsoBinding is required`);
  } else {
    if (pixso.registryName !== component.logicalName) {
      failures.push(`${label}: Pixso registryName must equal logicalName`);
    }
    if (pixso.linkedInstanceRequired !== true) {
      failures.push(`${label}: linkedInstanceRequired must equal true`);
    }
    if (!pixso.variantAxes || typeof pixso.variantAxes !== "object") {
      failures.push(`${label}: Pixso variantAxes are required`);
    }
    if (!pixso.propertyMap || typeof pixso.propertyMap !== "object") {
      failures.push(`${label}: Pixso propertyMap is required`);
    }
  }

  if (strict && component.instanceContentStatus === "blocked") {
    failures.push(`${label}: blocked instance content is forbidden in strict mode`);
  }
  if (!strict && component.connectionMode === "compiled-runtime-fallback") {
    warnings.push(`${label}: compiled fallback is visual/contract parity only`);
  }
}

if (failures.length > 0) {
  console.error("Framework component contract invalid:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
console.log(
  `Framework component contract valid: ${targetFramework}, ` +
    `${spec.components?.length ?? 0} components, strict=${strict}.`,
);
