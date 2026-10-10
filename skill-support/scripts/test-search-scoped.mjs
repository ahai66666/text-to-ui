#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderHtmlComponent, renderRuntimeHtmlComponent } from "../../packages/components-html/src/index.js";

const css = fs.readFileSync(new URL("../../packages/component-styles/src/index.css", import.meta.url), "utf8");
const searchContract = JSON.parse(fs.readFileSync(new URL("../../packages/component-contracts/src/components.json", import.meta.url))).components.find((component) => component.id === "search");
assert.deepEqual(searchContract.states, ["default", "focus", "typing", "filled", "hover-left", "hover-right", "pressed-left", "pressed-right", "disabled"]);
assert.deepEqual(searchContract.allowedStates, searchContract.states, "Search allowed states must match its nine Pixso states exactly");
assert.deepEqual(searchContract.variants, ["default", "advanced-search", "scoped-search", "scoped-advanced-search"]);
assert.equal(searchContract.slotContracts["scope-selector"].control, "dropdown-menu");
assert.ok(!searchContract.states.includes("error") && !searchContract.allowedStates.includes("error"), "Search contract must not expose an Error state");
assert.ok(!searchContract.variants.some((variant) => /error/i.test(variant)), "Search must not expose an Error variant");
assert.match(css, /\.tui-search:has\(\.tui-search__scope\)\s*\{ gap: 0; padding: 0; border: 0; \}/, "Scoped Search root keeps its Pixso zero-gap, zero-padding geometry");
assert.match(css, /\.tui-search\[data-surface="gray"\]\[data-state="hover-left"\] > \.tui-search__scope[^\{]*\{[^}]*color-input-hover-bg-on-subtle-layer[^}]*box-shadow: inset 0 0 0 2px/);
assert.match(css, /\.tui-search\[data-surface="gray"\]\[data-state="hover-right"\] > \.tui-search__input-region[^\{]*\{[^}]*color-input-hover-bg-on-subtle-layer[^}]*box-shadow: inset 0 0 0 2px/);
assert.match(css, /\.tui-search\[data-surface="gray"\]\[data-state="pressed-left"\] > \.tui-search__scope[^\{]*\{[^}]*color-neutral-dark-10[^}]*box-shadow: inset 0 0 0 2px/);
assert.match(css, /\.tui-search\[data-surface="gray"\]\[data-state="pressed-right"\] > \.tui-search__input-region[^\{]*\{[^}]*color-neutral-dark-10[^}]*box-shadow: inset 0 0 0 2px/);
assert.match(css, /\.tui-search:not\(\[data-surface="gray"\]\)\[data-state="hover-left"\] > \.tui-search__scope[^\{]*\{ background: var\(--color-neutral-dark-05\); \}/);
assert.match(css, /\.tui-search:not\(\[data-surface="gray"\]\)\[data-state="hover-right"\] > \.tui-search__input-region[^\{]*\{ background: var\(--color-neutral-dark-10\); \}/, "White-content Search right hover remains unchanged");
assert.match(css, /\.tui-search:not\(\[data-surface="gray"\]\)\[data-state="pressed-right"\] > \.tui-search__input-region[^\{]*\{ background: var\(--color-neutral-dark-15\); \}/);
assert.doesNotMatch(css, /\.tui-search:has\(\.tui-search__scope\):hover[^\{]*\{\s*background:/, "Scoped Search must not add a hover fill to the full root");
assert.doesNotMatch(css, /\.tui-search\[data-state="(?:hover|pressed)"\]/, "Search must not expose generic Hover or Pressed styles");
assert.doesNotMatch(css, /\.tui-search\[data-state="error"\]/, "Search must not have Error styling");
assert.match(css, /\.tui-search__scope\.tui-advanced-menu::after\s*\{[^}]*height:\s*var\(--space-5\)/, "Scoped Search needs a 16px internal category divider");
assert.doesNotMatch(css, /\.tui-search__scope\.is-selected \.tui-advanced-menu__trigger[^}]*border:\s*2px solid var\(--color-focus-ring\)/, "Selected Search scope must not add a blue border");
assert.doesNotMatch(css, /\.tui-search__scope \.tui-advanced-menu__trigger\[aria-expanded="true"\][^}]*outline:/, "Opening Search scope must not add a blue outline");
assert.doesNotMatch(css, /\.tui-search__scope select\s*\{/, "Scoped Search must use Dropdown Menu instead of a native selector");
assert.match(css, /\.tui-search__input-region\s*\{[^}]*flex:\s*1 1 auto[^}]*padding-inline-start:\s*0;/, "Search needs an input hot zone");
assert.match(css, /\.tui-search__input-region\s*\{[^}]*background:\s*transparent;/, "Search input hot zone must keep the mapped Search surface visible");
assert.match(css, /\.tui-search__scope \.tui-advanced-menu__trigger:hover\s*\{ background:\s*transparent; \}/, "Scoped Search scope hover must keep the Search surface visible");
assert.match(css, /\.tui-search__scope \.tui-advanced-menu__trigger\s*\{[^}]*font-size:\s*var\(--type-body-l-size\)[^}]*font-weight:\s*var\(--type-body-l-weight\)/, "Search scope label uses Body_L");
assert.match(css, /\.tui-search__scope \.tui-advanced-menu__trigger > \.tui-icon:last-child\s*\{[^}]*color:\s*var\(--color-icon\)/, "Search scope chevron uses primary icon color");
assert.match(css, /\.tui-search \[data-slot="clear"\]\s*\{[^}]*width:\s*var\(--icon-size-sm\)[^}]*height:\s*var\(--icon-size-sm\)[^}]*color:\s*var\(--color-icon\)/, "Search clear icon is 16px and primary");
assert.match(css, /\.tui-search input::placeholder\s*\{ color:\s*var\(--color-text-muted\); \}/, "Search placeholder uses secondary text color");

const scopedProps = { scopeOptions: ["全部", "标题", "内容"], defaultScope: "标题", advancedSearch: true, value: "HarmonyOS" };
assert.equal(searchContract.slotContracts["scope-selector"].optional, true);
assert.equal(searchContract.slotContracts["scope-selector"].configurable, true);
assert.equal(searchContract.slotContracts["advanced-search"].optional, true);
assert.equal(searchContract.slotContracts["advanced-search"].configurable, true);
assert.deepEqual(searchContract.slotContracts["scope-selector"].coexistenceOrder, ["scope-selector", "leading", "value", "clear", "advanced-search"]);
const html = renderHtmlComponent("search", scopedProps);
assert.match(html, /data-variant="scoped-advanced-search"/);
assert.match(html, /data-slot="scope-selector"/);
assert.match(html, /data-component="dropdown-menu"/);
assert.match(html, /aria-label="搜索范围"/);
assert.match(html, /data-scope-option="标题"/);
assert.match(html, /data-slot="value"[^>]*>标题<\/span>/);
assert.match(html, /data-search-input-region/);
assert.doesNotMatch(html, /data-scope-control|<select/);
assert.ok(html.indexOf('data-slot="scope-selector"') < html.indexOf('data-slot="leading"'), "Scope selector must lead the search icon");
assert.ok(html.indexOf('data-slot="scope-selector"') < html.indexOf('data-search-input-region'), "Scope selector must precede the input hot zone");
assert.ok(html.indexOf('data-slot="clear"') < html.indexOf('data-slot="advanced-search"'), "Clear must precede Advanced Search");
assert.doesNotMatch(renderHtmlComponent("search", {}), /scope-selector/);
const htmlFilled = renderHtmlComponent("search", { value: "项目" });
assert.match(htmlFilled, /data-state="filled"/);
assert.match(htmlFilled, /data-variant="default"/);
assert.doesNotMatch(htmlFilled, /aria-invalid/);
assert.match(renderHtmlComponent("search", { state: "typing", value: "项目" }), /data-state="typing"/);
assert.match(renderHtmlComponent("search", { state: "error" }), /data-state="default"/, "Unsupported Search Error input must fall back to Default");
assert.doesNotMatch(renderHtmlComponent("search", { state: "error" }), /aria-invalid|input-error-border/);
for (const state of ["hover-left", "hover-right", "pressed-left", "pressed-right"]) {
  assert.match(renderHtmlComponent("search", { state, scopeOptions: ["全部", "标题"] }), new RegExp(`data-state="${state}"`));
}
assert.match(renderHtmlComponent("search", { value: "项目", state: "disabled" }), /data-state="disabled"[^>]*>[\s\S]*?<input[^>]*disabled[^>]*>[\s\S]*?<button[^>]*disabled/);
const runtimeSearch = renderRuntimeHtmlComponent("search");
assert.match(runtimeSearch, /Search · Scoped/);
assert.equal((runtimeSearch.match(/data-surface-context=/g) ?? []).length, 2, "Search runtime should show two surface variants");
assert.match(runtimeSearch, /tui-runtime-search-pair/, "Search runtime variants should stack in their own layout");
assert.match(runtimeSearch, /白色内容面 · 灰色搜索面/);
assert.match(runtimeSearch, /灰色内容面 · 白色搜索面/);
assert.equal((runtimeSearch.match(/data-slot="scope-selector"/g) ?? []).length, 2, "Both Search surface variants need the configurable scope slot");
assert.doesNotMatch(runtimeSearch, /白色内容面 · 白色搜索面/, "Search runtime must preserve the gray search surface variant");

const require = createRequire(new URL("../../apps/component-gallery/package.json", import.meta.url));
const pixsoSpecs = JSON.parse(fs.readFileSync(new URL("../assets/design-system/pixso-component-specs.json", import.meta.url), "utf8"));
const pixsoFacts = JSON.parse(fs.readFileSync(new URL("../assets/design-system/pixso-component-facts.json", import.meta.url), "utf8"));
const searchFacts = pixsoFacts.componentSets.find((component) => component.name === "Search");
assert.equal(searchFacts.variants.length, 18, "Live Pixso Search facts must include all 9 states on both surfaces");
assert.deepEqual(searchFacts.variantAxes.state, ["Default", "Disabled", "Filled", "Focus", "Hover-left", "Hover-right", "Pressed-left", "Pressed-right", "Typing"]);
assert.ok(searchFacts.variants.every((variant) => variant.geometry?.width === 324 && variant.geometry?.height === 40));
assert.equal(pixsoSpecs.components["Search/Scoped/Default"].textRoles.Scope, "Body_L");
assert.equal(pixsoSpecs.components["Search/Scoped/Default"].slotContracts["scope-selector"].width, 73);
assert.equal(pixsoSpecs.components["Search/Scoped/Default"].interactionRegions.hover.left.whiteContent, "neutral-dark/05");
assert.equal(pixsoSpecs.components["Search/Scoped/Default"].interactionRegions.hover.right.whiteContent, "neutral-dark/10");
assert.equal(pixsoSpecs.components["Search/Scoped/Default"].interactionRegions.grayContentOutline.width, 2);
for (const name of ["Search/White Surface/Default", "Search/Gray Surface/Default", "Search/Scoped/Default"]) {
  assert.equal(pixsoSpecs.components[name].sizing.masterWidth, 324, `${name} Pixso width`);
}
const { build } = await import(pathToFileURL(require.resolve("vite")));
const { default: vuePlugin } = await import(pathToFileURL(require.resolve("@vitejs/plugin-vue")));
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { h } = require("vue");
const { renderToString } = require("vue/server-renderer");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tui-search-scoped-"));
try {
  const peers = ["vue", "react"];
  await build({ configFile: false, root: fileURLToPath(new URL("../..", import.meta.url)), plugins: [vuePlugin()], logLevel: "error",
    build: { ssr: true, outDir: temp, emptyOutDir: false, rollupOptions: {
      input: { react: fileURLToPath(new URL("../../packages/components-react/src/index.jsx", import.meta.url)), vue: fileURLToPath(new URL("../../packages/components-vue/src/Search.vue", import.meta.url)) },
      external: peers,
      output: { entryFileNames: "[name].mjs", paths: id => peers.includes(id) ? require.resolve(id) : id }
    } }
  });
  const { Search: ReactSearch } = await import(pathToFileURL(path.join(temp, "react.mjs")));
  const { default: VueSearch } = await import(pathToFileURL(path.join(temp, "vue.mjs")));
  const toVueProps = ({ value, ...props }) => ({ ...props, modelValue: value });
  const renderers = {
    react: () => renderToStaticMarkup(React.createElement(ReactSearch, scopedProps)),
    vue: () => renderToString(h(VueSearch, toVueProps(scopedProps)))
  };
  for (const [framework, render] of Object.entries(renderers)) {
    const markup = await render();
    assert.match(markup, /data-variant="scoped-advanced-search"/, `${framework} scoped advanced variant`);
    assert.match(markup, /data-slot="scope-selector"/, `${framework} scope selector slot`);
    assert.match(markup, /tui-advanced-menu__trigger/, `${framework} Dropdown Menu trigger`);
    assert.match(markup, /data-search-input-region/, `${framework} input hot zone`);
    assert.doesNotMatch(markup, /data-scope-control|<select/, `${framework} must not render a native selector`);
    assert.match(markup, /标题/, `${framework} scope option`);
    assert.ok(markup.indexOf('data-slot="scope-selector"') < markup.indexOf('data-slot="leading"'), `${framework} slot order`);
  }
  const stateRenderers = {
    react: props => renderToStaticMarkup(React.createElement(ReactSearch, props)),
    vue: props => renderToString(h(VueSearch, toVueProps(props)))
  };
  for (const [framework, render] of Object.entries(stateRenderers)) {
    assert.match(await render({ value: "项目" }), /data-state="filled"/, `${framework} filled state`);
    assert.match(await render({ value: "项目", state: "typing" }), /data-state="typing"/, `${framework} typing state`);
    for (const state of ["hover-left", "hover-right", "pressed-left", "pressed-right"]) {
      assert.match(await render({ state, scopeOptions: ["全部", "标题"] }), new RegExp(`data-state="${state}"`), `${framework} ${state} state`);
    }
    assert.match(await render({ state: "error" }), /data-state="default"/, `${framework} does not expose Error state`);
    const disabledMarkup = await render({ value: "项目", state: "disabled" });
    assert.match(disabledMarkup, /data-state="disabled"/);
    assert.match(disabledMarkup, /<input[^>]*disabled/);
    assert.match(disabledMarkup, /<button[^>]*(?:data-slot="clear"[^>]*disabled|disabled[^>]*data-slot="clear")/);
    assert.doesNotMatch(disabledMarkup, /aria-invalid/);
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log("Search state and Scoped contract passed HTML / React / Vue rendering.");
