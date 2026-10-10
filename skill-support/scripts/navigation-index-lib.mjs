import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const markerFiles = [
  'pnpm-workspace.yaml',
  'packages/component-contracts/src/components.json',
  'packages/tokens/src/token-runtime-map.json'
];

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    let value = true;
    if (next && !next.startsWith('--')) { value = next; index += 1; }
    if (Object.hasOwn(args, key)) args[key] = (Array.isArray(args[key]) ? args[key] : [args[key]]).concat(value);
    else args[key] = value;
  }
  return args;
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export function isMonorepoRoot(candidate) {
  return markerFiles.every((relative) => fs.existsSync(path.join(candidate, relative)));
}

function ancestors(start) {
  const values = [];
  let current = path.resolve(start);
  while (true) {
    values.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return values;
}

function scanForRoot(base, maxDepth = 3) {
  if (!base || !fs.existsSync(base)) return null;
  const queue = [{ directory: path.resolve(base), depth: 0 }];
  const skipped = new Set(['node_modules', '.git', '.pnpm-store', 'Library', '.Trash']);
  while (queue.length) {
    const { directory, depth } = queue.shift();
    if (isMonorepoRoot(directory)) return directory;
    if (depth >= maxDepth) continue;
    let entries = [];
    try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (!entry.isDirectory() || skipped.has(entry.name) || entry.name.startsWith('.')) continue;
      queue.push({ directory: path.join(directory, entry.name), depth: depth + 1 });
    }
  }
  return null;
}

export function locateMonorepo({ start = process.cwd(), explicitRepo } = {}) {
  const attempted = [];
  const direct = [explicitRepo, process.env.TEXT_TO_UI_MONOREPO].filter(Boolean);
  for (const candidate of direct) {
    const absolute = path.resolve(candidate);
    attempted.push(absolute);
    if (isMonorepoRoot(absolute)) return { root: absolute, strategy: 'explicit', attempted };
  }
  for (const candidate of ancestors(start)) {
    attempted.push(candidate);
    if (isMonorepoRoot(candidate)) return { root: candidate, strategy: 'ancestor', attempted };
  }
  const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  attempted.push(scriptRoot);
  if (isMonorepoRoot(scriptRoot)) return { root: scriptRoot, strategy: 'skill-source', attempted };
  const home = process.env.HOME;
  const boundedRoots = [path.dirname(path.resolve(start)), home && path.join(home, 'Documents'), home && path.join(home, 'Desktop', '资源管理', '我的代码仓')].filter(Boolean);
  for (const base of [...new Set(boundedRoots)]) {
    attempted.push(`${base} (depth<=3)`);
    const found = scanForRoot(base, 3);
    if (found) return { root: found, strategy: 'bounded-scan', attempted };
  }
  return { root: null, strategy: 'not-found', attempted };
}

export function resolveSkillRoot(repo, explicitSkillRoot) {
  const root = explicitSkillRoot ? path.resolve(repo, explicitSkillRoot) : path.join(repo, 'skill-support');
  if (!fs.existsSync(path.join(root, 'references', 'routes', 'index.json')) ||
      !fs.existsSync(path.join(repo, 'SKILL.md'))) {
    throw new Error(`Text-to-UI rules or repository Skill entry not found: ${root}`);
  }
  return root;
}

export function generatedIndexDir(skillRoot) {
  return path.join(skillRoot, 'references', 'index', 'generated');
}

export function loadIndexes(skillRoot) {
  const directory = generatedIndexDir(skillRoot);
  const names = ['task-router', 'layout-index', 'component-index', 'token-index', 'validation-index', 'workflow-route-index', 'route-material-index'];
  return Object.fromEntries(names.map((name) => [name, readJson(path.join(directory, `${name}.json`))]));
}

export function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

export function findComponent(index, capability) {
  const wanted = capability.toLowerCase();
  return index.components.find((item) => item.capabilities.some((candidate) => candidate.toLowerCase() === wanted)) || null;
}

export function print(value, pretty = true) {
  process.stdout.write(pretty ? stableJson(value) : `${JSON.stringify(value)}\n`);
}
