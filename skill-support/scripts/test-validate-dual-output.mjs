#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const validator = path.join(scriptDir, "validate-dual-output.mjs");
const fixtureDir = mkdtempSync(path.join(tmpdir(), "text-to-ui-dual-output-"));

function writeJson(name, value) {
  const output = path.join(fixtureDir, name);
  writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`);
  return output;
}

function writeText(name, value) {
  const output = path.join(fixtureDir, name);
  writeFileSync(output, value);
  return output;
}

function run(args) {
  return spawnSync(process.execPath, [validator, ...args], {
    encoding: "utf8",
  });
}

const pageSpec = {
  schemaVersion: 1,
  workflow: "html-first",
  viewport: { width: 1728, height: 1152 },
  shell: { pattern: "three-column-desktop" },
  tokenContract: {
    map: "assets/design-system/dual-output-token-map.json",
    webStrategy: "css-custom-properties",
    pixsoStrategy: "variable-bindings",
    forbidHardcodedStyleValues: true,
    usedTokens: [
      {
        role: "text-primary",
        sourceToken: "text-primary",
        webCssVariable: "--color-text",
        pixsoVariable: "neutral-dark/90",
      },
    ],
    webCoverage: [
      {
        selector: '[data-component="navigation-item"]',
        property: "color",
        webCssVariable: "--color-text",
      },
    ],
  },
  layoutTokens: ["layout/width/1728"],
  components: [],
};

const validHtml = `<!doctype html>
<html>
  <head>
    <style data-token-audit="vendor">.text-slate-900{color:#0f172a}</style>
    <style data-token-audit="page">
      :root { --color-text: #000000e5; }
      [data-component="navigation-item"] { color: var(--color-text); }
    </style>
  </head>
  <body>
    <nav class="text-slate-900" data-component="navigation-item">Inbox</nav>
    <script data-token-audit="vendor">window.__compiled = true;</script>
  </body>
</html>
`;

const validAudit = {
  schemaVersion: 1,
  frameId: "1:1",
  availableVariables: ["neutral-dark/90"],
  bindings: [
    {
      nodeId: "1:2",
      property: "fillPaints",
      variable: "neutral-dark/90",
    },
  ],
  coverageSummary: {
    uniqueNodes: 2,
    colorBearingNodes: 1,
    variableBoundColorNodes: 1,
    literalPaintNodes: 0,
    layerOpacityLiteralNodes: 0,
    intrinsicAlphaPaints: 1,
  },
  componentInstances: [],
  literalStyleFindings: [],
};

try {
  const specPath = writeJson("page-spec.json", pageSpec);
  const validHtmlPath = writeText("valid.html", validHtml);
  const validAuditPath = writeJson("valid-audit.json", validAudit);

  const positive = run([
    "--page-spec",
    specPath,
    "--html",
    validHtmlPath,
    "--pixso-audit",
    validAuditPath,
  ]);
  assert.equal(
    positive.status,
    0,
    `positive fixture failed:\n${positive.stderr}${positive.stdout}`,
  );

  const mismatchAuditPath = writeJson("active-page-mismatch-audit.json", {
    ...validAudit,
    activePageMismatch: true,
  });
  const activePageMismatch = run([
    "--page-spec",
    specPath,
    "--pixso-audit",
    mismatchAuditPath,
  ]);
  assert.notEqual(activePageMismatch.status, 0);
  assert.match(
    `${activePageMismatch.stderr}${activePageMismatch.stdout}`,
    /activePageMismatch/,
  );

  const strictPageSpec = {
    ...pageSpec,
    schemaVersion: 2,
    componentContract: {
      adapterMap: "assets/design-system/framework-component-adapter-map.json",
      targetFramework: "react",
      sourceAvailability: "source",
      reuseStrategy: "registered-components",
      strictComponentParity: true,
      libraryPage: "NewComponents",
    },
  };
  const strictSpecPath = writeJson("strict-page-spec.json", strictPageSpec);
  const strictAudit = {
    ...validAudit,
    libraryPage: "NewComponents",
    targetPage: "Coremail",
    libraryPhaseCompleted: true,
    iconCropFindings: [],
    performance: {
      pixsoCallCount: 8,
      slowestCallMs: 120,
      codeToDesignMs: 80,
      canonicalNodeCount: 20,
      retryCount: 0,
      abortedByBudget: false,
    },
  };
  const strictAuditPath = writeJson("strict-audit.json", strictAudit);
  const strictPositive = run([
    "--page-spec",
    strictSpecPath,
    "--pixso-audit",
    strictAuditPath,
  ]);
  assert.equal(
    strictPositive.status,
    0,
    "strict Pixso fixture failed:\n" +
      strictPositive.stderr +
      strictPositive.stdout,
  );
  const clippedAuditPath = writeJson("clipped-audit.json", {
    ...strictAudit,
    iconCropFindings: [{ nodeId: "1:3", reason: "clipped" }],
  });
  const clipped = run([
    "--page-spec",
    strictSpecPath,
    "--pixso-audit",
    clippedAuditPath,
  ]);
  assert.notEqual(clipped.status, 0);
  assert.match(
    clipped.stderr + clipped.stdout,
    /clipped or unverified icon geometry/,
  );

  const linkedCssPath = writeText(
    "linked.css",
    `:root { --color-text: #000000e5; }\n` +
      `[data-component="navigation-item"] { color: var(--color-text); }\n`,
  );
  const linkedHtmlPath = writeText(
    "linked.html",
    `<!doctype html><html><head>` +
      `<link rel="stylesheet" href="./${path.basename(linkedCssPath)}">` +
      `</head><body><nav data-component="navigation-item">Inbox</nav>` +
      `</body></html>`,
  );
  const linkedStylesheet = run([
    "--page-spec",
    specPath,
    "--html",
    linkedHtmlPath,
  ]);
  assert.equal(
    linkedStylesheet.status,
    0,
    `linked stylesheet fixture failed:\n` +
      `${linkedStylesheet.stderr}${linkedStylesheet.stdout}`,
  );

  const vueScopedPath = writeText(
    "vue-scoped.html",
    validHtml.replace(
      '[data-component="navigation-item"] { color: var(--color-text); }',
      '[data-component="navigation-item"][data-v-a1b2c3] ' +
        "{ color: var(--color-text); }",
    ).replace(
      '<nav data-component="navigation-item">',
      '<nav data-component="navigation-item" data-v-a1b2c3>',
    ),
  );
  const vueScoped = run([
    "--page-spec",
    specPath,
    "--html",
    vueScopedPath,
  ]);
  assert.equal(
    vueScoped.status,
    0,
    `Vue scoped fixture failed:\n${vueScoped.stderr}${vueScoped.stdout}`,
  );

  const vueCssModulesPath = writeText(
    "vue-css-modules.html",
    validHtml.replace(
      '[data-component="navigation-item"] { color: var(--color-text); }',
      '.navigationItem_a91f[data-component="navigation-item"] ' +
        "{ color: var(--color-text); }",
    ),
  );
  const vueCssModules = run([
    "--page-spec",
    specPath,
    "--html",
    vueCssModulesPath,
  ]);
  assert.equal(
    vueCssModules.status,
    0,
    `Vue CSS Modules fixture failed:\n` +
      `${vueCssModules.stderr}${vueCssModules.stdout}`,
  );

  const vueWrongTargetPath = writeText(
    "vue-wrong-target.html",
    validHtml.replace(
      '[data-component="navigation-item"] { color: var(--color-text); }',
      '[data-component="navigation-item"][data-v-a1b2c3] .child ' +
        "{ color: var(--color-text); }",
    ),
  );
  const vueWrongTarget = run([
    "--page-spec",
    specPath,
    "--html",
    vueWrongTargetPath,
  ]);
  assert.notEqual(vueWrongTarget.status, 0);
  assert.match(
    `${vueWrongTarget.stderr}${vueWrongTarget.stdout}`,
    /Missing web Token coverage/,
  );

  const missingCoveragePath = writeText(
    "missing-web-coverage.html",
    validHtml.replace(
      '[data-component="navigation-item"] { color: var(--color-text); }',
      '[data-component="other-item"] { color: var(--color-text); }',
    ),
  );
  const missingCoverage = run([
    "--page-spec",
    specPath,
    "--html",
    missingCoveragePath,
  ]);
  assert.notEqual(missingCoverage.status, 0);
  assert.match(
    `${missingCoverage.stderr}${missingCoverage.stdout}`,
    /Missing web Token coverage/,
  );

  const unstableBoundarySpecPath = writeJson("unstable-boundary-spec.json", {
    ...pageSpec,
    tokenContract: {
      ...pageSpec.tokenContract,
      webCoverage: [
        {
          selector: ".text-slate-900",
          property: "color",
          webCssVariable: "--color-text",
        },
      ],
    },
  });
  const unstableBoundaryHtmlPath = writeText(
    "unstable-boundary.html",
    validHtml.replace(
      '[data-component="navigation-item"] { color: var(--color-text); }',
      ".text-slate-900 { color: var(--color-text); }",
    ),
  );
  const unstableBoundary = run([
    "--page-spec",
    unstableBoundarySpecPath,
    "--html",
    unstableBoundaryHtmlPath,
  ]);
  assert.notEqual(unstableBoundary.status, 0);
  assert.match(
    `${unstableBoundary.stderr}${unstableBoundary.stdout}`,
    /lacks a stable data boundary/,
  );

  const unclassifiedVariablePath = writeText(
    "unclassified-variable.html",
    validHtml.replace(
      '[data-component="navigation-item"] { color: var(--color-text); }',
      '[data-component="navigation-item"] { color: var(--color-text); ' +
        "box-shadow: var(--shadow-unmapped); }",
    ).replace(
      ":root { --color-text: #000000e5; }",
      ":root { --color-text: #000000e5; --shadow-unmapped: none; }",
    ),
  );
  const unclassifiedVariable = run([
    "--page-spec",
    specPath,
    "--html",
    unclassifiedVariablePath,
  ]);
  assert.notEqual(unclassifiedVariable.status, 0);
  assert.match(
    `${unclassifiedVariable.stderr}${unclassifiedVariable.stdout}`,
    /has no Token, Style, or Web-only contract/,
  );

  const hardcodedColorPath = writeText(
    "hardcoded-color.html",
    validHtml.replace(
      '[data-component="navigation-item"] { color: var(--color-text); }',
      '[data-component="navigation-item"] { color: #111827; }\n' +
        ".token-probe { color: var(--color-text); }",
    ),
  );
  const hardcodedColor = run([
    "--page-spec",
    specPath,
    "--html",
    hardcodedColorPath,
  ]);
  assert.notEqual(hardcodedColor.status, 0);
  assert.match(
    `${hardcodedColor.stderr}${hardcodedColor.stdout}`,
    /Hardcoded CSS color/,
  );

  const literalAuditPath = writeJson("literal-audit.json", {
    ...validAudit,
    coverageSummary: {
      ...validAudit.coverageSummary,
      literalPaintNodes: 1,
    },
  });
  const literalAudit = run([
    "--page-spec",
    specPath,
    "--pixso-audit",
    literalAuditPath,
  ]);
  assert.notEqual(literalAudit.status, 0);
  assert.match(
    `${literalAudit.stderr}${literalAudit.stdout}`,
    /literal paint nodes/,
  );

  console.log(
    "Dual-output validator tests passed: React compiled boundary mapping, Vue scoped CSS, Vue CSS Modules, unstable-boundary rejection, unclassified-variable rejection, missing Web coverage, hardcoded Web color, and Pixso literal-paint rejection.",
  );
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
}
