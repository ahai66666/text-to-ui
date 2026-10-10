#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tui-composite-boundary-"));
const valid = path.join(temp, "valid.js");
const invalid = path.join(temp, "invalid.js");
const unusedAdapter = path.join(temp, "unused-adapter.js");
fs.writeFileSync(valid, "export const mount = (host, { renderComponent }) => { host.innerHTML = '<p>业务内容</p>' + renderComponent('button', { label: '刷新' }); };\n");
fs.writeFileSync(invalid, "export const mount = () => '<button>绕过组件</button>';\n");
fs.writeFileSync(unusedAdapter, "export function mount(host, { renderComponent }) { host.innerHTML = '<p>没有调用适配器</p>'; }\n");
const script = path.resolve("skill-support/scripts/validate-page-composite-boundaries.mjs");
assert.equal(spawnSync(process.execPath, [script, "--source", valid]).status, 0);
assert.notEqual(spawnSync(process.execPath, [script, "--source", invalid]).status, 0);
assert.notEqual(spawnSync(process.execPath, [script, "--source", unusedAdapter]).status, 0);
fs.rmSync(temp, { recursive: true, force: true });
console.log("Page composite boundary tests passed.");
