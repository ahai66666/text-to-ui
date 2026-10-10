import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { skillFiles, verifySkill } from "../text-to-ui/scripts/skill-delivery.mjs";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(repository, "text-to-ui");
const entryFile = path.join(repository, "SKILL.md");
const metadataFile = path.join(repository, "agents", "openai.yaml");
const version = JSON.parse(fs.readFileSync(path.join(source, "package.json"), "utf8")).version;
assert.match(version, /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/, "Invalid Skill version");

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-skill-package-"));
const stage = path.join(temporary, "stage");
const stagedSkill = path.join(stage, "text-to-ui");
const extracted = path.join(temporary, "extracted");
const checking = process.argv.includes("--check");
const archive = checking
  ? path.join(temporary, `text-to-ui-skill-v${version}.zip`)
  : path.join(repository, "release", `text-to-ui-skill-v${version}.zip`);
const digest = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} failed: ${result.error?.message ?? result.stderr ?? result.stdout}`);
  }
};

try {
  const files = ["SKILL.md", "agents/openai.yaml", ...skillFiles(source)].sort();
  assert(fs.existsSync(entryFile), "Skill entry is missing");
  assert(fs.existsSync(metadataFile), "Skill interface metadata is missing");
  assert(!skillFiles(source).includes("SKILL.md"), "Nested Skill entry must not be published");
  assert(!skillFiles(source).includes("agents/openai.yaml"), "Nested Skill interface metadata must not be published");
  const entry = fs.readFileSync(entryFile, "utf8");
  const frontmatter = entry.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert(frontmatter, "SKILL.md YAML frontmatter is missing");
  assert.match(frontmatter[1], /^name:\s*text-to-ui\s*$/m, "SKILL.md name must match the packaged folder");
  assert.match(frontmatter[1], /^description:\s*\S.+$/m, "SKILL.md description is missing");

  for (const file of files) {
    const target = path.join(stagedSkill, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file === "SKILL.md" ? entryFile : file === "agents/openai.yaml" ? metadataFile : path.join(source, file), target);
  }
  verifySkill(source, stagedSkill);
  fs.mkdirSync(path.dirname(archive), { recursive: true });
  if (fs.existsSync(archive)) fs.rmSync(archive);
  run("zip", ["-q", "-r", archive, "text-to-ui"], { cwd: stage });
  run("unzip", ["-q", archive, "-d", extracted]);

  assert.deepEqual(fs.readdirSync(extracted), ["text-to-ui"], "Archive must have one top-level Skill folder");
  const unpackedSkill = path.join(extracted, "text-to-ui");
  assert.deepEqual(skillFiles(unpackedSkill), files.sort(), "Unpacked Skill files differ from canonical source");
  for (const file of files) {
    assert.equal(digest(path.join(unpackedSkill, file)), digest(file === "SKILL.md" ? entryFile : file === "agents/openai.yaml" ? metadataFile : path.join(source, file)), `${file} changed in the archive`);
  }
  console.log(`Verified ${path.basename(archive)}: text-to-ui/SKILL.md, ${files.length} files, version ${version}.`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
