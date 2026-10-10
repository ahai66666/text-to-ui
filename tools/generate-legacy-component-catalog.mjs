#!/usr/bin/env node

/**
 * Build the package's visual catalog from the already approved Skill gallery.
 * The old Skill preview is the canonical client implementation; this file
 * deliberately copies its markup instead of inventing a second visual system.
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourcePath = path.join(root, "text-to-ui/preview/component-gallery.html");
const outputPath = path.join(root, "packages/component-contracts/src/legacy-catalog.generated.js");
const source = await fs.readFile(sourcePath, "utf8");

const sectionIds = [
  "titlebars",
  "buttons",
  "fields",
  "choices",
  "navigation",
  "data-display",
  "disclosure",
  "overlays",
  "form-plus",
  "loading-data",
  "specialized",
  "feedback"
];

const sectionStart = (id) => source.indexOf(`<section class="section" id="${id}">`);
const nextSection = (start) => {
  const match = source.slice(start + 1).match(/\n\s{8}<section class="section" id="/);
  return match ? start + 1 + match.index : source.indexOf("\n</main>", start);
};

const sections = sectionIds.map((id) => {
  const start = sectionStart(id);
  if (start < 0) throw new Error(`Missing canonical Skill section: ${id}`);
  const end = nextSection(start);
  if (end < 0) throw new Error(`Could not find end of canonical Skill section: ${id}`);
  return source.slice(start, end).trim();
});

const spriteStart = source.indexOf('<svg class="hmos-sprite"');
const spriteEnd = source.indexOf("</svg>", spriteStart);
if (spriteStart < 0 || spriteEnd < 0) throw new Error("Missing canonical HarmonyOS SVG sprite");
const sprite = source.slice(spriteStart, spriteEnd + "</svg>".length);

const markup = `${sprite}\n${sections.join("\n")}`;
const componentNames = [
  "Accordion", "Alert", "Alert Dialog", "Attachment", "Avatar", "Badge", "Breadcrumb", "Button", "Calendar", "Card", "Carousel", "Chart", "Checkbox", "Collapsible", "Combobox", "Context Menu", "Data Table", "Date Picker", "Time Picker", "Dialog", "Dropdown Menu", "Empty", "Field", "Hover Card", "Input", "Input OTP", "Item", "Kbd", "Label", "Menubar", "Native Select", "Pagination", "Popover", "Progress", "Radio Group", "Select", "Sidebar", "Skeleton", "Slider", "Spinner", "Switch", "Table", "Tabs", "Textarea", "Toast", "Toggle", "Tooltip", "Semi-modal"
];

const output = `// Generated from text-to-ui/preview/component-gallery.html. Do not edit by hand.\n// Regenerate with: node tools/generate-legacy-component-catalog.mjs\nexport const legacyCatalogComponentNames = Object.freeze(${JSON.stringify(componentNames, null, 2)});\nexport const legacyCatalogSectionIds = Object.freeze(${JSON.stringify(sectionIds, null, 2)});\nexport const legacyCatalogMarkup = ${JSON.stringify(markup)};\n`;
await fs.writeFile(outputPath, output);
console.log(`Generated ${path.relative(root, outputPath)} from ${sectionIds.length} canonical sections (${markup.length} characters).`);
