#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveComponentReadiness } from "./component-readiness-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePolicy = JSON.parse(fs.readFileSync(path.join(root, "skill-support/references/components/component-readiness-policy.json"), "utf8"));
const policy = {
  requiredDimensions: ["sourceReady", "contractReady", "visualParity", "behaviorParity", "accessibilityParity", "tokenParity"],
  levels: {
    approved: { allowedStages: ["fast-preview", "release"] },
    provisional: { allowedStages: ["fast-preview"] },
    blocked: { allowedStages: [] }
  },
  overrides: []
};
const generationGate = sourcePolicy.generationGate;
assert.deepEqual(generationGate.requiredChecks, [
  "pattern-contract-and-component-mapping",
  "html-react-vue-runtime",
  "interaction-and-basic-semantics",
  "skill-delivery-sync"
]);
assert.equal(generationGate.styleChecks, "on-request");
assert.equal(generationGate.tokenChecks, "assumed-canonical");
const component = (readiness) => ({ id: "button", logicalName: "Button/Primary/Default", readiness });
const approved = resolveComponentReadiness(component(Object.fromEntries(policy.requiredDimensions.map((key) => [key, true]))), policy);
assert.equal(approved.level, "approved");
assert.equal(approved.allowedInRelease, true);
const provisional = resolveComponentReadiness(component({ sourceReady: true, contractReady: true, visualParity: false, behaviorParity: false, accessibilityParity: false, tokenParity: true }), policy);
assert.equal(provisional.level, "provisional");
assert.equal(provisional.allowedInFastPreview, true);
assert.equal(provisional.allowedInRelease, false);
const blocked = resolveComponentReadiness(component({ sourceReady: false, contractReady: true }), policy);
assert.equal(blocked.level, "blocked");
assert.equal(blocked.allowedInFastPreview, false);
assert.throws(() => resolveComponentReadiness(component({ sourceReady: true, contractReady: true }), { ...policy, overrides: [{ logicalName: "Button/Primary/Default", level: "approved" }] }), /requires evidence/);
console.log("Component readiness policy tests passed.");
