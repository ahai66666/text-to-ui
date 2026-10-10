#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";

export const PAGE_CONTRACT_SCHEMA_VERSION = 1;
export const PAGE_SPEC_HASH_ALGORITHM = "sha256";

const validScopes = new Set([
  "source",
  "rendered-markup",
  "runtime-source",
  "visible-text",
]);

const validAssertionKinds = new Set([
  "selector-count",
  "text-present",
  "pattern-present",
  "attribute-present",
  "attribute-equals",
]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneWithoutProvenance(pageSpec) {
  const copy = JSON.parse(JSON.stringify(pageSpec));
  delete copy.provenance;
  return copy;
}

function sortForHash(value) {
  if (Array.isArray(value)) return value.map(sortForHash);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortForHash(value[key])]),
  );
}

export function stableStringify(value) {
  return JSON.stringify(sortForHash(value));
}

export function pageSpecSha256(pageSpec) {
  return crypto
    .createHash(PAGE_SPEC_HASH_ALGORITHM)
    .update(stableStringify(cloneWithoutProvenance(pageSpec)), "utf8")
    .digest("hex");
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function validateCheck(check, pathLabel, { allowEmpty = false } = {}) {
  const failures = [];
  if (!isRecord(check)) {
    failures.push(`${pathLabel} must be an object`);
    return failures;
  }
  if (!check.id || typeof check.id !== "string") {
    failures.push(`${pathLabel}.id is required`);
  }
  if (!check.description || typeof check.description !== "string") {
    failures.push(`${pathLabel}.description is required`);
  }
  const scope = check.scope ?? "source";
  if (!validScopes.has(scope)) {
    failures.push(`${pathLabel}.scope must be one of ${[...validScopes].join(", ")}`);
  }

  const assertion = check.assertion ?? check;
  if (!isRecord(assertion)) {
    failures.push(`${pathLabel}.assertion must be an object`);
    return failures;
  }
  const kind = assertion.kind;
  if (!kind || typeof kind !== "string") {
    failures.push(`${pathLabel}.assertion.kind is required`);
  } else if (!validAssertionKinds.has(kind)) {
    failures.push(
      `${pathLabel}.assertion.kind must be one of ${[
        ...validAssertionKinds,
      ].join(", ")}`,
    );
  }

  if (kind === "selector-count") {
    if (!assertion.selector || typeof assertion.selector !== "string") {
      failures.push(`${pathLabel}.assertion.selector is required`);
    }
    if (assertion.min === undefined && assertion.max === undefined) {
      failures.push(`${pathLabel}.assertion.min or max is required`);
    }
    for (const bound of ["min", "max"]) {
      if (assertion[bound] !== undefined &&
          (!Number.isInteger(assertion[bound]) || assertion[bound] < 0)) {
        failures.push(`${pathLabel}.assertion.${bound} must be a non-negative integer`);
      }
    }
  }

  if (kind === "text-present" && typeof assertion.text !== "string") {
    failures.push(`${pathLabel}.assertion.text is required`);
  }

  if (kind === "pattern-present" && !hasPatterns(assertion)) {
    failures.push(`${pathLabel}.assertion.patterns or regexPatterns is required`);
  }

  if (kind === "attribute-present" || kind === "attribute-equals") {
    if (!assertion.selector || typeof assertion.selector !== "string") {
      failures.push(`${pathLabel}.assertion.selector is required`);
    }
    if (!assertion.attribute || typeof assertion.attribute !== "string") {
      failures.push(`${pathLabel}.assertion.attribute is required`);
    }
  }
  if (kind === "attribute-equals" && typeof assertion.value !== "string") {
    failures.push(`${pathLabel}.assertion.value is required`);
  }

  if (allowEmpty && Object.keys(assertion).length === 0) {
    return [];
  }
  return failures;
}

function hasPatterns(value) {
  return (
    (Array.isArray(value.patterns) && value.patterns.length > 0) ||
    (Array.isArray(value.regexPatterns) && value.regexPatterns.length > 0)
  );
}

function validateNegativeCheck(check, pathLabel) {
  const failures = validateCheck(check, pathLabel);
  if (!isRecord(check)) return failures;
  const assertion = check.assertion ?? check;
  if (
    assertion.kind !== "selector-count" &&
    assertion.kind !== "attribute-present" &&
    assertion.kind !== "attribute-equals" &&
    !hasPatterns(assertion) &&
    typeof assertion.text !== "string"
  ) {
    failures.push(
      `${pathLabel}.assertion must define a selector, text, or pattern to forbid`,
    );
  }
  return failures;
}

export function validateConstraintContract(contract) {
  const failures = [];
  if (!isRecord(contract)) return ["constraintContract is required"];
  if (contract.schemaVersion !== PAGE_CONTRACT_SCHEMA_VERSION) {
    failures.push(
      `constraintContract.schemaVersion must equal ${PAGE_CONTRACT_SCHEMA_VERSION}`,
    );
  }
  if (contract.mode !== "block-on-failure") {
    failures.push("constraintContract.mode must be block-on-failure");
  }
  if (!Array.isArray(contract.must)) {
    failures.push("constraintContract.must must be an array");
  } else {
    contract.must.forEach((check, index) => {
      failures.push(...validateCheck(check, `constraintContract.must[${index}]`));
    });
  }
  if (!Array.isArray(contract.mustNot)) {
    failures.push("constraintContract.mustNot must be an array");
  } else {
    contract.mustNot.forEach((check, index) => {
      failures.push(
        ...validateNegativeCheck(check, `constraintContract.mustNot[${index}]`),
      );
    });
  }

  const acceptance = contract.acceptance;
  if (!isRecord(acceptance)) {
    failures.push("constraintContract.acceptance is required");
  } else {
    for (const key of ["requiredStates", "requiredInteractions", "requiredArtifacts"]) {
      if (!Array.isArray(acceptance[key])) {
        failures.push(`constraintContract.acceptance.${key} must be an array`);
      }
    }
    for (const [index, state] of (acceptance.requiredStates ?? []).entries()) {
      failures.push(...validateCheck(state, `constraintContract.acceptance.requiredStates[${index}]`));
    }
    for (const [index, interaction] of (acceptance.requiredInteractions ?? []).entries()) {
      failures.push(
        ...validateCheck(
          interaction,
          `constraintContract.acceptance.requiredInteractions[${index}]`,
        ),
      );
    }
    for (const [index, artifact] of (acceptance.requiredArtifacts ?? []).entries()) {
      if (!isRecord(artifact)) {
        failures.push(`constraintContract.acceptance.requiredArtifacts[${index}] must be an object`);
        continue;
      }
      if (!artifact.id || typeof artifact.id !== "string") {
        failures.push(`constraintContract.acceptance.requiredArtifacts[${index}].id is required`);
      }
      if (!artifact.kind || typeof artifact.kind !== "string") {
        failures.push(`constraintContract.acceptance.requiredArtifacts[${index}].kind is required`);
      }
    }
  }
  return failures;
}

export function validatePageProvenance(provenance, pageSpec) {
  const failures = [];
  if (!isRecord(provenance)) return ["page-spec provenance is required"];
  if (!provenance.runId || typeof provenance.runId !== "string") {
    failures.push("provenance.runId is required");
  }
  if (provenance.hashAlgorithm !== PAGE_SPEC_HASH_ALGORITHM) {
    failures.push(`provenance.hashAlgorithm must be ${PAGE_SPEC_HASH_ALGORITHM}`);
  }
  const expected = pageSpecSha256(pageSpec);
  if (provenance.pageSpecSha256 !== expected) {
    failures.push(
      `provenance.pageSpecSha256 does not match canonical page spec: expected ${expected}`,
    );
  }
  return failures;
}

