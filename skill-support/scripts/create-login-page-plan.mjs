import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePlanPath = process.argv[2]
  ?? process.env.TEXT_TO_UI_SOURCE_PLAN
  ?? path.join(repository, "apps/coremail-workbench/pixso/pixso-operation-plan.json");
const outputRoot = process.argv[3]
  ?? process.env.TEXT_TO_UI_OUTPUT_ROOT
  ?? path.join(repository, "outputs/login-pages");
if (!fs.existsSync(sourcePlanPath)) {
  throw new Error(`Source Pixso operation plan not found: ${sourcePlanPath}. Pass the plan as the first argument or set TEXT_TO_UI_SOURCE_PLAN.`);
}
const sourcePlan = JSON.parse(fs.readFileSync(sourcePlanPath, "utf8"));

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const runId = `login-page-${stamp}`;
const rootName = `Login Page / HarmonyOS PC / ${stamp}`;
const outputDir = path.join(outputRoot, runId);
const outputPath = path.join(outputDir, "pixso-operation-plan.json");

const variable = (name) => ({ ref: `$variable/${name}` });
const style = (name) => ({ ref: `$style/${name}` });
const fill = (name) => variable(name);
const space = (value) => variable(`space/${value}`);
const radius = (value) => variable(`radius/${value}`);
const size = (value) => variable(`size/${value}`);

const padding = (value) => ({ top: space(value), right: space(value), bottom: space(value), left: space(value) });
const frameLayout = ({ direction = "VERTICAL", width = "hug", height = "hug", gap = null, pad = {}, primaryAlign = "MIN", counterAlign = "MIN", positioning = "FLOW", x, y, clipsContent = false }) => ({
  direction,
  positioning,
  ...(Number.isFinite(x) ? { x } : {}),
  ...(Number.isFinite(y) ? { y } : {}),
  width,
  height,
  padding: pad,
  gap,
  primaryAlign,
  counterAlign,
  distribution: primaryAlign === "SPACE_BETWEEN" ? "SPACE_BETWEEN" : "PACKED",
  clipsContent,
});

const frameStyle = (fillName, radiusName = null, effectName = null) => ({
  ...(fillName ? { fill: fill(fillName) } : { fill: { kind: "transparent" } }),
  ...(radiusName ? { radius: radius(radiusName) } : {}),
  ...(effectName ? { effectStyle: style(effectName) } : {}),
  strokeEdges: [],
  strokeWeights: { top: 0, right: 0, bottom: 0, left: 0 },
});

const textStyle = (role, color = "neutral-dark/90", align = "LEFT") => ({
  fill: fill(color),
  textStyle: style(`Typography/${role}`),
  textAlignHorizontal: align,
});

const metadata = (role) => ({ source: "confirmed-direct-login-page", role });
const operations = [];
const add = (operation) => operations.push(operation);
const frame = (nodeId, parentId, name, region, layout, fillName = null, radiusName = null, effectName = null) => add({
  op: "create-frame",
  phase: "layout",
  nodeId,
  parentId,
  name,
  region,
  layout,
  style: frameStyle(fillName, radiusName, effectName),
  metadata: metadata(region),
});
const text = (nodeId, parentId, name, region, characters, layout, role, color = "neutral-dark/90", align = "LEFT") => add({
  op: "create-text",
  phase: "layout",
  nodeId,
  parentId,
  name,
  region,
  layout,
  style: textStyle(role, color, align),
  metadata: metadata(region),
  characters,
});
const ellipse = (nodeId, parentId, name, region, layout, fillName) => add({
  op: "create-ellipse",
  phase: "layout",
  nodeId,
  parentId,
  name,
  region,
  layout,
  style: frameStyle(fillName),
  metadata: metadata(region),
});
const outlinedFrame = (nodeId, parentId, name, region, layout, fillName = "neutral-light/100", radiusName = "08") => {
  frame(nodeId, parentId, name, region, layout, fillName, radiusName);
  const current = operations.at(-1);
  current.style.stroke = fill("neutral-dark/10");
  current.style.strokeEdges = ["top", "right", "bottom", "left"];
  current.style.strokeWeights = { top: 1, right: 1, bottom: 1, left: 1 };
};
const instance = (nodeId, parentId, name, region, logicalName, pixsoName, componentSetName, variant, layout, props, slots) => add({
  op: "create-instance",
  phase: "component-enrichment",
  nodeId,
  parentId,
  name,
  region,
  layout,
  style: {},
  metadata: metadata(region),
  componentRef: { logicalName, pixsoName, componentSetName, variant },
  props,
  slots,
});

add({
  op: "create-page",
  phase: "resources",
  page: {
    name: rootName,
    targetPage: "NewComponents",
    viewport: { width: 1728, height: 1152 },
    stateId: "default-visible",
  },
});

frame("login-root", null, rootName, "login-page", frameLayout({
  direction: "HORIZONTAL",
  positioning: "ABSOLUTE",
  x: 1900,
  y: 0,
  width: variable("layout/width/1728"),
  height: variable("layout/height/1152"),
  gap: space(6),
  pad: padding(7),
  counterAlign: "CENTER",
  clipsContent: true,
}), "neutral-dark/05", "16");

frame("login-brand", "login-root", "Brand introduction", "login-brand", frameLayout({
  direction: "VERTICAL", width: 760, height: 1088, gap: space(6), pad: padding(7), primaryAlign: "CENTER", counterAlign: "MIN"
}), "brand/100", "16");
frame("brand-header", "login-brand", "Brand header", "login-brand", frameLayout({ direction: "HORIZONTAL", width: "hug", height: "hug", gap: space(5), counterAlign: "CENTER" }), null, null);
ellipse("brand-mark", "brand-header", "Coremail mark", "login-brand", frameLayout({ direction: "NONE", width: size(64), height: size(64) }), "neutral-light/100");
text("brand-name", "brand-header", "Brand name", "login-brand", "Coremail", frameLayout({ direction: "NONE", width: "hug", height: "hug" }), "Title_M", "neutral-light/100");
text("brand-title", "login-brand", "Brand headline", "login-brand", "高效完成每一次沟通", frameLayout({ direction: "NONE", width: "fill", height: "hug" }), "Title_M", "neutral-light/100");
text("brand-description", "login-brand", "Brand description", "login-brand", "统一管理邮件、日程与协作，让工作更简单。", frameLayout({ direction: "NONE", width: "fill", height: "hug" }), "Body_L", "neutral-light/100");
frame("brand-features", "login-brand", "Brand features", "login-brand", frameLayout({ direction: "VERTICAL", width: "fill", height: "hug", gap: space(3), counterAlign: "MIN" }), null, null);
for (const [index, label] of ["清晰的工作流，一处掌握全部进展", "稳定的设计系统，跨页面保持一致", "更安全的协作体验，专注完成工作"].entries()) {
  const rowId = `brand-feature-${index + 1}`;
  frame(rowId, "brand-features", `Brand feature ${index + 1}`, "login-brand", frameLayout({ direction: "HORIZONTAL", width: "fill", height: size(40), gap: space(4), counterAlign: "CENTER" }), null, null);
  ellipse(`${rowId}-dot`, rowId, "Feature marker", "login-brand", frameLayout({ direction: "NONE", width: variable("size/20"), height: variable("size/20") }), "brand/20");
  text(`${rowId}-text`, rowId, "Feature label", "login-brand", label, frameLayout({ direction: "NONE", width: "fill", height: "hug" }), "Body_M", "neutral-light/100");
}
text("brand-footer", "login-brand", "Brand footer", "login-brand", "HarmonyOS PC · Design System", frameLayout({ direction: "NONE", width: "fill", height: "hug" }), "Body_S", "neutral-light/100");

frame("login-main", "login-root", "Login content", "login-content", frameLayout({
  direction: "VERTICAL", width: 880, height: 1088, gap: null, pad: padding(6), primaryAlign: "CENTER", counterAlign: "CENTER"
}), "neutral-light/100", "16");
frame("login-card", "login-main", "Login card", "login-card", frameLayout({
  direction: "VERTICAL", width: 480, height: 624, gap: space(5), pad: padding(7), primaryAlign: "MIN", counterAlign: "MIN"
}), "neutral-light/100", "16");
frame("login-header", "login-card", "Login header", "login-card", frameLayout({ direction: "VERTICAL", width: 416, height: 72, gap: space(3), counterAlign: "MIN" }), null, null);
text("login-title", "login-header", "Login title", "login-card", "欢迎登录", frameLayout({ direction: "NONE", width: "fill", height: "hug" }), "Title_M");
text("login-subtitle", "login-header", "Login subtitle", "login-card", "使用 Coremail 账户继续", frameLayout({ direction: "NONE", width: "fill", height: "hug" }), "Body_M", "neutral-dark/60");

for (const [id, label, placeholder] of [["account", "账号", "请输入邮箱或手机号"], ["password", "密码", "请输入密码"]]) {
  const groupId = `login-${id}-group`;
  frame(groupId, "login-card", `${label} field`, "login-form", frameLayout({ direction: "VERTICAL", width: 416, height: 80, gap: space(3), counterAlign: "MIN" }), null, null);
  text(`${groupId}-label`, groupId, `${label} label`, "login-form", label, frameLayout({ direction: "NONE", width: "fill", height: "hug" }), "Body_M");
  // The current NewComponents page does not expose the TextInput master. Keep
  // the same geometry and token ownership as the HTML control with a native
  // frame, rather than allowing a missing component to block the whole page.
  const inputId = `${groupId}-input`;
  outlinedFrame(inputId, groupId, `${label} input`, "login-form", frameLayout({ direction: "HORIZONTAL", width: 416, height: size(48), gap: space(3), pad: { left: space(5), right: space(5) }, primaryAlign: "MIN", counterAlign: "CENTER" }), "neutral-light/100", "08");
  text(`${inputId}-placeholder`, inputId, `${label} placeholder`, "login-form", placeholder, frameLayout({ direction: "NONE", width: "fill", height: "hug" }), "Body_M", "neutral-dark/40");
}

frame("login-options", "login-card", "Login options", "login-form", frameLayout({ direction: "HORIZONTAL", width: 416, height: size(40), gap: null, primaryAlign: "SPACE_BETWEEN", counterAlign: "CENTER" }), null, null);
frame("remember-control", "login-options", "Remember login", "login-form", frameLayout({ direction: "HORIZONTAL", width: "hug", height: size(40), gap: space(3), primaryAlign: "MIN", counterAlign: "CENTER" }), null, null);
outlinedFrame("remember-box", "remember-control", "Remember checkbox", "login-form", frameLayout({ direction: "NONE", width: size(20), height: size(20) }), "neutral-light/100", "08");
text("remember-label", "remember-control", "Remember label", "login-form", "记住登录", frameLayout({ direction: "NONE", width: "hug", height: "hug" }), "Body_M", "neutral-dark/60");
text("forgot-password", "login-options", "Forgot password", "login-form", "忘记密码？", frameLayout({ direction: "NONE", width: "hug", height: "hug" }), "Body_M", "brand/100");

frame("login-submit", "login-card", "Login submit", "login-form", frameLayout({ direction: "HORIZONTAL", width: 416, height: size(48), gap: space(3), pad: { left: space(5), right: space(5) }, primaryAlign: "CENTER", counterAlign: "CENTER" }), "brand/100", "08");
text("login-submit-label", "login-submit", "Login submit label", "login-form", "登录", frameLayout({ direction: "NONE", width: "fill", height: "hug" }), "Body_M", "neutral-light/100", "CENTER");

frame("register-row", "login-card", "Register row", "login-form", frameLayout({ direction: "HORIZONTAL", width: 416, height: size(40), gap: space(3), primaryAlign: "CENTER", counterAlign: "CENTER" }), null, null);
text("register-hint", "register-row", "Register hint", "login-form", "还没有账号？", frameLayout({ direction: "NONE", width: "hug", height: "hug" }), "Body_M", "neutral-dark/60");
text("register-link", "register-row", "Register link", "login-form", "立即注册", frameLayout({ direction: "NONE", width: "hug", height: "hug" }), "Body_M", "brand/100");
text("login-agreement", "login-card", "Login agreement", "login-card", "登录即表示同意服务协议和隐私政策", frameLayout({ direction: "NONE", width: 416, height: "hug" }), "Body_S", "neutral-dark/40", "CENTER");

const collectRefs = (value, bucket) => {
  if (!value || typeof value !== "object") return;
  if (typeof value.ref === "string") {
    if (value.ref.startsWith("$variable/")) bucket.variables.add(value.ref);
    if (value.ref.startsWith("$style/")) bucket.styles.add(value.ref);
  }
  for (const child of Object.values(value)) collectRefs(child, bucket);
};
const refs = { variables: new Set(), styles: new Set() };
collectRefs(operations, refs);
const resources = {
  componentLibraryPage: "NewComponents",
  variables: sourcePlan.resources.variables.filter((item) => refs.variables.has(item.ref)),
  styles: sourcePlan.resources.styles.filter((item) => refs.styles.has(item.ref)),
  icons: [],
  images: [],
  font: sourcePlan.resources.font ?? "font/family/sans",
};

const requiredCapabilities = sourcePlan.execution?.agentContract?.requiredCapabilities ?? [
  "node.create", "node.move", "node.replace", "node.delete", "layout.auto", "layout.absolute", "layout.stroke-edges",
  "text.resize-modes", "variable.bind", "style.bind", "component.instance", "component.properties", "asset.svg", "asset.image",
  "transaction.draft", "transaction.rollback", "transaction.commit", "execution.progress", "execution.cancel", "readback.structure", "readback.bindings",
];
const idempotencyKey = `${runId}:${rootName}`;
const execution = {
  resolveGuidsAtRuntime: true,
  libraryPage: "NewComponents",
  targetPage: "NewComponents",
  canonicalKey: rootName,
  pipeline: "confirmed-direct-plan-components-and-tokens",
  geometryAuthority: "operation-plan",
  componentReplacement: "native-composition-with-optional-library",
  fallback: "fail-closed",
  destructive: false,
  preserveExistingFrames: true,
  cleanupPolicy: "single-canonical-output-after-readback",
  outputPolicy: "single-managed-artboard",
  preserveFailedDraft: true,
  minimumRuntimeVersion: "5.0.0",
  sourcePolicy: "new-page-confirmed-direct-plan",
  runId,
  rootNodeId: "login-root",
  rootName,
  agentContract: {
    protocolVersion: 4,
    planSchemaVersion: 5,
    minimumKernelVersion: "5.0.0",
    requiredCapabilities,
    idempotencyKey,
  },
};
const page = { name: rootName, targetPage: "NewComponents", viewport: { width: 1728, height: 1152 }, stateId: "default-visible" };
const plan = {
  schemaVersion: 5,
  kind: "pixso-operation-plan",
  execution,
  page,
  resources,
  phases: [
    { id: "resources", label: "资源预检", operationCount: operations.filter((item) => item.phase === "resources").length },
    { id: "layout", label: "登录页布局与文字", operationCount: operations.filter((item) => item.phase === "layout").length },
    { id: "component-enrichment", label: "复用登录组件", operationCount: operations.filter((item) => item.phase === "component-enrichment").length },
  ],
  operations,
  summary: {
    operationCount: operations.length,
    nodeCount: operations.filter((item) => item.nodeId).length,
    instanceCount: operations.filter((item) => item.op === "create-instance").length,
    tokenBindingCount: operations.filter((item) => item.style || item.layout).length,
    iconSlotCount: 0,
    hydratedIconCount: 0,
    targetPage: "NewComponents",
    viewport: { width: 1728, height: 1152 },
  },
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, runId, rootName, operationCount: operations.length, instanceCount: plan.summary.instanceCount, variables: resources.variables.length, styles: resources.styles.length }, null, 2));
