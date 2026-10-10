#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const scripts = path.join(repo, 'skill-support/scripts');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'text-to-ui-route-materials-'));
const receipt = path.join(temp, 'new-page-read-receipt.json');
const routeOutput = spawnSync(process.execPath, [
  path.join(scripts, 'resolve-workflow-route.mjs'),
  '--route', 'new-page', '--repo', repo, '--receipt-out', receipt
], { cwd: repo, encoding: 'utf8' });
assert.equal(routeOutput.status, 0, routeOutput.stderr);
const route = JSON.parse(routeOutput.stdout);
assert.equal(route.ok, true);
assert.ok(route.materials.length >= 10);
assert.equal(route.materialsDigest, route.readReceipt.materialsDigest);
assert.ok(route.materials.some((material) => material.role === 'titlebar-scene-contract'));
assert.ok(route.materials.some((material) => material.path === 'skill-support/references/index/task-routes.source.json' && material.role === 'task-route-registry'), 'new-page receipts must cover the canonical task-route registry');
assert.ok(route.materials.some((material) => material.role === 'component-selection-rules'), 'route receipts must cover component selection rules');
assert.ok(route.materials.some((material) => material.role === 'component-readiness-policy'), 'route receipts must cover component readiness policy');
const verify = spawnSync(process.execPath, [
  path.join(scripts, 'verify-route-materials.mjs'),
  '--route', 'new-page', '--repo', repo, '--receipt', receipt
], { cwd: repo, encoding: 'utf8' });
assert.equal(verify.status, 0, verify.stderr);
const invalid = JSON.parse(fs.readFileSync(receipt, 'utf8'));
invalid.materials[0].sha256 = 'stale';
fs.writeFileSync(receipt, JSON.stringify(invalid));
const rejected = spawnSync(process.execPath, [
  path.join(scripts, 'verify-route-materials.mjs'),
  '--route', 'new-page', '--repo', repo, '--receipt', receipt
], { cwd: repo, encoding: 'utf8' });
assert.notEqual(rejected.status, 0);
assert.match(rejected.stderr, /does not match the route closure/);
const maintenanceReceipt = path.join(temp, 'skill-maintenance-read-receipt.json');
const maintenanceOutput = spawnSync(process.execPath, [
  path.join(scripts, 'resolve-workflow-route.mjs'),
  '--route', 'skill-maintenance', '--repo', repo, '--receipt-out', maintenanceReceipt
], { cwd: repo, encoding: 'utf8' });
assert.equal(maintenanceOutput.status, 0, maintenanceOutput.stderr);
const maintenance = JSON.parse(maintenanceOutput.stdout);
assert.ok(maintenance.materials.some((material) => material.role === 'skill-catalog-index'));
assert.ok(maintenance.materials.some((material) => material.role === 'skill-catalog-governance'));
assert.ok(maintenance.materials.some((material) => material.role === 'titlebar-scene-contract'));
const maintenanceVerify = spawnSync(process.execPath, [
  path.join(scripts, 'verify-route-materials.mjs'),
  '--route', 'skill-maintenance', '--repo', repo, '--receipt', maintenanceReceipt
], { cwd: repo, encoding: 'utf8' });
assert.equal(maintenanceVerify.status, 0, maintenanceVerify.stderr);
const contextPath = path.join(temp, 'context.json');
const contextReceipt = path.join(temp, 'context-material-receipt.json');
const contextOutput = spawnSync(process.execPath, [
  path.join(scripts, 'resolve-context.mjs'),
  '--task', 'tasks', '--framework', 'html', '--mode', 'fast-preview', '--confirmed', '--repo', repo,
  '--out', contextPath, '--receipt-out', contextReceipt
], { cwd: repo, encoding: 'utf8' });
assert.equal(contextOutput.status, 0, contextOutput.stderr);
const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
assert.equal(context.materialReceipt.kind, 'text-to-ui-context-material-receipt');
assert.ok(context.componentReadMap.length > 0, 'context must give a targeted component reading map');
for (const item of context.componentReadMap) {
  assert.ok(item.contract.startsWith('packages/component-contracts/src/components.json#'), `missing exact contract for ${item.capability}`);
  assert.ok(context.exactReferencesToRead.includes(item.contract), `contract not listed for reading: ${item.capability}`);
  if (item.implementation) {
    assert.ok(context.exactReferencesToRead.includes(item.implementation), `implementation not listed for reading: ${item.capability}`);
    assert.ok(context.materials.some((material) => material.path === item.implementation.split('#')[0] && material.role === 'selected-component-adapter'), `implementation absent from receipt: ${item.capability}`);
  }
}
const settingsContextPath = path.join(temp, 'settings-context.json');
const settingsOutput = spawnSync(process.execPath, [
  path.join(scripts, 'resolve-context.mjs'), '--task', 'settings', '--framework', 'html',
  '--mode', 'fast-preview', '--discover', '--repo', repo, '--out', settingsContextPath
], { cwd: repo, encoding: 'utf8' });
assert.equal(settingsOutput.status, 0, settingsOutput.stderr);
const settingsContext = JSON.parse(fs.readFileSync(settingsContextPath, 'utf8'));
assert.equal(settingsContext.route.id, 'dashboard-or-settings');
assert.ok(settingsContext.customCompositions.includes('dashboard-card'));
assert.ok(!settingsContext.components.some((component) => component.required && component.capability === 'card'), 'settings cards must not resolve to List Item');
const cardQuery = spawnSync(process.execPath, [path.join(scripts, 'query-components.mjs'), '--repo', repo, '--framework', 'html', '--capabilities', 'card'], { cwd: repo, encoding: 'utf8' });
assert.equal(cardQuery.status, 0, cardQuery.stderr);
assert.equal(JSON.parse(cardQuery.stdout).results[0].resolution, 'custom');
const contextVerify = spawnSync(process.execPath, [
  path.join(scripts, 'verify-context-materials.mjs'),
  '--repo', repo, '--context', contextPath, '--receipt', contextReceipt
], { cwd: repo, encoding: 'utf8' });
assert.equal(contextVerify.status, 0, contextVerify.stderr);
const invalidContext = JSON.parse(fs.readFileSync(contextReceipt, 'utf8'));
invalidContext.materials[0].sha256 = 'stale';
fs.writeFileSync(contextReceipt, JSON.stringify(invalidContext));
const rejectedContext = spawnSync(process.execPath, [
  path.join(scripts, 'verify-context-materials.mjs'),
  '--repo', repo, '--context', contextPath, '--receipt', contextReceipt
], { cwd: repo, encoding: 'utf8' });
assert.notEqual(rejectedContext.status, 0);
assert.match(rejectedContext.stderr, /does not match the resolved closure/);
console.log('Route material tests passed: route/context closures, hashes, receipts, and stale receipt rejection.');
