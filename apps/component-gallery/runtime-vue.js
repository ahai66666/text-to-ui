import { createApp, h, onBeforeUnmount, onMounted, ref } from "vue";
import { createTitlebarPreviewScenes } from "../../packages/component-contracts/src/titlebar-segments.js";
import { Button, Input, Search, Sidebar, PrimaryNavigationItem, ListCard, Titlebar, Textarea, Field, FormField, Select, Combobox, NativeSelect, Checkbox, Radio, RadioGroup, Switch, SegmentedButton, NumberSelector, Chips, Tabs, SubTabs, TreeView, Accordion, Collapsible, Avatar, Badge, Table, DataTable, Pagination, Breadcrumb, Progress, Empty, Label, Alert, Tooltip, Toast, Icon } from "../../packages/components-vue/src/index.js?rev=20260928-3";
import { AlertDialog, Attachment, Calendar, Chart, ColorPicker, ContextMenu, DatePicker, Dialog, DropdownMenu, HoverCard, InputOtp, Kbd, Menubar, Popover, Slider, SemiModal, TimePicker } from "../../packages/components-vue/src/advanced.js?rev=20260812-1";
import * as Generated from "../../packages/components-vue/src/generated/index.js?rev=20260810-1";
import { cardClass, comparisonMetaFor, componentTitle, coreIds, feedbackSpecimensFor, readinessInfoFor, runtimeCategories } from "./runtime-catalog.js";
import { contractInspectorData, contractInspectorGroups } from "./contract-inspector.js";
import "./framework-runtime.css";

const pascal = (value) => value.split(/[-_]/g).map((part) => part[0].toUpperCase() + part.slice(1)).join("");
const iconNode = (name, size = 20) => h(Icon, { name, size });

const ContractDialog = {
  props: { component: Object, framework: String, onClose: Function },
  setup(props) {
    const data = contractInspectorData(props.component, props.framework);
    const groups = contractInspectorGroups(props.component, props.framework);
    const closeButton = ref(null);
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); props.onClose?.("已关闭"); }
    };
    onMounted(() => { closeButton.value?.focus(); document.addEventListener("keydown", onKeyDown); });
    onBeforeUnmount(() => document.removeEventListener("keydown", onKeyDown));
    return () => h("div", {
      class: "tui-contract-dialog",
      role: "presentation",
      "data-contract-dialog": "",
      "data-contract-logical-name": data.logicalName
    }, [
      h("div", { class: "tui-contract-dialog__backdrop", onClick: () => props.onClose?.("已关闭") }),
      h("section", { class: "tui-contract-dialog__surface", role: "dialog", "aria-modal": "true", "aria-labelledby": `contract-dialog-vue-${props.component.id}-title` }, [
        h("header", { class: "tui-contract-dialog__header" }, [
          h("div", [
            h("h4", { id: `contract-dialog-vue-${props.component.id}-title` }, `${data.logicalName} · 组件规范`),
            h("p", `${data.statusLabel} · ${data.completeCount}/${data.readiness.length} 个验收维度已通过`)
          ]),
          h("button", { ref: closeButton, type: "button", class: "tui-contract-dialog__close", "aria-label": "关闭组件规范", onClick: () => props.onClose?.("关闭") }, "×")
        ]),
        h("div", { class: "tui-contract-inspector__body" }, [
          h("div", { class: "tui-contract-inspector__identity" }, [h("span", "逻辑身份"), h("code", data.logicalName), h("strong", { class: `tui-readiness-pill tui-readiness-pill--${data.status}` }, data.statusLabel)]),
          ...groups.map((group) => h("section", { class: "tui-contract-inspector__group", key: group.label }, [
            h("h5", group.label),
            h("dl", group.rows.map(([label, value]) => h("div", { class: "tui-contract-inspector__row", key: label }, [h("dt", label), h("dd", value)])))
          ])),
          h("div", { class: "tui-contract-inspector__readiness", "aria-label": "验收维度" }, data.readiness.map((item) => h("span", { class: `tui-contract-inspector__badge${item.complete ? " is-complete" : ""}`, key: item.key }, item.label))),
          data.note ? h("p", { class: "tui-contract-inspector__note" }, data.note) : null
        ])
      ])
    ]);
  }
};

const InteractiveButtonVariant = {
  props: { mode: String, variant: String, label: String, iconOnly: Boolean, setStatus: Function },
  setup(props) {
    const open = ref(false);
    const root = ref(null);
    const onPointerDown = (event) => {
      if (open.value && !root.value?.contains(event.target)) open.value = false;
    };
    onMounted(() => document.addEventListener("pointerdown", onPointerDown));
    onBeforeUnmount(() => document.removeEventListener("pointerdown", onPointerDown));
    return () => {
      const logicalName = `Split Dropdown Button/${props.iconOnly ? "Icon Only" : "Icon Text"}/Default`;
      const menuItems = props.iconOnly ? ["重新加载", "同步数据", "清理缓存并刷新"] : ["导出为 PDF", "复制分享链接", "发送到设备"];
      return h("div", { ref: root, class: `tui-component tui-split-button${props.iconOnly ? " tui-split-button--icon" : ""}`, "data-component": "button", "data-logical-component": logicalName, "data-variant": "ghost", "data-state": "default", "data-framework": "vue", "data-mode": "split-dropdown" }, [
        h("div", { class: "tui-split-button__control" }, [
          h(Button, { label: props.label, variant: "ghost", mode: "split-dropdown", icon: props.iconOnly ? "action/refresh" : "action/download", iconOnly: props.iconOnly, logicalName, class: `tui-split-button__main${props.iconOnly ? " tui-split-button__main--icon" : ""}`, "aria-label": props.iconOnly ? props.label : undefined, onClick: () => props.setStatus?.(`Split Dropdown · ${props.iconOnly ? "Icon" : "Icon + Text"} · 主操作`) }),
          h("button", { type: "button", class: "tui-component tui-button tui-split-button__trigger", "data-component": "button", "data-logical-component": logicalName, "data-variant": "ghost", "data-state": "default", "data-framework": "vue", "data-mode": "split-dropdown", "data-size": "standard", "aria-label": "展开更多操作", "aria-haspopup": "menu", "aria-expanded": open.value, onClick: () => { open.value = !open.value; } }, iconNode("navigation/chevron-down", 16))
        ]),
        h("div", { class: "tui-button-dropdown__menu", role: "menu", hidden: !open.value }, menuItems.map((item) => h("button", { type: "button", role: "menuitem", class: "tui-button-dropdown__item", key: item, onClick: () => { open.value = false; props.setStatus?.(`已选择 ${item}`); } }, item)))
      ]);
    };
  }
};

const RuntimeStructuralButton = (props) => h("div", { class: "tui-runtime-structural-grid tui-runtime-structural-grid--button", "data-runtime-component": "button" }, [
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
].map(([id, variant, label, mode, size, iconOnly]) => h("div", { class: "tui-runtime-structural-cell", "data-specimen": id, key: id }, [
  h("span", { class: "tui-runtime-surface-label", key: "label" }, id),
  mode === "split-dropdown"
    ? h(InteractiveButtonVariant, { key: "button", mode, variant, label, iconOnly, setStatus: props.setStatus })
    : h(Button, { key: "button", label, variant, mode, size, icon: mode === "icon-text" ? "action/add" : mode === "icon" ? "action/more" : undefined, state: "default", onClick: () => props.setStatus(`Button · ${id} · 已触发`) })
])));

const RuntimeChips = (props) => h("div", { class: "tui-runtime-chips-gallery", "data-runtime-component": "chips" }, h(Chips, { label: "操作块", onClose: () => props.setStatus?.("Chips · 已移除") }));

const RuntimeSearchGallery = {
  props: { setStatus: Function },
  setup(props) {
    const whiteValue = ref(""); const whiteScope = ref("全部"); const grayValue = ref(""); const grayScope = ref("全部");
    const sample = (surface, value, scope) => h(Search, { placeholder: "搜索项目", surface, scope: scope.value, scopeOptions: ["全部", "标题", "内容"], advancedSearch: true, modelValue: value.value, "onScope-change": (next) => { scope.value = next; props.setStatus?.(`Search · 范围：${next}`); }, "onUpdate:modelValue": (next) => { value.value = next; props.setStatus?.("Search · 已输入"); }, onClear: () => { value.value = ""; props.setStatus?.("Search · 已清除"); }, "onAdvanced-search": () => props.setStatus?.("Search · 高级") });
    return () => h("div", { class: "tui-runtime-surface-pair tui-runtime-search-pair" }, [
      h("div", { "data-surface-context": "white" }, [h("span", { class: "tui-runtime-surface-label" }, "白色内容面 · 灰色搜索面 · Search · Scoped + 高级"), sample("white", whiteValue, whiteScope)]),
      h("div", { "data-surface-context": "gray" }, [h("span", { class: "tui-runtime-surface-label" }, "灰色内容面 · 白色搜索面 · Search · Scoped + 高级"), h(Search, { placeholder: "搜索项目", surface: "gray", modelValue: grayValue.value, scope: grayScope.value, scopeOptions: ["全部", "标题", "内容"], advancedSearch: true, "onScope-change": (next) => { grayScope.value = next; props.setStatus?.(`Search · 范围：${next}`); }, "onAdvanced-search": () => props.setStatus?.("Search · 高级"), "onUpdate:modelValue": (next) => { grayValue.value = next; props.setStatus?.("Search · 已输入"); }, onClear: () => { grayValue.value = ""; props.setStatus?.("Search · 已清除"); } })])
    ]);
  }
};

const RuntimePrimaryNavigationGallery = {
  props: { setStatus: Function },
  setup(props) {
    const selected = ref("项目");
    const items = [["工作台", "navigation/grid"], ["项目", "field/calendar"], ["消息", "navigation/mail-unread"], ["设置", "action/settings"]];
    return () => h("div", { class: "tui-runtime-core-gallery tui-runtime-primary-navigation-gallery" }, [
      h("p", { class: "tui-runtime-note" }, "一级导航使用独立的原生 Primary Navigation Item；Pattern 只负责把它放入底部对齐的 primary-navigation-shell。"),
      h("nav", { class: "tui-primary-navigation-items", "aria-label": "一级导航" }, items.map(([label, icon]) => h(PrimaryNavigationItem, { key: label, label, icon, selected: label === selected.value, onSelect: (next) => { selected.value = next; props.setStatus?.(`Primary Navigation Item · ${next}`); } })))
    ]);
  }
};

const RuntimeSidebarGallery = {
  props: { setStatus: Function },
  setup(props) {
    const selected = ref("projects");
    const items = [{ id: "projects", label: "项目", icon: "navigation/grid", count: 24 }, { id: "recent", label: "最近访问", icon: "navigation/recent" }, { id: "shared", label: "与我共享", icon: "action/more" }];
    return () => h(Sidebar, { items, selected: selected.value, onSelect: (next) => { selected.value = next; props.setStatus?.(`Sidebar · ${next}`); } });
  }
};

const RuntimeListCardGallery = {
  props: { setStatus: Function },
  setup(props) {
    const selected = ref("");
    const cards = [["one", "项目设置", { lines: 1, trailing: "text-arrow", trailingText: "详情" }], ["two", "成员权限", { description: "管理角色和访问范围", lines: 2, trailing: "icon" }], ["three", "通知方式", { description: "邮件通知", supporting: "已同步到云端", lines: 3, trailing: "radio" }], ["switch", "自动同步", { lines: 1, trailing: "switch" }], ["checkbox", "项目归档", { lines: 1, trailing: "checkbox" }], ["event", "更新动态", { lines: 1, trailing: "notification-arrow" }]];
    return () => h("div", { class: "tui-list-card-group", role: "list" }, cards.map(([id, title, cardProps]) => h(ListCard, { ...cardProps, key: id, title, selected: id === selected.value, onClick: () => { selected.value = id; props.setStatus?.(`List Item · ${title}`); } })));
  }
};

const RuntimeTitlebarGallery = (props) => h("div", { class: "tui-runtime-titlebar-gallery", "data-runtime-component": "titlebar" }, createTitlebarPreviewScenes().map(({ size, label, scenes }) =>
  h("section", { key: size, class: "tui-runtime-titlebar-size-group", "data-preview-size": size }, [
    h("h4", { class: "tui-runtime-titlebar-size-title" }, label),
    h("div", { class: "tui-runtime-titlebar-layouts" }, scenes.map(scene => h("div", { key: scene.layout, "data-preview-layout": scene.layout }, [
      h("strong", { class: "tui-runtime-titlebar-scenario-title" }, scene.label),
      h("span", { class: "tui-runtime-titlebar-scenario-slots" }, scene.description),
      h("div", { class: `tui-runtime-titlebar-layout-shell tui-runtime-titlebar-layout-shell--${scene.columns}` }, scene.segments.map((options, index) => h(Titlebar, { ...options, key: index,
        onAction: action => props.setStatus?.(`Titlebar · ${label} · ${scene.label} · ${action}`),
        onMainContentAction: action => props.setStatus?.(`Titlebar · ${label} · ${scene.label} · Main Content · ${action}`),
        onMainDetailAction: action => props.setStatus?.(`Titlebar · ${label} · ${scene.label} · ${action}`)
      })))
    ])))
  ])
));

const RuntimeSemiModal = {
  props: { setStatus: Function },
  setup(props) {
    const size = ref("m"); const surface = ref("white"); const mode = ref("non-modal");
    const select = (label, value, onChange, options) => h("label", { "data-typography-role": "body-m", key: label }, [label, h("select", { value: value.value, onChange: (event) => onChange(event.target.value) }, options.map(([id, text]) => h("option", { value: id, key: id }, text)))]);
    return () => h("div", { class: "tui-overlay-example" }, [
      h("div", { class: "tui-specimen-controls" }, [
        select("尺寸", size, (value) => { size.value = value; }, [["s", "S · 480"], ["m", "M · 640"], ["l", "L · 800"]]),
        select("背景", surface, (value) => { surface.value = value; }, [["white", "White"], ["gray", "Gray"]]),
        select("模式", mode, (value) => { mode.value = value; }, [["non-modal", "Non-modal"], ["modal", "Modal"]])
      ]),
      h(SemiModal, { key: `${size.value}-${surface.value}-${mode.value}`, size: size.value, surface: surface.value, mode: mode.value, onConfirm: () => props.setStatus?.("Semi-modal · 已保存"), onCancel: () => props.setStatus?.("Semi-modal · 已取消"), onClose: () => props.setStatus?.("Semi-modal · 已关闭") })
    ]);
  }
};

const runtimeCore = (id, setStatus, component) => {
  if (id === "button") return h(RuntimeStructuralButton, { setStatus });
  if (id === "chips") return h(RuntimeChips, { setStatus });
  if (id === "input") return h("div", { class: "tui-runtime-core-gallery" }, [
    h("p", { class: "tui-runtime-note", key: "note" }, "标准 Input 按内容面映射白/灰 surface；Tag Entry 是一个通用变体，仅展示一份，实际使用同样通过 surface=white/gray 复用。Enter 打开建议，选择后转为可移除标签；未选择的文本可保留。"),
    h("div", { class: "tui-runtime-surface-pair", key: "default-inputs" }, [
      h("div", { key: "white", "data-surface-context": "white" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "白色内容面 · 灰色输入面"), h(Input, { key: "input", placeholder: "项目名称", surface: "white" })]),
      h("div", { key: "gray", "data-surface-context": "gray" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "灰色内容面 · 白色输入面"), h(Input, { key: "input", placeholder: "项目名称", surface: "gray" })])
    ]),
    h(Input, { key: "tag-entry", variant: "tag-entry", surface: "gray", label: "参与成员", placeholder: "输入姓名后按 Enter", options: ["林娜", "王昊", "陈佳", "周明"], defaultTags: ["林娜"] })
  ]);
  if (id === "search") return h(RuntimeSearchGallery, { setStatus });
  if (id === "primary-navigation-item") return h(RuntimePrimaryNavigationGallery, { setStatus });
  if (id === "sidebar") return h(RuntimeSidebarGallery, { setStatus });
  if (id === "list-card") return h(RuntimeListCardGallery, { setStatus });
  if (id === "titlebar") return h(RuntimeTitlebarGallery, { setStatus });
  if (id === "textarea") return h("div", { class: "tui-runtime-surface-pair tui-runtime-textarea-pair" }, [
    h("div", { key: "white", "data-surface-context": "white" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "白色内容面 · 灰色输入面"), h(Textarea, { key: "textarea", label: "项目说明", modelValue: "统一 HarmonyOS PC 客户端中的布局、组件与交互规则。", help: "支持多行输入，最多 500 字", surface: "white", "onUpdate:modelValue": () => setStatus("Textarea · 已输入") })]),
    h("div", { key: "gray", "data-surface-context": "gray" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "灰色内容面 · 白色输入面"), h(Textarea, { key: "textarea", label: "项目说明", modelValue: "统一 HarmonyOS PC 客户端中的布局、组件与交互规则。", help: "支持多行输入，最多 500 字", surface: "gray", "onUpdate:modelValue": () => setStatus("Textarea · 已输入") })])
  ]);
  if (id === "field") return h(Field, { label: "项目名称", modelValue: "客户端设计系统", help: "这是一个必填字段", "onUpdate:modelValue": () => setStatus("Field · 已输入") });
  if (id === "form-field") return h("div", { class: "tui-runtime-form-field-states" }, [
    h("div", { key: "default-white", "data-surface-context": "white" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "默认 · 白色内容面 / 灰色输入面"), h(FormField, { key: "field", label: "项目名称", surface: "white" }, { default: () => h(Input, { modelValue: "客户端设计系统", surface: "white", ariaLabel: "项目名称", "onUpdate:modelValue": () => setStatus("Form Field · 已输入") }) })]),
    h("div", { key: "default-gray", "data-surface-context": "gray" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "默认 · 灰色内容面 / 白色输入面"), h(FormField, { key: "field", label: "项目名称", surface: "gray" }, { default: () => h(Input, { modelValue: "客户端设计系统", surface: "gray", ariaLabel: "项目名称", "onUpdate:modelValue": () => setStatus("Form Field · 已输入") }) })]),
    h("div", { key: "required-white", "data-surface-context": "white" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "必填 · 白色内容面 / 灰色选择面"), h(FormField, { key: "field", label: "项目状态", required: true, surface: "white" }, { default: () => h(Select, { id: "form-field-white-status", surface: "white", ariaLabel: "项目状态", onChange: (value) => setStatus(`Form Field · ${value}`) }) })]),
    h("div", { key: "required-gray", "data-surface-context": "gray" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "必填 · 灰色内容面 / 白色选择面"), h(FormField, { key: "field", label: "项目状态", required: true, surface: "gray" }, { default: () => h(Select, { id: "form-field-gray-status", surface: "gray", ariaLabel: "项目状态", onChange: (value) => setStatus(`Form Field · ${value}`) }) })]),
    h("div", { key: "error-white", "data-surface-context": "white" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "错误 · 白色内容面 / 灰色输入面"), h(FormField, { key: "field", label: "项目名称", surface: "white", error: "项目名称不能为空" }, { default: () => h(Input, { modelValue: "", surface: "white", ariaLabel: "项目名称", error: true, "onUpdate:modelValue": () => setStatus("Form Field · 已输入") }) })]),
    h("div", { key: "error-gray", "data-surface-context": "gray" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "错误 · 灰色内容面 / 白色输入面"), h(FormField, { key: "field", label: "项目名称", surface: "gray", error: "项目名称不能为空" }, { default: () => h(Input, { modelValue: "", surface: "gray", ariaLabel: "项目名称", error: true, "onUpdate:modelValue": () => setStatus("Form Field · 已输入") }) })])
  ]);
  if (id === "select") return h("div", { class: "tui-runtime-surface-pair" }, [
    h("div", { key: "white", "data-surface-context": "white" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "白色内容面 · 灰色选择面"), h(Select, { key: "select", label: "状态", surface: "white", onChange: (value) => setStatus(`Select · ${value}`) })]),
    h("div", { key: "gray", "data-surface-context": "gray" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "灰色内容面 · 白色选择面"), h(Select, { key: "select", label: "状态", surface: "gray", onChange: (value) => setStatus(`Select · ${value}`) })])
  ]);
  if (id === "combobox") return h(Combobox, { label: "字体", modelValue: "思源黑体", options: ["思源黑体", "源然雅黑", "鸿蒙黑体", "宋体", "黑体"], onChange: (value) => setStatus(`Combobox · ${value}`) });
  if (id === "native-select") return h(NativeSelect, { label: "视图", onChange: (event) => setStatus(`Native Select · ${event?.target?.value ?? event}`) });
  if (id === "checkbox") return h(Checkbox, { onChange: (value) => setStatus(`Checkbox · ${value ? "选中" : "取消"}`) });
  if (id === "radio") return h("div", { class: "tui-runtime-structural-grid" }, [h(Radio, { key: "unselected", label: "未选中", value: "unselected", name: "runtime-radio", onChange: () => setStatus("Radio · 未选中") }), h(Radio, { key: "selected", label: "已选中", value: "selected", name: "runtime-radio", modelValue: true, onChange: () => setStatus("Radio · 已选中") })]);
  if (id === "radio-group") return h(RadioGroup, { onChange: (value) => setStatus(`Radio Group · ${value}`) });
  if (id === "switch") return h(Switch, { onChange: (value) => setStatus(`Switch · ${value ? "开启" : "关闭"}`) });
  if (id === "segmented-button") return h(SegmentedButton, { onChange: (value) => setStatus(`Segmented Button · ${value}`) });
  if (id === "number-selector") return h(NumberSelector, { onChange: (value) => setStatus(`Number Selector · ${value}`) });
  if (id === "tabs") return h(Tabs, { onChange: (value) => setStatus(`Tabs · ${value}`) });
  if (id === "sub-tabs") return h(SubTabs, { onChange: (value) => setStatus(`Sub Tabs · ${value}`) });
  if (id === "tree-view") return h(TreeView, { onSelect: (value) => setStatus(`Tree View · ${value}`), onToggle: (value, open) => setStatus(`Tree View · ${value} · ${open ? "展开" : "收起"}`) });
  if (id === "accordion") return h(Accordion, { onChange: (open) => setStatus(`Accordion · ${open ? "展开" : "收起"}`) });
  if (id === "collapsible") return h(Collapsible, { onChange: (open) => setStatus(`Collapsible · ${open ? "展开" : "收起"}`) });
  if (id === "avatar") return h("div", { class: "tui-runtime-avatar-pair" }, [
    h("div", { key: "32" }, [h("span", { class: "tui-runtime-surface-label" }, "32 × 32"), h(Avatar, { initials: "H", name: "HarmonyOS 32", size: 32 })]),
    h("div", { key: "40" }, [h("span", { class: "tui-runtime-surface-label" }, "40 × 40"), h(Avatar, { initials: "H", name: "HarmonyOS 40", size: 40 })])
  ]);
  if (id === "badge") return h("div", { class: "tui-badge-group", "aria-label": "Badge 颜色示例" }, [
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
  if (id === "label") return h(Label, { text: "邮箱", forId: "runtime-project-name" });
  if (id === "alert") return h("div", { class: "tui-feedback-specimens", "data-runtime-component": "alert" }, feedbackSpecimensFor(component).map((specimen) => h("div", { class: "tui-feedback-specimen", "data-specimen": specimen.id, key: specimen.id }, [h("span", { class: "tui-runtime-surface-label" }, specimen.label), h(Alert, { tone: specimen.variant, message: specimen.message, action: specimen.action, onAction: () => setStatus(`Alert · ${specimen.variant}`) })])));
  if (id === "tooltip") return h(Tooltip);
  if (id === "toast") return h(Toast);
  if (id === "dialog") return h("div", { class: "tui-overlay-specimens" }, [h(Dialog, { key: "single", actionLayout: "single", onConfirm: () => setStatus("Dialog · 已确认") }), h(Dialog, { key: "double", actionLayout: "double", onConfirm: () => setStatus("Dialog · 已确认"), onCancel: () => setStatus("Dialog · 已取消") }), h(Dialog, { key: "triple", actionLayout: "triple", onConfirm: () => setStatus("Dialog · 已确认"), onCancel: () => setStatus("Dialog · 已取消"), onThird: () => setStatus("Dialog · 已保存草稿") })]);
  if (id === "alert-dialog") return h(AlertDialog, { onConfirm: () => setStatus("Alert Dialog · 已删除"), onCancel: () => setStatus("Alert Dialog · 已取消") });
  if (id === "semi-modal") return h(RuntimeSemiModal, { setStatus });
  if (id === "menubar") return h(Menubar);
  if (id === "context-menu") return h(ContextMenu);
  if (id === "dropdown-menu") return h(DropdownMenu);
  if (id === "popover") return h(Popover);
  if (id === "hover-card") return h(HoverCard);
  if (id === "slider") return h("div", { class: "tui-slider-gallery", "data-runtime-component": "slider" }, [
    h("div", { class: "tui-slider-specimen", "data-slider-style": "style-1", key: "style-1" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "样式 1 · 4px 背景条 / 16px 圆形把手"), h(Slider, { key: "slider", variant: "style-1", onChange: (value) => setStatus(`Slider · ${value}`) })]),
    h("div", { class: "tui-slider-specimen", "data-slider-style": "style-2", key: "style-2" }, [h("span", { class: "tui-runtime-surface-label", key: "label" }, "样式 2 · 20px 背景条 / 12px 圆形把手"), h(Slider, { key: "slider", variant: "style-2", onChange: (value) => setStatus(`Slider · ${value}`) })])
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

const RuntimeCard = {
  props: { component: Object, setStatus: Function },
  setup(props) {
    const contractOpen = ref(false);
    return () => {
    const Component = Generated[pascal(props.component.id)];
    const comparison = comparisonMetaFor(props.component);
    const readiness = readinessInfoFor(props.component);
    const directProps = props.component.id === "attachment" ? { onAction: (action) => props.setStatus(`Attachment · ${action === "preview" ? "已预览" : "已下载"}`) } : {};
    const preview = coreIds.has(props.component.id)
      ? runtimeCore(props.component.id, props.setStatus, props.component)
      : (Component ? h(Component, { state: "default", fixtureId: props.component.fixtureId, ...directProps }) : h("p", { class: "tui-runtime-framework-missing" }, `Vue 适配器缺失：${props.component.id}`));
    return h("article", {
      class: cardClass(props.component),
      "data-component-card": props.component.id,
      "data-contract-id": props.component.id,
      "data-category": comparison.groupId,
      "data-order": String(comparison.comparisonOrder),
      "data-registry-category": props.component.category,
      "data-registry-order": String(props.component.order),
      "data-fixture-id": props.component.fixtureId,
      "data-framework": "vue",
      "data-readiness": readiness.level,
      "aria-labelledby": `runtime-vue-${props.component.id}-title`
    }, [
      h("header", { class: "tui-runtime-card__head", key: "head" }, [
        h("div", { key: "title" }, [
          h("h3", { id: `runtime-vue-${props.component.id}-title` }, componentTitle(props.component)),
        ]),
        h("button", { type: "button", class: "tui-component tui-button tui-runtime-card__contract-trigger", "data-component": "button", "data-renderer-key": "button", "data-logical-component": "Icon Text Button/Ghost/Default", "data-variant": "ghost", "data-state": "default", "data-framework": "vue", "data-mode": "icon-text", "data-size": "small", "data-button-type": "icon-text-ghost", "data-contract-dialog-trigger": "", "aria-haspopup": "dialog", "aria-expanded": contractOpen.value, onClick: () => { contractOpen.value = true; }, key: "contract-trigger" }, "组件规范")
      ]),
      h("div", { class: "tui-runtime-card__preview", key: "preview", "data-fixture-id": props.component.fixtureId }, preview),
      contractOpen.value ? h(ContractDialog, { component: props.component, framework: "vue", onClose: (reason) => { contractOpen.value = false; props.setStatus(`组件规范 · ${reason}`); }, key: "contract" }) : null
    ]);
    };
  }
};

const RuntimeApp = {
  props: { onStatus: { type: Function, default: () => {} } },
  setup(props) {
    const status = ref("Vue 运行时已加载");
    const setStatus = (message) => { status.value = message; props.onStatus(message); };
    return () => h("div", { class: "tui-runtime-directory-grid", "data-runtime-framework": "vue" }, [
      ...runtimeCategories.map((category) => h("section", { class: "tui-runtime-category", key: category.id, "data-runtime-category": category.id }, [
        h("h4", { class: "tui-runtime-category__title", key: "title" }, category.label),
        h("div", { class: "tui-runtime-category__grid", key: "grid" }, category.components.map((component) => h(RuntimeCard, { key: component.id, component, setStatus })))
      ])),
      h("p", { class: "status", "aria-live": "polite", key: "status" }, status.value)
    ]);
  }
};

export function mountVueRuntime(container, { onStatus = () => {} } = {}) {
  container.dataset.framework = "vue";
  const app = createApp(RuntimeApp, { onStatus });
  app.mount(container);
  return () => app.unmount();
}
