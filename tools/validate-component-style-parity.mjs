import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const packageCss = read("packages/component-styles/src/index.css");
const compatibilityCss = read("packages/component-contracts/src/components.css");
const gallery = read("apps/component-gallery/index.html");
const galleryCss = read("apps/component-gallery/gallery.css");
const galleryRuntime = read("apps/component-gallery/preview.js");
const contracts = JSON.parse(read("packages/component-contracts/src/components.json"));
const iconAliases = JSON.parse(read("skill-support/assets/icons/icon-aliases.json"));
const sprite = read("packages/components-html/src/component-icons.svg");

const failures = [];
// Compare declarations rather than a serialized rule; whitespace/order are not behavior.
const buttonRule = packageCss.match(/\.tui-button\[data-mode="icon-text"\]\[data-variant="ghost"\]\s*\{([^}]+)\}/)?.[1] ?? "";
const declarations = Object.fromEntries(buttonRule.split(";").filter(x => x.includes(":")).map(x => { const i = x.indexOf(":"); return [x.slice(0, i).trim(), x.slice(i + 1).trim()]; }));
for (const [property, expected] of Object.entries({ color: "var(--color-text)", gap: "var(--gap-button-icon-label)", "padding-inline": "var(--space-3)" })) {
  if (declarations[property] !== expected) failures.push("icon-text ghost " + property + ": expected " + expected + ", got " + declarations[property]);
}
const tabsListRule = packageCss.match(/\.tui-tabs__list\s*\{([^}]+)\}/)?.[1] ?? "";
const tabsListDeclarations = Object.fromEntries(tabsListRule.split(";").filter(x => x.includes(":")).map(x => { const i = x.indexOf(":"); return [x.slice(0, i).trim(), x.slice(i + 1).trim()]; }));
for (const [property, expected] of [["height", "var(--height-tab-line)"], ["box-sizing", "border-box"]]) {
  if (tabsListDeclarations[property] !== expected) failures.push(`tabs list ${property}: expected ${expected}, got ${tabsListDeclarations[property]}`);
}
const requireText = (source, text, label) => { if (!source.includes(text)) failures.push(`${label}: missing ${text}`); };

for (const token of [
  "--height-button",
  "--padding-button-x",
  "--gap-button-icon-label",
  "--type-body-l-size",
  "--type-body-m-size",
  "--height-input",
  "--height-titlebar-sm",
  "--height-titlebar-md",
  "--height-titlebar-lg",
  "--height-titlebar-xl",
  "--size-icon-button",
  "--color-sidebar-selected",
  "--state-layer-pressed"
]) requireText(packageCss, token, "canonical component CSS");

for (const selector of [
  ".tui-button",
  ".tui-input",
  ".tui-search",
  ".tui-sidebar-item",
  ".tui-primary-navigation-item",
  ".tui-list-card",
  ".tui-titlebar[data-size=\"small\"]",
  ".tui-titlebar[data-size=\"medium\"]",
  ".tui-titlebar[data-size=\"large\"]",
  ".tui-titlebar[data-size=\"xlarge\"]",
  ".tui-button--icon[data-variant=\"ghost\"]",
  ".tui-button[data-mode=\"icon-text\"][data-variant=\"ghost\"]",
  ".tui-split-button__control > .tui-button[data-variant=\"ghost\"]"
]) requireText(packageCss, selector, "component contract CSS");
for (const token of ["--height-button", "--padding-button-x", "--type-body-l-size", "--height-input", "--height-titlebar-sm", "--height-titlebar-md", "--height-titlebar-lg", "--height-titlebar-xl", "--size-icon-button", "--color-sidebar-selected", "--state-layer-pressed"]) requireText(packageCss, token, "component contract CSS");
for (const rule of [
  "min-width: var(--size-icon-button)",
  "max-width: var(--size-icon-button)",
  "border: 2px solid var(--color-input-hover-border-on-subtle)",
  "linear-gradient(var(--color-input-hover-bg-on-subtle-layer)",
  "padding-inline: 11px",
  ".tui-titlebar[data-state=\"unfocus\"]"
]) requireText(packageCss, rule, "component geometry/state CSS");
requireText(gallery, 'data-view="runtime"', "current component gallery runtime view");
if (/legacy-skill|data-legacy-path|framework-component-contract|component-gallery\.html/.test(gallery)) failures.push("current component gallery must not link or copy historical Skill previews");
requireText(galleryRuntime, 'import "../../packages/components-html/src/styles.css"', "component gallery component stylesheet entry");
requireText(galleryRuntime, 'import "./framework-runtime.css"', "component gallery runtime stylesheet entry");
requireText(galleryRuntime, 'import "./gallery.css"', "component gallery shell stylesheet entry");
if (galleryCss.includes("@import")) failures.push("component gallery shell CSS must not contain unresolved imports");
requireText(compatibilityCss, "../../component-styles/src/index.css", "component contract compatibility stylesheet");

if (Object.values(iconAliases.aliases).some((entry) => entry.source === "harmonyos")) failures.push("HarmonyOS icon aliases are forbidden; use pinned Lucide or an approved special asset");
if (sprite.includes("data-harmonyos-symbol")) failures.push("component icon sprite still contains HarmonyOS symbols");
if (packageCss.includes("tui-icon--filled")) failures.push("component CSS still exposes the removed Filled icon mode");
for (const relative of [
  "packages/components-html/src/icon-map.js",
  "packages/components-react/src/icon-map.js",
  "packages/components-vue/src/icon-map.js",
  "packages/components-html/src/search.html",
  "packages/components-html/src/sidebar.html",
  "packages/components-html/src/primary-navigation-item.html",
  "packages/components-html/src/list-card.html"
]) {
  const source = read(relative);
  if (source.includes('data-icon-kind="filled"') || source.includes("tui-icon--filled") || source.includes('"kind": "filled"')) failures.push(`${relative}: contains removed Filled icon mode`);
}
const collectIconFiles = (directory) => fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
  const relative = path.join(directory, entry.name);
  return entry.isDirectory() ? collectIconFiles(relative) : [relative];
});
const filledHarmonyFiles = collectIconFiles("skill-support/assets/icons/harmonyos").filter((file) => /(?:^|_)fill(?:ed)?(?:_|\.svg$)/i.test(path.basename(file)));
if (filledHarmonyFiles.length) failures.push(`HarmonyOS Filled asset files remain: ${filledHarmonyFiles.length}`);

for (const component of contracts.components) {
  for (const alias of component.iconAliases ?? []) {
    const symbolId = `tui-${alias.replaceAll("/", "-")}`;
    if (!sprite.includes(`id=\"${symbolId}\"`)) failures.push(`${component.id}: icon alias ${alias} missing from sprite`);
  }
}

const titlebar = contracts.components.find((component) => component.id === "titlebar");
const expectedTitlebarSpecimens = ["small-normal", "small-unfocus", "medium-normal", "medium-unfocus", "large-normal", "large-unfocus", "xlarge-normal", "xlarge-unfocus"];
if (JSON.stringify(titlebar?.specimens?.map((specimen) => specimen.id)) !== JSON.stringify(expectedTitlebarSpecimens)) failures.push("titlebar: S/M/L/XL Normal/Unfocus specimens are incomplete");
for (const value of ["standalone", "two-column", "three-column"]) if (!titlebar?.structuralAxes?.layout?.includes(value)) failures.push(`titlebar: missing layout axis ${value}`);
for (const value of ["global", "primary-navigation", "secondary-pane", "final-pane"]) if (!titlebar?.structuralAxes?.paneRole?.includes(value)) failures.push(`titlebar: missing paneRole axis ${value}`);
if (titlebar?.slotContracts?.["main-content-title"]?.activeWhen?.layout !== "two-column") failures.push("titlebar: two-column title slot contract is missing");
if (titlebar?.slotContracts?.["main-detail-actions"]?.activeWhen?.layout !== "three-column") failures.push("titlebar: three-column Main Detail action slot contract is missing");
if (JSON.stringify(titlebar?.slotContracts?.["main-detail-actions"]?.allowedButtonTypes) !== JSON.stringify(["icon", "icon-text-ghost"])) failures.push("titlebar: Main Detail action slot button type contract is invalid");
if (titlebar?.dividerRules?.["two-column"]?.["primary-navigation"] !== "no-horizontal-divider") failures.push("titlebar: two-column primary-navigation divider rule is missing");
if (titlebar?.dividerRules?.["two-column"]?.["final-pane"] !== "no-horizontal-divider") failures.push("titlebar: two-column final-pane divider rule is missing");
if (titlebar?.dividerRules?.["three-column"]?.["primary-navigation"] !== "no-horizontal-divider") failures.push("titlebar: three-column primary-navigation divider rule is missing");
if (titlebar?.dividerRules?.["three-column"]?.["final-pane"] !== "bottom-divider") failures.push("titlebar: three-column final-pane divider rule is missing");
for (const rule of [
  ".tui-titlebar {",
  "border-bottom: 0",
  ".tui-titlebar[data-layout=\"two-column\"][data-pane-role=\"final-pane\"] { border-bottom: 0",
  ".tui-titlebar[data-layout=\"three-column\"][data-pane-role=\"final-pane\"] { border-bottom: var(--layout-navigation-divider-width) solid var(--color-border)"
]) requireText(packageCss, rule, "Titlebar layout CSS");
const attachment = contracts.components.find((component) => component.id === "attachment");
if (!attachment?.tokenRoles?.includes("color.surface-muted") || attachment?.tokenRoles?.includes("color.border")) failures.push("attachment: neutral-dark.5 surface role must replace the default border surface roles");
if (attachment?.slotContracts?.actions?.defaultPlacement !== "trailing-end" || attachment?.slotContracts?.actions?.control !== "attachment-action-menu") failures.push("attachment: trailing action menu contract is missing");
for (const rule of [
  ".tui-attachment {",
  "border: 0",
  "background: var(--color-neutral-dark-05)",
  ".tui-attachment__actions {",
  ".tui-attachment__menu-trigger",
  ".tui-attachment__menu-trigger > .tui-icon { width: var(--icon-size-md); height: var(--icon-size-md);",
  ".tui-attachment__menu {",
  "right: 0"
]) requireText(packageCss, rule, "Attachment interaction CSS");
const input = contracts.components.find((component) => component.id === "input");
if (input?.allowedStates?.includes("selected")) failures.push("input: selected is not a legal input state");
const radio = contracts.components.find((component) => component.id === "radio");
if (radio?.logicalName !== "Radio/Unselected/Default" || !radio?.slots?.includes("control") || !radio?.slots?.includes("label")) failures.push("radio: standalone control and label slots are required");
for (const rule of [
  ".tui-radio {",
  ".tui-radio__indicator { width: var(--radio-size); height: var(--radio-size);",
  ".tui-radio input:checked + .tui-radio__indicator"
]) requireText(packageCss, rule, "Radio component CSS");
const search = contracts.components.find((component) => component.id === "search");
const searchStates = ["default", "focus", "typing", "filled", "hover-left", "hover-right", "pressed-left", "pressed-right", "disabled"];
if (JSON.stringify(search?.states) !== JSON.stringify(searchStates) || JSON.stringify(search?.allowedStates) !== JSON.stringify(searchStates)) failures.push("search: states must match the nine current Pixso states");
if (search?.states?.includes("error") || search?.allowedStates?.includes("error")) failures.push("search: Error is not a supported state");
if (!search?.slots?.includes("advanced-search")) failures.push("search: advanced-search slot is missing");
if (search?.slotContracts?.["advanced-search"]?.defaultPlacement !== "trailing-after-clear") failures.push("search: advanced-search placement contract is missing");
if (JSON.stringify(search?.slotContracts?.["advanced-search"]?.coexistenceOrder) !== JSON.stringify(["clear", "advanced-search"])) failures.push("search: clear and advanced-search order is invalid");
if (search?.slotContracts?.["advanced-search"]?.control !== "small-text-button") failures.push("search: advanced-search must use a small text button");
if (search?.slotContracts?.["advanced-search"]?.variant !== "ghost") failures.push("search: advanced-search button variant must be ghost");
if (search?.slotContracts?.["advanced-search"]?.size !== "small") failures.push("search: advanced-search button size must be small");
if (search?.slotContracts?.["advanced-search"]?.mode !== "text") failures.push("search: advanced-search button mode must be text");
if (search?.slotContracts?.["advanced-search"]?.textColorToken !== "color.text-muted") failures.push("search: advanced-search text must use color.text-muted");
if (search?.slotContracts?.["advanced-search"]?.trailingInsetToken !== "space/2") failures.push("search: advanced-search trailing inset must use space/2");
requireText(packageCss, ".tui-search__advanced", "Search advanced slot CSS");
requireText(packageCss, ".tui-search__advanced { flex: 0 0 auto;", "Search advanced text button sizing");
requireText(packageCss, ".tui-search .tui-search__advanced { color: var(--color-text-muted);", "Search advanced secondary text color");
requireText(packageCss, ".tui-search:has([data-slot=\"advanced-search\"]):not(:has(.tui-search__scope)) { padding-right: var(--space-2);", "Search advanced trailing inset without scope");
for (const rule of [
  ".tui-search__input-region { min-width: 0; height: 100%; display: flex; align-items: center; gap: var(--space-3); flex: 1 1 auto; padding-inline-start: 0;",
  ".tui-search:has(.tui-search__scope) { gap: 0; padding: 0; border: 0; }",
  ".tui-search:has(.tui-search__scope) > .tui-search__input-region { padding-inline: var(--space-3) var(--space-2);",
  ".tui-search__scope.tui-advanced-menu { width: 73px; min-width: 73px; height: 100%;",
  ".tui-search[data-surface=\"gray\"][data-state=\"hover-left\"] > .tui-search__scope",
  ".tui-search[data-surface=\"gray\"][data-state=\"hover-right\"] > .tui-search__input-region",
  ".tui-search[data-surface=\"gray\"][data-state=\"pressed-left\"] > .tui-search__scope",
  ".tui-search[data-surface=\"gray\"][data-state=\"pressed-right\"] > .tui-search__input-region",
  "box-shadow: inset 0 0 0 2px var(--color-input-hover-border-on-subtle)",
  ".tui-search__scope .tui-advanced-menu__trigger > .tui-icon:last-child { margin: 0; width: var(--size-6); height: var(--size-6); color: var(--color-icon);",
  ".tui-search [data-slot=\"clear\"] { width: var(--icon-size-sm); height: var(--icon-size-sm); flex: 0 0 var(--icon-size-sm); color: var(--color-icon);",
  ".tui-search input::placeholder { color: var(--color-text-muted); }"
]) requireText(packageCss, rule, "Search split hover-zone CSS");
requireText(packageCss, ".tui-primary-navigation-item [data-slot=\"icon\"] { width: var(--icon-size-lg); height: var(--icon-size-lg);", "Primary navigation regular icon sizing");
for (const rule of [
  ".tui-disclosure__trigger > [data-slot=\"label\"] { min-width: 0; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }",
  ".tui-generated__disclosure > [data-slot=\"label\"] { min-width: 0; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }"
]) requireText(packageCss, rule, "Disclosure long-label ellipsis CSS");
for (const rule of [
  "padding-inline: var(--padding-popup-menu)",
  ".tui-advanced-menu__item { min-height: var(--height-menu-item); display: flex; align-items: center; gap: var(--gap-menu-item-content); padding-inline: var(--padding-menu-item-x);"
]) requireText(packageCss, rule, "Menu hover inset CSS");
const semiModal = contracts.components.find((component) => component.id === "semi-modal");
if (semiModal?.slotContracts?.close?.iconSize !== "20px" || semiModal?.slotContracts?.close?.trailingInset !== "16px") failures.push("semi-modal: close icon and trailing inset contract is invalid");
for (const rule of [
  ".tui-dialog--semi .tui-dialog__header { padding-right: var(--space-5); }",
  ".tui-dialog--semi .tui-dialog__close > .tui-icon { width: var(--icon-size-md); height: var(--icon-size-md); }"
]) requireText(packageCss, rule, "Semi-modal geometry CSS");
const textarea = contracts.components.find((component) => component.id === "textarea");
if (JSON.stringify(textarea?.specimens?.map((specimen) => specimen.surface)) !== JSON.stringify(["white", "gray"])) failures.push("textarea: white/gray surface specimens are incomplete");
if (JSON.stringify(textarea?.allowedStates) !== JSON.stringify(["default", "hover", "focus", "filled", "error", "disabled"])) failures.push("textarea: state matrix must match Input without selected");
if (textarea?.allowedStates?.includes("selected")) failures.push("textarea: selected is not a legal textarea state");
for (const rule of [
  ".tui-textarea[data-surface=\"gray\"][data-state=\"hover\"] > textarea",
  ".tui-textarea[data-surface=\"gray\"][data-state=\"focus\"] > textarea",
  "padding-inline: 11px",
  "--min-height-textarea"
]) requireText(packageCss, rule, "textarea parity CSS");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Component style parity: ok (canonical Skill rules, contract adapters, and icon aliases are aligned)");
