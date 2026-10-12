#!/usr/bin/env node

/**
 * Generate the remaining cross-framework component adapters from the canonical
 * contract registry.  This is intentionally a small, deterministic renderer:
 * behavior follows the registry's slots/states and visual values remain in the
 * shared Skill CSS.  It keeps the source reviewable instead of hiding the
 * contract behind a legacy gallery wrapper.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "packages/component-contracts/src/components.json");
const registry = JSON.parse(await fs.readFile(registryPath, "utf8"));
const iconSprite = await fs.readFile(path.join(root, "packages/components-html/src/component-icons.svg"), "utf8");
const iconAliasRegistry = JSON.parse(await fs.readFile(path.join(root, "skill-support/assets/icons/icon-aliases.json"), "utf8"));
const canonicalAliasBySymbolId = new Map(Object.keys(iconAliasRegistry.aliases ?? {}).map((alias) => [`tui-${alias.replaceAll("/", "-")}`, alias]));
const readAttribute = (attributes, name) => String(attributes).match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? null;
const iconDefinitions = Object.fromEntries([...iconSprite.matchAll(/<symbol\b([^>]*)>([\s\S]*?)<\/symbol>/g)].map((match) => {
  const [, attributes, content] = match;
  const symbolId = readAttribute(attributes, "id");
  const alias = readAttribute(attributes, "data-icon-alias") ?? canonicalAliasBySymbolId.get(symbolId);
  if (!symbolId || !alias) throw new Error(`Generated icon symbol has no canonical alias: ${symbolId ?? "unknown"}`);
  const registryEntry = iconAliasRegistry.aliases?.[alias];
  if (!registryEntry) throw new Error(`Generated icon symbol uses unknown canonical alias: ${alias}`);
  const sourceName = readAttribute(attributes, "data-icon-name") ?? registryEntry.name ?? null;
  const sourcePath = readAttribute(attributes, "data-icon-path") ?? registryEntry.path ?? null;
  return [alias, {
    viewBox: readAttribute(attributes, "viewBox") ?? "0 0 24 24",
    content: content.trim(),
    source: readAttribute(attributes, "data-icon-source") ?? (registryEntry.source === "lucide" ? `lucide@${iconAliasRegistry.lucideVersion}` : registryEntry.source),
    ...(sourceName ? { name: sourceName } : {}),
    ...(sourcePath ? { path: sourcePath } : {})
  }];
}));
const remaining = registry.components.filter((component) =>
  !new Set(["button", "input", "search", "primary-navigation-item", "sidebar", "list-card", "titlebar", "textarea", "field", "select", "combobox", "native-select", "checkbox", "radio", "radio-group", "switch", "chips", "tabs", "sub-tabs", "tree-view", "accordion", "collapsible", "avatar", "badge", "table", "data-table", "pagination", "breadcrumb", "progress", "empty", "label", "alert", "tooltip", "snackbar", "dialog", "alert-dialog", "semi-modal", "menubar", "context-menu", "dropdown-menu", "popover", "hover-card", "slider", "input-otp", "kbd", "chart", "calendar", "date-picker", "time-picker", "attachment"]).has(component.id),
);

const pascal = (value) => value.split(/[-_]/g).map((part) => part[0].toUpperCase() + part.slice(1)).join("");
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const iconName = (component) => ({
  titlebar: "action/more",
  textarea: "field/search",
  select: "navigation/chevron-down",
  field: "field/search",
  checkbox: "action/check",
  "radio-group": "action/check",
  switch: "action/check",
  tabs: "navigation/list",
  breadcrumb: "navigation/chevron-down",
  pagination: "navigation/back",
  avatar: "action/more",
  badge: "status/success",
  table: "navigation/list",
  "data-table": "navigation/list",
  progress: "status/success",
  empty: "action/add",
  accordion: "navigation/chevron-down",
  collapsible: "navigation/chevron-down",
  menubar: "navigation/grid",
  dialog: "action/close",
  "alert-dialog": "status/warning",
  "semi-modal": "action/more",
  popover: "action/more",
  "hover-card": "action/more",
  "context-menu": "action/more",
  "dropdown-menu": "action/more",
  label: "field/search",
  combobox: "navigation/chevron-down",
  "native-select": "navigation/chevron-down",
  slider: "action/more",
  "input-otp": "action/check",
  kbd: "action/more",
  chart: "navigation/grid",
  calendar: "field/calendar",
  "date-picker": "field/calendar",
  "time-picker": "field/clock",
  attachment: "action/download",
  alert: "status/info",
  tooltip: "status/info",
  snackbar: "status/info"
}[component.id]);
const sampleText = {
  accordion: ["项目设置", "基础信息、成员与通知方式"],
  alert: ["系统将在今晚自动完成更新。", "查看详情"],
  "alert-dialog": ["删除项目？", "删除后无法恢复，请确认操作。"],
  attachment: ["项目说明.pdf", "2.4 MB · 已上传"],
  avatar: ["H", "HarmonyOS"],
  badge: ["进行中", "状态"],
  breadcrumb: ["工作空间 / 项目 / 设置", "当前页面"],
  calendar: ["2026年08月", "日 一 二 三 四 五 六"],
  chart: ["项目趋势", "84%"],
  checkbox: ["同步到云端", "已选中"],
  collapsible: ["更多信息", "点击展开详情"],
  combobox: ["负责人", "选择成员"],
  "context-menu": ["更多操作", "复制、重命名、删除"],
  "data-table": ["项目列表", "名称 / 负责人 / 状态"],
  "date-picker": ["日期", "2026-08-07"],
  "time-picker": ["时间", "09:30"],
  "dropdown-menu": ["操作菜单", "新建、导入、导出"],
  empty: ["暂无项目", "创建一个项目开始工作"],
  field: ["项目名称", "客户端设计系统"],
  "hover-card": ["组件说明", "查看组件的详细使用规则"],
  "input-otp": ["验证码", "••••••"],
  kbd: ["快捷键", "⌘ K"],
  label: ["项目名称", "必填"],
  menubar: ["文件  编辑  查看", "菜单栏"],
  "native-select": ["视图", "列表视图"],
  pagination: ["第 1–10 项", "1  2  3  …"],
  popover: ["筛选条件", "状态、负责人、更新时间"],
  progress: ["设计进度", "84%"],
  "radio-group": ["通知方式", "邮件 / 站内消息"],
  select: ["状态", "进行中"],
  slider: ["透明度", "80"],
  "switch": ["自动同步", "已开启"],
  table: ["项目表格", "名称 / 类型 / 更新时间"],
  tabs: ["概览  项目  成员", "项目"],
  textarea: ["项目说明", "统一 HarmonyOS PC 客户端中的布局、组件与交互规则。"],
  snackbar: ["Title", "TEXT BT"],
  tooltip: ["刷新列表", "快捷提示"],
  "semi-modal": ["编辑项目", "白色内容面上的半模态表单"],
  titlebar: ["项目空间", "全局操作按钮"],
};

const getSample = (component) => sampleText[component.id] ?? [component.logicalName.split("/")[0], "HarmonyOS PC 组件示例"];
const contractAttrs = (component, extra = "") => `data-component="${component.id}" data-logical-component="${component.logicalName}" data-variant="${component.variants?.[0] ?? "default"}" data-state="default" data-framework="html"${extra}`;
const reactContract = (component, extra = "") => `{...contract("${component.id}", "${component.logicalName}", "${component.variants?.[0] ?? "default"}", state, ${extra || "{}"})}`;
const unresolvedIconDefinition = {
  viewBox: "0 0 24 24",
  content: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8v5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 16h.01" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>',
  source: "unresolved-fallback",
  manualFallback: true,
};
const htmlIcon = (name, size = 20) => {
  if (!name) throw new Error("Missing icon semantic alias in generated adapter");
  const definition = iconDefinitions[name] ?? { ...unresolvedIconDefinition, requestedAlias: name };
  const provenance = [
    `data-icon-source="${escape(definition.source)}"`,
    definition.name ? `data-icon-name="${escape(definition.name)}"` : "",
    definition.path ? `data-icon-path="${escape(definition.path)}"` : "",
    definition.manualFallback ? `data-icon-manual-fallback="unresolved:${escape(name)}"` : ""
  ].filter(Boolean).join(" ");
  return `<svg class="tui-icon tui-icon--regular" viewBox="${definition.viewBox}" width="${size}" height="${size}" aria-hidden="true" data-icon-alias="${name}" data-icon-size="${size}" data-display-size-token="size/${size}" data-icon-kind="regular" ${provenance}>${definition.content}</svg>`;
};

function htmlMarkup(component) {
  const [title, detail] = getSample(component);
  const attr = contractAttrs(component);
  const id = component.id;
  const componentIcon = iconName(component);
  const slots = component.slots ?? [];
  const slotRole = (name) => ({
    title: "title-s", label: ["field", "select", "native-select", "combobox", "calendar", "date-picker", "time-picker"].includes(id) ? "body-m" : id === "alert" || id === "snackbar" ? "subtitle-s" : "body-l",
    content: "body-l", value: "body-l", description: "body-m", help: "body-s", trailing: "body-m"
  }[name]);
  const slot = (name, value) => slots.includes(name) ? `<span data-slot="${name}"${slotRole(name) ? ` data-typography-role="${slotRole(name)}"` : ""}>${value}</span>` : "";
  if (["alert", "snackbar"].includes(id)) return `<div class="tui-generated tui-generated--feedback" ${attr} role="status">${htmlIcon("status/info")}${slot("label", escape(title))}${slot("content", `<span>${escape(detail)}</span>`)}<button class="tui-icon-button" type="button" aria-label="关闭">${htmlIcon("action/close")}</button></div>`;
  if (["dialog", "alert-dialog", "semi-modal"].includes(id)) return `<section class="tui-generated tui-generated--dialog" ${attr} role="dialog" aria-modal="${id === "semi-modal" ? "false" : "true"}"><header data-slot="title"><h4 data-typography-role="title-s">${escape(title)}</h4><button class="tui-icon-button" type="button" aria-label="关闭">${htmlIcon("action/close")}</button></header>${slot("description", `<p data-typography-role="body-m">${escape(detail)}</p>`)}${slot("content", `<div class="tui-generated__content" data-typography-role="body-l">请确认后继续。</div>`)}${slot("actions", `<div class="tui-generated__actions"><button class="tui-button" type="button" data-variant="ghost" data-typography-role="body-l">取消</button><button class="tui-button" type="button" data-variant="primary" data-typography-role="body-l">确认</button></div>`)}</section>`;
  if (["table", "data-table"].includes(id)) return `<div class="tui-generated tui-generated--table" ${attr}><div class="tui-generated__heading"><span data-slot="title" data-typography-role="title-s">${escape(title)}</span><span data-slot="description" data-typography-role="body-m">${escape(detail)}</span></div><table><thead><tr><th data-typography-role="body-m">名称</th><th data-typography-role="body-m">负责人</th><th data-typography-role="body-m">状态</th></tr></thead><tbody><tr><td data-slot="content" data-typography-role="body-l">客户端设计系统</td><td data-typography-role="body-l">赵博海</td><td data-typography-role="body-l"><span class="tui-generated__badge" data-typography-role="body-s">进行中</span></td></tr><tr><td data-typography-role="body-l">组件规范</td><td data-typography-role="body-l">林晓</td><td data-typography-role="body-l">已完成</td></tr></tbody></table></div>`;
  if (["calendar", "date-picker", "time-picker"].includes(id)) return `<div class="tui-generated tui-generated--picker" ${attr}>${slot("label", `<span data-typography-role="body-m">${escape(title)}</span>`)}<button class="tui-generated__control" type="button" aria-haspopup="dialog" aria-expanded="false"><span data-slot="value" data-typography-role="body-m">${escape(detail)}</span>${htmlIcon(id === "time-picker" ? "field/clock" : "field/calendar")}</button><div class="tui-generated__panel" data-slot="content" hidden><span data-typography-role="body-s">${escape(id === "calendar" ? "日  一  二  三  四  五  六" : "选择时间")}</span><div class="tui-generated__placeholder">01 · 02 · 03 · 04 · 05</div></div></div>`;
  if (["select", "native-select", "combobox", "dropdown-menu", "context-menu", "menubar"].includes(id)) return `<div class="tui-generated tui-generated--menu" ${attr}>${slot("label", `<span data-typography-role="body-m">${escape(title)}</span>`)}<button class="tui-generated__control" type="button" aria-haspopup="menu" aria-expanded="false">${slot("leading", htmlIcon(componentIcon))}<span data-slot="value" data-typography-role="body-m">${escape(detail)}</span>${htmlIcon("navigation/chevron-down")}</button><div class="tui-generated__menu" role="menu" data-slot="content" hidden><button type="button" role="menuitem" data-typography-role="body-l">${escape(detail)}</button><button type="button" role="menuitem" data-typography-role="body-l">全部项目</button><button type="button" role="menuitem" data-typography-role="body-l">最近访问</button></div>${slot("help", `<small data-typography-role="body-s">选择一个选项</small>`)}</div>`;
  if (["input", "textarea", "field", "date-picker", "time-picker"].includes(id)) return `<label class="tui-generated tui-generated--field" ${attr}>${slot("label", `<span class="tui-generated__label" data-typography-role="body-m">${escape(title)}</span>`)}<span class="tui-generated__control">${slot("leading", htmlIcon("field/search"))}${id === "textarea" ? `<textarea data-slot="value" data-typography-role="body-l" rows="3">${escape(detail)}</textarea>` : `<input data-slot="value" data-typography-role="body-l" type="text" value="${escape(detail)}" />`}${slot("trailing", htmlIcon("navigation/chevron-down"))}</span>${slot("help", `<small data-typography-role="body-s">${escape(detail)}</small>`)}</label>`;
  if (["checkbox", "radio-group", "switch"].includes(id)) return `<label class="tui-generated tui-generated--choice" ${attr}><input type="${id === "switch" ? "checkbox" : id === "radio-group" ? "radio" : "checkbox"}" checked /><span data-slot="label" data-typography-role="body-l">${escape(title)}</span><span data-slot="description" data-typography-role="body-m">${escape(detail)}</span></label>`;
  if (["progress", "slider"].includes(id)) return `<div class="tui-generated tui-generated--meter" ${attr}>${slot("label", `<span data-typography-role="body-m">${escape(title)}</span>`)}<div class="tui-generated__meter"><span style="--tui-meter-value:84%"></span></div>${slot("description", `<small data-typography-role="body-m">${escape(detail)}</small>`)}</div>`;
  if (["tabs"].includes(id)) return `<div class="tui-generated tui-generated--tabs" ${attr} role="tablist"><button class="tui-generated__tab is-selected" role="tab" aria-selected="true" data-typography-role="body-m">概览</button><button class="tui-generated__tab" role="tab" aria-selected="false" data-typography-role="body-m">项目</button><button class="tui-generated__tab" role="tab" aria-selected="false" data-typography-role="body-m">成员</button><div class="tui-generated__tab-panel" role="tabpanel" data-slot="content" data-typography-role="body-m">${escape(detail)}</div></div>`;
  if (["accordion", "collapsible"].includes(id)) {
    const accordion = id === "accordion";
    const disclosureIcon = htmlIcon(accordion ? "navigation/chevron-right" : "navigation/chevron-down", 20);
    const triggerContent = accordion ? `${disclosureIcon}${escape(title)}` : `${escape(title)}${disclosureIcon}`;
    return `<div class="tui-generated tui-generated--disclosure" ${attr}><button class="tui-generated__disclosure" type="button" aria-expanded="false" data-slot="label" data-typography-role="body-l">${triggerContent}</button><div class="tui-generated__disclosure-content" data-slot="content" hidden data-typography-role="body-l">${escape(detail)}</div></div>`;
  }
  if (["popover", "hover-card", "tooltip"].includes(id)) return `<div class="tui-generated tui-generated--floating" ${attr}><button class="tui-button" type="button" data-variant="ghost" data-typography-role="body-l">${escape(title)}</button><div class="tui-generated__floating-panel" data-slot="content"><span data-typography-role="title-s">${escape(title)}</span><span data-typography-role="body-m">${escape(detail)}</span></div></div>`;
  if (["badge", "kbd"].includes(id)) return `<span class="tui-generated tui-generated--inline" ${attr} data-slot="label">${escape(detail)}</span>`;
  if (["avatar"].includes(id)) return `<div class="tui-generated tui-generated--avatar" ${attr} data-slot="content">${escape(title)}</div>`;
  if (["empty"].includes(id)) return `<div class="tui-generated tui-generated--empty" ${attr}>${htmlIcon("navigation/grid")}<span data-slot="label" data-typography-role="title-s">${escape(title)}</span><span data-slot="description" data-typography-role="body-m">${escape(detail)}</span><button class="tui-button" type="button" data-variant="primary" data-typography-role="body-l">新建项目</button></div>`;
  if (["pagination"].includes(id)) return `<nav class="tui-generated tui-generated--pagination" ${attr} aria-label="分页"><button class="tui-icon-button" type="button" aria-label="上一页">${htmlIcon("navigation/back", 20)}</button><button type="button" aria-current="page" data-typography-role="body-l">1</button><button type="button" data-typography-role="body-l">2</button><button class="tui-icon-button" type="button" aria-label="下一页">${htmlIcon("navigation/forward", 20)}</button></nav>`;
  if (["breadcrumb"].includes(id)) return `<nav class="tui-generated tui-generated--breadcrumb" ${attr} aria-label="面包屑"><a href="#" data-typography-role="body-l">工作空间</a><span class="tui-breadcrumb__separator" aria-hidden="true">${htmlIcon("navigation/chevron-right", 20)}</span><a href="#" data-typography-role="body-l">项目</a><span class="tui-breadcrumb__separator" aria-hidden="true">${htmlIcon("navigation/chevron-right", 20)}</span><span data-typography-role="body-l">${escape(title)}</span></nav>`;
  if (["attachment", "chart"].includes(id)) {
    if (!componentIcon) throw new Error(`Missing explicit icon semantic alias for generated component: ${id}`);
    return `<article class="tui-generated tui-generated--card" ${attr}>${htmlIcon(componentIcon)}<div class="tui-generated__card-body">${slot("title", `<h4 data-typography-role="title-s">${escape(title)}</h4>`)}${slot("content", `<p data-typography-role="body-l">${escape(detail)}</p>`)}${slot("description", `<small data-typography-role="body-m">辅助说明</small>`)}</div>${slot("trailing", `<span class="tui-generated__badge" data-typography-role="body-s">${id === "chart" ? "84%" : "查看"}</span>`)}</article>`;
  }
  if (["titlebar"].includes(id)) return `<header class="tui-generated tui-generated--titlebar" ${attr}>${slot("leading", htmlIcon("navigation/grid"))}<span data-slot="label" data-typography-role="title-s">${escape(title)}</span><div data-slot="actions"><button class="tui-icon-button" aria-label="更多">${htmlIcon("action/more")}</button><button class="tui-icon-button" aria-label="关闭">${htmlIcon("action/close")}</button></div></header>`;
  return `<section class="tui-generated tui-generated--card" ${attr}>${slot("label", `<span data-typography-role="title-s">${escape(title)}</span>`)}${slot("content", `<p data-typography-role="body-l">${escape(detail)}</p>`)}${slot("description", `<small data-typography-role="body-s">辅助说明</small>`)}</section>`;
}

function reactMarkup(component) {
  const [title, detail] = getSample(component);
  const name = pascal(component.id);
  const logical = component.logicalName;
  const variant = component.variants?.[0] ?? "default";
  const template = htmlMarkup(component).replaceAll("data-framework=\"html\"", "data-framework=\"react\"");
  let jsx = template
    .replaceAll(/aria-expanded="false"/g, "aria-expanded={false}")
    .replaceAll(/aria-expanded="true"/g, "aria-expanded={true}")
    .replaceAll(/aria-selected="true"/g, "aria-selected={true}")
    .replaceAll(/aria-selected="false"/g, "aria-selected={false}")
    .replaceAll(/<svg class="tui-icon[^>]*data-icon-alias="([^"]+)"[^>]*>[\s\S]*?<\/svg>/g, "<Icon name=\"$1\" />")
    .replaceAll(/<input ([^>]*?)checked \/>/g, "<input $1 defaultChecked />")
    .replaceAll(/ style="--tui-meter-value:84%"/g, " style={{\"--tui-meter-value\": \"84%\"}}")
    .replaceAll(/<textarea([^>]*)>([^<]*)<\/textarea>/g, "<textarea$1 defaultValue=\"$2\" />")
    .replaceAll(/<input([^>]*)value="([^"]+)"([^>]*) \/>/g, "<input$1 defaultValue=\"$2\"$3 />")
    .replaceAll(/class=/g, "className=");
  if (["select", "native-select", "combobox", "dropdown-menu", "context-menu", "menubar", "calendar", "date-picker", "time-picker", "accordion", "collapsible", "popover", "hover-card", "tooltip"].includes(component.id)) {
    jsx = jsx.replaceAll("aria-expanded={false}", "aria-expanded={open} onClick={() => setOpen(!open)}").replaceAll(" hidden", " hidden={!open}");
  }
  return `import React, { useState } from "react";\nimport { Icon, contract } from "../shared.jsx";\nimport "../styles.css";\n\nexport function ${name}({ label = ${JSON.stringify(title)}, description = ${JSON.stringify(detail)}, state = "default", children, ...props }) {\n  const [open, setOpen] = useState(false);\n  const content = children ?? ${JSON.stringify(detail)};\n  return (\n    ${jsx}\n  );\n}\n\nexport default ${name};\n`;
}

function vueMarkup(component) {
  const [title, detail] = getSample(component);
  const html = htmlMarkup(component)
    .replaceAll('data-framework="html"', 'data-framework="vue"');
  const interactive = ["select", "native-select", "combobox", "dropdown-menu", "context-menu", "menubar", "calendar", "date-picker", "time-picker", "accordion", "collapsible", "popover", "hover-card", "tooltip"].includes(component.id)
    ? html.replaceAll('aria-expanded="false"', ':aria-expanded="open" @click="open = !open"').replaceAll(" hidden", ' :hidden="!open"')
    : html;
  return `<script setup>\nimport { ref } from "vue";\nconst props = defineProps({ label: { type: String, default: ${JSON.stringify(title)} }, description: { type: String, default: ${JSON.stringify(detail)} }, state: { type: String, default: "default" } });\nconst open = ref(false);\n</script>\n\n<template>\n  ${interactive}\n</template>\n`;
}

const htmlDir = path.join(root, "packages/components-html/src/generated");
const reactDir = path.join(root, "packages/components-react/src/generated");
const vueDir = path.join(root, "packages/components-vue/src/generated");
await Promise.all([fs.mkdir(htmlDir, { recursive: true }), fs.mkdir(reactDir, { recursive: true }), fs.mkdir(vueDir, { recursive: true })]);

const htmlExports = [];
const reactExports = [];
const vueExports = [];
for (const component of remaining) {
  const name = pascal(component.id);
  await fs.writeFile(path.join(htmlDir, `${component.id}.html`), `<!-- Canonical ${component.logicalName} HTML adapter. Values are supplied by component-styles. -->\n${htmlMarkup(component)}\n`);
  await fs.writeFile(path.join(reactDir, `${name}.jsx`), reactMarkup(component));
  await fs.writeFile(path.join(vueDir, `${name}.vue`), vueMarkup(component));
  htmlExports.push(`  "${component.id}": () => ${JSON.stringify(htmlMarkup(component))}`);
  reactExports.push(`export { default as ${name} } from "./${name}.jsx";`);
  vueExports.push(`export { default as ${name} } from "./${name}.vue";`);
}
await fs.writeFile(path.join(htmlDir, "index.js"), `export const generatedHtmlComponents = {\n${htmlExports.join(",\n")}\n};\n`);
const galleryCards = remaining.map((component) => {
  const label = component.logicalName.split("/")[0];
  return `<article class="tui-generated-gallery__card" data-component-card="${component.id}"><header><h4>${escape(label)}</h4><code>${escape(component.logicalName)}</code></header><div class="tui-generated-gallery__preview">${htmlMarkup(component)}</div></article>`;
}).join("");
await fs.writeFile(path.join(htmlDir, "gallery.js"), `export function renderGeneratedComponentGallery() {\n  return ${JSON.stringify(`<div class="tui-generated-gallery" data-component="component-gallery" data-logical-component="Component Gallery/Full" data-variant="default" data-state="default" data-framework="html">${galleryCards}</div>`)};\n}\n`);
await fs.writeFile(path.join(reactDir, "index.jsx"), `${reactExports.join("\n")}\n`);
await fs.writeFile(path.join(vueDir, "index.js"), `${vueExports.join("\n")}\n`);
console.log(`Generated ${remaining.length} HTML, React and Vue component adapters.`);
