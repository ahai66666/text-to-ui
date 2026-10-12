import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

const registry = readJson("assets/design-system/pixso-component-registry.json");
const adapter = readJson(
  "assets/design-system/harmonyos-component-adapter-map.json",
);

const adapterByTarget = new Map(
  adapter.adapters.map((entry) => [entry.target, entry]),
);

const rows = [];
for (const [category, targets] of Object.entries(registry.categories)) {
  for (const target of targets) {
    const mapping = adapterByTarget.get(target);
    const status = !mapping
      ? "missing-target"
      : mapping.takeoverStatus === "verified"
        ? "verified"
        : mapping.takeoverStatus === "needs-rebuild"
          ? "mapped-needs-rebuild"
          : "mapped-pending-verification";

    rows.push({
      category,
      target,
      status,
      sourceComponentSet: mapping?.source?.componentSet ?? null,
      sourceVariant: mapping?.source?.variant ?? null,
      sourceVariantAliases: mapping?.sourceVariantAliases ?? [],
      reuse: mapping?.reuse ?? null,
      strictEligible: status === "verified",
      nextAction:
        status === "verified"
          ? "Use as a linked instance and audit the page binding."
          : status === "mapped-needs-rebuild"
            ? "Rebuild the registered target from the mapped native source, then pass Token, icon, text-slot, layout, and linked-instance gates."
            : status === "mapped-pending-verification"
              ? "Finish the registered target and verify it live in Pixso before strict delivery."
              : "Add a source mapping or draw a new registered target, then verify it live in Pixso.",
    });
  }
}

const counts = rows.reduce(
  (summary, row) => {
    summary[row.status] = (summary[row.status] ?? 0) + 1;
    return summary;
  },
  { total: rows.length },
);

const jsonOutput = `${JSON.stringify(
  {
    schemaVersion: 1,
    sourceLibrary: adapter.sourceLibrary,
    targetLibrary: adapter.targetLibrary,
    registry: "assets/design-system/pixso-component-registry.json",
    adapterMap: "assets/design-system/harmonyos-component-adapter-map.json",
    policy: {
      partialMappingAllowed: true,
      mappedDoesNotMeanVerified: true,
      strictParityRequiresEveryUsedTargetVerified: true,
    },
    summary: counts,
    rows,
    sourceOnly: adapter.sourceOnly,
  },
  null,
  2,
)}\n`;

const escapeCell = (value) => String(value ?? "").replaceAll("|", "\\|");
const variantLabel = (variant, aliases = []) => {
  const primary = variant
    ? Object.entries(variant)
        .map(([key, value]) => `${key}=${value}`)
        .join(", ")
    : "";
  const aliasLabels = aliases.map(
    (alias) =>
      `${alias.componentSet}: ${Object.entries(alias.variant ?? {})
        .map(([key, value]) => `${key}=${value}`)
        .join(", ")}`,
  );
  return [primary, ...aliasLabels.map((label) => `alias ${label}`)]
    .filter(Boolean)
    .join("; ");
};

const markdownLines = [
  "# HarmonyOS 源组件 → Text-to-UI 注册组件全量映射表",
  "",
  "> 该表由 `scripts/build-harmonyos-component-mapping-table.mjs` 生成。映射成功只表示已找到源组件；只有 `verified` 才能进入严格交付。",
  "",
  `- 注册组件：${counts.total}`,
  `- 已映射待验证：${counts["mapped-pending-verification"] ?? 0}`,
  `- 已映射需重建：${counts["mapped-needs-rebuild"] ?? 0}`,
  `- 已验证：${counts.verified ?? 0}`,
  `- 缺失待补：${counts["missing-target"] ?? 0}`,
  "",
  "| 分类 | Text-to-UI 注册名 | 状态 | HarmonyOS 源组件 | 源 Variant | 下一步 |",
  "| --- | --- | --- | --- | --- | --- |",
  ...rows.map(
    (row) =>
      `| ${escapeCell(row.category)} | ${escapeCell(row.target)} | ${escapeCell(row.status)} | ${escapeCell(row.sourceComponentSet)} | ${escapeCell(variantLabel(row.sourceVariant, row.sourceVariantAliases))} | ${escapeCell(row.nextAction)} |`,
  ),
  "",
  "## 仅作源参考",
  "",
  "| HarmonyOS 源组件 | 原因 |",
  "| --- | --- |",
  ...adapter.sourceOnly.map(
    (entry) => `| ${escapeCell(entry.name)} | ${escapeCell(entry.reason)} |`,
  ),
  "",
];
const markdownOutput = `${markdownLines.join("\n")}\n`;

const outputs = [
  ["assets/design-system/harmonyos-component-mapping-table.json", jsonOutput],
  ["references/harmonyos-component-mapping-table.md", markdownOutput],
];

const check = process.argv.includes("--check");
const write = process.argv.includes("--write") || !check;
let stale = false;

for (const [relativePath, content] of outputs) {
  const absolutePath = path.join(root, relativePath);
  const current = fs.existsSync(absolutePath)
    ? fs.readFileSync(absolutePath, "utf8")
    : null;
  if (current !== content) {
    stale = true;
    if (write) {
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, content);
    }
  }
}

if (check && stale) {
  console.error("HarmonyOS component mapping table is stale. Run with --write.");
  process.exit(1);
}

console.log(
  `HarmonyOS component mapping table ${write ? "written" : "valid"}: ` +
    `${counts.total} registry targets, ` +
    `${counts["mapped-pending-verification"] ?? 0} mapped pending verification, ` +
    `${counts["mapped-needs-rebuild"] ?? 0} mapped needing rebuild, ` +
    `${counts["missing-target"] ?? 0} missing.`,
);
