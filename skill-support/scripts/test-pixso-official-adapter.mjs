#!/usr/bin/env node

import assert from "node:assert/strict";
import { createPixsoOfficialAdapterPlan, selectPixsoExecutor } from "./pixso-official-adapter.mjs";

const fullPage = {
  kind: "pixso-operation-plan",
  execution: { mode: "normal", intent: "full-structured-import" },
  resources: { components: ["Sidebar Item", { name: "Control Button" }] },
  operations: Array.from({ length: 240 }, (_, index) => ({ id: `op-${index}` })),
};

assert.equal(selectPixsoExecutor(fullPage, { ready: true }).executor, "text-to-ui-native-plugin");
assert.equal(selectPixsoExecutor(fullPage, { ready: false }).allowed, false);
assert.equal(selectPixsoExecutor(fullPage, { ready: false }).reason, "native-plugin-required");
assert.equal(selectPixsoExecutor(fullPage, { ready: false }, { allowMcpFallback: true }).executor, "pixso-mcp-eval-script");

const repair = { execution: { mode: "normal", intent: "targeted-repair" }, operations: Array.from({ length: 80 }, () => ({})) };
const repairRoute = selectPixsoExecutor(repair, { ready: false });
assert.equal(repairRoute.executor, "pixso-apply-design");
assert.equal(repairRoute.operationLimit, 100);

const oversizedRepair = { execution: { mode: "normal", intent: "targeted-repair" }, operations: Array.from({ length: 101 }, () => ({})) };
assert.equal(selectPixsoExecutor(oversizedRepair, { ready: true }).executor, "text-to-ui-native-plugin");
assert.equal(selectPixsoExecutor(oversizedRepair, { ready: false }).allowed, false);
assert.equal(selectPixsoExecutor(oversizedRepair, { ready: false }, { allowMcpFallback: true }).executor, "pixso-mcp-eval-script");

const diagnostic = { execution: { mode: "diagnostic", intent: "exact-visual-baseline" } };
assert.equal(selectPixsoExecutor(diagnostic, {}).executor, "pixso-code-to-design");
const forbiddenBaseline = selectPixsoExecutor({ execution: { mode: "normal", intent: "exact-visual-baseline" } }, {});
assert.equal(forbiddenBaseline.allowed, false);
assert.equal(forbiddenBaseline.reason, "code-to-design-forbidden-in-normal-mode");

const adapter = createPixsoOfficialAdapterPlan(fullPage, { ready: true });
assert.equal(adapter.constraints.oneExecutorPerRun, true);
assert.equal(adapter.constraints.codeToDesignNormalMode, "forbidden");
assert.equal(adapter.constraints.evalScript, "explicit-diagnostic-or-user-approved-only");
assert.deepEqual(adapter.resourcePreflight.calls.slice(0, 4).map((call) => call.tool), [
  "fetch_context", "read_variables", "read_styles", "read_components"
]);
assert.deepEqual(adapter.resourcePreflight.calls[4].names, ["Sidebar Item", "Control Button"]);
assert.deepEqual(adapter.acceptance.calls.map((call) => call.tool), ["check_layout", "query_all_unique_props", "take_screenshot"]);
assert.equal(adapter.acceptance.readback.requireRealComponentInstances, true);
assert.equal(adapter.acceptance.readback.requireNoTemporaryBaseline, true);

console.log("Pixso official adapter tests passed: deterministic bulk, repair, diagnostic, preflight, and acceptance routing.");
