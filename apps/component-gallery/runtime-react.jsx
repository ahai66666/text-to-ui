import React from "react";
import { createTitlebarPreviewScenes } from "../../packages/component-contracts/src/titlebar-segments.js";
import { createRoot } from "react-dom/client";
import { Button, Input, Search, Sidebar, PrimaryNavigationItem, ListCard, Titlebar, Textarea, Field, FormField, Select, Combobox, NativeSelect, Checkbox, Radio, RadioGroup, Switch, SegmentedButton, NumberSelector, Chips, Tabs, SubTabs, TreeView, Accordion, Collapsible, Avatar, Badge, Table, DataTable, Pagination, Breadcrumb, Progress, Empty, Label, Alert, Tooltip, Toast, Icon } from "../../packages/components-react/src/index.jsx?rev=20260928-2";
import { AlertDialog, Attachment, Calendar, Chart, ColorPicker, ContextMenu, DatePicker, Dialog, DropdownMenu, HoverCard, InputOtp, Kbd, Menubar, Popover, Slider, SemiModal, TimePicker } from "../../packages/components-react/src/advanced.jsx?rev=20260812-1";
import * as Generated from "../../packages/components-react/src/generated/index.jsx?rev=20260810-1";
import { cardClass, comparisonMetaFor, componentTitle, coreIds, feedbackSpecimensFor, readinessInfoFor, runtimeCategories, runtimeComponents, specimensFor } from "./runtime-catalog.js";
import { contractInspectorData, contractInspectorGroups } from "./contract-inspector.js";
import "./framework-runtime.css";

const h = React.createElement;
const pascal = (value) => value.split(/[-_]/g).map((part) => part[0].toUpperCase() + part.slice(1)).join("");

function ContractDialog({ component, framework, onClose }) {
  const data = contractInspectorData(component, framework);
  const groups = contractInspectorGroups(component, framework);
  const closeButtonRef = React.useRef(null);
  React.useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); onClose("已关闭"); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return h("div", {
    className: "tui-contract-dialog",
    role: "presentation",
    "data-contract-dialog": "",
    "data-contract-logical-name": data.logicalName
  }, [
    h("div", { className: "tui-contract-dialog__backdrop", onClick: () => onClose("已关闭"), key: "backdrop" }),
    h("section", { className: "tui-contract-dialog__surface", role: "dialog", "aria-modal": "true", "aria-labelledby": `contract-dialog-react-${component.id}-title`, key: "surface" }, [
      h("header", { className: "tui-contract-dialog__header", key: "header" }, [
        h("div", { key: "title-group" }, [
          h("h4", { id: `contract-dialog-react-${component.id}-title`, key: "title" }, `${data.logicalName} · 组件规范`),
          h("p", { key: "status" }, `${data.statusLabel} · ${data.completeCount}/${data.readiness.length} 个验收维度已通过`)
        ]),
        h("button", { ref: closeButtonRef, type: "button", className: "tui-contract-dialog__close", "aria-label": "关闭组件规范", onClick: () => onClose("关闭"), key: "close" }, "×")
      ]),
      h("div", { className: "tui-contract-inspector__body", key: "body" }, [
        h("div", { className: "tui-contract-inspector__identity", key: "identity" }, [h("span", { key: "label" }, "逻辑身份"), h("code", { key: "value" }, data.logicalName), h("strong", { className: `tui-readiness-pill tui-readiness-pill--${data.status}`, key: "readiness" }, data.statusLabel)]),
        ...groups.map((group) => h("section", { className: "tui-contract-inspector__group", key: group.label }, [
          h("h5", { key: "title" }, group.label),
          h("dl", { key: "rows" }, group.rows.map(([label, value]) => h("div", { className: "tui-contract-inspector__row", key: label }, [h("dt", { key: "label" }, label), h("dd", { key: "value" }, value)])))
        ])),
        h("div", { className: "tui-contract-inspector__readiness", "aria-label": "验收维度", key: "readiness" }, data.readiness.map((item) => h("span", { className: `tui-contract-inspector__badge${item.complete ? " is-complete" : ""}`, key: item.key }, item.label))),
        data.note ? h("p", { className: "tui-contract-inspector__note", key: "note" }, data.note) : null
      ])
    ]),
  ]);
}

function InteractiveButtonVariant({ mode, variant, label, setStatus, iconOnly = false }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);
  if (mode === "split-dropdown") {
    const logicalName = `Split Dropdown Button/${iconOnly ? "Icon Only" : "Icon Text"}/Default`;
    const menuItems = iconOnly ? ["重新加载", "同步数据", "清理缓存并刷新"] : ["导出为 PDF", "复制分享链接", "发送到设备"];
    return h("div", { ref: rootRef, className: `tui-component tui-split-button${iconOnly ? " tui-split-button--icon" : ""}`, "data-component": "button", "data-logical-component": logicalName, "data-variant": "ghost", "data-state": "default", "data-framework": "react", "data-mode": "split-dropdown" }, [
      h("div", { className: "tui-split-button__control", key: "control" }, [
        h(Button, { label, variant: "ghost", mode: "split-dropdown", icon: iconOnly ? "action/refresh" : "action/download", iconOnly, logicalName, className: `tui-split-button__main${iconOnly ? " tui-split-button__main--icon" : ""}`, "aria-label": iconOnly ? label : undefined, onClick: () => setStatus(`Split Dropdown · ${iconOnly ? "Icon" : "Icon + Text"} · 主操作`), key: "primary" }),
        h("button", { type: "button", className: "tui-component tui-button tui-split-button__trigger", "data-component": "button", "data-logical-component": logicalName, "data-variant": "ghost", "data-state": "default", "data-framework": "react", "data-mode": "split-dropdown", "data-size": "standard", "aria-label": "展开更多操作", "aria-haspopup": "menu", "aria-expanded": open, onClick: () => setOpen((value) => !value), key: "trigger" }, h(Icon, { name: "navigation/chevron-down", size: 16 }))
      ]),
      h("div", { className: "tui-button-dropdown__menu", role: "menu", hidden: !open, key: "menu" }, menuItems.map((item) => h("button", { type: "button", role: "menuitem", className: "tui-button-dropdown__item", key: item, onClick: () => { setOpen(false); setStatus(`已选择 ${item}`); } }, item)))
    ]);
  }
  return null;
}

const RuntimeStructuralButton = ({ setStatus }) => h("div", { className: "tui-runtime-structural-grid tui-runtime-structural-grid--button", "data-runtime-component": "button" }, [
  ["primary", "primary", "确认操作", "text"],
  ["secondary", "secondary", "次要操作", "text"],
  ["ghost", "ghost", "文本操作", "text"],
  ["danger", "danger", "删除项目", "text"],
  ["small-primary", "primary", "确认操作", "text", "small"],
  ["small-secondary", "secondary", "次要操作", "text", "small"],
  ["small-ghost", "ghost", "文本操作", "text", "small"],
  ["small-danger", "danger", "删除项目", "text", "small"],
  ["icon-text-primary", "primary", "新建项目", "icon-text"],
  ["icon-text-secondary", "secondary", "导出文件", "icon-text"],
  ["icon-text-ghost", "ghost", "更多设置", "icon-text"],
  ["icon", "ghost", "更多操作", "icon"],
  ["split-dropdown", "ghost", "导出文件", "split-dropdown", undefined, false],
  ["split-dropdown-icon", "ghost", "刷新", "split-dropdown", undefined, true]
].map(([id, variant, label, mode, size, iconOnly]) => h("div", { className: "tui-runtime-structural-cell", "data-specimen": id, key: id }, [
  h("span", { className: "tui-runtime-surface-label", key: "label" }, id),
  mode === "split-dropdown"
    ? h(InteractiveButtonVariant, { key: "button", mode, label, variant, iconOnly, setStatus })
    : h(Button, { key: "button", label, variant, mode, size, icon: mode === "icon-text" ? "action/add" : mode === "icon" ? "action/more" : undefined, state: "default", onClick: () => setStatus(`Button · ${id} · 已触发`) })
])));

const RuntimeChips = ({ setStatus }) => h("div", { className: "tui-runtime-chips-gallery", "data-runtime-component": "chips" }, h(Chips, { label: "操作块", onClose: () => setStatus("Chips · 已移除") }));

function RuntimeSearchGallery({ setStatus }) {
  const [whiteValue, setWhiteValue] = React.useState("");
  const [whiteScope, setWhiteScope] = React.useState("全部");
  const [grayValue, setGrayValue] = React.useState("");
  const [grayScope, setGrayScope] = React.useState("全部");
  const sample = (surface, value, setValue, scope, setScope) => h(Search, { placeholder: "搜索项目", surface, scope, scopeOptions: ["全部", "标题", "内容"], advancedSearch: true, value, onScopeChange: (next) => { setScope(next); setStatus(`Search · 范围：${next}`); }, onChange: (event) => { setValue(event.target.value); setStatus("Search · 已输入"); }, onClear: () => { setValue(""); setStatus("Search · 已清除"); }, onAdvancedSearch: () => setStatus("Search · 高级") });
  return h("div", { className: "tui-runtime-surface-pair tui-runtime-search-pair" }, [
    h("div", { key: "white", "data-surface-context": "white" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "白色内容面 · 灰色搜索面 · Search · Scoped + 高级"), sample("white", whiteValue, setWhiteValue, whiteScope, setWhiteScope)]),
    h("div", { key: "gray", "data-surface-context": "gray" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "灰色内容面 · 白色搜索面 · Search · Scoped + 高级"), h(Search, { placeholder: "搜索项目", surface: "gray", value: grayValue, scope: grayScope, scopeOptions: ["全部", "标题", "内容"], advancedSearch: true, onScopeChange: (next) => { setGrayScope(next); setStatus(`Search · 范围：${next}`); }, onAdvancedSearch: () => setStatus("Search · 高级"), onChange: (event) => { setGrayValue(event.target.value); setStatus("Search · 已输入"); }, onClear: () => { setGrayValue(""); setStatus("Search · 已清除"); } })])
  ]);
}

function RuntimePrimaryNavigationGallery({ setStatus }) {
  const [selected, setSelected] = React.useState("项目");
  const items = [["工作台", "navigation/grid"], ["项目", "field/calendar"], ["消息", "navigation/mail-unread"], ["设置", "action/settings"]];
  return h("div", { className: "tui-runtime-core-gallery tui-runtime-primary-navigation-gallery" }, [
    h("p", { className: "tui-runtime-note", key: "note" }, "一级导航使用独立的原生 Primary Navigation Item；Pattern 只负责把它放入底部对齐的 primary-navigation-shell。"),
    h("nav", { className: "tui-primary-navigation-items", "aria-label": "一级导航", key: "items" }, items.map(([label, icon]) => h(PrimaryNavigationItem, { key: label, label, icon, selected: label === selected, onSelect: (next) => { setSelected(next); setStatus(`Primary Navigation Item · ${next}`); } })))
  ]);
}

function RuntimeSidebarGallery({ setStatus }) {
  const [selected, setSelected] = React.useState("projects");
  const items = [{ id: "projects", label: "项目", icon: "navigation/grid", count: 24 }, { id: "recent", label: "最近访问", icon: "navigation/recent" }, { id: "shared", label: "与我共享", icon: "action/more" }];
  return h(Sidebar, { items, selected, onSelect: (next) => { setSelected(next); setStatus(`Sidebar · ${next}`); } });
}

function RuntimeListCardGallery({ setStatus }) {
  const [selected, setSelected] = React.useState("");
  const cards = [["one", "项目设置", { lines: 1, trailing: "text-arrow", trailingText: "详情" }], ["two", "成员权限", { description: "管理角色和访问范围", lines: 2, trailing: "icon" }], ["three", "通知方式", { description: "邮件通知", supporting: "已同步到云端", lines: 3, trailing: "radio" }], ["switch", "自动同步", { lines: 1, trailing: "switch" }], ["checkbox", "项目归档", { lines: 1, trailing: "checkbox" }], ["event", "更新动态", { lines: 1, trailing: "notification-arrow" }]];
  return h("div", { className: "tui-list-card-group", role: "list" }, cards.map(([id, title, props]) => h(ListCard, { ...props, key: id, title, selected: id === selected, onClick: () => { setSelected(id); setStatus(`List Item · ${title}`); } })));
}

const RuntimeTitlebarGallery = ({ setStatus }) => h("div", { className: "tui-runtime-titlebar-gallery", "data-runtime-component": "titlebar" }, createTitlebarPreviewScenes().map(({ size, label, scenes }) =>
  h("section", { key: size, className: "tui-runtime-titlebar-size-group", "data-preview-size": size }, [
    h("h4", { key: "size", className: "tui-runtime-titlebar-size-title" }, label),
    h("div", { key: "scenes", className: "tui-runtime-titlebar-layouts" }, scenes.map(scene => h("div", { key: scene.layout, "data-preview-layout": scene.layout }, [
      h("strong", { key: "title", className: "tui-runtime-titlebar-scenario-title" }, scene.label),
      h("span", { key: "slots", className: "tui-runtime-titlebar-scenario-slots" }, scene.description),
      h("div", { key: "shell", className: `tui-runtime-titlebar-layout-shell tui-runtime-titlebar-layout-shell--${scene.columns}` }, scene.segments.map((options, index) => h(Titlebar, { ...options, key: index,
        onAction: action => setStatus(`Titlebar · ${label} · ${scene.label} · ${action}`),
        onMainContentAction: action => setStatus(`Titlebar · ${label} · ${scene.label} · Main Content · ${action}`),
        onMainDetailAction: action => setStatus(`Titlebar · ${label} · ${scene.label} · ${action}`)
      })))
    ])))
  ])
));

function RuntimeSemiModal({ setStatus }) {
  const [size, setSize] = React.useState("m");
  const [surface, setSurface] = React.useState("white");
  const [mode, setMode] = React.useState("non-modal");
  const select = (label, value, onChange, options) => h("label", { "data-typography-role": "body-m", key: label }, [label, h("select", { value, onChange: (event) => onChange(event.target.value), key: "select" }, options.map(([id, text]) => h("option", { value: id, key: id }, text)))]);
  return h("div", { className: "tui-overlay-example" }, [
    h("div", { className: "tui-specimen-controls", key: "controls" }, [
      select("尺寸", size, setSize, [["s", "S · 480"], ["m", "M · 640"], ["l", "L · 800"]]),
      select("背景", surface, setSurface, [["white", "White"], ["gray", "Gray"]]),
      select("模式", mode, setMode, [["non-modal", "Non-modal"], ["modal", "Modal"]])
    ]),
    h(SemiModal, { key: `${size}-${surface}-${mode}`, size, surface, mode, onConfirm: () => setStatus("Semi-modal · 已保存"), onCancel: () => setStatus("Semi-modal · 已取消"), onClose: () => setStatus("Semi-modal · 已关闭") })
  ]);
}

const runtimeCore = (id, setStatus, component) => {
  if (id === "button") return h(RuntimeStructuralButton, { setStatus });
  if (id === "chips") return h(RuntimeChips, { setStatus });
  if (id === "input") return h("div", { className: "tui-runtime-core-gallery" }, [
    h("p", { className: "tui-runtime-note", key: "note" }, "标准 Input 按内容面映射白/灰 surface；Tag Entry 是一个通用变体，仅展示一份，实际使用同样通过 surface=white/gray 复用。Enter 打开建议，选择后转为可移除标签；未选择的文本可保留。"),
    h("div", { className: "tui-runtime-surface-pair", key: "default-inputs" }, [
      h("div", { key: "white", "data-surface-context": "white" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "白色内容面 · 灰色输入面"), h(Input, { key: "input", placeholder: "项目名称", surface: "white" })]),
      h("div", { key: "gray", "data-surface-context": "gray" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "灰色内容面 · 白色输入面"), h(Input, { key: "input", placeholder: "项目名称", surface: "gray" })])
    ]),
    h(Input, { key: "tag-entry", variant: "tag-entry", surface: "gray", label: "参与成员", placeholder: "输入姓名后按 Enter", options: ["林娜", "王昊", "陈佳", "周明"], defaultTags: ["林娜"] })
  ]);
  if (id === "search") return h(RuntimeSearchGallery, { setStatus });
  if (id === "primary-navigation-item") return h(RuntimePrimaryNavigationGallery, { setStatus });
  if (id === "sidebar") return h(RuntimeSidebarGallery, { setStatus });
  if (id === "list-card") return h(RuntimeListCardGallery, { setStatus });
  if (id === "titlebar") return h(RuntimeTitlebarGallery, { setStatus });
  if (id === "textarea") return h("div", { className: "tui-runtime-surface-pair tui-runtime-textarea-pair" }, [
    h("div", { key: "white", "data-surface-context": "white" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "白色内容面 · 灰色输入面"), h(Textarea, { key: "textarea", label: "项目说明", defaultValue: "统一 HarmonyOS PC 客户端中的布局、组件与交互规则。", help: "支持多行输入，最多 500 字", surface: "white", onChange: () => setStatus("Textarea · 已输入") })]),
    h("div", { key: "gray", "data-surface-context": "gray" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "灰色内容面 · 白色输入面"), h(Textarea, { key: "textarea", label: "项目说明", defaultValue: "统一 HarmonyOS PC 客户端中的布局、组件与交互规则。", help: "支持多行输入，最多 500 字", surface: "gray", onChange: () => setStatus("Textarea · 已输入") })])
  ]);
  if (id === "field") return h(Field, { label: "项目名称", defaultValue: "客户端设计系统", help: "这是一个必填字段", onChange: () => setStatus("Field · 已输入") });
  if (id === "form-field") return h("div", { className: "tui-runtime-form-field-states" }, [
    h("div", { key: "default-white", "data-surface-context": "white" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "默认 · 白色内容面 / 灰色输入面"), h(FormField, { key: "field", label: "项目名称", surface: "white" }, h(Input, { defaultValue: "客户端设计系统", surface: "white", onChange: () => setStatus("Form Field · 已输入") }))]),
    h("div", { key: "default-gray", "data-surface-context": "gray" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "默认 · 灰色内容面 / 白色输入面"), h(FormField, { key: "field", label: "项目名称", surface: "gray" }, h(Input, { defaultValue: "客户端设计系统", surface: "gray", onChange: () => setStatus("Form Field · 已输入") }))]),
    h("div", { key: "required-white", "data-surface-context": "white" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "必填 · 白色内容面 / 灰色选择面"), h(FormField, { key: "field", label: "项目状态", required: true, surface: "white" }, h(Select, { id: "form-field-white-status", surface: "white", onChange: (value) => setStatus(`Form Field · ${value}`) }))]),
    h("div", { key: "required-gray", "data-surface-context": "gray" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "必填 · 灰色内容面 / 白色选择面"), h(FormField, { key: "field", label: "项目状态", required: true, surface: "gray" }, h(Select, { id: "form-field-gray-status", surface: "gray", onChange: (value) => setStatus(`Form Field · ${value}`) }))]),
    h("div", { key: "error-white", "data-surface-context": "white" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "错误 · 白色内容面 / 灰色输入面"), h(FormField, { key: "field", label: "项目名称", surface: "white", error: "项目名称不能为空" }, h(Input, { defaultValue: "", surface: "white", error: true, onChange: () => setStatus("Form Field · 已输入") }))]),
    h("div", { key: "error-gray", "data-surface-context": "gray" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "错误 · 灰色内容面 / 白色输入面"), h(FormField, { key: "field", label: "项目名称", surface: "gray", error: "项目名称不能为空" }, h(Input, { defaultValue: "", surface: "gray", error: true, onChange: () => setStatus("Form Field · 已输入") }))])
  ]);
  if (id === "select") return h("div", { className: "tui-runtime-surface-pair" }, [
    h("div", { key: "white", "data-surface-context": "white" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "白色内容面 · 灰色选择面"), h(Select, { key: "select", label: "状态", surface: "white", onChange: (value) => setStatus(`Select · ${value}`) })]),
    h("div", { key: "gray", "data-surface-context": "gray" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "灰色内容面 · 白色选择面"), h(Select, { key: "select", label: "状态", surface: "gray", onChange: (value) => setStatus(`Select · ${value}`) })])
  ]);
  if (id === "combobox") return h(Combobox, { label: "字体", defaultValue: "思源黑体", options: ["思源黑体", "源然雅黑", "鸿蒙黑体", "宋体", "黑体"], onChange: (value) => setStatus(`Combobox · ${value}`) });
  if (id === "native-select") return h(NativeSelect, { label: "视图", onChange: (event) => setStatus(`Native Select · ${event.target?.value ?? event}`) });
  if (id === "checkbox") return h(Checkbox, { onChange: (event) => setStatus(`Checkbox · ${event.target.checked ? "选中" : "取消"}`) });
  if (id === "radio") return h("div", { className: "tui-runtime-structural-grid" }, [h(Radio, { key: "unselected", label: "未选中", value: "unselected", name: "runtime-radio", onChange: () => setStatus("Radio · 未选中") }), h(Radio, { key: "selected", label: "已选中", value: "selected", name: "runtime-radio", defaultChecked: true, onChange: () => setStatus("Radio · 已选中") })]);
  if (id === "radio-group") return h(RadioGroup, { onChange: (value) => setStatus(`Radio Group · ${value}`) });
  if (id === "switch") return h(Switch, { onChange: (event) => setStatus(`Switch · ${event.target.checked ? "开启" : "关闭"}`) });
  if (id === "segmented-button") return h(SegmentedButton, { onChange: (value) => setStatus(`Segmented Button · ${value}`) });
  if (id === "number-selector") return h(NumberSelector, { onChange: (value) => setStatus(`Number Selector · ${value}`) });
  if (id === "tabs") return h(Tabs, { onChange: (value) => setStatus(`Tabs · ${value}`) });
  if (id === "sub-tabs") return h(SubTabs, { onChange: (value) => setStatus(`Sub Tabs · ${value}`) });
  if (id === "tree-view") return h(TreeView, { onSelect: (value) => setStatus(`Tree View · ${value}`), onToggle: (value, open) => setStatus(`Tree View · ${value} · ${open ? "展开" : "收起"}`) });
  if (id === "accordion") return h(Accordion, { onOpenChange: (open) => setStatus(`Accordion · ${open ? "展开" : "收起"}`) });
  if (id === "collapsible") return h(Collapsible, { onOpenChange: (open) => setStatus(`Collapsible · ${open ? "展开" : "收起"}`) });
  if (id === "avatar") return h("div", { className: "tui-runtime-avatar-pair" }, [
    h("div", { key: "32" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "32 × 32"), h(Avatar, { key: "avatar", initials: "H", name: "HarmonyOS 32", size: 32 })]),
    h("div", { key: "40" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "40 × 40"), h(Avatar, { key: "avatar", initials: "H", name: "HarmonyOS 40", size: 40 })])
  ]);
  if (id === "badge") return h("div", { className: "tui-badge-group", "aria-label": "Badge 颜色示例" }, [
    h(Badge, { key: "info", label: "进行中", tone: "info" }),
    h(Badge, { key: "success", label: "已完成", tone: "success" }),
    h(Badge, { key: "warning", label: "待处理", tone: "warning" }),
    h(Badge, { key: "danger", label: "错误", tone: "danger" }),
    h(Badge, { key: "neutral", label: "未开始", tone: "neutral" })
  ]);
  if (id === "table") return h(Table, { title: "项目列表" });
  if (id === "data-table") return h(DataTable, { title: "数据列表" });
  if (id === "pagination") return h(Pagination, { onChange: (page) => setStatus(`Pagination · 第 ${page} 页`) });
  if (id === "breadcrumb") return h(Breadcrumb, { onNavigate: (item) => setStatus(`Breadcrumb · ${item}`) });
  if (id === "progress") return h(Progress, { value: 68 });
  if (id === "empty") return h(Empty, { onCreate: () => setStatus("Empty · 新建项目") });
  if (id === "label") return h(Label, { children: "邮箱", htmlFor: "runtime-project-name" });
  if (id === "alert") return h("div", { className: "tui-feedback-specimens", "data-runtime-component": "alert" }, feedbackSpecimensFor(component).map((specimen) => h("div", { className: "tui-feedback-specimen", "data-specimen": specimen.id, key: specimen.id }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, specimen.label), h(Alert, { key: "alert", tone: specimen.variant, message: specimen.message, action: specimen.action, onAction: () => setStatus(`Alert · ${specimen.variant}`) })])));
  if (id === "tooltip") return h(Tooltip);
  if (id === "toast") return h(Toast);
  if (id === "dialog") return h("div", { className: "tui-overlay-specimens" }, [h(Dialog, { key: "single", actionLayout: "single", onConfirm: () => setStatus("Dialog · 已确认") }), h(Dialog, { key: "double", actionLayout: "double", onConfirm: () => setStatus("Dialog · 已确认"), onCancel: () => setStatus("Dialog · 已取消") }), h(Dialog, { key: "triple", actionLayout: "triple", onConfirm: () => setStatus("Dialog · 已确认"), onCancel: () => setStatus("Dialog · 已取消"), onThirdAction: () => setStatus("Dialog · 已保存草稿") })]);
  if (id === "alert-dialog") return h(AlertDialog, { onConfirm: () => setStatus("Alert Dialog · 已删除"), onCancel: () => setStatus("Alert Dialog · 已取消") });
  if (id === "semi-modal") return h(RuntimeSemiModal, { setStatus });
  if (id === "menubar") return h(Menubar);
  if (id === "context-menu") return h(ContextMenu);
  if (id === "dropdown-menu") return h(DropdownMenu);
  if (id === "popover") return h(Popover);
  if (id === "hover-card") return h(HoverCard);
  if (id === "slider") return h("div", { className: "tui-slider-gallery", "data-runtime-component": "slider" }, [
    h("div", { className: "tui-slider-specimen", "data-slider-style": "style-1", key: "style-1" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "样式 1 · 4px 背景条 / 16px 圆形把手"), h(Slider, { key: "slider", variant: "style-1", onChange: (value) => setStatus(`Slider · ${value}`) })]),
    h("div", { className: "tui-slider-specimen", "data-slider-style": "style-2", key: "style-2" }, [h("span", { className: "tui-runtime-surface-label", key: "label" }, "样式 2 · 20px 背景条 / 12px 圆形把手"), h(Slider, { key: "slider", variant: "style-2", onChange: (value) => setStatus(`Slider · ${value}`) })])
  ]);
  if (id === "color-picker") return h(ColorPicker, { onChange: (value) => setStatus(`ColorPicker · ${typeof value === "string" ? value : `${value.axis} · ${value.value}`}`) });
  if (id === "input-otp") return h(InputOtp, { onComplete: () => setStatus("Input OTP · 已完成") });
  if (id === "kbd") return h(Kbd);
  if (id === "chart") return h(Chart);
  if (id === "calendar") return h(Calendar);
  if (id === "date-picker") return h(DatePicker);
  if (id === "time-picker") return h(TimePicker);
  if (id === "attachment") return h(Attachment, { onAction: (action) => setStatus(`Attachment · ${action === "preview" ? "已预览" : "已下载"}`) });
  return null;
};

function RuntimeCard({ component, setStatus }) {
  const [contractOpen, setContractOpen] = React.useState(false);
  const Component = Generated[pascal(component.id)];
  const comparison = comparisonMetaFor(component);
  const readiness = readinessInfoFor(component);
  const directProps = component.id === "attachment" ? { onAction: (action) => setStatus(`Attachment · ${action === "preview" ? "已预览" : "已下载"}`) } : {};
  const preview = coreIds.has(component.id)
    ? runtimeCore(component.id, setStatus, component)
    : (Component ? h(Component, { state: "default", fixtureId: component.fixtureId, ...directProps }) : h("p", { className: "tui-runtime-framework-missing" }, `React 适配器缺失：${component.id}`));
  const previewContent = Array.isArray(preview)
    ? preview.map((child, index) => h(React.Fragment, { key: index }, child))
    : preview;
  const previewChildren = Array.isArray(previewContent) ? previewContent : [previewContent];
  return h("article", {
    className: cardClass(component),
    "data-component-card": component.id,
    "data-contract-id": component.id,
    "data-category": comparison.groupId,
    "data-order": String(comparison.comparisonOrder),
    "data-registry-category": component.category,
    "data-registry-order": String(component.order),
    "data-fixture-id": component.fixtureId,
    "data-framework": "react",
    "data-readiness": readiness.level,
    "aria-labelledby": `runtime-react-${component.id}-title`
  }, [
    h("header", { className: "tui-runtime-card__head", key: "head" }, [
      h("div", { key: "title" }, [
        h("h3", { id: `runtime-react-${component.id}-title`, key: "heading" }, componentTitle(component)),
      ]),
      h("button", { type: "button", className: "tui-component tui-button tui-runtime-card__contract-trigger", "data-component": "button", "data-renderer-key": "button", "data-logical-component": "Icon Text Button/Ghost/Default", "data-variant": "ghost", "data-state": "default", "data-framework": "react", "data-mode": "icon-text", "data-size": "small", "data-button-type": "icon-text-ghost", "data-contract-dialog-trigger": "", "aria-haspopup": "dialog", "aria-expanded": contractOpen, onClick: () => setContractOpen(true), key: "contract-trigger" }, "组件规范")
    ]),
    h("div", { className: "tui-runtime-card__preview", key: "preview", "data-fixture-id": component.fixtureId }, ...previewChildren),
    contractOpen ? h(ContractDialog, { component, framework: "react", onClose: (reason) => { setContractOpen(false); setStatus(`组件规范 · ${reason}`); }, key: "contract" }) : null
  ]);
}

function RuntimeApp({ onStatus }) {
  const [status, setStatus] = React.useState("React 运行时已加载");
  const updateStatus = (message) => { setStatus(message); onStatus(message); };
  return h("div", { className: "tui-runtime-directory-grid", "data-runtime-framework": "react" }, [
    ...runtimeCategories.map((category) => h("section", { className: "tui-runtime-category", key: category.id, "data-runtime-category": category.id }, [
      h("h4", { className: "tui-runtime-category__title", key: "title" }, category.label),
      h("div", { className: "tui-runtime-category__grid", key: "grid" }, category.components.map((component) => h(RuntimeCard, { key: component.id, component, setStatus: updateStatus })))
    ])),
    h("p", { className: "status", "aria-live": "polite", key: "status" }, status)
  ]);
}

export function mountReactRuntime(container, { onStatus = () => {} } = {}) {
  container.dataset.framework = "react";
  const root = createRoot(container);
  root.render(h(RuntimeApp, { onStatus }));
  return () => root.unmount();
}
