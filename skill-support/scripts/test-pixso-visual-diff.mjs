#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "text-to-ui-visual-diff-test-"));

function writeBmp(file, rgb) {
  const width = 2;
  const height = -1;
  const rowStride = 8;
  const buffer = Buffer.alloc(54 + rowStride);
  buffer.write("BM", 0, "ascii");
  buffer.writeUInt32LE(buffer.length, 2);
  buffer.writeUInt32LE(54, 10);
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(rowStride, 34);
  for (let pixel = 0; pixel < width; pixel += 1) {
    const offset = 54 + pixel * 3;
    buffer[offset] = rgb[2];
    buffer[offset + 1] = rgb[1];
    buffer[offset + 2] = rgb[0];
  }
  fs.writeFileSync(file, buffer);
}

const reference = path.join(temporary, "reference.bmp");
const identical = path.join(temporary, "identical.bmp");
const different = path.join(temporary, "different.bmp");
writeBmp(reference, [255, 255, 255]);
writeBmp(identical, [255, 255, 255]);
writeBmp(different, [0, 0, 0]);

const compare = (actual, out) => spawnSync(process.execPath, [
  path.join(scripts, "compare-pixso-screenshots.mjs"),
  "--reference", reference,
  "--actual", actual,
  "--out", out,
  "--pixel-threshold", "20",
  "--max-different-ratio", "0.005",
], { encoding: "utf8" });

const pass = compare(identical, path.join(temporary, "pass.json"));
assert.equal(pass.status, 0, pass.stderr);
assert.equal(JSON.parse(pass.stdout).ok, true);
const fail = compare(different, path.join(temporary, "fail.json"));
assert.notEqual(fail.status, 0);
const failReport = JSON.parse(fail.stdout);
assert.equal(failReport.ok, false);
assert.equal(failReport.metrics.differentRatio, 1);

fs.rmSync(temporary, { recursive: true, force: true });
console.log("Pixso visual diff tests passed: identical screenshots pass and materially different screenshots fail.");
