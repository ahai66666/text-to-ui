#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { findComponent, generatedIndexDir, loadIndexes, locateMonorepo, parseArgs, resolveSkillRoot } from './navigation-index-lib.mjs';
import { materialSnapshot, routeMaterialIndexDigest } from './route-material-lib.mjs';

const args = parseArgs(process.argv.slice(2));
const located = locateMonorepo({ start: args.start || process.cwd(), explicitRepo: args.repo });
if (!located.root) throw new Error('Text-to-UI Monorepo not found');
const repo = located.root;
const skillRoot = resolveSkillRoot(repo, args['skill-root']);
const build = spawnSync(process.execPath, [path.join(skillRoot, 'scripts/build-navigation-index.mjs'), '--repo', repo, '--skill-root', path.relative(repo, skillRoot), '--check'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status || 1);
const indexes = loadIndexes(skillRoot);
const errors = [];
for (const route of indexes['task-router'].routes) {
  if (!indexes['layout-index'].layouts.some((layout) => layout.id === route.layout)) errors.push(`${route.id}: missing layout ${route.layout}`);
  if (route.domainReference) {
    const resolvedReference = path.resolve(skillRoot, route.domainReference);
    if (!route.domainReference.startsWith('references/') || !resolvedReference.startsWith(`${path.resolve(skillRoot)}${path.sep}`) || !fs.existsSync(resolvedReference)) {
      errors.push(`${route.id}: invalid or missing task-route domain reference ${route.domainReference}`);
    }
  }
  for (const capability of route.requiredCapabilities) {
    if (!findComponent(indexes['component-index'], capability)) errors.push(`${route.id}: missing required capability ${capability}`);
  }
}
for (const route of indexes['workflow-route-index'].routes) {
  if (!route.id || !route.description || !Array.isArray(route.exactReferencesToRead)) errors.push(`workflow route is incomplete: ${route.id ?? 'unknown'}`);
  for (const reference of route.exactReferencesToRead ?? []) if (!fs.existsSync(path.join(skillRoot, reference))) errors.push(`${route.id}: missing workflow reference ${reference}`);
}
const routeMaterialIndex = indexes['route-material-index'];
if (routeMaterialIndex.indexDigest !== routeMaterialIndexDigest(routeMaterialIndex)) errors.push('route-material-index: indexDigest is invalid');
for (const route of Object.values(routeMaterialIndex.routes ?? {})) {
  const workflowRoute = indexes['workflow-route-index'].routes.find((candidate) => candidate.id === route.id);
  if (!workflowRoute) {
    errors.push(`route-material-index: unknown workflow route ${route.id}`);
    continue;
  }
  if (!Array.isArray(route.materials) || route.materials.length === 0) {
    errors.push(`${route.id}: route material list is empty`);
    continue;
  }
  try {
    const snapshot = materialSnapshot({
      repo,
      definitions: route.materials.map(({ path: materialPath, role, required }) => ({ path: materialPath, role, required }))
    });
    if (snapshot.digest !== route.materialsDigest) errors.push(`${route.id}: route material hashes are stale`);
    for (const material of route.materials) {
      const current = snapshot.materials.find((entry) => entry.path === material.path);
      if (!current || current.sha256 !== material.sha256) errors.push(`${route.id}: material hash mismatch ${material.path}`);
    }
  } catch (error) {
    errors.push(`${route.id}: ${error.message}`);
  }
}
for (const component of indexes['component-index'].components) {
  for (const [framework, entry] of Object.entries(component.frameworks)) {
    if (!entry.exists) errors.push(`${component.id}: ${framework} source missing (${entry.source})`);
  }
}
for (const file of fs.readdirSync(generatedIndexDir(skillRoot))) {
  if (!file.endsWith('.json')) continue;
  JSON.parse(fs.readFileSync(path.join(generatedIndexDir(skillRoot), file), 'utf8'));
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Navigation indexes valid: ${indexes['component-index'].componentCount} components, ${indexes['task-router'].routes.length} task routes, ${indexes['workflow-route-index'].routes.length} workflow routes.`);
