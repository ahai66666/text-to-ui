#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_MAPPING_REGISTRY,
  componentFactsEntries,
  componentFactsNames,
  readMappingRegistry,
  registryTargetLibrary,
  resolveRegistryPath,
  runtimeSemanticAliasesForProfile,
  runtimeSemanticMappingsForProfile,
  selectMappingProfile,
} from "./mapping-registry-lib.mjs";
import {
  defaultEditQueue,
  preserveEditQueue,
  renderTableRow,
} from "./obsidian-mapping-edit-lib.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = {};
for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index];
  if (!value.startsWith("--")) continue;
  const key = value.slice(2);
  const next = process.argv[index + 1];
  args[key] = next && !next.startsWith("--") ? next : true;
  if (args[key] !== true) index += 1;
}

const registryPath = path.resolve(args.registry || DEFAULT_MAPPING_REGISTRY);
const outputPath = args.out ? path.resolve(args.out) : null;
const workbookPath = outputPath || "/absolute/path/to/Text-to-UI-映射维护台.md";
const existing = outputPath && fs.existsSync(outputPath)
  ? fs.readFileSync(outputPath, "utf8")
  : "";
const { value: registry } = readMappingRegistry(registryPath);
const profile = selectMappingProfile(registry, args.profile || null);
const registryHash = crypto
  .createHash("sha256")
  .update(JSON.stringify(registry))
  .digest("hex");

const code = (value) => `\`${String(value ?? "—").replace(/`/g, "\\`")}\``;
const html = (value) => String(value ?? "—").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
const list = (values) => (values || []).length
  ? values.map((value) => code(value)).join("<br>")
  : "—";
const targetLibrary = registryTargetLibrary(registry, profile);
const targetRegistryPath = targetLibrary?.registry
  ? resolveRegistryPath(registryPath, targetLibrary.registry)
  : null;
const targetFactsPath = targetLibrary?.facts
  ? resolveRegistryPath(registryPath, targetLibrary.facts)
  : null;
const targetRegistry = targetRegistryPath && fs.existsSync(targetRegistryPath)
  ? JSON.parse(fs.readFileSync(targetRegistryPath, "utf8"))
  : {};
const targetFacts = targetFactsPath && fs.existsSync(targetFactsPath)
  ? JSON.parse(fs.readFileSync(targetFactsPath, "utf8"))
  : null;
const targetNames = targetFacts
  ? componentFactsNames(targetFacts)
  : new Set(Object.values(targetRegistry.categories || {}).flat());
const componentInventory = componentFactsEntries(targetFacts).filter(
  (item) => ["business", "helper"].includes(item.classification),
);
const targetPixsoDocument = (registry.sources?.pixso || []).find(
  (source) => source.id === profile.targetPixsoDocument,
);
const pixsoVariablesPath = targetPixsoDocument?.variables
  ? resolveRegistryPath(registryPath, targetPixsoDocument.variables)
  : null;
const pixsoVariablesManifest = pixsoVariablesPath && fs.existsSync(pixsoVariablesPath)
  ? JSON.parse(fs.readFileSync(pixsoVariablesPath, "utf8"))
  : {};
const pixsoVariableIndex = new Map();
for (const collection of pixsoVariablesManifest.collections || []) {
  for (const [name, variable] of Object.entries(collection.variables || {})) {
    pixsoVariableIndex.set(name, {
      collection: collection.name || "—",
      mode: (collection.modes || []).join(", ") || "—",
      value: variable?.value,
    });
  }
}
const componentMappings = profile.componentMappings || [];
const endpointComponentMappings = profile.endpointComponentMappings || [];
const formalComponentMappings = componentMappings.filter(
  (mapping) => mapping.pixsoTargetStatus === "registered" && mapping.pixsoTarget,
);
const runtimeAliasMappings = endpointComponentMappings.filter(
  (mapping) => mapping.pixsoTargetStatus === "registered" && mapping.pixsoTarget,
);
const runtimeAliasesByLogicalName = new Set(
  runtimeAliasMappings.map((mapping) => mapping.htmlLogicalName),
);
const unifiedComponentMappings = [
  ...formalComponentMappings
    .filter((mapping) => !runtimeAliasesByLogicalName.has(mapping.htmlLogicalName))
    .map((mapping) => ({
    runtimeComponentId: null,
    contractId: null,
    htmlLogicalName: mapping.htmlLogicalName,
    htmlRendererKey: mapping.htmlRendererKey,
    pixsoTarget: mapping.pixsoTarget,
    pixsoSpecKey: mapping.pixsoSpecKey,
    pixsoTargetStatus: mapping.pixsoTargetStatus,
    variant: mapping.runtimeBinding?.variant || null,
    mappingStatus: mapping.nativeSourceStatus,
    notes: null,
    })),
  ...runtimeAliasMappings.map((mapping) => ({
    runtimeComponentId: mapping.endpointComponentId,
    contractId: mapping.contractId,
    htmlLogicalName: mapping.htmlLogicalName,
    htmlRendererKey: mapping.contractId,
    pixsoTarget: mapping.pixsoTarget,
    pixsoSpecKey: mapping.sourceMappingTarget || mapping.htmlLogicalName,
    pixsoTargetStatus: mapping.pixsoTargetStatus,
    variant: mapping.pixsoVariant,
    mappingStatus: mapping.mappingStatus,
    notes: mapping.notes,
  })),
];
const pendingComponentMappings = componentMappings.filter(
  (mapping) => !(mapping.pixsoTargetStatus === "registered" && mapping.pixsoTarget) && mapping.pixsoMappingPolicy !== "excluded",
);
const excludedComponentMappings = componentMappings.filter(
  (mapping) => mapping.pixsoMappingPolicy === "excluded",
);
const semanticTokenMappings = profile.semanticTokenMappings || [];
const runtimeSemanticMappings = runtimeSemanticMappingsForProfile(profile);
const runtimeSemanticAliases = runtimeSemanticAliasesForProfile(profile);
const semanticColorMappings = profile.semanticColorMappings || [];
const semanticColorLiteralOnlyCount = semanticColorMappings.filter(
  (mapping) => !(mapping.pixsoVariables || []).length,
).length;

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function variableScope(names) {
  const values = unique(names);
  if (!values.length) return "—";
  return values.map((name) => {
    const variable = pixsoVariableIndex.get(name);
    return variable
      ? html(variable.collection + " / " + variable.mode)
      : "—";
  }).join("<br>");
}

function variableCheck(names) {
  const values = unique(names);
  if (!values.length) return "literal-only（没有 Pixso Variable）";
  const missing = values.filter((name) => !pixsoVariableIndex.has(name));
  return missing.length
    ? "⚠ 缺少 exact Variable：" + missing.map((name) => code(name)).join("<br>")
    : "✓ exact name 已在 Pixso Variable 清单中";
}

function mappingCheck(names) {
  return variableCheck(names);
}

function variantAxesSummary(axes) {
  const entries = Object.entries(axes || {});
  return entries.length
    ? entries.map(([key, values]) => `${key}=${(values || []).join(" / ")}`).join("；")
    : "—";
}

function candidatesFor(logicalName) {
  const family = String(logicalName || "").split("/")[0];
  return [...targetNames]
    .filter((name) => name !== logicalName && (name === family || name.startsWith(family + "/")))
    .slice(0, 10);
}

function runtimeSummary(mapping) {
  const binding = mapping.runtimeBinding;
  if (!binding) return "—";
  const name = binding.componentSetName || binding.pixsoName || "—";
  const variant = binding.variant && Object.keys(binding.variant).length
    ? " · " + JSON.stringify(binding.variant)
    : "";
  return code(name + variant);
}

const formalMappingsByTarget = new Map();
for (const mapping of formalComponentMappings) {
  const existingMappings = formalMappingsByTarget.get(mapping.pixsoTarget) || [];
  existingMappings.push(mapping.htmlLogicalName);
  formalMappingsByTarget.set(mapping.pixsoTarget, existingMappings);
}
const subcomponentMappingsByTarget = new Map();
for (const mapping of componentMappings) {
  for (const submapping of mapping.subcomponentMappings || []) {
    const existingMappings = subcomponentMappingsByTarget.get(submapping.pixsoTarget) || [];
    existingMappings.push(`${mapping.htmlLogicalName} · ${submapping.htmlSlot}/${submapping.htmlRole}`);
    subcomponentMappingsByTarget.set(submapping.pixsoTarget, existingMappings);
  }
}
const endpointMappingsByTarget = new Map();
for (const mapping of endpointComponentMappings) {
  const existingMappings = endpointMappingsByTarget.get(mapping.pixsoTarget) || [];
  existingMappings.push(`${mapping.endpointComponentId} → ${mapping.htmlLogicalName}`);
  endpointMappingsByTarget.set(mapping.pixsoTarget, existingMappings);
}

const nativeSpecsByTarget = new Map();
for (const mapping of profile.nativeSourceMappings || []) {
  const componentSet = mapping?.source?.componentSet;
  if (!componentSet || !mapping.target) continue;
  const existingSpecs = nativeSpecsByTarget.get(componentSet) || [];
  existingSpecs.push(mapping.target);
  nativeSpecsByTarget.set(componentSet, unique(existingSpecs));
}

function inventoryMappingSummary(item) {
  if (item.classification === "helper") return "Dialog 内部依赖，不映射 HTML";
  const htmlMappings = formalMappingsByTarget.get(item.name) || [];
  if (htmlMappings.length) return "HTML 正式映射：" + htmlMappings.map((name) => code(name)).join("<br>");
  const subcomponentMappings = subcomponentMappingsByTarget.get(item.name) || [];
  if (subcomponentMappings.length) return "已关联内部子映射：" + subcomponentMappings.map((name) => code(name)).join("<br>");
  const endpointMappings = endpointMappingsByTarget.get(item.name) || [];
  if (endpointMappings.length) return "HTML 正式映射：" + endpointMappings.map((name) => code(name)).join("<br>");
  const nativeSpecs = nativeSpecsByTarget.get(item.name) || [];
  return nativeSpecs.length
    ? "已关联 spec：" + nativeSpecs.map((name) => code(name)).join("<br>") + "<br>未建立 HTML 一对一映射"
    : "未建立 HTML 映射（待确认）";
}

function typographyVariableSummary(mapping) {
  const refs = ["font/family/sans"];
  const values = [
    ["font/size", mapping.fontSize],
    ["font/line-height", mapping.lineHeight],
    ["font/weight", mapping.fontWeight],
  ];
  for (const [prefix, value] of values) {
    if (Number.isFinite(Number(value))) refs.push(`${prefix}/${value}`);
  }
  return refs.map(code).join(" + ");
}

function renderEditLink() {
  return "[[Text-to-UI-HTML与Pixso-Token-Component对应表]]";
}

const lines = [];
lines.push("---");
lines.push("aliases:");
lines.push("  - Text-to-UI 映射维护台");
lines.push("  - HTML 与 Pixso 映射编辑区");
lines.push("tags:");
lines.push("  - text-to-ui");
lines.push("  - pixso");
lines.push("  - mapping-registry");
lines.push("  - obsidian-edit");
lines.push("source: " + registryPath);
lines.push("profile: " + profile.id);
lines.push("registryHash: " + registryHash);
lines.push("generatedAt: " + new Date().toISOString());
lines.push("---");
lines.push("");
lines.push("# Text-to-UI 映射维护台");
lines.push("");
lines.push("> 这份笔记把“人工修改”和“自动生成结果”分开。日常修改只填写人工编辑区；正式映射表由 Skill 根据中心 registry 自动生成。");
lines.push("");
lines.push("## 1. 先理解三层关系");
lines.push("");
lines.push(renderTableRow(["层级", "它是什么", "是否直接编辑"]));
lines.push(renderTableRow(["---", "---", "---"]));
lines.push(renderTableRow(["Obsidian 人工编辑区", "你提出映射变更的地方", "是"]));
lines.push(renderTableRow(["mapping-registry.json", "Text-to-UI 的规范主表，保存正式关系", "由同步流程写入"]));
lines.push(renderTableRow(["运行时投影 / 详细报告", "给 HTML、Pixso 导入器和审计脚本使用", "否"]));
lines.push("");
lines.push("正式关系的核心方向是：");
lines.push("");
lines.push("```text");
lines.push("HTML logicalName  ──正式组件映射──>  Pixso exact Component Set/COMPONENT name + Variant");
lines.push("运行时组件 ID（可选） ──同一行的实现别名──>  HTML logicalName");
lines.push("HTML CSS Token    ──tokenMappings──────>  Pixso Variable");
lines.push("``` ");
lines.push("");
lines.push("Runtime Semantic Index 由 `semanticTokenMappings + runtimeSemanticAliases` 自动生成，不作为第三份人工关系表维护。");
lines.push("");
lines.push("详细审计表仍保留在 " + renderEditLink() + "；那份笔记是结果报告，不是编辑入口。");
lines.push("");
lines.push(preserveEditQueue(existing, defaultEditQueue()));
lines.push("");
lines.push("## 3. 当前 Pixso 组件清单（事实快照）");
lines.push("");
lines.push(
  "这张表来自当前目标 Pixso 文件的组件事实清单，不等于 HTML 映射表。业务组件可以先存在于 Pixso，只有确认了 HTML logicalName 和 Variant 后，才进入下面的正式映射。",
);
lines.push(
  `当前快照包含 ${componentInventory.filter((item) => item.classification === "business").length} 个业务组件、${componentInventory.filter((item) => item.classification === "helper").length} 个辅助 Component Set；Pixso 回读总数还包含支持性图标等对象，它们不自动进入业务组件映射。`,
);
lines.push("");
if (targetFacts) {
  lines.push(
    "事实来源：" + html(targetFacts.source) + "；采集时间：" + html(targetFacts.capturedAt) + "；目标页：" + code(targetFacts.page),
  );
} else {
  lines.push("当前 profile 未配置 Pixso 事实清单；以下名称仅回退读取旧规格目录。 ");
}
lines.push("");
lines.push(renderTableRow(["Pixso exact name", "Pixso object", "分类", "Variant 轴", "HTML 映射状态"]));
lines.push(renderTableRow(["---", "---", "---", "---", "---"]));
for (const item of componentInventory) {
  lines.push(renderTableRow([
    code(item.name),
    html(item.kind === "component-set" ? "Component Set" : "COMPONENT"),
    html(item.classification === "helper" ? "helper" : "business"),
    html(variantAxesSummary(item.variantAxes)),
    inventoryMappingSummary(item),
  ]));
}
lines.push("");
lines.push("说明：当前清单中的 `.2in1 Container` 和 `.text` 是 Dialog-2in1 内部依赖；ColorPicker-Tablet 是独立 COMPONENT，不是 Component Set。支持性图标组件不进入这张业务清单。");
lines.push("");
lines.push(`## 4. 当前 HTML 正式映射（${unifiedComponentMappings.length} 条）`);
lines.push("");
lines.push("每行都以 `htmlLogicalName` 为正式身份。`运行时组件 ID` 只是可选的代码调用别名；为空表示该映射不依赖具体 ID。只有 `pixsoTargetStatus=registered` 且存在 `pixsoTarget` 的行，才允许自动实例化。`pixsoTarget` 是当前 Pixso 的 exact name；`pixsoSpecKey` 是 Text-to-UI 的视觉规格键，不是当前 Pixso 名称。");
lines.push("");
lines.push(renderTableRow(["运行时组件 ID（可选）", "HTML logicalName", "HTML renderer / contract", "Pixso exact component", "Text-to-UI spec key", "Pixso Variant", "映射状态", "说明"]));
lines.push(renderTableRow(["---", "---", "---", "---", "---", "---", "---", "---"]));
for (const mapping of unifiedComponentMappings) {
  const notes = Array.isArray(mapping.notes) ? mapping.notes.join("<br>") : mapping.notes;
  lines.push(renderTableRow([
    mapping.runtimeComponentId ? code(mapping.runtimeComponentId) : "—",
    code(mapping.htmlLogicalName),
    code(mapping.htmlRendererKey),
    code(mapping.pixsoTarget),
    mapping.pixsoSpecKey ? code(mapping.pixsoSpecKey) : "—",
    mapping.variant ? html(JSON.stringify(mapping.variant)) : "—",
    html(mapping.mappingStatus || mapping.pixsoTargetStatus),
    html(notes || "—"),
  ]));
}
lines.push("");
const subcomponentMappings = componentMappings.flatMap((mapping) =>
  (mapping.subcomponentMappings || []).map((submapping) => ({
    parent: mapping.htmlLogicalName,
    ...submapping,
  })),
);
if (subcomponentMappings.length) {
lines.push(`## 5. Titlebar / 组件内部子映射（${subcomponentMappings.length} 条）`);
  lines.push("");
  lines.push("这张表专门记录父组件内部的结构化子组件。它不会把父组件改成子组件，也不会新增独立 HTML logicalName；当前 Titlebar 的窗口三键组就是这种关系。");
  lines.push("");
  lines.push(renderTableRow(["HTML parent", "HTML slot / role", "稳定 DOM 选择器", "数量", "Pixso exact Component Set", "Text-to-UI spec context", "HTML size → Pixso variant", "子动作 → Pixso layer → icon"]));
  lines.push(renderTableRow(["---", "---", "---", "---", "---", "---", "---", "---"]));
  for (const mapping of subcomponentMappings) {
    const variants = Object.entries(mapping.variantByHtmlSize || {}).map(([size, variant]) =>
      `${size} → ${JSON.stringify(variant)}`,
    ).join("<br>");
    const actions = (mapping.actions || []).map((action) =>
      `${action.htmlAction} → ${action.pixsoLayer} → ${action.iconAlias}`,
    ).join("<br>");
    lines.push(renderTableRow([
      code(mapping.parent),
      code(`${mapping.htmlSlot} / ${mapping.htmlRole}`),
      code(mapping.htmlSelector),
      html(mapping.cardinality),
      code(mapping.pixsoTarget),
      code(mapping.textToUiSpecKey),
      html(variants),
      html(actions),
    ]));
  }
  lines.push("");
}
lines.push(`## 6.1 当前明确不映射的组件（${excludedComponentMappings.length} 条）`);
lines.push("");
lines.push("这些组件继续保留 HTML、React、Vue 实现，但不创建或解析 Pixso 组件，也不计入待补映射。");
lines.push("");
lines.push(renderTableRow(["HTML logicalName", "映射策略", "原因"]));
lines.push(renderTableRow(["---", "---", "---"]));
for (const mapping of excludedComponentMappings) {
  lines.push(renderTableRow([
    code(mapping.htmlLogicalName),
    html(mapping.pixsoMappingPolicy),
    html(mapping.pixsoMappingReason),
  ]));
}
lines.push("");
lines.push(`## 6.2 当前未正式映射的组件（${pendingComponentMappings.length} 条）`);
lines.push("");
lines.push("这些 HTML 组件目前没有正式 Pixso 目标。下面的候选名称只是同族参考，不能直接当成映射；要提交映射，请在人工编辑区填写并确认当前 Pixso exact Component Set/COMPONENT name。");
lines.push("");
lines.push(renderTableRow(["HTML logicalName", "当前状态", "同族候选（仅参考）", "下一步"]));
lines.push(renderTableRow(["---", "---", "---", "---"]));
for (const mapping of pendingComponentMappings) {
  lines.push(renderTableRow([
    code(mapping.htmlLogicalName),
    html(mapping.pixsoTargetStatus || "unregistered"),
    list(candidatesFor(mapping.htmlLogicalName)),
    "先确认语义、Variant 和当前 Pixso exact Component Set/COMPONENT name，再提交 update",
  ]));
}
lines.push("");
lines.push("## 7. 三个容易混淆的组件字段");
lines.push("");
lines.push(renderTableRow(["字段", "应该怎么理解"]));
lines.push(renderTableRow(["---", "---"]));
lines.push(renderTableRow(["`htmlLogicalName`", "HTML 组件的正式身份，例如 `Button/Primary/Default`；不是 HTML 标签名，也不是 `data-component` 的简写。"]));
lines.push(renderTableRow(["`pixsoTarget`", "当前 Pixso Component Set 或 COMPONENT 的 exact name，例如 `Button`、`Input`、`Sidebar Item`；这是 HTML ↔ Pixso 的核心关系。"]));
lines.push(renderTableRow(["`pixsoSpecKey`", "Text-to-UI 生成规格的键，例如 `Button/Primary/Default`；它不能代替当前 Pixso 的 Component Set 名称。"]));
lines.push(renderTableRow(["`nativeSourceStatus`", "HarmonyOS 原生组件适配状态，与 Pixso target 是否注册是两件事。"]));
lines.push(renderTableRow(["`runtimeComponentId`", "代码组件库中的可选调用 ID，例如 `icon-text-primary`；它只是该 HTML 正式映射的实现别名。"]));
lines.push("");
const typographyStyleMappings = (profile.styleMappings || []).filter((mapping) => mapping.kind === "text");
lines.push(`## 8. Typography 映射规则（直接引用 Pixso Text Style，${typographyStyleMappings.length} 条）`);
lines.push("");
lines.push("标准 HTML Typography role 直接对应 Pixso Text Style；字体、字号、行高和字重的基础变量用于定义/校验样式，不在每个标准文本节点上重复设置。以 `body-l` 为例：`body-l` → `Typography/Body_L` → `textStyleId`。只有没有匹配正式样式的非标准计算值，才允许使用属性级回退。");
lines.push("");
lines.push("`pixsoStyle` 是当前 Pixso 的 exact Text Style name；运行时引用形式为 `$style/...`。样式必须存在于当前 Pixso 文件，执行前会检查并在回读时确认绑定。变量名称本身不等于样式内部已经绑定变量。");
lines.push("");
lines.push(renderTableRow(["HTML Typography token", "HTML CSS prefix", "Pixso exact Text Style", "运行时引用", "组合属性", "基础变量映射", "映射方式"]));
lines.push(renderTableRow(["---", "---", "---", "---", "---", "---", "---"]));
for (const mapping of typographyStyleMappings) {
  const styleName = String(mapping.pixsoStyle || "").replace(/^\$style\//, "");
  lines.push(renderTableRow([
    code(mapping.htmlToken),
    code(mapping.htmlCssPrefix || mapping.htmlCssVariable),
    code(styleName),
    code(styleName ? `$style/${styleName}` : "—"),
    html(`${mapping.fontSize}px / ${mapping.lineHeight}px / ${mapping.fontWeight}`),
    typographyVariableSummary(mapping),
    "标准样式直接引用",
  ]));
}
lines.push("");
lines.push("## 9. Token 映射总览");
lines.push("");
lines.push(renderTableRow(["关系类型", "中心字段", "当前数量", "当前核对", "人工修改方式"]));
lines.push(renderTableRow(["---", "---", "---: ", "---", "---"]));
lines.push(renderTableRow(["Canonical Token ↔ Pixso Variable", "`tokenMappings`", (profile.tokenMappings || []).length, `${(profile.tokenMappings || []).filter((mapping) => pixsoVariableIndex.has(mapping.pixsoVariable)).length} 条 exact`, "编辑区 `mappingType=token`"]));
lines.push(renderTableRow(["Semantic Token ↔ Pixso Variable", "`semanticTokenMappings`", semanticTokenMappings.length, `${semanticTokenMappings.filter((mapping) => pixsoVariableIndex.has(mapping.pixsoVariable)).length} 条 exact`, "编辑区 `mappingType=semantic-token`"]));
lines.push(renderTableRow(["Runtime-only Alias ↔ Pixso Variable", "`runtimeSemanticAliases`", runtimeSemanticAliases.length, `${runtimeSemanticAliases.filter((mapping) => pixsoVariableIndex.has(mapping.pixsoVariable)).length} 条 exact`, "编辑区 `mappingType=runtime-semantic`"]));
lines.push(renderTableRow(["Runtime Semantic Index（自动生成）", "`semanticTokenMappings` + `runtimeSemanticAliases`", runtimeSemanticMappings.length, `${runtimeSemanticMappings.filter((mapping) => pixsoVariableIndex.has(mapping.pixsoVariable)).length} 条 exact`, "不直接编辑"]));
lines.push(renderTableRow(["Semantic Color ↔ Pixso Variables", "`semanticColorMappings`", semanticColorMappings.length, `${semanticColorMappings.length - semanticColorLiteralOnlyCount} 条有 Variable；${semanticColorLiteralOnlyCount} 条 literal-only`, "编辑区 `mappingType=semantic-color`"]));
lines.push("");
lines.push("上面的数量只是汇总；下面的明细才是实际的 `HTML CSS Token / 语义角色 → Pixso exact Variable` 关系。`当前核对` 依据本 profile 对应的 Pixso Variable manifest 做 exact-name 检查。`literal-only` 是明确不使用 Pixso Variable 的 CSS 字面量，不是漏映射。");
lines.push("");
lines.push("## 10. Token ↔ Pixso Variable 明细（自动生成，只读）");
lines.push("");
lines.push("日常修改仍然只填写上面的人工编辑区；本节由 registry 自动生成。Runtime Semantic Index 不是第三份人工关系表，而是 `semanticTokenMappings + runtimeSemanticAliases` 的运行时索引。确认一条关系时，按 `HTML CSS Token / Semantic role` 找左侧身份，再看 `Pixso exact Variable` 和 `当前核对`：只有 exact name 检查通过，才说明它能落到当前 Pixso Variable 清单。");
lines.push("");
lines.push("### 10.1 Canonical Token ↔ Pixso Variable");
lines.push("");
lines.push(renderTableRow(["HTML CSS Token", "HTML source", "Pixso exact Variable", "Pixso collection / mode", "Transform", "当前核对"]));
lines.push(renderTableRow(["---", "---", "---", "---", "---", "---"]));
for (const mapping of profile.tokenMappings || []) {
  lines.push(renderTableRow([
    code(mapping.htmlCssVariable),
    html(mapping.htmlSourceToken),
    code(mapping.pixsoVariable),
    variableScope([mapping.pixsoVariable]),
    html(mapping.valueTransform || "identity"),
    mappingCheck([mapping.pixsoVariable]),
  ]));
}
lines.push("");
lines.push("### 10.2 Semantic Token ↔ Pixso Variable");
lines.push("");
lines.push(renderTableRow(["Semantic role", "HTML CSS Token", "HTML source", "Pixso exact Variable", "Pixso collection / mode", "Transform", "当前核对"]));
lines.push(renderTableRow(["---", "---", "---", "---", "---", "---", "---"]));
for (const mapping of semanticTokenMappings) {
  lines.push(renderTableRow([
    code(mapping.role),
    code(mapping.htmlCssVariable),
    html(mapping.htmlSourceToken),
    code(mapping.pixsoVariable),
    variableScope([mapping.pixsoVariable]),
    html(mapping.valueTransform || "identity"),
    mappingCheck([mapping.pixsoVariable]),
  ]));
}
lines.push("");
if (runtimeSemanticAliases.length) {
  lines.push("### 11.3 Runtime-only Semantic Role Aliases");
  lines.push("");
  lines.push("这些是运行时专用语义别名，不重复列出已经在 Semantic Token 表中的角色；仍然指向 Pixso Variable。");
  lines.push("");
  lines.push(renderTableRow(["Runtime role", "HTML CSS Token", "HTML source", "Pixso exact Variable", "Pixso collection / mode", "Transform", "当前核对"]));
  lines.push(renderTableRow(["---", "---", "---", "---", "---", "---", "---"]));
  for (const mapping of runtimeSemanticAliases) {
    lines.push(renderTableRow([
      code(mapping.role),
      code(mapping.htmlCssVariable),
      html(mapping.htmlSourceToken),
      code(mapping.pixsoVariable),
      variableScope([mapping.pixsoVariable]),
      html(mapping.valueTransform || "identity"),
      mappingCheck([mapping.pixsoVariable]),
    ]));
  }
  lines.push("");
}
lines.push("### 11.4 Semantic Color ↔ Pixso Variables");
lines.push("");
lines.push("Semantic Color 允许一个 HTML 语义角色对应一个或多个 Pixso Variable；没有 Variable 的行会明确标为 `literal-only`。");
lines.push("");
lines.push(renderTableRow(["Semantic role", "HTML CSS Token(s)", "Pixso exact Variable(s)", "Pixso collection / mode", "Composition", "当前核对"]));
lines.push(renderTableRow(["---", "---", "---", "---", "---", "---"]));
for (const mapping of semanticColorMappings) {
  lines.push(renderTableRow([
    code(mapping.role),
    list(mapping.htmlCssVariables),
    list(mapping.pixsoVariables),
    variableScope(mapping.pixsoVariables),
    html(mapping.composition),
    mappingCheck(mapping.pixsoVariables),
  ]));
}
lines.push("");
lines.push("Token、Typography Style 和 HTML 文件证据仍可查看 " + renderEditLink() + "；本维护台现在已经包含 Typography Style 与 Token ↔ Variable 的关系，但旧笔记仍保留更完整的审计快照。");
lines.push("");
lines.push("## 12. 同步步骤");
lines.push("");
lines.push("在 Obsidian 人工编辑区填写 `state=pending` 后，告诉 Codex“同步 Text-to-UI 映射”。也可以在终端执行：");
lines.push("");
lines.push("```bash");
lines.push("cd " + skillRoot);
lines.push("pnpm mappings:obsidian:check -- --note \"" + workbookPath + "\"");
lines.push("pnpm mappings:obsidian:apply -- --note \"" + workbookPath + "\"");
lines.push("pnpm mappings:validate");
lines.push("pnpm mappings:sync");
lines.push("pnpm mappings:check");
lines.push("pnpm mappings:obsidian:build -- --profile " + profile.id + " --out \"" + workbookPath + "\"");
lines.push("```");
lines.push("");
lines.push("同步成功后，人工编辑行会被标记为 `applied`；若要再次修改同一条关系，把它改回 `pending` 并更新目标值。");
lines.push("");

const markdown = lines.join("\n").replace(/\n+$/, "\n");
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown);
  console.log("Wrote Obsidian mapping workbook: " + outputPath);
} else {
  process.stdout.write(markdown);
}
