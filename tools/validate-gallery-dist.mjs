#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "apps/component-gallery/dist");
const assets = path.join(dist, "assets");
const failures = [];

if (await fs.stat(path.join(dist, "legacy-skill")).then(() => true).catch(() => false)) {
  failures.push("dist still includes the removed legacy Skill preview copy");
}

const assetNames = await fs.readdir(assets).catch(() => []);
const cssNames = assetNames.filter((name) => name.endsWith(".css"));
if (!cssNames.length) failures.push("dist contains no CSS assets");

let cssBundle = "";
for (const name of cssNames) {
  const css = await fs.readFile(path.join(assets, name), "utf8");
  cssBundle += css;
  for (const marker of ["@import", "../../packages/", "../assets/design-system/", "./framework-runtime.css"]) {
    if (css.includes(marker)) failures.push(`${name} still references ${marker}`);
  }
}

for (const token of ["--color-brand-100:", "--width-dialog:", "--shadow-4:"]) {
  if (!cssBundle.includes(token)) failures.push(`dist CSS is missing ${token}`);
}

const fallback = await fs.readFile(path.join(dist, "runtime-file-fallback.js"), "utf8").catch(() => "");
if (!fallback) failures.push("runtime-file-fallback.js is missing");
if (/<use\b[^>]*href=["'][^#]/i.test(fallback)) failures.push("file fallback contains an external SVG use reference");

const result = { ok: failures.length === 0, cssAssets: cssNames.length, failures };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
