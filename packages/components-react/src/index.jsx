import React from "react";
import "./styles.css";
import { Icon, contract } from "./shared.jsx";
import { DropdownMenu } from "./advanced.jsx";
import { Chips } from "./Chips.jsx";
import { resolveTitlebarSegment } from "@text-to-ui/component-contracts/titlebar-segments";
export { createTitlebarSegments } from "@text-to-ui/component-contracts/titlebar-segments";
export { Chips };

const defaultTitlebarLogoSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='4' fill='%230A59F7'/%3E%3Ctext x='12' y='17' text-anchor='middle' font-family='Arial,sans-serif' font-size='14' font-weight='700' fill='white'%3ET%3C/text%3E%3C/svg%3E";
const searchSupportedStates = new Set(["default", "focus", "typing", "filled", "hover-left", "hover-right", "pressed-left", "pressed-right", "disabled"]);

const buttonLogicalName = ({ variant, mode, iconOnly = false }) => {
  if (mode === "icon-text") return "Button/Icon Text/Default";
  if (mode === "icon") return "Button/Icon/Default";
  if (mode === "split-dropdown") return `Split Dropdown Button/${iconOnly ? "Icon Only" : "Icon Text"}/Default`;
  return `Button/${variant[0].toUpperCase()}${variant.slice(1)}/Default`;
};

export function Button({ label, children, variant = "primary", size = "standard", mode = "text", state = "default", disabled = false, icon, iconSize = 20, iconOnly = false, logicalName: logicalNameOverride, onClick, menuOpen = false, className = "", ...props }) {
  const resolvedState = disabled ? "disabled" : state;
  const logicalName = logicalNameOverride ?? buttonLogicalName({ variant, mode, iconOnly });
  const isIconOnly = mode === "icon" || iconOnly;
  const modeClass = isIconOnly ? " tui-button--icon" : "";
  const labelContent = children ?? label;
  return <button type="button" className={`tui-component tui-button${modeClass}${className ? ` ${className}` : ""}`} aria-label={isIconOnly ? label : undefined} {...props} {...contract("button", logicalName, variant, resolvedState, { "data-mode": mode, "data-size": size })} disabled={disabled} onClick={onClick}>
    {icon && <span data-slot="icon"><Icon name={icon} size={iconSize} /></span>}
    {!isIconOnly && <span data-slot="label" data-typography-role={size === "small" ? "body-m" : "body-l"}>{labelContent}</span>}
  </button>;
}

function TagEntryInput({ id, value, defaultValue, placeholder = "输入文本后按 Enter 选择", label = "成员", options = [], tags, defaultTags = [], disabled = false, error = false, state, surface = "white", onChange, onTagsChange, onFocus, onBlur, onKeyDown, ...inputProps }) {
  const generatedId = React.useId();
  const inputId = id ?? `${generatedId}-input`;
  const labelId = `${generatedId}-label`;
  const menuId = `${generatedId}-suggestions`;
  const [internalQuery, setInternalQuery] = React.useState(defaultValue ?? "");
  const query = value === undefined ? internalQuery : String(value ?? "");
  const [internalTags, setInternalTags] = React.useState(() => Array.isArray(defaultTags) ? defaultTags.map(String) : []);
  const selectedTags = Array.isArray(tags) ? tags.map(String) : internalTags;
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef(null);
  const normalizedOptions = Array.isArray(options) ? options.filter((option) => option !== null && option !== undefined && String(option).trim()).map(String) : [];
  const selectedKeys = new Set(selectedTags.map((tag) => tag.toLocaleLowerCase()));
  const filteredOptions = normalizedOptions.filter((option) => !selectedKeys.has(option.toLocaleLowerCase()) && (!query.trim() || option.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())));
  const resolvedState = disabled ? "disabled" : state ?? (error ? "error" : focused ? "focus" : "default");
  const updateTags = (nextTags) => {
    if (tags === undefined) setInternalTags(nextTags);
    onTagsChange?.(nextTags);
  };
  const updateQuery = (nextQuery, event) => {
    if (value === undefined) setInternalQuery(nextQuery);
    onChange?.(event);
    setActiveIndex(-1);
  };
  const selectOption = (option) => {
    if (selectedKeys.has(option.toLocaleLowerCase())) return;
    updateTags([...selectedTags, option]);
    if (value === undefined) setInternalQuery("");
    setActiveIndex(-1);
    setOpen(false);
    inputRef.current?.focus();
  };
  const onInputKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!open) setOpen(true);
      else if (activeIndex >= 0 && filteredOptions[activeIndex]) selectOption(filteredOptions[activeIndex]);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(event.key === "ArrowDown" ? 0 : filteredOptions.length - 1);
      } else if (filteredOptions.length > 0) {
        setActiveIndex((current) => event.key === "ArrowDown" ? (current + 1) % filteredOptions.length : current < 0 ? filteredOptions.length - 1 : (current - 1 + filteredOptions.length) % filteredOptions.length);
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
    onKeyDown?.(event);
  };
  return <div className="tui-component tui-input tui-input--tag-entry" {...contract("input", "Input/Tag Entry/Default", "tag-entry", resolvedState, { "data-surface": surface })} role="group" aria-labelledby={labelId} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setFocused(false); setOpen(false); setActiveIndex(-1); } }}>
    <label className="tui-input-tag-entry__label" id={labelId} htmlFor={inputId} data-slot="label" data-typography-role="body-l">{label}</label>
    <div className="tui-input-tag-entry__editor">
      <div className="tui-input-tag-entry__tags" data-slot="tags" role="list" aria-label={`${label}已选`}>
        {selectedTags.map((tag, index) => <Chips key={`${tag}-${index}`} label={tag} icon="" closable disabled={disabled} onClose={() => { updateTags(selectedTags.filter((_, tagIndex) => tagIndex !== index)); inputRef.current?.focus(); }} role="listitem" />)}
      </div>
      <input {...inputProps} id={inputId} ref={inputRef} className={`tui-input-tag-entry__input${inputProps.className ? ` ${inputProps.className}` : ""}`} data-slot="value" data-typography-role="body-l" type="text" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={menuId} aria-labelledby={labelId} aria-activedescendant={open && activeIndex >= 0 && filteredOptions[activeIndex] ? `${menuId}-option-${activeIndex + 1}` : undefined} aria-invalid={error || state === "error" ? "true" : undefined} autoComplete="off" value={query} placeholder={placeholder} disabled={disabled} onChange={(event) => updateQuery(event.target.value, event)} onFocus={(event) => onFocus?.(event)} onBlur={(event) => onBlur?.(event)} onKeyDown={onInputKeyDown} />
      <div id={menuId} className="tui-advanced-menu__panel tui-input-tag-entry__menu" role="listbox" aria-label={`${label}建议`} hidden={!open}>
        {filteredOptions.map((option, index) => <button key={`${option}-${index}`} id={`${menuId}-option-${index + 1}`} className="tui-advanced-menu__item" type="button" role="option" aria-selected={activeIndex === index} data-typography-role="body-l" onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => selectOption(option)}>{option}</button>)}
        {filteredOptions.length === 0 && <div className="tui-input-tag-entry__empty">无匹配项</div>}
      </div>
    </div>
  </div>;
}

export function Input({ value, defaultValue, placeholder = "请输入内容", disabled = false, error = false, state, surface = "white", variant = "default", label = "成员", options = [], tags, defaultTags = [], onTagsChange, onChange, ...props }) {
  if (variant === "tag-entry") return <TagEntryInput {...props} id={props.id} value={value} defaultValue={defaultValue} placeholder={placeholder} label={label} options={options} tags={tags} defaultTags={defaultTags} disabled={disabled} error={error} state={state} surface={surface} onChange={onChange} onTagsChange={onTagsChange} />;
  const [focused, setFocused] = React.useState(false);
  const resolvedState = disabled ? "disabled" : state ?? (error ? "error" : focused ? "focus" : "default");
  return <label className="tui-component tui-input" data-surface={surface} {...contract("input", "Input/White Surface/Default", "default", resolvedState)}>
    <input {...props} value={value} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} onChange={onChange} onFocus={(event) => { setFocused(true); props.onFocus?.(event); }} onBlur={(event) => { setFocused(false); props.onBlur?.(event); }} data-slot="value" data-typography-role="body-l" aria-invalid={error || state === "error" ? "true" : undefined} />
  </label>;
}

export function Search({ value, defaultValue = "", placeholder = "搜索", disabled = false, state = "default", surface = "white", advancedSearch = false, advancedSearchLabel = "高级", scope, defaultScope, scopeOptions = [], scopeLabel = "搜索范围", onScopeChange, onAdvancedSearch, onChange, onClear, ...props }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentValue = value === undefined ? internalValue : value;
  const hasValue = Boolean(currentValue);
  const normalizedScopeOptions = Array.isArray(scopeOptions) ? scopeOptions.filter(Boolean) : [];
  const scoped = normalizedScopeOptions.length > 0;
  const [internalScope, setInternalScope] = React.useState(defaultScope ?? normalizedScopeOptions[0] ?? "");
  const currentScope = scope === undefined ? internalScope : scope;
  const [focused, setFocused] = React.useState(false);
  const requestedState = searchSupportedStates.has(state) ? state : "default";
  const isDisabled = disabled || requestedState === "disabled";
  const resolvedState = isDisabled ? "disabled" : requestedState !== "default" ? requestedState : focused ? hasValue ? "typing" : "focus" : hasValue ? "filled" : "default";
  const variant = scoped ? advancedSearch ? "scoped-advanced-search" : "scoped-search" : advancedSearch ? "advanced-search" : "default";
  return <label className="tui-component tui-search" data-surface={surface} {...contract("search", scoped ? "Search/Scoped/Default" : "Search/White Surface/Default", variant, resolvedState)}>
    {scoped && <DropdownMenu className="tui-search__scope" slotName="scope-selector" compact hideLabel label={scopeLabel} value={currentScope} items={normalizedScopeOptions} ariaLabel={scopeLabel} disabled={isDisabled} onSelect={(next, event) => { if (scope === undefined) setInternalScope(next); onScopeChange?.(next, event); }} />}
    <span className="tui-search__input-region" data-search-input-region>
      <span data-slot="leading"><Icon name="field/search" /></span>
      <input {...props} type="search" value={currentValue} placeholder={placeholder} disabled={isDisabled} onChange={(event) => { if (value === undefined) setInternalValue(event.target.value); onChange?.(event); }} onFocus={(event) => { setFocused(true); props.onFocus?.(event); }} onBlur={(event) => { setFocused(false); props.onBlur?.(event); }} data-slot="value" data-typography-role="body-l" />
      {hasValue && <button className="tui-icon-button" type="button" aria-label="清除" disabled={isDisabled} onClick={(event) => { if (value === undefined) setInternalValue(""); onClear?.(event); }} data-slot="clear"><Icon name="action/close" /></button>}
      {advancedSearch && <Button className="tui-search__advanced" label={advancedSearchLabel} variant="ghost" size="small" mode="text" type="button" aria-label={advancedSearchLabel} aria-haspopup="dialog" disabled={isDisabled} onClick={onAdvancedSearch} data-slot="advanced-search" data-typography-role="body-m" />}
    </span>
  </label>;
}

export function Sidebar({ items = [], groups = [], selected, onSelect, children, ariaLabel = "主导航", ...props }) {
  const renderItems = (groupItems) => groupItems.map((item) => { const itemState = item.id === selected ? "selected" : item.state ?? "default"; return <button className="tui-sidebar-item" key={item.id ?? item.label} type="button" data-component="sidebar-item" data-renderer-key="sidebar-item" data-logical-component="Sidebar Item/Default" data-variant={itemState} data-state={itemState} data-framework="react" disabled={item.disabled || item.state === "disabled"} onClick={() => onSelect?.(item.id)}>
    <span data-slot="leading"><Icon name={item.iconAlias ?? item.icon ?? "navigation/grid"} /></span><span data-slot="label">{item.label}</span>{item.count !== undefined && <span className="tui-sidebar-item__count" data-slot="trailing">{item.count}</span>}
  </button>; });
  if (!children && groups.length > 1) return <nav className="tui-component tui-sidebar-groups" data-component="sidebar-groups" data-logical-component="Sidebar Groups/Default" data-framework="react" aria-label={ariaLabel} {...props}>
    {groups.map((group, index) => <SidebarGroup key={group.id ?? index} group={group} index={index} selected={selected} onSelect={onSelect} />)}
  </nav>;
  return <nav className="tui-component tui-sidebar" data-component="sidebar" data-renderer-key="sidebar" data-variant="default" data-state="default" data-framework="react" aria-label={ariaLabel} {...props}>
    {children ?? renderItems(groups.length === 1 ? groups[0].items : items)}
  </nav>;
}

function SidebarGroup({ group, index, selected, onSelect }) {
  const [expanded, setExpanded] = React.useState(group.expanded !== false);
  const contentId = `sidebar-group-content-${index + 1}`;
  return <section className="tui-component tui-disclosure tui-sidebar-group" data-component="collapsible" data-renderer-key="collapsible" data-logical-component="Collapsible/Default" data-variant={expanded ? "open" : "default"} data-state={expanded ? "open" : "default"} data-framework="react">
    <button className="tui-disclosure__trigger tui-sidebar-group__trigger" type="button" aria-expanded={expanded} aria-controls={contentId} data-typography-role="subtitle-s" onClick={() => setExpanded((value) => !value)}><span data-slot="label">{group.label ?? `导航组 ${index + 1}`}</span><Icon name="navigation/chevron-down" size={16} /></button>
    <div className="tui-disclosure__content tui-sidebar-group__content" id={contentId} data-slot="content" hidden={!expanded}><Sidebar items={group.items} selected={selected} onSelect={onSelect} ariaLabel={group.ariaLabel ?? group.label ?? "主导航"} /></div>
  </section>;
}

const primaryNavigationIconAliases = Object.freeze({
  "primary-level/overview": "navigation/grid",
  "primary-level/calendar": "field/calendar",
  "primary-level/contacts": "navigation/contacts",
  "primary-level/mail": "navigation/mail-unread",
  "primary-level/settings": "action/settings"
});
const resolvePrimaryNavigationIcon = (name) => primaryNavigationIconAliases[name] ?? name;
export function PrimaryNavigationItem({ label = "项目", ariaLabel, icon = "navigation/grid", selected = false, disabled = false, state = "default", onSelect, className = "", ...props }) {
  const resolvedState = disabled ? "disabled" : selected ? "selected" : state;
  const iconAlias = resolvePrimaryNavigationIcon(icon);
  return <button type="button" className={`tui-component tui-primary-navigation-item${className ? ` ${className}` : ""}`} {...contract("primary-navigation-item", "Primary Navigation Item/Level 1", selected ? "selected" : "default", resolvedState, { "data-placement": "primary-navigation-shell", "data-mode": "icon-only", "aria-label": ariaLabel ?? label, "aria-pressed": selected, ...props })} disabled={disabled || state === "disabled"} onClick={() => onSelect?.(label)}>
    <span data-slot="icon"><Icon name={iconAlias} size={24} /></span>
  </button>;
}

export function ListCard({ title = "项目设置", description = "", supporting = "", lines = description ? supporting ? 3 : 2 : 1, trailing = "text-arrow", trailingText = "详情", selected = false, unread = false, state, leading = "navigation/grid", children, onClick, ...props }) {
  const resolvedState = state ?? (selected ? "selected" : "default");
  const trailingNode = trailing === "icon"
    ? <span className="tui-item__trailing tui-item__trailing--icon" data-slot="trailing"><Icon name="action/more" size={20} /></span>
    : trailing === "radio"
      ? <label className="tui-item__trailing tui-choice" data-slot="trailing"><input type="radio" defaultChecked aria-label="已选中" /><span className="tui-radio__indicator" aria-hidden="true" /></label>
      : trailing === "checkbox"
        ? <label className="tui-item__trailing tui-choice tui-checkbox" data-slot="trailing"><input type="checkbox" defaultChecked aria-label="已选中" /><span className="tui-checkbox__indicator" aria-hidden="true"><Icon name="choice/check" size={16} /></span></label>
        : trailing === "switch"
          ? <label className="tui-item__trailing tui-choice tui-switch" data-slot="trailing"><input type="checkbox" role="switch" defaultChecked aria-label="已开启" /><span className="tui-switch__track" aria-hidden="true" /></label>
          : trailing === "notification-arrow"
            ? <span className="tui-item__trailing tui-item__trailing--notification-arrow" data-slot="trailing"><span className="tui-item__notification-dot" aria-label="有新事件" /><Icon name="navigation/chevron-right" size={20} /></span>
            : <span className="tui-item__trailing tui-item__trailing--text-arrow" data-slot="trailing" data-typography-role="body-m"><span>{trailingText}</span><Icon name="navigation/chevron-right" size={20} /></span>;
  const activate = (event) => { if (!event.target.closest("input, button, a, select, textarea")) onClick?.(event); };
  return <div className="tui-component tui-list-card" role="button" tabIndex={resolvedState === "disabled" ? -1 : 0} {...contract("list-card", "List Item/White Surface/Default", `line-${lines}`, resolvedState, { "data-lines": lines })} aria-pressed={selected || resolvedState === "selected"} aria-disabled={resolvedState === "disabled" || undefined} onClick={resolvedState === "disabled" ? undefined : activate} onKeyDown={(event) => { if (resolvedState !== "disabled" && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onClick?.(event); } }} {...props}>
    {children ?? <><span className="tui-item__leading" data-slot="leading"><Icon name={leading} size={24} /></span><span className="tui-item__content"><span data-slot="title" data-typography-role="body-l">{title}</span>{description && <span data-slot="description" data-typography-role="body-m">{description}</span>}{supporting && <span data-slot="supporting" data-typography-role="body-s">{supporting}</span>}</span>{trailingNode}</>}
  </div>;
}

export function Titlebar(options = {}) {
  let { label = "项目空间", paneTitle = "项目内容", size = "large", state = "default", disabled = false, layout, paneRole, mainContentLeading, mainDetailActions = [], secondaryPaneContent, onMainContentAction, onMainDetailAction, onAction, showLogo, logoSrc = defaultTitlebarLogoSrc, logoAlt = "", showWindowControls, segmentRole, slots, children, ...props } = resolveTitlebarSegment(options);
  if (paneRole === "main-detail" || paneRole === "main-content") paneRole = "final-pane";
  const actions = [
    ["minimize", "最小化"],
    ["maximize", "最大化"],
    ["close", "关闭"]
  ];
  const controlIconSize = size === "small" ? 16 : 24;
  const isFinalPane = paneRole === "final-pane";
  const titlebarActionType = (action) => {
    const type = action.buttonType ?? (action.showLabel ? "icon-text-ghost" : "icon");
    if (!["icon", "icon-text-ghost"].includes(type)) throw new Error(`Titlebar main-detail-actions only accepts icon or icon-text-ghost; received ${type}`);
    return type;
  };
  return <header className="tui-component tui-titlebar" {...contract("titlebar", "Titlebar/Default", size, disabled ? "disabled" : state, { "data-size": size, "data-layout": layout, "data-pane-role": paneRole })} {...props}>
    {(paneRole === "global" || paneRole === "primary-navigation") && <span className="tui-titlebar__brand" data-slot="leading">{showLogo && <span className="tui-titlebar__logo-slot" data-slot="logo"><img className="tui-titlebar__logo" src={logoSrc} alt={logoAlt} aria-hidden={logoAlt ? undefined : true} /></span>}<span data-slot="label" data-typography-role="subtitle-m">{label}</span></span>}
    {paneRole !== "global" && paneRole !== "primary-navigation" && showLogo && <span className="tui-titlebar__logo-slot" data-slot="logo"><img className="tui-titlebar__logo" src={logoSrc} alt={logoAlt} aria-hidden={logoAlt ? undefined : true} /></span>}
    {children ?? <>{paneRole === "secondary-pane" && secondaryPaneContent && <div className="tui-titlebar__secondary-content" data-slot="secondary-pane-content" data-component-slot="registered-component"><Search {...(secondaryPaneContent.props ?? {})} /></div>}{layout === "two-column" && isFinalPane && mainContentLeading && <div className="tui-titlebar__pane-leading" data-slot="main-content-leading" data-action-scope="main-content-pane-global"><Button label={mainContentLeading.label} variant="ghost" size="standard" mode={mainContentLeading.buttonType === "icon-text-ghost" ? "icon-text" : "icon"} logicalName={mainContentLeading.buttonType === "icon-text-ghost" ? "Icon Text Button/Ghost/Default" : "Icon Button/Ghost/Default"} icon={mainContentLeading.icon} iconSize={24} className="tui-titlebar__pane-leading-action" type="button" data-slot="main-content-leading-action" data-action={mainContentLeading.id} data-button-type={mainContentLeading.buttonType ?? "icon"} disabled={disabled || mainContentLeading.disabled} onClick={() => onMainContentAction?.(mainContentLeading.id)} /></div>}{(layout === "two-column" || layout === "standalone") && isFinalPane && <strong className="tui-titlebar__pane-title" data-slot="main-content-title" data-action-scope="main-content-pane-global" data-typography-role={size === "small" ? "subtitle-m" : "title-s"}>{paneTitle}</strong>}{layout === "three-column" && isFinalPane && mainDetailActions.length > 0 && <div className="tui-titlebar__pane-actions" data-slot="main-detail-actions" data-action-scope="main-detail-pane-global" aria-label="Main Detail 栏级操作">{mainDetailActions.map((action) => {
      const buttonType = titlebarActionType(action);
      const iconOnly = buttonType === "icon";
      return <Button key={action.id} label={action.label} variant="ghost" mode={iconOnly ? "icon" : "icon-text"} logicalName={iconOnly ? "Icon Button/Ghost/Default" : "Icon Text Button/Ghost/Default"} icon={action.icon ?? "action/more"} className={`tui-titlebar__pane-action${iconOnly ? "" : " tui-titlebar__pane-action--text"}`} type="button" data-slot="main-detail-action" data-action={action.id} data-button-type={buttonType} aria-label={action.label} disabled={disabled || action.disabled} onClick={() => onMainDetailAction?.(action.id)} />;
    })}</div>}</>}
    {showWindowControls && <div className="tui-titlebar__actions" data-slot="actions" data-component="titlebar-controls" data-logical-component="Titlebar Controls/Normal" data-size="medium">{actions.map(([action, text]) => <Button key={action} label={text} variant="ghost" size="standard" mode="icon" logicalName="Icon Button/Ghost/Default" icon={`window/${action}`} iconSize={controlIconSize} className="tui-titlebar__action" data-slot="titlebar-action" data-action={action} data-button-type="icon" disabled={disabled} onClick={() => onAction?.(action)} />)}</div>}
  </header>;
}

export function Textarea({ label = "项目说明", value, defaultValue, placeholder = "请输入内容", help = "", disabled = false, error = false, state = "default", surface = "white", onChange, ...props }) {
  const [focused, setFocused] = React.useState(false);
  const resolvedState = disabled ? "disabled" : state !== "default" ? state : error ? "error" : focused ? "focus" : "default";
  return <label className="tui-component tui-textarea" data-surface={surface} {...contract("textarea", "Textarea/Default", "default", resolvedState)}>
    <span data-slot="label" data-typography-role="body-m">{label}</span>
    <textarea {...props} data-slot="value" data-typography-role="body-l" value={value} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} aria-invalid={error || state === "error" ? "true" : undefined} onChange={onChange} onFocus={(event) => { setFocused(true); props.onFocus?.(event); }} onBlur={(event) => { setFocused(false); props.onBlur?.(event); }} />
    {help && <span data-slot="help" data-typography-role="body-s">{help}</span>}
  </label>;
}

export function Field({ label = "项目名称", value, defaultValue, placeholder = "请输入内容", help = "", disabled = false, error = false, state = "default", surface = "white", onChange, ...props }) {
  const [focused, setFocused] = React.useState(false);
  const resolvedState = disabled ? "disabled" : state !== "default" ? state : error ? "error" : focused ? "focus" : "default";
  return <label className="tui-component tui-field" data-surface={surface} {...contract("field", "Field/Default", "default", resolvedState)}>
    <span data-slot="label" data-typography-role="body-m">{label}</span>
    <span className="tui-field__control"><input {...props} data-slot="value" data-typography-role="body-l" value={value} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} aria-invalid={error || state === "error" ? "true" : undefined} onChange={onChange} onFocus={(event) => { setFocused(true); props.onFocus?.(event); }} onBlur={(event) => { setFocused(false); props.onBlur?.(event); }} /></span>
    {help && <span data-slot="help" data-typography-role="body-s">{help}</span>}
  </label>;
}

/**
 * Form Field owns the label, required marker, control slot, and validation
 * message. The input/select remains a real child component rather than being
 * recreated by this container.
 */
export function FormField({ label = "项目名称", required = false, error = "", disabled = false, state = "default", surface = "white", children, control, ...props }) {
  const resolvedState = disabled ? "disabled" : state !== "default" ? state : error ? "error" : "default";
  const child = children ?? control;
  const labelledControl = React.isValidElement(child) ? React.cloneElement(child, { "aria-label": child.props["aria-label"] ?? label }) : child;
  return <section className="tui-component tui-form-field" data-surface={surface} data-required={required} {...contract("form-field", "Form Field/Default", "default", resolvedState)} {...props}>
    <span data-slot="label" data-typography-role="subtitle-s">{required && <span className="tui-form-field__required" aria-hidden="true">*</span>}{label}</span>
    <div className="tui-form-field__control" data-slot="control">{labelledControl}</div>
    {error && <span className="tui-form-field__error" data-slot="error" role="alert" data-typography-role="body-s">{error}</span>}
  </section>;
}

const defaultSelectOptions = ["进行中", "已完成", "已归档"];
function SelectBase({ id, label = "状态", value, defaultValue = defaultSelectOptions[0], options = defaultSelectOptions, disabled = false, state = "default", surface = "white", onChange, combobox = false, ...props }) {
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState(value ?? defaultValue);
  const [query, setQuery] = React.useState(value ?? defaultValue);
  const [filterActive, setFilterActive] = React.useState(false);
  const triggerRef = React.useRef(null);
  const controlled = value !== undefined;
  const selected = controlled ? value : current;
  React.useEffect(() => { if (controlled) { setCurrent(value); setQuery(value ?? ""); } }, [controlled, value]);
  const choose = (next) => { if (!controlled) setCurrent(next); setQuery(next); setFilterActive(false); onChange?.(next); setOpen(false); triggerRef.current?.focus(); };
  const onKeyDown = (event) => {
    if (disabled) return;
    const index = Math.max(0, options.indexOf(selected));
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); return; }
    if (combobox && event.key === "Enter") { event.preventDefault(); const match = options.find((option) => option.toLowerCase() === query.trim().toLowerCase()); if (match) choose(match); else setOpen(true); return; }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setOpen((currentOpen) => !currentOpen); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); const next = options[(index + (event.key === "ArrowDown" ? 1 : options.length - 1)) % options.length]; if (open) choose(next); else setOpen(true); }
  };
  const resolvedState = disabled ? "disabled" : state;
  return <div className="tui-component tui-select" data-surface={surface} {...contract(id, id === "combobox" ? "Combobox/Default" : "Select/Default", "default", resolvedState)}>
    <span data-slot="label" data-typography-role="body-m">{label}</span>
    {combobox ? <div className="tui-select__trigger tui-combobox__trigger" {...props} onClick={() => { setFilterActive(false); setOpen(true); }}>
      <input ref={triggerRef} className="tui-combobox__input" data-slot="value" data-typography-role="body-m" type="text" role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-options`} aria-autocomplete="list" autoComplete="off" value={query} disabled={disabled} onChange={(event) => { setQuery(event.target.value); setFilterActive(true); setOpen(true); }} onKeyDown={onKeyDown} />
      <span className="tui-combobox__chevron" aria-hidden="true"><Icon name="navigation/chevron-down" size={16} /></span>
    </div> : <button {...props} ref={triggerRef} className="tui-select__trigger" type="button" role="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-options`} aria-disabled={disabled || undefined} disabled={disabled} onClick={() => setOpen((currentOpen) => !currentOpen)} onKeyDown={onKeyDown}>
      <span data-slot="value" data-typography-role="body-m">{selected}</span><Icon name="navigation/chevron-down" size={16} />
    </button>}
    <div className="tui-select__menu" id={`${id}-options`} role="listbox" hidden={!open} aria-label={label}>{(combobox && filterActive ? options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase())) : options).map((option) => <button key={option} type="button" role="option" aria-selected={option === selected} data-typography-role="body-l" onClick={() => choose(option)}>{option}</button>)}</div>
  </div>;
}

export function Select({ id = "select", ...props }) { return <SelectBase {...props} id={id} />; }
export function Combobox(props) { return <SelectBase {...props} id="combobox" combobox />; }

export function NativeSelect({ label = "视图", value, defaultValue = "列表视图", options = ["列表视图", "网格视图", "紧凑视图"], disabled = false, state = "default", surface = "white", onChange, ...props }) {
  return <label className="tui-component tui-native-select" data-surface={surface} {...contract("native-select", "Native Select/Default", "default", disabled ? "disabled" : state)}>
    <span data-slot="label" data-typography-role="body-m">{label}</span>
    <span className="tui-native-select__control"><select {...props} data-slot="value" data-typography-role="body-l" value={value} defaultValue={value === undefined ? defaultValue : undefined} disabled={disabled} onChange={onChange}>{options.map((option) => <option value={option} key={option}>{option}</option>)}</select><Icon name="navigation/chevron-down" size={16} /></span>
  </label>;
}

export function Checkbox({ checked, defaultChecked = true, label = "同步到云端", description = "保存后自动同步", disabled = false, onChange, ...props }) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isChecked = checked === undefined ? internalChecked : checked;
  return <label className="tui-component tui-choice tui-checkbox" data-surface="white" {...contract("checkbox", "Checkbox/Default", "default", disabled ? "disabled" : isChecked ? "selected" : "default")}><input {...props} type="checkbox" checked={isChecked} disabled={disabled} onChange={(event) => { if (checked === undefined) setInternalChecked(event.target.checked); onChange?.(event); }} /><span className="tui-checkbox__indicator" aria-hidden="true"><Icon name="choice/check" size={16} /></span><span data-slot="label" data-typography-role="body-m">{label}</span><span data-slot="description" data-typography-role="body-m">{description}</span></label>;
}

export function Radio({ checked, defaultChecked = false, label = "邮件", name = "radio", value = "邮件", disabled = false, onChange, ...props }) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isChecked = checked === undefined ? internalChecked : checked;
  return <label className="tui-component tui-choice tui-radio" {...contract("radio", "Radio/Unselected/Default", isChecked ? "selected" : "unselected", disabled ? "disabled" : isChecked ? "selected" : "default")}><input {...props} type="radio" name={name} value={value} checked={isChecked} disabled={disabled} onChange={(event) => { if (checked === undefined) setInternalChecked(event.target.checked); onChange?.(event); }} /><span className="tui-radio__indicator" data-slot="control" aria-hidden="true" /><span data-slot="label" data-typography-role="body-m">{label}</span></label>;
}

export function RadioGroup({ value, defaultValue = "邮件", options = ["邮件", "站内消息"], label = "通知方式", onChange, ...props }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const selected = value === undefined ? internalValue : value;
  return <fieldset className="tui-component tui-choice tui-radio-group" {...contract("radio-group", "Radio Group/Default", "default", "default")} {...props}><legend data-slot="label" data-typography-role="body-m">{label}</legend>{options.map((option) => <label key={option}><input type="radio" name={props.name ?? "radio-group"} value={option} checked={selected === option} onChange={(event) => { if (value === undefined) setInternalValue(event.target.value); onChange?.(event.target.value); }} /><span className="tui-radio__indicator" aria-hidden="true" /><span data-typography-role="body-m">{option}</span></label>)}</fieldset>;
}

export function Switch({ checked, defaultChecked = true, label = "自动同步", description = "已开启", disabled = false, onChange, ...props }) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isChecked = checked === undefined ? internalChecked : checked;
  return <label className="tui-component tui-choice tui-switch" {...contract("switch", "Switch/Default", "default", disabled ? "disabled" : isChecked ? "selected" : "default")}><input {...props} type="checkbox" role="switch" checked={isChecked} disabled={disabled} onChange={(event) => { if (checked === undefined) setInternalChecked(event.target.checked); onChange?.(event); }} /><span className="tui-switch__track" aria-hidden="true" /><span data-slot="label" data-typography-role="body-m">{label}</span><span data-slot="description" data-typography-role="body-m">{description}</span></label>;
}

export function SegmentedButton({ options = ["列表", "看板", "时间线"], value, defaultValue = options[0], label = "视图模式", disabled = false, onChange, ...props }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const selected = value === undefined ? internalValue : value;
  const choose = (next) => { if (value === undefined) setInternalValue(next); onChange?.(next); };
  return <div className="tui-component tui-segmented-button" {...contract("segmented-button", "Segmented Button/Default", "default", disabled ? "disabled" : "default")} role="group" aria-label={label} {...props}>{options.map((option) => <button type="button" className={`tui-segmented-button__item${selected === option ? " is-selected" : ""}`} key={option} aria-pressed={selected === option} disabled={disabled} data-slot="option" data-typography-role="body-m" onClick={() => choose(option)}>{option}</button>)}</div>;
}

export function NumberSelector({ value, defaultValue = 1, min = 0, max = 99, step = 1, label = "数量", disabled = false, onChange, ...props }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const selected = value === undefined ? internalValue : value;
  const update = (next) => {
    const normalized = Math.min(max, Math.max(min, Number.isFinite(Number(next)) ? Number(next) : min));
    if (value === undefined) setInternalValue(normalized);
    onChange?.(normalized);
  };
  return <label className="tui-component tui-number-selector" {...contract("number-selector", "Number Selector/Default", "default", disabled ? "disabled" : "default")} {...props}><span data-slot="label" data-typography-role="body-m">{label}</span><span className="tui-number-selector__control"><input type="number" data-slot="value" data-typography-role="body-l" value={selected} min={min} max={max} step={step} disabled={disabled} onChange={(event) => update(event.target.value)} /><span className="tui-number-selector__stepper" aria-label={`调整${label}`}><button type="button" className="tui-number-selector__step" data-slot="increment" data-direction="increment" aria-label={`增加${label}`} disabled={disabled || selected >= max} onClick={() => update(selected + step)}><Icon name="navigation/chevron-up" size={16} /></button><button type="button" className="tui-number-selector__step" data-slot="decrement" data-direction="decrement" aria-label={`减少${label}`} disabled={disabled || selected <= min} onClick={() => update(selected - step)}><Icon name="navigation/chevron-down" size={16} /></button></span></span></label>;
}

export function Tabs({ tabs = [{ id: "overview", label: "概览", content: "工作空间概览" }, { id: "projects", label: "项目", content: "项目列表" }, { id: "members", label: "成员", content: "成员列表" }], value, defaultValue = tabs[0]?.id, onChange, ...props }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const selected = value === undefined ? internalValue : value;
  const choose = (next) => { if (value === undefined) setInternalValue(next); onChange?.(next); };
  const onKeyDown = (event) => { const index = Math.max(0, tabs.findIndex((tab) => tab.id === selected)); if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) { event.preventDefault(); const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : tabs.length - 1; const next = tabs[(index + direction) % tabs.length]; choose(next.id); event.currentTarget.querySelector(`[data-tab="${next.id}"]`)?.focus(); } };
  return <div className="tui-component tui-tabs" {...contract("tabs", "Tabs/Default", "default", "default")} {...props}><div className="tui-tabs__list" role="tablist" aria-label="项目视图" onKeyDown={onKeyDown}>{tabs.map((tab) => <button type="button" role="tab" key={tab.id} data-tab={tab.id} aria-selected={selected === tab.id} className={selected === tab.id ? "is-selected" : ""} data-typography-role="body-l" onClick={() => choose(tab.id)}>{tab.label}</button>)}</div><div className="tui-tabs__panel" role="tabpanel" data-tab-panel={selected} data-typography-role="body-l">{tabs.find((tab) => tab.id === selected)?.content}</div></div>;
}

const defaultSubTabs = [
  { id: "overview", label: "概览", content: "项目概览" },
  { id: "activity", label: "活动", content: "项目活动" },
  { id: "settings", label: "设置", content: "项目设置" }
];

export function SubTabs({ tabs = defaultSubTabs, value, defaultValue = tabs[0]?.id, disabled = false, onChange, ...props }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const selected = value === undefined ? internalValue : value;
  const choose = (next) => {
    const tab = tabs.find((item) => item.id === next);
    if (disabled || !tab || tab.disabled) return;
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  };
  const onKeyDown = (event) => {
    const current = event.target.closest?.('[role="tab"]');
    if (!current || !["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const enabled = tabs.filter((tab) => !tab.disabled);
    const index = Math.max(0, enabled.findIndex((tab) => tab.id === current.dataset.tab));
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : enabled.length - 1;
    const next = enabled[(index + direction) % enabled.length];
    if (next) { choose(next.id); event.currentTarget.querySelector(`[data-tab="${next.id}"]`)?.focus(); }
  };
  const panelId = "sub-tabs-panel";
  return <div className="tui-component tui-sub-tabs" {...contract("sub-tabs", "Sub Tabs/Default", "default", "default")} {...props}>
    <div className="tui-sub-tabs__list" role="tablist" aria-label="子页签" onKeyDown={onKeyDown}>
      {tabs.map((tab) => <button type="button" role="tab" key={tab.id} id={`sub-tab-${tab.id}`} data-tab={tab.id} aria-controls={panelId} aria-selected={selected === tab.id} tabIndex={selected === tab.id ? 0 : -1} disabled={disabled || tab.disabled} className={selected === tab.id ? "is-selected" : ""} data-typography-role={selected === tab.id ? "subtitle-m" : "body-l"} onClick={() => choose(tab.id)}>{tab.label}</button>)}
    </div>
    <div className="tui-sub-tabs__panel" id={panelId} role="tabpanel" aria-labelledby={`sub-tab-${selected}`} data-tab-panel={selected} data-slot="content" data-typography-role="body-l">{tabs.find((tab) => tab.id === selected)?.content}</div>
  </div>;
}

const defaultTreeNodes = [
  { id: "workspace", label: "工作空间", trailing: "24", children: [
    { id: "projects", label: "项目", trailing: "12", children: [
      { id: "design-system", label: "设计系统" },
      { id: "component-library", label: "组件库" }
    ] },
    { id: "members", label: "成员", trailing: "8" }
  ] },
  { id: "archive", label: "归档" }
];

const flattenTree = (nodes, expanded, depth = 1, result = []) => {
  for (const node of nodes) {
    result.push({ node, depth });
    if (node.children?.length && expanded.has(node.id)) flattenTree(node.children, expanded, depth + 1, result);
  }
  return result;
};

export function TreeView({ nodes = defaultTreeNodes, selectedId: controlledSelectedId, defaultSelectedId = "design-system", expandedIds, defaultExpandedIds = ["workspace", "projects"], disabled = false, onSelect, onToggle, ...props }) {
  const [internalSelectedId, setInternalSelectedId] = React.useState(defaultSelectedId);
  const [internalExpandedIds, setInternalExpandedIds] = React.useState(() => new Set(defaultExpandedIds));
  const selectedId = controlledSelectedId === undefined ? internalSelectedId : controlledSelectedId;
  const expanded = expandedIds === undefined ? internalExpandedIds : new Set(expandedIds);
  const visibleNodes = flattenTree(nodes, expanded);
  const toggle = (node) => {
    if (disabled || node.disabled || !node.children?.length) return;
    const next = new Set(expanded);
    if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
    if (expandedIds === undefined) setInternalExpandedIds(next);
    onToggle?.(node.id, next.has(node.id));
  };
  const select = (node) => {
    if (disabled || node.disabled) return;
    if (controlledSelectedId === undefined) setInternalSelectedId(node.id);
    onSelect?.(node.id);
  };
  const onKeyDown = (event) => {
    const current = event.currentTarget;
    const index = visibleNodes.findIndex(({ node }) => node.id === current.dataset.nodeId);
    if (index < 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = visibleNodes[index + (event.key === "ArrowDown" ? 1 : -1)];
      next && current.parentElement?.querySelector(`[data-node-id="${next.node.id}"]`)?.focus();
    } else if (event.key === "ArrowRight" && current.getAttribute("aria-expanded") === "false") {
      event.preventDefault(); toggle(visibleNodes[index].node);
    } else if (event.key === "ArrowLeft" && current.getAttribute("aria-expanded") === "true") {
      event.preventDefault(); toggle(visibleNodes[index].node);
    }
  };
  return <nav className="tui-component tui-tree-view" {...contract("tree-view", "Tree View/Default", "default", "default")} {...props} aria-label="项目结构" role="tree">
    {visibleNodes.map(({ node, depth }) => <button type="button" role="treeitem" key={node.id} className={`tui-tree-view__item${selectedId === node.id ? " is-selected" : ""}`} data-node-id={node.id} data-tree-depth={depth} aria-level={depth} aria-selected={selectedId === node.id} aria-expanded={node.children?.length ? expanded.has(node.id) : undefined} disabled={disabled || node.disabled} style={{ "--tree-indent": `${Math.max(0, depth - 1) * 12}px` }} onClick={() => { if (node.children?.length) toggle(node); select(node); }} onKeyDown={onKeyDown}>
      <span className={`tui-tree-view__chevron${node.children?.length ? " has-children" : ""}${expanded.has(node.id) ? " is-expanded" : ""}`} aria-hidden="true">{node.children?.length ? <Icon name="navigation/chevron-right" size={20} /> : null}</span>
      <span className="tui-tree-view__icon" data-slot="leading" aria-hidden="true"><Icon name={node.children?.length ? "navigation/grid" : "object/file"} size={20} /></span>
      <span className="tui-tree-view__label" data-slot="label" data-typography-role="body-l">{node.label}</span>
      {node.trailing ? <span className="tui-tree-view__trailing" data-slot="trailing" data-typography-role="body-m">{node.trailing}</span> : null}
    </button>)}
  </nav>;
}

function Disclosure({ id, logicalName, title, detail, open, defaultOpen = false, onOpenChange, ...props }) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = open === undefined ? internalOpen : open;
  const toggle = () => { const next = !isOpen; if (open === undefined) setInternalOpen(next); onOpenChange?.(next); };
  const contentId = `${id}-content`;
  const isAccordion = id === "accordion";
  const triggerContent = isAccordion
    ? <><Icon name="navigation/chevron-right" size={20} /><span data-slot="label" data-typography-role="body-m">{title}</span></>
    : <><span data-slot="label" data-typography-role="body-m">{title}</span><Icon name="navigation/chevron-down" size={20} /></>;
  return <div className="tui-component tui-disclosure" {...contract(id, `${logicalName}/Default`, "default", "default")} {...props}><button className="tui-disclosure__trigger" type="button" data-typography-role="body-m" aria-expanded={isOpen} aria-controls={contentId} onClick={toggle}>{triggerContent}</button><div className="tui-disclosure__content" id={contentId} data-slot="content" hidden={!isOpen} data-typography-role="body-l">{detail}</div></div>;
}

export function Accordion(props) { return <Disclosure id="accordion" logicalName="Accordion" title="项目设置" detail="基础信息、成员与通知方式" {...props} />; }
export function Collapsible(props) { return <Disclosure id="collapsible" logicalName="Collapsible" title="更多信息" detail="点击展开查看详情" {...props} />; }

export function Avatar({ initials = "H", name = "HarmonyOS", size = 40, disabled = false, ...props }) {
  const resolvedSize = Number(size) === 32 ? 32 : 40;
  return <span className="tui-component tui-avatar" {...contract("avatar", `Avatar/${resolvedSize}/Fallback`, `size-${resolvedSize}`, disabled ? "disabled" : "default", { "data-size": resolvedSize })} aria-label={name} aria-disabled={disabled || undefined} data-typography-role="body-s" {...props}>{initials}</span>;
}

export function Badge({ label = "进行中", tone = "info", disabled = false, ...props }) {
  const safeTone = ["info", "success", "warning", "danger", "neutral"].includes(tone) ? tone : "info";
  return <span className={`tui-component tui-badge tui-badge--${safeTone}`} {...contract("badge", "Badge/Default", safeTone, disabled ? "disabled" : "default")} data-typography-role="body-s" {...props}>{label}</span>;
}

const defaultTableRows = [
  ["客户端设计系统", "赵博海", "进行中"],
  ["组件规范", "林晓", "已完成"]
];

export function Table({ id = "table", title = "项目列表", columns = ["名称", "负责人", "状态"], rows = defaultTableRows, ...props }) {
  const logicalName = id === "data-table" ? "Data Table/Default" : "Table/Default";
  return <div className="tui-component tui-table" {...contract(id, logicalName, "default", "default")} {...props}>
    <div className="tui-table__heading"><h4 data-slot="title" data-typography-role="title-s">{title}</h4><span data-slot="description" data-typography-role="body-s">{rows.length} 个项目</span></div>
    <table><thead><tr>{columns.map((column, index) => <th scope="col" data-typography-role="body-m" key={`${column}-${index}`}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.join("-")}-${index}`}>{row.map((value, cellIndex) => <td data-typography-role="body-l" key={cellIndex}>{cellIndex === 2 && value === "进行中" ? <Badge label={value} tone="info" /> : cellIndex === 2 && value === "已完成" ? <Badge label={value} tone="success" /> : value}</td>)}</tr>)}</tbody></table>
  </div>;
}

export function DataTable(props) { return <Table {...props} id="data-table" />; }

export function Pagination({ page = 1, total = 3, onChange, disabled = false, ...props }) {
  const [current, setCurrent] = React.useState(page);
  const choose = (next) => { const clamped = Math.min(total, Math.max(1, next)); if (!disabled) { setCurrent(clamped); onChange?.(clamped); } };
  return <nav className="tui-component tui-pagination" {...contract("pagination", "Pagination/Default", "default", disabled ? "disabled" : "default")} aria-label="分页" {...props}>
    <button className="tui-icon-button" type="button" aria-label="上一页" disabled={disabled || current === 1} onClick={() => choose(current - 1)}><Icon name="navigation/back" size={20} /></button>
    {Array.from({ length: total }, (_, index) => index + 1).map((value) => <button type="button" key={value} aria-current={current === value ? "page" : undefined} disabled={disabled} onClick={() => choose(value)} data-typography-role="body-l">{value}</button>)}
    <button className="tui-icon-button" type="button" aria-label="下一页" disabled={disabled || current === total} onClick={() => choose(current + 1)}><Icon name="navigation/forward" size={20} /></button>
  </nav>;
}

export function Breadcrumb({ items = ["工作空间", "项目", "设置"], onNavigate, ...props }) {
  return <nav className="tui-component tui-breadcrumb" {...contract("breadcrumb", "Breadcrumb/Default", "default", "default")} aria-label="面包屑" {...props}>{items.map((item, index) => <React.Fragment key={`${item}-${index}`}>{index > 0 && <span className="tui-breadcrumb__separator" aria-hidden="true"><Icon name="navigation/chevron-right" size={20} /></span>}{index === items.length - 1 ? <span aria-current="page" data-typography-role="subtitle-m">{item}</span> : <a href={`#${item}`} data-typography-role="body-l" onClick={(event) => { event.preventDefault(); onNavigate?.(item); }}>{item}</a>}</React.Fragment>)}</nav>;
}

export function Progress({ value = 68, label = null, ...props }) {
  const clamped = Math.min(100, Math.max(0, value));
  return <div className="tui-component tui-progress" {...contract("progress", "Progress/Default", "default", "default")} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={clamped} style={{ "--progress-value": `${clamped}%` }} {...props}>{label && <span className="tui-progress__label" data-typography-role="body-s">{label} · {clamped}%</span>}<div className="tui-progress__track"><span className="tui-progress__value" /></div></div>;
}

export function Empty({ title = "暂无项目", description = "创建项目后会显示在这里。", onCreate, ...props }) {
  return <section className="tui-component tui-empty" {...contract("empty", "Empty/Default", "default", "default")} aria-live="polite" {...props}><h4 data-slot="title" data-typography-role="title-s">{title}</h4><p data-slot="description" data-typography-role="body-m">{description}</p><button className="tui-button tui-empty__action" type="button" data-variant="primary" data-typography-role="body-l" onClick={onCreate}>新建项目</button></section>;
}

export function Label({ children = "邮箱", htmlFor = "project-name", ...props }) {
  return <label className="tui-component tui-label" {...contract("label", "Label/Default", "default", "default")} htmlFor={htmlFor} data-typography-role="body-m" {...props}>{children}</label>;
}

function Feedback({ id, tone = "info", message, action, onAction, ...props }) {
  const [visible, setVisible] = React.useState(true);
  if (!visible) return null;
  const iconName = id === "toast" && tone === "success" ? "action/check" : ({ info: "status/info", success: "status/success", warning: "status/warning", danger: "status/danger", neutral: "status/neutral" }[tone] ?? "status/info");
  const role = id === "alert" && (tone === "warning" || tone === "danger") ? "alert" : "status";
  const closeButton = <button className="tui-icon-button" data-slot="close" type="button" aria-label="关闭" onClick={() => setVisible(false)}><Icon name="action/close" size={20} /></button>;
  return <div className={`tui-component tui-${id} tui-${id}--${tone}`} {...contract(id, `${id[0].toUpperCase()}${id.slice(1)}/Default`, tone, "default")} role={role} {...props}><span className={`tui-${id}__icon`}><Icon name={iconName} size={20} /></span><span className={`tui-${id}__message`} data-slot="content" data-typography-role={id === "toast" ? "body-m" : "subtitle-s"}>{message}</span>{id === "alert" ? <span className="tui-alert__actions" data-slot="actions">{action && <button className="tui-button tui-button--ghost tui-alert__action" data-slot="action" type="button" data-variant="ghost" data-mode="text" data-size="small" data-button-type="small-ghost" data-typography-role="body-m" onClick={onAction}>{action}</button>}{closeButton}</span> : closeButton}</div>;
}

export function Alert(props) { return <Feedback id="alert" tone="info" message="系统将在今晚自动完成更新。" action="查看详情" {...props} />; }
export function Tooltip({ label = "刷新列表", content = "刷新列表", ...props }) {
  return <div className="tui-component tui-tooltip" {...contract("tooltip", "Tooltip/Default", "default", "default")} {...props}><button className="tui-button tui-button--ghost" type="button" data-variant="ghost" data-typography-role="body-l">{label}</button><span className="tui-tooltip__panel" role="tooltip" data-slot="content" data-typography-role="body-l">{content}</span></div>;
}
export function Snackbar({ title, message, subtitle, action, actionLabel = "文本按钮", leftArea, closable = true, onAction, onClose, ...props }) {
  const [visible, setVisible] = React.useState(true);
  if (!visible) return null;
  const close = () => { setVisible(false); onClose?.(); };
  const titleSubtitle = Boolean(subtitle);
  const variant = titleSubtitle ? "title-subtitle" : "title-only";
  const pixsoLeftArea = titleSubtitle ? "2" : String(leftArea ?? "1");
  const resolvedTitle = title ?? message ?? "Title";
  const renderedAction = action ?? (actionLabel ? <button className="tui-button tui-button--ghost tui-snackbar__action" type="button" data-variant="ghost" data-size="small" data-typography-role="body-m" onClick={onAction}>{actionLabel}</button> : null);
  return <div className="tui-component tui-snackbar" {...contract("snackbar", "Snackbar/Default", variant, "default", { "data-left-area": pixsoLeftArea })} role="status" {...props}><span className="tui-snackbar__main"><span className="tui-snackbar__leading" data-slot="leading"><Icon name="status/info" size={24} /></span><span className="tui-snackbar__content"><span className="tui-snackbar__title" data-slot="title" data-typography-role="subtitle-s">{resolvedTitle}</span>{titleSubtitle && <span className="tui-snackbar__subtitle" data-slot="subtitle" data-typography-role="body-s">{subtitle}</span>}</span></span><span className="tui-snackbar__actions">{renderedAction && <span className="tui-snackbar__action-slot" data-slot="action">{renderedAction}</span>}{closable && <button className="tui-icon-button tui-snackbar__close" data-slot="close" type="button" aria-label="关闭" onClick={close}><Icon name="action/close" size={20} /></button>}</span></div>;
}
/** @deprecated Use Snackbar; retained only as a source-level migration alias. */
export const Toast = Snackbar;

export { Icon, contract };
export { AlertDialog, Attachment, Calendar, Chart, ColorPicker, ContextMenu, DatePicker, Dialog, DropdownMenu, HoverCard, InputOtp, Kbd, Menubar, Popover, Slider, SemiModal, TimePicker } from "./advanced.jsx";
export * from "./generated/index.jsx";
