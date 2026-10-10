#!/usr/bin/env node

import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourcePreview = path.join(root, "skill-support", "preview");
const sourceDesignTokens = path.join(root, "skill-support", "assets", "design-system");
const targetRoot = path.join(root, "apps", "component-gallery", "public", "legacy-skill");
const targetPreview = path.join(targetRoot, "preview");
const targetDesignTokens = path.join(targetRoot, "assets", "design-system");

await fs.rm(targetRoot, { recursive: true, force: true });
await fs.mkdir(targetRoot, { recursive: true });
await fs.cp(sourcePreview, targetPreview, { recursive: true });
await fs.cp(sourceDesignTokens, targetDesignTokens, { recursive: true });

const walk = async (directory, prefix = "") => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path.join(directory, entry.name), relative));
    else files.push(relative);
  }
  return files;
};
const hashFile = async (file) => crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex");
const sourceFiles = [
  ...(await walk(sourcePreview)).map((file) => path.join("preview", file)),
  ...(await walk(sourceDesignTokens)).map((file) => path.join("assets", "design-system", file))
].sort();
const files = {};
for (const relative of sourceFiles) files[relative] = await hashFile(path.join(targetRoot, relative));
await fs.writeFile(path.join(targetRoot, ".baseline-manifest.json"), `${JSON.stringify({
  schemaVersion: 1,
  source: "skill-support/preview + skill-support/assets/design-system",
  files
}, null, 2)}\n`);

console.log(`Synced legacy Skill visual baseline to ${path.relative(root, targetRoot)} (${sourceFiles.length} hashed files)`);
