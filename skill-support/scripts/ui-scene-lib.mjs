import { compileOperationPlan, loadComponentMap, loadTokenResources, readJson, resolvePixsoIcon, writeJson } from "./pixso-native-scene-lib.mjs";
import { normalizeUiScene } from "./ui-scene-core.mjs";
import { iconColorSourceForMapping } from "./mapping-registry-lib.mjs";
import { resolveComponentVariant } from "./component-mapping-resolver.mjs";

function ownKeys(value) {
  return Object.keys(value ?? {}).filter((key) => value[key] !== undefined && value[key] !== null && value[key] !== "");
}

export function compileUiScene(uiScene, { componentMap, tokens = loadTokenResources() } = {}) {
  if (!componentMap?.map) throw new Error("A loaded Pixso component map is required");
  const normalized = normalizeUiScene(uiScene);
  uiScene = normalized.scene;
  const { resolvedPattern, patternDigest, structureDigest } = normalized;
  const variables = new Map();
  const styles = new Map();
  const icons = new Map();
  const variableAliases = {};

  const token = (requested) => {
    const resolved = tokens.resolve(requested);
    variables.set(resolved.name, resolved);
    if (requested !== resolved.name) variableAliases[requested] = resolved.name;
    return { tokenRef: requested, variableRef: resolved.ref, ref: resolved.ref, name: resolved.name, value: resolved.value };
  };
  const dimension = (value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "number" || value === "fill" || value === "hug") return value;
    if (typeof value === "string") return token(value);
    if (value.mode === "fill" || value.mode === "hug") return value.mode;
    if (value.mode === "fixed" && value.token) return token(value.token);
    if (value.mode === "fixed" && typeof value.value === "number") return value.value;
    throw new Error(`Invalid UI Scene dimension: ${JSON.stringify(value)}`);
  };
  const layout = (input = {}) => ({
    direction: input.direction ?? "VERTICAL",
    width: dimension(input.width ?? "fill"),
    height: dimension(input.height ?? "hug"),
    ...(input.minWidth !== undefined ? { minWidth: dimension(input.minWidth) } : {}),
    ...(input.maxWidth !== undefined ? { maxWidth: dimension(input.maxWidth) } : {}),
    ...(input.minHeight !== undefined ? { minHeight: dimension(input.minHeight) } : {}),
    ...(input.maxHeight !== undefined ? { maxHeight: dimension(input.maxHeight) } : {}),
    padding: Object.fromEntries(Object.entries(input.padding ?? {}).map(([key, value]) => [key, dimension(value)])),
    gap: input.gap === null || input.gap === undefined ? null : dimension(input.gap),
    primaryAlign: input.primaryAlign ?? "MIN",
    counterAlign: input.counterAlign ?? "MIN",
    distribution: input.distribution ?? "PACKED",
    align: input.counterAlign ?? "MIN",
    clipsContent: Boolean(input.clipsContent),
    ...(input.maxLines ? { maxLines: input.maxLines } : {}),
    ...(input.overflow ? { overflow: input.overflow } : {}),
  });
  const style = (input = {}, nodeType = "frame") => {
    const output = {};
    if (input.background?.kind === "transparent") output.fill = { kind: "transparent" };
    if (input.background?.kind === "token") output.fill = { ...token(input.background.token), kind: "token" };
    if (input.background?.kind === "linear-gradient") {
      output.gradient = {
        kind: "linear-gradient",
        angle: input.background.angle ?? 0,
        stops: input.background.stops.map((stop) => ({ position: stop.position, color: token(stop.token) })),
      };
    }
    if (input.borderToken) output.stroke = token(input.borderToken);
    if (input.border?.token) {
      output.stroke = token(input.border.token);
      output.strokeEdges = input.border.edges ?? ["top", "right", "bottom", "left"];
    }
    if (input.radiusToken) output.radius = token(input.radiusToken);
    if (input.textColorToken) output.fill = { ...token(input.textColorToken), kind: "token" };
    if (input.textRole) {
      output.textStyle = tokens.styleForText(input.textRole);
      styles.set(output.textStyle.ref, output.textStyle);
    }
    if (input.shadowRole) {
      output.effectStyle = tokens.styleForEffect(input.shadowRole);
      styles.set(output.effectStyle.ref, output.effectStyle);
    }
    if (nodeType === "text" && !output.fill) output.fill = { ...token("text/primary"), kind: "token" };
    return output;
  };

  const convert = (node) => {
    const base = {
      id: node.id,
      name: node.name,
      type: node.type,
      region: node.region,
      layout: layout(node.layout),
      style: style(node.style, node.type),
      metadata: { source: "canonical-ui-scene", region: node.region },
      children: (node.children ?? []).map(convert),
    };
    if (node.type === "text") return { ...base, content: node.content ?? "" };
    if (node.type === "icon") {
      if (!node.semanticIcon) throw new Error(`Icon ${node.id} is missing semanticIcon`);
      icons.set(node.semanticIcon, resolvePixsoIcon(node.semanticIcon));
      return { ...base, icon: { alias: node.semanticIcon, size: node.iconSize ?? 20, source: "assets/icons/icon-aliases.json", hotZone: node.hotZone ?? { alignment: "CENTER", axes: "BOTH" } } };
    }
    if (node.type !== "component") return base;
    const request = node.component ?? {};
    const mapping = componentMap.map.get(request.logicalName) ?? null;
    const unsupportedProps = ownKeys(request.props).filter((key) => !(mapping?.supportedProps ?? []).includes(key));
    const unsupportedSlots = ownKeys(request.slots).filter((key) => !(mapping?.supportedSlots ?? []).includes(key));
    const capabilityMatch = unsupportedProps.length === 0 && unsupportedSlots.length === 0;
    const canReuse = request.reuse !== "native" && mapping?.availability === "mapped" && capabilityMatch;
    const requestedHtmlVariant = String(
      request.props?.tone ?? request.props?.variant ?? request.variant ?? "default",
    ).toLowerCase();
    const resolvedVariant = canReuse
      ? resolveComponentVariant(mapping, {
          htmlVariant: requestedHtmlVariant,
          props: request.props ?? {},
          state: request.state,
        })
      : null;
    if (request.reuse === "required" && !canReuse) {
      throw new Error(`Required Pixso Instance cannot be resolved for ${request.logicalName}; props=${unsupportedProps.join(",") || "ok"}; slots=${unsupportedSlots.join(",") || "ok"}`);
    }
    return {
      ...base,
      renderMode: canReuse ? "instance" : "native-composition",
      component: {
        logicalName: request.logicalName,
        rendererKey: request.rendererKey,
        pixsoName: canReuse ? mapping.pixsoName : null,
        componentSetName: canReuse ? mapping.componentSetName ?? mapping.pixsoName : null,
        variant: resolvedVariant,
        ...(canReuse && iconColorSourceForMapping(mapping) ? { iconColorSource: iconColorSourceForMapping(mapping) } : {}),
        availability: canReuse ? "mapped" : "native-fallback",
        props: request.props ?? {},
        slots: request.slots ?? {},
        state: request.state ?? "default",
        fallbackRecipe: request.fallbackRecipe ?? request.rendererKey ?? "generic-content",
      },
      metadata: { source: canReuse ? "pixso-component-map" : "canonical-native-fallback", region: node.region, capabilityMatch },
    };
  };

  const nodes = (uiScene.nodes ?? []).map(convert);
  const pixsoScene = {
    schemaVersion: 1,
    source: { kind: "canonical-ui-scene", source: uiScene.source ?? {}, patternContract: resolvedPattern.authority, patternDigest, structureDigest },
    page: uiScene.page,
    patternContract: resolvedPattern,
    resources: {
      componentLibraryPage: componentMap.libraryPage ?? "NewComponents",
      variableAliases,
      variables: [...variables.values()],
      styles: [...styles.values()],
      icons: [...icons.values()],
      font: "font/family/sans",
    },
    nodes,
  };
  const plan = compileOperationPlan(pixsoScene, { componentMap, tokens });
  plan.execution.rootNodeId = nodes[0]?.id ?? null;
  plan.execution.canonicalKey = uiScene.page.name;
  plan.execution.sourceKind = "canonical-ui-scene";
  plan.execution.patternId = resolvedPattern.pattern.id;
  plan.execution.patternDigest = patternDigest;
  plan.execution.structureDigest = structureDigest;
  return { pixsoScene, plan };
}

export { loadComponentMap, loadTokenResources, readJson, writeJson };
