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
