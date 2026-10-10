#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  componentFactsEntries,
  componentFactsNames,
  readMappingRegistry,
  registryTargetLibrary,
  resolveRegistryPath,
  runtimeSemanticAliasesForProfile,
  runtimeSemanticMappingsForProfile,
  selectMappingProfile,
} from "./mapping-registry-lib.mjs";

const args = {};
for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index];
  if (!value.startsWith("--")) continue;
  const key = value.slice(2);
  const next = process.argv[index + 1];
  args[key] = next && !next.startsWith("--") ? next : true;
  if (args[key] !== true) index += 1;
}

const defaultRegistry = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../assets/design-system/mapping-registry.json",
);
const registryFile = path.resolve(args.registry || defaultRegistry);
const { value: registry } = readMappingRegistry(registryFile);
const profile = selectMappingProfile(registry, args.profile || null);
const esc = (value) =>
  String(value ?? "—")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>");
const code = (value) => "<code>" + esc(value) + "</code>";
const list = (values) =>
  [...new Set((values || []).filter(Boolean))].map(code).join("<br>") || "—";
const runtimeSemanticMappings = runtimeSemanticMappingsForProfile(profile);
const runtimeSemanticAliases = runtimeSemanticAliasesForProfile(profile);
const targetLibrary = registryTargetLibrary(registry, profile);
const targetFactsPath = targetLibrary?.facts
  ? resolveRegistryPath(registryFile, targetLibrary.facts)
  : null;
const targetFacts = targetFactsPath && fs.existsSync(targetFactsPath)
  ? JSON.parse(fs.readFileSync(targetFactsPath, "utf8"))
  : null;
const componentInventory = componentFactsEntries(targetFacts).filter(
  (item) => ["business", "helper"].includes(item.classification),
);
const targetNames = targetFacts
  ? componentFactsNames(targetFacts)
  : new Set();
const endpointComponentMappings = profile.endpointComponentMappings || [];
const runtimeAliasLogicalNames = new Set(
  endpointComponentMappings
    .filter((mapping) => mapping.pixsoTargetStatus === "registered" && mapping.pixsoTarget)
    .map((mapping) => mapping.htmlLogicalName),
);
const unifiedComponentMappings = [
  ...(profile.componentMappings || [])
    .filter((mapping) =>
      mapping.pixsoTargetStatus === "registered" &&
      mapping.pixsoTarget &&
      !runtimeAliasLogicalNames.has(mapping.htmlLogicalName),
    )
    .map((mapping) => ({
      runtimeComponentId: null,
      htmlLogicalName: mapping.htmlLogicalName,
      htmlRendererKey: mapping.htmlRendererKey,
      pixsoTarget: mapping.pixsoTarget,
      pixsoSpecKey: mapping.pixsoSpecKey,
      variant: mapping.runtimeBinding?.variant || null,
      mappingStatus: mapping.nativeSourceStatus,
      notes: null,
    })),
  ...endpointComponentMappings
    .filter((mapping) => mapping.pixsoTargetStatus === "registered" && mapping.pixsoTarget)
    .map((mapping) => ({
      runtimeComponentId: mapping.endpointComponentId,
      htmlLogicalName: mapping.htmlLogicalName,
      htmlRendererKey: mapping.contractId,
      pixsoTarget: mapping.pixsoTarget,
      pixsoSpecKey: mapping.sourceMappingTarget || mapping.htmlLogicalName,
      variant: mapping.pixsoVariant,
      mappingStatus: mapping.mappingStatus,
      notes: mapping.notes,
    })),
];
const formalMappingsByTarget = new Map();
for (const mapping of profile.componentMappings || []) {
  if (mapping.pixsoTargetStatus !== "registered" || !mapping.pixsoTarget) continue;
  const names = formalMappingsByTarget.get(mapping.pixsoTarget) || [];
  names.push(mapping.htmlLogicalName);
  formalMappingsByTarget.set(mapping.pixsoTarget, names);
}
const subcomponentMappingsByTarget = new Map();
for (const mapping of profile.componentMappings || []) {
  for (const submapping of mapping.subcomponentMappings || []) {
    const names = subcomponentMappingsByTarget.get(submapping.pixsoTarget) || [];
    names.push(`${mapping.htmlLogicalName} · ${submapping.htmlSlot}/${submapping.htmlRole}`);
    subcomponentMappingsByTarget.set(submapping.pixsoTarget, names);
  }
}
const endpointMappingsByTarget = new Map();
for (const mapping of endpointComponentMappings) {
  const names = endpointMappingsByTarget.get(mapping.pixsoTarget) || [];
  names.push(`${mapping.endpointComponentId} → ${mapping.htmlLogicalName}`);
  endpointMappingsByTarget.set(mapping.pixsoTarget, names);
}
const nativeSpecsByTarget = new Map();
for (const mapping of profile.nativeSourceMappings || []) {
  const componentSet = mapping?.source?.componentSet;
  if (!componentSet || !mapping.target) continue;
  const targets = nativeSpecsByTarget.get(componentSet) || [];
  if (!targets.includes(mapping.target)) targets.push(mapping.target);
  nativeSpecsByTarget.set(componentSet, targets);
}
const variantAxes = (axes) => Object.entries(axes || {})
  .map(([key, values]) => `${key}=${(values || []).join(" / ")}`)
  .join("；") || "—";

const out = [];
out.push("---");
out.push("aliases:");
out.push("  - HTML 与 Pixso Token 对应表");
out.push("  - HTML 与 Pixso Component 对应表");
out.push("tags:");
out.push("  - text-to-ui");
out.push("  - pixso");
out.push("  - mapping-registry");
out.push("verified: " + new Date().toISOString().slice(0, 10));
out.push("source: assets/design-system/mapping-registry.json");
out.push("---");
out.push("");
out.push("# Text-to-UI：跨源 Token / Component 映射表");
out.push("");
out.push("> 日常维护请使用 Obsidian 的 `Text-to-UI-映射维护台`，本文件只作为详细结果报告。");
out.push("");
out.push("所有组件都以 HTML logicalName 为正式身份。运行时组件 ID（如有）只是同一行中的代码调用别名，不是另一类组件映射。");
out.push("");
out.push(
  "当前 profile：" + code(profile.id) + " · " + esc(profile.label) +
    "。本文件是详细可读视图；日常修改请填写 Obsidian 映射维护台的人工编辑区，由同步脚本回写 registry，不要直接编辑本文件。",
);
out.push("");
out.push("| 统计 | 数量 |");
out.push("| --- | ---: |");
out.push("| canonical Token mappings | " + (profile.tokenMappings?.length || 0) + " |");
out.push("| semantic Token mappings | " + (profile.semanticTokenMappings?.length || 0) + " |");
out.push("| runtime semantic mappings (generated index) | " + runtimeSemanticMappings.length + " |");
out.push("| runtime-only semantic aliases | " + runtimeSemanticAliases.length + " |");
out.push("| semantic color mappings | " + (profile.semanticColorMappings?.length || 0) + " |");
out.push("| Style mappings | " + (profile.styleMappings?.length || 0) + " |");
out.push("| HTML formal Component mappings | " + unifiedComponentMappings.length + " |");
out.push("| current Pixso business components | " + componentInventory.filter((item) => item.classification === "business").length + " |");
out.push("| current Pixso exact target names | " + targetNames.size + " |");
out.push("| native source mappings | " + (profile.nativeSourceMappings?.length || 0) + " |");
out.push("");
out.push("## Token ↔ Pixso Variable");
out.push("");
out.push("| HTML CSS Token | HTML source | Pixso 集合 / Mode | Pixso Variable | Transform |");
out.push("| --- | --- | --- | --- | --- |");
for (const mapping of profile.tokenMappings || []) {
  out.push(
    "| " + code(mapping.htmlCssVariable) + " | " +
      esc(mapping.htmlSourceToken) + " | " +
      esc(mapping.pixsoCollection) + " / " + esc(mapping.pixsoMode) + " | " +
      code(mapping.pixsoVariable) + " | " +
      esc(mapping.valueTransform || "identity") + " |",
  );
}
out.push("");
out.push("## Semantic Token ↔ Pixso Variable");
out.push("");
out.push("| Semantic role | HTML CSS Token | HTML source | Pixso Variable | Transform |");
out.push("| --- | --- | --- | --- | --- |");
for (const mapping of profile.semanticTokenMappings || []) {
  out.push(
    "| " + code(mapping.role) + " | " +
      code(mapping.htmlCssVariable) + " | " +
      esc(mapping.htmlSourceToken) + " | " +
      code(mapping.pixsoVariable) + " | " +
      esc(mapping.valueTransform || "identity") + " |",
  );
}
out.push("");
if (runtimeSemanticAliases.length) {
  out.push("## Runtime-only Semantic Role Aliases");
  out.push("");
  out.push("这些角色只服务于运行时语义解析，不重复进入 dual-output 渲染映射；仍在中心 registry 中维护。");
  out.push("");
  out.push("| Runtime role | HTML CSS Token | HTML source | Pixso Variable | Transform |");
  out.push("| --- | --- | --- | --- | --- |");
  for (const mapping of runtimeSemanticAliases) {
    out.push(
      "| " + code(mapping.role) + " | " +
        code(mapping.htmlCssVariable) + " | " +
        esc(mapping.htmlSourceToken) + " | " +
        code(mapping.pixsoVariable) + " | " +
        esc(mapping.valueTransform || "identity") + " |",
    );
  }
  out.push("");
}
out.push("## Semantic Color");
out.push("");
out.push("| Semantic role | HTML CSS Token(s) | Pixso Variable(s) | Composition |");
out.push("| --- | --- | --- | --- |");
for (const mapping of profile.semanticColorMappings || []) {
  out.push(
    "| " + code(mapping.role) + " | " +
      list(mapping.htmlCssVariables) + " | " +
      list(mapping.pixsoVariables) + " | " +
      esc(mapping.composition) + " |",
  );
}
out.push("");
out.push("## HTML Token ↔ Pixso Style");
out.push("");
out.push("标准 Typography role 直接引用 Pixso Text Style，例如 `body-l` → `Typography/Body_L`；字号、行高、字重和字体变量是基础定义/校验层。只有没有匹配正式 Text Style 的非标准计算值才使用属性级回退。样式必须存在于当前 Pixso 文件，并通过 live readback 确认绑定。");
out.push("");
out.push("| 类型 | HTML Token | HTML CSS | Pixso Style | 参数 / 用途 |");
out.push("| --- | --- | --- | --- | --- |");
for (const mapping of profile.styleMappings || []) {
  const css = mapping.htmlCssPrefix || mapping.htmlCssVariable || "—";
  const detail =
    mapping.kind === "text"
      ? String(mapping.fontSize) + "px / " + mapping.lineHeight + "px / " + mapping.fontWeight
      : mapping.usage || "—";
  out.push(
    "| " + esc(mapping.kind) + " | " +
      code(mapping.htmlToken) + " | " +
      code(css) + " | " +
      code(mapping.pixsoStyle) + " | " +
      esc(detail) + " |",
  );
}
out.push("");
out.push("## HTML Component ↔ Pixso Component");
out.push("");
out.push("当前 Pixso 组件事实与 Text-to-UI 规格是两层数据：`pixsoTarget` 使用当前 Pixso Component Set/COMPONENT 的 exact name，`pixsoSpecKey` 使用 Text-to-UI 视觉规格键。只有 target status 为 `registered` 的行才是正式目标；同族候选不自动绑定。");
out.push("");
out.push("### 当前 Pixso 组件清单（事实快照）");
out.push("");
if (targetFacts) {
  out.push("来源：" + esc(targetFacts.source) + "；采集时间：" + esc(targetFacts.capturedAt) + "；目标页：" + code(targetFacts.page) + "。");
  out.push("当前快照包含 " + componentInventory.filter((item) => item.classification === "business").length + " 个业务组件、" + componentInventory.filter((item) => item.classification === "helper").length + " 个辅助 Component Set；Pixso 回读总数还包含支持性图标等对象，它们不自动进入业务组件映射。");
  out.push("");
  out.push("| Pixso exact name | Pixso object | 分类 | Variant 轴 | HTML 映射 |");
  out.push("| --- | --- | --- | --- | --- |");
  for (const item of componentInventory) {
    const htmlMappings = formalMappingsByTarget.get(item.name) || [];
    const nativeSpecs = nativeSpecsByTarget.get(item.name) || [];
    const subcomponentMappings = subcomponentMappingsByTarget.get(item.name) || [];
    out.push(
      "| " + code(item.name) + " | " + esc(item.kind === "component-set" ? "Component Set" : "COMPONENT") + " | " +
        esc(item.classification) + " | " + esc(variantAxes(item.variantAxes)) + " | " +
        (item.classification === "helper"
          ? "Dialog 内部依赖"
          : htmlMappings.length
            ? htmlMappings.map(code).join("<br>")
            : subcomponentMappings.length
              ? "已关联内部子映射：" + subcomponentMappings.map(code).join("<br>")
            : (endpointMappingsByTarget.get(item.name) || []).length
              ? "HTML 正式映射：" + endpointMappingsByTarget.get(item.name).map(code).join("<br>")
            : nativeSpecs.length
              ? "已关联 spec：" + nativeSpecs.map(code).join("<br>") + "<br>未建立 HTML 一对一映射"
              : "未建立 HTML 映射（待确认）") + " |",
    );
  }
  out.push("");
}
out.push("");
out.push("### 正式映射");
out.push("");
out.push("| Runtime component ID (optional) | HTML logicalName | Renderer / contract | Pixso exact component | Text-to-UI spec key | Pixso Variant | Mapping status | Notes |");
out.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
for (const mapping of unifiedComponentMappings) {
  const notes = Array.isArray(mapping.notes) ? mapping.notes.join("<br>") : mapping.notes;
  out.push(
      "| " + code(mapping.runtimeComponentId || "—") + " | " + code(mapping.htmlLogicalName) + " | " +
      code(mapping.htmlRendererKey) + " | " +
      (mapping.pixsoTarget ? code(mapping.pixsoTarget) : "—") + " | " +
      (mapping.pixsoSpecKey ? code(mapping.pixsoSpecKey) : "—") + " | " +
      esc(JSON.stringify(mapping.variant || {})) + " | " +
      esc(mapping.mappingStatus) + " | " + esc(notes || "—") + " |",
  );
}
out.push("");
const subcomponentMappings = (profile.componentMappings || []).flatMap((mapping) =>
  (mapping.subcomponentMappings || []).map((submapping) => ({
    parent: mapping.htmlLogicalName,
    ...submapping,
  })),
);
if (subcomponentMappings.length) {
  out.push("### 组件内部子映射 / Slot Mapping");
  out.push("");
  out.push("这类关系描述 HTML 组件内部的结构化子组件，不会把父组件改名或拆成多个独立 HTML logicalName。当前 Titlebar 的窗口三键组属于这一类。");
  out.push("");
  out.push("| HTML parent | HTML slot / role | 稳定 DOM 选择器 | 数量 | Pixso exact Component Set | Text-to-UI spec context | HTML size → Pixso variant | 子动作 / Pixso layer / icon |");
  out.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const mapping of subcomponentMappings) {
    const actions = (mapping.actions || []).map((action) =>
      action.htmlAction + " → " + action.pixsoLayer + " → " + action.iconAlias,
    ).join("<br>");
    const variants = Object.entries(mapping.variantByHtmlSize || {}).map(([size, variant]) =>
      size + " → " + JSON.stringify(variant),
    ).join("<br>");
    out.push(
      "| " + code(mapping.parent) + " | " + code(mapping.htmlSlot + " / " + mapping.htmlRole) + " | " +
        code(mapping.htmlSelector) + " | " + esc(mapping.cardinality) + " | " + code(mapping.pixsoTarget) + " | " +
        code(mapping.textToUiSpecKey) + " | " + esc(variants) + " | " + esc(actions) + " |",
    );
  }
  out.push("");
}
const excludedComponentMappings = (profile.componentMappings || []).filter(
  (item) => item.pixsoMappingPolicy === "excluded",
);
out.push("### 明确不映射");
out.push("");
out.push("这些组件保留框架实现，但不会自动创建或解析 Pixso 组件，也不属于待补映射。");
out.push("");
out.push("| HTML logicalName | Renderer | Policy | Reason |");
out.push("| --- | --- | --- | --- |");
for (const mapping of excludedComponentMappings) {
  out.push(
    "| " + code(mapping.htmlLogicalName) + " | " +
      code(mapping.htmlRendererKey) + " | " +
      esc(mapping.pixsoMappingPolicy) + " | " +
      esc(mapping.pixsoMappingReason) + " |",
  );
}
out.push("");
out.push("### 尚未正式映射");
out.push("");
out.push("这些行目前不能自动实例化；请在 Obsidian 维护台确认 Pixso exact name 后提交 `state=pending` 的组件变更。");
out.push("");
out.push("| HTML logicalName | Renderer | Pixso target | Target status | Native source status |");
out.push("| --- | --- | --- | --- | --- |");
for (const mapping of (profile.componentMappings || []).filter((item) =>
  item.pixsoMappingPolicy !== "excluded" && (item.pixsoTargetStatus !== "registered" || !item.pixsoTarget)
)) {
  out.push(
    "| " + code(mapping.htmlLogicalName) + " | " +
      code(mapping.htmlRendererKey) + " | — | " +
      esc(mapping.pixsoTargetStatus || "unregistered") + " | " +
      esc(mapping.nativeSourceStatus) + " |",
  );
}
out.push("");
out.push("## Native / External Component Source");
out.push("");
out.push("| Source library | Source component set | Source Variant | Target HTML/Pixso logical name |");
out.push("| --- | --- | --- | --- |");
for (const mapping of profile.nativeSourceMappings || []) {
  const target = mapping.targetHtmlLogicalName || mapping.target || "—";
  out.push(
    "| " + code(mapping.sourceLibrary || profile.nativeSourceLibrary) + " | " +
      code(mapping.source?.componentSet) + " | " +
      esc(JSON.stringify(mapping.source?.variant || {})) + " | " +
      code(target) + " |",
  );
}
out.push("");
out.push("## 维护规则");
out.push("");
out.push("- 编辑入口：assets/design-system/mapping-registry.json 的 profiles；运行时专用别名维护在 runtimeSemanticAliases，完整 runtime semantic index 由 semanticTokenMappings + runtimeSemanticAliases 自动生成。");
out.push("- 同一个 HTML 源对接不同 Pixso 文件或组件库时，新建 profile；不要覆盖已有 profile。");
out.push("- HTML Component 以 logicalName 为身份，运行时组件 ID（例如 button contract 的 icon-text-primary、icon）只是可选实现别名，统一从 Obsidian 的 HTML Component 表维护；Pixso Component 以当前文件中的 exact Component Set/COMPONENT name 为身份，Variant 记录在正式映射行中。父组件内部的复合结构使用 componentMappings[].subcomponentMappings，不把内部组误记成独立 HTML Component。");
out.push("- Pixso GUID、node ID、file key 不进入 registry；运行时重新解析。");
out.push("- Obsidian 变更先填写人工编辑区并运行 scripts/sync-obsidian-mapping-edits.mjs --check/--write；不要直接改生成的完整报告。");
out.push("- 修改后依次运行 pnpm mappings:validate、相关 projection build/check，再重新生成本文件。");
out.push("");

const markdown = out.join("\n").replace(/\n+$/, "\n");
if (args.out) {
  const output = path.resolve(args.out);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, markdown);
  console.log("Wrote mapping registry view: " + output);
} else {
  process.stdout.write(markdown);
}
