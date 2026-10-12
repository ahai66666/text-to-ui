#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const args = process.argv.slice(2);
let zipPath;
let mode;
let manifestPath;

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];
  if (argument === "--zip") zipPath = path.resolve(args[++index] ?? "");
  else if (argument === "--mode") mode = args[++index];
  else if (argument === "--manifest") manifestPath = path.resolve(args[++index] ?? "");
  else if (argument === "--help") {
    console.log("Usage: node scripts/validate-pixso-import-package.mjs --zip <package.zip> --mode fast|strict [--manifest <visual-parity.json>]");
    process.exit(0);
  } else {
    throw new Error(`Unknown argument: ${argument}`);
  }
}

if (!zipPath || !mode || !["fast", "strict"].includes(mode)) {
  throw new Error("--zip and --mode fast|strict are required");
}

const failures = [];
const warnings = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};
const manifest = manifestPath
  ? JSON.parse(await fs.readFile(manifestPath, "utf8"))
  : {};
const checks = manifest.packageChecks?.[mode] ?? {};
const expectedStateId =
  checks.requiredStateId ?? manifest.state?.id ?? manifest.stateId;
const expectedCanvasSize =
  checks.requiredCanvasSize ??
  (manifest.browser?.targetCssViewport
    ? `${manifest.browser.targetCssViewport.width}x${manifest.browser.targetCssViewport.height}`
    : undefined);
const requiredContentMarkers = checks.requiredContentMarkers ?? [];

async function unzip(argumentsList) {
  try {
    return (await execFileAsync("unzip", argumentsList, { encoding: "utf8" })).stdout;
  } catch (error) {
    const detail = error?.stderr?.trim() || error?.message || "unzip failed";
    throw new Error(detail);
  }
}

try {
  const stat = await fs.stat(zipPath);
  expect(stat.isFile(), `ZIP path is not a file: ${zipPath}`);
} catch {
  failures.push(`ZIP file does not exist: ${zipPath}`);
}

let entries = [];
let indexHtml = "";
let entryName = checks.entry ?? "index.html";
if (failures.length === 0) {
  try {
    const listing = await unzip(["-Z1", zipPath]);
    entries = listing.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean);
  } catch (error) {
    failures.push(`Cannot read ZIP: ${error.message}`);
  }
}

const unsafeEntries = entries.filter((entry) => {
  const normalized = entry.replaceAll("\\", "/");
  return (
    normalized.startsWith("/") ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.split("/").includes("..") ||
    normalized.includes("\0")
  );
});
expect(unsafeEntries.length === 0, `ZIP contains unsafe paths: ${unsafeEntries.join(", ")}`);
expect(entries.length > 0, "ZIP is empty");
expect(!entries.some((entry) => /^(?:node_modules|\.git)(?:\/|$)/.test(entry)), "ZIP must not contain node_modules or .git");

const htmlEntries = entries.filter((entry) => /\.html?$/i.test(entry));
expect(htmlEntries.length === 1, `ZIP must contain exactly one HTML entry; found ${htmlEntries.length}`);
if (htmlEntries.length === 1 && !entries.includes(entryName)) entryName = htmlEntries[0];
expect(entries.includes(entryName), `ZIP is missing the entry HTML: ${entryName}`);
const cssEntries = entries.filter((entry) => /\.css$/i.test(entry));
expect(cssEntries.length > 0, "ZIP must include at least one local CSS file");

if (entries.includes(entryName)) {
  try {
    indexHtml = await unzip(["-p", zipPath, entryName]);
  } catch (error) {
    failures.push(`Cannot read ${entryName} from ZIP: ${error.message}`);
  }
}

expect(/^\s*<!doctype\s+html\b/i.test(indexHtml), "entry HTML must declare <!doctype html>");
expect(/<html\b/i.test(indexHtml), "entry HTML must contain <html>");
expect(/<body\b/i.test(indexHtml), "entry HTML must contain <body>");
if (expectedStateId) expect(indexHtml.includes(`data-visual-state-id="${expectedStateId}"`), `entry HTML is missing visual state ${expectedStateId}`);
if (expectedCanvasSize) expect(indexHtml.includes(`data-canvas-size="${expectedCanvasSize}"`), `entry HTML is missing canvas size ${expectedCanvasSize}`);
for (const marker of requiredContentMarkers) {
  expect(indexHtml.includes(marker), `entry HTML is missing required static content marker: ${marker}`);
}

const ignoredReference = /^(?:#|data:|blob:|https?:|\/\/|mailto:|javascript:)/i;
const references = [];
const referencePattern = /<(?:link|script|img|source|video|audio|object)\b[^>]*?\b(?:href|src|poster|data)\s*=\s*["']([^"']+)["'][^>]*>/gi;
for (const match of indexHtml.matchAll(referencePattern)) {
  const reference = match[1].trim();
  if (!reference || ignoredReference.test(reference)) continue;
  const clean = reference.split("#", 1)[0].split("?", 1)[0];
  if (!clean) continue;
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(entryName), clean));
  references.push({ reference, resolved });
  expect(entries.includes(resolved), `entry HTML references missing ZIP file: ${reference}`);
}

const markerCount = [...indexHtml.matchAll(/(?:\bid="px-key:[^"]+"|\bdata-px-key="[^"]+")/g)].length;
const minimumMarkerCount = checks.minimumBindingMarkerCount ?? (mode === "strict" ? 1 : 0);
if (mode === "strict") {
  expect(markerCount >= minimumMarkerCount, `strict ZIP has ${markerCount} semantic binding markers; expected at least ${minimumMarkerCount}`);
  expect(/var\(--(?:color|brand|neutral|function|multi)-[A-Za-z0-9_-]+\b/.test(indexHtml), "strict ZIP must consume canonical color CSS variables");

  const inlineColorLiteralPattern = /(?:fill|stroke|color|background(?:-color)?|border(?:-[A-Za-z-]+)?|outline(?:-color)?|box-shadow)\s*[:=]\s*(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\()/gi;
  const literalMatches = [...indexHtml.matchAll(inlineColorLiteralPattern)].map((match) => match[0]);
  expect(literalMatches.length === 0, `strict ZIP contains hardcoded color value(s): ${literalMatches.slice(0, 5).join(", ")}`);
  if (checks.requireVariableColorContract !== false && !/var\(--color-[A-Za-z0-9_-]+\b/.test(indexHtml)) {
    failures.push("strict ZIP must declare/consume --color-* variable aliases");
  }
}
if (mode === "fast") {
  if (markerCount === 0) warnings.push("fast ZIP has no semantic binding markers; this is visual-only and must not be reported as strict parity");
  if (checks.requireVariableColorContract === true) warnings.push("fast mode records color usage but does not prove Pixso Variable read-back");
}

const result = {
  ok: failures.length === 0,
  mode,
  zipPath,
  entry: entryName,
  entryCount: entries.length,
  htmlEntries,
  cssEntryCount: cssEntries.length,
  localReferenceCount: references.length,
  visualStateId: expectedStateId ?? null,
  canvasSize: expectedCanvasSize ?? null,
  bindingMarkerCount: markerCount,
  warnings,
  failures,
  pixsoReadbackRequired: mode === "strict",
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);

