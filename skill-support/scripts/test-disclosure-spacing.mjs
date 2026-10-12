#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";

const read = (relativeUrl) => fs.readFileSync(new URL(relativeUrl, import.meta.url), "utf8");
const css = read("../../packages/component-styles/src/index.css");
const design = read("../assets/design-system/design.md");
const composition = read("../references/components/page-composition.md");
const specs = read("../references/component-specs-extended.md");
const layout = read("../references/harmonyos-layout-patterns.md");
const contracts = JSON.parse(read("../../packages/component-contracts/src/components.json"));

const rule = (selector) => {
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, `Missing CSS rule: ${selector}`);
  const end = css.indexOf("}", start);
  assert.notEqual(end, -1, `Unclosed CSS rule: ${selector}`);
  return css.slice(start, end + 1);
};

assert.match(rule(".tui-sidebar-groups {"), /gap:\s*var\(--space-5\)/);
assert.match(rule(".tui-disclosure-group {"), /gap:\s*var\(--space-5\)/);
assert.match(rule(".tui-disclosure {"), /gap:\s*var\(--space-1\)/);
assert.match(rule(".tui-disclosure__trigger {"), /color:\s*var\(--color-text-muted\)/);

for (const logicalName of ["Accordion/Default", "Collapsible/Default"]) {
  const component = contracts.components.find((entry) => entry.logicalName === logicalName);
  assert.ok(component, `Missing disclosure component contract: ${logicalName}`);
  assert.ok(component.tokenRoles.includes("color.text-muted"), `${logicalName} must declare the secondary text color token`);
  assert.ok(!component.tokenRoles.includes("color.text"), `${logicalName} must not declare primary text color for its disclosure trigger`);
}

assert.match(design, /canonical `tui-disclosure-group` class[\s\S]{0,180}--space-5` \(16px\)/);
assert.match(design, /Independent Collapsible navigation groups[\s\S]{0,180}--space-5` \(16px\)/);
assert.match(design, /Accordion triggers[^\n]*label and chevron both use secondary text color `--color-text-muted`/);
assert.match(design, /Collapsible triggers[^\n]*label and chevron both use secondary text color `--color-text-muted`/);
assert.match(specs, /Accordion[^\n]*Trigger label and chevron use secondary text color `--color-text-muted`/);
assert.match(specs, /Collapsible[^\n]*Label and chevron use secondary text color `--color-text-muted`/);
assert.match(composition, /tui-disclosure-group[\s\S]{0,180}--space-5` \(16px\)/);
assert.match(specs, /Accordion[\s\S]{0,260}tui-disclosure-group[\s\S]{0,100}--space-5/);
assert.match(layout, /heading-to-route-list gap uses `--space-1` \(2px\); adjacent independent groups use the parent-owned `--space-5` \(16px\) gap/);

console.log("Disclosure checks passed: trigger label/icon use secondary text color; group gaps use 16px and internal disclosure spacing remains 2px.");
