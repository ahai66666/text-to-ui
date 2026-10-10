#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { findComponent, loadIndexes, locateMonorepo, normalizeList, parseArgs, print, resolveSkillRoot, stableJson } from './navigation-index-lib.mjs';
import { readPatternRegistry, resolvePatternContract } from './pattern-contract-lib.mjs';
import { buildFrameworkRendererContract, componentRendererBinding } from './framework-renderer-contract.mjs';
import { stableDigest } from './ui-scene-core.mjs';
import { blueprintDigest, readPageBlueprint } from './page-blueprint.mjs';
import { materialDefinitions, materialSnapshot, materialPathFromSkillReference, writeContextReadReceipt } from './route-material-lib.mjs';
import { selectTaskRoute } from './task-route-lib.mjs';

const args = parseArgs(process.argv.slice(2));
const located = locateMonorepo({ start: args.start || process.cwd(), explicitRepo: args.repo });
if (!located.root) throw new Error(`Text-to-UI Monorepo not found. Tried:\n${located.attempted.join('\n')}`);
const repo = located.root;
const skillRoot = resolveSkillRoot(repo, args['skill-root']);
const indexes = loadIndexes(skillRoot);
const framework = args.framework || 'html';
const mode = args.mode || 'fast-preview';
const query = String(args.task || args.domain || '');
if (!query) throw new Error('Provide --task or --domain.');
if (!['html', 'react', 'vue'].includes(framework)) throw new Error(`Unsupported framework: ${framework}`);
if (!indexes['validation-index'].modes[mode]) throw new Error(`Unsupported mode: ${mode}`);
const explicitlyConfirmed = args.confirmed === true || String(args.confirmed).toLowerCase() === 'true';
const autoPlanned = args.auto === true || String(args.auto).toLowerCase() === 'true';
const discovery = args.discover === true || String(args.discover).toLowerCase() === 'true';
if (discovery && (autoPlanned || explicitlyConfirmed)) throw new Error('--discover is a design-reading stage, not a confirmed generation context.');
if (!discovery && !explicitlyConfirmed && !autoPlanned) throw new Error('Resolve design inputs with --discover first, then use --auto --blueprint for generation.');
const blueprintPath = args.blueprint ? path.resolve(String(args.blueprint)) : null;
if (autoPlanned && !blueprintPath) throw new Error('Automatic new-page routing requires --blueprint <page-blueprint.json> so the chosen Pattern and primary task are explicit before component resolution.');

const requestedPattern = args.pattern ? String(args.pattern) : null;
const routeSelection = selectTaskRoute(query, indexes['task-router'].routes, args['task-route']);
const matchedRoute = routeSelection.route;
let route = matchedRoute;
if (!route) {
  if (!requestedPattern) throw new Error(`No task route matches '${query}'. Unknown tasks require an explicit --pattern <pattern-id> and --capabilities <capability,...>; the Skill must not guess a Pattern.`);
  const adHocLayout = indexes['layout-index'].layouts.find((item) => item.id === requestedPattern);
  if (!adHocLayout) throw new Error(`Unknown Pattern '${requestedPattern}'. Use one of the approved Pattern IDs from the layout index.`);
  const capabilities = normalizeList(args.capabilities || args['required-capabilities']);
  if (capabilities.length === 0) throw new Error('Unknown tasks require --capabilities <capability,...> so component selection is explicit.');
  route = {
    id: `ad-hoc-${adHocLayout.id}`,
    aliases: [],
    domains: [],
    layout: adHocLayout.id,
    requiredCapabilities: capabilities,
    optionalCapabilities: normalizeList(args['optional-capabilities']),
    customCompositions: []
  };
} else if (requestedPattern && requestedPattern !== matchedRoute.layout) {
  throw new Error(`Task route '${matchedRoute.id}' resolves to '${matchedRoute.layout}', not '${requestedPattern}'. Revise the analysis or task route before continuing.`);
}
const layout = indexes['layout-index'].layouts.find((item) => item.id === route.layout);
if (!layout) throw new Error(`Task route '${route.id}' references a missing approved Pattern: ${route.layout}`);
const resolvedPattern = resolvePatternContract(route.layout, {
  registry: readPatternRegistry(path.join(skillRoot, 'assets', 'design-system', 'pattern-contracts.json'))
});
const workflowRouteId = String(args['workflow-route'] || 'new-page');
const workflowRoute = indexes['workflow-route-index'].routes.find((candidate) => candidate.id === workflowRouteId);
if (!workflowRoute) throw new Error(`Unknown workflow route '${workflowRouteId}'`);
const automaticBlueprint = autoPlanned ? readPageBlueprint(blueprintPath, { patternId: route.layout }) : null;
const approvedReferenceId = args['approved-reference'] ? String(args['approved-reference']) : null;
const approvedReferenceIndexPath = path.join(skillRoot, 'references', 'approved-pages', 'index.json');
let approvedReferences = [];
if (approvedReferenceId) {
  if (!fs.existsSync(approvedReferenceIndexPath)) throw new Error('Approved page reference library is unavailable');
  const approvedIndex = JSON.parse(fs.readFileSync(approvedReferenceIndexPath, 'utf8'));
  const entry = (approvedIndex.references ?? []).find((candidate) => candidate.id === approvedReferenceId);
  if (!entry) throw new Error(`Approved page reference '${approvedReferenceId}' was not found. Generated pages are not references unless the user explicitly registers them first.`);
  const cardPath = path.join(skillRoot, entry.path);
  if (!fs.existsSync(cardPath)) throw new Error(`Approved page reference '${approvedReferenceId}' has a missing reference card`);
  const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
  if (card.id !== approvedReferenceId || card.approvedBy !== 'user') throw new Error(`Approved page reference '${approvedReferenceId}' is not user-approved`);
  approvedReferences = [{ id: entry.id, title: entry.title, path: entry.path, rationale: card.rationale, usePolicy: card.usePolicy }];
}
const resolveCapability = (capability, required) => {
  const component = findComponent(indexes['component-index'], capability);
  if (!component) return { capability, required, sourceLevel: 'custom', evidence: 'index-miss; exact registry search required before drawing' };
  const runtime = component.frameworks[framework];
  return {
    capability,
    required,
    sourceLevel: runtime?.exists ? 'real-framework-component' : 'matching-contract',
    component: component.id,
    logicalName: component.logicalName,
    importPackage: runtime?.exists ? runtime.package : null,
    rendererKey: runtime?.rendererKey || null,
    rendererPackage: runtime?.package || null,
    factoryImport: runtime?.factoryImport || null,
    styleImports: runtime?.styleImports || [],
    source: runtime?.source || null,
    contractPointer: component.contractPointer,
    variants: component.variants,
    states: component.states,
    props: component.props,
    slots: component.slots,
    supportedProps: component.props,
    supportedSlots: component.slots,
    slotContracts: component.slotContracts || {},
    tokenRoles: component.tokenRoles,
    iconAliases: component.iconAliases
  };
};
const components = [
  ...route.requiredCapabilities.map((item) => resolveCapability(item, true)),
  ...route.optionalCapabilities.map((item) => resolveCapability(item, false)),
  ...normalizeList(args.capabilities || args['required-capabilities'])
    .filter((item) => ![...route.requiredCapabilities, ...route.optionalCapabilities].includes(item))
    .map((item) => resolveCapability(item, true))
];
const componentReadMap = components
  .filter((item) => item.contractPointer)
  .map((item) => ({
    capability: item.capability,
    logicalName: item.logicalName,
    contract: item.contractPointer,
    implementation: item.source || null,
    guidance: 'references/components/source-resolution.md'
  }));
const rendererComponents = components
  .filter((item) => item.sourceLevel === 'real-framework-component')
  .map((item) => {
    const indexed = indexes['component-index'].components.find((component) => component.logicalName === item.logicalName);
    const binding = indexed ? componentRendererBinding(indexed, framework) : null;
    return binding ? { ...binding, capability: item.capability } : null;
  });
const renderer = buildFrameworkRendererContract(framework, rendererComponents);
const patternDigest = stableDigest(resolvedPattern.pattern);
const tokenRoleNames = [...new Set(components.flatMap((item) => item.tokenRoles || []))];
const tokens = Object.fromEntries(tokenRoleNames.map((role) => [role, indexes['token-index'].semanticRoles[role] || { lookup: `packages/tokens; role=${role}` }]));
const dynamicMaterials = [
  ...((layout.references ?? []).map((reference) => ({ path: materialPathFromSkillReference(reference), role: 'pattern-reference' }))),
  ...(route.domainReference ? [{ path: materialPathFromSkillReference(route.domainReference), role: 'domain-reference' }] : []),
  ...(components.some((component) => component.component === 'titlebar') ? [{ path: 'skill-support/references/components/titlebar-segments.md', role: 'titlebar-contract' }] : []),
  ...[...new Set(components.map((component) => component.source?.split('#')[0]).filter(Boolean))]
    .map((source) => ({ path: source, role: 'selected-component-adapter' })),
  { path: mode === 'fast-preview' ? 'skill-support/references/workflows/fast-preview.md' : 'skill-support/references/workflows/release-validation.md', role: 'validation' },
  ...approvedReferences.map((reference) => ({ path: materialPathFromSkillReference(reference.path), role: 'approved-reference' }))
];
const materialDefinitionsForContext = materialDefinitions({
  skillRoot,
  routeId: workflowRouteId,
  workflowRoute,
  extraMaterials: dynamicMaterials
});
const materialSnapshotForContext = materialSnapshot({ repo, definitions: materialDefinitionsForContext });
const contextMaterialReceipt = args['receipt-out']
  ? writeContextReadReceipt({
    output: args['receipt-out'],
    workflowRouteId,
    routeDigest: stableDigest({ routeId: route.id, workflowRouteId, patternDigest, materialsDigest: materialSnapshotForContext.digest }),
    snapshot: materialSnapshotForContext
  })
  : null;
const packet = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  repository: { root: repo, strategy: located.strategy },
  request: {
    task: args.task || null,
    domain: args.domain || null,
    framework,
    mode,
    confirmed: !discovery,
    confirmation: { status: discovery ? 'discovery' : 'confirmed', source: discovery ? 'design-discovery' : explicitlyConfirmed ? 'explicit-cli-flag' : 'auto-page-blueprint' }
  },
  pageBlueprint: automaticBlueprint ? { id: automaticBlueprint.id, sha256: blueprintDigest(automaticBlueprint), path: blueprintPath } : null,
  route: { id: route.id, aliases: route.aliases, domains: route.domains, source: matchedRoute ? routeSelection.source : 'explicit-pattern', workflowRouteId, ...(route.domainReference ? { domainReference: route.domainReference } : {}) },
  routeMaterials: {
    schemaVersion: 1,
    workflowRouteId,
    digest: materialSnapshotForContext.digest,
    materials: materialSnapshotForContext.materials.map(({ path: materialPath, role, required, sha256 }) => ({ path: materialPath, role, required, sha256 }))
  },
  layout,
  patternContract: { ...resolvedPattern, patternDigest },
  components,
  componentReadMap,
  renderer,
  customCompositions: route.customCompositions,
  approvedReferences,
  tokens,
  designContext: {
    stage: discovery ? 'before-blueprint' : 'resolved-for-generation',
    ownership: { shell: 'renderer', businessContent: 'model', componentInternals: 'component-package' },
    geometry: resolvedPattern.pattern,
    layoutTokens: Object.fromEntries(Object.entries(indexes['token-index'].semanticRoles).filter(([role]) => /^(layout|space)\//.test(role))),
    componentSelectionRules: JSON.parse(fs.readFileSync(path.join(skillRoot, 'references/components/component-selection-rules.json'), 'utf8')).rules.filter((rule) => components.some((component) => component.logicalName === rule.logicalName)),
    iconAliases: Object.keys(JSON.parse(fs.readFileSync(path.join(skillRoot, 'assets/icons/icon-aliases.json'), 'utf8')).aliases ?? {}),
    guidance: 'references/page-design-guidance.md',
    rules: ['Design around the primary task, not the component inventory.', 'Use actual pane content width; do not duplicate shell padding.', 'Query missing capabilities before drawing custom controls.', 'Discovery cannot authorize compilation.']
  },
  exactReferencesToRead: [
    'references/page-design-guidance.md',
    ...(route.domainReference ? [route.domainReference] : []),
    'references/requirement-spec.md',
    'references/layouts/framework-layout-routing.md',
    ...layout.references,
    'assets/design-system/pattern-contracts.json',
    'references/components/source-resolution.md',
    ...[...new Set(componentReadMap.flatMap((item) => [item.contract, item.implementation].filter(Boolean)))],
    ...(components.some(component => component.component === 'titlebar') ? ['references/components/titlebar-segments.md'] : []),
    ...approvedReferences.map((reference) => reference.path),
    mode === 'fast-preview' ? 'references/workflows/fast-preview.md' : 'references/workflows/release-validation.md'
  ],
  materialsDigest: materialSnapshotForContext.digest,
  materials: materialSnapshotForContext.materials.map(({ path: materialPath, role, required, sha256 }) => ({ path: materialPath, role, required, sha256 })),
  ...(contextMaterialReceipt ? { materialReceipt: { path: path.resolve(args['receipt-out']), kind: contextMaterialReceipt.kind, materialsDigest: contextMaterialReceipt.materialsDigest } } : {}),
  validation: indexes['validation-index'].modes[mode],
  browserChecks: mode === 'fast-preview'
    ? ['target desktop viewport', 'shell/pane geometry', 'primary path', 'critical overlay', 'keyboard recovery']
    : ['all required states', 'accessibility', 'responsive minimum window', 'visual parity', 'final artifact reopening']
};

function markdown(value) {
  const lines = [
    '# Text-to-UI Context Packet', '',
    `- Task route: ${value.route.id}`,
    `- Framework: ${value.request.framework}`,
    `- Mode: ${value.request.mode}`,
    `- Monorepo: ${value.repository.root} (${value.repository.strategy})`, '',
    '## Layout', '',
    `- ${value.layout.label}`,
    `- Pane order: ${value.layout.paneOrder.join(' → ')}`,
    `- Required slots: ${value.layout.requiredSlots.join(', ')}`, '',
    '## Component resolution', ''
  ];
  for (const item of value.components) lines.push(`- ${item.required ? 'Required' : 'Optional'} ${item.capability}: ${item.sourceLevel}${item.component ? ` → ${item.component} (${item.source || item.contractPointer})` : ''}`);
  lines.push('', '## Exact component reading map', '');
  for (const item of value.componentReadMap) lines.push(`- ${item.capability} → ${item.logicalName}: contract ${item.contract}; ${item.implementation ? `implementation ${item.implementation}` : 'no target-framework implementation'}`);
  if (value.approvedReferences.length) lines.push('', '## Explicit approved page references', '', ...value.approvedReferences.map((reference) => `- ${reference.id}: ${reference.title} — ${reference.rationale}`));
  lines.push('', '## Page-owned compositions', '', ...value.customCompositions.map((item) => `- ${item}`), '', '## Route material closure', '', ...value.materials.map((item) => `- ${item.path} · ${item.role} · ${item.sha256}`), '', '## Read only these references', '', ...value.exactReferencesToRead.map((item) => `- ${item}`), '', '## Validation', '', ...value.validation.commands.map((item) => `- \`${item}\``), '');
  return `${lines.join('\n')}\n`;
}

if (args.out) {
  const output = path.resolve(args.out);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const format = args.format || (path.extname(output) === '.md' ? 'markdown' : 'json');
  fs.writeFileSync(output, format === 'markdown' ? markdown(packet) : stableJson(packet));
  console.log(`Context packet written: ${output}`);
} else if (args.format === 'markdown') {
  process.stdout.write(markdown(packet));
} else print(packet);
