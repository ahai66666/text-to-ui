const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

// Titlebar branding is an image slot. The inline fallback keeps the gallery
// deterministic while callers can replace it with a product logo via
// `logoSrc`.
const defaultTitlebarLogoSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='4' fill='%230A59F7'/%3E%3Ctext x='12' y='17' text-anchor='middle' font-family='Arial,sans-serif' font-size='14' font-weight='700' fill='white'%3ET%3C/text%3E%3C/svg%3E";

import { generatedHtmlComponents } from "./generated/index.js";
import { iconMarkup } from "./icon-map.js";
import { advancedHtmlComponents, dropdownMenu } from "./advanced.js";
import { resolveTitlebarSegment, createTitlebarPreviewScenes } from "@text-to-ui/component-contracts/titlebar-segments";
export { createTitlebarSegments } from "@text-to-ui/component-contracts/titlebar-segments";
export { bindTitlebarOverflow } from "./titlebar-overflow.js";

const attrs = (id, logicalName, variant, state, extra = "") => `data-component="${id}" data-renderer-key="${id}" data-logical-component="${logicalName}" data-variant="${variant}" data-state="${state}" data-framework="html"${extra}`;
const slot = (value, fallback = "") => value === undefined || value === null ? fallback : String(value);
// Inline SVG keeps the HTML runtime deterministic for file:// previews and
// makes the imported Pixso frame carry real vector geometry instead of a
// fragile external <use> reference. Unknown requests are resolved by the
// icon map's direct-source lookup or explicit non-blocking fallback.
const icon = (name, className = "", options = {}) => iconMarkup(name, options).replace("class=\"", `class=\"${className ? `${className} ` : ""}`);

const buttonTypeName = (variant = "primary") => {
  if (variant === "secondary") return "Secondary";
  if (variant === "ghost") return "Ghost";
  return "Primary";
};

const logicalNameForButton = ({ mode = "text", variant = "primary", iconOnly = false } = {}) => {
  if (mode === "icon-text") return `Icon Text Button/${buttonTypeName(variant)}/Default`;
  if (mode === "icon") return `Icon Button/${variant === "secondary" ? "Secondary" : "Ghost"}/Default`;
  if (mode === "split-dropdown") return `Split Dropdown Button/${iconOnly ? "Icon Only" : "Icon Text"}/Default`;
  return `Button/${buttonTypeName(variant)}/Default`;
};

const buttonContent = ({ label, iconName, icon: iconAlias, mode = "text", size = "standard", iconSize = null, includeChevron = false }) => {
  const resolvedIcon = iconName ?? iconAlias;
  const iconMarkup = resolvedIcon ? `<span data-slot="icon">${icon(resolvedIcon, "", iconSize ? { size: iconSize } : {})}</span>` : "";
  const labelMarkup = mode === "icon" ? "" : `<span data-slot="label" data-typography-role="${size === "small" ? "body-m" : "body-l"}">${escapeHtml(label)}</span>`;
  // Button dropdown chevrons use the shared 20px medium icon rule. Keep the
  // SVG's data-icon-size in sync with its CSS box and 1.25px outline weight.
  const chevronMarkup = includeChevron ? `<span data-slot="trigger">${icon("navigation/chevron-down", "", { size: 20 })}</span>` : "";
  return `${iconMarkup}${labelMarkup}${chevronMarkup}`;
};

const renderButton = ({
  label = "新建项目",
  variant = "primary",
  size = "standard",
  mode = "text",
  logicalName,
  iconName,
  icon,
  iconSize = null,
  disabled = false,
  state,
  className = "",
  extraAttrs = ""
} = {}) => {
  const resolvedState = state ?? (disabled ? "disabled" : "default");
  const resolvedLogicalName = logicalName ?? logicalNameForButton({ mode, variant });
  const disabledAttr = disabled ? " disabled" : "";
  const modeClass = mode === "icon" ? " tui-button--icon" : "";
  const typeAttrs = mode === "icon" ? ` aria-label="${escapeHtml(label)}"` : "";
  return `<button class="tui-component tui-button${modeClass}${className ? ` ${className}` : ""}" type="button" ${attrs("button", resolvedLogicalName, variant, resolvedState, ` data-mode="${mode}" data-size="${size}"`)}${typeAttrs}${extraAttrs}${disabledAttr}>${buttonContent({ label, iconName, icon, mode, size, iconSize })}</button>`;
};

const renderSplitDropdown = ({ label = "导出文件", iconName = "action/download", disabled = false, iconOnly = false, menuItems = ["导出为 PDF", "复制分享链接", "发送到设备"] } = {}) => {
  const state = disabled ? "disabled" : "default";
  const logicalName = logicalNameForButton({ mode: "split-dropdown", iconOnly });
  const mainLabel = iconOnly ? "" : `<span data-slot="label" data-typography-role="body-l">${escapeHtml(label)}</span>`;
  // Split-button leading icons are 20px (1.25px outline), while the
  // adjacent chevron is the smaller 16px control icon.
  const mainIcon = `<span data-slot="icon">${icon(iconName, "", { size: 20 })}</span>`;
  const main = `<button class="tui-component tui-button tui-split-button__main${iconOnly ? " tui-split-button__main--icon" : ""}" type="button" ${attrs("button", logicalName, "ghost", state, ` data-mode="split-dropdown" data-size="standard"`)}${iconOnly ? ` aria-label="${escapeHtml(label)}"` : ""}${disabled ? " disabled" : ""}>${mainIcon}${mainLabel}</button>`;
  const trigger = `<button class="tui-component tui-button tui-split-button__trigger" type="button" ${attrs("button", logicalName, "ghost", state, ` data-mode="split-dropdown" data-size="standard"`)} aria-label="展开更多操作" aria-haspopup="menu" aria-expanded="false"${disabled ? " disabled" : ""}>${icon("navigation/chevron-down", "", { size: 16 })}</button>`;
  const menu = menuItems.map((item) => `<button class="tui-button-dropdown__item" type="button" role="menuitem">${escapeHtml(item)}</button>`).join("");
  return `<div class="tui-component tui-split-button${iconOnly ? " tui-split-button--icon" : ""}" data-component="button" data-logical-component="${logicalName}" data-variant="ghost" data-state="${state}" data-mode="split-dropdown" data-framework="html"><div class="tui-split-button__control">${main}${trigger}</div><div class="tui-button-dropdown__menu" role="menu" hidden>${menu}</div></div>`;
};

let nextInputTagEntryId = 0;

const renderInputTagChip = (label) => `<span class="tui-component tui-chip tui-input-tag-entry__chip" data-component="chips" data-logical-component="Chips/Default" data-variant="text-only-closable" data-state="default" data-framework="html" data-tag-value="${escapeHtml(label)}"><span class="tui-chip__leading" data-slot="leading"></span><span class="tui-chip__label" data-slot="label" data-typography-role="body-m">${escapeHtml(label)}</span><button class="tui-chip__close" data-slot="close" data-remove-tag type="button" aria-label="移除 ${escapeHtml(label)}">${icon("action/close", "", { size: 16 })}</button></span>`;

const inputTagEntryState = ({ surface = "white", state = "default", label = "成员", placeholder = "输入文本后按 Enter 选择", disabled = false, value = "", options = [], tags = [], id } = {}) => {
  const resolvedState = disabled ? "disabled" : state;
  const inputId = id ?? `tui-input-tag-entry-${++nextInputTagEntryId}`;
  const labelId = `${inputId}-label`;
  const listboxId = `${inputId}-suggestions`;
  const suggestions = Array.isArray(options) ? options.filter((option) => option !== null && option !== undefined && String(option).trim()) : [];
  const selectedTags = Array.isArray(tags) ? tags.map(String) : [];
  const chips = selectedTags.map(renderInputTagChip).join("");
  const optionsMarkup = suggestions.map((option, index) => {
    const text = String(option);
    return `<button id="${escapeHtml(listboxId)}-option-${index + 1}" class="tui-advanced-menu__item" type="button" role="option" aria-selected="false" data-option-value="${escapeHtml(text)}" data-typography-role="body-l">${escapeHtml(text)}</button>`;
  }).join("");
  const valueAttr = value ? ` value="${escapeHtml(value)}"` : "";
  const componentAttrs = attrs(
    "input",
    "Input/Tag Entry/Default",
    "tag-entry",
    resolvedState,
    ` data-surface="${escapeHtml(surface)}" data-input-tag-entry`
  );
  return [
    `<div class="tui-component tui-input tui-input--tag-entry" ${componentAttrs} role="group" aria-labelledby="${escapeHtml(labelId)}">`,
    `<label class="tui-input-tag-entry__label" id="${escapeHtml(labelId)}" for="${escapeHtml(inputId)}" data-slot="label" data-typography-role="body-l">${escapeHtml(label)}</label>`,
    `<div class="tui-input-tag-entry__editor">`,
    `<div class="tui-input-tag-entry__tags" data-slot="tags" role="list" aria-label="${escapeHtml(label)}已选">${chips}</div>`,
    `<input id="${escapeHtml(inputId)}" class="tui-input-tag-entry__input" data-slot="value" data-typography-role="body-l" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${escapeHtml(listboxId)}" aria-labelledby="${escapeHtml(labelId)}" autocomplete="off" placeholder="${escapeHtml(placeholder)}"${valueAttr}${disabled ? " disabled" : ""} />`,
    `<div id="${escapeHtml(listboxId)}" class="tui-advanced-menu__panel tui-input-tag-entry__menu" role="listbox" aria-label="${escapeHtml(label)}建议" hidden>${optionsMarkup}<div class="tui-input-tag-entry__empty" data-empty-state hidden>无匹配项</div></div>`,
    `</div></div>`
  ].join("");
};

const inputState = ({ surface = "white", state = "default", placeholder = "项目名称", disabled = false, value = "", variant = "default", ...options } = {}) => {
  if (variant === "tag-entry") return inputTagEntryState({ surface, state, placeholder, disabled, value, ...options });
  const resolvedState = disabled ? "disabled" : state;
  // Surface describes the host context; the logical component remains the
  // single contract entry used by React and Vue.
  const logicalName = "Input/White Surface/Default";
  const valueAttr = value ? ` value="${escapeHtml(value)}"` : "";
  return `<label class="tui-component tui-input" ${attrs("input", logicalName, "default", resolvedState, ` data-surface="${surface}"`)}><input data-slot="value" data-typography-role="body-l" type="text" placeholder="${escapeHtml(placeholder)}" aria-label="${escapeHtml(placeholder)}"${valueAttr}${disabled ? " disabled" : ""}${state === "error" ? " aria-invalid=\"true\"" : ""} /></label>`;
};

export function bindInputTagEntry(root = document) {
  if (!root?.addEventListener) return () => {};
  const ownerDocument = root.ownerDocument ?? (root.nodeType === 9 ? root : globalThis.document);
  const getEntry = (target) => target?.closest?.("[data-input-tag-entry]");
  const getInput = (entry) => entry?.querySelector(".tui-input-tag-entry__input");
  const getOptions = (entry) => [...(entry?.querySelectorAll('.tui-input-tag-entry__menu [role="option"]') ?? [])].filter((option) => !option.hidden);
  const getSelectedTags = (entry) => [...(entry?.querySelectorAll("[data-tag-value]") ?? [])].map((tag) => tag.dataset.tagValue ?? "");
  const emitTags = (entry) => entry.dispatchEvent(new CustomEvent("inputtagchange", { bubbles: true, detail: { tags: getSelectedTags(entry) } }));

  const clearActive = (entry) => {
    entry.__tuiInputTagActiveIndex = -1;
    entry.querySelectorAll('.tui-input-tag-entry__menu [role="option"]').forEach((option) => option.setAttribute("aria-selected", "false"));
    getInput(entry)?.removeAttribute("aria-activedescendant");
  };
  const refreshOptions = (entry) => {
    const input = getInput(entry);
    const query = String(input?.value ?? "").trim().toLocaleLowerCase();
    const selected = new Set(getSelectedTags(entry).map((tag) => tag.toLocaleLowerCase()));
    let visibleCount = 0;
    entry.querySelectorAll('.tui-input-tag-entry__menu [role="option"]').forEach((option) => {
      const value = option.dataset.optionValue ?? option.textContent.trim();
      const visible = !selected.has(value.toLocaleLowerCase()) && (!query || value.toLocaleLowerCase().includes(query));
      option.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    const empty = entry.querySelector("[data-empty-state]");
    if (empty) empty.hidden = visibleCount > 0;
    clearActive(entry);
    return getOptions(entry);
  };
  const setOpen = (entry, open) => {
    const input = getInput(entry);
    const menu = entry.querySelector(".tui-input-tag-entry__menu");
    if (!input || !menu) return;
    if (open) refreshOptions(entry);
    menu.hidden = !open;
    input.setAttribute("aria-expanded", String(open));
    entry.dataset.menuOpen = String(open);
    if (!open) clearActive(entry);
  };
  const setActive = (entry, index) => {
    const options = getOptions(entry);
    if (options.length === 0) return clearActive(entry);
    const normalizedIndex = (index + options.length) % options.length;
    clearActive(entry);
    entry.__tuiInputTagActiveIndex = normalizedIndex;
    options[normalizedIndex].setAttribute("aria-selected", "true");
    getInput(entry)?.setAttribute("aria-activedescendant", options[normalizedIndex].id);
  };
  const selectOption = (entry, option) => {
    const value = option.dataset.optionValue ?? option.textContent.trim();
    if (!value || getSelectedTags(entry).some((tag) => tag.toLocaleLowerCase() === value.toLocaleLowerCase())) return;
    const tags = entry.querySelector('[data-slot="tags"]');
    if (!tags) return;
    tags.insertAdjacentHTML("beforeend", renderInputTagChip(value));
    const input = getInput(entry);
    if (input) {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    }
    setOpen(entry, false);
    emitTags(entry);
  };

  const onPointerDown = (event) => {
    const option = event.target.closest?.('.tui-input-tag-entry__menu [role="option"]');
    if (option && !option.hidden) {
      // Commit on pointer down so focus never leaves the input before the
      // option can be chosen; keyboard activation remains handled on Enter.
      event.preventDefault();
      const entry = getEntry(option);
      if (entry && root.contains(entry)) selectOption(entry, option);
      return;
    }
    if (event.target.closest?.("[data-remove-tag]")) event.preventDefault();
  };
  const onClick = (event) => {
    const entry = getEntry(event.target);
    if (!entry || !root.contains(entry)) return;
    const option = event.target.closest?.('.tui-input-tag-entry__menu [role="option"]');
    if (option && !option.hidden) {
      event.preventDefault();
      selectOption(entry, option);
      return;
    }
    const removeButton = event.target.closest?.("[data-remove-tag]");
    if (removeButton) {
      event.preventDefault();
      removeButton.closest("[data-tag-value]")?.remove();
      refreshOptions(entry);
      getInput(entry)?.focus();
      emitTags(entry);
    }
  };
  const onInput = (event) => {
    if (!event.target.matches?.(".tui-input-tag-entry__input")) return;
    const entry = getEntry(event.target);
    if (entry?.dataset.menuOpen === "true") refreshOptions(entry);
  };
  const onKeyDown = (event) => {
    const input = event.target;
    if (!input.matches?.(".tui-input-tag-entry__input")) return;
    const entry = getEntry(input);
    if (!entry) return;
    const open = entry.dataset.menuOpen === "true";
    if (event.key === "Enter") {
      event.preventDefault();
      if (!open) {
        setOpen(entry, true);
        return;
      }
      const active = getOptions(entry)[entry.__tuiInputTagActiveIndex ?? -1];
      if (active) selectOption(entry, active);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(entry, true);
        const options = getOptions(entry);
        setActive(entry, event.key === "ArrowDown" ? 0 : options.length - 1);
        return;
      }
      const options = getOptions(entry);
      const currentIndex = entry.__tuiInputTagActiveIndex ?? -1;
      setActive(entry, event.key === "ArrowDown" ? currentIndex + 1 : currentIndex < 0 ? options.length - 1 : currentIndex - 1);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(entry, false);
    }
  };
  const onFocusOut = (event) => {
    const entry = getEntry(event.target);
    if (entry && root.contains(entry) && !entry.contains(event.relatedTarget)) setOpen(entry, false);
  };
  const onDocumentPointerDown = (event) => {
    for (const entry of root.querySelectorAll("[data-input-tag-entry]")) {
      if (!entry.contains(event.target)) setOpen(entry, false);
    }
  };

  root.addEventListener("pointerdown", onPointerDown);
  // Handle option/removal clicks before the gallery's delegated menu handler
  // can close the shared select menu and make the clicked option hidden.
  root.addEventListener("click", onClick, true);
  root.addEventListener("input", onInput);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("focusout", onFocusOut);
  ownerDocument?.addEventListener("pointerdown", onDocumentPointerDown);
  return () => {
    root.removeEventListener("pointerdown", onPointerDown);
    root.removeEventListener("click", onClick, true);
    root.removeEventListener("input", onInput);
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("focusout", onFocusOut);
    ownerDocument?.removeEventListener("pointerdown", onDocumentPointerDown);
  };
}

const searchSupportedStates = new Set(["default", "focus", "typing", "filled", "hover-left", "hover-right", "pressed-left", "pressed-right", "disabled"]);
const searchState = ({ surface = "white", state = "default", placeholder = "搜索项目", disabled = false, value = "", advancedSearch = false, advancedSearchLabel = "高级", scope, defaultScope, scopeOptions = [], scopeLabel = "搜索范围" } = {}) => {
  const requestedState = searchSupportedStates.has(state) ? state : "default";
  const isDisabled = disabled || requestedState === "disabled";
  const resolvedState = isDisabled ? "disabled" : requestedState !== "default" ? requestedState : value ? "filled" : "default";
  const valueAttr = value ? ` value="${escapeHtml(value)}"` : "";
  const options = Array.isArray(scopeOptions) ? scopeOptions.filter(Boolean) : [];
  const scoped = options.length > 0;
  const selectedScope = scope ?? defaultScope ?? options[0] ?? "";
  const scopeSelector = scoped ? dropdownMenu({ label: scopeLabel, value: selectedScope, items: options, className: "tui-search__scope", slotName: "scope-selector", ariaLabel: scopeLabel, disabled: isDisabled, hideLabel: true, compact: true, scopeOptions: true }) : "";
  const variant = scoped ? advancedSearch ? "scoped-advanced-search" : "scoped-search" : advancedSearch ? "advanced-search" : "default";
  const logicalName = scoped ? "Search/Scoped/Default" : "Search/White Surface/Default";
  return `<label class="tui-component tui-search" ${attrs("search", logicalName, variant, resolvedState, ` data-surface="${surface}"`)}>${scopeSelector}<span class="tui-search__input-region" data-search-input-region><span data-slot="leading">${icon("field/search", "", { size: 16 })}</span><input data-slot="value" data-typography-role="body-l" type="search" placeholder="${escapeHtml(placeholder)}" aria-label="${escapeHtml(placeholder)}"${valueAttr}${isDisabled ? " disabled" : ""} /><button class="tui-icon-button" data-slot="clear" type="button" aria-label="清除"${isDisabled ? " disabled" : ""}${value ? "" : " hidden"}>${icon("action/close", "", { size: 16 })}</button>${advancedSearch ? `<button class="tui-component tui-button tui-button--ghost tui-search__advanced" data-component="button" data-logical-component="Button/Ghost/Default" data-variant="ghost" data-state="${resolvedState}" data-framework="html" data-mode="text" data-size="small" data-slot="advanced-search" type="button" aria-label="${escapeHtml(advancedSearchLabel)}" aria-haspopup="dialog"${isDisabled ? " disabled" : ""}><span data-slot="label" data-typography-role="body-m">${escapeHtml(advancedSearchLabel)}</span></button>` : ""}</span></label>`;
};

const titlebarActionType = (action) => {
  const type = action.buttonType ?? (action.showLabel ? "icon-text-ghost" : "icon");
  if (!["icon", "icon-text-ghost"].includes(type)) throw new Error(`Titlebar main-detail-actions only accepts icon or icon-text-ghost; received ${type}`);
  return type;
};

const isTitlebarOverflowTrigger = (action) => Boolean(action?.overflowTrigger) || action?.id === "more" || action?.icon === "action/more";

/**
 * Main Detail is one business-action group.  Its visible controls must use
 * one visual mode; the More control is the only deliberate exception.  Older
 * page data may still contain mixed buttonType values, so the HTML adapter
 * normalizes the group to the first business action's mode before rendering.
 * This keeps the emitted page deterministic while making the contract
 * observable through data-action-mode/data-mode-normalized.
 */
const normalizeTitlebarActions = (actions = [], actionOverflow = {}) => {
  const input = Array.isArray(actions) ? actions.filter(Boolean) : [];
  const business = input.filter((action) => !isTitlebarOverflowTrigger(action));
  const firstType = business.length ? titlebarActionType(business[0]) : "icon";
  const normalizedBusiness = business.map((action) => ({
    ...action,
    buttonType: firstType,
    showLabel: firstType === "icon-text-ghost"
  }));
  const suppliedTrigger = input.find(isTitlebarOverflowTrigger);
  const trigger = {
    id: "more",
    label: suppliedTrigger?.label ?? "更多操作",
    icon: suppliedTrigger?.icon ?? "action/more",
    buttonType: "icon",
    overflowTrigger: true,
    ...(suppliedTrigger ?? {})
  };
  trigger.id = "more";
  trigger.buttonType = "icon";
  trigger.overflowTrigger = true;
  return {
    business: normalizedBusiness,
    trigger,
    mode: firstType === "icon-text-ghost" ? "icon-text" : "icon",
    strategy: actionOverflow?.strategy ?? "collapse-to-more",
    fit: actionOverflow?.fit ?? "available-width",
    normalized: business.some((action) => titlebarActionType(action) !== firstType)
  };
};

const titlebarState = (options = {}) => {
  let { label = "项目空间", paneTitle = "项目内容", size = "large", state = "default", disabled = false, layout, paneRole, mainContentLeading, mainDetailActions = [], secondaryPaneContent, actionOverflow = {}, showLogo, logoSrc = defaultTitlebarLogoSrc, logoAlt = "", showWindowControls } = resolveTitlebarSegment(options);
  // Pattern region names are public API; preserve the legacy styling role.
  if (paneRole === "main-detail" || paneRole === "main-content") paneRole = "final-pane";
  const controlIconSize = size === "small" ? 16 : 24;
  const actionModel = normalizeTitlebarActions(mainDetailActions, actionOverflow);
  const paneActions = layout === "three-column" && paneRole === "final-pane" && mainDetailActions.length ? `<div class="tui-titlebar__pane-actions" data-slot="main-detail-actions" data-action-scope="main-detail-pane-global" data-action-overflow="${escapeHtml(actionModel.strategy)}" data-action-overflow-fit="${escapeHtml(actionModel.fit)}" data-action-mode="${actionModel.mode}"${actionModel.normalized ? ` data-mode-normalized="true"` : ""} aria-label="Main Detail 栏级操作">${actionModel.business.map((action) => {
    const buttonType = titlebarActionType(action);
    const iconOnly = buttonType === "icon";
    return renderButton({
      label: action.label,
      variant: "ghost",
      mode: iconOnly ? "icon" : "icon-text",
      logicalName: iconOnly ? "Icon Button/Ghost/Default" : "Icon Text Button/Ghost/Default",
      iconName: action.icon ?? "action/more",
      disabled: disabled || action.disabled,
      state: disabled || action.disabled ? "disabled" : "default",
      className: `tui-titlebar__pane-action${iconOnly ? "" : " tui-titlebar__pane-action--text"}`,
      extraAttrs: ` data-slot="main-detail-action" data-action="${escapeHtml(action.id)}" data-button-type="${buttonType}" data-overflow-item="true"`
    });
  }).join("")}<button class="tui-component tui-button tui-button--icon tui-titlebar__pane-action tui-titlebar__overflow-trigger" type="button" ${attrs("button", "Icon Button/Ghost/Default", "ghost", disabled ? "disabled" : "default", ` data-mode="icon" data-size="standard" data-slot="main-detail-action" data-action="more" data-button-type="icon" data-overflow-trigger="true" data-overflow-item="false" aria-label="${escapeHtml(actionModel.trigger.label)}" aria-haspopup="menu" aria-expanded="false"`)}${disabled ? " disabled" : ""}>${buttonContent({ label: actionModel.trigger.label, iconName: actionModel.trigger.icon, mode: "icon", size: "standard" })}</button><div class="tui-titlebar__overflow-menu" role="menu" hidden>${actionModel.business.map((action) => `<button class="tui-titlebar__overflow-item" type="button" role="menuitem" data-overflow-menu-item="true" data-action="${escapeHtml(action.id)}"${disabled || action.disabled ? " disabled" : ""}>${icon(action.icon ?? "action/more", "", { size: 20 })}<span data-slot="label">${escapeHtml(action.label ?? action.id)}</span></button>`).join("")}</div></div>` : "";
  const contentLeadingType = mainContentLeading?.buttonType ?? "icon";
  const contentLeadingSlot = paneRole === "final-pane" && layout === "two-column" && mainContentLeading ? `<div class="tui-titlebar__pane-leading" data-slot="main-content-leading" data-action-scope="main-content-pane-global"><button class="tui-component tui-button${contentLeadingType === "icon" ? " tui-button--icon" : ""} tui-titlebar__pane-leading-action" type="button" ${attrs("button", contentLeadingType === "icon" ? "Icon Button/Ghost/Default" : "Icon Text Button/Ghost/Default", "ghost", disabled || mainContentLeading.disabled ? "disabled" : "default", ` data-mode="${contentLeadingType === "icon" ? "icon" : "icon-text"}" data-size="standard" data-slot="main-content-leading-action" data-action="${escapeHtml(mainContentLeading.id)}" data-button-type="${escapeHtml(contentLeadingType)}" aria-label="${escapeHtml(mainContentLeading.label)}"`)}${disabled || mainContentLeading.disabled ? " disabled" : ""}><span data-slot="icon">${icon(mainContentLeading.icon, "", { size: 24 })}</span>${contentLeadingType === "icon-text-ghost" ? `<span data-slot="label" data-typography-role="body-l">${escapeHtml(mainContentLeading.label)}</span>` : ""}</button></div>` : "";
  const paneTitleTypographyRole = size === "small" ? "subtitle-m" : "title-s";
  const paneTitleSlot = paneRole === "final-pane" && (layout === "two-column" || layout === "standalone") ? `<strong class="tui-titlebar__pane-title" data-slot="main-content-title" data-action-scope="main-content-pane-global" data-typography-role="${paneTitleTypographyRole}">${escapeHtml(paneTitle)}</strong>` : "";
  const secondaryContentSlot = paneRole === "secondary-pane" && secondaryPaneContent ? `<div class="tui-titlebar__secondary-content" data-slot="secondary-pane-content" data-component-slot="registered-component">${searchState(secondaryPaneContent.props ?? {})}</div>` : "";
  const logoSlot = showLogo ? `<span class="tui-titlebar__logo-slot" data-slot="logo"><img class="tui-titlebar__logo" src="${escapeHtml(logoSrc ?? defaultTitlebarLogoSrc)}" alt="${escapeHtml(logoAlt)}" aria-hidden="${logoAlt ? "false" : "true"}" /></span>` : "";
  const brand = paneRole === "global" || paneRole === "primary-navigation" ? `<span class="tui-titlebar__brand" data-slot="leading">${logoSlot}<span data-slot="label" data-typography-role="subtitle-m">${escapeHtml(label)}</span></span>` : "";
  const windowActions = showWindowControls ? `<div class="tui-titlebar__actions" data-slot="actions" data-component="titlebar-controls" data-logical-component="Titlebar Controls/Normal" data-size="medium">${[
    ["minimize", "最小化"],
    ["maximize", "最大化"],
    ["close", "关闭"]
  ].map(([action, text]) => renderButton({ label: text, variant: "ghost", size: "standard", mode: "icon", logicalName: "Icon Button/Ghost/Default", icon: `window/${action}`, iconSize: controlIconSize, disabled, className: "tui-titlebar__action", extraAttrs: ` data-slot="titlebar-action" data-action="${action}" data-button-type="icon"` })).join("")}</div>` : "";
  return `<header class="tui-component tui-titlebar" ${attrs("titlebar", "Titlebar/Default", size, disabled ? "disabled" : state)} data-size="${escapeHtml(size)}" data-layout="${escapeHtml(layout)}" data-pane-role="${escapeHtml(paneRole)}">${brand}${paneRole !== "global" && paneRole !== "primary-navigation" ? logoSlot : ""}${secondaryContentSlot}${contentLeadingSlot}${paneTitleSlot}${paneActions}${windowActions}</header>`;
};

const textareaState = ({ surface = "white", state = "default", label = "项目说明", value = "统一 HarmonyOS PC 客户端中的布局、组件与交互规则。", disabled = false } = {}) => `<label class="tui-component tui-textarea" ${attrs("textarea", "Textarea/Default", "default", disabled ? "disabled" : state, ` data-surface="${surface}"`)}><span data-slot="label" data-typography-role="body-m">${escapeHtml(label)}</span><textarea data-slot="value" data-typography-role="body-l" rows="3" placeholder="请输入内容"${disabled ? " disabled" : ""}${state === "error" ? " aria-invalid=\"true\"" : ""}>${escapeHtml(value)}</textarea><span data-slot="help" data-typography-role="body-s">支持多行输入，最多 500 字</span></label>`;

const fieldState = ({ surface = "white", state = "default", label = "项目名称", value = "客户端设计系统", disabled = false } = {}) => `<label class="tui-component tui-field" ${attrs("field", "Field/Default", "default", disabled ? "disabled" : state, ` data-surface="${surface}"`)}><span data-slot="label" data-typography-role="body-m">${escapeHtml(label)}</span><span class="tui-field__control"><input data-slot="value" data-typography-role="body-l" type="text" value="${escapeHtml(value)}"${disabled ? " disabled" : ""}${state === "error" ? " aria-invalid=\"true\"" : ""}/></span><span data-slot="help" data-typography-role="body-s">这是一个必填字段</span></label>`;
const formFieldState = ({ surface = "white", control = "input", required = false, error = "", value = "客户端设计系统" } = {}) => {
  const label = control === "select" ? "项目状态" : "项目名称";
  const input = `<label class="tui-component tui-input" ${attrs("input", "Input/White Surface/Default", "default", error ? "error" : "default", ` data-surface="${surface}"`)}><input data-slot="value" data-typography-role="body-l" type="text" value="${escapeHtml(value)}" aria-label="${label}"${error ? " aria-invalid=\"true\"" : ""}/></label>`;
  const select = `<div class="tui-component tui-select tui-form-field__select" ${attrs("select", "Select/Default", "default", error ? "error" : "default", ` data-surface="${surface}"`)}><button class="tui-select__trigger" type="button" aria-label="${label}" aria-haspopup="listbox" aria-expanded="false"><span data-slot="value" data-typography-role="body-m">进行中</span>${icon("navigation/chevron-down", "", { size: 16 })}</button><div class="tui-select__menu" role="listbox" aria-label="${label}" hidden><button type="button" role="option" aria-selected="true" data-typography-role="body-l">进行中</button><button type="button" role="option" aria-selected="false" data-typography-role="body-l">已完成</button></div></div>`;
  return `<section class="tui-component tui-form-field" ${attrs("form-field", "Form Field/Default", control, error ? "error" : "default", ` data-surface="${surface}" data-required="${required}"`)}><span data-slot="label" data-typography-role="subtitle-s">${required ? '<span class="tui-form-field__required" aria-hidden="true">*</span>' : ""}${label}</span><div class="tui-form-field__control" data-slot="control">${control === "select" ? select : input}</div>${error ? `<span class="tui-form-field__error" data-slot="error" role="alert" data-typography-role="body-s">${escapeHtml(error)}</span>` : ""}</section>`;
};

const menuItems = ["进行中", "已完成", "已归档"];
const selectState = ({ id = "select", label = "状态", value = "进行中", open = false, disabled = false, surface = "white" } = {}) => `<div class="tui-component tui-select" ${attrs(id, `${id === "combobox" ? "Combobox" : "Select"}/Default`, "default", disabled ? "disabled" : "default", ` data-surface="${surface}"`)}><span data-slot="label" data-typography-role="body-m">${escapeHtml(label)}</span><button class="tui-select__trigger" type="button" role="${id === "combobox" ? "combobox" : "button"}" aria-haspopup="listbox" aria-expanded="${open}"${disabled ? " disabled" : ""}><span data-slot="value" data-typography-role="body-m">${escapeHtml(value)}</span>${icon("navigation/chevron-down", "", { size: 16 })}</button><div class="tui-select__menu" role="listbox" hidden><button type="button" role="option" aria-selected="true" data-value="${escapeHtml(value)}" data-typography-role="body-l">${escapeHtml(value)}</button>${menuItems.filter((item) => item !== value).map((item) => `<button type="button" role="option" aria-selected="false" data-value="${escapeHtml(item)}" data-typography-role="body-l">${escapeHtml(item)}</button>`).join("")}</div></div>`;
const comboboxMenuItems = ["思源黑体", "源然雅黑", "鸿蒙黑体", "宋体", "黑体"];
const comboboxState = ({ label = "字体", value = "思源黑体", options = comboboxMenuItems, disabled = false, surface = "white" } = {}) => `<div class="tui-component tui-select tui-combobox" ${attrs("combobox", "Combobox/Default", "default", disabled ? "disabled" : "default", ` data-surface="${surface}"`)}><span data-slot="label" data-typography-role="body-m">${escapeHtml(label)}</span><div class="tui-select__trigger tui-combobox__trigger"><input class="tui-combobox__input" data-slot="value" data-typography-role="body-m" type="text" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="combobox-options" aria-autocomplete="list" autocomplete="off" data-filter-active="false" value="${escapeHtml(value)}"${disabled ? " disabled" : ""} /><span class="tui-combobox__chevron" aria-hidden="true">${icon("navigation/chevron-down", "", { size: 16 })}</span></div><div id="combobox-options" class="tui-select__menu" role="listbox" aria-label="${escapeHtml(label)}" hidden>${options.map((option, index) => `<button type="button" role="option" aria-selected="${index === 0}" data-value="${escapeHtml(option)}" data-typography-role="body-l">${escapeHtml(option)}</button>`).join("")}</div></div>`;

const nativeSelectState = ({ label = "视图", value = "列表视图", disabled = false, surface = "white" } = {}) => `<label class="tui-component tui-native-select" ${attrs("native-select", "Native Select/Default", "default", disabled ? "disabled" : "default", ` data-surface="${surface}"`)}><span data-slot="label" data-typography-role="body-m">${escapeHtml(label)}</span><span class="tui-native-select__control"><select data-slot="value" data-typography-role="body-m"${disabled ? " disabled" : ""}><option${value === "列表视图" ? " selected" : ""}>列表视图</option><option${value === "网格视图" ? " selected" : ""}>网格视图</option><option${value === "紧凑视图" ? " selected" : ""}>紧凑视图</option></select>${icon("navigation/chevron-down", "", { size: 16 })}</span></label>`;

const checkboxIndicator = () => `<span class="tui-checkbox__indicator" aria-hidden="true">${icon("choice/check", "tui-checkbox__icon", { size: 16 })}</span>`;
const checkboxState = ({ checked = true, disabled = false, label = "同步到云端", description = "保存后自动同步", name, value, ariaLabel } = {}) => `<label class="tui-component tui-choice tui-checkbox" ${attrs("checkbox", "Checkbox/Default", "default", disabled ? "disabled" : checked ? "selected" : "default")}${ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : ""}><input type="checkbox"${checked ? " checked" : ""}${disabled ? " disabled" : ""}${name ? ` name="${escapeHtml(name)}"` : ""}${value ? ` value="${escapeHtml(value)}"` : ""}/>${checkboxIndicator()}${label ? `<span data-slot="label" data-typography-role="body-m">${escapeHtml(label)}</span>` : ""}${description ? `<span data-slot="description" data-typography-role="body-m">${escapeHtml(description)}</span>` : ""}</label>`;
const radioState = ({ checked = false, disabled = false, label = "邮件", name = "runtime-radio", value = "邮件", ariaLabel } = {}) => `<label class="tui-component tui-choice tui-radio" ${attrs("radio", "Radio/Unselected/Default", checked ? "selected" : "unselected", disabled ? "disabled" : checked ? "selected" : "default")}${ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : ""}><input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(value)}"${checked ? " checked" : ""}${disabled ? " disabled" : ""}/><span class="tui-radio__indicator" data-slot="control" aria-hidden="true"></span>${label ? `<span data-slot="label" data-typography-role="body-m">${escapeHtml(label)}</span>` : ""}</label>`;
const radioGroupState = ({ value = "邮件" } = {}) => `<fieldset class="tui-component tui-choice tui-radio-group" ${attrs("radio-group", "Radio Group/Default", "default", "default")}><legend data-slot="label" data-typography-role="body-m">通知方式</legend><label><input type="radio" name="runtime-radio" value="邮件"${value === "邮件" ? " checked" : ""}/><span class="tui-radio__indicator" aria-hidden="true"></span><span data-typography-role="body-m">邮件</span></label><label><input type="radio" name="runtime-radio" value="站内消息"${value === "站内消息" ? " checked" : ""}/><span class="tui-radio__indicator" aria-hidden="true"></span><span data-typography-role="body-m">站内消息</span></label></fieldset>`;
const switchState = ({ checked = true, disabled = false } = {}) => `<label class="tui-component tui-choice tui-switch" ${attrs("switch", "Switch/Default", "default", disabled ? "disabled" : checked ? "selected" : "default")}><input type="checkbox" role="switch"${checked ? " checked" : ""}${disabled ? " disabled" : ""}/><span class="tui-switch__track" aria-hidden="true"></span><span data-slot="label" data-typography-role="body-m">自动同步</span><span data-slot="description" data-typography-role="body-m">已开启</span></label>`;
const segmentedButtonState = ({ label = "视图模式", options = ["列表", "看板", "时间线"], value = options[0], disabled = false } = {}) => `<div class="tui-component tui-segmented-button" ${attrs("segmented-button", "Segmented Button/Default", "default", disabled ? "disabled" : "default")} role="group" aria-label="${escapeHtml(label)}">${options.map((option) => `<button type="button" class="tui-segmented-button__item${option === value ? " is-selected" : ""}" aria-pressed="${option === value}" data-value="${escapeHtml(option)}" data-slot="option" data-typography-role="body-m"${disabled ? " disabled" : ""}>${escapeHtml(option)}</button>`).join("")}</div>`;
const numberSelectorState = ({ label = "数量", value = 1, min = 0, max = 99, step = 1, disabled = false } = {}) => `<label class="tui-component tui-number-selector" ${attrs("number-selector", "Number Selector/Default", "default", disabled ? "disabled" : "default")}><span data-slot="label" data-typography-role="body-m">${escapeHtml(label)}</span><span class="tui-number-selector__control"><input type="number" data-slot="value" data-typography-role="body-l" value="${Number(value)}" min="${Number(min)}" max="${Number(max)}" step="${Number(step)}"${disabled ? " disabled" : ""}/><span class="tui-number-selector__stepper" aria-label="调整${escapeHtml(label)}"><button type="button" class="tui-number-selector__step" data-slot="increment" data-direction="increment" aria-label="增加${escapeHtml(label)}"${disabled ? " disabled" : ""}>${icon("navigation/chevron-up", "", { size: 16 })}</button><button type="button" class="tui-number-selector__step" data-slot="decrement" data-direction="decrement" aria-label="减少${escapeHtml(label)}"${disabled ? " disabled" : ""}>${icon("navigation/chevron-down", "", { size: 16 })}</button></span></span></label>`;
const tabsState = () => `<div class="tui-component tui-tabs" ${attrs("tabs", "Tabs/Default", "default", "default")}><div class="tui-tabs__list" role="tablist" aria-label="项目视图"><button type="button" role="tab" aria-selected="true" class="is-selected" data-tab="overview" data-typography-role="body-l">概览</button><button type="button" role="tab" aria-selected="false" data-tab="projects" data-typography-role="body-l">项目</button><button type="button" role="tab" aria-selected="false" data-tab="members" data-typography-role="body-l">成员</button></div><div class="tui-tabs__panel" role="tabpanel" data-tab-panel="overview" data-typography-role="body-l">工作空间概览</div></div>`;
const subTabsState = () => `<div class="tui-component tui-sub-tabs" ${attrs("sub-tabs", "Sub Tabs/Default", "default", "default")}><div class="tui-sub-tabs__list" role="tablist" aria-label="子页签"><button type="button" role="tab" id="sub-tab-overview" aria-controls="sub-tabs-panel" aria-selected="true" tabindex="0" class="is-selected" data-tab="overview" data-typography-role="subtitle-m">概览</button><button type="button" role="tab" id="sub-tab-activity" aria-controls="sub-tabs-panel" aria-selected="false" tabindex="-1" data-tab="activity" data-typography-role="body-l">活动</button><button type="button" role="tab" id="sub-tab-settings" aria-controls="sub-tabs-panel" aria-selected="false" tabindex="-1" data-tab="settings" data-typography-role="body-l">设置</button></div><div class="tui-sub-tabs__panel" id="sub-tabs-panel" role="tabpanel" aria-labelledby="sub-tab-overview" data-tab-panel="overview" data-slot="content" data-typography-role="body-l">项目概览</div></div>`;
const treeViewNodes = [
  { id: "workspace", label: "工作空间", trailing: "24", children: [{ id: "projects", label: "项目", trailing: "12", children: [{ id: "design-system", label: "设计系统" }, { id: "component-library", label: "组件库" }] }, { id: "members", label: "成员", trailing: "8" }] },
  { id: "archive", label: "归档" }
];
const treeViewItem = (node, depth = 1, expanded = true, selected = false) => {
  const hasChildren = Boolean(node.children?.length);
  const childMarkup = hasChildren ? `<ul class="tui-tree-view__group" role="group"${expanded ? "" : " hidden"}>${node.children.map((child) => treeViewItem(child, depth + 1, child.id === "projects" || child.id === "design-system", child.id === "design-system")).join("")}</ul>` : "";
  const trailingMarkup = node.trailing ? `<span class="tui-tree-view__trailing" data-slot="trailing" data-typography-role="body-m">${escapeHtml(node.trailing)}</span>` : "";
  return `<li class="tui-tree-view__node" data-node-id="${escapeHtml(node.id)}"><button type="button" role="treeitem" class="tui-tree-view__item${selected ? " is-selected" : ""}" data-tree-toggle="${hasChildren ? "true" : "false"}" data-node-id="${escapeHtml(node.id)}" style="--tree-indent:${Math.max(0, depth - 1) * 12}px" aria-level="${depth}" aria-selected="${selected ? "true" : "false"}"${hasChildren ? ` aria-expanded="${expanded ? "true" : "false"}"` : ""}><span class="tui-tree-view__chevron${hasChildren ? " has-children" : ""}${expanded ? " is-expanded" : ""}" aria-hidden="true">${hasChildren ? icon("navigation/chevron-right", "", { size: 20 }) : ""}</span><span class="tui-tree-view__icon" data-slot="leading" aria-hidden="true">${icon(hasChildren ? "navigation/grid" : "object/file", "", { size: 20 })}</span><span class="tui-tree-view__label" data-slot="label" data-typography-role="body-l">${escapeHtml(node.label)}</span>${trailingMarkup}</button>${childMarkup}</li>`;
};
const treeViewState = () => `<nav class="tui-component tui-tree-view" ${attrs("tree-view", "Tree View/Default", "default", "default")} aria-label="项目结构" role="tree"><ul class="tui-tree-view__nodes" role="group">${treeViewNodes.map((node) => treeViewItem(node, 1, node.id === "workspace", node.id === "design-system")).join("")}</ul></nav>`;
const disclosureState = (id, { title = "更多信息", detail = "点击展开查看详情", content, expanded = false, contentId = `${id}-content` } = {}) => {
  const isAccordion = id === "accordion";
  const triggerContent = isAccordion
    ? `${icon("navigation/chevron-right", "", { size: 20 })}<span data-slot="label" data-typography-role="body-m">${escapeHtml(title)}</span>`
    : `<span data-slot="label" data-typography-role="body-m">${escapeHtml(title)}</span>${icon("navigation/chevron-down", "", { size: 20 })}`;
  const isExpanded = Boolean(expanded);
  const contentMarkup = content === undefined ? escapeHtml(detail) : slot(content);
  const variant = isExpanded ? "open" : "default";
  return `<div class="tui-component tui-disclosure" ${attrs(id, `${isAccordion ? "Accordion" : "Collapsible"}/Default`, variant, isExpanded ? "open" : "default")}><button class="tui-disclosure__trigger" type="button" aria-expanded="${isExpanded}" aria-controls="${escapeHtml(contentId)}" data-typography-role="body-m">${triggerContent}</button><div class="tui-disclosure__content" id="${escapeHtml(contentId)}" data-slot="content"${isExpanded ? "" : " hidden"} data-typography-role="body-l">${contentMarkup}</div></div>`;
};
const avatarState = ({ initials = "H", name = "HarmonyOS", size = 40 } = {}) => {
  const resolvedSize = Number(size) === 32 ? 32 : 40;
  return `<div class="tui-component tui-avatar" ${attrs("avatar", `Avatar/${resolvedSize}/Fallback`, `size-${resolvedSize}`, "default", ` data-size="${resolvedSize}"`)} aria-label="${escapeHtml(name)}" data-typography-role="body-s">${escapeHtml(initials)}</div>`;
};
const badgeState = ({ label = "进行中", tone = "info" } = {}) => `<span class="tui-component tui-badge tui-badge--${escapeHtml(tone)}" ${attrs("badge", "Badge/Default", tone, "default")} data-typography-role="body-s">${escapeHtml(label)}</span>`;
const badgeSpecimens = () => `<div class="tui-badge-group" aria-label="Badge 颜色示例">${badgeState({ label: "进行中", tone: "info" })}${badgeState({ label: "已完成", tone: "success" })}${badgeState({ label: "待处理", tone: "warning" })}${badgeState({ label: "错误", tone: "danger" })}${badgeState({ label: "未开始", tone: "neutral" })}</div>`;
const itemTrailing = (type = "text-arrow", value = "详情") => {
  if (type === "icon") return `<span class="tui-item__trailing tui-item__trailing--icon" data-slot="trailing">${icon("action/more", "", { size: 20 })}</span>`;
  if (type === "radio") return `<label class="tui-item__trailing tui-choice" data-slot="trailing"><input type="radio" checked aria-label="已选中"/><span class="tui-radio__indicator" aria-hidden="true"></span></label>`;
  if (type === "checkbox") return `<label class="tui-item__trailing tui-choice tui-checkbox" data-slot="trailing"><input type="checkbox" checked aria-label="已选中"/>${checkboxIndicator()}</label>`;
  if (type === "switch") return `<label class="tui-item__trailing tui-choice tui-switch" data-slot="trailing"><input type="checkbox" role="switch" checked aria-label="已开启"/><span class="tui-switch__track" aria-hidden="true"></span></label>`;
  if (type === "notification-arrow") return `<span class="tui-item__trailing tui-item__trailing--notification-arrow" data-slot="trailing"><span class="tui-item__notification-dot" aria-label="有新事件"></span>${icon("navigation/chevron-right", "", { size: 20 })}</span>`;
  return `<span class="tui-item__trailing tui-item__trailing--text-arrow" data-slot="trailing" data-typography-role="body-m"><span>${escapeHtml(value)}</span>${icon("navigation/chevron-right", "", { size: 20 })}</span>`;
};
const itemState = ({ title = "HarmonyOS 组件规范", description = "", supporting = "", lines = description ? supporting ? 3 : 2 : 1, leadingIcon = "navigation/grid", trailing = "text-arrow", trailingText = "详情", id = "list-card", logicalName = "List Item/White Surface/Default", leading, titleSlot, descriptionSlot, supportingSlot, content, trailingSlot, actions, selected = false, disabled = false } = {}) => {
  const state = disabled ? "disabled" : selected ? "selected" : "default";
  const leadingMarkup = slot(leading, `<span class="tui-item__leading" data-slot="leading">${icon(leadingIcon, "", { size: 24 })}</span>`);
  const titleMarkup = slot(titleSlot, escapeHtml(title));
  const descriptionMarkup = slot(descriptionSlot, description ? escapeHtml(description) : "");
  const supportingMarkup = slot(supportingSlot, supporting ? escapeHtml(supporting) : "");
  const contentMarkup = slot(content, `<span data-slot="title" data-typography-role="body-l">${titleMarkup}</span>${descriptionMarkup ? `<span data-slot="description" data-typography-role="body-m">${descriptionMarkup}</span>` : ""}${supportingMarkup ? `<span data-slot="supporting" data-typography-role="body-s">${supportingMarkup}</span>` : ""}`);
  const trailingMarkup = trailingSlot !== undefined
    ? slot(trailingSlot)
    : (typeof trailing === "string" && /<[^>]+>/.test(trailing) ? trailing : itemTrailing(trailing, trailingText));
  return `<div class="tui-component ${id === "list-card" ? "tui-list-card" : "tui-item"}" role="button" tabindex="${disabled ? "-1" : "0"}" ${attrs(id, logicalName, `line-${lines}`, state, ` data-lines="${lines}"`)}${selected ? " aria-selected=\"true\"" : ""}${disabled ? " aria-disabled=\"true\"" : ""}>${leadingMarkup}<span class="tui-item__content" data-slot="content">${contentMarkup}</span>${trailingMarkup}${actions ? `<span class="tui-item__actions" data-slot="actions">${slot(actions)}</span>` : ""}</div>`;
};

const sidebarItemsMarkup = (items = []) => items.map((item) => `<button class="tui-sidebar-item" type="button" data-state="${item.disabled ? "disabled" : item.selected ? "selected" : "default"}"${item.selected ? " aria-current=\"page\"" : ""}${item.disabled ? " disabled" : ""}>${item.leading !== undefined ? slot(item.leading) : `<span data-slot="leading">${icon(item.icon ?? "navigation/grid")}</span>`}<span data-slot="label" data-typography-role="body-l">${escapeHtml(item.label ?? "")}</span>${item.trailing !== undefined ? slot(item.trailing) : item.count !== undefined ? `<span class="tui-sidebar-item__count" data-slot="trailing" data-typography-role="body-m">${escapeHtml(item.count)}</span>` : ""}</button>`).join("");
const sidebarNavMarkup = ({ items = [], ariaLabel = "主导航", collapsed = false } = {}) => `<nav class="tui-component tui-sidebar" ${attrs("sidebar", "Sidebar Item/Default", collapsed ? "collapsed" : "default", "default")} aria-label="${escapeHtml(ariaLabel)}">${sidebarItemsMarkup(items)}</nav>`;
const sidebarState = ({ items = [{ label: "项目", icon: "navigation/grid", count: 24, selected: true }, { label: "最近访问", icon: "navigation/recent" }], groups = [], ariaLabel = "主导航", collapsed = false } = {}) => {
  const resolvedGroups = Array.isArray(groups) ? groups.filter((group) => group && Array.isArray(group.items)) : [];
  if (resolvedGroups.length <= 1) return sidebarNavMarkup({ items: resolvedGroups[0]?.items ?? items, ariaLabel: resolvedGroups[0]?.ariaLabel ?? ariaLabel, collapsed });
  return `<nav class="tui-component tui-sidebar-groups" data-component="sidebar-groups" data-logical-component="Sidebar Groups/Default" data-framework="html" aria-label="${escapeHtml(ariaLabel)}">${resolvedGroups.map((group, index) => {
    const expanded = group.expanded !== false;
    const contentId = `sidebar-group-content-${index + 1}`;
    return `<section class="tui-component tui-disclosure tui-sidebar-group" ${attrs("collapsible", "Collapsible/Default", expanded ? "open" : "default", expanded ? "open" : "default")}><button class="tui-disclosure__trigger tui-sidebar-group__trigger" type="button" aria-expanded="${expanded}" aria-controls="${contentId}" data-typography-role="subtitle-s"><span data-slot="label">${escapeHtml(group.label ?? `导航组 ${index + 1}`)}</span>${icon("navigation/chevron-down", "", { size: 16 })}</button><div class="tui-disclosure__content tui-sidebar-group__content" id="${contentId}" data-slot="content"${expanded ? "" : " hidden"}>${sidebarNavMarkup({ items: group.items, ariaLabel: group.ariaLabel ?? group.label ?? ariaLabel, collapsed })}</div></section>`;
  }).join("")}</nav>`;
};
const primaryNavigationIconAliases = Object.freeze({
  "primary-level/overview": "navigation/grid",
  "primary-level/calendar": "field/calendar",
  "primary-level/contacts": "navigation/contacts",
  "primary-level/mail": "navigation/mail-unread",
  "primary-level/settings": "action/settings"
});
const resolvePrimaryNavigationIcon = (name) => primaryNavigationIconAliases[name] ?? name;
const primaryNavigationItemState = ({ label = "项目", ariaLabel = label, iconName, icon: semanticIcon = "navigation/grid", selected = false, disabled = false, state = "default", className = "" } = {}) => {
  const resolvedState = disabled ? "disabled" : selected ? "selected" : state;
  const iconAlias = resolvePrimaryNavigationIcon(iconName ?? semanticIcon);
  return `<button class="tui-component tui-primary-navigation-item${className ? ` ${escapeHtml(className)}` : ""}" type="button" ${attrs("primary-navigation-item", "Primary Navigation Item/Level 1", selected ? "selected" : "default", resolvedState, ` data-placement="primary-navigation-shell" data-mode="icon-only"`)} aria-label="${escapeHtml(ariaLabel)}" aria-pressed="${selected}"${disabled ? " disabled" : ""}><span data-slot="icon">${icon(iconAlias, "", { size: 24 })}</span></button>`;
};
export const renderPrimaryNavigationItemGallery = () => `<nav class="tui-primary-navigation-items" aria-label="一级导航">${primaryNavigationItemState({ label: "工作台", iconName: "navigation/grid" })}${primaryNavigationItemState({ label: "项目", iconName: "field/calendar", selected: true })}${primaryNavigationItemState({ label: "消息", iconName: "navigation/mail-unread" })}${primaryNavigationItemState({ label: "设置", iconName: "action/settings" })}</nav>`;

const listCardState = (options = {}) => {
  const { items, ...singleOptions } = options;
  if (Array.isArray(items)) {
    return `<div class="tui-component tui-list-card-group" data-component="list-card" data-logical-component="List Item/White Surface/Default" data-variant="collection" data-state="default" data-framework="html" role="list">${items.map((item, index) => itemState({
      title: "HarmonyOS 组件规范",
      description: "刚刚更新 · 12 位成员",
      trailingText: "进行中",
      selected: index === 0,
      ...item,
      id: `list-card-${index + 1}`,
      logicalName: "List Item/White Surface/Default",
    })).join("")}</div>`;
  }
  return itemState({
    title: "HarmonyOS 组件规范",
    description: "刚刚更新 · 12 位成员",
    trailingText: "进行中",
    selected: true,
    ...singleOptions,
    id: "list-card",
    logicalName: "List Item/White Surface/Default"
  });
};
const tableState = (id = "table") => `<div class="tui-component tui-table" ${attrs(id, `${id === "data-table" ? "Data Table" : "Table"}/Default`, "default", "default")}><div class="tui-table__heading"><h4 data-slot="title" data-typography-role="title-s">项目列表</h4><span data-slot="description" data-typography-role="body-m">3 个项目</span></div><table><thead><tr><th data-typography-role="body-m">名称</th><th data-typography-role="body-m">负责人</th><th data-typography-role="body-m">状态</th></tr></thead><tbody><tr><td data-typography-role="body-l">客户端设计系统</td><td data-typography-role="body-l">赵博海</td><td data-typography-role="body-l"><span class="tui-badge tui-badge--info" data-typography-role="body-s">进行中</span></td></tr><tr><td data-typography-role="body-l">组件规范</td><td data-typography-role="body-l">林晓</td><td data-typography-role="body-l"><span class="tui-badge tui-badge--success" data-typography-role="body-s">已完成</span></td></tr></tbody></table></div>`;
const paginationState = () => `<nav class="tui-component tui-pagination" ${attrs("pagination", "Pagination/Default", "default", "default")} aria-label="分页"><button class="tui-icon-button" type="button" data-page="prev" aria-label="上一页">${icon("navigation/back", "", { size: 20 })}</button><button type="button" data-page="1" aria-current="page" data-typography-role="body-l">1</button><button type="button" data-page="2" data-typography-role="body-l">2</button><button type="button" data-page="3" data-typography-role="body-l">3</button><button class="tui-icon-button" type="button" data-page="next" aria-label="下一页">${icon("navigation/forward", "", { size: 20 })}</button></nav>`;
const breadcrumbState = () => `<nav class="tui-component tui-breadcrumb" ${attrs("breadcrumb", "Breadcrumb/Default", "default", "default")} aria-label="面包屑"><a href="#" data-typography-role="body-l">工作空间</a><span class="tui-breadcrumb__separator" aria-hidden="true">${icon("navigation/chevron-right", "", { size: 20 })}</span><a href="#" data-typography-role="body-l">项目</a><span class="tui-breadcrumb__separator" aria-hidden="true">${icon("navigation/chevron-right", "", { size: 20 })}</span><span aria-current="page" data-typography-role="subtitle-m">设置</span></nav>`;
const progressState = ({ value = 68, label = null } = {}) => `<div class="tui-component tui-progress" ${attrs("progress", "Progress/Default", "default", "default")} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}" style="--progress-value:${Math.min(100, Math.max(0, Number(value)))}%">${label ? `<span class="tui-progress__label" data-typography-role="body-s">${escapeHtml(label)} · ${value}%</span>` : ""}<div class="tui-progress__track"><span class="tui-progress__value"></span></div></div>`;
const emptyState = ({ title = "暂无项目", description = "创建项目后会显示在这里。" } = {}) => `<section class="tui-component tui-empty" ${attrs("empty", "Empty/Default", "default", "default")} aria-live="polite"><h4 data-slot="title" data-typography-role="title-s">${escapeHtml(title)}</h4><p data-slot="description" data-typography-role="body-m">${escapeHtml(description)}</p><button class="tui-button tui-empty__action" type="button" data-variant="primary" data-typography-role="body-l">新建项目</button></section>`;
const labelState = ({ text = "邮箱", forId = "project-name" } = {}) => `<label class="tui-component tui-label" ${attrs("label", "Label/Default", "default", "default")} for="${escapeHtml(forId)}" data-typography-role="body-m">${escapeHtml(text)}</label>`;
const feedbackIcon = (id, tone) => ({ info: "status/info", success: "status/success", warning: "status/warning", danger: "status/danger", neutral: "status/neutral" }[tone] ?? "status/info");
const feedbackRole = (id, tone) => id === "alert" && (tone === "warning" || tone === "danger") ? "alert" : "status";
const feedbackState = (id, tone, title, message) => `<div class="tui-component tui-${id} tui-${id}--${tone}" ${attrs(id, `${id[0].toUpperCase()}${id.slice(1)}/Default`, tone, "default")} role="${feedbackRole(id, tone)}"><span class="tui-${id}__icon">${icon(feedbackIcon(id, tone), "", { size: 20 })}</span><span class="tui-${id}__message" data-slot="content" data-typography-role="${id === "toast" ? "body-m" : "subtitle-s"}">${escapeHtml(message ?? title)}</span>${id === "alert" ? `<span class="tui-alert__actions" data-slot="actions"><button class="tui-button tui-button--ghost tui-alert__action" type="button" data-slot="action" data-variant="ghost" data-mode="text" data-size="small" data-button-type="small-ghost" data-typography-role="body-m">${escapeHtml(title)}</button><button class="tui-icon-button" data-slot="close" type="button" aria-label="关闭">${icon("action/close", "", { size: 20 })}</button></span>` : `<button class="tui-icon-button" data-slot="close" type="button" aria-label="关闭">${icon("action/close", "", { size: 20 })}</button>`}</div>`;
const alertState = ({ tone = "info", title = "查看详情", message = "系统将在今晚自动完成更新。" } = {}) => feedbackState("alert", tone, title, message);
const alertRuntimeState = ({ specimens = [] } = {}) => `<div class="tui-feedback-specimens" data-runtime-component="alert">${specimens.map((specimen) => `<div class="tui-feedback-specimen" data-specimen="${escapeHtml(specimen.id ?? specimen.variant)}"><span class="tui-runtime-surface-label">${escapeHtml(specimen.label ?? specimen.variant)}</span>${alertState({ tone: specimen.variant, title: specimen.action, message: specimen.message })}</div>`).join("")}</div>`;
const tooltipState = () => `<div class="tui-component tui-tooltip" ${attrs("tooltip", "Tooltip/Default", "default", "default")}><button class="tui-button tui-button--ghost" type="button" data-variant="ghost" data-typography-role="body-l">刷新列表</button><span class="tui-tooltip__panel" role="tooltip" data-slot="content" data-typography-role="body-l">刷新列表</span></div>`;
const snackbarState = ({ title, message, subtitle = "", action = null, actionLabel = "文本按钮", leftArea, closable = true } = {}) => {
  const resolvedTitle = title ?? message ?? "Title";
  const titleSubtitle = Boolean(subtitle);
  const resolvedLeftArea = titleSubtitle ? "2" : String(leftArea ?? "1");
  const variant = titleSubtitle ? "title-subtitle" : "title-only";
  const actionMarkup = action != null
    ? action
    : actionLabel
      ? `<button class="tui-button tui-button--ghost tui-snackbar__action" type="button" data-variant="ghost" data-size="small" data-typography-role="body-m">${escapeHtml(actionLabel)}</button>`
      : "";
  return `<div class="tui-component tui-snackbar" ${attrs("snackbar", "Snackbar/Default", variant, "default", ` data-left-area="${escapeHtml(resolvedLeftArea)}"`)} role="status"><span class="tui-snackbar__main"><span class="tui-snackbar__leading" data-slot="leading">${icon("status/info", "", { size: 24 })}</span><span class="tui-snackbar__content"><span class="tui-snackbar__title" data-slot="title" data-typography-role="subtitle-s">${escapeHtml(resolvedTitle)}</span>${titleSubtitle ? `<span class="tui-snackbar__subtitle" data-slot="subtitle" data-typography-role="body-s">${escapeHtml(subtitle)}</span>` : ""}</span></span><span class="tui-snackbar__actions">${actionMarkup ? `<span class="tui-snackbar__action-slot" data-slot="action">${actionMarkup}</span>` : ""}${closable ? `<button class="tui-icon-button tui-snackbar__close" data-slot="close" type="button" aria-label="关闭">${icon("action/close", "", { size: 20 })}</button>` : ""}</span></div>`;
};
const snackbarRuntimeState = ({ specimens = [] } = {}) => `<div class="tui-feedback-specimens" data-runtime-component="snackbar">${(specimens.length ? specimens : [{ id: "title-only", leftArea: "1" }, { id: "title-subtitle", leftArea: "2" }]).map((specimen) => {
  const titleSubtitle = specimen.leftArea === "2" || specimen.variant === "title-subtitle";
  return `<div class="tui-feedback-specimen" data-specimen="${escapeHtml(specimen.id ?? specimen.variant)}"><span class="tui-runtime-surface-label">${titleSubtitle ? "Title + Subtitle" : "Title"}</span>${snackbarState({ title: "Title", subtitle: titleSubtitle ? "Subtitle" : "", actionLabel: "文本按钮", leftArea: specimen.leftArea })}</div>`;
}).join("")}</div>`;
const chipsState = ({ label = "操作块", iconName = "action/mark-important", closable = true, disabled = false, state = "default" } = {}) => {
  const resolvedState = disabled ? "disabled" : state;
  const variant = `${iconName ? "with-icon" : "text-only"}${closable ? "-closable" : ""}`;
  return `<span class="tui-component tui-chip" ${attrs("chips", "Chips/Default", variant, resolvedState)}${closable ? "" : " data-close=\"false\""}${disabled ? " aria-disabled=\"true\"" : ""}><span class="tui-chip__leading" data-slot="leading">${iconName ? icon(iconName, "", { size: 16 }) : ""}</span><span class="tui-chip__label" data-slot="label" data-typography-role="body-m">${escapeHtml(label)}</span>${closable ? `<button class="tui-chip__close" data-slot="close" type="button" aria-label="移除 ${escapeHtml(label)}"${disabled ? " disabled" : ""}>${icon("action/close", "", { size: 16 })}</button>` : ""}</span>`;
};
const chipsRuntimeState = () => `<div class="tui-runtime-chips-gallery" data-runtime-component="chips">${chipsState()}</div>`;

const stateLabel = (state) => ({ default: "Default", hover: "Hover", pressed: "Pressed", focus: "Focus", filled: "Filled", disabled: "Disabled", error: "Error" }[state] ?? state);

export function renderInputGallery() {
  const states = ["default", "hover", "focus", "filled", "disabled", "error"];
  const context = (surface, label) => `<section class="tui-runtime-state-group" data-surface-context="${surface}"><span data-typography-role="body-m">${label}</span><div class="tui-runtime-state-grid">${states.map((state) => `<div class="tui-runtime-state-cell"><span data-typography-role="body-s">${stateLabel(state)}</span>${inputState({ surface, state, value: state === "filled" ? "客户端设计系统" : "", disabled: state === "disabled" })}</div>`).join("")}</div></section>`;
  return `<div class="tui-runtime-core-gallery tui-runtime-input-gallery" data-component="input-gallery" data-framework="html"><p class="tui-runtime-note">白色内容面使用灰色输入面；灰色内容面使用白色输入面。下面每个控件都是真实 HTML Input 适配器，状态由 data-state 驱动。</p>${context("white", "White content surface")}${context("gray", "Gray content surface")}</div>`;
}

export function renderSearchGallery() {
  return `<div class="tui-runtime-core-gallery tui-runtime-search-gallery" data-component="search-gallery" data-framework="html"><p class="tui-runtime-note">Search 与 Input 共享 Surface 规则，输入、清除和 disabled 都由真实 DOM 控件提供。</p><div class="tui-runtime-surface-grid"><div class="tui-runtime-state-cell"><span data-typography-role="body-s">White content surface</span>${searchState({ surface: "white" })}</div><div class="tui-runtime-state-cell"><span data-typography-role="body-s">Gray content surface</span>${searchState({ surface: "gray" })}</div><div class="tui-runtime-state-cell"><span data-typography-role="body-s">Filled</span>${searchState({ surface: "white", state: "filled", value: "搜索项目" })}</div><div class="tui-runtime-state-cell"><span data-typography-role="body-s">Disabled</span>${searchState({ surface: "white", disabled: true })}</div></div></div>`;
}

export function renderSidebarGallery() {
  const item = (label, state, iconName = "navigation/grid", count = "") => `<button class="tui-sidebar-item" type="button" data-state="${state}"><span data-slot="leading">${icon(iconName)}</span><span data-slot="label" data-typography-role="body-l">${label}</span>${count ? `<span class="tui-sidebar-item__count" data-slot="trailing" data-typography-role="body-m">${count}</span>` : ""}</button>`;
  return `<div class="tui-runtime-core-gallery tui-runtime-sidebar-gallery" data-component="sidebar-gallery" data-framework="html"><p class="tui-runtime-note">未选中状态保留二级文本和图标颜色；选中态使用 Sidebar Selected。每一行是同一个 HTML Sidebar Item 的状态。</p><nav class="tui-component tui-sidebar" ${attrs("sidebar", "Sidebar Item/Default", "default", "default")} aria-label="主导航">${item("项目", "default", "navigation/grid", "24")}${item("Hover", "hover", "navigation/recent")}${item("Pressed", "pressed", "navigation/recent")}${item("Focus", "focus", "navigation/recent")}${item("已选中", "selected", "navigation/list")}${item("Disabled", "disabled", "action/settings")}</nav></div>`;
}

export function renderListCardGallery() {
  const card = (title, state) => `<button class="tui-component tui-list-card" type="button" ${attrs("list-card", "List Item/White Surface/Default", state === "selected" ? "selected" : "default", state)} aria-pressed="${state === "selected" ? "true" : "false"}"><span data-slot="leading">${icon("navigation/list")}</span><span class="tui-list-card__content"><span class="tui-list-card__title" data-slot="title" data-typography-role="title-s">${title}</span><span class="tui-list-card__description" data-slot="description" data-typography-role="body-m">刚刚更新 · 12 位成员</span></span><span class="tui-list-card__meta" data-slot="trailing" data-typography-role="body-m">${stateLabel(state)}</span></button>`;
  return `<div class="tui-runtime-core-gallery tui-runtime-list-card-gallery" data-component="list-card-gallery" data-framework="html"><p class="tui-runtime-note">List Card 使用相同的真实 DOM 组件展示 Default、Hover、Pressed、Focus、Selected 和 Disabled。</p><div class="tui-runtime-state-grid tui-runtime-state-grid--single">${["default", "hover", "pressed", "focus", "selected", "disabled"].map((state) => `<div class="tui-runtime-state-cell"><span>${stateLabel(state)}</span>${card(state === "selected" ? "已选中的项目" : "HarmonyOS 组件规范", state)}</div>`).join("")}</div></div>`;
}

/**
 * Single default-state preview used by the unified runtime gallery.  The
 * contract gallery is intentionally allowed to show a full state matrix, but
 * the runtime gallery must stay focused on the real component and let the
 * browser expose hover/focus/pressed behavior naturally.
 */
export function renderRuntimeHtmlComponent(id, options = {}) {
  const specimens = options.specimens ?? [{ id: "default", variant: "default", state: "default" }];
  if (id === "button") {
    const sample = (specimen) => {
      const mode = specimen.mode ?? "text";
      if (mode === "split-dropdown") {
        const iconOnly = specimen.iconOnly === true;
        return renderSplitDropdown({
          iconOnly,
          label: iconOnly ? "刷新" : "导出文件",
          iconName: iconOnly ? "action/refresh" : "action/download",
          menuItems: iconOnly ? ["重新加载", "同步数据", "清理缓存并刷新"] : undefined
        });
      }
      const variant = specimen.variant ?? "primary";
      const label = mode === "icon" ? "更多操作" : variant === "danger" ? "删除项目" : variant === "secondary" ? "次要操作" : variant === "ghost" ? "文本操作" : "确认操作";
      return renderButton({ label, variant, size: specimen.size ?? "standard", mode, iconName: mode === "icon-text" ? "action/add" : mode === "icon" ? "action/more" : undefined });
    };
    return `<div class="tui-runtime-structural-grid tui-runtime-structural-grid--button" data-runtime-component="button">${specimens.map((specimen) => `<div class="tui-runtime-structural-cell" data-specimen="${escapeHtml(specimen.id)}"><span class="tui-runtime-surface-label">${escapeHtml(specimen.id)}</span>${sample(specimen)}</div>`).join("")}</div>`;
  }
  if (id === "input") {
    const surfaces = ["white", "gray"];
    const basic = surfaces.map((surface) => `<div data-surface-context="${surface}"><span class="tui-runtime-surface-label">${surface === "white" ? "白色内容面 · 灰色输入面" : "灰色内容面 · 白色输入面"}</span>${inputState({ surface, state: "default", placeholder: "项目名称" })}</div>`).join("");
    const tagEntry = inputState({ surface: "gray", variant: "tag-entry", label: "参与成员", placeholder: "输入姓名后按 Enter", options: ["林娜", "王昊", "陈佳", "周明"], tags: ["林娜"] });
    return `<div class="tui-runtime-core-gallery"><p class="tui-runtime-note">Tag Entry 是一个通用变体：按内容面设置 surface="white" 或 "gray" 即可复用；此处直接展示组件。自由文本可保留，Enter 打开建议，方向键或点击选项后生成可移除标签。</p><div class="tui-runtime-surface-pair">${basic}</div>${tagEntry}</div>`;
  }
  if (id === "search") return `<div class="tui-runtime-surface-pair tui-runtime-search-pair"><div data-surface-context="white"><span class="tui-runtime-surface-label">白色内容面 · 灰色搜索面 · Search · Scoped + 高级</span>${searchState({ surface: "white", state: "default", placeholder: "搜索项目", scopeOptions: ["全部", "标题", "内容"], advancedSearch: true })}</div><div data-surface-context="gray"><span class="tui-runtime-surface-label">灰色内容面 · 白色搜索面 · Search · Scoped + 高级</span>${searchState({ surface: "gray", state: "default", placeholder: "搜索项目", scopeOptions: ["全部", "标题", "内容"], advancedSearch: true })}</div></div>`;
  if (id === "primary-navigation-item") return `<div class="tui-runtime-core-gallery tui-runtime-primary-navigation-gallery"><p class="tui-runtime-note">一级导航使用独立的原生 Primary Navigation Item；Pattern 只负责把它放入底部对齐的 primary-navigation-shell。</p>${renderPrimaryNavigationItemGallery()}</div>`;
  if (id === "sidebar") {
    const item = (label, state, iconName, count = "") => `<button class="tui-sidebar-item" type="button" data-state="${state}"><span data-slot="leading">${icon(iconName)}</span><span data-slot="label" data-typography-role="body-l">${label}</span>${count ? `<span class="tui-sidebar-item__count" data-slot="trailing" data-typography-role="body-m">${count}</span>` : ""}</button>`;
    return `<nav class="tui-component tui-sidebar" ${attrs("sidebar", "Sidebar Item/Default", "default", "default")} aria-label="主导航">${item("项目", "selected", "navigation/grid", "24")}${item("最近访问", "default", "navigation/recent")}${item("与我共享", "default", "action/more")}</nav>`;
  }
  if (id === "list-card") {
    const listItem = (options) => itemState({ id: "list-card", logicalName: "List Item/White Surface/Default", ...options });
    return `<div class="tui-list-card-group" role="list">${listItem({ title: "项目设置", lines: 1, trailing: "text-arrow", trailingText: "详情" })}${listItem({ title: "成员权限", description: "管理角色和访问范围", lines: 2, trailing: "icon" })}${listItem({ title: "通知方式", description: "邮件通知", supporting: "已同步到云端", lines: 3, trailing: "radio" })}${listItem({ title: "自动同步", lines: 1, trailing: "switch" })}${listItem({ title: "项目归档", lines: 1, trailing: "checkbox" })}${listItem({ title: "更新动态", lines: 1, trailing: "notification-arrow" })}</div>`;
  }
  if (id === "titlebar") return `<div class="tui-runtime-titlebar-gallery" data-runtime-component="titlebar">${createTitlebarPreviewScenes().map(({ size, label, scenes }) => `<section class="tui-runtime-titlebar-size-group" data-preview-size="${size}"><h4 class="tui-runtime-titlebar-size-title">${label}</h4><div class="tui-runtime-titlebar-layouts">${scenes.map(scene => `<div data-preview-layout="${scene.layout}"><strong class="tui-runtime-titlebar-scenario-title">${scene.label}</strong><span class="tui-runtime-titlebar-scenario-slots">${scene.description}</span><div class="tui-runtime-titlebar-layout-shell tui-runtime-titlebar-layout-shell--${scene.columns}">${scene.segments.map(options => titlebarState(options)).join("")}</div></div>`).join("")}</div></section>`).join("")}</div>`;
  if (id === "textarea") return `<div class="tui-runtime-surface-pair tui-runtime-textarea-pair"><div data-surface-context="white"><span class="tui-runtime-surface-label">白色内容面 · 灰色输入面</span>${textareaState({ surface: "white" })}</div><div data-surface-context="gray"><span class="tui-runtime-surface-label">灰色内容面 · 白色输入面</span>${textareaState({ surface: "gray" })}</div></div>`;
  if (id === "field") return fieldState({ surface: "white" });
  if (id === "form-field") return `<div class="tui-runtime-form-field-states"><div data-surface-context="white"><span class="tui-runtime-surface-label">默认 · 白色内容面 / 灰色输入面</span>${formFieldState({ surface: "white", control: "input" })}</div><div data-surface-context="gray"><span class="tui-runtime-surface-label">默认 · 灰色内容面 / 白色输入面</span>${formFieldState({ surface: "gray", control: "input" })}</div><div data-surface-context="white"><span class="tui-runtime-surface-label">必填 · 白色内容面 / 灰色选择面</span>${formFieldState({ surface: "white", control: "select", required: true })}</div><div data-surface-context="gray"><span class="tui-runtime-surface-label">必填 · 灰色内容面 / 白色选择面</span>${formFieldState({ surface: "gray", control: "select", required: true })}</div><div data-surface-context="white"><span class="tui-runtime-surface-label">错误 · 白色内容面 / 灰色输入面</span>${formFieldState({ surface: "white", control: "input", error: "项目名称不能为空", value: "" })}</div><div data-surface-context="gray"><span class="tui-runtime-surface-label">错误 · 灰色内容面 / 白色输入面</span>${formFieldState({ surface: "gray", control: "input", error: "项目名称不能为空", value: "" })}</div></div>`;
  if (id === "select") return `<div class="tui-runtime-surface-pair"><div data-surface-context="white"><span class="tui-runtime-surface-label">白色内容面 · 灰色选择面</span>${selectState({ id: "select", surface: "white" })}</div><div data-surface-context="gray"><span class="tui-runtime-surface-label">灰色内容面 · 白色选择面</span>${selectState({ id: "select", surface: "gray" })}</div></div>`;
  if (id === "combobox") return comboboxState();
  if (id === "native-select") return nativeSelectState();
  if (id === "checkbox") return checkboxState();
  if (id === "radio") return `<div class="tui-runtime-structural-grid" data-runtime-component="radio">${radioState({ checked: false, label: "未选中", value: "unselected" })}${radioState({ checked: true, label: "已选中", value: "selected" })}</div>`;
  if (id === "radio-group") return radioGroupState();
  if (id === "switch") return switchState();
  if (id === "segmented-button") return segmentedButtonState();
  if (id === "number-selector") return numberSelectorState();
  if (id === "tabs") return tabsState();
  if (id === "sub-tabs") return subTabsState();
  if (id === "tree-view") return treeViewState();
  if (id === "accordion") return disclosureState("accordion", "项目设置", "基础信息、成员与通知方式");
  if (id === "collapsible") return disclosureState("collapsible", "更多信息", "点击展开查看详情");
  if (id === "avatar") return `<div class="tui-runtime-avatar-pair"><div><span class="tui-runtime-surface-label">32 × 32</span>${avatarState({ initials: "H", name: "HarmonyOS 32", size: 32 })}</div><div><span class="tui-runtime-surface-label">40 × 40</span>${avatarState({ initials: "H", name: "HarmonyOS 40", size: 40 })}</div></div>`;
  if (id === "badge") return badgeSpecimens();
  if (id === "table") return tableState("table");
  if (id === "data-table") return tableState("data-table");
  if (id === "pagination") return paginationState();
  if (id === "breadcrumb") return breadcrumbState();
  if (id === "progress") return progressState();
  if (id === "empty") return emptyState();
  if (id === "label") return labelState();
  if (id === "alert") return alertRuntimeState({ specimens });
  if (id === "tooltip") return tooltipState();
  if (id === "snackbar") return snackbarRuntimeState({ specimens });
  if (id === "chips") return chipsRuntimeState({ specimens });
  if (id === "slider") return advancedHtmlComponents.slider({ ...options, gallery: true });
  if (advancedHtmlComponents[id]) return advancedHtmlComponents[id](options);
  const renderer = generatedHtmlComponents[id];
  return renderer ? renderer() : `<p class="tui-runtime-framework-missing">HTML 适配器缺失：${escapeHtml(id)}</p>`;
}

const galleryCell = (name, content, className = "") => `<div class="tui-button-gallery__cell${className ? ` ${className}` : ""}"><span class="tui-button-gallery__label">${escapeHtml(name)}</span>${content}</div>`;
const sectionRule = (title) => `<div class="tui-button-gallery__rule"><span>${escapeHtml(title)}</span></div>`;

export function renderButtonGallery() {
  const variants = [
    ["Primary", "primary", "确认操作"],
    ["Secondary", "secondary", "次要操作"],
    ["Ghost", "ghost", "文本操作"],
    ["Danger", "danger", "删除项目"]
  ];
  const sized = ["standard", "small"].map((size) => {
    const title = size === "standard" ? "Standard · 40px" : "Small · 28px";
    const cells = [false, true].flatMap((disabled) => variants.map(([name, variant, label]) => galleryCell(`${name}${disabled ? " · Disabled" : ""}`, renderButton({ label, variant, size, disabled }))));
    return `<section class="tui-button-gallery__section" data-logical-group="Button/Size/${size === "standard" ? "Standard" : "Small"}">${sectionRule(title)}<div class="tui-button-gallery__grid tui-button-gallery__grid--four">${cells.join("")}</div></section>`;
  }).join("");

  const iconTextDefault = [
    ["Primary", "primary", "action/add", "新建项目"],
    ["Secondary", "secondary", "action/download", "导出文件"],
    ["Ghost", "ghost", "action/settings", "更多设置"]
  ].map(([name, variant, iconName, label]) => galleryCell(name, renderButton({ label, variant, mode: "icon-text", iconName }))).join("");
  const iconTextDisabled = [
    ["Primary · Disabled", "primary", "action/add", "新建项目"],
    ["Secondary · Disabled", "secondary", "action/download", "导出文件"],
    ["Ghost · Disabled", "ghost", "action/settings", "更多设置"]
  ].map(([name, variant, iconName, label]) => galleryCell(name, renderButton({ label, variant, mode: "icon-text", iconName, disabled: true }))).join("");

  const iconButtons = [
    ["Ghost · Default", "ghost", "action/more", false],
    ["Secondary · Explicit", "secondary", "action/close", false],
    ["Ghost · Disabled", "ghost", "action/more", true],
    ["Secondary · Disabled", "secondary", "action/close", true]
  ].map(([name, variant, iconName, disabled]) => galleryCell(name, renderButton({ label: name, variant, mode: "icon", iconName, disabled }), "tui-button-gallery__cell--icon")).join("");

  const selection = [
    galleryCell("List selection", renderSelectionDropdown()),
    galleryCell("Disabled", renderSelectionDropdown({ disabled: true }))
  ].join("");
  const splitDefault = [
    galleryCell("Icon + Text · Independent actions", renderSplitDropdown()),
    galleryCell("Icon · Independent actions", renderSplitDropdown({ label: "刷新", iconName: "action/refresh", iconOnly: true, menuItems: ["重新加载", "同步数据", "清理缓存并刷新"] }))
  ].join("");
  const splitDisabled = [
    galleryCell("Icon + Text · Disabled", renderSplitDropdown({ disabled: true })),
    galleryCell("Icon · Disabled", renderSplitDropdown({ label: "刷新", iconName: "action/refresh", iconOnly: true, disabled: true, menuItems: ["重新加载", "同步数据", "清理缓存并刷新"] }))
  ].join("");

  return `<div class="tui-button-gallery" data-component="button" data-logical-component="Button/Module/Complete" data-framework="html">${sized}<section class="tui-button-gallery__section" data-logical-group="Button/Icon Text/Default">${sectionRule("Icon + Text · 40px · Icon 20px")}<div class="tui-button-gallery__grid tui-button-gallery__grid--three">${iconTextDefault}</div><div class="tui-button-gallery__grid tui-button-gallery__grid--three">${iconTextDisabled}</div></section><section class="tui-button-gallery__section" data-logical-group="Button/Icon/Default">${sectionRule("Icon Button · 图标按钮 · Default = Ghost · 40×40px · Icon 20px")}<div class="tui-button-gallery__grid tui-button-gallery__grid--four">${iconButtons}</div></section><section class="tui-button-gallery__section" data-logical-group="Button/Selection Dropdown/Default">${sectionRule("Selection Dropdown · 选择型下拉按钮 · Text + Chevron · Secondary · 40px")}<div class="tui-button-gallery__grid tui-button-gallery__grid--two">${selection}</div></section><section class="tui-button-gallery__section" data-logical-group="Button/Split Dropdown/Default">${sectionRule("Split Dropdown Button · 分裂式下拉按钮 · Ghost · 40px")}<div class="tui-button-gallery__grid tui-button-gallery__grid--two">${splitDefault}</div><div class="tui-button-gallery__grid tui-button-gallery__grid--two">${splitDisabled}</div></section></div>`;
}

export const htmlComponents = {
  button: (options = {}) => renderButton(options),
  buttonGallery: () => renderButtonGallery(),
  input: (options = {}) => inputState(options),
  inputGallery: () => renderInputGallery(),
  search: (options = {}) => searchState(options),
  searchGallery: () => renderSearchGallery(),
  sidebar: (options = {}) => sidebarState(options),
  sidebarGallery: () => renderSidebarGallery(),
  "primary-navigation-item": (options = {}) => primaryNavigationItemState(options),
  primaryNavigationItem: (options = {}) => primaryNavigationItemState(options),
  primaryNavigationItemGallery: () => renderPrimaryNavigationItemGallery(),
  listCard: (options = {}) => listCardState(options),
  "list-card": (options = {}) => listCardState(options),
  // `item` is the multi-line list-item contract. Keep it distinct from the
  // single-purpose `list-card` adapter so page-specific list layouts can own
  // the row geometry without being collapsed to the 48px card variant.
  item: (options = {}) => itemState({ id: "item", logicalName: "List Item/White Surface/Default", ...options }),
  listCardGallery: () => renderListCardGallery(),
  titlebar: (options = {}) => titlebarState(options),
  textarea: (options = {}) => textareaState(options),
  field: (options = {}) => fieldState(options),
  select: (options = {}) => selectState(options),
  combobox: (options = {}) => comboboxState(options),
  nativeSelect: (options = {}) => nativeSelectState(options),
  checkbox: (options = {}) => checkboxState(options),
  radio: (options = {}) => radioState(options),
  radioGroup: (options = {}) => radioGroupState(options),
  switch: (options = {}) => switchState(options),
  segmentedButton: (options = {}) => segmentedButtonState(options),
  numberSelector: (options = {}) => numberSelectorState(options),
  tabs: () => tabsState(),
  subTabs: () => subTabsState(),
  treeView: () => treeViewState(),
  accordion: (options = {}) => disclosureState("accordion", { title: "项目设置", detail: "基础信息、成员与通知方式", ...options }),
  collapsible: (options = {}) => disclosureState("collapsible", options),
  avatar: (options = {}) => avatarState(options),
  badge: (options = {}) => badgeState(options),
  table: () => tableState("table"),
  dataTable: () => tableState("data-table"),
  pagination: () => paginationState(),
  breadcrumb: () => breadcrumbState(),
  progress: (options = {}) => progressState(options),
  empty: (options = {}) => emptyState(options),
  label: (options = {}) => labelState(options),
  alert: () => alertState(),
  tooltip: () => tooltipState(),
  snackbar: (options = {}) => snackbarState(options),
  chips: (options = {}) => chipsState(options),
  ...advancedHtmlComponents,
  ...generatedHtmlComponents,
  // A hand-built control has a complete interactive implementation; do not
  // let the generated gallery placeholder shadow it at the public entry point.
  numberSelector: (options = {}) => numberSelectorState(options),
  "number-selector": (options = {}) => numberSelectorState(options)
};

export function renderHtmlComponent(name, options) {
  const renderer = htmlComponents[name] ?? htmlComponents[String(name).replace(/-([a-z])/g, (_, character) => character.toUpperCase())];
  if (!renderer) throw new Error(`Unknown HTML component: ${name}`);
  // Gallery no-argument calls retain specimen text. Product calls must not
  // inherit unrelated demo descriptions or a pre-selected checkbox.
  const resolvedOptions = name === "checkbox" && options
    ? { checked: false, description: "", ...options } : options;
  const markup = renderer(resolvedOptions);
  if (/\bdata-renderer-key=/.test(markup)) return markup;
  return markup.replace(/(<[a-z][^>]*\bdata-component="[^"]+")/i, `$1 data-renderer-key="${escapeHtml(name)}"`);
}

export function resolveHtmlRendererKey(componentId) {
  if (htmlComponents[componentId]) return componentId;
  const camelKey = String(componentId).replace(/-([a-z])/g, (_, character) => character.toUpperCase());
  return htmlComponents[camelKey] ? camelKey : null;
}

export function collectHtmlComponentEvidence(root = document) {
  const nodes = [...root.querySelectorAll(".tui-component[data-component][data-logical-component]")];
  const patternRoot = root.querySelector("[data-pattern][data-structure-digest], [data-tui-pattern][data-structure-digest]");
  const rectEvidence = (node) => {
    const rect = node?.getBoundingClientRect?.();
    return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
  };
  const stylesheetEvidence = [...(root.styleSheets ?? [])].map((stylesheet) => {
    try {
      return { href: stylesheet.href ?? "inline", loaded: true, ruleCount: stylesheet.cssRules.length };
    } catch {
      return { href: stylesheet.href ?? "inline", loaded: true, ruleCount: null };
    }
  });
  const patternStyle = patternRoot ? getComputedStyle(patternRoot) : null;
  const patternRegions = patternRoot ? [...patternRoot.querySelectorAll(":scope > [data-pattern-region], :scope > [data-ui-region], [data-tui-pane-role]")].map((node) => {
    const style = getComputedStyle(node);
    const readBoxStyle = (candidate) => {
      if (!candidate) return null;
      const candidateStyle = getComputedStyle(candidate);
      return {
        paddingInlineStart: candidateStyle.paddingInlineStart,
        paddingInlineEnd: candidateStyle.paddingInlineEnd,
        paddingBlockStart: candidateStyle.paddingBlockStart,
        paddingBlockEnd: candidateStyle.paddingBlockEnd
      };
    };
    const titleSegment = node.querySelector(":scope > [data-pattern-title-segment]");
    const scrollBody = node.querySelector(":scope > [data-pattern-scroll-body]");
    return {
      region: node.getAttribute("data-pattern-region") ?? node.getAttribute("data-ui-region") ?? node.getAttribute("data-tui-pane-role"),
      display: style.display,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      bounds: rectEvidence(node),
      padding: readBoxStyle(node),
      title: titleSegment ? { bounds: rectEvidence(titleSegment), padding: readBoxStyle(titleSegment) } : null,
      scrollBody: scrollBody ? { bounds: rectEvidence(scrollBody), padding: readBoxStyle(scrollBody), overflowY: getComputedStyle(scrollBody).overflowY } : null,
      slots: [...node.querySelectorAll(".tui-pattern-runtime__slot[data-pattern-slot]")].map((slot) => ({ id: slot.getAttribute("data-pattern-slot"), bounds: rectEvidence(slot), padding: readBoxStyle(slot) }))
    };
  }) : [];
  const interactiveSelector = "button, input, select, textarea, a[href], [role='button'], [role='checkbox'], [role='radio'], [role='switch'], [role='tab'], [role='menuitem'], [contenteditable='true']";
  const unclassifiedInteractive = [...root.querySelectorAll(interactiveSelector)]
    .filter((node) => !node.closest(".tui-component[data-component][data-logical-component], [data-custom-ui], [data-contract-ui]"))
    .map((node, index) => ({
      index,
      tag: node.tagName.toLowerCase(),
      role: node.getAttribute("role"),
      label: node.getAttribute("aria-label") ?? node.getAttribute("title") ?? node.textContent?.trim().slice(0, 80) ?? ""
    }));
  return {
    schemaVersion: 1,
    url: root.location?.href ?? null,
    pattern: patternRoot?.dataset.pattern ?? patternRoot?.dataset.tuiPattern ?? null,
    structureDigest: patternRoot?.dataset.structureDigest ?? null,
    stylesheets: stylesheetEvidence,
    patternLayout: patternRoot ? {
      display: patternStyle.display,
      gridTemplateColumns: patternStyle.gridTemplateColumns,
      gridTemplateRows: patternStyle.gridTemplateRows,
      bounds: rectEvidence(patternRoot),
      regions: patternRegions
    } : null,
    customRegions: [...root.querySelectorAll("[data-custom-ui]")].map((node) => node.getAttribute("data-custom-ui")).filter(Boolean),
    contractRegions: [...root.querySelectorAll("[data-contract-ui]")].map((node) => node.getAttribute("data-contract-ui")).filter(Boolean),
    unclassifiedInteractive,
    components: nodes.map((node, index) => ({
      index,
      rendererKey: node.dataset.rendererKey ?? node.dataset.component,
      componentId: node.dataset.component,
      logicalName: node.dataset.logicalComponent,
      variant: node.dataset.variant,
      state: node.dataset.state,
      region: node.closest("[data-ui-region], [data-pattern-region]")?.getAttribute("data-ui-region") ?? node.closest("[data-pattern-region]")?.getAttribute("data-pattern-region") ?? null,
      slots: [...new Set([...node.querySelectorAll("[data-slot]")].map((slotNode) => slotNode.getAttribute("data-slot")))],
      visible: Boolean(node.getClientRects().length && getComputedStyle(node).visibility !== "hidden")
    }))
  };
}

function visualNodeState(node, view) {
  const style = view.getComputedStyle(node);
  const rect = node.getBoundingClientRect();
  const visible = Boolean(node.getClientRects().length && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0);
  const labelNode = node.querySelector("[data-slot='label'], .tui-button__label");
  const label = (labelNode?.textContent ?? node.textContent ?? "").trim();
  const labelVisible = Boolean(visible && label && (!labelNode || (labelNode.getClientRects().length && view.getComputedStyle(labelNode).display !== "none")) && !node.classList.contains("tui-button--icon"));
  const iconNode = node.querySelector("[data-slot='leading'] svg, [data-slot='leading'] img, svg, img");
  const iconRect = iconNode?.getBoundingClientRect?.() ?? null;
  const mode = node.classList.contains("tui-button--icon") || !labelVisible ? "icon" : "icon-text";
  return {
    htmlSelector: node.dataset.action ? `[data-action='${node.dataset.action}']` : null,
    label: labelVisible ? label : "",
    labelVisible,
    mode,
    visible,
    buttonWidth: Number(rect.width.toFixed(3)),
    buttonHeight: Number(rect.height.toFixed(3)),
    iconSize: iconRect ? { width: Number(iconRect.width.toFixed(3)), height: Number(iconRect.height.toFixed(3)) } : null,
    color: style.color,
    backgroundColor: style.backgroundColor,
    border: style.border,
    borderRadius: style.borderRadius,
    padding: style.padding,
    gap: style.gap,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
  };
}

/**
 * Capture the HTML renderer's actual, post-CSS visual contract.
 *
 * This deliberately runs in the browser, after layout and responsive overflow
 * have settled. The Pixso compiler must consume this result; it must not infer
 * a component variant from page-data buttonType or old screenshots.
 */
export function collectHtmlVisualSnapshot(root = document, options = {}) {
  const view = root.defaultView ?? window;
  const actionsByRegion = {};
  for (const button of root.querySelectorAll("button[data-action]")) {
    // The overflow menu mirrors the visible business actions. It is not part
    // of the titlebar's rendered child order and must not overwrite the
    // computed state captured from the direct action buttons.
    if (button.matches("[data-overflow-menu-item='true']")) continue;
    const actionId = button.dataset.action;
    if (!actionId) continue;
    const uiRegion = button.closest("[data-ui-region]")?.getAttribute("data-ui-region") ?? "document";
    const region = uiRegion === "main-detail" && button.closest(".tui-titlebar__pane-actions")
      ? "detailTitlebarActions"
      : uiRegion;
    actionsByRegion[region] ??= { order: [], actions: {} };
    if (!actionsByRegion[region].order.includes(actionId)) actionsByRegion[region].order.push(actionId);
    actionsByRegion[region].actions[actionId] = visualNodeState(button, view);
  }
  return {
    schemaVersion: 2,
    source: "html-live-computed-style",
    capturedAt: new Date().toISOString(),
    url: view.location?.href ?? null,
    stateScope: options.stateScope ?? "default-visible",
    htmlSourceFingerprint: options.htmlSourceFingerprint ?? null,
    viewport: {
      width: Number(options.width ?? view.innerWidth),
      height: Number(options.height ?? view.innerHeight),
      devicePixelRatio: Number(view.devicePixelRatio ?? 1),
      zoom: Number(view.visualViewport?.scale ?? 1),
    },
    regions: actionsByRegion,
  };
}
