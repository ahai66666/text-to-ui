#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validator = path.join(
  root,
  "scripts/validate-framework-component-contract.mjs",
);
const fixtureRoot = path.join(root, "fixtures/framework-component-contract");
const validSpecPath = path.join(fixtureRoot, "page-spec.react.json");

function run(specPath) {
  return spawnSync(
    process.execPath,
    [
      validator,
      "--page-spec",
      specPath,
      "--source-root",
      fixtureRoot,
    ],
    { encoding: "utf8" },
  );
}

const valid = run(validSpecPath);
if (valid.status !== 0) {
  console.error(valid.stdout);
  console.error(valid.stderr);
  process.exit(1);
}

const invalidSpec = JSON.parse(fs.readFileSync(validSpecPath, "utf8"));
invalidSpec.components[0].connectionMode = "compiled-runtime-fallback";
const temporaryDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "text-to-ui-component-contract-"),
);
const invalidSpecPath = path.join(temporaryDirectory, "invalid.json");
fs.writeFileSync(invalidSpecPath, JSON.stringify(invalidSpec, null, 2));
const invalid = run(invalidSpecPath);
if (invalid.status === 0) {
  console.error("Strict validator accepted compiled-runtime-fallback");
  process.exit(1);
}
if (!`${invalid.stdout}\n${invalid.stderr}`.includes("not strict eligible")) {
  console.error("Strict validator failed for an unexpected reason");
  console.error(invalid.stdout);
  console.error(invalid.stderr);
  process.exit(1);
}

console.log(
  "Framework component contract tests passed: source component accepted, " +
    "compiled runtime fallback rejected in strict mode.",
);
