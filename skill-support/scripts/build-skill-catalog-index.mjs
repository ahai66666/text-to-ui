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
  ['routing-and-receipts', 'Route selection, Context Packet material closure, and read-receipt verification.', ['skill-support/references/routes/index.json', 'skill-support/references/routes/materials.source.json', 'skill-support/references/routes/skill-maintenance.md', 'skill-support/scripts/resolve-workflow-route.mjs', 'skill-support/scripts/task-route-lib.mjs', 'skill-support/scripts/resolve-context.mjs', 'skill-support/scripts/test-task-route-resolution.mjs', 'skill-support/scripts/verify-route-materials.mjs', 'skill-support/scripts/verify-context-materials.mjs']],
  ['patterns-and-runtime', 'Pattern contracts, Skeleton/Runtime renderers, deterministic Titlebar scenes, and Secondary Page composition.', ['skill-support/assets/design-system/pattern-contracts.json', 'skill-support/assets/design-system/pattern-contracts.schema.json', 'skill-support/assets/design-system/titlebar-scene-contracts.json', 'packages/pattern-runtime/src/index.js', 'packages/pattern-runtime/src/styles.css', 'skill-support/scripts/resolve-pattern-contract.mjs', 'skill-support/scripts/titlebar-scene.mjs', 'skill-support/scripts/validate-pattern-contracts.mjs', 'skill-support/scripts/test-pattern-runtime.mjs', 'skill-support/scripts/test-ui-scene-pattern-binding.mjs']],
  ['component-contracts-and-adapters', 'Component identity, Props, Slots, framework adapters, and registered reuse.', ['packages/component-contracts/src/components.json', 'packages/component-contracts/src/components-runtime.js', 'packages/component-contracts/src/parity-manifest.json', 'packages/component-contracts/src/titlebar-segments.js', 'skill-support/assets/design-system/framework-component-adapter-map.json', 'skill-support/scripts/validate-framework-component-adapter-map.mjs', 'skill-support/scripts/validate-runtime-component-reuse.mjs', 'skill-support/scripts/validate-web-component-reuse.mjs']],
  ['tokens-type-and-icons', 'Semantic Token maps, colors, typography, layout, and icon aliases.', ['packages/tokens/src/token-runtime-map.json', 'packages/tokens/src/tokens.colors.css', 'packages/tokens/src/tokens.typography.css', 'packages/tokens/src/tokens.layout.css', 'packages/tokens/src/tokens.spacing.css', 'packages/tokens/src/tokens.icon.css', 'skill-support/assets/icons/icon-aliases.json', 'skill-support/assets/design-system/pixso-icon-map.json', 'skill-support/scripts/validate-page-token-usage.mjs', 'skill-support/scripts/validate-pixso-icon-map.mjs']],
  ['ui-scene-and-generation', 'Shared UI Scene, page decision layers, compiler, and strict page generation.', ['skill-support/assets/design-system/ui-scene.schema.json', 'skill-support/assets/design-system/page-spec.schema.json', 'skill-support/scripts/page-ui-scene.mjs', 'skill-support/scripts/compile-ui-scene.mjs', 'skill-support/scripts/page-blueprint.mjs', 'skill-support/scripts/page-content-recipes.mjs', 'skill-support/scripts/generate-framework-page.mjs', 'skill-support/scripts/generate-compliant-page.mjs', 'skill-support/scripts/test-framework-page-generation.mjs']],
  ['gates-and-runtime-evidence', 'Reuse, Token, layout, artifact, and browser Runtime evidence gates.', ['skill-support/scripts/validate-page-composite-boundaries.mjs', 'skill-support/scripts/validate-page-css-boundaries.mjs', 'skill-support/scripts/validate-page-layout-binding.mjs', 'skill-support/scripts/verify-html-artifact.mjs', 'skill-support/scripts/stamp-framework-artifact.mjs', 'tools/validate-runtime-evidence.mjs', 'skill-support/references/workflows/fast-preview.md']],
  ['delivery-mirrors', 'Canonical delivery source, maintenance commands, and mirror synchronization implementation.', ['package.json', 'SKILL.md', 'skill-support/package.json', 'skill-support/scripts/skill-delivery.mjs', 'skill-support/references/governance/major-version-update-checklist.md', 'skill-support/references/governance/skill-catalog-refresh.md']],
  ['gallery-preview-and-baseline', 'Gallery/Preview source and visual baseline checks.', ['apps/component-gallery/runtime-catalog.js', 'apps/component-gallery/pattern-baseline.js', 'apps/component-gallery/preview.js', 'apps/component-gallery/gallery.css', 'tools/test-gallery-readiness.mjs', 'tools/validate-legacy-baseline.mjs']]
];

const catalog = {
  schemaVersion: 1,
  kind: 'text-to-ui-skill-catalog-index',
  authority: 'skill-support/references/governance/skill-catalog-refresh.md',
  policy: { canonicalSource: 'SKILL.md + skill-support/', refreshBeforeMaintenance: true, missingOrHashDriftIsBlocking: true, mirrorsAreValidatedAfterCanonicalChecks: true },
  derivedProducts: {
    generatedIndexes: 'skill-support/references/index/generated/*.json',
    builder: 'pnpm index:build',
    validator: 'pnpm index:check'
  },
  deliveryTargets: [
    'skill/ (local generated mirror; Git-ignored)',
    '$CODEX_HOME/skills/text-to-ui',
    'TEXT_TO_UI_UNIFIED_PLUGIN_DELIVERY_ROOT (optional user-selected directory)'
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
