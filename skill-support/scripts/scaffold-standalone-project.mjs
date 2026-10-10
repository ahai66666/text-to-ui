#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const valueFor = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : null; };
if (!valueFor('--project') || !valueFor('--repo')) throw new Error('Usage: scaffold-standalone-project.mjs --project <dir> --repo <monorepo> [--entry <generated-entry.js>]');
const projectRoot = path.resolve(valueFor("--project"));
const repoRoot = path.resolve(valueFor("--repo"));
fs.mkdirSync(projectRoot, { recursive: true });
const packages = ["component-contracts", "component-styles", "components-html", "components-react", "components-vue", "pattern-runtime", "tokens"];
const vendorRoot = path.join(projectRoot, "vendor", "@text-to-ui");
for (const name of packages) {
  const source = path.join(repoRoot, "packages", name);
  const target = path.join(vendorRoot, name);
  if (!fs.existsSync(source)) throw new Error(`Package source not found: ${source}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, filter: (entry) => !entry.includes("node_modules") && !entry.includes("dist") });
  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) for (const [dependency, version] of Object.entries(packageJson[field] ?? {})) if (dependency.startsWith("@text-to-ui/") && version === "workspace:*") packageJson[field][dependency] = `file:../${dependency.slice("@text-to-ui/".length)}`;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}
const rootPackagePath = path.join(projectRoot, "package.json");
if (!fs.existsSync(rootPackagePath)) fs.writeFileSync(rootPackagePath, JSON.stringify({ name: 'text-to-ui-page', private: true, type: 'module' }, null, 2));
if (fs.existsSync(rootPackagePath)) {
  const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, "utf8"));
  rootPackage.dependencies ??= {};
  for (const name of packages) rootPackage.dependencies[`@text-to-ui/${name}`] = `file:vendor/@text-to-ui/${name}`;
  rootPackage.devDependencies ??= {};
  rootPackage.devDependencies.vite = "7.3.6";
  rootPackage.devDependencies.react = "19.2.8";
  rootPackage.devDependencies["react-dom"] = "19.2.8";
  rootPackage.devDependencies.vue = "3.5.41";
  rootPackage.scripts ??= {};
  rootPackage.scripts.dev = rootPackage.scripts.dev ?? "vite --host 127.0.0.1";
  rootPackage.scripts.build = rootPackage.scripts.build ?? "vite build";
  rootPackage.scripts.verify = rootPackage.scripts.verify ?? "node scripts/verify.mjs";
  fs.writeFileSync(rootPackagePath, `${JSON.stringify(rootPackage, null, 2)}\n`);
}
const scriptsRoot = path.join(projectRoot, "scripts");
fs.mkdirSync(scriptsRoot, { recursive: true });
const writeNew = (name, content) => { const file = path.join(projectRoot, name); if (!fs.existsSync(file)) fs.writeFileSync(file, content); };
// A generated page may live inside a larger pnpm workspace (for example
// Documents/办公). Create a local workspace boundary so installs resolve the
// copied vendor packages from this project instead of an ancestor's stale
// lockfile/package snapshot. Preserve an existing project-owned workspace file.
writeNew('pnpm-workspace.yaml', 'packages:\n  - "."\n');
const entry = valueFor('--entry') || './generated-entry.js';
if (path.isAbsolute(entry) || entry.split(/[\\/]/).includes('..')) throw new Error('--entry must be inside the project');
writeNew('index.html', '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>工作台</title><style>html,body,#app{margin:0;width:100%;height:100%}body{overflow:hidden}</style></head><body><div id="app"></div><script type="module" src="./main.js"></script></body></html>');
writeNew('main.js', `import { mountGeneratedPage } from ${JSON.stringify(entry.startsWith('./') ? entry : './' + entry)};\nmountGeneratedPage();\n`);
writeNew('vite.config.mjs', `import { defineConfig } from 'vite';
export default defineConfig({ base: './', plugins: [{
  name: 'text-to-ui-page-boundaries', enforce: 'pre',
  transform(code, id) {
    const file = id.split('?')[0];
    if (!file.endsWith('.css') || /[\\\\/]vendor[\\\\/]|[\\\\/]node_modules[\\\\/]/.test(file)) return;
    if (/\\[data-(?:pattern|tui-pane-role)|\\.tui-(?:pattern|sidebar|titlebar)\\b/.test(code)) this.error('Page CSS cannot override Pattern-owned selectors: ' + file);
  }
}], server: { host: '127.0.0.1' } });
`);
const verifyPath = path.join(scriptsRoot, "verify.mjs");
if (!fs.existsSync(verifyPath)) fs.writeFileSync(verifyPath, `import fs from "node:fs";
import path from "node:path";
const required = ["index.html", "framework-page-manifest.json", "page-bindings.json", "page-blueprint.json", "page-content-recipes.json"];
const missing = required.filter((file) => !fs.existsSync(path.resolve(file)));
if (missing.length) { console.error(JSON.stringify({ status: "blocked", gate: "generated-artifacts", missing }, null, 2)); process.exit(1); }
console.log(JSON.stringify({ status: "preflight-ready", message: "Artifact inputs are complete. This command does not start a browser or replace verify-fast-preview runtime evidence." }, null, 2));
`);
console.log(JSON.stringify({ ok: true, projectRoot, packages: packages.map((name) => `@text-to-ui/${name}`) }, null, 2));
