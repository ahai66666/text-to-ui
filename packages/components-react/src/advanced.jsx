import React from "react";
import { createPortal } from "react-dom";
import "./styles.css";
import { Icon, contract } from "./shared.jsx";

const cx = (...values) => values.filter(Boolean).join(" ");
const defaultMenubarItems = [{ label: "新建", icon: "action/add" }, { label: "打开", icon: "action/download", hasSubmenu: true, submenu: ["打开项目", "打开最近项目", "从设备打开"] }, { label: "导出", icon: "action/settings" }];
const menuItems = (items, onChoose, activeSubmenu, onSubmenuOpen) => items.map((item) => {
  const entry = typeof item === "string" ? { label: item } : item;
  const hasSubmenu = entry.hasSubmenu && Array.isArray(entry.submenu);
  return <div key={entry.label} className={cx("tui-advanced-menu__item-wrap", hasSubmenu && "has-submenu")} onMouseEnter={hasSubmenu ? () => onSubmenuOpen?.(entry.label) : undefined}><button type="button" role="menuitem" className={cx("tui-advanced-menu__item", hasSubmenu && "has-submenu")} aria-haspopup={hasSubmenu ? "menu" : undefined} aria-expanded={hasSubmenu ? activeSubmenu === entry.label : undefined} data-typography-role="body-l" onClick={(event) => onChoose?.(entry, event)}>{entry.icon ? <span className="tui-advanced-menu__item-leading" data-slot="leading"><Icon name={entry.icon} size={24} /></span> : null}<span data-slot="label">{entry.label}</span>{hasSubmenu ? <span className="tui-advanced-menu__item-trailing" data-slot="trailing"><Icon name="navigation/chevron-right" size={24} /></span> : null}</button>{hasSubmenu && activeSubmenu === entry.label ? <div className="tui-advanced-menu__submenu" role="menu" aria-label={entry.label}>{menuItems(entry.submenu, onChoose, null, onSubmenuOpen)}</div> : null}</div>;
});
const calendarWeekdays = ["日", "一", "二", "三", "四", "五", "六"];
const calendarDays = ["26", "27", "28", "29", "30", "31", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "1", "2", "3", "4", "5"];

function useControllableOpen(controlled, onOpenChange) {
  const [internal, setInternal] = React.useState(false);
  const open = controlled === undefined ? internal : controlled;
  const setOpen = React.useCallback((next) => {
    if (controlled === undefined) setInternal(next);
    onOpenChange?.(next);
  }, [controlled, onOpenChange]);
  return [open, setOpen];
}

function DialogBase({ id, open: controlledOpen, title, subtitle, description, intent = "default", actionLayout = "double", confirmLabel = "确认", cancelLabel = "取消", thirdActionLabel = "保存草稿", size = "m", surface = "white", mode = "modal", triggerLabel = "打开弹窗", showClose = false, titlebar, actions: actionsSlot, children, onConfirm, onCancel, onThirdAction, onClose, onOpenChange }) {
  const [open, setOpen] = useControllableOpen(controlledOpen, onOpenChange);
  const triggerRef = React.useRef(null);
  const dialogRef = React.useRef(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const close = React.useCallback((reason) => {
    setOpen(false);
    if (reason === "confirm") onConfirm?.();
    if (reason === "cancel") onCancel?.();
    if (reason === "third") onThirdAction?.();
    if (reason === "close") onClose?.();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [onCancel, onClose, onConfirm, onThirdAction, setOpen]);
  React.useEffect(() => {
    if (!open) return undefined;
    const node = dialogRef.current;
    requestAnimationFrame(() => node?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); close("cancel"); return; }
      if (mode !== "modal" || event.key !== "Tab" || !node) return;
      const focusable = [...node.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) { event.preventDefault(); node.focus(); return; }
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, mode, open]);

  const defaultActions = actionLayout === "single"
    ? <button className="tui-button" type="button" data-variant={intent === "danger" ? "danger" : "primary"} data-typography-role="body-l" onClick={() => close("confirm")}>{confirmLabel}</button>
    : actionLayout === "triple"
      ? <><button className="tui-button" type="button" data-variant={intent === "danger" ? "danger" : "primary"} data-typography-role="body-l" onClick={() => close("confirm")}>{confirmLabel}</button><button className="tui-button" type="button" data-variant="secondary" data-typography-role="body-l" onClick={() => close("third")}>{thirdActionLabel}</button><button className="tui-button" type="button" data-variant="secondary" data-typography-role="body-l" onClick={() => close("cancel")}>{cancelLabel}</button></>
      : <><button className="tui-button" type="button" data-variant="secondary" data-typography-role="body-l" onClick={() => close("cancel")}>{cancelLabel}</button><button className="tui-button" type="button" data-variant={intent === "danger" ? "danger" : "primary"} data-typography-role="body-l" onClick={() => close("confirm")}>{confirmLabel}</button></>;
  const titlebarContent = titlebar ?? <><h4 id={titleId} data-slot="title" data-typography-role="title-s">{title}</h4>{subtitle ? <p data-slot="subtitle" data-typography-role="body-m">{subtitle}</p> : null}</>;
  const layer = open && typeof document !== "undefined" ? createPortal(<div className="tui-overlay-layer" data-size={size} data-surface={surface} data-mode={mode}>
    <div className="tui-overlay-backdrop" aria-hidden="true" />
    <section ref={dialogRef} className={cx("tui-component tui-dialog", id === "alert-dialog" && "tui-dialog--alert", id === "semi-modal" && "tui-dialog--semi")} {...contract(id, `${id === "alert-dialog" ? "Alert Dialog" : id === "semi-modal" ? "Semi-modal" : "Dialog"}/Default`, id === "dialog" ? actionLayout : `${size}-${surface}-${mode}`, "open")} role={id === "alert-dialog" ? "alertdialog" : "dialog"} aria-modal={mode === "modal"} aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1}>
      <header className="tui-dialog__header" data-slot="titlebar">{titlebarContent}{showClose && <button className="tui-icon-button tui-dialog__close" type="button" aria-label="关闭" onClick={() => close("close")}><Icon name="action/close" size={20} /></button>}</header>
      <div className="tui-dialog__content"><p id={descriptionId} data-slot="description" data-typography-role="body-m">{description}</p>{children}</div>
      <footer className="tui-dialog__actions" data-slot="actions" data-action-layout={actionLayout}>{actionsSlot ?? defaultActions}</footer>
    </section>
  </div>, document.body) : null;
  return <div className="tui-overlay-example"><button ref={triggerRef} className="tui-button" type="button" data-variant="secondary" data-typography-role="body-l" onClick={() => setOpen(true)}>{triggerLabel}</button>{layer}</div>;
}

export function Dialog({ actionLayout = "double", ...props }) { const isSingle = actionLayout === "single"; const isTriple = actionLayout === "triple"; return <DialogBase id="dialog" title={isSingle ? "更新完成" : isTriple ? "保存更改？" : "确认更新？"} description={isSingle ? "应用已经更新到最新版本。" : isTriple ? "你可以先保存草稿，稍后再继续编辑。" : "更新期间应用需要重新启动。"} actionLayout={actionLayout} confirmLabel={isSingle ? "知道了" : "确认"} triggerLabel={isSingle ? "打开单按钮对话弹窗" : isTriple ? "打开三按钮对话弹窗" : "打开双按钮对话弹窗"} {...props} />; }
export function AlertDialog(props) { return <DialogBase id="alert-dialog" title="删除项目？" description="删除后无法恢复，请确认操作。" intent="danger" actionLayout="double" confirmLabel="删除" triggerLabel="打开删除确认弹窗" {...props} />; }
export function SemiModal({ size = "m", surface = "white", mode = "non-modal", ...props }) { return <DialogBase id="semi-modal" title="编辑项目设置" description="非模态为默认状态，可以继续操作背景内容。" size={size} surface={surface} mode={mode} showClose confirmLabel="保存" triggerLabel="打开半模态弹窗" {...props}><div className="tui-dialog__form"><label className="tui-field"><span data-typography-role="body-m">项目名称</span><span className="tui-input" data-surface={surface}><input defaultValue="客户端设计系统" data-typography-role="body-l" /></span></label><label className="tui-field"><span data-typography-role="body-m">负责人</span><span className="tui-search" data-surface={surface}><Icon name="field/search" size={20} /><input type="search" defaultValue="赵博海" data-typography-role="body-l" /></span></label></div></DialogBase>; }

function Menu({ id, logicalName, label, value, items = [], onSelect, className = "", slotName, ariaLabel, disabled = false, hideLabel = false, compact = false }) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(value);
  const [hasUserSelection, setHasUserSelection] = React.useState(false);
  const [activeSubmenu, setActiveSubmenu] = React.useState(null);
  React.useEffect(() => { setSelected(value); }, [value]);
  const choose = (item, event) => {
    if (item?.hasSubmenu && Array.isArray(item.submenu)) { setActiveSubmenu(item.label); return; }
    const next = item?.label ?? item;
    setSelected(next); setHasUserSelection(true); setActiveSubmenu(null); setOpen(false); onSelect?.(next, event, item);
  };
  const openSubmenu = (label) => { if (id === "menubar") setActiveSubmenu(label); };
  return <div className={cx("tui-component", "tui-advanced-menu", className, compact && "is-compact", hasUserSelection && "is-selected")} data-slot={slotName} {...contract(id, logicalName, "default", open ? "open" : "default")}>
    <span className="tui-advanced-menu__label" data-typography-role="body-m" hidden={hideLabel}>{label}</span>
    <button className="tui-advanced-menu__trigger" type="button" aria-label={ariaLabel} aria-haspopup="menu" aria-expanded={open} disabled={disabled} onClick={() => setOpen((v) => !v)}><span data-slot="value" data-typography-role="body-l">{selected}</span><Icon name="navigation/chevron-down" size={16} /></button>
    <div className="tui-advanced-menu__panel" role="menu" hidden={!open} onMouseLeave={() => id === "menubar" && setActiveSubmenu(null)}>{menuItems(items, choose, activeSubmenu, openSubmenu)}</div>
  </div>;
}
export function ContextMenu() { return <Menu id="context-menu" logicalName="Context Menu/Default" label="更多操作" value="右键或点击打开" items={[{ label: "复制", icon: "action/copy" }, { label: "重命名", icon: "action/rename" }, { label: "删除", icon: "action/delete" }]} />; }
export function DropdownMenu(props) { return <Menu id="dropdown-menu" logicalName="Dropdown Menu/Default" label="操作菜单" value="新建、导入、导出" items={["新建", "导入", "导出"]} {...props} />; }
export function Menubar({ items = defaultMenubarItems }) { return <Menu id="menubar" logicalName="Menubar/Default" label="主菜单" value="文件" items={items} />; }

export function Popover() {
  const [open, setOpen] = React.useState(false);
  return <div className="tui-component tui-advanced-popover" {...contract("popover", "Popover/Default")}><button className="tui-button" type="button" data-variant="ghost" data-typography-role="body-l" aria-expanded={open} onClick={() => setOpen((v) => !v)}>筛选条件</button><div className="tui-advanced-popover__panel" role="dialog" hidden={!open}><strong data-typography-role="title-s">筛选条件</strong><span data-typography-role="body-m">状态、负责人、更新时间</span></div></div>;
}
export function HoverCard() { return <div className="tui-component tui-advanced-hover-card" {...contract("hover-card", "Hover Card/Default")}><button className="tui-button" type="button" data-variant="ghost" data-typography-role="body-l">组件说明</button><div className="tui-advanced-hover-card__panel" role="tooltip"><strong data-typography-role="title-s">组件说明</strong><span data-typography-role="body-m">查看组件的详细使用规则</span></div></div>; }

export function Slider({ value: controlled, defaultValue = 84, onChange, variant = "style-1", label = "透明度", className = "", style, ...props }) {
  const [value, setValue] = React.useState(defaultValue);
  const current = controlled === undefined ? value : controlled;
  const sliderStyle = variant === "style-2" ? "style-2" : "style-1";
  const numericValue = Number(current);
  const normalizedValue = Number.isFinite(numericValue) ? Math.min(100, Math.max(0, numericValue)) : 84;
  return <label className={`tui-component tui-slider tui-slider--${sliderStyle}${className ? ` ${className}` : ""}`} data-slider-style={sliderStyle} {...contract("slider", "Slider/Default", sliderStyle)}><span data-slot="label" data-typography-role="body-m">{label}</span><span className="tui-slider__control" style={{ "--tui-slider-value": `${normalizedValue}%` }}><span className="tui-slider__track" aria-hidden="true"><span className="tui-slider__fill" /><span className="tui-slider__thumb" /></span><input {...props} type="range" min="0" max="100" value={normalizedValue} aria-label={label} style={style} onChange={(event) => { if (controlled === undefined) setValue(event.target.value); onChange?.(event.target.value); }} /></span><output data-typography-role="body-m">{normalizedValue}</output></label>;
}

const COLOR_PICKER_DEFAULT = "FA2A2F";
const colorPickerFavorites = ["E56224", "0000000C", "00000014", "0000001F", "00000029", "00000033", "0000003D", "00000047", "00000052", "0000005C", "00000066", "00000070", "0000007A", "00000085", "0000008F", "00000099", "000000A3"];
const colorPickerEyedropperPath = "M12.7092 5.73192C12.187 5.20968 11.3402 5.20968 10.818 5.73192C10.2958 6.25416 10.2958 7.10088 10.818 7.62312L12.1787 8.98384L3.66864 17.4946C3.0485 18.1147 2.91928 19.0399 3.28102 19.7871L3.19584 19.8586C2.93472 20.1197 2.93472 20.543 3.19584 20.8042C3.45696 21.0653 3.88032 21.0653 4.14144 20.8042L4.21286 20.719C4.96012 21.0807 5.8853 20.9515 6.50544 20.3314L15.0155 11.8206L16.4916 13.2967C17.0138 13.819 17.8606 13.819 18.3828 13.2967C18.905 12.7745 18.905 11.9278 18.3828 11.4055L17.3798 10.4026L20.2166 7.56576C21.2611 6.52128 21.2611 4.82784 20.2166 3.78336C19.1722 2.73888 17.4787 2.73888 16.4342 3.78336L13.5974 6.62016L12.7092 5.73192ZM4.61398 18.4405L13.1241 9.92978L14.0697 10.8754L5.55958 19.3861C5.29846 19.6472 4.8751 19.6472 4.61398 19.3861C4.35286 19.125 4.35286 19.3861 4.61398 18.4405Z";
const normalizeColorPickerHex = (value) => {
  const next = String(value ?? COLOR_PICKER_DEFAULT).replace(/^#/, "").toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 6);
  return next.padEnd(6, "0");
};

export function ColorPicker({ value: controlledValue, defaultValue = COLOR_PICKER_DEFAULT, disabled = false, onChange, ...props }) {
  const [internalHex, setInternalHex] = React.useState(() => normalizeColorPickerHex(defaultValue));
  const [activeTab, setActiveTab] = React.useState("color-card");
  const [axes, setAxes] = React.useState({ hue: 360, saturation: 360, brightness: 360, alpha: 100 });
  const currentHex = normalizeColorPickerHex(controlledValue === undefined ? internalHex : controlledValue);
  const updateHex = (next) => {
    const normalized = normalizeColorPickerHex(next);
    if (controlledValue === undefined) setInternalHex(normalized);
    onChange?.(`#${normalized}`);
  };
  const updateAxis = (axis, next) => {
    const value = Number(next);
    setAxes((current) => ({ ...current, [axis]: value }));
    onChange?.({ axis, value });
  };
  const axisRows = [["hue", "Hue", 360], ["saturation", "Saturation", 360], ["brightness", "Brightness", 360], ["alpha", "Alpha", 100]];
  return <section className="tui-component tui-color-picker" {...contract("color-picker", "ColorPicker/Tablet", "default", disabled ? "disabled" : "default")} data-color-value={currentHex} aria-label="颜色编辑器" style={{ "--tui-color-picker-color": `#${currentHex}` }} {...props}>
    <h3 className="tui-color-picker__title" data-slot="title" data-typography-role="title-s">Color Editor</h3>
    <div className="tui-color-picker__tabs" role="tablist" aria-label="颜色模式">{[["color-card", "Color card"], ["slider", "Slider"], ["color-disc", "Color disc"]].map(([id, label]) => <button key={id} type="button" className={cx("tui-color-picker__tab", activeTab === id && "is-selected")} role="tab" aria-selected={activeTab === id} data-color-picker-tab={id} disabled={disabled} onClick={() => setActiveTab(id)}>{label}</button>)}</div>
    <button type="button" className="tui-color-picker__mode" data-color-picker-mode aria-label="颜色模式：HSB" disabled={disabled}><span data-slot="mode" data-typography-role="body-l">HSB</span><span className="tui-color-picker__mode-icon" aria-hidden="true" /></button>
    <div className="tui-color-picker__controls">{axisRows.map(([axis, label, max]) => <label className="tui-color-picker__field" data-axis={axis} key={axis}><span className="tui-color-picker__field-label" data-typography-role="body-m">{label}</span><span className="tui-color-picker__track-row"><input className="tui-color-picker__track" type="range" min="0" max={max} value={axes[axis]} aria-label={label} data-color-picker-axis={axis} disabled={disabled} onChange={(event) => updateAxis(axis, event.target.value)} /><output className="tui-color-picker__value" data-color-picker-value data-typography-role="body-s">{axes[axis]}</output></span></label>)}</div>
    <div className="tui-color-picker__divider" role="separator" />
    <div className="tui-color-picker__summary"><span className="tui-color-picker__summary-main"><span className="tui-color-picker__swatch" data-slot="preview" aria-label="当前颜色" /><button type="button" className="tui-color-picker__eyedropper" data-slot="eyedropper" aria-label="吸取颜色" disabled={disabled}><svg className="tui-color-picker__eyedropper-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" data-icon-manual-fallback="color-picker/eyedropper" data-source="pixso"><path d={colorPickerEyedropperPath} fill="currentColor" /></svg></button></span><label className="tui-color-picker__hex" data-slot="hex"><span data-typography-role="body-s">Hex: #</span><input className="tui-color-picker__hex-input" type="text" value={currentHex} maxLength={6} inputMode="text" aria-label="Hex color" data-color-picker-hex disabled={disabled} onChange={(event) => updateHex(event.target.value)} /></label></div>
    <div className="tui-color-picker__favorites" data-slot="favorites"><span className="tui-color-picker__favorites-label" data-typography-role="body-s">collect</span><div className="tui-color-picker__favorites-grid">{colorPickerFavorites.map((color, index) => index === 1 ? <button key="add" type="button" className="tui-color-picker__favorite tui-color-picker__favorite--add" data-color-picker-add aria-label="添加收藏色" disabled={disabled}>+</button> : <button key={color} type="button" className="tui-color-picker__favorite" data-color-value={color} aria-label={`收藏色 ${color}`} style={{ "--tui-color-picker-swatch": index === 0 ? "var(--color-function-warning-100)" : "var(--color-neutral-dark-10)" }} disabled={disabled} onClick={() => updateHex(color)} />)}</div></div>
  </section>;
}
export function InputOtp({ length = 6, onComplete, ...props }) {
  const refs = React.useRef([]);
  const [values, setValues] = React.useState(() => Array(length).fill(""));
  const update = (index, value) => { const next = [...values]; next[index] = value.slice(-1); setValues(next); if (value && index < length - 1) refs.current[index + 1]?.focus(); if (next.every(Boolean)) onComplete?.(next.join("")); };
  return <fieldset className="tui-component tui-input-otp" {...contract("input-otp", "Input OTP/Default")}><legend data-typography-role="body-m">验证码</legend><div className="tui-input-otp__cells">{values.map((value, index) => <input {...props} key={index} ref={(node) => { refs.current[index] = node; }} className="tui-input-otp__cell" type="text" inputMode="numeric" maxLength={1} aria-label={`第 ${index + 1} 位验证码`} value={value} onChange={(event) => update(index, event.target.value)} data-typography-role="body-l" />)}</div><small data-typography-role="body-s">请输入 6 位验证码</small></fieldset>;
}
export function Kbd() { return <kbd className="tui-component tui-kbd" {...contract("kbd", "Kbd/Default")} data-typography-role="body-m">⌘ K</kbd>; }

export function Chart() { return <figure className="tui-component tui-chart" {...contract("chart", "Chart/Default")}><figcaption data-typography-role="title-s">项目趋势</figcaption><svg className="tui-chart__svg" viewBox="0 0 240 96" role="img" aria-label="项目趋势图" data-svg-role="chart"><path d="M8 78L52 58L96 64L140 32L184 42L232 14" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 80H232" fill="none" stroke="currentColor" strokeWidth="1" opacity=".24" /></svg><span data-typography-role="body-s">本周完成度 84%</span></figure>; }
export function Calendar({ selectedDay, onSelect, className }) {
  const [internalSelected, setInternalSelected] = React.useState("7");
  const selected = selectedDay ?? internalSelected;
  const selectDay = (day) => { if (selectedDay === undefined) setInternalSelected(day); onSelect?.(day); };
  return <section className={cx("tui-component tui-calendar", className)} {...contract("calendar", "Calendar/Default")}><header><button className="tui-icon-button tui-calendar__prev" type="button" aria-label="上个月"><Icon name="navigation/chevron-right" size={20} /></button><strong data-typography-role="title-s">2026 年 08 月</strong><button className="tui-icon-button tui-calendar__next" type="button" aria-label="下个月"><Icon name="navigation/chevron-right" size={20} /></button></header><div className="tui-calendar__week" data-typography-role="body-l">{calendarWeekdays.map((day) => <span key={day} data-typography-role="body-l">{day}</span>)}</div><div className="tui-calendar__days" role="grid">{calendarDays.map((day, index) => <button type="button" role="gridcell" key={`${day}-${index}`} className={day === selected && index === 12 ? "is-selected" : ""} data-day={day} data-typography-role="body-l" onClick={() => selectDay(day)}>{day}</button>)}</div></section>;
}

function Picker({ id, logicalName, label, value, iconName, children }) {
  const [open, setOpen] = React.useState(false);
  return <div className="tui-component tui-picker" {...contract(id, logicalName, "default", open ? "open" : "default")}><label data-typography-role="body-m">{label}</label><button className="tui-picker__trigger" type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)}><span data-slot="value" data-typography-role="body-l">{value}</span><Icon name={iconName} size={20} /></button><div className="tui-picker__panel" role="dialog" hidden={!open}>{children}</div></div>;
}
export function DatePicker() { const [value, setValue] = React.useState("2026-08-07"); const selectedDay = value.split("-")[2] ?? ""; return <Picker id="date-picker" logicalName="Date Picker/Default" label="日期" value={value} iconName="field/calendar"><Calendar className="tui-calendar--embedded" selectedDay={selectedDay} onSelect={(day) => setValue(`2026-08-${day.padStart(2, "0")}`)} /><footer><button type="button" data-typography-role="body-l" onClick={() => setValue("")}>清除</button><button type="button" data-typography-role="body-l" onClick={() => setValue("2026-08-07")}>今天</button></footer></Picker>; }
export function TimePicker() { const [value, setValue] = React.useState("09:30"); return <Picker id="time-picker" logicalName="Time Picker/Default" label="时间" value={value} iconName="field/clock"><div className="tui-picker__columns"><div><span data-typography-role="body-s">时</span>{["08", "09", "10"].map((d) => <button key={d} type="button" className={d === "09" ? "is-selected" : ""} onClick={() => setValue(`${d}:${value.split(":")[1] ?? "30"}`)}>{d}</button>)}</div><b>:</b><div><span data-typography-role="body-s">分</span>{["25", "30", "35"].map((d) => <button key={d} type="button" className={d === "30" ? "is-selected" : ""} onClick={() => setValue(`${value.split(":")[0] ?? "09"}:${d}`)}>{d}</button>)}</div></div><footer><button type="button" data-typography-role="body-l" onClick={() => setValue("")}>清除</button><button type="button" data-typography-role="body-l">确定</button></footer></Picker>; }

export function Attachment({ type = "PDF", name = "项目说明.pdf", meta = "2.4 MB · 已上传", leading, content, actions, disabled = false, onAction, onDownload, onPreview }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const menuId = React.useId();
  const close = React.useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);
  React.useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => { if (!rootRef.current?.contains(event.target)) close(); };
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); close(true); return; }
      if (!["ArrowDown", "ArrowUp"].includes(event.key) || !menuRef.current?.contains(event.target)) return;
      const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
      if (!items.length) return;
      event.preventDefault();
      const index = Math.max(0, items.indexOf(document.activeElement));
      items[(index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => menuRef.current?.querySelector('[role="menuitem"]')?.focus());
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [close, open]);
  const choose = (action) => {
    close();
    onAction?.(action);
    if (action === "download") onDownload?.();
    if (action === "preview") onPreview?.();
  };
  const defaultLeading = <span className="tui-attachment__type" data-slot="leading" data-typography-role="body-s">{type}</span>;
  const defaultContent = <div data-slot="content"><strong data-slot="title" data-typography-role="subtitle-s">{name}</strong><small data-slot="description" data-typography-role="body-s">{meta}</small></div>;
  const defaultActions = <span className="tui-attachment__actions" data-slot="actions"><button ref={triggerRef} className="tui-icon-button tui-attachment__menu-trigger" data-slot="menu-trigger" type="button" aria-label="打开附件操作菜单" aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} disabled={disabled} onClick={() => setOpen((value) => !value)}><Icon name="navigation/chevron-down" size={20} /></button><div ref={menuRef} id={menuId} className="tui-button-dropdown__menu tui-attachment__menu" data-slot="menu" role="menu" hidden={!open}><button className="tui-button-dropdown__item" type="button" role="menuitem" data-action="preview" data-typography-role="body-l" onClick={() => choose("preview")}>预览</button><button className="tui-button-dropdown__item" type="button" role="menuitem" data-action="download" data-typography-role="body-l" onClick={() => choose("download")}>下载</button></div></span>;
  return <article ref={rootRef} className="tui-component tui-attachment" {...contract("attachment", "Attachment/Default", "default", disabled ? "disabled" : open ? "open" : "default")} aria-disabled={disabled || undefined}>{leading ?? defaultLeading}{content ?? defaultContent}{actions ?? defaultActions}</article>;
}
