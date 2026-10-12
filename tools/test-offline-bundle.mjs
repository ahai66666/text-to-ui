#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const value = (name) => { const index = args.indexOf(`--${name}`); return index < 0 ? null : args[index + 1]; };
const bundle = path.resolve(value("bundle") ?? "");
if (!value("bundle")) throw new Error("Usage: test-offline-bundle.mjs --bundle <extracted text-to-ui> [--browser-required]");
const node = path.join(bundle, "runtime", process.platform === "win32" ? "node.exe" : "node");
const runner = path.join(bundle, "skill-support/scripts/offline-runner.mjs");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tui-offline-smoke-"));
const project = path.join(temp, "离线 项目");
const sourceFork = path.join(temp, "可写 源码");
const offlineEnvironment = { ...process.env, PATH: path.dirname(node), TUI_PLAYWRIGHT_MODULE: "" };
const run = (script, scriptArgs, cwd = bundle) => {
  const result = spawnSync(node, [script, ...scriptArgs], { cwd, env: offlineEnvironment, encoding: "utf8" });
  assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
  return result.stdout;
};
const freePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => { const port = server.address().port; server.close(() => resolve(port)); });
});
const sources = {
  html: `import "@text-to-ui/tokens";
import "@text-to-ui/components-html/styles.css";
import { renderHtmlComponent } from "@text-to-ui/components-html";
document.querySelector("#app").innerHTML = renderHtmlComponent("button", { label: "保存业务" }) + renderHtmlComponent("search", { placeholder: "搜索业务" }) + renderHtmlComponent("table", { title: "业务项目", columns: ["名称", "状态"], rows: [["离线任务", "待处理"]] });
`,
  react: `import React from "react";
import { createRoot } from "react-dom/client";
import "@text-to-ui/tokens";
import "@text-to-ui/components-react/styles.css";
import { Button, Search, Table } from "@text-to-ui/components-react";
createRoot(document.querySelector("#app")).render(React.createElement("main", null, React.createElement(Button, { label: "保存业务" }), React.createElement(Search, { placeholder: "搜索业务" }), React.createElement(Table, { title: "业务项目", columns: ["名称", "状态"], rows: [["离线任务", "待处理"]] })));
`,
  vue: `import { createApp, h } from "vue";
import "@text-to-ui/tokens";
import "@text-to-ui/components-vue/styles.css";
import { Button, Search, Table } from "@text-to-ui/components-vue";
createApp({ render: () => h("main", null, [h(Button, { label: "保存业务" }), h(Search, { placeholder: "搜索业务" }), h(Table, { title: "业务项目", columns: ["名称", "状态"], rows: [["离线任务", "待处理"]] })]) }).mount("#app");
`
};
let chromium = null;
try { ({ chromium } = await import("playwright")); }
catch (error) { if (args.includes("--browser-required")) throw new Error(`Playwright is required for browser acceptance: ${error.message}`); }
let browser = null;
try {
  run(runner, ["doctor"]);
  run(runner, ["fork-source", sourceFork]);
  const forkRunner = path.join(sourceFork, "skill-support/scripts/offline-runner.mjs");
  run(forkRunner, ["doctor"], sourceFork);
  run(forkRunner, ["refresh-index"], sourceFork);
  run(path.join(bundle, "skill-support/scripts/test-framework-page-generation.mjs"), [], bundle);
  run(runner, ["new-project", project]);
  if (chromium) browser = await chromium.launch({ headless: true });
  const results = [];
  for (const [framework, source] of Object.entries(sources)) {
    fs.writeFileSync(path.join(project, "main.js"), source);
    run(path.join(project, "node_modules/vite/bin/vite.js"), ["build"], project);
    assert(fs.existsSync(path.join(project, "dist/index.html")), `${framework} build did not produce an HTML entry`);
    const port = await freePort();
    const server = spawn(node, [path.join(project, "node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: project, env: offlineEnvironment, stdio: "ignore" });
    try {
      const url = `http://127.0.0.1:${port}/`;
      let response = null;
      for (let attempt = 0; attempt < 50; attempt += 1) {
        try { response = await fetch(url); if (response.ok) break; } catch {}
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      assert(response?.ok, `${framework} preview did not serve HTTP 200`);
      if (browser) {
        const page = await browser.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(url);
        const table = page.locator(`.tui-table[data-framework="${framework}"]`);
        await table.waitFor();
        assert.match(await table.textContent(), /离线任务/);
        assert.match(await table.textContent(), /业务项目/);
        assert.equal(await page.locator(`.tui-button[data-framework="${framework}"]`).count() > 0, true);
        assert.equal(await page.locator(`.tui-search[data-framework="${framework}"] input`).count() > 0, true);
        assert.deepEqual(errors, []);
        await page.close();
      }
      results.push({ framework, build: "passed", httpPreview: "passed", browser: browser ? "passed" : "unverified" });
    } finally {
      server.kill();
      await new Promise((resolve) => { if (server.exitCode !== null || server.signalCode !== null) resolve(); else server.once("exit", resolve); });
    }
  }
  console.log(JSON.stringify({ ok: true, bundle, globalNodeOrPackageManagerRequired: false, writableSourceFork: "passed", threeFrameworkGeneration: "passed", results }, null, 2));
} finally {
  await browser?.close();
  fs.rmSync(temp, { recursive: true, force: true });
}
