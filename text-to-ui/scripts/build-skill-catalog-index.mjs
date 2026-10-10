#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  generatedIndexDir, locateMonorepo, parseArgs, resolveSkillRoot, sha256File, stableJson
} from './navigation-index-lib.mjs';

const args = parseArgs(process.argv.slice(2));
const located = locateMonorepo({ start: args.start || process.cwd(), explicitRepo: args.repo });
if (!located.root) throw new Error(`Text-to-UI Monorepo not found. Tried:\n${located.attempted.join('\n')}`);
const repo = located.root;
const skillRoot = resolveSkillRoot(repo, args['skill-root']);

const groups = [
  ['routing-and-receipts', 'Route selection, Context Packet material closure, and read-receipt verification.', ['text-to-ui/references/routes/index.json', 'text-to-ui/references/routes/materials.source.json', 'text-to-ui/references/routes/skill-maintenance.md', 'text-to-ui/scripts/resolve-workflow-route.mjs', 'text-to-ui/scripts/task-route-lib.mjs', 'text-to-ui/scripts/resolve-context.mjs', 'text-to-ui/scripts/test-task-route-resolution.mjs', 'text-to-ui/scripts/verify-route-materials.mjs', 'text-to-ui/scripts/verify-context-materials.mjs']],
  ['patterns-and-runtime', 'Pattern contracts, Skeleton/Runtime renderers, deterministic Titlebar scenes, and Secondary Page composition.', ['text-to-ui/assets/design-system/pattern-contracts.json', 'text-to-ui/assets/design-system/pattern-contracts.schema.json', 'text-to-ui/assets/design-system/titlebar-scene-contracts.json', 'packages/pattern-runtime/src/index.js', 'packages/pattern-runtime/src/styles.css', 'text-to-ui/scripts/resolve-pattern-contract.mjs', 'text-to-ui/scripts/titlebar-scene.mjs', 'text-to-ui/scripts/validate-pattern-contracts.mjs', 'text-to-ui/scripts/test-pattern-runtime.mjs', 'text-to-ui/scripts/test-ui-scene-pattern-binding.mjs']],
  ['component-contracts-and-adapters', 'Component identity, Props, Slots, framework adapters, and registered reuse.', ['packages/component-contracts/src/components.json', 'packages/component-contracts/src/components-runtime.js', 'packages/component-contracts/src/parity-manifest.json', 'packages/component-contracts/src/titlebar-segments.js', 'text-to-ui/assets/design-system/framework-component-adapter-map.json', 'text-to-ui/scripts/validate-framework-component-adapter-map.mjs', 'text-to-ui/scripts/validate-runtime-component-reuse.mjs', 'text-to-ui/scripts/validate-web-component-reuse.mjs']],
  ['tokens-type-and-icons', 'Semantic Token maps, colors, typography, layout, and icon aliases.', ['packages/tokens/src/token-runtime-map.json', 'packages/tokens/src/tokens.colors.css', 'packages/tokens/src/tokens.typography.css', 'packages/tokens/src/tokens.layout.css', 'packages/tokens/src/tokens.spacing.css', 'packages/tokens/src/tokens.icon.css', 'text-to-ui/assets/icons/icon-aliases.json', 'text-to-ui/assets/design-system/pixso-icon-map.json', 'text-to-ui/scripts/validate-page-token-usage.mjs', 'text-to-ui/scripts/validate-pixso-icon-map.mjs']],
  ['ui-scene-and-generation', 'Shared UI Scene, page decision layers, compiler, and strict page generation.', ['text-to-ui/assets/design-system/ui-scene.schema.json', 'text-to-ui/assets/design-system/page-spec.schema.json', 'text-to-ui/scripts/page-ui-scene.mjs', 'text-to-ui/scripts/compile-ui-scene.mjs', 'text-to-ui/scripts/page-blueprint.mjs', 'text-to-ui/scripts/page-content-recipes.mjs', 'text-to-ui/scripts/generate-framework-page.mjs', 'text-to-ui/scripts/generate-compliant-page.mjs', 'text-to-ui/scripts/test-framework-page-generation.mjs']],
  ['gates-and-runtime-evidence', 'Reuse, Token, layout, artifact, and browser Runtime evidence gates.', ['text-to-ui/scripts/validate-page-composite-boundaries.mjs', 'text-to-ui/scripts/validate-page-css-boundaries.mjs', 'text-to-ui/scripts/validate-page-layout-binding.mjs', 'text-to-ui/scripts/verify-html-artifact.mjs', 'text-to-ui/scripts/stamp-framework-artifact.mjs', 'tools/validate-runtime-evidence.mjs', 'text-to-ui/references/workflows/fast-preview.md']],
  ['delivery-mirrors', 'Canonical delivery source, maintenance commands, and mirror synchronization implementation.', ['package.json', 'text-to-ui/SKILL.md', 'text-to-ui/package.json', 'text-to-ui/scripts/skill-delivery.mjs', 'text-to-ui/references/governance/major-version-update-checklist.md', 'text-to-ui/references/governance/skill-catalog-refresh.md']],
  ['gallery-preview-and-baseline', 'Current Gallery/Preview source and runtime checks.', ['apps/component-gallery/runtime-catalog.js', 'apps/component-gallery/pattern-baseline.js', 'apps/component-gallery/preview.js', 'apps/component-gallery/gallery.css', 'tools/test-gallery-readiness.mjs', 'tools/validate-gallery-dist.mjs']]
];

const catalog = {
  schemaVersion: 1,
  kind: 'text-to-ui-skill-catalog-index',
  authority: 'text-to-ui/references/governance/skill-catalog-refresh.md',
  policy: { canonicalSource: 'text-to-ui/', refreshBeforeMaintenance: true, missingOrHashDriftIsBlocking: true, mirrorsAreValidatedAfterCanonicalChecks: true },
  derivedProducts: {
    generatedIndexes: 'text-to-ui/references/index/generated/*.json',
    builder: 'pnpm index:build',
    validator: 'pnpm index:check'
  },
  deliveryTargets: [
    'skill/',
    '$CODEX_HOME/skills/text-to-ui',
    '$TEXT_TO_UI_PLUGIN_DELIVERY_ROOT'
  ],
  groups: groups.map(([id, purpose, files]) => ({ id, purpose, files: files.map((relative) => {
    const absolute = path.join(repo, relative);
    if (!fs.existsSync(absolute)) throw new Error(`Catalog source is missing: ${relative}`);
    return { path: relative, sha256: sha256File(absolute) };
  }) }))
};
catalog.digest = sha256File(path.join(skillRoot, 'references', 'governance', 'skill-catalog-refresh.md'));
const output = path.join(generatedIndexDir(skillRoot), 'skill-catalog-index.json');
const expected = stableJson(catalog);
if (args.check) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== expected) {
    console.error(`Skill catalog index drift: ${path.relative(repo, output)}`);
    process.exitCode = 1;
  }
} else {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, expected);
  console.log(`Generated ${path.relative(repo, output)}`);
}
