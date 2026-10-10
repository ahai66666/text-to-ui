#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokenDir = path.join(skillDir, "assets", "design-system");
const colors = JSON.parse(fs.readFileSync(path.join(tokenDir, "tokens.colors.json"), "utf8"));
const baseline = JSON.parse(fs.readFileSync(path.join(tokenDir, "pixso-core-baseline.json"), "utf8"));
const table = fs.readFileSync(path.join(tokenDir, "core-color-token-table.md"), "utf8");
const failures = [];

const expected = {
  brand: ["05", "10", "15", "20", "30", "40", "50", "60", "70", "80", "90", "100"],
  "neutral-dark": ["05", "10", "15", "20", "30", "40", "50", "60", "70", "80", "90", "100"],
  "neutral-light": ["05", "10", "15", "20", "30", "40", "50", "60", "70", "80", "90", "100"],
  "function/success": ["10", "20", "100"],
  "function/warning": ["10", "20", "100"],
  "function/danger": ["10", "20", "100"],
  multi: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"],
};

const approvedDuplicateValues = new Map([
  ["#64BB5CFF", ["function/success/100", "multi/09"]],
  ["#E84026FF", ["function/danger/100", "multi/10"]],
  ["#ED6F21FF", ["function/warning/100", "multi/11"]],
]);

function get(pathName) {
  return pathName.split("/").reduce((value, segment) => value?.[segment], colors);
}

const entries = [];
for (const [group, keys] of Object.entries(expected)) {
  const values = get(group);
  const actualKeys = Object.keys(values ?? {});
  const missing = keys.filter((key) => !(key in (values ?? {})));
  const extra = actualKeys.filter((key) => !keys.includes(key));
  if (missing.length || extra.length) {
    failures.push(`${group}: expected ${keys.join(", ")}, got ${actualKeys.join(", ")}`);
  }
  for (const key of keys) {
    if (values?.[key]) entries.push([`${group}/${key}`, values[key].toUpperCase()]);
  }
}

const byValue = new Map();
for (const [name, value] of entries) {
  const normalized = value.length === 7 ? `${value}FF` : value;
  const names = byValue.get(normalized) ?? [];
  names.push(name);
  byValue.set(normalized, names);
  if (!table.includes(`\`${name}\``) || !table.includes(`\`${value}\``)) {
    failures.push(`Table is missing ${name} ${value}`);
  }
}
for (const [value, names] of byValue) {
  if (names.length <= 1) continue;
  const approved = approvedDuplicateValues.get(value);
  if (!approved || JSON.stringify(names.toSorted()) !== JSON.stringify(approved.toSorted())) {
    failures.push(`Duplicate core value ${value}: ${names.join(", ")}`);
  }
}

const baselineColors = baseline.collections?.Color?.tokens ?? [];
const expectedNames = entries.map(([name]) => name);
if (JSON.stringify(baselineColors) !== JSON.stringify(expectedNames)) {
  failures.push("pixso-core-baseline.json Color tokens do not match the core palette");
}
if (baseline.counts?.Color !== entries.length) {
  failures.push(`Baseline Color count is ${baseline.counts?.Color}; expected ${entries.length}`);
}

if (failures.length) {
  console.error("Core color audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Core color audit passed: ${entries.length} variables across five families.`);
