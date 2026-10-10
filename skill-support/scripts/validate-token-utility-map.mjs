#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/validate-token-utility-map.mjs <token-utility-map.json>");
  process.exit(2);
}

const file = path.resolve(input);
const map = JSON.parse(fs.readFileSync(file, "utf8"));
const failures = [];
const all = [...(map.utilities ?? []), ...(map.semanticTypes ?? [])];
const names = new Set();
if (map.schemaVersion !== 1) failures.push("schemaVersion must equal 1");
if (map.classPrefix !== "u-") failures.push("classPrefix must equal u-");
if (map.policy?.pixsoBindingRequiresDataPxKey !== true) failures.push("Pixso binding must require data-px-key");
if (!Array.isArray(map.utilities) || map.utilities.length === 0) failures.push("utilities must not be empty");

for (const item of all) {
  if (!item.className || !item.className.startsWith("u-")) failures.push("utility class must start with u-");
  if (names.has(item.className)) failures.push(`duplicate utility class: ${item.className}`);
  names.add(item.className);
  if (/\[|\]|#[0-9a-f]{3,8}|rgba?\(|hsla?\(/i.test(item.className)) {
    failures.push(`arbitrary value or color literal in class: ${item.className}`);
  }
}

if (failures.length) {
  console.error(`Token utility map validation failed: ${file}`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Token utility map valid: ${map.utilities.length} primitive utilities, ${map.semanticTypes.length} semantic typography utilities.`);
