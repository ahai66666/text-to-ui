#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File } from './navigation-index-lib.mjs';

const repo = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const file = path.join(repo, 'skill-support/references/index/generated/skill-catalog-index.json');
const catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
assert.equal(catalog.kind, 'text-to-ui-skill-catalog-index');
assert.equal(catalog.schemaVersion, 1);
const requiredGroups = [
  'routing-and-receipts', 'patterns-and-runtime', 'component-contracts-and-adapters',
  'tokens-type-and-icons', 'ui-scene-and-generation', 'gates-and-runtime-evidence',
  'delivery-mirrors', 'gallery-preview-and-baseline'
];
assert.deepEqual(catalog.groups.map((group) => group.id), requiredGroups);
for (const group of catalog.groups) {
  assert.ok(group.files.length > 0, `${group.id} must list source files`);
  for (const entry of group.files) {
    const source = path.join(repo, entry.path);
    assert.ok(fs.existsSync(source), `${group.id}: missing ${entry.path}`);
    assert.equal(sha256File(source), entry.sha256, `${group.id}: stale hash ${entry.path}`);
  }
}
console.log(`Skill catalog index passed: ${catalog.groups.length} groups and ${catalog.groups.reduce((count, group) => count + group.files.length, 0)} hashed sources.`);
