#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const planner = path.join(scriptDir, "plan-registered-reuse.mjs");
const registry = path.resolve(
  scriptDir,
  "../assets/design-system/pixso-component-registry.json",
);
const adapterMap = path.resolve(
  scriptDir,
  "../assets/design-system/framework-component-adapter-map.json",
);
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-reuse-"));

const pageSpec = {
  schemaVersion: 2,
  workflow: "html-first",
  componentContract: {
    adapterMap: "assets/design-system/framework-component-adapter-map.json",
    targetFramework: "react",
    sourceAvailability: "source",
    reuseStrategy: "registered-components",
    strictComponentParity: true,
    libraryPage: "NewComponents",
  },
  components: [
    {
      id: "primary-action",
      logicalName: "Button/Primary/Default",
      webSelector: "[data-component='primary-action']",
      connectionMode: "source-component",
      instanceContentStatus: "verified",
    },
  ],
};

const pageSpecPath = path.join(tempDir, "page-spec.json");
const mappingPath = path.join(tempDir, "mapping.json");
fs.writeFileSync(pageSpecPath, JSON.stringify(pageSpec));

function run(status, strictEligible) {
  fs.writeFileSync(
    mappingPath,
    JSON.stringify({
      rows: [
        {
          target: "Button/Primary/Default",
          status,
          strictEligible,
        },
      ],
    }),
  );
  return spawnSync(
    process.execPath,
    [
      planner,
      "--page-spec",
      pageSpecPath,
      "--registry",
      registry,
      "--mapping-table",
      mappingPath,
      "--adapter-map",
      adapterMap,
      "--strict",
    ],
    { encoding: "utf8" },
  );
}

const verified = run("verified", true);
assert.equal(verified.status, 0, verified.stderr);
assert.equal(JSON.parse(verified.stdout).strictReady, true);

const pending = run("mapped-pending-verification", false);
assert.equal(pending.status, 1);
const pendingPlan = JSON.parse(pending.stdout);
assert.equal(pendingPlan.strictReady, false);
assert.equal(pendingPlan.summary.pendingVerification, 1);
assert.match(pendingPlan.components[0].blockers.join(" "), /pending-verification/);

const missingLibraryPageSpec = JSON.parse(JSON.stringify(pageSpec));
delete missingLibraryPageSpec.componentContract.libraryPage;
fs.writeFileSync(pageSpecPath, JSON.stringify(missingLibraryPageSpec));
const missingLibraryPage = run("verified", true);
assert.equal(missingLibraryPage.status, 1);
const missingLibraryPlan = JSON.parse(missingLibraryPage.stdout);
assert.equal(missingLibraryPlan.libraryPageReady, false);
assert.match(
  missingLibraryPlan.globalBlockers.join(" "),
  /libraryPage is required/,
);

console.log("Registered reuse planner tests passed.");
