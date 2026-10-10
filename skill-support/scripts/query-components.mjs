#!/usr/bin/env node
import path from 'node:path';
import { findComponent, loadIndexes, locateMonorepo, normalizeList, parseArgs, print, readJson, resolveSkillRoot } from './navigation-index-lib.mjs';
import { loadReadinessPolicy, resolveComponentReadiness } from './component-readiness-policy.mjs';

const args = parseArgs(process.argv.slice(2));
const located = locateMonorepo({ start: args.start || process.cwd(), explicitRepo: args.repo });
if (!located.root) throw new Error('Text-to-UI Monorepo not found. Run locate-monorepo.mjs and provide --repo.');
const skillRoot = resolveSkillRoot(located.root, args['skill-root']);
const index = loadIndexes(skillRoot)['component-index'];
const framework = args.framework || 'html';
if (!['html', 'react', 'vue'].includes(framework)) throw new Error(`Unsupported framework: ${framework}`);
const rawCapabilities = args.capabilities || args.component;
const capabilities = normalizeList(rawCapabilities);
if (!capabilities.length) throw new Error('Provide --capabilities search,checkbox,...');
if (typeof rawCapabilities === 'string' && !rawCapabilities.includes(',') && /\s/.test(rawCapabilities.trim())) {
  throw new Error('Provide --capabilities as comma-separated capability IDs, for example --capabilities primary-navigation-item,sidebar,search.');
}
const requestedContext = (args['semantic-context'] || args.context) ? String(args['semantic-context'] || args.context).trim().toLowerCase() : null;
if (requestedContext && (requestedContext.endsWith('.json') || requestedContext.includes('/') || requestedContext.includes('\\'))) {
  throw new Error('The component query context is a semantic context, not a Context Packet file. Use values such as primary-navigation-shell, secondary-navigation, or repeated-list-row.');
}
const selectionRules = readJson(path.join(skillRoot, 'references/components/component-selection-rules.json')).rules;
const registry = readJson(path.join(located.root, 'packages/component-contracts/src/components.json')).components;
const registryByLogicalName = new Map(registry.map((component) => [component.logicalName, component]));
const readinessPolicy = loadReadinessPolicy(skillRoot);
const results = capabilities.map((capability) => {
  const normalizedCapability = String(capability).trim().toLowerCase();
  const candidates = index.components.filter((item) => item.capabilities.some((candidate) => candidate.toLowerCase() === normalizedCapability));
  const matchingRules = selectionRules.filter((rule) => rule.capabilities.includes(normalizedCapability));
  const contextualRule = requestedContext ? matchingRules.find((rule) => rule.context === requestedContext) : null;
  if (requestedContext && matchingRules.length > 0 && !contextualRule) return {
    capability,
    resolution: 'context-mismatch',
    requestedContext,
    allowedContexts: [...new Set(matchingRules.map((rule) => rule.context))],
    instruction: 'Use one allowed semantic context or add a reviewed selection rule; do not fall back to the first visual match.'
  };
  if (!requestedContext && matchingRules.length > 1) return {
    capability,
    resolution: 'context-required',
    candidates: [...new Set(matchingRules.map((rule) => rule.logicalName))],
    allowedContexts: [...new Set(matchingRules.map((rule) => rule.context))],
    instruction: 'Repeat the query with --context; do not choose a default Button or navigation role by appearance.'
  };
  if (matchingRules.length === 0 && candidates.length > 1) return {
    capability,
    resolution: 'context-required',
    candidates: candidates.map((item) => item.logicalName),
    instruction: 'This broad capability matches multiple library components. Query a specific capability or add a reviewed semantic selection rule.'
  };
  const selection = contextualRule ?? (matchingRules.length === 1 ? matchingRules[0] : matchingRules.length > 1 ? {
    status: 'context-required',
    allowedContexts: [...new Set(matchingRules.map((rule) => rule.context))],
    instruction: 'Repeat the query with --context; do not choose a default Button or navigation role by appearance.'
  } : null);
  const selectedByRule = selection?.logicalName ? index.components.find((item) => item.logicalName === selection.logicalName) : null;
  const component = selectedByRule ?? candidates[0] ?? findComponent(index, capability);
  if (!component) return { capability, resolution: 'custom', reason: 'No library component or indexed contract match. Verify the exact registry before custom drawing.' };
  const runtime = component.frameworks[framework];
  const readiness = resolveComponentReadiness(registryByLogicalName.get(component.logicalName), readinessPolicy);
  return {
    capability,
    resolution: runtime?.exists ? 'real-framework-component' : 'matching-contract',
    component: component.id,
    logicalName: component.logicalName,
    importPackage: runtime?.exists ? runtime.package : null,
    source: runtime?.source || null,
    status: runtime?.status || component.status,
    readiness,
    contractPointer: component.contractPointer,
    variants: component.variants,
    states: component.states,
    props: component.props,
    slots: component.slots,
    slotContracts: component.slotContracts || {},
    tokenRoles: component.tokenRoles,
    iconAliases: component.iconAliases,
    selection
  };
});
print({ repo: located.root, framework, results });
