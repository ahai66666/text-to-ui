#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  pageSpecSha256,
  readJson,
  writeJson,
} from "./page-contract.mjs";

function usage() {
  console.error(
    "Usage: node scripts/stamp-page-contract.mjs --page-spec <page-spec.json> " +
      "--run-id <run-id> [--manifest <run-manifest.json>] " +
      "[--artifact kind=path]...",
  );
  process.exit(2);
}

function parseArgs(argv) {
  const options = { pageSpec: null, runId: null, manifest: null, artifacts: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--page-spec") options.pageSpec = path.resolve(argv[++index] ?? "");
    else if (argument === "--run-id") options.runId = argv[++index] ?? null;
    else if (argument === "--manifest") options.manifest = path.resolve(argv[++index] ?? "");
    else if (argument === "--artifact") options.artifacts.push(argv[++index] ?? "");
    else usage();
  }
  if (!options.pageSpec || !options.runId) usage();
  return options;
}

function exists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function fileSha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function upsertMeta(html, name, content) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tag = `<meta name="${name}" content="${content}">`;
  const pattern = new RegExp(`<meta\\b[^>]*\\bname=["']${escaped}["'][^>]*>`, "i");
  if (pattern.test(html)) return html.replace(pattern, tag);
  const head = html.match(/<head\b[^>]*>/i);
  if (!head) throw new Error(`HTML has no <head>: ${name}`);
  return html.replace(head[0], `${head[0]}\n  ${tag}`);
}

function stampHtml(filePath, pageSpecPath, runId, hash) {
  let html = fs.readFileSync(filePath, "utf8");
  html = upsertMeta(html, "text-to-ui-run-id", runId);
  html = upsertMeta(html, "text-to-ui-page-spec-sha256", hash);
  html = upsertMeta(html, "text-to-ui-page-spec-path", pageSpecPath);
  fs.writeFileSync(filePath, html);
}

function stampJson(filePath, pageSpecPath, runId, hash) {
  const value = readJson(filePath);
  value.runId = runId;
  value.pageSpecSha256 = hash;
  value.pageSpecPath = pageSpecPath;
  writeJson(filePath, value);
}

const options = parseArgs(process.argv.slice(2));
if (!exists(options.pageSpec)) throw new Error(`Page spec does not exist: ${options.pageSpec}`);

const pageSpec = readJson(options.pageSpec);
pageSpec.provenance = {
  ...(pageSpec.provenance ?? {}),
  runId: options.runId,
  hashAlgorithm: "sha256",
  pageSpecSha256: "",
};
const hash = pageSpecSha256(pageSpec);
pageSpec.provenance.pageSpecSha256 = hash;
writeJson(options.pageSpec, pageSpec);

const artifacts = [
  { kind: "page-spec", path: options.pageSpec },
];
for (const entry of options.artifacts) {
  const separator = entry.indexOf("=");
  if (separator <= 0 || separator === entry.length - 1) usage();
  const kind = entry.slice(0, separator);
  const filePath = path.resolve(entry.slice(separator + 1));
  if (!exists(filePath)) throw new Error(`Artifact does not exist: ${filePath}`);
  if (filePath.toLowerCase().endsWith(".html")) {
    stampHtml(filePath, options.pageSpec, options.runId, hash);
  } else {
    stampJson(filePath, options.pageSpec, options.runId, hash);
  }
  artifacts.push({ kind, path: filePath });
}

if (options.manifest) {
  const manifest = exists(options.manifest) ? readJson(options.manifest) : {};
  manifest.schemaVersion = 1;
  manifest.runId = options.runId;
  manifest.pageSpecPath = options.pageSpec;
  manifest.pageSpecSha256 = hash;
  manifest.workflow = pageSpec.workflow ?? null;
  manifest.artifacts = artifacts.map((artifact) => ({
    ...artifact,
    path: artifact.path,
    runId: options.runId,
    pageSpecSha256: hash,
    fileSha256: fileSha256(artifact.path),
  }));
  writeJson(options.manifest, manifest);
}

console.log(JSON.stringify({
  ok: true,
  pageSpec: options.pageSpec,
  runId: options.runId,
  pageSpecSha256: hash,
  artifacts: artifacts.map((artifact) => artifact.path),
  manifest: options.manifest,
}, null, 2));

