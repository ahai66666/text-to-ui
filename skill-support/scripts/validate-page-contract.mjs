#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import {
  readJson,
  validateConstraintContract,
  validatePageProvenance,
} from "./page-contract.mjs";

function usage() {
  console.error(
    "Usage: node scripts/validate-page-contract.mjs " +
      "--page-spec <page-spec.json> [--html <file.html>] [--manifest <run-manifest.json>] " +
      "[--delivery-record <delivery-record.json>] [--reuse-plan <reuse-plan.json>] " +
      "[--pixso-audit <pixso-binding-audit.json>]",
  );
  process.exit(2);
}

function parseArgs(argv) {
  const options = {
    pageSpec: null,
    html: [],
    manifest: null,
    deliveryRecord: null,
    reusePlan: null,
    pixsoAudit: null,
  };
  const single = new Map([
    ["--page-spec", "pageSpec"],
    ["--manifest", "manifest"],
    ["--delivery-record", "deliveryRecord"],
    ["--reuse-plan", "reusePlan"],
    ["--pixso-audit", "pixsoAudit"],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--html") {
      if (!argv[index + 1]) usage();
      options.html.push(path.resolve(argv[++index]));
      continue;
    }
    const key = single.get(argument);
    if (!key || !argv[index + 1]) usage();
    options[key] = path.resolve(argv[++index]);
  }
  if (!options.pageSpec) usage();
  return options;
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exists(filePath) {
  return Boolean(filePath) && fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function fileSha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function extractScriptSource(html) {
  return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .join("\n");
}

function renderedMarkup(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<svg\b[^>]*data-icon-sprite[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

function visibleText(html) {
  return renderedMarkup(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function scopedContent(html, scope = "source") {
  if (scope === "rendered-markup") return renderedMarkup(html);
  if (scope === "runtime-source") return extractScriptSource(html);
  if (scope === "visible-text") return visibleText(html);
  return html;
}

function parseAttributes(attributeSource) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of attributeSource.matchAll(pattern)) {
    const [, name, doubleValue, singleValue, bareValue] = match;
    attributes.set(name.toLowerCase(), doubleValue ?? singleValue ?? bareValue ?? "");
  }
  return attributes;
}

function parseSimpleSelector(selector) {
  const value = selector.trim();
  if (!value || /[\s>+~:]/.test(value)) return null;
  const tag = value.match(/^[a-z][a-z0-9:-]*/i)?.[0]?.toLowerCase() ?? null;
  const ids = [...value.matchAll(/#([a-z0-9_-]+)/gi)].map((match) => match[1].toLowerCase());
  const classes = [...value.matchAll(/\.([a-z0-9_-]+)/gi)].map((match) => match[1].toLowerCase());
  const attributes = [];
  for (const match of value.matchAll(
    /\[\s*([^\]=~*^$|\s]+)\s*(?:(\^=|\$=|\*=|~=|\|=|=)\s*(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\s*\]/g,
  )) {
    attributes.push({
      name: match[1].toLowerCase(),
      operator: match[2] ?? null,
      value: (match[3] ?? match[4] ?? match[5] ?? "").trim(),
    });
  }
  const consumed = [
    tag ?? "",
    ...ids.map((id) => `#${id}`),
    ...classes.map((className) => `.${className}`),
    ...attributes.map((attribute) => `[${attribute.name}]`),
  ].join("");
  if (!consumed || value.replace(/\s/g, "") === "") return null;
  return { tag, ids, classes, attributes };
}

function attributeMatches(actual, operator, expected) {
  if (actual === undefined) return false;
  if (!operator) return true;
  if (operator === "=") return actual === expected;
  if (operator === "~=") return actual.split(/\s+/).includes(expected);
  if (operator === "|=") return actual === expected || actual.startsWith(`${expected}-`);
  if (operator === "^=") return actual.startsWith(expected);
  if (operator === "$=") return actual.endsWith(expected);
  if (operator === "*=") return actual.includes(expected);
  return false;
}

function elementMatches(selectorParts, tagName, attributeSource) {
  const element = parseSimpleSelector(selectorParts);
  if (!element) return false;
  const attributes = parseAttributes(attributeSource);
  if (element.tag && element.tag !== tagName.toLowerCase()) return false;
  if (element.ids.some((id) => attributes.get("id") !== id)) return false;
  const classNames = (attributes.get("class") ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  if (element.classes.some((className) => !classNames.includes(className))) return false;
  if (
    element.attributes.some((attribute) =>
      !attributeMatches(
        attributes.get(attribute.name),
        attribute.operator,
        attribute.value,
      ),
    )
  ) {
    return false;
  }
  return true;
}

function selectorMatches(html, selector) {
  const matches = [];
  const simpleSelector = selector.trim();
  for (const match of html.matchAll(/<([a-z][a-z0-9:-]*)\b([^>]*)>/gi)) {
    if (elementMatches(simpleSelector, match[1], match[2])) {
      matches.push({ tagName: match[1], attributes: parseAttributes(match[2]) });
    }
  }
  return matches;
}

function findPatterns(content, assertion) {
  const patterns = Array.isArray(assertion.patterns) ? assertion.patterns : [];
  const regexPatterns = Array.isArray(assertion.regexPatterns)
    ? assertion.regexPatterns
    : [];
  const normalized = content.toLowerCase();
  const literalMatches = patterns.filter((pattern) =>
    normalized.includes(String(pattern).toLowerCase()),
  );
  const regexMatches = regexPatterns.filter((pattern) => {
    try {
      return new RegExp(pattern, "i").test(content);
    } catch {
      return false;
    }
  });
  return [...literalMatches, ...regexMatches];
}

function evaluateRequiredAssertion(html, check) {
  const assertion = check.assertion ?? check;
  const content = scopedContent(html, check.scope);
  switch (assertion.kind) {
    case "selector-count": {
      const count = selectorMatches(content, assertion.selector).length;
      const minPass = assertion.min === undefined || count >= assertion.min;
      const maxPass = assertion.max === undefined || count <= assertion.max;
      return {
        pass: minPass && maxPass,
        details: `selector ${assertion.selector} matched ${count}`,
      };
    }
    case "text-present": {
      const pass = content.includes(assertion.text);
      return { pass, details: `text ${JSON.stringify(assertion.text)} ${pass ? "found" : "missing"}` };
    }
    case "pattern-present": {
      const found = findPatterns(content, assertion);
      const pass = found.length > 0;
      return { pass, details: `${found.length} pattern(s) found` };
    }
    case "attribute-present": {
      const matches = selectorMatches(content, assertion.selector);
      const pass = matches.some((match) => match.attributes.has(assertion.attribute.toLowerCase()));
      return { pass, details: `attribute ${assertion.attribute} on ${assertion.selector} ${pass ? "found" : "missing"}` };
    }
    case "attribute-equals": {
      const matches = selectorMatches(content, assertion.selector);
      const pass = matches.some(
        (match) => match.attributes.get(assertion.attribute.toLowerCase()) === assertion.value,
      );
      return { pass, details: `attribute ${assertion.attribute}=${JSON.stringify(assertion.value)} ${pass ? "found" : "missing"}` };
    }
    default:
      return { pass: false, details: `unsupported assertion ${assertion.kind}` };
  }
}

function evaluateForbiddenAssertion(html, check) {
  const assertion = check.assertion ?? check;
  const content = scopedContent(html, check.scope);
  if (assertion.kind === "selector-count") {
    const count = selectorMatches(content, assertion.selector).length;
    return { pass: count === 0, details: `forbidden selector ${assertion.selector} matched ${count}` };
  }
  if (assertion.kind === "attribute-present" || assertion.kind === "attribute-equals") {
    const result = evaluateRequiredAssertion(html, check);
    return { pass: !result.pass, details: `forbidden ${result.details}` };
  }
  if (assertion.kind === "text-present") {
    const found = content.includes(assertion.text);
    return { pass: !found, details: `forbidden text ${JSON.stringify(assertion.text)} ${found ? "found" : "missing"}` };
  }
  const found = findPatterns(content, assertion);
  return { pass: found.length === 0, details: `forbidden patterns matched ${found.length}` };
}

function evaluateCheck(html, check, forbidden = false) {
  return forbidden
    ? evaluateForbiddenAssertion(html, check)
    : evaluateRequiredAssertion(html, check);
}

function metaValue(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(
    new RegExp(`<meta\\b[^>]*\\bname=["']${escaped}["'][^>]*>`, "i"),
  );
  return match?.[0].match(/\bcontent=["']([^"']*)["']/i)?.[1] ?? null;
}

function readArtifactMeta(filePath) {
  if (filePath.toLowerCase().endsWith(".html")) {
    const html = readText(filePath);
    return {
      runId: metaValue(html, "text-to-ui-run-id"),
      pageSpecSha256: metaValue(html, "text-to-ui-page-spec-sha256"),
      pageSpecPath: metaValue(html, "text-to-ui-page-spec-path"),
    };
  }
  const value = readJson(filePath);
  return {
    runId: value.runId ?? value.provenance?.runId ?? null,
    pageSpecSha256: value.pageSpecSha256 ?? value.provenance?.pageSpecSha256 ?? null,
    pageSpecPath: value.pageSpecPath ?? value.provenance?.pageSpecPath ?? null,
  };
}

function normalizedPath(value, basePath) {
  if (!value) return null;
  return path.resolve(basePath, value);
}

function validateArtifactMeta(filePath, label, expected, pageSpecPath, failures) {
  if (!exists(filePath)) {
    failures.push(`${label} does not exist: ${filePath}`);
    return;
  }
  let meta;
  try {
    meta = readArtifactMeta(filePath);
  } catch (error) {
    failures.push(`${label} is not readable JSON/HTML: ${error.message}`);
    return;
  }
  if (meta.runId !== expected.runId) {
    failures.push(`${label} runId mismatch: expected ${expected.runId}, received ${meta.runId ?? "missing"}`);
  }
  if (meta.pageSpecSha256 !== expected.pageSpecSha256) {
    failures.push(`${label} pageSpecSha256 mismatch: expected ${expected.pageSpecSha256}, received ${meta.pageSpecSha256 ?? "missing"}`);
  }
  if (!meta.pageSpecPath) {
    failures.push(`${label} pageSpecPath is missing`);
  } else if (normalizedPath(meta.pageSpecPath, path.dirname(filePath)) !== pageSpecPath) {
    failures.push(`${label} pageSpecPath does not point to the supplied page spec`);
  }
}

function validateReuseMode(spec, reusePlan, failures) {
  if (!reusePlan) return;
  const contract = spec.componentContract ?? {};
  const expectedStrategy = contract.reuseStrategy ?? "import-and-repair";
  const expectedStrict = contract.strictComponentParity === true;
  if (reusePlan.strategy !== expectedStrategy) {
    failures.push(`reuse plan strategy mismatch: expected ${expectedStrategy}, received ${reusePlan.strategy ?? "missing"}`);
  }
  if (Boolean(reusePlan.strictRequested) !== expectedStrict) {
    failures.push(`reuse plan strictRequested mismatch: expected ${expectedStrict}, received ${Boolean(reusePlan.strictRequested)}`);
  }
  if (expectedStrict && reusePlan.strictReady !== true) {
    failures.push("strict structured reuse plan is not ready");
  }
}

function validateDeliveryMode(spec, deliveryRecord, htmlPaths, failures) {
  if (!deliveryRecord) return;
  if (deliveryRecord.workflow && deliveryRecord.workflow !== spec.workflow) {
    failures.push(`delivery record workflow mismatch: expected ${spec.workflow}, received ${deliveryRecord.workflow}`);
  }
  const expectedStrict = spec.componentContract?.strictComponentParity === true;
  if (deliveryRecord.pixsoStrictReuse?.requested !== undefined &&
      Boolean(deliveryRecord.pixsoStrictReuse.requested) !== expectedStrict) {
    failures.push(`delivery record strict reuse mismatch: expected ${expectedStrict}, received ${Boolean(deliveryRecord.pixsoStrictReuse.requested)}`);
  }
  if (deliveryRecord.finalHtmlPath && htmlPaths.length > 0 &&
      path.resolve(deliveryRecord.finalHtmlPath) !== htmlPaths[htmlPaths.length - 1]) {
    failures.push("delivery record finalHtmlPath does not point to the supplied final HTML");
  }
}

function validateManifest(manifestPath, expected, pageSpecPath, contract, supplied, failures) {
  if (!manifestPath) return;
  if (!exists(manifestPath)) {
    failures.push(`run manifest does not exist: ${manifestPath}`);
    return;
  }
  let manifest;
  try {
    manifest = readJson(manifestPath);
  } catch (error) {
    failures.push(`run manifest is not valid JSON: ${error.message}`);
    return;
  }
  if (manifest.runId !== expected.runId) failures.push("run manifest runId mismatch");
  if (manifest.pageSpecSha256 !== expected.pageSpecSha256) failures.push("run manifest pageSpecSha256 mismatch");
  if (normalizedPath(manifest.pageSpecPath, path.dirname(manifestPath)) !== pageSpecPath) {
    failures.push("run manifest pageSpecPath does not point to the supplied page spec");
  }
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
    failures.push("run manifest artifacts must be a non-empty array");
    return;
  }
  const manifestArtifacts = [];
  for (const [index, artifact] of manifest.artifacts.entries()) {
    if (!isRecord(artifact) || typeof artifact.path !== "string") {
      failures.push(`run manifest artifacts[${index}] must contain a path`);
      continue;
    }
    const artifactPath = normalizedPath(artifact.path, path.dirname(manifestPath));
    manifestArtifacts.push({ artifact, artifactPath });
    if (artifact.runId !== expected.runId) failures.push(`run manifest artifacts[${index}] runId mismatch`);
    if (artifact.pageSpecSha256 !== expected.pageSpecSha256) failures.push(`run manifest artifacts[${index}] pageSpecSha256 mismatch`);
    if (!exists(artifactPath)) failures.push(`run manifest artifact does not exist: ${artifactPath}`);
    else if (artifact.fileSha256 !== fileSha256(artifactPath)) {
      failures.push(`run manifest artifacts[${index}] fileSha256 mismatch`);
    }
  }
  for (const required of contract?.acceptance?.requiredArtifacts ?? []) {
    if (required.kind === "manifest") continue;
    const expectedPath = required.path
      ? path.resolve(supplied.pageSpecDir, required.path)
      : supplied.byKind[required.kind];
    if (!expectedPath) continue;
    const covered = manifestArtifacts.some(
      ({ artifact, artifactPath }) =>
        artifact.kind === required.kind && artifactPath === expectedPath,
    );
    if (!covered) {
      failures.push(`run manifest does not cover required artifact: ${required.id} (${required.kind})`);
    }
  }
}

function validateAcceptanceArtifacts(contract, supplied, failures) {
  for (const artifact of contract.acceptance.requiredArtifacts ?? []) {
    const filePath = artifact.path
      ? path.resolve(supplied.pageSpecDir, artifact.path)
      : supplied.byKind[artifact.kind];
    if (!filePath || !exists(filePath)) {
      failures.push(`required artifact missing: ${artifact.id} (${artifact.kind})`);
    }
  }
}

function validateHtmlConstraints(contract, htmlPath, failures) {
  const html = readText(htmlPath);
  for (const check of contract.must ?? []) {
    const result = evaluateCheck(html, check, false);
    if (!result.pass) failures.push(`${htmlPath}: must ${check.id} failed (${result.details})`);
  }
  for (const check of contract.mustNot ?? []) {
    const result = evaluateCheck(html, check, true);
    if (!result.pass) failures.push(`${htmlPath}: mustNot ${check.id} failed (${result.details})`);
  }
  for (const check of contract.acceptance?.requiredStates ?? []) {
    const result = evaluateCheck(html, check, false);
    if (!result.pass) failures.push(`${htmlPath}: required state ${check.id} failed (${result.details})`);
  }
  for (const check of contract.acceptance?.requiredInteractions ?? []) {
    const result = evaluateCheck(html, check, false);
    if (!result.pass) failures.push(`${htmlPath}: required interaction ${check.id} failed (${result.details})`);
  }
}

const options = parseArgs(process.argv.slice(2));
const failures = [];
const pageSpec = readJson(options.pageSpec);
const contractFailures = validateConstraintContract(pageSpec.constraintContract);
failures.push(...contractFailures);
failures.push(...validatePageProvenance(pageSpec.provenance, pageSpec));

const expected = {
  runId: pageSpec.provenance?.runId,
  pageSpecSha256: pageSpec.provenance?.pageSpecSha256,
};
const supplied = {
  pageSpecDir: path.dirname(options.pageSpec),
  byKind: {
    "page-spec": options.pageSpec,
    html: options.html.at(-1),
    manifest: options.manifest,
    "delivery-record": options.deliveryRecord,
    "reuse-plan": options.reusePlan,
    "pixso-audit": options.pixsoAudit,
  },
};

if (isRecord(pageSpec.constraintContract?.acceptance)) {
  validateAcceptanceArtifacts(pageSpec.constraintContract, supplied, failures);
}

for (const htmlPath of options.html) {
  if (!exists(htmlPath)) {
    failures.push(`HTML does not exist: ${htmlPath}`);
    continue;
  }
  validateHtmlConstraints(pageSpec.constraintContract ?? {}, htmlPath, failures);
  validateArtifactMeta(htmlPath, "HTML", expected, path.resolve(options.pageSpec), failures);
}

const jsonArtifacts = [
  [options.deliveryRecord, "delivery record"],
  [options.reusePlan, "reuse plan"],
  [options.pixsoAudit, "Pixso audit"],
];
for (const [filePath, label] of jsonArtifacts) {
  if (filePath) validateArtifactMeta(filePath, label, expected, path.resolve(options.pageSpec), failures);
}

let deliveryRecord = null;
let reusePlan = null;
if (options.deliveryRecord && exists(options.deliveryRecord)) deliveryRecord = readJson(options.deliveryRecord);
if (options.reusePlan && exists(options.reusePlan)) reusePlan = readJson(options.reusePlan);
validateReuseMode(pageSpec, reusePlan, failures);
validateDeliveryMode(pageSpec, deliveryRecord, options.html, failures);
validateManifest(
  options.manifest,
  expected,
  path.resolve(options.pageSpec),
  pageSpec.constraintContract,
  supplied,
  failures,
);

const result = {
  ok: failures.length === 0,
  pageSpec: path.resolve(options.pageSpec),
  runId: expected.runId ?? null,
  pageSpecSha256: expected.pageSpecSha256 ?? null,
  html: options.html,
  artifacts: {
    manifest: options.manifest,
    deliveryRecord: options.deliveryRecord,
    reusePlan: options.reusePlan,
    pixsoAudit: options.pixsoAudit,
  },
  failures,
};
console.log(JSON.stringify(result, null, 2));
if (failures.length > 0) process.exit(1);
