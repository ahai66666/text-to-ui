#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_MAPPING_REGISTRY,
  SKILL_ROOT,
} from "./mapping-registry-lib.mjs";
import {
  defaultEditQueue,
  parseEditQueue,
} from "./obsidian-mapping-edit-lib.mjs";

const script = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "sync-obsidian-mapping-edits.mjs",
);
const workbookBuilder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "build-obsidian-mapping-workbook.mjs",
);
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-obsidian-mapping-"));
try {
  const registryPath = path.join(tempRoot, "mapping-registry.json");
  const notePath = path.join(tempRoot, "mapping-workbook.md");
  fs.copyFileSync(DEFAULT_MAPPING_REGISTRY, registryPath);
  let note = defaultEditQueue();
  note = note.replace(
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n" +
      "| pending | update | html-to-pixso-harmonyos-client | Select/Default |  |  | select | Selection Dropdown | Select/White Surface/Default | registered |  |  | not-applicable | parser test |\n" +
      "| pending | update | html-to-pixso-harmonyos-client | Icon Text Button/Secondary/Default | icon-text-secondary | button |  | icon-text |  | registered | {\"size\":\"Medium\",\"state\":\"Default\",\"type\":\"secondary\"} | mapped-pending-verification |  | parser test |\n",
  );
  note = note.replace(
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n\n### 填写示例",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n" +
      "| pending | update | html-to-pixso-harmonyos-client | semantic-token | action/primary/background | --color-brand-100 | brand/90 |  |  | identity | parser test |\n" +
        "| pending | update | html-to-pixso-harmonyos-client | runtime-semantic | spacing/button-icon-label | --gap-button-icon-label | space/4 |  |  | identity | parser test |\n\n### 填写示例",
  );
  note = note.replace(
    "| --- | ------ | ------- | ---------- | -------- | -------- | ------------ | ----------- | ---------------- | ------------------ | ------- | ---- |\n",
    "| --- | ------ | ------- | ---------- | -------- | -------- | ------------ | ----------- | ---------------- | ------------------ | ------- | ---- |\n" +
      "| pending | update | html-to-pixso-harmonyos-client | Titlebar/Default | actions | window-controls | .tui-titlebar__actions > [data-slot=\"titlebar-action\"] | control button | Titlebar/L/Normal | {\"small\":{\"状态\":\"Small size\"},\"medium\":{\"状态\":\"Normal size\"},\"large\":{\"状态\":\"Normal size\"},\"xlarge\":{\"状态\":\"Normal size\"}} | [{\"htmlAction\":\"minimize\",\"pixsoLayer\":\"最小化\",\"iconAlias\":\"window/minimize\"},{\"htmlAction\":\"maximize\",\"pixsoLayer\":\"最大化\",\"iconAlias\":\"window/maximize\"},{\"htmlAction\":\"close\",\"pixsoLayer\":\"关闭\",\"iconAlias\":\"window/close\"}] | parser test |\n",
  );
  fs.writeFileSync(notePath, note);
  const parsed = parseEditQueue(note);
  assert.equal(parsed.rows.filter((row) => row.state === "pending").length, 5);

  const output = execFileSync(
    process.execPath,
    [script, "--write", "--note", notePath, "--registry", registryPath],
    { cwd: SKILL_ROOT, encoding: "utf8" },
  );
  assert.match(output, /5 pending row\(s\)/);
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const profile = registry.profiles.find((item) => item.id === registry.defaultProfile);
  const component = profile.componentMappings.find((item) => item.htmlLogicalName === "Select/Default");
  assert.equal(component.pixsoTarget, "Selection Dropdown");
  assert.equal(component.pixsoSpecKey, "Select/White Surface/Default");
  assert.equal(component.pixsoTargetStatus, "registered");
  const token = profile.semanticTokenMappings.find((item) => item.role === "action/primary/background");
  assert.equal(token.pixsoVariable, "brand/90");
  const runtimeAlias = profile.runtimeSemanticAliases.find((item) => item.role === "spacing/button-icon-label");
  assert.equal(runtimeAlias.pixsoVariable, "space/4");
  const titlebar = profile.componentMappings.find((item) => item.htmlLogicalName === "Titlebar/Default");
  const windowControls = titlebar.subcomponentMappings.find((item) => item.htmlRole === "window-controls");
  assert.equal(windowControls.pixsoTarget, "control button");
  assert.equal(windowControls.variantByHtmlSize.small["状态"], "Small size");
  assert.equal(windowControls.actions.find((item) => item.htmlAction === "close").pixsoLayer, "关闭");
  const endpointMapping = profile.endpointComponentMappings.find((item) => item.endpointComponentId === "icon-text-secondary");
  assert.equal(endpointMapping.pixsoTarget, "icon-text");
  assert.equal(endpointMapping.pixsoVariant.type, "secondary");
  assert.equal(endpointMapping.mappingStatus, "mapped-pending-verification");
  assert.match(fs.readFileSync(notePath, "utf8"), /\| applied \| update \|/);

  execFileSync(
    process.execPath,
    [
      workbookBuilder,
      "--profile",
      "html-to-pixso-harmonyos-client",
      "--registry",
      registryPath,
      "--out",
      notePath,
    ],
    { cwd: SKILL_ROOT, encoding: "utf8" },
  );
  const rebuiltNote = fs.readFileSync(notePath, "utf8");
  assert.match(rebuiltNote, /## 3\. 当前 Pixso 组件清单（事实快照）/);
  assert.match(rebuiltNote, /\| `Button` \|/);
  assert.match(rebuiltNote, /\| `CheckBox` \|/);
  assert.match(rebuiltNote, /\| `Snackbar\/ColorPicker-Tablet` \|/);
  assert.match(rebuiltNote, /Pixso exact component/);
  assert.match(rebuiltNote, /Titlebar \/ 组件内部子映射/);
  assert.match(rebuiltNote, /`control button`/);
  assert.match(rebuiltNote, /当前 HTML 正式映射/);
  assert.match(rebuiltNote, /运行时组件 ID（可选）/);
  assert.match(rebuiltNote, /`icon-text-secondary`/);
  assert.match(rebuiltNote, /`Icon Button`/);
  assert.match(rebuiltNote, /## \d+\. Typography 映射规则（直接引用 Pixso Text Style，13 条）/);
  assert.match(rebuiltNote, /`body-l`/);
  assert.match(rebuiltNote, /`body-s`/);
  assert.match(rebuiltNote, /`caption-m`/);
  assert.match(rebuiltNote, /`Typography\/Body_L`/);
  assert.match(rebuiltNote, /标准样式直接引用/);
  assert.match(rebuiltNote, /## \d+\. Token ↔ Pixso Variable 明细（自动生成，只读）/);
  assert.match(rebuiltNote, /\| `--color-brand-05` \| tokens\.colors\.json:brand\.05 \| `brand\/05` \|/);
  assert.ok(
    rebuiltNote.includes(
      `| Canonical Token ↔ Pixso Variable | \`tokenMappings\` | ${profile.tokenMappings.length} |`,
    ),
  );
  assert.ok(
    rebuiltNote.includes(
      `| Runtime-only Alias ↔ Pixso Variable | \`runtimeSemanticAliases\` | ${profile.runtimeSemanticAliases.length} |`,
    ),
  );
  assert.match(rebuiltNote, /Runtime Semantic Index（自动生成）/);
  assert.match(rebuiltNote, /## \d+\. 同步步骤/);
  console.log("Obsidian mapping sync integration valid.");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
