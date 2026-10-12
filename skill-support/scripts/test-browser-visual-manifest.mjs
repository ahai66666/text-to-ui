#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { __test } = require("./browser-visual-manifest.js");

const plain = {
  overflow: "visible",
  overflowX: "visible",
  overflowY: "visible",
  textOverflow: "clip",
  whiteSpace: "normal",
  paddingTop: "0px",
  paddingRight: "0px",
  paddingBottom: "0px",
  paddingLeft: "0px",
  borderTopWidth: "0px",
  borderRightWidth: "0px",
  borderBottomWidth: "0px",
  borderLeftWidth: "0px",
  borderTopStyle: "none",
  borderRightStyle: "none",
  borderBottomStyle: "none",
  borderLeftStyle: "none",
  borderTopLeftRadius: "0px",
  borderTopRightRadius: "0px",
  borderBottomRightRadius: "0px",
  borderBottomLeftRadius: "0px",
  backgroundColor: "rgba(0, 0, 0, 0)",
  backgroundImage: "none",
  boxShadow: "none",
};

assert.equal(__test.textResizeMode(plain, { width: 80 }, { lineCount: 1, inlineWidth: 80 }), "WIDTH_AND_HEIGHT");
assert.equal(__test.textResizeMode(plain, { width: 240 }, { lineCount: 2, inlineWidth: 220 }), "HEIGHT");
assert.equal(__test.textResizeMode({ ...plain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, { width: 240 }, { lineCount: 1, inlineWidth: 320 }), "TRUNCATE");
assert.equal(__test.textResizeMode({ ...plain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, { width: 240 }, { lineCount: 1, inlineWidth: 220 }), "WIDTH_AND_HEIGHT");
assert.equal(__test.textResizeMode({ ...plain, overflow: "hidden" }, { width: 240 }, { lineCount: 1, inlineWidth: 80 }), "WIDTH_AND_HEIGHT");
assert.equal(__test.textResizeMode({ ...plain, whiteSpace: "nowrap" }, { width: 240 }, { lineCount: 1, inlineWidth: 80 }), "WIDTH_AND_HEIGHT");
const decorated = { ...plain, paddingLeft: "16px", paddingRight: "16px", backgroundColor: "rgb(10, 89, 247)", borderTopLeftRadius: "8px" };
assert.equal(__test.boxOwnsVisualAppearance(decorated), true);
assert.equal(__test.textResizeMode(decorated, { width: 96 }, { lineCount: 1, inlineWidth: 64 }), "NONE");
const textOnly = __test.textOnlyStyleRecord(decorated);
assert.equal(textOnly.paddingLeft, "0px");
assert.equal(textOnly.paddingRight, "0px");
assert.equal(textOnly.backgroundColor, "rgba(0, 0, 0, 0)");
assert.equal(textOnly.borderTopLeftRadius, "0px");

console.log("Browser visual manifest text sizing and box ownership regression passed.");
