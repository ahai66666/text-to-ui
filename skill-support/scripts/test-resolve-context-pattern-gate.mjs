#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tui-context-gate-'));
const output = path.join(temp, 'context.json');
const blueprint = path.join(temp, 'page-blueprint.json');
fs.writeFileSync(blueprint, JSON.stringify({ schemaVersion: 1, id: 'task-blueprint', task: 'tasks', user: 'worker', workObject: 'task', primaryJob: 'complete work', designRationale: 'three panes preserve navigation and detail context', pattern: { id: 'pattern-b-three-pane' }, regions: [{ id: 'primary-navigation' }, { id: 'secondary-list' }, { id: 'main-detail' }], contentGroups: [{ id: 'navigation', region: 'primary-navigation', purpose: 'navigate', order: 0, priority: 'supporting' }, { id: 'list', region: 'secondary-list', purpose: 'browse', order: 1, priority: 'primary', dataEntities: ['task'] }, { id: 'detail', region: 'main-detail', purpose: 'complete task', order: 2, priority: 'primary', dataEntities: ['task'] }], dataEntities: [{ id: 'task', fields: ['title', 'status'] }], interactions: [{ id: 'select', sourceGroup: 'list', targetGroup: 'detail', trigger: 'select row', stateChange: 'show selection', preserves: ['filter'], taskOutcome: 'show selection' }], states: [{ id: 'selected', kind: 'selection', appliesTo: ['list', 'detail'] }], design: { readingOrder: ['primary-navigation', 'secondary-list', 'main-detail'], informationPriority: ['task list', 'task detail'], regionResponsibilities: [{ region: 'primary-navigation', responsibility: 'navigate' }, { region: 'secondary-list', responsibility: 'browse' }, { region: 'main-detail', responsibility: 'complete task' }], contentDensity: { 'primary-navigation': 'compact', 'secondary-list': 'comfortable', 'main-detail': 'comfortable' }, primaryActionIds: ['select'], secondaryActionIds: [], relationships: [{ from: 'list', to: 'detail', kind: 'selection' }], stateMatrix: [{ stateId: 'selected', appliesTo: ['list', 'detail'], entryCondition: 'select row', recovery: 'restore selection' }] }, successCriteria: ['complete work'], recoveryPaths: ['restore list'] }));
const resolver = path.resolve('skill-support/scripts/resolve-context.mjs');
const run = (...args) => spawnSync(process.execPath, [resolver, ...args], { encoding: 'utf8' });
assert.notEqual(run('--task', 'tasks', '--framework', 'html', '--mode', 'fast-preview').status, 0, 'context must require automatic blueprint planning or explicit confirmation');
const auto = run('--task', 'tasks', '--framework', 'html', '--mode', 'fast-preview', '--auto', '--blueprint', blueprint, '--out', output);
assert.equal(auto.status, 0, auto.stderr);
assert.equal(JSON.parse(fs.readFileSync(output, 'utf8')).request.confirmation.source, 'auto-page-blueprint');
const known = run('--task', 'tasks', '--framework', 'html', '--mode', 'fast-preview', '--confirmed', '--out', output);
assert.equal(known.status, 0, known.stderr);
assert.equal(JSON.parse(fs.readFileSync(output, 'utf8')).layout.id, 'pattern-b-three-pane');
assert.notEqual(run('--task', 'unrouted-workflow', '--framework', 'html', '--mode', 'fast-preview', '--confirmed').status, 0, 'unknown task without Pattern must fail');
const unknown = run('--task', 'unrouted-workflow', '--framework', 'html', '--mode', 'fast-preview', '--confirmed', '--pattern', 'pattern-a-two-pane', '--capabilities', 'titlebar,button', '--out', output);
assert.equal(unknown.status, 0, unknown.stderr);
assert.equal(JSON.parse(fs.readFileSync(output, 'utf8')).layout.id, 'pattern-a-two-pane');
const expanded = run('--task', 'tasks', '--framework', 'html', '--confirmed', '--capabilities', 'attachment', '--out', output);
assert.equal(expanded.status, 0, expanded.stderr);
assert.ok(JSON.parse(fs.readFileSync(output, 'utf8')).renderer.components.some((component) => component.rendererKey === 'attachment'), 'known routes must accept task-specific library capabilities');
fs.rmSync(temp, { recursive: true, force: true });
console.log('Context Pattern gate tests passed.');
