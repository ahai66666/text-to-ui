#!/usr/bin/env node
import assert from "node:assert/strict";
import { validatePageContentRecipes } from "./page-content-recipes.mjs";

const blueprint = {
  id: "email-home",
  contentGroups: [
    { id: "navigation", region: "primary-navigation" },
    { id: "message-list", region: "secondary-list" },
    { id: "message-detail", region: "main-detail" }
  ],
  dataEntities: [{ id: "message" }]
};
const bindings = [
  { id: "sidebar", region: "primary-navigation" },
  { id: "search", region: "secondary-list" },
  { id: "titlebar", region: "main-detail" }
];
const valid = {
  schemaVersion: 1,
  blueprintRef: { id: "email-home" },
  recipes: [
    { id: "navigation-recipe", contentGroupId: "navigation", region: "primary-navigation", compositionId: "nav-stack", kind: "registered-composition", bindingIds: ["sidebar"] },
    { id: "message-row", contentGroupId: "message-list", region: "secondary-list", compositionId: "message-list", kind: "page-composite", entityId: "message", bindingIds: ["search"], fields: ["sender", "subject", "summary", "time"], states: ["default", "unread", "selected"], missingCapability: "email scan row", registryQueries: ["repeated-list-row"], reviewedCandidates: [{ logicalName: "List Item/White Surface/Default", rejectionReason: "does not expose all mail fields" }], tokenRoles: ["spacing.component-gap"], disposition: "page-owned" },
    { id: "detail-recipe", contentGroupId: "message-detail", region: "main-detail", compositionId: "detail-content", kind: "registered-composition", bindingIds: ["titlebar"] }
  ]
};
assert.deepEqual(validatePageContentRecipes(valid, { blueprint, bindings, compositionIds: new Set(["nav-stack", "message-list", "detail-content"]) }), []);
const missing = structuredClone(valid);
missing.recipes.pop();
assert.ok(validatePageContentRecipes(missing, { blueprint, bindings, compositionIds: new Set(["nav-stack", "message-list", "detail-content"]) }).some((error) => error.includes("message-detail")));
const genericWithoutEvidence = structuredClone(valid);
delete genericWithoutEvidence.recipes[1].reviewedCandidates;
assert.ok(validatePageContentRecipes(genericWithoutEvidence, { blueprint, bindings, compositionIds: new Set(["nav-stack", "message-list", "detail-content"]) }).some((error) => error.includes("reviewedCandidates")));
console.log("Page content recipe validation tests passed.");
