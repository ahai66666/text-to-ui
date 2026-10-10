import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifySkill } from "../text-to-ui/scripts/skill-delivery.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
if (fs.existsSync(path.join(root, "skill", "SKILL.md"))) {
  try { verifySkill(path.join(root, "text-to-ui"), path.join(root, "skill")); }
  catch (error) { errors.push(error.message); }
}

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(absolute(relativePath));
}

function requirePath(relativePath, kind = "path") {
  if (!exists(relativePath)) {
    errors.push(`missing ${kind}: ${relativePath}`);
  }
}

function readText(relativePath) {
  try {
    return fs.readFileSync(absolute(relativePath), "utf8");
  } catch (error) {
    errors.push(`cannot read file: ${relativePath} (${error.message})`);
    return "";
  }
}

function readJson(relativePath) {
  try {
    return JSON.parse(readText(relativePath));
  } catch (error) {
    errors.push(`invalid JSON: ${relativePath} (${error.message})`);
    return null;
  }
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function walkFiles(relativeDirectory) {
  const directory = absolute(relativeDirectory);
  if (!fs.existsSync(directory)) return [];

  const files = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    if ([".DS_Store", "node_modules", "outputs"].includes(entry.name)) continue;
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(relativePath));
    else if (entry.isFile()) files.push(relativePath);
  }
  return files.sort();
}

function relativeSourcePath(source) {
  return String(source ?? "").split("#", 1)[0];
}

for (const directory of [
  "text-to-ui",
  "packages",
  "packages/tokens",
  "packages/component-contracts",
  "packages/component-styles",
  "packages/components-html",
  "packages/components-react",
  "packages/components-vue",
  "packages/pixso-mapping",
  "apps/component-gallery",
  "tools",
  "docs",
  "fixtures",
]) {
  requirePath(directory, "directory");
}

for (const file of [
  "README.md",
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "SKILL.md",
  "agents/openai.yaml",
  "text-to-ui/README.md",
  "text-to-ui/package.json",
  "text-to-ui/assets/design-system/component-usage.schema.json",
  "text-to-ui/references/component-package-integration.md",
  "packages/component-contracts/src/components.json",
  "apps/component-gallery/index.html",
]) {
  requirePath(file, "file");
}

const rootPackage = readJson("package.json") ?? {};
const workspace = readText("pnpm-workspace.yaml");
const rootReadme = readText("README.md");
const canonicalSkill = readText("SKILL.md");
const supportReadme = readText("text-to-ui/README.md");
const workflowRoutes = readJson("text-to-ui/references/routes/index.json")?.routes ?? {};
const requirementSpec = readText("text-to-ui/references/requirement-spec.md");

assert(rootPackage.private === true, "root package must remain private");
assert(rootPackage.packageManager === "pnpm@10.0.0", "root package must pin pnpm@10.0.0");
assert(
  rootPackage.scripts?.["delivery:validate"]?.split("&&").map(command => command.trim()).includes("node tools/validate-repository-delivery.mjs"),
  "root package must expose delivery:validate",
);
assert(
  rootPackage.scripts?.test?.includes("pnpm delivery:validate"),
  "root test script must run delivery:validate first",
);
assert(workspace.includes('packages:\n  - "packages/*"\n  - "apps/*"'), "workspace must include packages/* and apps/*");
assert(rootReadme.includes("完整代码仓交付边界"), "root README must document complete-repository delivery");
assert(rootReadme.includes("选择仓库根目录"), "root README must identify the only Skill import directory");
assert(supportReadme.includes("它不是导入入口"), "support README must reject nested Skill import");
assert(rootReadme.includes("pnpm delivery:validate"), "root README must document delivery:validate");
assert(!exists("text-to-ui/SKILL.md"), "nested Skill entry must not exist");
assert(!exists("text-to-ui/agents/openai.yaml"), "nested Skill interface metadata must not exist");
assert(canonicalSkill.includes("Lock the Skill entry"), "Skill must lock one entry before routing");
assert(canonicalSkill.includes("RULES_ROOT"), "Skill must resolve support material root explicitly");
for (const routeId of Object.keys(workflowRoutes)) {
  assert(canonicalSkill.includes(`\`${routeId}\``), `Skill entry must name workflow route: ${routeId}`);
}
assert(!supportReadme.includes("V1 · HTML 初稿"), "support README must not teach a legacy default route");
assert(canonicalSkill.includes("Mandatory Gate 0: analyze and build the page blueprint"), "Text-to-UI Skill must keep the blueprint analysis gate");
assert(canonicalSkill.includes("page-blueprint.json"), "Text-to-UI Skill must require a page blueprint");
assert(canonicalSkill.includes("The blueprint is the design decision layer"), "Text-to-UI Skill must separate design decisions from bindings");
assert(requirementSpec.includes("The proposal must also expose the task model"), "requirement spec must preserve task-model analysis");

const registry = readJson("packages/component-contracts/src/components.json") ?? {};
const components = Array.isArray(registry.components) ? registry.components : [];
const frameworks = ["html", "react", "vue"];
assert(components.length > 0, "component registry must contain components");

for (const [index, component] of components.entries()) {
  const implementations = component?.implementations ?? {};
  for (const framework of frameworks) {
    const source = relativeSourcePath(implementations[framework]);
    assert(source.length > 0, `component ${index} is missing ${framework} implementation`);
    if (source) {
      assert(exists(source), `component ${component.id ?? index} ${framework} source is missing: ${source}`);
    }
  }
}



if (errors.length > 0) {
  console.error("repository delivery validation failed");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify(
      {
        ok: true,
        repositoryRoot: root,
        componentCount: components.length,
        frameworks,
        skillEntry: "SKILL.md",
        mirrorVerification: exists("skill/SKILL.md") ? "generated mirror verified" : "no local mirror generated",
      },
      null,
      2,
    ),
  );
}
