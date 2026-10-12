#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const pluginMain = fs.readFileSync(path.join(scripts, "pixso-native-renderer-plugin/main.js"), "utf8");
const messages = [];
const context = {
  __html__: "<!doctype html>",
  Promise,
  Date,
  Array,
  JSON,
  Error,
  console,
  fetch: async () => { throw new Error("A Permanent Executor must not fetch executable runtime code"); },
  pixso: {
    showUI() {},
    notify() {},
    ui: { postMessage: (message) => messages.push(message) },
  },
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(pluginMain, context, { filename: "main.js" });
const latest = [...messages].reverse().find((message) => message.type === "RUNTIME_VERSION");
assert.equal(latest.version, "5.0.0");
assert.equal(latest.runtimeLoadState.source, "installed-permanent-executor");
assert.equal(latest.runtimeLoadState.verified, true);
assert.equal(latest.executorVersion, "1.0.0");
assert.ok(latest.capabilities.includes("executor.data-plan.v1"));
assert.equal(latest.capabilities.includes("runtime.hot-update"), false);

console.log("Pixso Permanent Executor test passed: the shareable plugin is self-contained and does not fetch executable code.");
