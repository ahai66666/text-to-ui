#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolvePixsoImportUrl } from "./resolve-pixso-import-url.mjs";

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-url-"));
const htmlRoot = path.join(sandbox, "coremail-mail-home-v5");
fs.mkdirSync(path.join(htmlRoot, "pages"), { recursive: true });
fs.writeFileSync(path.join(htmlRoot, "index.html"), "<!doctype html><main>Coremail</main>\n");
fs.writeFileSync(path.join(htmlRoot, "pages", "detail.html"), "<!doctype html><main>Detail</main>\n");

const rootUrl = "http://127.0.0.1:4173/outputs/coremail-mail-home-v5/";
assert.deepEqual(resolvePixsoImportUrl({ htmlRoot, requestedUrl: rootUrl }), {
  url: new URL(rootUrl).href,
  requestedUrl: new URL(rootUrl).href,
  corrected: false,
  reason: null,
});

const malformed = `${rootUrl}使用Text`;
const corrected = resolvePixsoImportUrl({ htmlRoot, requestedUrl: malformed });
assert.equal(corrected.url, new URL(rootUrl).href);
assert.equal(corrected.requestedUrl, new URL(malformed).href);
assert.equal(corrected.corrected, true);
assert.equal(corrected.reason, "removed-nonexistent-suffix:使用Text");

const realFile = `${rootUrl}pages/detail.html`;
assert.equal(resolvePixsoImportUrl({ htmlRoot, requestedUrl: realFile }).url, new URL(realFile).href);

const virtualRoute = `${rootUrl}mail/inbox`;
assert.equal(resolvePixsoImportUrl({ htmlRoot, requestedUrl: virtualRoute, allowVirtualRoute: true }).url, new URL(virtualRoute).href);

const aliasedUrl = "http://127.0.0.1:43173/fixture/使用Text";
assert.equal(resolvePixsoImportUrl({ htmlRoot, requestedUrl: aliasedUrl }).url, new URL(aliasedUrl).href);

const createRunScript = fileURLToPath(new URL("./create-pixso-import-run.mjs", import.meta.url));
const created = spawnSync(process.execPath, [
  createRunScript,
  "--html-root", htmlRoot,
  "--url", malformed,
  "--runs-root", path.join(sandbox, "runs"),
], { encoding: "utf8" });
assert.equal(created.status, 0, created.stderr || created.stdout);
const createdOutput = JSON.parse(created.stdout);
const runManifest = JSON.parse(fs.readFileSync(createdOutput.manifest, "utf8"));
assert.equal(runManifest.source.url, new URL(rootUrl).href);
assert.equal(runManifest.source.requestedUrl, new URL(malformed).href);
assert.equal(runManifest.source.urlCorrected, true);
assert.equal(runManifest.source.urlCorrectionReason, "removed-nonexistent-suffix:使用Text");

console.log("Pixso import URL tests passed: malformed instruction suffixes are removed without rewriting real files or explicit virtual routes.");
