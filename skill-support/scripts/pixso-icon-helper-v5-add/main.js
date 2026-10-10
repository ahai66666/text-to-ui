// Text-to-UI Semantic Icon Helper v5 — one bounded write.
//
// This plugin creates exactly one semantic SVG component on NewComponents.
// It never scans Coremail, never swaps an existing component slot, never
// moves nodes between pages, and removes the imported SVG if registration
// fails. The slot swap is performed later through MCP after a live read-back.

const ALIAS = "action/add";
const COMPONENT_NAME = "Text-to-UI Icon/" + ALIAS;
const DEFINITION = {
  viewBox: "0 0 24 24",
  geometry: '<path d="M5 12h14"/><path d="M12 5v14"/>',
};

function findLibraryPage() {
  const page = pixso.root.children.find(
    (node) => node.type === "PAGE" && node.name === "NewComponents",
  );
  if (!page) throw new Error("未找到 NewComponents 页面；已停止写入。");
  return page;
}

async function findExisting(page) {
  if (typeof page.findAllAsync !== "function") {
    throw new Error("当前 Pixso API 不支持 findAllAsync；请更新 Pixso 后重试。");
  }
  return (await page.findAllAsync(
    (node) => node.type === "COMPONENT" && node.name === COMPONENT_NAME,
  ))[0] || null;
}

async function createOne() {
  const page = findLibraryPage();
  const existing = await findExisting(page);
  if (existing) {
    pixso.notify("已存在 " + COMPONENT_NAME + "，本次未写入。");
    console.log("Text-to-UI semantic icon already exists", existing.id);
    return;
  }

  const previousPage = pixso.currentPage;
  let imported = null;
  pixso.currentPage = page;
  try {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" ' +
      'viewBox="' + DEFINITION.viewBox + '" fill="none" stroke="#000000" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      DEFINITION.geometry +
      "</svg>";
    imported = pixso.createNodeFromSvg(svg);
    imported.name = COMPONENT_NAME + "/SVG";
    imported.x = page.children.length * 40;
    imported.y = 40;
    const component = pixso.createComponentFromNode(imported);
    component.name = COMPONENT_NAME;
    if (typeof component.setPluginData === "function") {
      component.setPluginData("text-to-ui-icon-alias", ALIAS);
      component.setPluginData("text-to-ui-icon-viewBox", DEFINITION.viewBox);
    }
    pixso.notify("已创建 " + COMPONENT_NAME + "；尚未替换任何现有组件槽位。请由 MCP 读回确认。");
    console.log("Text-to-UI semantic icon created", {
      alias: ALIAS,
      componentId: component.id,
      name: component.name,
    });
  } catch (error) {
    if (imported && typeof imported.remove === "function") {
      try { imported.remove(); } catch (_) {}
    }
    throw error;
  } finally {
    pixso.currentPage = previousPage;
  }
}

async function run() {
  if ((pixso.command || "create-add") !== "create-add") {
    pixso.notify("未知命令：本次未读取或修改文档。", { error: true });
    pixso.closePlugin();
    return;
  }
  try {
    await createOne();
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    pixso.notify("语义 SVG 创建失败：" + message, { error: true });
    console.error(error && error.stack ? error.stack : error);
  }
  pixso.closePlugin();
}

run();
