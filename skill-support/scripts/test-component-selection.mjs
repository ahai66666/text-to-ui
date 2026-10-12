import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveComponentSelection, validateComponentSelection } from "./component-selection.mjs";

const repo = process.cwd();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tui-component-selection-"));
try {
  const contextPath = path.join(temp, "context.json");
  const bindingsPath = path.join(temp, "bindings.json");
  const recipesPath = path.join(temp, "recipes.json");
  fs.writeFileSync(contextPath, JSON.stringify({ request: { framework: "html" } }));
  const bindings = { componentBindings: [
    { id: "save", logicalName: "Button/Primary/Default", semanticContext: "page-primary-action", options: { label: "保存", variant: "primary", size: "standard", mode: "text" } },
    { id: "search", logicalName: "Search/White Surface/Default", semanticContext: "secondary-list-search", options: { surface: "white" } },
    { id: "table", logicalName: "Table/Default", options: { title: "业务项目", columns: ["名称", "状态"], rows: [["项目 A", "进行中"]] } }
  ] };
  fs.writeFileSync(bindingsPath, JSON.stringify(bindings));
  fs.writeFileSync(recipesPath, JSON.stringify({ recipes: [] }));
  const inputs = { repo, contextPath, bindingsPath, recipesPath };
  const receipt = resolveComponentSelection(inputs);
  assert.deepEqual(receipt.entries.map((item) => item.decision), ["reuse", "reuse", "reuse"]);
  assert.equal(receipt.registryDigest.length, 64);
  assert.equal(receipt.packageDigest.length, 64);
  validateComponentSelection(receipt, inputs);
  bindings.componentBindings[2].options.sortDirection = "ascending";
  fs.writeFileSync(bindingsPath, JSON.stringify(bindings));
  assert.throws(() => validateComponentSelection(receipt, inputs), /stale/);
  const extension = resolveComponentSelection(inputs);
  assert.equal(extension.entries[2].decision, "extend-existing");
  assert.match(extension.entries[2].reasons.join(" "), /sortDirection/);
  assert.throws(() => validateComponentSelection(extension, inputs), /not implementable/);
  delete bindings.componentBindings[2].options.sortDirection;
  bindings.custom = [
    { id: "fake-button", missingCapability: "another button", registryQueries: ["button"], disposition: "page-owned" },
    { id: "generic-new", missingCapability: "new generic control", registryQueries: ["unregistered-generic-control"], disposition: "promote-to-library" },
    { id: "business", missingCapability: "domain-specific grouping", registryQueries: ["domain-specific-grouping"], disposition: "page-owned", exceptionKind: "specialized-business-surface" },
    { id: "generic-default", missingCapability: "generic control", registryQueries: ["unregistered-generic-control"], disposition: "page-owned", exceptionKind: "no-matching-component" }
  ];
  fs.writeFileSync(bindingsPath, JSON.stringify(bindings));
  const classified = resolveComponentSelection(inputs);
  assert.deepEqual(classified.entries.slice(-4).map((item) => item.decision), ["extend-existing", "new-shared", "page-composite", "new-shared"]);
  bindings.contractBased = [{ id: "unfinished-contract", missingCapability: "unfinished existing contract", registryQueries: ["unregistered-name"], contractLogicalName: "Some/Contract", disposition: "page-owned" }];
  fs.writeFileSync(bindingsPath, JSON.stringify(bindings));
  assert.equal(resolveComponentSelection(inputs).entries.find((entry) => entry.id === "unfinished-contract").decision, "extend-existing");
  const incompleteRepo = path.join(temp, "incomplete-repo");
  for (const relative of ["packages/component-contracts/src/components.json", "skill-support/references/components/component-selection-rules.json", "skill-support/references/index/generated/component-index.json"]) {
    const target = path.join(incompleteRepo, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(repo, relative), target);
  }
  assert.throws(() => resolveComponentSelection({ ...inputs, repo: incompleteRepo }), /Component package source is missing/);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log("Component selection receipt tests passed.");
