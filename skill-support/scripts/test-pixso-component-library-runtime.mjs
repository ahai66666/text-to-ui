#!/usr/bin/env node

import assert from "node:assert/strict";

await import("./pixso-native-execution-runtime.js");

function descendants(node) {
  return (node.children ?? []).flatMap((child) => [child, ...descendants(child)]);
}

function makeNode(type) {
  return {
    id: `${type}-${Math.random()}`,
    type,
    name: "",
    children: [],
    fills: [],
    strokes: [],
    cornerRadius: 0,
    width: 1,
    height: 1,
    appendChild(child) { this.children.push(child); child.parent = this; },
    resize(width, height) { this.width = width; this.height = height; },
    setBoundVariable(property, variable) { this.boundVariables ??= {}; this.boundVariables[property] = { type: "VARIABLE_ALIAS", id: variable.id ?? variable.name }; },
    setPluginData(key, value) { this.pluginData ??= {}; this.pluginData[key] = value; },
    getPluginData(key) { return this.pluginData?.[key] ?? ""; },
    findAll(predicate) { return descendants(this).filter(predicate); },
  };
}

function makeComponent() {
  const component = makeNode("COMPONENT");
  component.componentPropertyDefinitions = {};
  component.addComponentProperty = (name, type, defaultValue) => {
    component.componentPropertyDefinitions[name] = { type, defaultValue };
  };
  return component;
}

const library = { ...makeNode("PAGE"), id: "page-library", name: "NewComponents" };
const variables = [
  { id: "var-neutral-dark-05", name: "neutral-dark/05", resolvedType: "COLOR", value: { r: 0, g: 0, b: 0, a: 0.05 } },
  { id: "var-radius-08", name: "radius/08", resolvedType: "FLOAT", value: 8 },
  { id: "var-size-40", name: "size/40", resolvedType: "FLOAT", value: 40 },
  { id: "var-size-16", name: "size/16", resolvedType: "FLOAT", value: 16 },
];
const pixso = {
  currentPage: library,
  root: { children: [library] },
  variables: {
    getLocalVariablesAsync: async () => variables,
    setBoundVariableForPaint(paint, channel, variable) {
      return { ...paint, boundVariables: { [channel]: { type: "VARIABLE_ALIAS", id: variable.id } } };
    },
  },
  getLocalTextStylesAsync: async () => [{ id: "style-body", name: "typography/body" }],
  getLocalEffectStylesAsync: async () => [],
  createComponent: async () => makeComponent(),
  createFrame: () => makeNode("FRAME"),
  createText: () => makeNode("TEXT"),
};

const plan = {
  schemaVersion: 1,
  kind: "pixso-component-library-plan",
  execution: { libraryPage: "NewComponents", targetPage: "NewComponents", mode: "component-library" },
  page: { name: "NewComponents", targetPage: "NewComponents" },
  resources: { componentLibraryPage: "NewComponents", variableAliases: {}, styles: [{ ref: "$style/typography/body" }] },
  operations: [
    {
      op: "create-component",
      phase: "library",
      nodeId: "component-search-white-surface-advanced",
      parentId: null,
      name: "Search/White Surface/Advanced",
      region: "fields",
      layout: {
        direction: "HORIZONTAL",
        width: { ref: "$variable/size/40", value: 40 },
        height: { ref: "$variable/size/40", value: 40 },
        padding: { left: { ref: "$variable/size/16", value: 16 }, right: { ref: "$variable/size/16", value: 16 } },
      },
      style: { fill: { ref: "$variable/neutral-dark/05" }, radius: { ref: "$variable/radius/08", value: 8 } },
      componentContract: {
        logicalName: "Search/White Surface/Advanced",
        rendererKey: "search-advanced",
        sourceEvidence: { html: "packages/components-html/src/index.js#search" },
        props: ["advancedSearchLabel"],
        properties: { advancedSearchLabel: { type: "TEXT", defaultValue: "高级" } },
        slots: ["advanced-search"],
        tokenRoles: ["radius.search"],
      },
    },
    {
      op: "create-frame",
      phase: "library",
      nodeId: "component-search-white-surface-advanced-slot",
      parentId: "component-search-white-surface-advanced",
      name: "#advanced-search",
      region: "fields",
      layout: { direction: "HORIZONTAL", width: "hug", height: "hug" },
      style: { fill: { kind: "transparent" }, textStyle: { ref: "$style/typography/body" } },
      slotName: "advanced-search",
    },
    {
      op: "create-text",
      phase: "library",
      nodeId: "component-search-white-surface-advanced-label",
      parentId: "component-search-white-surface-advanced-slot",
      name: "advanced-search text",
      region: "fields",
      layout: { direction: "HORIZONTAL", width: "hug", height: "hug" },
      style: {},
      characters: "高级",
      propertyBinding: { propName: "advancedSearchLabel", slotName: "advanced-search" },
    },
    {
      op: "create-frame",
      phase: "library",
      nodeId: "component-search-white-surface-advanced-content",
      parentId: "component-search-white-surface-advanced",
      name: "#content",
      region: "fields",
      layout: { direction: "VERTICAL", width: 120, height: 80 },
      style: { fill: { kind: "transparent" } },
      metadata: { defaultVisibility: "hidden" },
    },
  ],
};

const result = await globalThis.TextToUiPixsoRuntime.create(pixso).execute(plan);
assert.equal(result.ok, true, result.audit?.issues?.join(", "));
assert.equal(result.audit.componentCount, 1);
assert.equal(result.audit.slotCount, 1);
const component = library.children[0];
assert.equal(component.type, "COMPONENT");
assert.equal(component.name, "Search/White Surface/Advanced");
assert.ok(component.findAll((node) => node.name === "#advanced-search").length === 1);
assert.equal(component.getPluginData("text-to-ui-component-logical-name"), "Search/White Surface/Advanced");
assert.equal(component.componentPropertyDefinitions.advancedSearchLabel.type, "TEXT");
assert.equal(component.width, 40);
assert.equal(component.height, 40);
assert.equal(component.paddingLeft, 16);
assert.equal(component.paddingRight, 16);
assert.equal(component.cornerRadius, 8);
assert.equal(component.boundVariables.width.id, "var-size-40");
assert.equal(component.boundVariables.cornerRadius.id, "var-radius-08");
assert.equal(component.fills[0].boundVariables.color.id, "var-neutral-dark-05");
const label = component.findAll((node) => node.type === "TEXT")[0];
assert.equal(label.componentPropertyReferences.characters, "advancedSearchLabel");
assert.equal(label.characters, "高级", "text property binding must preserve its declared default copy");
const hiddenContent = component.findAll((node) => node.name === "#content")[0];
assert.ok(hiddenContent, "optional overlay content must be present as a named layer");
assert.equal(hiddenContent.visible, false, "overlay slots marked hidden must default to hidden in Pixso");
console.log("Pixso component library runtime test passed: direct Component, named slot, property and source metadata are created.");
