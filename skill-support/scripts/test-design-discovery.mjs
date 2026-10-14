#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderHtmlComponent } from '../../packages/components-html/src/index.js';
import { resolveIcon } from '../../packages/components-html/src/icon-map.js';
import { validateSemanticIcons } from './page-runtime-preflight.mjs';

const repo = fileURLToPath(new URL('../..', import.meta.url));
for (const framework of ['html', 'react', 'vue']) {
  const result = spawnSync(process.execPath, ['skill-support/scripts/resolve-context.mjs', '--task', 'email', '--framework', framework, '--discover'], { cwd: repo, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const packet = JSON.parse(result.stdout);
  assert.equal(packet.request.confirmed, false);
  assert.equal(packet.request.confirmation.status, 'discovery');
  assert.equal(packet.pageBlueprint, null);
  assert.equal(packet.layout.id, 'pattern-b-three-pane');
  assert.ok(packet.designContext.iconAliases.includes('action/reply'));
  assert.ok(packet.designContext.geometry.geometry.regions['secondary-list']);
  assert.ok(packet.exactReferencesToRead.includes('references/domains/email-workbench.md'));
  assert.ok(packet.renderer.styleImports.includes('@text-to-ui/components-html/pattern-shell.css'));
}
const aliases = JSON.parse(fs.readFileSync(path.join(repo, 'skill-support/assets/icons/icon-aliases.json'), 'utf8')).aliases;
assert.doesNotThrow(() => validateSemanticIcons({ mainDetailActions: [{ icon: 'action/reply' }] }, aliases));
const unknownIconDiagnostics = validateSemanticIcons({ items: [{ icon: 'mail/reply' }] }, aliases, 'binding[0].options');
assert.deepEqual(unknownIconDiagnostics, [{ path: 'binding[0].options.items.0.icon', alias: 'mail/reply', resolution: 'unregistered' }]);
assert.equal(resolveIcon('clock').resolvedAlias, 'field/clock');
assert.equal(resolveIcon('window-minimize').resolvedAlias, 'window/minimize');
assert.equal(resolveIcon('disclosure-down').resolvedAlias, 'navigation/chevron-down');
assert.equal(resolveIcon('close').resolvedAlias, 'action/close');
assert.equal(resolveIcon('mail/does-not-exist').resolution, 'unresolved-fallback');
assert.doesNotThrow(() => renderHtmlComponent('button', { label: '未知图标', icon: 'mail/does-not-exist' }));
assert.doesNotThrow(() => renderHtmlComponent('primary-navigation-item', { label: '自定义入口', icon: 'mail/does-not-exist' }));
const publicTitle = renderHtmlComponent('titlebar', { layout: 'three-column', segmentRole: 'main-detail', mainDetailActions: [{ id: 'reply', label: '回复', icon: 'action/reply', showLabel: true }] });
assert.match(publicTitle, /data-action="reply"/);
assert.match(publicTitle, /data-action="close"/);
assert.equal(publicTitle, renderHtmlComponent('titlebar', { layout: 'three-column', segmentRole: 'final-pane', mainDetailActions: [{ id: 'reply', label: '回复', icon: 'action/reply', showLabel: true }] }));
assert.equal(renderHtmlComponent('primary-navigation-item', { icon: 'field/calendar' }), renderHtmlComponent('primary-navigation-item', { iconName: 'field/calendar' }));
assert.doesNotMatch(renderHtmlComponent('checkbox', { label: '选择邮件' }), /保存后自动同步/);
console.log('Design discovery, renderer interfaces and nested icon preflight tests passed.');
