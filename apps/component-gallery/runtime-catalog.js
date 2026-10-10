import contracts from "../../packages/component-contracts/src/components-runtime.js";
import { resolveComponentReadiness } from "../../packages/component-contracts/src/readiness-policy.js";
import readinessPolicy from "../../skill-support/references/components/component-readiness-policy.json" with { type: "json" };
import coreAcceptanceBatch from "../../skill-support/references/components/core-component-acceptance.json" with { type: "json" };

export const coreIds = new Set(["button", "input", "search", "primary-navigation-item", "sidebar", "list-card", "titlebar", "textarea", "field", "form-field", "select", "combobox", "native-select", "checkbox", "radio", "radio-group", "switch", "segmented-button", "number-selector", "chips", "tabs", "sub-tabs", "tree-view", "accordion", "collapsible", "avatar", "badge", "table", "pagination", "breadcrumb", "progress", "label", "alert", "tooltip", "toast", "dialog", "alert-dialog", "semi-modal", "menubar", "context-menu", "dropdown-menu", "popover", "hover-card", "slider", "color-picker", "calendar", "date-picker", "time-picker", "attachment"]);
const fullWidthPreviewIds = new Set(["titlebar", "button"]);

export const frameworkLabels = { html: "HTML", react: "React", vue: "Vue" };
export const frameworkSources = {
  html: "packages/components-html",
  react: "packages/components-react",
  vue: "packages/components-vue"
};

export const categoryOrder = contracts.registryPolicy?.categoryOrder ?? [
  "navigation", "actions", "display", "input", "choices", "containers", "specialized"
];
export const categoryLabels = {
  navigation: "导航类",
  actions: "操作类",
  display: "展示类",
  input: "输入类",
  choices: "选择类",
  containers: "容器类",
  specialized: "特殊组件"
};

const componentById = new Map(contracts.components.map((component) => [component.id, component]));
export const comparisonGroups = contracts.registryPolicy?.comparisonGroups ?? categoryOrder.map((category) => ({
  id: category,
  label: categoryLabels[category] ?? category,
  componentIds: [...contracts.components]
    .filter((component) => component.category === category)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .map((component) => component.id)
}));
const comparisonEntries = comparisonGroups.flatMap((group, groupIndex) => group.componentIds.map((componentId, itemIndex) => ({
  componentId,
  groupId: group.id,
  groupIndex,
  itemIndex,
  comparisonOrder: groupIndex * 100 + itemIndex
})));
const comparisonEntryById = new Map(comparisonEntries.map((entry) => [entry.componentId, entry]));
export const comparisonMetaFor = (component) => comparisonEntryById.get(component.id) ?? {
  componentId: component.id,
  groupId: component.category,
  groupIndex: 999,
  itemIndex: component.order ?? 999,
  comparisonOrder: component.order ?? 999
};
export const runtimeComponents = comparisonEntries
  .map((entry) => componentById.get(entry.componentId))
  .filter(Boolean);
export const runtimeCategories = comparisonGroups
  .map((group) => ({
    id: group.id,
    label: group.label ?? categoryLabels[group.id] ?? group.id,
    components: group.componentIds.map((componentId) => componentById.get(componentId)).filter(Boolean)
  }))
  .filter((group) => group.components.length);

export const componentTitle = (component) => component.logicalName.split("/")[0];
export const sourceFor = (component, framework) => component.frameworks?.[framework]?.source
  ?? component.implementations?.[framework]
  ?? frameworkSources[framework];
export const readinessFor = (component) => component.readiness ?? {};
export const readinessInfoFor = (component) => resolveComponentReadiness(component, readinessPolicy);
export const readinessLabels = { approved: "Approved", provisional: "Provisional", blocked: "Blocked" };
export const readinessDimensionLabels = {
  sourceReady: "源码", contractReady: "契约", visualParity: "视觉", behaviorParity: "行为", accessibilityParity: "可访问性", tokenParity: "Token"
};
export const coreAcceptanceLogicalNames = new Set(coreAcceptanceBatch.components);
export const isCoreAcceptanceComponent = (component) => coreAcceptanceLogicalNames.has(component.logicalName);
export const readinessSummary = runtimeComponents.reduce((summary, component) => {
  summary[readinessInfoFor(component).level] += 1;
  return summary;
}, { approved: 0, provisional: 0, blocked: 0 });
export const isReady = (component) => readinessInfoFor(component).level === "approved";
export const readyCount = readinessSummary.approved;
export const partialCount = readinessSummary.provisional + readinessSummary.blocked;
export const cardClass = (component) => {
  const sizing = component.sizing === "fill" ? " tui-runtime-card--fill" : component.sizing === "overlay" ? " tui-runtime-card--overlay" : " tui-runtime-card--intrinsic";
  return `tui-runtime-card${coreIds.has(component.id) ? " tui-runtime-card--core" : ""}${fullWidthPreviewIds.has(component.id) ? " tui-runtime-card--wide" : ""}${sizing}`;
};
export const cardDescription = (component) => {
  const readiness = readinessInfoFor(component);
  if (readiness.level === "approved") return "Approved · 已通过正式交付所需的全部验收维度。";
  if (readiness.level === "blocked") return `Blocked · ${readiness.reason}`;
  return `Provisional · 可用于预览；待验收：${readiness.unresolvedDimensions.map((key) => readinessDimensionLabels[key] ?? key).join("、")}。`;
};
export const specimensFor = (component) => component.specimens?.length ? component.specimens : [{ id: "default", variant: component.variants?.[0] ?? "default", state: "default" }];
const feedbackCopy = {
  info: { label: "Info / 信息", message: "系统将在今晚自动完成更新。", action: "查看详情" },
  success: { label: "Success / 成功", message: "所有修改已经同步到云端。", action: "查看详情" },
  warning: { label: "Warning / 警告", message: "连接不稳定，部分内容可能暂时无法加载。", action: "重新连接" },
  danger: { label: "Danger / 危险", message: "存储空间不足，请清理空间后重试。", action: "清理空间" },
  neutral: { label: "Neutral / 中性", message: "当前为只读模式，部分编辑操作暂不可用。", action: "知道了" }
};
export const feedbackSpecimensFor = (component) => specimensFor(component).map((specimen) => ({
  ...(feedbackCopy[specimen.variant] ?? feedbackCopy.info),
  ...specimen
}));
