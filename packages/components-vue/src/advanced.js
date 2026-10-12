import { Teleport, computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import "./styles.css";
import Icon from "./Icon.js";

const contract = (id, logicalName, variant = "default", state = "default") => ({ "data-component": id, "data-logical-component": logicalName, "data-variant": variant, "data-state": state, "data-framework": "vue" });
const text = (tag, value, role, props = {}) => h(tag, { ...props, "data-typography-role": role }, value);
const calendarWeekdays = ["日", "一", "二", "三", "四", "五", "六"];
const calendarDays = ["26", "27", "28", "29", "30", "31", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "1", "2", "3", "4", "5"];
const defaultMenubarItems = [{ label: "新建", icon: "action/add" }, { label: "打开", icon: "action/download", hasSubmenu: true, submenu: ["打开项目", "打开最近项目", "从设备打开"] }, { label: "导出", icon: "action/settings" }];

const DialogBase = defineComponent({
  props: {
    id: String, title: String, subtitle: String, description: String, intent: { type: String, default: "default" }, actionLayout: { type: String, default: "double" },
    confirmLabel: { type: String, default: "确认" }, cancelLabel: { type: String, default: "取消" }, thirdActionLabel: { type: String, default: "保存草稿" }, size: { type: String, default: "m" },
    surface: { type: String, default: "white" }, mode: { type: String, default: "modal" }, triggerLabel: { type: String, default: "打开弹窗" }, showClose: Boolean
  },
  emits: ["confirm", "cancel", "third", "close", "update:open"],
  setup(props, { emit, slots }) {
    const open = ref(false); const trigger = ref(); const dialog = ref();
    const titleId = `${props.id}-${Math.random().toString(36).slice(2)}-title`; const descriptionId = `${props.id}-${Math.random().toString(36).slice(2)}-description`;
    const finish = (reason) => { open.value = false; emit("update:open", false); emit(reason); nextTick(() => trigger.value?.focus()); };
    const onKeydown = (event) => {
      if (!open.value) return;
      if (event.key === "Escape") { event.preventDefault(); finish("cancel"); return; }
      if (props.mode !== "modal" || event.key !== "Tab" || !dialog.value) return;
      const focusable = [...dialog.value.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) { event.preventDefault(); dialog.value.focus(); return; }
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeydown); onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
    watch(open, (value) => { if (value) nextTick(() => dialog.value?.focus()); });
    return () => h("div", { class: "tui-overlay-example" }, [
      h("button", { ref: trigger, class: "tui-button", type: "button", "data-variant": "secondary", "data-typography-role": "body-l", onClick: () => { open.value = true; emit("update:open", true); } }, props.triggerLabel),
      open.value ? h(Teleport, { to: "body" }, h("div", { class: "tui-overlay-layer", "data-size": props.size, "data-surface": props.surface, "data-mode": props.mode }, [
        h("div", { class: "tui-overlay-backdrop", "aria-hidden": "true" }),
        h("section", { ref: dialog, class: ["tui-component", "tui-dialog", props.id === "alert-dialog" && "tui-dialog--alert", props.id === "semi-modal" && "tui-dialog--semi"], ...contract(props.id, props.id === "alert-dialog" ? "Alert Dialog/Default" : props.id === "semi-modal" ? "Semi-modal/Default" : "Dialog/Default", props.id === "dialog" ? props.actionLayout : `${props.size}-${props.surface}-${props.mode}`, "open"), role: props.id === "alert-dialog" ? "alertdialog" : "dialog", "aria-modal": props.mode === "modal", "aria-labelledby": titleId, "aria-describedby": descriptionId, tabindex: -1 }, [
          h("header", { class: "tui-dialog__header", "data-slot": "titlebar" }, slots.titlebar?.() ?? [text("h4", props.title, "title-s", { id: titleId, "data-slot": "title" }), props.subtitle ? text("p", props.subtitle, "body-m", { "data-slot": "subtitle" }) : null, props.showClose ? h("button", { class: "tui-icon-button tui-dialog__close", type: "button", "aria-label": "关闭", onClick: () => finish("close") }, [h(Icon, { name: "action/close", size: 20 })]) : null]),
          h("div", { class: "tui-dialog__content" }, [text("p", props.description, "body-m", { id: descriptionId, "data-slot": "description" }), slots.default?.()]),
          h("footer", { class: "tui-dialog__actions", "data-slot": "actions", "data-action-layout": props.actionLayout }, slots.actions?.() ?? (props.actionLayout === "single"
            ? [h("button", { class: "tui-button", type: "button", "data-variant": props.intent === "danger" ? "danger" : "primary", "data-typography-role": "body-l", onClick: () => finish("confirm") }, props.confirmLabel)]
            : props.actionLayout === "triple"
              ? [h("button", { class: "tui-button", type: "button", "data-variant": props.intent === "danger" ? "danger" : "primary", "data-typography-role": "body-l", onClick: () => finish("confirm") }, props.confirmLabel), h("button", { class: "tui-button", type: "button", "data-variant": "secondary", "data-typography-role": "body-l", onClick: () => finish("third") }, props.thirdActionLabel), h("button", { class: "tui-button", type: "button", "data-variant": "secondary", "data-typography-role": "body-l", onClick: () => finish("cancel") }, props.cancelLabel)]
              : [h("button", { class: "tui-button", type: "button", "data-variant": "secondary", "data-typography-role": "body-l", onClick: () => finish("cancel") }, props.cancelLabel), h("button", { class: "tui-button", type: "button", "data-variant": props.intent === "danger" ? "danger" : "primary", "data-typography-role": "body-l", onClick: () => finish("confirm") }, props.confirmLabel)]))
        ])
      ])) : null
    ]);
  }
});
export const Dialog = defineComponent({ props: { actionLayout: { type: String, default: "double" }, thirdActionLabel: String }, emits: ["confirm", "cancel", "third"], setup(props, { emit }) { return () => { const isSingle = props.actionLayout === "single"; const isTriple = props.actionLayout === "triple"; return h(DialogBase, { id: "dialog", title: isSingle ? "更新完成" : isTriple ? "保存更改？" : "确认更新？", description: isSingle ? "应用已经更新到最新版本。" : isTriple ? "你可以先保存草稿，稍后再继续编辑。" : "更新期间应用需要重新启动。", actionLayout: props.actionLayout, thirdActionLabel: props.thirdActionLabel, confirmLabel: isSingle ? "知道了" : "确认", triggerLabel: isSingle ? "打开单按钮对话弹窗" : isTriple ? "打开三按钮对话弹窗" : "打开双按钮对话弹窗", onConfirm: () => emit("confirm"), onCancel: () => emit("cancel"), onThird: () => emit("third") }); }; } });
export const AlertDialog = defineComponent({ emits: ["confirm", "cancel"], setup(_, { emit }) { return () => h(DialogBase, { id: "alert-dialog", title: "删除项目？", description: "删除后无法恢复，请确认操作。", intent: "danger", actionLayout: "double", confirmLabel: "删除", triggerLabel: "打开删除确认弹窗", onConfirm: () => emit("confirm"), onCancel: () => emit("cancel") }); } });
export const SemiModal = defineComponent({ props: { size: { type: String, default: "m" }, surface: { type: String, default: "white" }, mode: { type: String, default: "non-modal" } }, emits: ["confirm", "cancel", "close"], setup(props, { emit }) { return () => h(DialogBase, { id: "semi-modal", title: "编辑项目设置", description: "非模态为默认状态，可以继续操作背景内容。", size: props.size, surface: props.surface, mode: props.mode, showClose: true, confirmLabel: "保存", triggerLabel: "打开半模态弹窗", onConfirm: () => emit("confirm"), onCancel: () => emit("cancel"), onClose: () => emit("close") }, { default: () => h("div", { class: "tui-dialog__form" }, [h("label", { class: "tui-field" }, [text("span", "项目名称", "body-m"), h("span", { class: "tui-input", "data-surface": props.surface }, [h("input", { value: "客户端设计系统", "data-typography-role": "body-l" })])]), h("label", { class: "tui-field" }, [text("span", "负责人", "body-m"), h("span", { class: "tui-search", "data-surface": props.surface }, [h(Icon, { name: "field/search", size: 20 }), h("input", { value: "赵博海", type: "search", "data-typography-role": "body-l" })])])]) }); } });

const Menu = defineComponent({
  props: {
    id: String, logicalName: String, label: String, value: String,
    items: { type: Array, default: () => [] }, className: { type: String, default: "" },
    slotName: String, ariaLabel: String, disabled: Boolean, hideLabel: Boolean, compact: Boolean
  },
  emits: ["select"],
  setup(props, { emit }) {
    const open = ref(false); const selected = ref(props.value); const hasUserSelection = ref(false);
    const activeSubmenu = ref(null);
    watch(() => props.value, (value) => { selected.value = value; });
    const choose = (entry, event) => { if (entry?.hasSubmenu && Array.isArray(entry.submenu)) { activeSubmenu.value = entry.label; return; } const next = entry?.label ?? entry; selected.value = next; hasUserSelection.value = true; activeSubmenu.value = null; open.value = false; emit("select", next, event, entry); };
    const openSubmenu = (entry) => { if (props.id === "menubar" && entry?.hasSubmenu && Array.isArray(entry.submenu)) activeSubmenu.value = entry.label; };
    const renderItems = (items, nested = false) => items.map((item) => { const entry = typeof item === "string" ? { label: item } : item; const hasSubmenu = entry.hasSubmenu && Array.isArray(entry.submenu); return h("div", { key: entry.label, class: ["tui-advanced-menu__item-wrap", hasSubmenu && "has-submenu"], onMouseenter: hasSubmenu ? () => openSubmenu(entry) : undefined }, [h("button", { class: ["tui-advanced-menu__item", hasSubmenu && "has-submenu"], type: "button", role: "menuitem", "aria-haspopup": hasSubmenu ? "menu" : undefined, "aria-expanded": hasSubmenu ? activeSubmenu.value === entry.label : undefined, "data-typography-role": "body-l", onClick: (event) => choose(entry, event) }, [entry.icon ? h("span", { class: "tui-advanced-menu__item-leading", "data-slot": "leading" }, [h(Icon, { name: entry.icon, size: 24 })]) : null, h("span", { "data-slot": "label" }, entry.label), hasSubmenu ? h("span", { class: "tui-advanced-menu__item-trailing", "data-slot": "trailing" }, [h(Icon, { name: "navigation/chevron-right", size: 24 })]) : null]), hasSubmenu && activeSubmenu.value === entry.label ? h("div", { class: "tui-advanced-menu__submenu", role: "menu", "aria-label": entry.label }, renderItems(entry.submenu, true)) : null]); });
    return () => h("div", { class: ["tui-component", "tui-advanced-menu", props.className, props.compact && "is-compact", hasUserSelection.value && "is-selected"], "data-slot": props.slotName, ...contract(props.id, props.logicalName, "default", open.value ? "open" : "default") }, [
      text("span", props.label, "body-m", { class: "tui-advanced-menu__label", hidden: props.hideLabel }),
      h("button", { class: "tui-advanced-menu__trigger", type: "button", "aria-label": props.ariaLabel, "aria-haspopup": "menu", "aria-expanded": open.value, disabled: props.disabled, onClick: () => { open.value = !open.value; } }, [text("span", selected.value, "body-l", { "data-slot": "value" }), h(Icon, { name: "navigation/chevron-down", size: 16 })]),
      h("div", { class: "tui-advanced-menu__panel", role: "menu", hidden: !open.value, onMouseleave: () => props.id === "menubar" && (activeSubmenu.value = null) }, renderItems(props.items))
    ]);
  }
});
export const ContextMenu = defineComponent({ setup: () => () => h(Menu, { id: "context-menu", logicalName: "Context Menu/Default", label: "更多操作", value: "右键或点击打开", items: [{ label: "复制", icon: "action/copy" }, { label: "重命名", icon: "action/rename" }, { label: "删除", icon: "action/delete" }] }) });
export const DropdownMenu = defineComponent({
  props: {
    label: { type: String, default: "操作菜单" }, value: { type: String, default: "新建、导入、导出" },
    items: { type: Array, default: () => ["新建", "导入", "导出"] }, className: String, slotName: String,
    ariaLabel: String, disabled: Boolean, hideLabel: Boolean, compact: Boolean
  },
  emits: ["select"],
  setup(props, { emit }) {
    return () => h(Menu, { id: "dropdown-menu", logicalName: "Dropdown Menu/Default", ...props, onSelect: (value, event, item) => emit("select", value, event, item) });
  }
});
export const Menubar = defineComponent({ props: { items: { type: Array, default: () => defaultMenubarItems } }, setup: (props) => () => h(Menu, { id: "menubar", logicalName: "Menubar/Default", label: "主菜单", value: "文件", items: props.items }) });

export const Popover = defineComponent({ setup: () => { const open = ref(false); return () => h("div", { class: "tui-component tui-advanced-popover", ...contract("popover", "Popover/Default") }, [h("button", { class: "tui-button", type: "button", "data-variant": "ghost", "data-typography-role": "body-l", "aria-expanded": open.value, onClick: () => { open.value = !open.value; } }, "筛选条件"), h("div", { class: "tui-advanced-popover__panel", role: "dialog", hidden: !open.value }, [text("strong", "筛选条件", "title-s"), text("span", "状态、负责人、更新时间", "body-m")])]); } });
export const HoverCard = defineComponent({ setup: () => () => h("div", { class: "tui-component tui-advanced-hover-card", ...contract("hover-card", "Hover Card/Default") }, [h("button", { class: "tui-button", type: "button", "data-variant": "ghost", "data-typography-role": "body-l" }, "组件说明"), h("div", { class: "tui-advanced-hover-card__panel", role: "tooltip" }, [text("strong", "组件说明", "title-s"), text("span", "查看组件的详细使用规则", "body-m")])]) });

export const Slider = defineComponent({ props: { modelValue: { type: Number, default: 84 }, variant: { type: String, default: "style-1" }, label: { type: String, default: "透明度" } }, emits: ["update:modelValue", "change"], setup(props, { emit }) { const value = ref(props.modelValue); return () => { const sliderStyle = props.variant === "style-2" ? "style-2" : "style-1"; const numericValue = Number(value.value); const normalizedValue = Number.isFinite(numericValue) ? Math.min(100, Math.max(0, numericValue)) : 84; return h("label", { class: ["tui-component", "tui-slider", `tui-slider--${sliderStyle}`], "data-slider-style": sliderStyle, ...contract("slider", "Slider/Default", sliderStyle) }, [text("span", props.label, "body-m", { "data-slot": "label" }), h("span", { class: "tui-slider__control", style: { "--tui-slider-value": `${normalizedValue}%` } }, [h("span", { class: "tui-slider__track", "aria-hidden": "true" }, [h("span", { class: "tui-slider__fill" }), h("span", { class: "tui-slider__thumb" })]), h("input", { type: "range", min: 0, max: 100, value: normalizedValue, "aria-label": props.label, onInput: (event) => { value.value = Number(event.target.value); emit("update:modelValue", value.value); emit("change", value.value); } })]), text("output", normalizedValue, "body-m")]); }; } });
const COLOR_PICKER_DEFAULT = "FA2A2F";
const colorPickerFavorites = ["E56224", "0000000C", "00000014", "0000001F", "00000029", "00000033", "0000003D", "00000047", "00000052", "0000005C", "00000066", "00000070", "0000007A", "00000085", "0000008F", "00000099", "000000A3"];
const colorPickerEyedropperPath = "M12.7092 5.73192C12.187 5.20968 11.3402 5.20968 10.818 5.73192C10.2958 6.25416 10.2958 7.10088 10.818 7.62312L12.1787 8.98384L3.66864 17.4946C3.0485 18.1147 2.91928 19.0399 3.28102 19.7871L3.19584 19.8586C2.93472 20.1197 2.93472 20.543 3.19584 20.8042C3.45696 21.0653 3.88032 21.0653 4.14144 20.8042L4.21286 20.719C4.96012 21.0807 5.8853 20.9515 6.50544 20.3314L15.0155 11.8206L16.4916 13.2967C17.0138 13.819 17.8606 13.819 18.3828 13.2967C18.905 12.7745 18.905 11.9278 18.3828 11.4055L17.3798 10.4026L20.2166 7.56576C21.2611 6.52128 21.2611 4.82784 20.2166 3.78336C19.1722 2.73888 17.4787 2.73888 16.4342 3.78336L13.5974 6.62016L12.7092 5.73192ZM4.61398 18.4405L13.1241 9.92978L14.0697 10.8754L5.55958 19.3861C5.29846 19.6472 4.8751 19.6472 4.61398 19.3861C4.35286 19.125 4.35286 19.3861 4.61398 18.4405Z";
const normalizeColorPickerHex = (value) => String(value ?? COLOR_PICKER_DEFAULT).replace(/^#/, "").toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 6).padEnd(6, "0");
export const ColorPicker = defineComponent({
  props: { modelValue: { type: String, default: COLOR_PICKER_DEFAULT }, value: String, disabled: Boolean },
  emits: ["update:modelValue", "change"],
  setup(props, { emit }) {
    const internalHex = ref(normalizeColorPickerHex(props.value ?? props.modelValue));
    const activeTab = ref("color-card");
    const axes = ref({ hue: 360, saturation: 360, brightness: 360, alpha: 100 });
    const currentHex = computed(() => normalizeColorPickerHex(props.value ?? (props.modelValue !== COLOR_PICKER_DEFAULT ? props.modelValue : internalHex.value)));
    const updateHex = (next) => { const normalized = normalizeColorPickerHex(next); internalHex.value = normalized; emit("update:modelValue", `#${normalized}`); emit("change", `#${normalized}`); };
    const updateAxis = (axis, next) => { axes.value = { ...axes.value, [axis]: Number(next) }; emit("change", { axis, value: Number(next) }); };
    const iconNode = h("svg", { class: "tui-color-picker__eyedropper-icon", viewBox: "0 0 24 24", width: 24, height: 24, "aria-hidden": "true", focusable: "false", "data-icon-manual-fallback": "color-picker/eyedropper", "data-source": "pixso" }, [h("path", { d: colorPickerEyedropperPath, fill: "currentColor" })]);
    const tabs = [["color-card", "Color card"], ["slider", "Slider"], ["color-disc", "Color disc"]];
    const rows = [["hue", "Hue", 360], ["saturation", "Saturation", 360], ["brightness", "Brightness", 360], ["alpha", "Alpha", 100]];
    return () => h("section", { class: "tui-component tui-color-picker", ...contract("color-picker", "ColorPicker/Tablet", "default", props.disabled ? "disabled" : "default"), "data-color-value": currentHex.value, "aria-label": "颜色编辑器", style: { "--tui-color-picker-color": `#${currentHex.value}` } }, [
      text("h3", "Color Editor", "title-s", { class: "tui-color-picker__title", "data-slot": "title" }),
      h("div", { class: "tui-color-picker__tabs", role: "tablist", "aria-label": "颜色模式" }, tabs.map(([id, label]) => h("button", { key: id, type: "button", class: ["tui-color-picker__tab", activeTab.value === id && "is-selected"], role: "tab", "aria-selected": activeTab.value === id, "data-color-picker-tab": id, disabled: props.disabled, onClick: () => { activeTab.value = id; } }, label))),
      h("button", { type: "button", class: "tui-color-picker__mode", "data-color-picker-mode": true, "aria-label": "颜色模式：HSB", disabled: props.disabled }, [text("span", "HSB", "body-l", { "data-slot": "mode" }), h("span", { class: "tui-color-picker__mode-icon", "aria-hidden": "true" })]),
      h("div", { class: "tui-color-picker__controls" }, rows.map(([axis, label, max]) => h("label", { class: "tui-color-picker__field", "data-axis": axis, key: axis }, [text("span", label, "body-m", { class: "tui-color-picker__field-label" }), h("span", { class: "tui-color-picker__track-row" }, [h("input", { class: "tui-color-picker__track", type: "range", min: 0, max, value: axes.value[axis], "aria-label": label, "data-color-picker-axis": axis, disabled: props.disabled, onInput: (event) => updateAxis(axis, event.target.value) }), text("output", axes.value[axis], "body-s", { class: "tui-color-picker__value", "data-color-picker-value": true })])]))),
      h("div", { class: "tui-color-picker__divider", role: "separator" }),
      h("div", { class: "tui-color-picker__summary" }, [h("span", { class: "tui-color-picker__summary-main" }, [h("span", { class: "tui-color-picker__swatch", "data-slot": "preview", "aria-label": "当前颜色" }), h("button", { type: "button", class: "tui-color-picker__eyedropper", "data-slot": "eyedropper", "aria-label": "吸取颜色", disabled: props.disabled }, [iconNode])]), h("label", { class: "tui-color-picker__hex", "data-slot": "hex" }, [text("span", "Hex: #", "body-s"), h("input", { class: "tui-color-picker__hex-input", type: "text", value: currentHex.value, maxlength: 6, inputmode: "text", "aria-label": "Hex color", "data-color-picker-hex": true, disabled: props.disabled, onInput: (event) => updateHex(event.target.value) })])]),
      h("div", { class: "tui-color-picker__favorites", "data-slot": "favorites" }, [text("span", "collect", "body-s", { class: "tui-color-picker__favorites-label" }), h("div", { class: "tui-color-picker__favorites-grid" }, colorPickerFavorites.map((color, index) => index === 1 ? h("button", { key: "add", type: "button", class: "tui-color-picker__favorite tui-color-picker__favorite--add", "data-color-picker-add": true, "aria-label": "添加收藏色", disabled: props.disabled }, "+") : h("button", { key: color, type: "button", class: "tui-color-picker__favorite", "data-color-value": color, "aria-label": `收藏色 ${color}`, style: { "--tui-color-picker-swatch": index === 0 ? "var(--color-function-warning-100)" : "var(--color-neutral-dark-10)" }, disabled: props.disabled, onClick: () => updateHex(color) })))])
    ]);
  }
});
export const InputOtp = defineComponent({ props: { length: { type: Number, default: 6 } }, emits: ["complete"], setup(props, { emit }) { const values = ref(Array(props.length).fill("")); return () => h("fieldset", { class: "tui-component tui-input-otp", ...contract("input-otp", "Input OTP/Default") }, [text("legend", "验证码", "body-m"), h("div", { class: "tui-input-otp__cells" }, values.value.map((value, index) => h("input", { class: "tui-input-otp__cell", key: index, type: "text", inputmode: "numeric", maxlength: 1, value, "aria-label": `第 ${index + 1} 位验证码`, "data-typography-role": "body-l", onInput: (event) => { const next = [...values.value]; next[index] = event.target.value.slice(-1); values.value = next; if (next.every(Boolean)) emit("complete", next.join("")); } }))), text("small", "请输入 6 位验证码", "body-s")]); } });
export const Kbd = defineComponent({ setup: () => () => h("kbd", { class: "tui-component tui-kbd", ...contract("kbd", "Kbd/Default"), "data-typography-role": "body-m" }, "⌘ K") });

export const Chart = defineComponent({ setup: () => () => h("figure", { class: "tui-component tui-chart", ...contract("chart", "Chart/Default") }, [text("figcaption", "项目趋势", "title-s"), h("svg", { class: "tui-chart__svg", viewBox: "0 0 240 96", role: "img", "aria-label": "项目趋势图", "data-svg-role": "chart" }, [h("path", { d: "M8 78L52 58L96 64L140 32L184 42L232 14", fill: "none", stroke: "currentColor", "stroke-width": 1.5 }), h("path", { d: "M8 80H232", fill: "none", stroke: "currentColor", "stroke-width": 1, opacity: .24 })]), text("span", "本周完成度 84%", "body-s")]) });
export const Calendar = defineComponent({ props: { selectedDay: String, className: String }, emits: ["select"], setup(props, { emit }) { const internalSelected = ref("7"); const selectDay = (day) => { if (props.selectedDay === undefined) internalSelected.value = day; emit("select", day); }; return () => h("section", { class: ["tui-component", "tui-calendar", props.className], ...contract("calendar", "Calendar/Default") }, [h("header", null, [h("button", { class: "tui-icon-button tui-calendar__prev", type: "button", "aria-label": "上个月" }, [h(Icon, { name: "navigation/chevron-right", size: 20 })]), text("strong", "2026 年 08 月", "title-s"), h("button", { class: "tui-icon-button tui-calendar__next", type: "button", "aria-label": "下个月" }, [h(Icon, { name: "navigation/chevron-right", size: 20 })])]), h("div", { class: "tui-calendar__week", "data-typography-role": "body-l" }, calendarWeekdays.map((day) => text("span", day, "body-l", { key: `week-${day}` }))), h("div", { class: "tui-calendar__days", role: "grid" }, calendarDays.map((day, index) => h("button", { key: `${day}-${index}`, type: "button", role: "gridcell", class: day === (props.selectedDay ?? internalSelected.value) && index === 12 ? "is-selected" : "", "data-day": day, "data-typography-role": "body-l", onClick: () => selectDay(day) }, day)))]); } });

const Picker = defineComponent({ props: { id: String, logicalName: String, label: String, value: String, iconName: String }, setup(props, { slots }) { const open = ref(false); return () => h("div", { class: "tui-component tui-picker", ...contract(props.id, props.logicalName, "default", open.value ? "open" : "default") }, [text("label", props.label, "body-m"), h("button", { class: "tui-picker__trigger", type: "button", "aria-haspopup": "dialog", "aria-expanded": open.value, onClick: () => { open.value = !open.value; } }, [text("span", props.value, "body-l", { "data-slot": "value" }), h(Icon, { name: props.iconName, size: 20 })]), h("div", { class: "tui-picker__panel", role: "dialog", hidden: !open.value }, slots.default?.())]); } });
export const DatePicker = defineComponent({
  setup: () => {
    const value = ref("2026-08-07");
    return () => h(Picker, { id: "date-picker", logicalName: "Date Picker/Default", label: "日期", value: value.value, iconName: "field/calendar" }, {
      default: () => [
        h(Calendar, { className: "tui-calendar--embedded", selectedDay: value.value.split("-")[2] ?? "", onSelect: (day) => { value.value = `2026-08-${day.padStart(2, "0")}`; } }),
        h("footer", null, [
          h("button", { type: "button", "data-typography-role": "body-l", onClick: () => { value.value = ""; } }, "清除"),
          h("button", { type: "button", "data-typography-role": "body-l", onClick: () => { value.value = "2026-08-07"; } }, "今天")
        ])
      ]
    });
  }
});
export const TimePicker = defineComponent({
  setup: () => {
    const value = ref("09:30");
    return () => h(Picker, { id: "time-picker", logicalName: "Time Picker/Default", label: "时间", value: value.value, iconName: "field/clock" }, {
      default: () => [
        h("div", { class: "tui-picker__columns" }, [
          h("div", null, [text("span", "时", "body-s"), ...["08", "09", "10"].map((d) => h("button", { key: `hour-${d}`, type: "button", class: d === "09" ? "is-selected" : "", onClick: () => { value.value = `${d}:${value.value.split(":")[1] ?? "30"}`; } }, d))]),
          h("b", null, ":"),
          h("div", null, [text("span", "分", "body-s"), ...["25", "30", "35"].map((d) => h("button", { key: `minute-${d}`, type: "button", class: d === "30" ? "is-selected" : "", onClick: () => { value.value = `${value.value.split(":")[0] ?? "09"}:${d}`; } }, d))])
        ]),
        h("footer", null, [
          h("button", { type: "button", "data-typography-role": "body-l", onClick: () => { value.value = ""; } }, "清除"),
          h("button", { type: "button", "data-typography-role": "body-l" }, "确定")
        ])
      ]
    });
  }
});

export const Attachment = defineComponent({
  props: {
    type: { type: String, default: "PDF" }, name: { type: String, default: "项目说明.pdf" }, meta: { type: String, default: "2.4 MB · 已上传" }, disabled: Boolean
  },
  emits: ["action", "download", "preview"],
  setup(props, { emit, slots }) {
    const open = ref(false); const root = ref(); const trigger = ref(); const menu = ref();
    const menuId = `attachment-menu-${Math.random().toString(36).slice(2)}`;
    const close = (restoreFocus = false) => { open.value = false; if (restoreFocus) nextTick(() => trigger.value?.focus()); };
    const choose = (action) => { close(); emit("action", action); if (action === "download") emit("download"); if (action === "preview") emit("preview"); };
    const onPointerDown = (event) => { if (open.value && !root.value?.contains(event.target)) close(); };
    const onKeydown = (event) => {
      if (!open.value) return;
      if (event.key === "Escape") { event.preventDefault(); close(true); return; }
      if (!["ArrowDown", "ArrowUp"].includes(event.key) || !menu.value?.contains(event.target)) return;
      const items = [...menu.value.querySelectorAll('[role="menuitem"]')]; if (!items.length) return;
      event.preventDefault(); const index = Math.max(0, items.indexOf(document.activeElement)); items[(index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
    };
    onMounted(() => { document.addEventListener("pointerdown", onPointerDown); document.addEventListener("keydown", onKeydown); });
    onBeforeUnmount(() => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeydown); });
    watch(open, (value) => { if (value) nextTick(() => menu.value?.querySelector('[role="menuitem"]')?.focus()); });
    return () => {
      const defaultActions = h("span", { class: "tui-attachment__actions", "data-slot": "actions" }, [
        h("button", { ref: trigger, class: "tui-icon-button tui-attachment__menu-trigger", "data-slot": "menu-trigger", type: "button", "aria-label": "打开附件操作菜单", "aria-haspopup": "menu", "aria-expanded": open.value, "aria-controls": menuId, disabled: props.disabled, onClick: () => { open.value = !open.value; } }, [h(Icon, { name: "navigation/chevron-down", size: 20 })]),
        h("div", { ref: menu, id: menuId, class: "tui-button-dropdown__menu tui-attachment__menu", "data-slot": "menu", role: "menu", hidden: !open.value }, [h("button", { class: "tui-button-dropdown__item", type: "button", role: "menuitem", "data-action": "preview", "data-typography-role": "body-l", onClick: () => choose("preview") }, "预览"), h("button", { class: "tui-button-dropdown__item", type: "button", role: "menuitem", "data-action": "download", "data-typography-role": "body-l", onClick: () => choose("download") }, "下载")])
      ]);
      return h("article", { ref: root, class: "tui-component tui-attachment", ...contract("attachment", "Attachment/Default", "default", props.disabled ? "disabled" : open.value ? "open" : "default"), "aria-disabled": props.disabled || undefined }, [slots.leading?.() ?? text("span", props.type, "body-s", { class: "tui-attachment__type", "data-slot": "leading" }), slots.content?.() ?? h("div", { "data-slot": "content" }, [text("strong", props.name, "subtitle-s", { "data-slot": "title" }), text("small", props.meta, "body-s", { "data-slot": "description" })]), slots.actions?.() ?? defaultActions]);
    };
  }
});
