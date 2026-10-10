import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { syncSkill, verifySkill } from "../skill-support/scripts/skill-delivery.mjs";

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-delivery-test-"));
const source = path.join(temporary, "source");
const target = path.join(temporary, "target");
const backup = path.join(temporary, "backup");
const write = (root, file, content) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), content);
};
try {
  write(source, "package.json", '{"version":"test"}');
  write(source, "SKILL.md", "---\nname: text-to-ui\ndescription: Test Skill delivery.\n---\n");
  for (const file of ["pixso-native-scene-lib", "component-mapping-resolver", "coremail-semantic-adapter"]) {
    write(source, `scripts/${file}.mjs`, "export const ready = true;\n");
  }
  write(target, "scripts/pixso-native-scene-lib.mjs", "old local source");
  write(target, ".text-to-ui/run.json", "keep runtime state");
  write(target, "local-note.md", "keep extra local files");
  syncSkill(source, target, backup);
  assert.equal(fs.readFileSync(path.join(backup, "scripts/pixso-native-scene-lib.mjs"), "utf8"), "old local source");
  assert.equal(fs.readFileSync(path.join(target, ".text-to-ui/run.json"), "utf8"), "keep runtime state");
  assert.equal(fs.readFileSync(path.join(target, "local-note.md"), "utf8"), "keep extra local files");
  // A file that was previously managed but disappeared from the canonical
  // source must be reported as drift; untracked local notes remain allowed.
  const manifest = JSON.parse(fs.readFileSync(path.join(target, ".delivery-manifest.json"), "utf8"));
  manifest.files["stale-managed.md"] = "old-hash";
  fs.writeFileSync(path.join(target, ".delivery-manifest.json"), JSON.stringify(manifest));
  write(target, "stale-managed.md", "old generated rule");
  assert.throws(() => verifySkill(source, target), /stale-managed\.md \(stale managed file\)/);
  delete manifest.files["stale-managed.md"];
  fs.writeFileSync(path.join(target, ".delivery-manifest.json"), JSON.stringify(manifest));
  write(target, "scripts/component-mapping-resolver.mjs", "changed dependency");
  assert.throws(() => verifySkill(source, target), /component-mapping-resolver/);
  // Matching hashes alone must not hide the original missing-export failure.
  for (const root of [source, target]) {
    write(root, "scripts/component-mapping-resolver.mjs", "export const ready = true;\n");
    write(root, "scripts/pixso-native-scene-lib.mjs", 'import { missing } from "./component-mapping-resolver.mjs";\n');
  }
  assert.throws(() => verifySkill(source, target), /Skill entry cannot load/);
  const repository = path.join(temporary, "repository");
  const support = path.join(repository, "skill-support");
  const generated = path.join(repository, "skill");
  write(repository, "SKILL.md", "---\nname: text-to-ui\ndescription: Repository entry.\n---\n");
  write(repository, "agents/openai.yaml", 'interface:\n  display_name: "Text to UI"\n');
  write(support, "package.json", '{"version":"test"}');
  for (const file of ["pixso-native-scene-lib", "component-mapping-resolver", "coremail-semantic-adapter"]) {
    write(support, `scripts/${file}.mjs`, "export const ready = true;\n");
  }
  syncSkill(support, generated, path.join(temporary, "repository-backup"));
  assert.equal(fs.readFileSync(path.join(generated, "SKILL.md"), "utf8"), fs.readFileSync(path.join(repository, "SKILL.md"), "utf8"));
  assert.equal(fs.readFileSync(path.join(generated, "agents/openai.yaml"), "utf8"), fs.readFileSync(path.join(repository, "agents/openai.yaml"), "utf8"));
  assert(!fs.existsSync(path.join(support, "SKILL.md")));
  console.log("Skill delivery tests passed: root entry packaging, dependency drift, module linkage, backups, and local-state preservation.");
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
