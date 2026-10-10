#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { pageSpecSha256, writeJson } from "./page-contract.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const validator = path.join(scriptDir, "validate-page-contract.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-page-contract-"));

function fileSha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function runValidator(args) {
  return spawnSync(process.execPath, [validator, ...args], {
    encoding: "utf8",
  });
}

try {
  const pageSpecPath = path.join(tempDir, "page-spec.json");
  const htmlPath = path.join(tempDir, "index.html");
  const manifestPath = path.join(tempDir, "run-manifest.json");
  const runId = "contract-test-run";

  const pageSpec = {
    schemaVersion: 2,
    workflow: "direct-html",
    viewport: { width: 1728, height: 1152 },
    shell: { pattern: "test-shell" },
    constraintContract: {
      schemaVersion: 1,
      mode: "block-on-failure",
      source: "test",
      must: [
        {
          id: "root.exists",
          description: "The root exists once.",
          scope: "rendered-markup",
          assertion: {
            kind: "selector-count",
            selector: "[data-component='root']",
            min: 1,
            max: 1,
          },
        },
      ],
      mustNot: [
        {
          id: "no.avatar",
          description: "Avatar markup is forbidden.",
          scope: "rendered-markup",
          assertion: { kind: "pattern-present", patterns: ["avatar"] },
        },
      ],
      acceptance: {
        requiredStates: [
          {
            id: "selected",
            description: "The selected state is represented.",
            scope: "rendered-markup",
            assertion: {
              kind: "selector-count",
              selector: "[data-state='selected']",
              min: 1,
            },
          },
        ],
        requiredInteractions: [
          {
            id: "select-project",
            description: "The selection handler exists.",
            scope: "runtime-source",
            assertion: { kind: "pattern-present", patterns: ["selectProject"] },
          },
        ],
        requiredArtifacts: [
          { id: "page-spec", kind: "page-spec" },
          { id: "final-html", kind: "html" },
          { id: "run-manifest", kind: "manifest" },
        ],
      },
    },
    provenance: {
      runId,
      hashAlgorithm: "sha256",
      pageSpecSha256: "",
    },
  };
  pageSpec.provenance.pageSpecSha256 = pageSpecSha256(pageSpec);
  writeJson(pageSpecPath, pageSpec);

  fs.writeFileSync(
    htmlPath,
    `<!doctype html><html><head><meta name="text-to-ui-run-id" content="${runId}"><meta name="text-to-ui-page-spec-sha256" content="${pageSpec.provenance.pageSpecSha256}"><meta name="text-to-ui-page-spec-path" content="${pageSpecPath}"></head><body><main data-component="root"><button data-state="selected">Selected</button></main><script>function selectProject(){}</script></body></html>`,
  );
  writeJson(manifestPath, {
    schemaVersion: 1,
    runId,
    pageSpecPath,
    pageSpecSha256: pageSpec.provenance.pageSpecSha256,
    artifacts: [
      { kind: "page-spec", path: pageSpecPath, runId, pageSpecSha256: pageSpec.provenance.pageSpecSha256, fileSha256: fileSha256(pageSpecPath) },
      { kind: "html", path: htmlPath, runId, pageSpecSha256: pageSpec.provenance.pageSpecSha256, fileSha256: fileSha256(htmlPath) },
    ],
  });

  const valid = runValidator([
    "--page-spec", pageSpecPath,
    "--html", htmlPath,
    "--manifest", manifestPath,
  ]);
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);

  fs.writeFileSync(
    htmlPath,
    fs.readFileSync(htmlPath, "utf8").replace("<main", "<div class=\"avatar\"></div><main"),
  );
  const forbidden = runValidator([
    "--page-spec", pageSpecPath,
    "--html", htmlPath,
    "--manifest", manifestPath,
  ]);
  assert.notEqual(forbidden.status, 0);
  assert.match(forbidden.stdout, /mustNot no\.avatar failed/);

  fs.writeFileSync(htmlPath, fs.readFileSync(htmlPath, "utf8").replace("<div class=\"avatar\"></div>", ""));
  const staleManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  staleManifest.runId = "stale-run";
  writeJson(manifestPath, staleManifest);
  const stale = runValidator([
    "--page-spec", pageSpecPath,
    "--html", htmlPath,
    "--manifest", manifestPath,
  ]);
  assert.notEqual(stale.status, 0);
  assert.match(stale.stdout, /run manifest runId mismatch/);

  console.log("Page contract validator tests passed: valid contract accepted; forbidden and stale artifacts rejected.");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
