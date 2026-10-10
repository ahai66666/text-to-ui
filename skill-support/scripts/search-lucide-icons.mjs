import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const iconDirectory = resolve(root, "node_modules/lucide/dist/esm/icons");
const query = process.argv
  .slice(2)
  .filter((argument) => argument !== "--")
  .join(" ")
  .trim()
  .toLowerCase();

if (!query) {
  console.error("Usage: pnpm icons:search -- <English concept>");
  process.exit(1);
}

let files;
try {
  files = await readdir(iconDirectory);
} catch {
  console.error("Lucide is not installed. Run: pnpm install");
  process.exit(1);
}

const terms = query.split(/\s+/).filter(Boolean);
const matches = files
  .filter((file) => file.endsWith(".mjs"))
  .map((file) => file.slice(0, -4))
  .filter((name) => terms.every((term) => name.includes(term)))
  .sort((a, b) => a.localeCompare(b));

if (matches.length === 0) {
  console.log(`No Lucide icon filenames matched: ${query}`);
  process.exit(0);
}

console.log(matches.join("\n"));
