#!/usr/bin/env node

/**
 * Materialise the comparison contract consumed by browser QA and Pixso
 * mapping. The manifest is intentionally derived from components.json so the
 * registry remains the single logical source while canonical/legacy mapping
 * stays explicit and reviewable.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "packages/component-contracts/src/components.json");
const outputPath = path.join(root, "packages/component-contracts/src/parity-manifest.json");
const registry = JSON.parse(await fs.readFile(registryPath, "utf8"));

const manifest = {
  schemaVersion: 1,
  source: "packages/component-contracts/src/components.json",
  componentCount: registry.components.length,
  categoryCount: new Set(registry.components.map((component) => component.category)).size,
  visualAuthority: [
    "Component/Design MD",
    "skill-support/preview/component-gallery.html",
    "packages/tokens"
  ],
  readinessDimensions: registry.registryPolicy?.readinessDimensions ?? [
    "sourceReady", "contractReady", "visualParity", "behaviorParity", "accessibilityParity", "tokenParity"
  ],
  components: registry.components
    .slice()
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .map((component) => ({
      id: component.id,
      logicalName: component.logicalName,
      category: component.category,
      categoryLabel: component.categoryLabel,
      order: component.order,
      legacyVisualGroup: component.legacyVisualGroup ?? component.category,
      canonicalSelector: component.canonicalSelector,
      canonicalSpecimen: component.canonicalSpecimen ?? `legacy:${component.category}:${component.id}`,
      fixtureId: component.fixtureId,
      surface: component.surface,
      sizing: component.sizing,
      allowedStates: component.allowedStates ?? component.states ?? ["default"],
      requiredVariants: component.specimens ?? component.variants ?? ["default"],
      behaviorChecks: component.behaviors ?? [],
      textRoles: component.textRoles ?? [],
      iconSlots: component.iconSlots ?? [],
      tokenRoles: component.tokenRoles ?? [],
      props: component.props ?? [],
      slots: component.slots ?? [],
      slotContracts: component.slotContracts ?? {},
      layoutRules: component.layoutRules ?? {},
      implementations: component.implementations,
      readiness: component.readiness ?? Object.fromEntries((registry.registryPolicy?.readinessDimensions ?? []).map((key) => [key, false]))
    }))
};

await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Built parity manifest: ${manifest.components.length} components, ${new Set(manifest.components.map((item) => item.category)).size} categories.`);
