import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tui-component-reuse-"));
const root = path.join(temp, "repo");
fs.mkdirSync(path.join(root, "packages/component-contracts/src"), { recursive: true });
fs.mkdirSync(path.join(root, "apps/example/src"), { recursive: true });
fs.writeFileSync(path.join(root, "packages/component-contracts/src/components.json"), JSON.stringify([{ logicalName: "Button/Primary/Default", implementations: { html: "packages/components-html/src/index.js#button" }, readiness: { sourceReady: true, contractReady: true, visualParity: false, behaviorParity: false, accessibilityParity: false, tokenParity: true } }]));
const validator = path.resolve("skill-support/scripts/validate-web-component-reuse.mjs");
const manifestPath = path.join(root, "component-usage.json");
const manifest = { schemaVersion: 1, targetFramework: "html", registry: "packages/component-contracts/src/components.json", sourceRoots: ["apps/example/src"], registered: [{ logicalName: "Button/Primary/Default", usage: "primary action" }], contractBased: [], custom: [], previousOutputReuse: false };
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
const skillRoot = path.resolve("skill-support");
const run = (stage = "fast-preview") => spawnSync(process.execPath, [validator, "--manifest", manifestPath, "--project-root", root, "--skill-root", skillRoot, "--stage", stage], { encoding: "utf8" });

fs.writeFileSync(path.join(root, "apps/example/src/main.js"), 'document.body.innerHTML = `<button data-component="button">保存</button>`;');
const lookalike = run();
assert.notEqual(lookalike.status, 0, "lookalike markup without package import must fail");
assert.match(lookalike.stderr, /must import @text-to-ui\/components-html/);

fs.writeFileSync(path.join(root, "apps/example/src/main.js"), '// import from @text-to-ui/components-html\ndocument.body.innerHTML = "not reusable";');
const commentOnly = run();
assert.notEqual(commentOnly.status, 0, "a package name in a comment must not prove reuse");

fs.writeFileSync(path.join(root, "apps/example/src/main.js"), 'import { renderHtmlComponent } from "@text-to-ui/components-html";\ndocument.body.innerHTML = renderHtmlComponent("button");');
const reused = run();
assert.equal(reused.status, 0, reused.stderr);
assert.match(reused.stdout, /"ok": true/);
const releaseBlocked = run("release");
assert.notEqual(releaseBlocked.status, 0, "provisional components must not pass release validation");
assert.match(releaseBlocked.stderr, /not allowed at release/);
fs.writeFileSync(path.join(root, "packages/component-contracts/src/components.json"), JSON.stringify([{ logicalName: "Button/Primary/Default", implementations: { html: "packages/components-html/src/index.js#button" }, readiness: { sourceReady: true, contractReady: true, visualParity: true, behaviorParity: true, accessibilityParity: true, tokenParity: true } }]));
const releaseApproved = run("release");
assert.equal(releaseApproved.status, 0, releaseApproved.stderr);
assert.match(releaseApproved.stdout, /"deliveryStatus": "release-ready"/);

manifest.registered = [];
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
const noComponents = run();
assert.notEqual(noComponents.status, 0, "a page without any source classification must fail");

manifest.contractBased = [{ id: "contract-button", missingCapability: "special button", registryQueries: ["button"], reviewedCandidates: [{ logicalName: "Button/Primary/Default", rejectionReason: "required slot is not implemented" }], tokenRoles: ["color.primary", "size.button"], disposition: "promote-to-library", contractLogicalName: "Button/Primary/Default", contractEvidence: "canonicalSelector and default specimen" }];
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
fs.writeFileSync(path.join(root, "apps/example/src/main.js"), 'import "@text-to-ui/tokens";\nimport "@text-to-ui/component-styles";\ndocument.body.innerHTML = "contract adaptation";');
const contractAdaptation = run();
assert.equal(contractAdaptation.status, 0, contractAdaptation.stderr);

manifest.contractBased = [];
manifest.custom = [{ id: "custom-canvas", missingCapability: "domain canvas", registryQueries: ["canvas", "editor"], reviewedCandidates: [], contractQueries: ["canonical component registry: canvas", "component specs: editor"], tokenRoles: ["color.surface", "spacing.component-gap"], disposition: "page-owned", exceptionKind: "specialized-business-surface" }];
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
const customWithTokens = run();
assert.equal(customWithTokens.status, 0, customWithTokens.stderr);

manifest.custom = [{ ...manifest.custom[0], id: "custom-button", registryQueries: ["button"] }];
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
const overlappingCustom = run();
assert.notEqual(overlappingCustom.status, 0, "custom UI must not replace an available registered component");
assert.match(overlappingCustom.stderr, /overlaps available html component/);

fs.writeFileSync(path.join(root, "apps/example/src/main.js"), 'document.body.innerHTML = "custom without shared tokens";');
const customWithoutTokens = run();
assert.notEqual(customWithoutTokens.status, 0, "custom source without shared Tokens and styles must fail");

fs.rmSync(temp, { recursive: true, force: true });
console.log("Web component reuse validator tests passed.");
