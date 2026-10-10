import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/validate-page-binding-audit.mjs <page-binding-audit.json>");
  process.exit(2);
}

const audit = JSON.parse(fs.readFileSync(path.resolve(input), "utf8"));
const failures = [];
if (audit.schemaVersion !== 1) failures.push("schemaVersion must equal 1");
if (audit.bridgeVersion !== 1) failures.push("bridgeVersion must equal 1");
if (audit.auditScope !== "managed-bindings") failures.push("auditScope must equal managed-bindings");
if (!/^\d+:\d+$/.test(audit.frameId ?? "")) failures.push("frameId must be a Pixso node id");
if (audit.activePageMismatch === true) failures.push("activePageMismatch blocks the audit");
if (!Array.isArray(audit.bindings)) failures.push("bindings must be an array");
if (!Array.isArray(audit.literalStyleFindings)) failures.push("literalStyleFindings must be an array");
if ((audit.literalStyleFindings ?? []).length > 0) failures.push("managed bindings still have literal/unverified findings");
if (!Array.isArray(audit.iconCropFindings)) failures.push("iconCropFindings must be an array");
else if (audit.iconCropFindings.length > 0) failures.push("iconCropFindings must be empty");

const coverage = audit.coverageSummary;
const requiredCoverage = ["uniqueNodes", "colorBearingNodes", "variableBoundColorNodes", "literalPaintNodes", "layerOpacityLiteralNodes", "intrinsicAlphaPaints"];
if (!coverage || coverage.coverageScope !== "managed-bindings") failures.push("coverageSummary.coverageScope must equal managed-bindings");
for (const key of requiredCoverage) {
  if (!Number.isInteger(coverage?.[key]) || coverage[key] < 0) failures.push(`coverageSummary.${key} must be a non-negative integer`);
}
if (coverage && coverage.variableBoundColorNodes + coverage.literalPaintNodes !== coverage.colorBearingNodes) {
  failures.push("managed binding denominator is inconsistent");
}
if (coverage?.literalPaintNodes !== 0) failures.push("literalPaintNodes must be zero for a passing managed audit");
for (const entry of audit.bindings ?? []) {
  if (!entry.key || !entry.variable || entry.verified !== true) failures.push(`binding ${entry.key ?? "unknown"} is not read-back verified`);
}

if (failures.length) {
  console.error("Page binding audit validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Page binding audit valid: ${audit.bindings.length} managed bindings, ${coverage.variableBoundColorNodes} verified.`);
