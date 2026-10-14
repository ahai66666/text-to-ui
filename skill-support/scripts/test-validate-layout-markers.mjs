#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tui-layout-markers-'));
const contractPath = path.join(temp, 'layout-contract.json');
const artifactPath = path.join(temp, 'index.html');
const sourcePath = path.join(temp, 'main.js');
const validator = path.resolve('skill-support/scripts/validate-layout-markers.mjs');
const contract = { pattern: 'pattern-b-three-pane', paneOrder: ['primary-navigation', 'secondary-list', 'main-detail'] };
const source = 'const root = document.createElement("main"); root.dataset.tuiPattern = "pattern-b-three-pane"; root.dataset.tuiPaneOrder = "primary-navigation secondary-list main-detail"; navigation.dataset.tuiPaneRole = "primary-navigation"; list.dataset.tuiPaneRole = "secondary-list"; detail.dataset.tuiPaneRole = "main-detail"; renderHtmlComponent("titlebar", { layout: "three-column", segmentRole: "final-pane", mainDetailActions: [] });';
fs.writeFileSync(contractPath, JSON.stringify(contract));
fs.writeFileSync(artifactPath, '<!doctype html><main id="app"></main>');
fs.writeFileSync(sourcePath, source);
const run = () => spawnSync(process.execPath, [validator, '--artifact', artifactPath, '--layout-contract', contractPath, '--source', sourcePath], { encoding: 'utf8' });
assert.equal(run().status, 0, run().stderr);
fs.writeFileSync(sourcePath, source.replace('mainDetailActions: []', '')); assert.notEqual(run().status, 0, 'Pattern B without main-detail-actions must fail');
fs.writeFileSync(sourcePath, source.replace('detail.dataset.tuiPaneRole = "main-detail"; ', '')); assert.notEqual(run().status, 0, 'missing pane marker must fail');
fs.rmSync(temp, { recursive: true, force: true });
console.log('Layout marker tests passed.');
