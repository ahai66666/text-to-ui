#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs, print, readJson } from "./navigation-index-lib.mjs";
import { loadReadinessPolicy, resolveComponentReadiness } from "./component-readiness-policy.mjs";

const args = parseArgs(process.argv.slice(2));
const repo = path.resolve(args.repo ?? process.cwd());
const skillRoot = path.resolve(args["skill-root"] ?? path.join(repo, "skill-support"));
const batchPath = path.resolve(args.batch ?? path.join(skillRoot, "references/components/core-component-acceptance.json"));
const batch = readJson(batchPath);
const registry = readJson(path.join(repo, "packages/component-contracts/src/components.json")).components;
const policy = loadReadinessPolicy(skillRoot);
const byLogicalName = new Map(registry.map((component) => [component.logicalName, component]));
const frameworks = ["html", "react", "vue"];
const components = batch.components.map((logicalName) => {
  const component = byLogicalName.get(logicalName);
  if (!component) throw new Error(`acceptance batch references unknown component: ${logicalName}`);
  const sourceChecks = Object.fromEntries(frameworks.map((framework) => {
    const source = component.implementations?.[framework] ?? component.frameworks?.[framework]?.source;
    const sourcePath = source ? source.split("#")[0] : null;
    return [framework, { source, exists: Boolean(sourcePath && fs.existsSync(path.join(repo, sourcePath))) }];
  }));
  const automatedChecks = {
    canonicalContract: Boolean(component.id && component.logicalName),
    frameworkSources: frameworks.every((framework) => sourceChecks[framework].exists),
    specimens: Array.isArray(component.specimens) && component.specimens.length > 0,
    tokens: Array.isArray(component.tokenRoles) && component.tokenRoles.length > 0,
    behaviorsDeclared: Array.isArray(component.behaviors) && component.behaviors.length > 0
  };
  return {
    id: component.id,
    logicalName,
    readiness: resolveComponentReadiness(component, policy),
    sourceChecks,
    automatedChecks,
    automatedFoundationReady: Object.values(automatedChecks).every(Boolean),
    requiredEvidence: Object.fromEntries(Object.entries(batch.requiredEvidence).filter(([dimension]) => component.readiness?.[dimension] !== true))
  };
});
const summary = {
  approved: components.filter((component) => component.readiness.level === "approved").length,
  provisional: components.filter((component) => component.readiness.level === "provisional").length,
  blocked: components.filter((component) => component.readiness.level === "blocked").length,
  foundationReady: components.filter((component) => component.automatedFoundationReady).length
};
const report = { schemaVersion: 1, batchId: batch.batchId, label: batch.label, summary, components };
if (args.out) {
  const output = path.resolve(args.out);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
if (args["strict-release"] && (summary.provisional > 0 || summary.blocked > 0)) process.exitCode = 1;
print(report);
