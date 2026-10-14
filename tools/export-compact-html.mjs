#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const index = args.indexOf("--out");
if (index < 0 || !args[index + 1]) throw new Error("Usage: node tools/export-compact-html.mjs --out <empty-directory>");
const out = path.resolve(args[index + 1]);
if (out === source || out.startsWith(`${source}${path.sep}`)) throw new Error("Export outside the full source repository");
if (fs.existsSync(out) && fs.readdirSync(out).length) throw new Error(`Export directory is not empty: ${out}`);
fs.mkdirSync(out, { recursive: true });
const copy = (from, to = from) => {
  const input = path.join(source, from);
  const output = path.join(out, to);
  if (!fs.existsSync(input)) throw new Error(`Missing source: ${from}`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.cpSync(input, output, { recursive: true, filter: (entry) => !["node_modules", "dist", ".DS_Store", "fixtures"].includes(path.basename(entry)) });
};
const writeJson = (file, value) => fs.writeFileSync(path.join(out, file), `${JSON.stringify(value, null, 2)}\n`);
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const git = (params) => {
  const result = spawnSync("git", params, { cwd: source, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${params.join(" ")}: ${result.stderr}`);
  return result.stdout.trim();
};

copy("compact-html/SKILL.md", "SKILL.md");
copy("compact-html/README.md", "README.md");
copy("compact-html/references", "references");
copy("compact-html/scripts", "scripts");
copy("compact-html/examples", "examples");
copy("LICENSE");
copy("skill-support/assets/design-system/design.md", "assets/design-system/design.md");
copy("skill-support/assets/design-system/pattern-contracts.json", "assets/design-system/pattern-contracts.json");
copy("skill-support/assets/icons/icon-aliases.json", "assets/icons/icon-aliases.json");

for (const name of ["components-html", "component-styles", "pattern-runtime", "tokens"]) copy(`packages/${name}`);
copy("packages/component-contracts/package.json");
copy("packages/component-contracts/src/titlebar-segments.js");
copy("packages/component-contracts/src/readiness-policy.js");
const contracts = JSON.parse(fs.readFileSync(path.join(source, "packages/component-contracts/src/components.json"), "utf8"));
const removedFields = ["visualAuthority", "canonicalSection", "canonicalSelector", "canonicalSpecimen", "legacyVisualGroup", "fixtureId", "comparisonGroup", "readiness"];
const projected = {
  schemaVersion: 1,
  contractVersion: contracts.contractVersion,
  framework: "html",
  components: contracts.components.map((component) => {
    const entry = { ...component };
    for (const field of removedFields) delete entry[field];
    entry.implementations = { html: component.implementations.html };
    entry.frameworks = { html: component.frameworks.html };
    entry.status = component.frameworks.html.status;
    return entry;
  }),
  registryPolicy: { framework: "html", source: "canonical-html-components", readyRequires: ["sourceReady", "contractReady", "visualParity", "behaviorParity", "accessibilityParity", "tokenParity"] }
};
writeJson("packages/component-contracts/src/components.json", projected);

const htmlSource = path.join(out, "packages/components-html/src/index.js");
fs.writeFileSync(htmlSource, fs.readFileSync(htmlSource, "utf8").replace("  // single contract entry used by React and Vue.\n", "  // shared canonical contract entry.\n"));
const sharedCss = path.join(out, "packages/component-styles/src/index.css");
fs.writeFileSync(sharedCss, fs.readFileSync(sharedCss, "utf8").replace("file remains the single visual authority for HTML, React and Vue.", "file remains the single visual authority for HTML."));

const activePlugins = ["pixso-unified-agent-plugin", "pixso-page-binding-bridge-plugin", "pixso-component-registry-sync-plugin", "pixso-token-sync-plugin", "pixso-token-probe-plugin"];
for (const name of activePlugins) copy(`skill-support/scripts/${name}`, `pixso/${name}`);

writeJson("package.json", {
  name: "text-to-ui-skill-compact", version: "3.0.0", private: true, type: "module",
  scripts: { scaffold: "node scripts/scaffold-project.mjs", generate: "node scripts/generate-page.mjs" }
});
const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (entry.isFile()) files.push(path.relative(out, target).replaceAll(path.sep, "/"));
  }
};
walk(out);
const forbidden = /\b(?:React|Vue)\b|components-(?:react|vue)|@vitejs\/plugin-vue|react-dom/i;
const violations = files.filter((name) => forbidden.test(name) || (/[.](?:md|js|mjs|json|css|html|yaml)$/.test(name) && forbidden.test(fs.readFileSync(path.join(out, name), "utf8"))));
if (violations.length) throw new Error(`Non-HTML references in compact export: ${violations.join(", ")}`);
const sourceCommit = git(["rev-parse", "HEAD"]);
const sourceBranch = git(["branch", "--show-current"]);
const sourceVersion = JSON.parse(fs.readFileSync(path.join(source, "skill-support/package.json"), "utf8")).version;
const manifest = files.sort().map((file) => ({ path: file, sha256: sha256(path.join(out, file)), bytes: fs.statSync(path.join(out, file)).size }));
writeJson("PROVENANCE.json", { schemaVersion: 1, sourceRepository: "https://github.com/ahai66666/text-to-ui", sourceBranch, sourceCommit, sourceVersion, fileCount: manifest.length, expandedBytes: manifest.reduce((sum, item) => sum + item.bytes, 0), files: manifest });
console.log(JSON.stringify({ ok: true, out, sourceCommit, files: manifest.length, expandedBytes: manifest.reduce((sum, item) => sum + item.bytes, 0) }, null, 2));
