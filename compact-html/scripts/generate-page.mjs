#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1]; };
const projectArg = flag("--project");
const specArg = flag("--spec");
if (!projectArg || !specArg || args.includes("--framework")) throw new Error("Usage: node scripts/generate-page.mjs --project <scaffolded-directory> --spec <page.json>");
const project = path.resolve(projectArg);
const spec = JSON.parse(fs.readFileSync(path.resolve(specArg), "utf8"));
const patternRegistry = JSON.parse(fs.readFileSync(path.join(repository, "assets/design-system/pattern-contracts.json"), "utf8"));
const componentRegistry = JSON.parse(fs.readFileSync(path.join(repository, "packages/component-contracts/src/components.json"), "utf8"));
if (!fs.existsSync(path.join(project, "vendor/@text-to-ui/components-html/src/index.js"))) throw new Error("Scaffold the project first");
if (spec.schemaVersion !== 1 || !spec.title || !spec.blueprint?.task || !Array.isArray(spec.blueprint?.contentGroups) || !Array.isArray(spec.blueprint?.interactions)) throw new Error("Page spec needs schemaVersion 1, title, and a blueprint with task, contentGroups, and interactions");
const pattern = patternRegistry.patterns?.find((entry) => entry.id === spec.patternId);
if (!pattern) throw new Error(`Unknown Pattern: ${spec.patternId}`);
const componentIds = new Set(componentRegistry.components.filter((item) => item.implementations?.html && item.frameworks?.html?.status !== "missing").map((item) => item.id));
const slotIds = new Set(pattern.slots.map((item) => item.id));
const regionIds = new Set(pattern.regions.map((item) => item.id));
const checkBindings = (record, allowed, kind) => {
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error(`${kind} must be an object`);
  for (const [key, entries] of Object.entries(record)) {
    if (!allowed.has(key)) throw new Error(`Unknown ${kind} ${key} in Pattern ${pattern.id}`);
    if (!Array.isArray(entries)) throw new Error(`${kind}.${key} must be an array`);
    for (const [index, binding] of entries.entries()) {
      if (typeof binding?.text === "string" && Object.keys(binding).length === 1) continue;
      if (!binding || !componentIds.has(binding.component)) throw new Error(`${kind}.${key}[${index}] has no registered HTML component`);
      if (!binding.options || typeof binding.options !== "object" || Array.isArray(binding.options) || !Object.keys(binding.options).length) throw new Error(`${kind}.${key}[${index}] needs explicit business options`);
    }
  }
};
checkBindings(spec.slots, slotIds, "slots");
checkBindings(spec.regionContent ?? {}, regionIds, "regionContent");
for (const slot of pattern.slots) {
  if (/^[1-9]/.test(slot.cardinality ?? "0")) {
    if (!spec.slots[slot.id]?.length) throw new Error(`Required Pattern slot is empty: ${slot.id}`);
  }
}
const title = String(spec.title).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const entry = `import "@text-to-ui/components-html/styles.css";
import "@text-to-ui/pattern-runtime/styles.css";
import { renderHtmlComponent, bindInputTagEntry, bindTitlebarOverflow, collectHtmlComponentEvidence } from "@text-to-ui/components-html";
import { createPatternRuntime } from "@text-to-ui/pattern-runtime";
import patternRegistry from "./vendor/pattern-contracts.json";

const spec = ${JSON.stringify(spec, null, 2)};
const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const renderEntries = (entries) => entries.map((item) => typeof item.text === "string" ? escapeHtml(item.text) : renderHtmlComponent(item.component, item.options)).join("");
const slots = Object.fromEntries(Object.entries(spec.slots).map(([key, entries]) => [key, entries.map((item) => typeof item.text === "string" ? escapeHtml(item.text) : renderHtmlComponent(item.component, item.options))]));
const regionContent = Object.fromEntries(Object.entries(spec.regionContent ?? {}).map(([key, entries]) => [key, renderEntries(entries)]));
const runtime = createPatternRuntime({ registry: patternRegistry, patternId: spec.patternId, mode: "runtime", slots, regionContent });
const root = document.querySelector("#app");
root.innerHTML = runtime.render();
bindInputTagEntry(root);
bindTitlebarOverflow(root);
window.textToUiEvidence = () => collectHtmlComponentEvidence(document);
`;
const output = path.join(project, "generated-entry.js");
const temporary = `${output}.tmp`;
fs.writeFileSync(temporary, entry);
fs.renameSync(temporary, output);
fs.writeFileSync(path.join(project, "index.html"), `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>html,body,#app{margin:0;width:100%;height:100%;overflow:hidden}</style></head><body><div id="app"></div><script type="module" src="./generated-entry.js"></script></body></html>\n`);
console.log(JSON.stringify({ ok: true, project, pattern: pattern.id, componentCount: Object.values(spec.slots).concat(Object.values(spec.regionContent ?? {})).flat().filter((entry) => entry.component).length }, null, 2));
