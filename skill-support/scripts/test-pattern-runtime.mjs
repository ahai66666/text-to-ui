#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import registry from "../assets/design-system/pattern-contracts.json" with { type: "json" };
import { renderHtmlComponent } from '../../packages/components-html/src/index.js';
import {
  createPatternRuntime,
  createSecondaryPageRuntime,
  renderPatternHtml,
  renderSecondaryPageHtml,
  resolvePatternContract,
  tokenCssVariable
} from "../../packages/pattern-runtime/src/index.js";

const patternRuntimeCss = fs.readFileSync(new URL("../../packages/pattern-runtime/src/styles.css", import.meta.url), "utf8");
const patternShellCss = fs.readFileSync(new URL("../../packages/components-html/src/pattern-shell.css", import.meta.url), "utf8");
const patternBaselineSource = fs.readFileSync(new URL("../../apps/component-gallery/pattern-baseline.js", import.meta.url), "utf8");
assert.match(patternRuntimeCss, /\.tui-pattern-runtime\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/, "Pattern Runtime must keep Global Title Layer and pane grid in one column");
assert.match(patternRuntimeCss, /\.tui-pattern-runtime\[data-pattern\][\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/, "Pattern Runtime root override must win over pattern shell pane columns");
assert.match(patternRuntimeCss, /\.tui-pattern-runtime__navigation-top\s*\{[\s\S]*padding-inline:\s*0/, "Runtime navigation top must neutralize static pattern-shell inset so the primary action has one canonical inset");
assert.match(patternRuntimeCss, /\.tui-pattern-runtime__pane\s*\{[\s\S]*box-sizing:\s*border-box/, "Runtime panes must not depend on a host page's global box-sizing reset");
assert.match(patternRuntimeCss, /\.tui-pattern-runtime__slot\s*\{[\s\S]*box-sizing:\s*border-box/, "Runtime slots must use the same box model in Renderer and generated pages");
assert.match(patternRuntimeCss, /\.tui-pattern-runtime__scroll-body\s*\{[\s\S]*box-sizing:\s*border-box/, "Runtime scroll bodies must use the same box model in Renderer and generated pages");
const patternBSecondaryList = registry.patterns.find((pattern) => pattern.id === "pattern-b-three-pane").geometry.regions["secondary-list"];
assert.equal(patternBSecondaryList.scrollBody.inset.blockStart, "space/3", "Pattern B Secondary List scroll body must use an 8px top inset");
assert.equal(patternBSecondaryList.scrollBody.inset.blockEnd, "space/0", "Pattern B Secondary List scroll body must end flush with the pane");
assert.match(patternRuntimeCss, /\[data-pattern="pattern-b-three-pane"\] \.tui-pattern-runtime__pane\[data-tui-pane-role="secondary-list"\] > \.tui-pattern-runtime__scroll-body\s*\{[\s\S]*padding-block-start:\s*var\(--space-3,\s*8px\);[\s\S]*padding-block-end:\s*var\(--space-0,\s*0px\);/, "Pattern B Secondary List runtime must use an 8px top and 0px bottom scroll-body inset");
assert.match(patternBaselineSource, /data-typography-role="title-s">全部任务/, "Pattern B list heading must use Title_S");
assert.match(patternBaselineSource, /renderHtmlComponent\("button"[\s\S]*action\/filter/, "Pattern B list heading must use a registered operation button");
assert.match(patternBaselineSource, /pattern-runtime-preview-list-heading-actions/, "Pattern B list heading must expose a right-side operation group");
assert.match(patternBaselineSource, /data-pattern-content-slot="secondary-list-card-\$\{card\.id\}"[\s\S]*data-slot="leading"[\s\S]*data-slot="content"/, "Pattern B list cards must remain distinct page-owned content slots with explicit sub-slots");
assert.match(patternRuntimeCss, /\[data-pattern="pattern-b-three-pane"\] \.tui-pattern-runtime__slot\[data-pattern-slot="primary-navigation-bottom"\]\s*\{[\s\S]*width:\s*100%;[\s\S]*justify-content:\s*space-between;/, "Pattern B primary navigation runtime must use the full available slot width");
assert.match(patternRuntimeCss, /\[data-pattern="pattern-b-three-pane"\] \.tui-pattern-runtime__slot\[data-pattern-slot="primary-navigation-bottom"\]\s*>\s*span\s*\{[\s\S]*display:\s*flex;[\s\S]*flex:\s*1 1 0;[\s\S]*justify-content:\s*center;/, "Pattern B primary navigation runtime must center direct component or behavior wrappers in equal flexible tracks");
assert.match(patternRuntimeCss, /\.tui-pattern-runtime__title-segment:first-child\s*\{[\s\S]*background:\s*var\(--color-sidebar-bg/, "Primary title segment surface must come from the shell");
assert.match(patternRuntimeCss, /\.tui-pattern-runtime__title-segment:not\(:first-child\)\s*\{[\s\S]*background:\s*var\(--color-surface/, "Non-primary title segment surface must come from the shell");
assert.match(patternRuntimeCss, /\.tui-pattern-runtime__title-segment \.tui-titlebar\s*\{[\s\S]*background:\s*var\(--color-titlebar-normal-bg,\s*transparent\)/, "Titlebar must remain transparent inside the shell title segment");
assert.match(patternRuntimeCss, /\.tui-pattern-runtime__title-segment\s*\{[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;/, "Every Pattern title segment must vertically center its content against the shared Titlebar height");
assert.match(patternRuntimeCss, /border-bottom:\s*var\(--layout-navigation-divider-width,\s*0\.5px\)\s+solid/, "Runtime structural separators must use the 0.5px divider Token");
assert.match(patternRuntimeCss, /border-inline-end:\s*var\(--layout-navigation-divider-width,\s*0\.5px\)\s+solid/, "Runtime pane and title-segment dividers must use the 0.5px divider Token");
assert.match(patternRuntimeCss, /\.tui-secondary-page-runtime__titlebar\s*\{[\s\S]*border-block-end:\s*var\(--layout-navigation-divider-width,\s*0\.5px\)\s+solid/, "Secondary Page titlebar separator must use the same 0.5px divider Token");
assert.doesNotMatch(patternRuntimeCss, /border(?:-inline-end|-bottom):\s*1px\s+solid/, "Runtime must not hard-code a thick 1px structural divider");
assert.match(patternRuntimeCss, /data-pattern-title-segment="secondary-list"\]:not\(:has\(> \.tui-titlebar\[data-pane-role="secondary-pane"\]\)\)[\s\S]*padding-inline:\s*var\(--space-5,\s*16px\)/, "Pattern B direct middle title content must use the renderer-owned 16px inset without double-padding a Titlebar middle segment");
assert.match(patternRuntimeCss, /data-pattern-title-segment="secondary-list"\][\s\S]*> \[data-tui-behavior\][\s\S]*width:\s*100%/, "A behavior-wrapped Search must still fill the middle segment");
assert.match(patternRuntimeCss, /data-pattern-title-segment="main-detail"\][\s\S]*> \[data-tui-action-behaviors\][\s\S]*width:\s*100%/, "A behavior-wrapped final Titlebar must still fill the final segment");
assert.doesNotMatch(patternRuntimeCss, /\.tui-pattern-runtime__title-segment:first-child\s*,[\s\S]*\.tui-titlebar/, "The primary shell surface must not be painted onto the Titlebar component");
assert.match(patternShellCss, /\[data-pattern\]:not\(\.tui-pattern-runtime\)\s*\{/, "Static Pattern shell styles must never target a Runtime root");
assert.match(patternShellCss, /\[data-pattern\]:not\(\.tui-pattern-runtime\) \[data-pattern-shell-slot\]\s*\{/, "Static slot styles must be contained below a static Pattern root");
assert.match(patternShellCss, /\[data-pattern\]:not\(\.tui-pattern-runtime\) \[data-pattern-scroll-body\]\s*\{/, "Static scroll-body styles must be contained below a static Pattern root");
assert.doesNotMatch(patternShellCss, /^\[data-pattern-shell-slot\]/m, "No unscoped static slot selector may leak into Runtime");
assert.doesNotMatch(patternShellCss, /^\[data-pattern-scroll-body\]/m, "No unscoped static scroll-body selector may leak into Runtime");
assert.match(patternRuntimeCss, /data-pattern="pattern-a-two-pane"[^}]*global-primary-action[\s\S]*?padding-inline: var\(--space-5, 16px\)/);
assert.match(patternRuntimeCss, /data-pattern="pattern-b-three-pane"[^}]*global-primary-action[\s\S]*?padding-inline: var\(--space-5, 16px\)/);
assert.match(patternRuntimeCss, /data-pattern="pattern-b-three-pane"[^}]*secondary-navigation-content[\s\S]*?padding-inline: var\(--space-5, 16px\)/);
assert.match(patternRuntimeCss, /data-pattern-shell-placement="bottom"[\s\S]*?padding-block-end: var\(--space-3, 8px\)/);
assert.match(patternShellCss, /data-pattern="pattern-a-two-pane"[^}]*global-primary-action[\s\S]*?padding-inline: var\(--space-5\)/);
assert.match(patternShellCss, /data-pattern-shell-slot="primary-navigation-bottom"[\s\S]*?padding-block-end: var\(--space-3\)/);
assert.match(patternShellCss, /data-pattern-title-segment="secondary-list"\]:not\(:has\(> \.tui-titlebar\[data-pane-role="secondary-pane"\]\)\)[\s\S]*padding-inline: var\(--space-5\)/, "Static Pattern must not double-apply the middle inset when Titlebar owns it");
assert.match(patternShellCss, /border-inline-end:\s*var\(--layout-navigation-divider-width,\s*0\.5px\)\s+solid/, "Static Pattern dividers must use the same 0.5px divider Token as Runtime");
assert.doesNotMatch(patternShellCss, /border-inline-end:\s*1px\s+solid/, "Static Pattern shell must not hard-code a thick 1px divider");

const singleSidebar = renderHtmlComponent("sidebar", {
  groups: [{ label: "项目", items: [{ label: "概览", icon: "navigation/grid", selected: true }] }]
});
assert.match(singleSidebar, /class="tui-component tui-sidebar"/);
assert.doesNotMatch(singleSidebar, /tui-sidebar-group/);
const groupedSidebar = renderHtmlComponent("sidebar", {
  groups: [
    { id: "project", label: "项目", items: [{ label: "概览", icon: "navigation/grid", selected: true }] },
    { id: "team", label: "团队", items: [{ label: "成员", icon: "navigation/contacts" }] }
  ]
});
assert.equal((groupedSidebar.match(/tui-sidebar-group"/g) ?? []).length, 2);
assert.equal((groupedSidebar.match(/aria-controls="sidebar-group-content-/g) ?? []).length, 2);
assert.match(groupedSidebar, /data-component="collapsible"/);

const pattern = resolvePatternContract(registry, "pattern-b-three-pane");
assert.deepEqual(pattern.paneOrder, ["primary-navigation", "secondary-list", "main-detail"]);
assert.equal(pattern.geometry.titleLayer.crossAxisAlignment, "center");
assert.equal(pattern.geometry.titleLayer.middleSegmentInsetToken, "space/5");
assert.equal(tokenCssVariable("layout/sidebar-expanded"), "--layout-sidebar-width");

const skeleton = createPatternRuntime({ registry, patternId: "pattern-b-three-pane", mode: "skeleton" }).render();
assert.match(skeleton, /data-tui-pattern="pattern-b-three-pane"/);
assert.match(skeleton, /data-pattern="pattern-b-three-pane"/);
assert.match(skeleton, /data-pattern-mode="skeleton"/);
assert.match(skeleton, /data-tui-pane-order="primary-navigation secondary-list main-detail"/);
assert.match(skeleton, /data-pattern-slot-placeholder="global-title-layer"/);
assert.match(skeleton, /data-pattern-region="secondary-list"/);
assert.match(skeleton, /data-pattern-scroll-body/);

const runtime = createPatternRuntime({
  registry,
  patternId: "pattern-a-two-pane",
  mode: "runtime",
  slots: {
    "global-title-layer": "<strong>项目空间</strong>",
    "primary-navigation-shell": "<nav aria-label=\"主导航\">导航</nav>",
    "global-primary-action": "<button type=\"button\">新建</button>",
    "main-content-title": "<h1>概览</h1>"
  },
  regionContent: { "main-content": "<p data-preview-content>业务内容</p>" }
});
const runtimeMarkup = runtime.render();
assert.match(runtimeMarkup, /data-pattern-mode="runtime"/);
assert.match(runtimeMarkup, /<h1>概览<\/h1>/);
assert.match(runtimeMarkup, /data-preview-content/);
assert.doesNotMatch(runtimeMarkup, /data-pattern-slot-placeholder/);
assert.ok(runtimeMarkup.indexOf('data-pattern-slot="global-primary-action"') < runtimeMarkup.indexOf('data-pattern-slot="primary-navigation-shell"'), 'Button must precede Sidebar');
assert.doesNotMatch(runtimeMarkup, /data-pattern-slot="primary-navigation-footer"/);
const footerMarkup = runtime.render({ slots: { ...runtime.slots, 'primary-navigation-footer': renderHtmlComponent('button', { label: '帮助', icon: 'status/info', mode: 'icon-text', variant: 'ghost' }) } });
assert.match(footerMarkup, /data-pattern-slot="primary-navigation-footer"[^>]*data-pattern-shell-placement="bottom"/);
assert.match(footerMarkup, /帮助/);
assert.match(footerMarkup, /<\/div><div class="tui-pattern-runtime__slot" data-pattern-slot="primary-navigation-footer"/);
assert.equal(resolvePatternContract(registry, 'pattern-a-two-pane').geometry.regions['primary-navigation'].scrollBody.inset.blockStart, 'space/2');
const longSidebar = Array.from({ length: 50 }, (_, i) => `<button>Sidebar ${i}</button>`).join('');
const threeMarkup = createPatternRuntime({ registry, patternId: 'pattern-b-three-pane', mode: 'runtime', slots: {
  'global-title-layer': '<strong>工作台</strong>',
  'global-primary-action': renderHtmlComponent('button', { label: '新增', variant: 'primary' }),
  'secondary-navigation-content': `<nav>${longSidebar}</nav>`,
  'primary-navigation-bottom': renderHtmlComponent('primary-navigation-item', { label: '工作台', icon: 'navigation/grid' })
} }).render();
assert.ok(threeMarkup.indexOf('data-pattern-slot="global-primary-action"') < threeMarkup.indexOf('data-pattern-slot="secondary-navigation-content"'));
assert.ok(threeMarkup.indexOf('Sidebar 49') < threeMarkup.indexOf('data-pattern-slot="primary-navigation-bottom"'));
assert.match(threeMarkup, /<\/div><div class="tui-pattern-runtime__slot" data-pattern-slot="primary-navigation-bottom"/);
assert.doesNotMatch(threeMarkup, /pane-title[^>]*data-pattern-shell-slot="navigation-top"/);
assert.equal(resolvePatternContract(registry, 'pattern-b-three-pane').geometry.regions['primary-navigation'].scrollBody.inset.blockStart, 'space/2');
assert.throws(() => renderPatternHtml({ contract: pattern, mode: "runtime", slots: {} }), /requires 1 value/);
assert.throws(() => resolvePatternContract(registry, "not-a-pattern"), /Unknown Pattern Contract/);

const secondarySkeleton = renderSecondaryPageHtml({ layout: "new-page", mode: "skeleton" });
assert.match(secondarySkeleton, /data-secondary-page-layout="new-page"/);
assert.match(secondarySkeleton, /data-secondary-page-slot-placeholder="titlebar"/);
const secondaryRuntime = createSecondaryPageRuntime({
  layout: "continuation",
  mode: "runtime",
  slots: {
    navigation: "<nav>导航</nav>",
    titlebar: renderHtmlComponent("titlebar", { paneTitle: "项目设置", size: "large", layout: "two-column", paneRole: "final-pane", mainContentLeading: { id: "back", label: "返回项目", icon: "navigation/back", buttonType: "icon" } }),
    content: "<main>内容</main>"
  }
}).render();
assert.match(secondaryRuntime, /data-secondary-page-runtime="true"/);
assert.match(secondaryRuntime, /data-size="large"/);
const secondaryNewPageRuntime = createSecondaryPageRuntime({
  layout: "new-page",
  mode: "runtime",
  slots: { titlebar: renderHtmlComponent("titlebar", { label: "项目设置", size: "small", layout: "standalone", paneRole: "global" }), content: "<main>内容</main>" }
}).render();
assert.match(secondaryNewPageRuntime, /data-size="small"/);
assert.match(secondaryNewPageRuntime, /data-secondary-page-layout="new-page"/);
assert.doesNotMatch(secondaryNewPageRuntime, /role="dialog"|aria-modal=/, "a pop-up Secondary Page remains a page frame, not Dialog markup");
assert.match(patternRuntimeCss, /\.tui-secondary-page-runtime--new-page > \.tui-secondary-page-runtime__content\s*\{[^}]*padding:\s*var\(--space-5, 16px\) var\(--space-6, 24px\) 0;/, "Independent Secondary Page content must use the 16/24/0 safe area");
assert.throws(() => renderSecondaryPageHtml({ layout: "continuation", mode: "runtime", slots: {} }), /requires a value/);

console.log("Pattern Runtime tests passed.");
