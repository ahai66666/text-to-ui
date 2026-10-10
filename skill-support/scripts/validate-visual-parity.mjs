import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
let manifestPath;
let htmlPath;
let pixsoPath;
let bindingPath;
for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];
  if (argument === "--manifest") manifestPath = path.resolve(args[++index]);
  else if (argument === "--html") htmlPath = path.resolve(args[++index]);
  else if (argument === "--pixso") pixsoPath = path.resolve(args[++index]);
  else if (argument === "--binding") bindingPath = path.resolve(args[++index]);
  else if (argument === "--help") {
    console.log("Usage: node scripts/validate-visual-parity.mjs --manifest <visual-parity.json> --html <browser.html> --pixso <pixso.html> [--binding <binding.html>]");
    process.exit(0);
  } else throw new Error(`Unknown argument: ${argument}`);
}
if (!manifestPath || !htmlPath || !pixsoPath) throw new Error("--manifest, --html, and --pixso are required");

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const html = await fs.readFile(htmlPath, "utf8");
const pixso = await fs.readFile(pixsoPath, "utf8");
const binding = bindingPath ? await fs.readFile(bindingPath, "utf8") : "";
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const target = manifest.browser?.targetCssViewport;
const frame = manifest.pixso?.frame;
const geometry = manifest.geometry;
const stateId = manifest.state?.id ?? manifest.stateId;
const canvasSize = `${target?.width}x${target?.height}`;

expect(target?.width === 1728 && target?.height === 1152, "target CSS viewport must be 1728x1152");
expect(frame?.width === 1728 && frame?.height === 1152, "Pixso frame must be 1728x1152");
expect(geometry?.primaryWidth === 240, "primary navigation width must be 240px");
expect(geometry?.secondaryWidth === 360, "secondary/list width must be 360px");
expect(geometry?.titlebarHeight === 64, "titlebar height must be 64px");
expect(geometry?.workspaceHeight === 1088, "workspace height must be 1088px");
expect(stateId, "manifest must define a visual state id");
for (const [name, source] of [["browser HTML", html], ["Pixso HTML", pixso]]) {
  expect(source.includes(`data-visual-state-id="${stateId}"`), `${name} is missing visual state ${stateId}`);
  expect(source.includes(`data-canvas-size="${canvasSize}"`), `${name} is missing canvas size ${canvasSize}`);
  expect(source.includes("grid-template-columns: var(--layout-sidebar-width) var(--layout-secondary-pane-width) minmax(0, 1fr)"), `${name} is missing canonical three-pane grid`);
}
expect(pixso.includes('class="mail-row is-unread is-selected"'), "Pixso import is missing the hydrated selected mail row");
expect(pixso.includes('class="meeting-card"'), "Pixso import is missing the hydrated detail card");
if (bindingPath) {
  const expected = manifest.artifacts?.bindingMarkerCount ?? 0;
  const count = [...binding.matchAll(/\bid="px-key:[^"]+"/g)].length;
  expect(count >= expected, `binding HTML has ${count} Pixso markers; expected at least ${expected}`);
}
if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  stateId,
  cssViewport: target,
  frame,
  geometry,
  calibratedViewport: manifest.browser?.calibratedPhysicalViewport ?? null,
  bindingMarkerCount: bindingPath ? [...binding.matchAll(/\bid="px-key:[^"]+"/g)].length : null
}, null, 2));
