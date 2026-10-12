const rendererPackages = {
  html: "@text-to-ui/components-html",
  react: "@text-to-ui/components-react",
  vue: "@text-to-ui/components-vue",
};

const styleImports = {
  html: ["@text-to-ui/tokens", "@text-to-ui/components-html/styles.css", "@text-to-ui/components-html/pattern-shell.css"],
  react: ["@text-to-ui/tokens", "@text-to-ui/components-react/styles.css", "@text-to-ui/components-html/pattern-shell.css"],
  vue: ["@text-to-ui/tokens", "@text-to-ui/components-vue/styles.css", "@text-to-ui/components-html/pattern-shell.css"],
};

function exportNameFromSource(source, fallback) {
  const hashExport = String(source ?? "").split("#")[1];
  if (hashExport) return hashExport;
  const file = String(source ?? "").split("/").pop() ?? "";
  const basename = file.replace(/\.(vue|jsx?|tsx?)$/, "");
  return basename && basename !== "index" ? basename : fallback;
}

export function componentRendererBinding(component, framework) {
  const runtime = component.frameworks?.[framework];
  if (!runtime?.exists) return null;
  const fallback = component.id.split("-").map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : "").join("");
  return {
    capability: null,
    logicalName: component.logicalName,
    rendererKey: framework === "html" ? runtime.rendererKey : null,
    exportName: framework === "html" ? null : exportNameFromSource(runtime.source, fallback),
    source: runtime.source,
    supportedProps: component.props ?? [],
    supportedSlots: component.slots ?? [],
    slotContracts: component.slotContracts ?? {},
    tokenRoles: component.tokenRoles ?? [],
  };
}

export function buildFrameworkRendererContract(framework, components) {
  if (!rendererPackages[framework]) throw new Error(`Unsupported framework renderer: ${framework}`);
  return {
    framework,
    package: rendererPackages[framework],
    renderStrategy: framework === "html" ? "factory" : "component-export",
    factoryImport: framework === "html" ? "renderHtmlComponent" : null,
    evidenceImport: framework === "html" ? "collectHtmlComponentEvidence" : null,
    runtimeImport: framework === "react" ? "React" : framework === "vue" ? "h" : null,
    styleImports: styleImports[framework],
    components: components.filter(Boolean),
  };
}
