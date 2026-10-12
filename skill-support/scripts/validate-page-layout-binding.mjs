#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, readJson } from './navigation-index-lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args['page-spec'] || !args['layout-contract']) {
  throw new Error('Usage: validate-page-layout-binding.mjs --page-spec <page-spec.json> --layout-contract <layout-contract.json> [--component-usage <component-usage.json>]');
}

const pageSpecPath = path.resolve(args['page-spec']);
const contractPath = path.resolve(args['layout-contract']);
const pageSpec = readJson(pageSpecPath);
const contract = readJson(contractPath);
const failures = [];
const approvedPatterns = new Set(['pattern-a-two-pane', 'pattern-b-three-pane', 'pattern-c-tool-workspace', 'pattern-d-inspector']);
const failIf = (condition, message) => { if (condition) failures.push(message); };
failIf(!approvedPatterns.has(contract.pattern), 'layout-contract.pattern must be an approved canonical Pattern ID');
failIf(!approvedPatterns.has(pageSpec.shell?.pattern), 'page-spec.shell.pattern must be an approved canonical Pattern ID; free-text Pattern names are forbidden');
failIf(pageSpec.shell?.pattern !== contract.pattern, `page-spec.shell.pattern must equal layout-contract.pattern (${contract.pattern})`);
failIf(!Array.isArray(pageSpec.shell?.paneOrder), 'page-spec.shell.paneOrder is required and must come from layout-contract.paneOrder');
if (Array.isArray(pageSpec.shell?.paneOrder)) failIf(JSON.stringify(pageSpec.shell.paneOrder) !== JSON.stringify(contract.paneOrder), 'page-spec.shell.paneOrder must equal layout-contract.paneOrder');
failIf(!pageSpec.layoutContractPath || typeof pageSpec.layoutContractPath !== 'string', 'page-spec.layoutContractPath must point to layout-contract.json');
if (pageSpec.layoutContractPath) failIf(path.resolve(path.dirname(pageSpecPath), pageSpec.layoutContractPath) !== contractPath, `page-spec.layoutContractPath must resolve to ${contractPath}`);
failIf(typeof pageSpec.shell?.finalPaneLeadingSlot !== 'string' || pageSpec.shell.finalPaneLeadingSlot.length === 0, 'page-spec.shell.finalPaneLeadingSlot is required and must come from layout-contract.finalPaneLeadingSlot');
if (typeof pageSpec.shell?.finalPaneLeadingSlot === 'string') failIf(pageSpec.shell.finalPaneLeadingSlot !== contract.finalPaneLeadingSlot, 'page-spec.shell.finalPaneLeadingSlot must equal layout-contract.finalPaneLeadingSlot');
failIf(!Array.isArray(pageSpec.shell?.requiredSlots), 'page-spec.shell.requiredSlots is required and must come from layout-contract.requiredSlots');
if (Array.isArray(pageSpec.shell?.requiredSlots)) failIf(JSON.stringify(pageSpec.shell.requiredSlots) !== JSON.stringify(contract.requiredSlots), 'page-spec.shell.requiredSlots must equal layout-contract.requiredSlots');

const normalizePane = (value) => ({ navigation: 'primary-navigation', primary: 'primary-navigation', list: 'secondary-list', detail: 'main-detail', main: 'main-content', workspace: 'tool-workspace', canvas: 'secondary-or-canvas' }[value] || value);
if (args['component-usage']) {
  const manifestPath = path.resolve(args['component-usage']);
  const manifest = readJson(manifestPath);
  const layout = manifest.layout;
  failIf(!layout || typeof layout !== 'object', 'component-usage.layout is required for strict HTML generation');
  if (layout) {
    failIf(!approvedPatterns.has(layout.pattern), 'component-usage.layout.pattern must be an approved canonical Pattern ID');
    failIf(layout.pattern !== contract.pattern, 'component-usage.layout.pattern must equal layout-contract.pattern');
    failIf(JSON.stringify(layout.paneOrder) !== JSON.stringify(contract.paneOrder), 'component-usage.layout.paneOrder must equal layout-contract.paneOrder');
    failIf(!layout.contractPath, 'component-usage.layout.contractPath is required');
    if (layout.contractPath) failIf(path.resolve(path.dirname(manifestPath), layout.contractPath) !== contractPath, 'component-usage.layout.contractPath must resolve to the active layout contract');
  }
  for (const [groupName, entries] of [['registered', manifest.registered], ['contractBased', manifest.contractBased], ['custom', manifest.custom]]) for (const [index, entry] of (Array.isArray(entries) ? entries : []).entries()) {
    const regions = entry.regions || (entry.region ? [entry.region] : entry.pane ? [entry.pane] : []);
    for (const region of regions) failIf(!contract.paneOrder.includes(normalizePane(region)), `${groupName}[${index}] region '${region}' is not a declared pane in the selected Pattern`);
  }
}
if (failures.length) { console.error('Page/layout Pattern binding validation failed'); failures.forEach((failure) => console.error(`- ${failure}`)); process.exit(1); }
console.log(JSON.stringify({ ok: true, pattern: contract.pattern, paneOrder: contract.paneOrder, pageSpec: pageSpecPath, layoutContract: contractPath }, null, 2));
