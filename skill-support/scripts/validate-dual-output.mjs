#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

const pageSpecPath = valueAfter("--page-spec");
const htmlPath = valueAfter("--html");
const pixsoAuditPath = valueAfter("--pixso-audit");

if (!pageSpecPath || (!htmlPath && !pixsoAuditPath)) {
  console.error(
    "Usage: node scripts/validate-dual-output.mjs --page-spec <page-spec.json> " +
      "[--html <file.html>] [--pixso-audit <pixso-audit.json>]",
  );
  process.exit(2);
}

const spec = JSON.parse(fs.readFileSync(path.resolve(pageSpecPath), "utf8"));
const usedTokens = spec.tokenContract?.usedTokens ?? [];
const webCoverage = spec.tokenContract?.webCoverage ?? [];
const failures = [];
const warnings = [];

function colorLiterals(value) {
  return (
    value.match(
      /#[0-9a-f]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)|\b(?:white|black)\b/gi,
    ) ?? []
  );
}

const tokenizedMetricProperties = new Set([
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "padding",
  "padding-block",
  "padding-block-start",
  "padding-block-end",
  "padding-inline",
  "padding-inline-start",
  "padding-inline-end",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-block",
  "margin-block-start",
  "margin-block-end",
  "margin-inline",
  "margin-inline-start",
  "margin-inline-end",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "gap",
  "row-gap",
  "column-gap",
  "inset",
  "inset-block",
  "inset-inline",
  "top",
  "right",
  "bottom",
  "left",
  "border",
  "border-width",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-radius",
  "outline",
  "outline-width",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "opacity",
  "box-shadow",
  "text-shadow",
]);

function hardcodedMetricLiterals(property, value) {
  if (!tokenizedMetricProperties.has(property)) return [];

  const lengthMatches = [
    ...value.matchAll(
      /(?:^|[^\w.-])(-?(?:\d*\.)?\d+)(px|rem|em|ch|ex|cap|ic|lh|rlh|cm|mm|q|in|pc|pt|vh|vw|vmin|vmax|svh|svw|lvh|lvw|dvh|dvw)\b/gi,
    ),
  ]
    .map((match) => `${match[1]}${match[2]}`)
    .filter((literal) => !/^0(?:\.0+)?[a-z]+$/i.test(literal));

  if (
    (property === "font-weight" ||
      property === "line-height" ||
      property === "opacity") &&
    !value.includes("var(")
  ) {
    const unitless = value.trim().match(/^-?(?:\d*\.)?\d+$/)?.[0];
    if (unitless && !/^0(?:\.0+)?$/.test(unitless)) lengthMatches.push(unitless);
  }

  return [...new Set(lengthMatches)];
}

function validateStyleDeclaration(property, value, location) {
  if (property.startsWith("--")) return;

  const colors = colorLiterals(value);
  if (colors.length > 0) {
    failures.push(
      `Hardcoded ${location} color in ${property}: ${colors.join(", ")}`,
    );
  }

  const metrics = hardcodedMetricLiterals(property, value);
  if (metrics.length > 0) {
    failures.push(
      `Hardcoded ${location} metric in ${property}: ${metrics.join(", ")}`,
    );
  }
}

function normalizeCompiledSelector(selector) {
  return selector
    .replace(/:where\(\s*\[data-v-[^\]]+\]\s*\)/gi, "")
    .replace(/\[data-v-[^\]]+\]/gi, "")
    .replace(/\[([a-z0-9_-]+)=(['"])([^'"]+)\2\]/gi, "[$1=$3]")
    .replace(/\s+/g, " ")
    .replace(/\s*([>+~])\s*/g, "$1")
    .trim();
}

function validateHtml(inputPath) {
  const absolutePath = path.resolve(inputPath);
  const html = fs.readFileSync(absolutePath, "utf8");
  const vendorBlockPattern =
    /<(style|script)\b(?=[^>]*\bdata-token-audit=(["'])vendor\2)[^>]*>[\s\S]*?<\/\1>/gi;
  const hasVendorExclusion = vendorBlockPattern.test(html);
  vendorBlockPattern.lastIndex = 0;
  const auditedHtml = html.replace(vendorBlockPattern, "");
  const authoredMarkupHtml = auditedHtml.replace(
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  const inlineStyleEntries = [
    ...html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi),
  ].filter((match) => !/\bdata-token-audit=(["'])vendor\1/i.test(match[1]));
  const inlineStyleBlocks = inlineStyleEntries.map((match) => match[2]);
  const linkedStyleEntries = [];
  for (const match of html.matchAll(/<link\b([^>]*)>/gi)) {
    const attributes = match[1];
    if (!/\brel=(["'])stylesheet\1/i.test(attributes)) continue;
    const hrefMatch = attributes.match(/\bhref=(["'])(.*?)\1/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[2]
      .replace(/&amp;/gi, "&")
      .split(/[?#]/, 1)[0];
    if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/|data:|#)/i.test(href)) continue;
    const linkedPath = path.resolve(
      path.dirname(absolutePath),
      decodeURIComponent(href),
    );
    try {
      if (fs.statSync(linkedPath).isFile()) {
        linkedStyleEntries.push({
          attributes,
          content: fs.readFileSync(linkedPath, "utf8"),
        });
      }
    } catch {
      // Keep the normal HTML/link diagnostics; unreadable stylesheets do not
      // become an implicit pass.
    }
  }
  const linkedStyleBlocks = linkedStyleEntries.map((entry) => entry.content);
  const styleBlocks = [...inlineStyleBlocks, ...linkedStyleBlocks];
  const authoredCss = inlineStyleBlocks
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const linkedCss = linkedStyleBlocks
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const cssForRules = [authoredCss, linkedCss].filter(Boolean).join("\n");
  const visibleAuthoredCss = authoredCss.replace(
    /:root\s*\{[\s\S]*?\}/gi,
    "",
  );
  const authoredRules = new Map();
  for (const rule of cssForRules.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const selector of rule[1].split(",").map((value) => value.trim())) {
      if (!selector || selector.startsWith("@")) continue;
      const existing = authoredRules.get(selector) ?? [];
      existing.push(rule[2]);
      authoredRules.set(selector, existing);
    }
  }
  if (styleBlocks.length === 0) {
    failures.push("HTML contains no inline or linked authored stylesheet");
  }
  if (
    hasVendorExclusion &&
    !inlineStyleEntries.some((match) =>
      /\bdata-token-audit=(["'])page\1/i.test(match[1]),
    )
  ) {
    failures.push(
      'HTML excludes vendor output but has no data-token-audit="page" style layer',
    );
  }
  if (hasVendorExclusion && webCoverage.length === 0) {
    failures.push(
      "Compiled/vendor HTML must declare tokenContract.webCoverage for visible component styling",
    );
  }

  const usedWebVariables = new Set(
    usedTokens.map((token) => token.webCssVariable),
  );
  const classifiedWebVariables = new Set([
    ...usedWebVariables,
    ...(spec.styleContract?.typographyStyles ?? []).map(
      (style) => style.webCssVariable,
    ),
    ...(spec.styleContract?.effectStyles ?? []).map(
      (style) => style.webCssVariable,
    ),
    ...(spec.styleContract?.webOnlyConstraints ?? []).map(
      (constraint) => constraint.webCssVariable,
    ),
  ]);
  const tokenAuditSource = [auditedHtml, linkedCss].filter(Boolean).join("\n");
  for (const token of usedTokens) {
    const escaped = token.webCssVariable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`${escaped}\\s*:`).test(tokenAuditSource)) {
      failures.push(`HTML does not declare ${token.webCssVariable}`);
    }
    if (token.webUsageRequired !== false) {
      const withoutDeclaration = tokenAuditSource.replace(
        new RegExp(`${escaped}\\s*:[^;]+;`, "g"),
        "",
      );
      if (!withoutDeclaration.includes(`var(${token.webCssVariable})`)) {
        failures.push(`HTML does not consume ${token.webCssVariable} with var()`);
      }
    }
  }

  for (const coverage of webCoverage) {
    if (
      !coverage ||
      typeof coverage.selector !== "string" ||
      typeof coverage.property !== "string" ||
      typeof coverage.webCssVariable !== "string"
    ) {
      failures.push(`Invalid webCoverage entry: ${JSON.stringify(coverage)}`);
      continue;
    }
    if (!usedWebVariables.has(coverage.webCssVariable)) {
      failures.push(
        `webCoverage uses an unmapped CSS variable: ${coverage.webCssVariable}`,
      );
    }
    const normalizedCoverageSelector = normalizeCompiledSelector(
      coverage.selector,
    );
    if (
      hasVendorExclusion &&
      !/\[data-(?!v-)[a-z0-9-]+(?:=|\])/i.test(normalizedCoverageSelector)
    ) {
      failures.push(
        `Compiled/vendor webCoverage lacks a stable data boundary: ${coverage.selector}`,
      );
    }
    const hasStableDataSelector = /\[data-[a-z0-9-]+(?:=|\])/i.test(
      normalizedCoverageSelector,
    );
    const bodies = [...authoredRules.entries()]
      .filter(([selector]) => {
        if (selector === coverage.selector) return true;
        const normalizedSelector = normalizeCompiledSelector(selector);
        if (normalizedSelector === normalizedCoverageSelector) return true;
        return (
          hasStableDataSelector &&
          normalizedSelector.endsWith(normalizedCoverageSelector)
        );
      })
      .flatMap(([, ruleBodies]) => ruleBodies);
    const escapedProperty = coverage.property.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const escapedVariable = coverage.webCssVariable.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const declaration = new RegExp(
      `${escapedProperty}\\s*:\\s*[^;]*var\\(${escapedVariable}\\)`,
      "i",
    );
    if (!bodies.some((body) => declaration.test(body))) {
      failures.push(
        `Missing web Token coverage: ${coverage.selector} / ` +
          `${coverage.property} / ${coverage.webCssVariable}`,
      );
    }
  }

  for (const match of visibleAuthoredCss.matchAll(/var\((--[\w-]+)/g)) {
    if (!classifiedWebVariables.has(match[1])) {
      failures.push(
        `Visible CSS variable has no Token, Style, or Web-only contract: ${match[1]}`,
      );
    }
  }

  for (const component of spec.components ?? []) {
    const match = component.webSelector?.match(
      /^\[data-component=['"]([^'"]+)['"]\]$/,
    );
    if (match) {
      const value = match[1];
      const hasAttribute =
        html.includes(`data-component="${value}"`) ||
        html.includes(`data-component='${value}'`);
      if (!hasAttribute) {
        failures.push(
          `HTML does not contain the component contract ${component.webSelector}`,
        );
      }
    }
  }

  // Bundled external stylesheets can contain framework reset and utility
  // literals (for example Tailwind's transparent 1px helpers). Author
  // authored CSS is checked here; the linked stylesheet is still parsed for
  // Token declarations and webCoverage rules above.
  for (const css of inlineStyleBlocks) {
    const declaration = /([a-z-]+|--[a-z0-9-]+)\s*:\s*([^;{}]+);/gi;
    let match;
    while ((match = declaration.exec(css))) {
      const property = match[1];
      const value = match[2];
      validateStyleDeclaration(property, value, "CSS");
    }
  }

  for (const match of authoredMarkupHtml.matchAll(/\sstyle=(["'])(.*?)\1/gi)) {
    const declaration = /([a-z-]+|--[a-z0-9-]+)\s*:\s*([^;]+)/gi;
    let inlineMatch;
    while ((inlineMatch = declaration.exec(match[2]))) {
      validateStyleDeclaration(
        inlineMatch[1],
        inlineMatch[2],
        "inline style",
      );
    }
  }
  if (/\b(?:bg|text|border|fill|stroke)-\[#/i.test(authoredMarkupHtml)) {
    failures.push("HTML contains arbitrary-value color utility classes");
  }
  if (/\b(?:fill|stroke)=["']#[0-9a-f]{3,8}["']/i.test(authoredMarkupHtml)) {
    failures.push("HTML contains a hardcoded SVG fill or stroke");
  }
}

function validatePixsoAudit(inputPath) {
  const absolutePath = path.resolve(inputPath);
  const audit = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  if (audit.schemaVersion !== 1) failures.push("Pixso audit schemaVersion must equal 1");
  const strictPixsoReuse =
    ["html-first", "visual-first"].includes(spec.workflow) &&
    spec.componentContract?.reuseStrategy === "registered-components";
  if (strictPixsoReuse) {
    const expectedLibraryPage = spec.componentContract?.libraryPage;
    if (spec.componentContract?.strictComponentParity !== true) {
      failures.push(
        "Pixso registered reuse requires strictComponentParity=true",
      );
    }
    if (expectedLibraryPage !== "NewComponents") {
      failures.push(
        "Pixso registered reuse requires componentContract.libraryPage=NewComponents",
      );
    }
    if (audit.libraryPage !== expectedLibraryPage) {
      failures.push(
        "Pixso audit libraryPage does not match page-spec componentContract.libraryPage",
      );
    }
    if (audit.libraryPhaseCompleted !== true) {
      failures.push(
        "Pixso audit must confirm the NewComponents library phase completed",
      );
    }
    if (typeof audit.targetPage !== "string" || audit.targetPage.length === 0) {
      failures.push(
        "Pixso audit targetPage is required and may be different from NewComponents",
      );
    }
    if (!Array.isArray(audit.iconCropFindings)) {
      failures.push("Pixso audit iconCropFindings must be an array");
    } else if (audit.iconCropFindings.length > 0) {
      failures.push("Pixso audit contains clipped or unverified icon geometry");
    }
    const performance = audit.performance;
    if (!performance || typeof performance !== "object") {
      failures.push("Pixso audit performance telemetry is required");
    } else {
      for (const property of [
        "pixsoCallCount",
        "slowestCallMs",
        "codeToDesignMs",
        "canonicalNodeCount",
        "retryCount",
      ]) {
        if (!Number.isFinite(performance[property]) || performance[property] < 0) {
          failures.push(
            "Pixso audit performance." + property + " must be a non-negative number",
          );
        }
      }
      if (performance.abortedByBudget === true) {
        failures.push("Pixso audit was aborted by the performance budget");
      }
    }
  }
  if (audit.activePageMismatch === true) {
    failures.push(
      "Pixso audit is blocked by activePageMismatch: open and focus the target component-library page before strict delivery",
    );
  }
  if (!/^[0-9]+:[0-9]+$/.test(audit.frameId ?? "")) {
    failures.push("Pixso audit frameId is missing or invalid");
  }
  const available = new Set(audit.availableVariables ?? []);
  const bound = new Set((audit.bindings ?? []).map((entry) => entry.variable));
  for (const token of usedTokens) {
    if (!available.has(token.pixsoVariable)) {
      failures.push(`Pixso variable is unavailable: ${token.pixsoVariable}`);
    }
    if (!bound.has(token.pixsoVariable)) {
      failures.push(`Pixso variable is not bound inside the audited Frame: ${token.pixsoVariable}`);
    }
  }
  const instances = new Set(
    (audit.componentInstances ?? []).map((entry) => entry.logicalName),
  );
  for (const component of spec.components ?? []) {
    if (!instances.has(component.logicalName)) {
      failures.push(`Pixso component is not a linked instance: ${component.logicalName}`);
    }
  }
  if (!Array.isArray(audit.literalStyleFindings)) {
    failures.push("Pixso audit literalStyleFindings must be an array");
  } else if (audit.literalStyleFindings.length > 0) {
    for (const finding of audit.literalStyleFindings) {
      failures.push(
        `Pixso hardcoded style value: ${JSON.stringify(finding)}`,
      );
    }
  }
  const coverage = audit.coverageSummary;
  if (!coverage || typeof coverage !== "object") {
    failures.push("Pixso audit coverageSummary is required");
  } else {
    const requiredCounts = [
      "uniqueNodes",
      "colorBearingNodes",
      "variableBoundColorNodes",
      "literalPaintNodes",
      "layerOpacityLiteralNodes",
      "intrinsicAlphaPaints",
    ];
    for (const property of requiredCounts) {
      if (!Number.isInteger(coverage[property]) || coverage[property] < 0) {
        failures.push(`Pixso audit coverageSummary.${property} must be a non-negative integer`);
      }
    }
    const intrinsicAlphaPaints = Number.isInteger(coverage.intrinsicAlphaPaints)
      ? coverage.intrinsicAlphaPaints
      : 0;
    const colorCoverageComplete =
      Number.isInteger(coverage.colorBearingNodes) &&
      Number.isInteger(coverage.variableBoundColorNodes) &&
      (coverage.variableBoundColorNodes === coverage.colorBearingNodes ||
        coverage.variableBoundColorNodes + intrinsicAlphaPaints ===
          coverage.colorBearingNodes);
    if (!colorCoverageComplete) {
      failures.push(
        "Pixso color coverage is incomplete: bound colors plus allowed intrinsic alpha paints must account for every color-bearing node",
      );
    }
    if (coverage.literalPaintNodes !== 0) {
      failures.push("Pixso audit still contains literal paint nodes");
    }
    if (coverage.layerOpacityLiteralNodes !== 0) {
      failures.push("Pixso audit still contains literal layer opacity nodes");
    }
  }
  for (const finding of audit.componentColorFindings ?? []) {
    warnings.push(
      `Pixso component color finding: ${finding.component ?? "unknown"} — ${finding.finding ?? JSON.stringify(finding)}`,
    );
  }
}

if (htmlPath) validateHtml(htmlPath);
if (pixsoAuditPath) validatePixsoAudit(pixsoAuditPath);

if (failures.length > 0) {
  console.error("Dual-output validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
console.log(
  `Dual-output validation passed: ${usedTokens.length} token mappings, ` +
    `${spec.components?.length ?? 0} component contracts` +
    `${htmlPath ? ", HTML checked" : ""}` +
    `${pixsoAuditPath ? ", Pixso bindings checked" : ""}.`,
);
