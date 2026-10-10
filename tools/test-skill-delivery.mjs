import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { syncSkill, verifySkill } from "../text-to-ui/scripts/skill-delivery.mjs";

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
  for (const file of ["pixso-native-scene-lib", "component-mapping-resolver", "coremail-semantic-adapter"]) {
    write(source, `scripts/${file}.mjs`, "export const ready = true;\n");
  }
  write(source, "scripts/obsolete-helper/main.js", "obsolete helper\n");
  write(source, "scripts/customized-helper/main.js", "obsolete helper with a local note\n");
  write(target, "scripts/pixso-native-scene-lib.mjs", "old local source");
  write(target, ".text-to-ui/run.json", "keep runtime state");
  write(target, "local-note.md", "keep extra local files");
  syncSkill(source, target, backup);
  assert.equal(fs.readFileSync(path.join(backup, "scripts/pixso-native-scene-lib.mjs"), "utf8"), "old local source");
  assert.equal(fs.readFileSync(path.join(target, ".text-to-ui/run.json"), "utf8"), "keep runtime state");
  assert.equal(fs.readFileSync(path.join(target, "local-note.md"), "utf8"), "keep extra local files");
  write(target, "scripts/customized-helper/local-note.md", "preserve untracked data");
  fs.rmSync(path.join(source, "scripts/obsolete-helper"), { recursive: true });
  fs.rmSync(path.join(source, "scripts/customized-helper"), { recursive: true });
  const removalBackup = path.join(temporary, "removal-backup");
  syncSkill(source, target, removalBackup);
  assert.equal(fs.existsSync(path.join(target, "scripts/obsolete-helper")), false);
  assert.equal(fs.existsSync(path.join(target, "scripts/obsolete-helper/main.js")), false);
  assert.equal(fs.readFileSync(path.join(removalBackup, "scripts/obsolete-helper/main.js"), "utf8"), "obsolete helper\n");
  assert.equal(fs.existsSync(path.join(target, "scripts/customized-helper/main.js")), false);
  assert.equal(fs.readFileSync(path.join(target, "scripts/customized-helper/local-note.md"), "utf8"), "preserve untracked data");
  assert.equal(fs.readFileSync(path.join(removalBackup, "scripts/customized-helper/main.js"), "utf8"), "obsolete helper with a local note\n");
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
  console.log("Skill delivery tests passed: stale managed-file cleanup, dependency drift, module linkage, backups, and local-state preservation.");
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
