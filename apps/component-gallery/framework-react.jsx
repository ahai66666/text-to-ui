import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Alert, Attachment, Button, Input, Search, Sidebar, PrimaryNavigationItem, ListCard, Radio, Toast, Tooltip, SubTabs, TreeView } from "../../packages/components-react/src/index.jsx?rev=20260928-2";
import * as Generated from "../../packages/components-react/src/generated/index.jsx?rev=20260807-1";
import contracts from "../../packages/component-contracts/src/components-runtime.js";
import { feedbackSpecimensFor } from "./runtime-catalog.js";
import "./framework-runtime.css";

const h = React.createElement;
const pascal = (value) => value.split(/[-_]/g).map((part) => part[0].toUpperCase() + part.slice(1)).join("");
const stateLabels = { default: "Default", hover: "Hover", pressed: "Pressed", focus: "Focus", disabled: "Disabled", selected: "Selected", error: "Error", open: "Open" };
const states = (component) => (component.states ?? ["default"]).map((state) => h("span", { key: state }, stateLabels[state] ?? state));
const directComponents = { alert: Alert, attachment: Attachment, radio: Radio, toast: Toast, tooltip: Tooltip, "sub-tabs": SubTabs, "tree-view": TreeView };

function ButtonPreview({ setStatus }) {
  const variants = [["primary", "确认操作"], ["secondary", "次要操作"], ["ghost", "文本操作"], ["danger", "删除项目"]];
  const buttonStates = ["default", "hover", "pressed", "focus", "disabled"];
  return h("div", { className: "tui-runtime-core-gallery" }, [
    h("p", { className: "tui-runtime-note", key: "note" }, "真实 React Button 适配器；状态通过契约 state/disabled 传入，交互由 React 事件处理。"),
    h("div", { className: "tui-runtime-state-grid tui-runtime-state-grid--single", key: "states" }, buttonStates.map((state) => h("div", { className: "tui-runtime-state-cell", key: state }, [
      h("span", { key: "label" }, stateLabels[state]),
      h("div", { className: "tui-runtime-surface-grid", key: "variants" }, variants.map(([variant, label]) => h(Button, { key: `${state}-${variant}`, label, variant, state, disabled: state === "disabled", onClick: () => setStatus(`React Button · ${variant} · ${state}`) })))
    ])))
  ]);
}

function InputPreview() {
  const inputStates = ["default", "hover", "focus", "disabled", "error"];
  const context = (surface, label) => h("section", { className: "tui-runtime-state-group", key: surface }, [h("strong", { key: "label" }, label), h("div", { className: "tui-runtime-state-grid", key: "states" }, inputStates.map((state) => h("div", { className: "tui-runtime-state-cell", key: state }, [h("span", { key: "state" }, stateLabels[state]), h(Input, { key: "input", surface, state, disabled: state === "disabled", error: state === "error", placeholder: "项目名称" })]))) ]);
  const tagEntry = h(Input, { key: "tag-entry", variant: "tag-entry", surface: "gray", label: "参与成员", placeholder: "输入姓名后按 Enter", options: ["林娜", "王昊", "陈佳", "周明"], defaultTags: ["林娜"] });
  return h("div", { className: "tui-runtime-core-gallery" }, [h("p", { className: "tui-runtime-note", key: "note" }, "标准 Input 按内容面映射白/灰 surface；Tag Entry 是一个通用变体，仅展示一份，实际使用同样通过 surface=white/gray 复用。Enter 打开建议，选择后转为可移除标签；未选择的文本可保留。"), context("white", "White content surface"), context("gray", "Gray content surface"), tagEntry]);
}

function SearchPreview() {
  const [value, setValue] = useState("");
  const [scope, setScope] = useState("全部");
  return h("div", { className: "tui-runtime-core-gallery" }, [h("p", { className: "tui-runtime-note", key: "note" }, "真实 React Search 适配器，包含 Surface、with-value、清除、Search · Scoped + 高级和 disabled 状态。"), h("div", { className: "tui-runtime-surface-grid", key: "surfaces" }, [h("div", { className: "tui-runtime-state-cell", key: "white" }, [h("span", { key: "label" }, "White content surface · Search · Scoped + 高级"), h(Search, { key: "search", surface: "white", placeholder: "搜索项目", value, scope, scopeOptions: ["全部", "标题", "内容"], advancedSearch: true, onScopeChange: (next) => setScope(next), onChange: (event) => setValue(event.target.value), onClear: () => setValue("") })]), h("div", { className: "tui-runtime-state-cell", key: "gray" }, [h("span", { key: "label" }, "Gray content surface · Search · Scoped + 高级"), h(Search, { key: "search", surface: "gray", placeholder: "搜索项目", scope, scopeOptions: ["全部", "标题", "内容"], advancedSearch: true, onScopeChange: (next) => setScope(next) })]), h("div", { className: "tui-runtime-state-cell", key: "disabled" }, [h("span", { key: "label" }, "Disabled"), h(Search, { key: "search", disabled: true, surface: "white" })])])]);
}

function SidebarPreview({ setStatus }) {
  const items = [
    { id: "default", label: "项目", icon: "navigation/grid", count: 24 },
    { id: "hover", label: "Hover", icon: "navigation/recent", state: "hover" },
    { id: "pressed", label: "Pressed", icon: "navigation/recent", state: "pressed" },
    { id: "focus", label: "Focus", icon: "navigation/recent", state: "focus" },
    { id: "selected", label: "Selected", icon: "navigation/list", state: "selected" },
    { id: "disabled", label: "Disabled", icon: "action/settings", state: "disabled" }
  ];
  return h("div", { className: "tui-runtime-core-gallery" }, [h("p", { className: "tui-runtime-note", key: "note" }, "真实 React Sidebar 适配器；未选中保持二级颜色，Selected 使用 Sidebar Selected，点击项目会触发真实 onSelect。"), h(Sidebar, { key: "sidebar", items, onSelect: (id) => setStatus(`React Sidebar · ${id}`) })]);
}

function PrimaryNavigationItemPreview({ setStatus }) {
  const items = [
    { label: "工作台", icon: "navigation/grid" },
    { label: "项目", icon: "field/calendar", selected: true },
    { label: "消息", icon: "navigation/mail-unread" },
    { label: "设置", icon: "action/settings" }
  ];
  return h("div", { className: "tui-runtime-core-gallery" }, [
    h("p", { className: "tui-runtime-note", key: "note" }, "一级导航使用独立的 React PrimaryNavigationItem；Pattern 只负责布局。"),
    h("nav", { className: "tui-primary-navigation-items", "aria-label": "一级导航", key: "nav" }, items.map((item) => h(PrimaryNavigationItem, {
      ...item,
      key: item.label,
      onSelect: (label) => setStatus(`Primary Navigation Item · ${label}`)
    })))
  ]);
}

function ListCardPreview({ setStatus }) {
  const cardStates = ["default", "hover", "pressed", "focus", "selected", "disabled"];
  return h("div", { className: "tui-runtime-core-gallery" }, [h("p", { className: "tui-runtime-note", key: "note" }, "真实 React List Card 适配器；主标题、摘要、元信息和所有状态沿用契约 CSS。"), h("div", { className: "tui-runtime-state-grid tui-runtime-state-grid--single", key: "states" }, cardStates.map((state) => h("div", { className: "tui-runtime-state-cell", key: state }, [h("span", { key: "label" }, stateLabels[state]), h(ListCard, { key: "card", title: state === "selected" ? "已选中的项目" : "HarmonyOS 组件规范", description: "刚刚更新 · 12 位成员", meta: stateLabels[state], state, selected: state === "selected", onClick: () => setStatus(`React List Card · ${state}`) })]))) ]);
}

function CorePreview({ id, setStatus }) {
  if (id === "button") return h(ButtonPreview, { setStatus });
  if (id === "input") return h(InputPreview);
  if (id === "search") return h(SearchPreview);
  if (id === "primary-navigation-item") return h(PrimaryNavigationItemPreview, { setStatus });
  if (id === "sidebar") return h(SidebarPreview, { setStatus });
  if (id === "list-card") return h(ListCardPreview, { setStatus });
  return null;
}

function FeedbackPreview({ component }) {
  return h("div", { className: "tui-feedback-specimens", "data-runtime-component": "alert" }, feedbackSpecimensFor(component).map((specimen) => h("div", { className: "tui-feedback-specimen", "data-specimen": specimen.id, key: specimen.id }, [h("span", { className: "tui-runtime-surface-label" }, specimen.label), h(Alert, { tone: specimen.variant, message: specimen.message, action: specimen.action })])));
}

function RuntimeCard({ component, setStatus }) {
  const Component = directComponents[component.id] ?? Generated[pascal(component.id)];
  const isCore = ["button", "input", "search", "primary-navigation-item", "sidebar", "list-card"].includes(component.id);
  const directProps = component.id === "attachment" ? { onAction: (action) => setStatus(`React Attachment · ${action === "preview" ? "已预览" : "已下载"}`) } : {};
  const preview = component.id === "alert" ? h(FeedbackPreview, { component }) : isCore ? h(CorePreview, { id: component.id, setStatus }) : (Component ? h(Component, { state: "default", ...directProps }) : h("p", { className: "tui-runtime-framework-missing" }, `React 适配器缺失：${component.id}`));
  return h("article", { className: `tui-runtime-framework-card${["button", "input", "search", "primary-navigation-item", "sidebar", "list-card"].includes(component.id) ? " tui-runtime-framework-card--core" : ""}`, "data-component-card": component.id, "data-framework": "react" }, h("header", { className: "tui-runtime-framework-card__head" }, h("h2", null, component.logicalName.split("/")[0]), h("code", null, component.logicalName), h("small", { className: "tui-runtime-framework-card__source" }, "真实 React 源码：", component.frameworks?.react?.source ?? component.implementations?.react ?? "未登记源码")), h("div", { className: "tui-runtime-framework-card__preview" }, preview), h("div", { className: "tui-runtime-framework-card__states", "aria-label": "状态矩阵" }, states(component)), h("p", { className: "tui-runtime-framework-card__state-note" }, "卡片使用的是该框架的实际导出组件；状态标签来自统一契约，不是另造一套演示数据。"));
}

function App() {
  const [status, setStatus] = useState(`已加载 ${contracts.components.length} 个 React 适配器。`);
  return h("div", { className: "tui-runtime-framework-shell", "data-framework": "react" }, h("header", { className: "tui-runtime-framework-shell__head" }, h("a", { href: "/index.html#runtime-view" }, "← 返回运行时目录"), h("h1", null, "React 运行时组件"), h("p", null, "这里加载 packages/components-react 中登记的真实 JSX 组件。它们与 HTML / Vue 共享契约和 component-styles，但渲染、事件和状态由 React 自己执行；不会用 HTML 或假数据冒充 React。"), h("nav", { className: "tui-runtime-framework-switch", "aria-label": "选择运行时框架" }, h("a", { href: "/framework-html.html" }, "HTML"), h("a", { href: "/framework-react.html", "aria-current": "page" }, "React"), h("a", { href: "/framework-vue.html" }, "Vue"))), h("section", { className: "tui-runtime-framework-directory", "aria-label": "React 运行时组件目录" }, contracts.components.map((component) => h(RuntimeCard, { key: component.id, component, setStatus }))), h("p", { className: "status", "aria-live": "polite" }, status));
}

createRoot(document.querySelector("#framework-runtime-root")).render(h(App));
