#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  validateConstraintContract,
  validatePageProvenance,
} from "./page-contract.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");
const mapPath = path.join(
  skillDir,
  "assets",
  "design-system",
  "dual-output-token-map.json",
);
const registryPath = path.join(
  skillDir,
  "assets",
  "design-system",
  "pixso-component-registry.json",
);

const inputPaths = process.argv.slice(2);
if (inputPaths.length === 0) {
  console.error("Usage: node scripts/validate-page-spec.mjs <page-spec.json> [...]");
  process.exit(2);
}

const tokenMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const registeredComponents = new Set(Object.values(registry.categories).flat());
const canonicalMappings = new Set(
  tokenMap.variableMappings
    .filter((entry) => entry.webCssVariable)
    .map(
      (entry) =>
        `${entry.sourceToken}|${entry.webCssVariable}|${entry.pixsoVariable}`,
    ),
);
for (const entry of tokenMap.semanticTokenMappings ?? []) {
  canonicalMappings.add(
    `${entry.sourceToken}|${entry.webCssVariable}|${entry.pixsoVariable}`,
  );
}
for (const entry of tokenMap.semanticColorMappings) {
  if (entry.composition === "single" && entry.pixsoVariables.length === 1) {
    canonicalMappings.add(
      `${entry.sourceToken}|${entry.webCssVariables[0]}|${entry.pixsoVariables[0]}`,
    );
  }
}

function collectForbiddenValues(value, pathLabel = "$", failures = []) {
  if (typeof value === "string") {
    if (/^#[0-9a-f]{3,8}$/i.test(value) || /\brgba?\(/i.test(value)) {
      failures.push(`${pathLabel}: hardcoded color ${value}`);
    }
    if (/^[0-9]+:[0-9]+$/.test(value) || /<svg\b/i.test(value)) {
      failures.push(`${pathLabel}: renderer-specific identifier or geometry is forbidden`);
    }
    return failures;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectForbiddenValues(entry, `${pathLabel}[${index}]`, failures),
    );
    return failures;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      collectForbiddenValues(entry, `${pathLabel}.${key}`, failures);
    }
  }
  return failures;
}

let failed = false;
for (const inputPath of inputPaths) {
  const absolutePath = path.resolve(inputPath);
  const spec = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  const failures = [];
  const warnings = [];

  if (![1, 2].includes(spec.schemaVersion)) {
    failures.push("schemaVersion must equal 1 or 2");
  }
  if (!["html-first", "visual-first", "direct-html"].includes(spec.workflow)) {
    failures.push("workflow must be html-first, visual-first, or direct-html");
  }
  if (!(spec.viewport?.width > 0) || !(spec.viewport?.height > 0)) {
    failures.push("viewport.width and viewport.height must be positive");
  }
  if (!spec.shell?.pattern) failures.push("shell.pattern is required");
  if (!['pattern-a-two-pane', 'pattern-b-three-pane', 'pattern-c-tool-workspace', 'pattern-d-inspector'].includes(spec.shell?.pattern)) {
    failures.push("shell.pattern must be one of the canonical Pattern IDs: pattern-a-two-pane, pattern-b-three-pane, pattern-c-tool-workspace, pattern-d-inspector");
  }

  if (spec.schemaVersion === 2) {
    failures.push(...validateConstraintContract(spec.constraintContract));
    failures.push(...validatePageProvenance(spec.provenance, spec));
  }

  if (spec.schemaVersion === 2) {
    const componentContract = spec.componentContract;
    if (!componentContract) {
      failures.push("componentContract is required for schemaVersion 2");
    } else {
      if (
        componentContract.adapterMap !==
        "assets/design-system/framework-component-adapter-map.json"
      ) {
        failures.push("componentContract.adapterMap must use the canonical adapter map");
      }
      if (!['react', 'vue', 'html'].includes(componentContract.targetFramework)) {
        failures.push("componentContract.targetFramework must be react, vue, or html");
      }
      if (!['source', 'compiled-only'].includes(componentContract.sourceAvailability)) {
        failures.push("componentContract.sourceAvailability must be source or compiled-only");
      }
      if (
        componentContract.reuseStrategy !== undefined &&
        !['registered-components', 'import-and-repair', 'native-pixso-scene'].includes(
          componentContract.reuseStrategy,
        )
      ) {
        failures.push(
          "componentContract.reuseStrategy must be registered-components, import-and-repair, or native-pixso-scene",
        );
      }
      if (typeof componentContract.strictComponentParity !== 'boolean') {
        failures.push("componentContract.strictComponentParity must be boolean");
      }
      if (
        componentContract.strictComponentParity === true &&
        componentContract.sourceAvailability === 'compiled-only'
      ) {
        failures.push("strict component parity requires framework source");
      }
    }
  }

  const contract = spec.tokenContract;
  if (!contract) {
    failures.push("tokenContract is required");
  } else {
    if (contract.map !== "assets/design-system/dual-output-token-map.json") {
      failures.push("tokenContract.map must use the canonical dual-output map");
    }
    if (contract.webStrategy !== "css-custom-properties") {
      failures.push("tokenContract.webStrategy must be css-custom-properties");
    }
    if (contract.pixsoStrategy !== "variable-bindings") {
      failures.push("tokenContract.pixsoStrategy must be variable-bindings");
    }
    if (contract.forbidHardcodedStyleValues !== true) {
      failures.push("tokenContract.forbidHardcodedStyleValues must be true");
    }
    if (!Array.isArray(contract.usedTokens) || contract.usedTokens.length === 0) {
      failures.push("tokenContract.usedTokens must contain at least one mapping");
    } else {
      const roles = new Set();
      for (const [index, token] of contract.usedTokens.entries()) {
        const key = `${token.sourceToken}|${token.webCssVariable}|${token.pixsoVariable}`;
        if (!token.role) failures.push(`usedTokens[${index}].role is required`);
        if (roles.has(token.role)) failures.push(`duplicate token role: ${token.role}`);
        roles.add(token.role);
        if (!canonicalMappings.has(key)) {
          failures.push(
            `usedTokens[${index}] is not a canonical Web/Pixso mapping: ${key}`,
          );
        }
      }
      for (const layoutToken of spec.layoutTokens ?? []) {
        if (!contract.usedTokens.some((token) => token.pixsoVariable === layoutToken)) {
          failures.push(`layout token is missing from tokenContract.usedTokens: ${layoutToken}`);
        }
      }
    }
  }

  if (!Array.isArray(spec.layoutTokens) || spec.layoutTokens.length === 0) {
    failures.push("layoutTokens must contain at least one Pixso variable path");
  }
  if (!Array.isArray(spec.components)) {
    failures.push("components must be an array");
  } else {
    const componentIds = new Set();
    for (const [index, component] of spec.components.entries()) {
      if (!component.id) failures.push(`components[${index}].id is required`);
      if (componentIds.has(component.id)) {
        failures.push(`duplicate component id: ${component.id}`);
      }
      componentIds.add(component.id);
      if (!registeredComponents.has(component.logicalName)) {
        failures.push(
          `components[${index}].logicalName is not registered: ${component.logicalName}`,
        );
      }
      if (!component.webSelector) {
        failures.push(`components[${index}].webSelector is required`);
      }
      if (
        component.connectionMode &&
        ![
          "source-component",
          "third-party-wrapper",
          "compiled-runtime-fallback",
        ].includes(component.connectionMode)
      ) {
        failures.push(`components[${index}].connectionMode is invalid`);
      }
      if (component.textSlots) {
        if (!["verified", "blocked"].includes(component.instanceContentStatus)) {
          failures.push(
            `components[${index}].instanceContentStatus must be verified or blocked when textSlots are declared`,
          );
        }
        if (component.instanceContentStatus === "blocked") {
          warnings.push(
            `component text slots are not instance-safe: ${component.logicalName}`,
          );
        }
      }
    }
  }

  failures.push(...collectForbiddenValues(spec));

  if (failures.length > 0) {
    failed = true;
    console.error(`Page spec invalid: ${absolutePath}`);
    failures.forEach((failure) => console.error(`- ${failure}`));
  } else {
    console.log(
      `Page spec valid: ${absolutePath} ` +
        `(${contract.usedTokens.length} token mappings, ${spec.components.length} components)`,
    );
    warnings.forEach((warning) => console.warn(`- Warning: ${warning}`));
  }
}

if (failed) process.exit(1);
