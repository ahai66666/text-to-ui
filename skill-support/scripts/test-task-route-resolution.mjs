#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findTaskRouteCandidates, selectTaskRoute } from './task-route-lib.mjs';

const repo = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const skillRoot = path.join(repo, 'skill-support');
const scripts = path.join(skillRoot, 'scripts');
const routes = JSON.parse(fs.readFileSync(path.join(skillRoot, 'references/index/task-routes.source.json'), 'utf8')).routes;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'text-to-ui-task-routes-'));
const resolver = path.join(scripts, 'resolve-context.mjs');

const expectRoute = (query, routeId) => {
  const selection = selectTaskRoute(query, routes);
  assert.equal(selection.route?.id, routeId, `${query} should resolve to ${routeId}`);
};

expectRoute('file-list', 'record-management-workbench');
expectRoute(' FILE-LIST ', 'record-management-workbench');
expectRoute('file manager', 'tool-workspace');
expectRoute('File   Manager', 'tool-workspace');
expectRoute('文件管理', 'tool-workspace');
expectRoute('mail', 'communication-workbench');
expectRoute('tasks', 'record-management-workbench');
expectRoute('settings', 'dashboard-or-settings');
assert.deepEqual(
  findTaskRouteCandidates('file', routes).candidates.map((route) => route.id),
  ['record-management-workbench', 'tool-workspace']
);
assert.deepEqual(
  findTaskRouteCandidates('workbench', routes).candidates.map((route) => route.id),
  ['communication-workbench', 'record-management-workbench']
);
assert.equal(selectTaskRoute('file', routes, 'tool-workspace').route.id, 'tool-workspace');
assert.throws(() => selectTaskRoute('file manager', routes, 'record-management-workbench'), /conflicts with task/);

const resolveContext = (task, framework, extra = []) => {
  const output = path.join(temp, `${framework}-${Buffer.from(`${task}-${extra.join('-')}`).toString('hex')}.json`);
  const result = spawnSync(process.execPath, [resolver, '--task', task, '--framework', framework, '--mode', 'fast-preview', '--confirmed', '--repo', repo, '--skill-root', skillRoot, '--out', output, ...extra], { cwd: repo, encoding: 'utf8' });
  return { result, packet: result.status === 0 ? JSON.parse(fs.readFileSync(output, 'utf8')) : null };
};

for (const framework of ['html', 'react', 'vue']) {
  for (const [task, routeId] of [
    ['file-list', 'record-management-workbench'],
    ['file manager', 'tool-workspace'],
    ['mail', 'communication-workbench'],
    ['tasks', 'record-management-workbench'],
    ['settings', 'dashboard-or-settings']
  ]) {
    const { result, packet } = resolveContext(task, framework);
    assert.equal(result.status, 0, `${framework}/${task}: ${result.stderr}`);
    assert.equal(packet.route.id, routeId);
    assert.equal(packet.request.task, task, 'route resolution must preserve the original task description');
    assert.equal(packet.renderer.framework, framework);
    assert.ok(packet.componentReadMap.length > 0, `${framework}/${task}: missing component reading map`);
    for (const item of packet.componentReadMap) {
      assert.ok(packet.exactReferencesToRead.includes(item.contract), `${framework}/${task}: missing exact contract pointer for ${item.capability}`);
      if (item.implementation) {
        assert.ok(item.implementation.includes(`components-${framework}`), `${framework}/${task}: wrong framework source for ${item.capability}`);
        assert.ok(packet.exactReferencesToRead.includes(item.implementation), `${framework}/${task}: missing source pointer for ${item.capability}`);
      }
    }
  }
  const communication = resolveContext('communication', framework);
  assert.equal(communication.result.status, 0, communication.result.stderr);
  assert.equal(communication.packet.route.id, 'communication-workbench');
  assert.ok(communication.packet.exactReferencesToRead.includes('references/domains/email-workbench.md'));
  assert.ok(communication.packet.materials.some((item) => item.role === 'domain-reference' && item.path === 'skill-support/references/domains/email-workbench.md'), 'domain materials must follow the selected communication route, not query spelling');
}

const ambiguousFile = resolveContext('file', 'html');
assert.notEqual(ambiguousFile.result.status, 0);
assert.match(ambiguousFile.result.stderr, /Ambiguous task route/);
assert.match(ambiguousFile.result.stderr, /record-management-workbench/);
assert.match(ambiguousFile.result.stderr, /tool-workspace/);
const ambiguousWorkbench = resolveContext('workbench', 'html');
assert.notEqual(ambiguousWorkbench.result.status, 0);
assert.match(ambiguousWorkbench.result.stderr, /communication-workbench/);
assert.match(ambiguousWorkbench.result.stderr, /record-management-workbench/);

const explicit = resolveContext('file', 'html', ['--task-route', 'tool-workspace']);
assert.equal(explicit.result.status, 0, explicit.result.stderr);
assert.equal(explicit.packet.route.id, 'tool-workspace');
assert.equal(explicit.packet.route.source, 'explicit-task-route');
assert.equal(explicit.packet.request.task, 'file');
const conflict = resolveContext('file manager', 'html', ['--task-route', 'record-management-workbench']);
assert.notEqual(conflict.result.status, 0);
assert.match(conflict.result.stderr, /conflicts with task/);
const wrongPattern = resolveContext('file', 'html', ['--task-route', 'tool-workspace', '--pattern', 'pattern-b-three-pane', '--capabilities', 'titlebar']);
assert.notEqual(wrongPattern.result.status, 0);
assert.match(wrongPattern.result.stderr, /resolves to 'pattern-c-tool-workspace'/);
const mismatchedBlueprint = path.join(temp, 'mismatched-blueprint.json');
fs.writeFileSync(mismatchedBlueprint, JSON.stringify({
  schemaVersion: 1,
  id: 'mismatched-route-blueprint',
  task: 'file workspace',
  user: 'operator',
  workObject: 'files',
  primaryJob: 'manage files',
  designRationale: 'test route and blueprint agreement',
  pattern: { id: 'pattern-b-three-pane' }
}));
const blueprintConflict = resolveContext('file', 'html', ['--task-route', 'tool-workspace', '--auto', '--blueprint', mismatchedBlueprint]);
assert.notEqual(blueprintConflict.result.status, 0);
assert.match(blueprintConflict.result.stderr, /pageBlueprint\.pattern\.id must equal pattern-c-tool-workspace/);

const unknownWithoutPattern = resolveContext('unrouted-feature', 'html');
assert.notEqual(unknownWithoutPattern.result.status, 0);
assert.match(unknownWithoutPattern.result.stderr, /explicit --pattern/);
const unknownWithPattern = resolveContext('unrouted-feature', 'html', ['--pattern', 'pattern-a-two-pane', '--capabilities', 'titlebar,button']);
assert.equal(unknownWithPattern.result.status, 0, unknownWithPattern.result.stderr);
assert.equal(unknownWithPattern.packet.layout.id, 'pattern-a-two-pane');

fs.rmSync(temp, { recursive: true, force: true });
console.log('Task-route tests passed: exact aliases, complete-word ambiguity, explicit disambiguation, route-owned domain materials, and HTML/React/Vue contexts.');
