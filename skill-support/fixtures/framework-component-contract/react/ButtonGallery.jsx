import { useState } from "react";
import iconSprite from "../shared/button-icons.svg";
import "../shared/button-gallery.css";

const variants = [
  ["Primary", "btn-primary", "确认操作"],
  ["Secondary", "btn-secondary", "次要操作"],
  ["Ghost", "btn-ghost", "文本操作"],
  ["Danger", "btn-danger", "删除项目"]
];

function Icon({ name, className = "" }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" data-hmos-icon={name}><use href={`${iconSprite}#hmos-${name}`} /></svg>;
}

function Button({ variant, small = false, disabled = false, children, icon }) {
  const classes = ["btn", variant, small && "btn-sm", icon && "btn-icon-text"].filter(Boolean).join(" ");
  return <button className={classes} disabled={disabled}>{icon && <Icon name={icon} />}{children}</button>;
}

function SizeBlock({ title, small = false }) {
  return <div className="button-size-block" data-logical-group={small ? "Button/Size/Small" : "Button/Size/Standard"}>
    <div className="button-size-title">{title}</div>
    {[false, true].map((disabled) => <div className="button-state-row" key={String(disabled)}>
      {variants.map(([name, variant, label]) => <div className="state-group" key={`${name}-${disabled}`}>
        <span className="state-name">{name}{disabled ? " · Disabled" : ""}</span>
        <Button variant={variant} small={small} disabled={disabled}>{label}</Button>
      </div>)}
    </div>)}
  </div>;
}

function SelectionDropdown() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("列表视图");
  return <div className="button-size-block" data-logical-group="Button/Selection Dropdown/Default">
    <div className="button-size-title">Selection Dropdown · 选择型下拉按钮 · Text + Chevron · Secondary · 40px</div>
    <div className="selection-dropdown-row">
      <div className="state-group dropdown" data-dropdown data-mode="select">
        <span className="state-name">List selection</span>
        <button className="btn btn-secondary selection-dropdown-trigger dropdown-trigger" type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}><span>{value}</span><Icon name="disclosure-down" className="dropdown-chevron" /></button>
        <div className="dropdown-menu" role="menu" hidden={!open}>{["列表视图", "网格视图", "紧凑视图"].map((item) => <button className="dropdown-menu-item" type="button" role="menuitem" key={item} onClick={() => { setValue(item); setOpen(false); }}>{item}</button>)}</div>
      </div>
      <div className="state-group"><span className="state-name">Disabled</span><button className="btn btn-secondary selection-dropdown-trigger" type="button" disabled><span>列表视图</span><Icon name="disclosure-down" className="dropdown-chevron" /></button></div>
    </div>
  </div>;
}

function SplitDropdown() {
  const [open, setOpen] = useState("");
  const split = (kind, label, icon) => <div className="state-group dropdown" data-dropdown data-mode="action">
    <span className="state-name">{label ? "Icon + Text" : "Icon"} · Independent actions</span>
    <div className={`split-control${label ? "" : " split-control-icon"}`}>
      <button className={`split-main${label ? "" : " split-main-icon"}`} type="button" aria-label={label || "刷新"}><Icon name={icon} className="dropdown-leading-icon" />{label && <span>{label}</span>}</button>
      <button className="split-trigger dropdown-trigger" type="button" aria-label="展开其他操作" aria-haspopup="menu" aria-expanded={open === kind} onClick={() => setOpen(open === kind ? "" : kind)}><Icon name="disclosure-down" className="dropdown-chevron" /></button>
    </div>
    <div className="dropdown-menu" role="menu" hidden={open !== kind}>{(kind === "export" ? ["导出为 PDF", "复制分享链接", "发送到设备"] : ["重新加载", "同步数据", "清理缓存并刷新"]).map((item) => <button className="dropdown-menu-item" type="button" role="menuitem" key={item} onClick={() => setOpen("")}>{item}</button>)}</div>
  </div>;
  return <div className="button-size-block" data-logical-group="Button/Split Dropdown/Default">
    <div className="button-size-title">Split Dropdown Button · 分裂式下拉按钮 · Ghost · 40px</div>
    <div className="split-dropdown-row">{split("export", "导出文件", "download")}{split("refresh", "", "refresh")}</div>
    <div className="split-dropdown-row">
      <div className="state-group"><span className="state-name">Icon + Text · Disabled</span><div className="split-control is-disabled"><button className="split-main" disabled><Icon name="download" className="dropdown-leading-icon" /><span>导出文件</span></button><button className="split-trigger" disabled><Icon name="disclosure-down" className="dropdown-chevron" /></button></div></div>
      <div className="state-group"><span className="state-name">Icon · Disabled</span><div className="split-control split-control-icon is-disabled"><button className="split-main split-main-icon" disabled><Icon name="refresh" className="dropdown-leading-icon" /></button><button className="split-trigger" disabled><Icon name="disclosure-down" className="dropdown-chevron" /></button></div></div>
    </div>
  </div>;
}

export function ButtonGallery() {
  return <main className="framework-button-gallery" data-framework="react" data-component="Button/Module/Complete">
    <SizeBlock title="Standard · 40px" />
    <SizeBlock title="Small · 28px" small />
    <div className="button-size-block" data-logical-group="Button/Icon Text/Default">
      <div className="button-size-title">Icon + Text · 40px · Icon 20px</div>
      {[false, true].map((disabled) => <div className="icon-text-row" key={String(disabled)}>
        {[["Primary", "btn-primary", "add", "新建项目"], ["Secondary", "btn-secondary", "download", "导出文件"], ["Ghost", "btn-icon-text-ghost", "settings", "更多设置"]].map(([name, variant, icon, label]) => <div className="state-group" key={name}><span className="state-name">{name}{disabled ? " · Disabled" : ""}</span><Button variant={variant} icon={icon} disabled={disabled}>{label}</Button></div>)}
      </div>)}
    </div>
    <div className="button-size-block" data-logical-group="Button/Icon/Default">
      <div className="button-size-title">Icon Button · 图标按钮 · Default = Ghost · 40×40px · Icon 20px</div>
      <div className="icon-button-row">{[["Ghost · Default", "icon-btn", "more", false], ["Secondary · Explicit", "icon-btn icon-btn-secondary", "close", false], ["Ghost · Disabled", "icon-btn", "more", true], ["Secondary · Disabled", "icon-btn icon-btn-secondary", "close", true]].map(([name, cls, icon, disabled]) => <div className="state-group" key={name}><span className="state-name">{name}</span><button className={cls} disabled={disabled} aria-label={name}><Icon name={icon} /></button></div>)}</div>
    </div>
    <SelectionDropdown />
    <SplitDropdown />
    <span className="gallery-status" aria-live="polite">React Button 模块已加载</span>
  </main>;
}
