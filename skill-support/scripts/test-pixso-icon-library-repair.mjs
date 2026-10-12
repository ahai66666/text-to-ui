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
    width: 1,
    height: 1,
    appendChild(child) { this.children.push(child); child.parent = this; },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); },
    resize(width, height) { this.width = width; this.height = height; },
    setBoundVariable(property, variable) { this.boundVariables ??= {}; this.boundVariables[property] = { type: "VARIABLE_ALIAS", id: variable.id }; },
    setPluginData(key, value) { this.pluginData ??= {}; this.pluginData[key] = value; },
    getPluginData(key) { return this.pluginData?.[key] ?? ""; },
    findAll(predicate) { return descendants(this).filter(predicate); },
  };
}

const library = { ...makeNode("PAGE"), id: "library", name: "NewComponents" };
const variables = [{ id: "icon-default", name: "icon/default", resolvedType: "COLOR", value: { r: 0, g: 0, b: 0, a: 1 } }];
const pixso = {
  currentPage: library,
  root: { children: [library] },
  variables: {
    getLocalVariablesAsync: async () => variables,
    setBoundVariableForPaint(paint, channel, variable) {
      return { ...paint, boundVariables: { [channel]: { type: "VARIABLE_ALIAS", id: variable.id } } };
    },
  },
  getLocalTextStylesAsync: async () => [],
  getLocalEffectStylesAsync: async () => [],
  createComponent: async () => {
    const node = makeNode("COMPONENT");
    node.componentPropertyDefinitions = {};
    node.addComponentProperty = () => {};
    return node;
  },
  createFrame: () => makeNode("FRAME"),
  createRectangle: () => makeNode("RECTANGLE"),
  createText: () => makeNode("TEXT"),
  createVector: () => makeNode("VECTOR"),
};

const plan = {
  schemaVersion: 1,
  kind: "pixso-component-library-plan",
  execution: { libraryPage: "NewComponents", targetPage: "NewComponents", mode: "component-library" },
  page: { name: "NewComponents", targetPage: "NewComponents" },
  resources: {
    componentLibraryPage: "NewComponents",
    variableAliases: {},
    icons: [{ alias: "action/add", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>' }],
  },
  operations: [
    {
      op: "create-component",
      phase: "library",
      nodeId: "component-x",
      parentId: null,
      name: "Test/Component",
      region: "test",
      layout: { direction: "HORIZONTAL", width: 40, height: 40 },
      style: {},
      componentContract: { logicalName: "Test/Component", sourceEvidence: { html: "fixture" }, slots: [], properties: {} },
    },
    {
      op: "create-icon-slot",
      phase: "library",
      nodeId: "icon-slot",
      parentId: "component-x",
      name: "#icon",
      region: "test",
      layout: { direction: "NONE", width: 20, height: 20, align: "MIN" },
      style: {},
      iconSlot: { alias: "action/add", size: 20, hotZone: { alignment: "CENTER", axes: "BOTH" } },
    },
    {
      op: "hydrate-icon",
      phase: "icon-hydration",
      targetNodeId: "icon-slot",
      name: "#icon",
      region: "test",
      iconRef: { alias: "action/add", size: 20, hotZone: { alignment: "CENTER", axes: "BOTH" } },
      style: {},
    },
  ],
};

const first = await globalThis.TextToUiPixsoRuntime.create(pixso).execute(plan);
assert.equal(first.ok, true, JSON.stringify(first));
const component = library.children.find((node) => node.name === "Test/Component");
const slot = component.children.find((node) => node.name === "#icon");
slot.primaryAxisAlignItems = "MIN";
slot.counterAxisAlignItems = "MIN";
slot.children[0].x = 0;
slot.children[0].y = 0;
slot.children[0].strokeWeight = 9;

const second = await globalThis.TextToUiPixsoRuntime.create(pixso).execute(plan);
assert.equal(second.ok, true, JSON.stringify(second));
const icon = slot.children[0];
assert.equal(slot.primaryAxisAlignItems, "CENTER");
assert.equal(slot.counterAxisAlignItems, "CENTER");
assert.equal(Number(icon.strokeWeight), 1.25);
assert.equal(Number(icon.x), (slot.width - icon.width) / 2);
assert.equal(Number(icon.y), (slot.height - icon.height) / 2);
console.log("Existing component-library icon repair passed: stale top alignment and stroke are repaired in place.");
