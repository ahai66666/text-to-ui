import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/validate-page-binding-manifest.mjs <page-binding-manifest.json>");
  process.exit(2);
}

const file = path.resolve(input);
const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
const failures = [];
const allowedProperties = new Set(["fills", "strokes"]);
const bindings = Array.isArray(manifest.bindings) ? manifest.bindings : [];
const keys = new Set();

if (manifest.schemaVersion !== 1) failures.push("schemaVersion must equal 1");
if (manifest.bridgeVersion !== 1) failures.push("bridgeVersion must equal 1");
if (manifest.target?.pageName !== "coremail") failures.push("target.pageName must equal coremail");
if (!manifest.target?.frameNamePrefix) failures.push("target.frameNamePrefix is required");
if (manifest.markerTransport?.pluginDataKey !== "text-to-ui-px-key") failures.push("markerTransport.pluginDataKey is invalid");
if (manifest.markerTransport?.nodeNamePrefix !== "px-key:") failures.push("markerTransport.nodeNamePrefix is invalid");
if (manifest.markerTransport?.htmlAttribute !== "data-px-key") failures.push("markerTransport.htmlAttribute is invalid");
if (manifest.markerTransport?.utilityClassPrefix !== "u-") failures.push("markerTransport.utilityClassPrefix is invalid");
if (manifest.markerTransport?.utilityClassesAreCssOnly !== true) failures.push("markerTransport.utilityClassesAreCssOnly must be true");
if (manifest.markerTransport?.semanticMarkerRequired !== true) failures.push("markerTransport.semanticMarkerRequired must be true");
if (bindings.length === 0) failures.push("bindings must not be empty");

for (const [index, binding] of bindings.entries()) {
  const prefix = `bindings[${index}]`;
  if (!binding || typeof binding !== "object") {
    failures.push(`${prefix} must be an object`);
    continue;
  }
  if (!binding.key || keys.has(binding.key)) failures.push(`${prefix}.key is missing or duplicated`);
  keys.add(binding.key);
  if (!binding.token || /^#|rgba?\(|hsla?\(/i.test(binding.token)) failures.push(`${prefix}.token must be a Pixso variable name, not a color literal`);
  if (!allowedProperties.has(binding.property)) failures.push(`${prefix}.property must be fills or strokes`);
  if (typeof binding.required !== "boolean") failures.push(`${prefix}.required must be boolean`);
}

for (const [index, component] of (Array.isArray(manifest.components) ? manifest.components : []).entries()) {
  if (!component.logicalName) failures.push(`components[${index}].logicalName is required`);
  if (component.guid || component.componentGuid || component.instanceId) {
    failures.push(`components[${index}] must not contain cached Pixso GUIDs`);
  }
}

if (failures.length) {
  console.error(`Page binding manifest validation failed: ${file}`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Page binding manifest valid: ${bindings.length} explicit bindings, ${manifest.components?.length ?? 0} audit-only component references.`);
