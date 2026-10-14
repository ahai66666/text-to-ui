#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1]; };
const targetArg = flag("--project");
if (!targetArg) throw new Error("Usage: node scripts/scaffold-project.mjs --project <empty-directory>");
const project = path.resolve(targetArg);
if (fs.existsSync(project) && fs.readdirSync(project).length) throw new Error(`Project directory is not empty: ${project}`);
fs.mkdirSync(project, { recursive: true });

const packageNames = ["component-contracts", "component-styles", "components-html", "pattern-runtime", "tokens"];
const vendor = path.join(project, "vendor", "@text-to-ui");
fs.mkdirSync(vendor, { recursive: true });
for (const name of packageNames) {
  const source = path.join(repository, "packages", name);
  if (!fs.existsSync(path.join(source, "package.json"))) throw new Error(`Compact package is missing: ${name}`);
  const destination = path.join(vendor, name);
  fs.cpSync(source, destination, { recursive: true });
  const manifestPath = path.join(destination, "package.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const field of ["dependencies", "peerDependencies"]) {
    for (const [dependency, version] of Object.entries(manifest[field] ?? {})) {
      if (version === "workspace:*" && dependency.startsWith("@text-to-ui/")) {
        manifest[field][dependency] = `file:../${dependency.slice("@text-to-ui/".length)}`;
      }
    }
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
fs.copyFileSync(path.join(repository, "assets/design-system/pattern-contracts.json"), path.join(project, "vendor", "pattern-contracts.json"));
const manifest = {
  name: "text-to-ui-html-page", private: true, type: "module",
  scripts: { dev: "vite --host 127.0.0.1", build: "vite build", preview: "vite preview --host 127.0.0.1" },
  dependencies: Object.fromEntries(packageNames.map((name) => [`@text-to-ui/${name}`, `file:vendor/@text-to-ui/${name}`])),
  devDependencies: { vite: "7.3.6" }
};
fs.writeFileSync(path.join(project, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(project, "pnpm-workspace.yaml"), 'packages:\n  - "."\nallowBuilds:\n  esbuild: true\n');
fs.writeFileSync(path.join(project, "index.html"), '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Text to UI</title><style>html,body,#app{margin:0;width:100%;height:100%;overflow:hidden}</style></head><body><div id="app"></div><script type="module" src="./generated-entry.js"></script></body></html>\n');
fs.writeFileSync(path.join(project, "vite.config.mjs"), 'import { defineConfig } from "vite";\nexport default defineConfig({ base: "./", server: { host: "127.0.0.1" } });\n');
console.log(JSON.stringify({ ok: true, project, packages: packageNames }, null, 2));
