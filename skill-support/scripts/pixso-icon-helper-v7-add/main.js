// Text-to-UI Semantic Icon Helper v7 — preflighted, one bounded write.
//
// Scope is intentionally narrow: create exactly one semantic SVG component on
// the NewComponents page. This plugin never scans or changes Coremail and
// never swaps an existing component slot. Run "health" before "create-add".

const ALIAS = "action/add";
const COMPONENT_NAME = "Text-to-UI Icon/" + ALIAS;
const DEFINITION = {
  viewBox: "0 0 24 24",
  geometry: '<path d="M5 12h14"/><path d="M12 5v14"/>',
};

let stage = "启动";

function apiVersion() {
  return pixso && pixso.apiVersion ? String(pixso.apiVersion) : "未声明";
}

function isRemoved(node) {
  if (!node) return true;
  try {
    return node.removed === true;
  } catch (_) {
    return true;
  }
}

function safeRemove(node) {
  if (!node || isRemoved(node) || typeof node.remove !== "function") return;
  try {
    node.remove();
  } catch (error) {
    console.warn("Text-to-UI cleanup skipped", error);
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function findLibraryPage() {
  const root = pixso && pixso.root;
  const pages = root && Array.isArray(root.children) ? root.children : [];
  const page = pages.find(
    (node) => node.type === "PAGE" && node.name === "NewComponents",
  );
  if (!page) throw new Error("未找到 NewComponents 页面；已停止写入。");
  return page;
}

async function findExisting(page) {
  // NewComponents keeps registered components as direct children. Reading
  // only this small local list avoids a full-page findAllAsync traversal,
  // which can time out while Pixso is reconnecting its cooperation session.
  const children = Array.isArray(page.children) ? page.children : [];
  return children.find(
    (node) => node.type === "COMPONENT" && node.name === COMPONENT_NAME,
  ) || null;
}

async function preflight() {
  stage = "连接预检";
  if (!pixso || !pixso.root) {
    throw new Error("当前没有可用的 Pixso 文档上下文。");
  }
  const page = findLibraryPage();
  if (!Array.isArray(page.children)) {
    throw new Error("NewComponents 页面暂时不可读；已停止写入。");
  }
  return { page, api: apiVersion() };
}

function svgMarkup() {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" ' +
    'viewBox="' + DEFINITION.viewBox + '" fill="none" stroke="#000000" ' +
    'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    DEFINITION.geometry +
    "</svg>"
  );
}

async function createRegisteredComponent(imported) {
  if (typeof pixso.createComponentFromNode === "function") {
    const component = await pixso.createComponentFromNode(imported);
    return { component, importedOwned: true };
  }

  // Compatibility path for a runtime that exposes createComponent but not the
  // 2.x createComponentFromNode helper. It keeps the imported SVG in the new
  // component instead of moving it between pages.
  if (
    typeof pixso.createComponent === "function" &&
    typeof pixso.currentPage !== "undefined"
  ) {
    const originalX = typeof imported.x === "number" ? imported.x : 0;
    const originalY = typeof imported.y === "number" ? imported.y : 0;
    const width = typeof imported.width === "number" ? imported.width : 24;
    const height = typeof imported.height === "number" ? imported.height : 24;
    const component = await pixso.createComponent();
    if (!component || typeof component.appendChild !== "function") {
      throw new Error("当前 Pixso API 无法把 SVG 放入共享组件。");
    }
    component.x = originalX;
    component.y = originalY;
    if (
      typeof component.resizeWithoutConstraints === "function" &&
      width > 0 &&
      height > 0
    ) {
      component.resizeWithoutConstraints(width, height);
    }
    component.appendChild(imported);
    imported.x = 0;
    imported.y = 0;
    return { component, importedOwned: false };
  }

  throw new Error(
    "当前 Pixso API 没有可用的组件注册方法（需要 createComponentFromNode 或 createComponent）。",
  );
}

async function readBack(page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const component = await findExisting(page);
    if (component) return component;
    await delay(100 * (attempt + 1));
  }
  throw new Error(
    "创建请求已提交，但在 NewComponents 中未回读到目标组件；未执行第二次写入。",
  );
}

async function createOne() {
  const { page, api } = await preflight();

  stage = "检查现有组件";
  const existing = await findExisting(page);
  if (existing) {
    return {
      status: "existing",
      api,
      id: existing.id,
    };
  }

  const previousPage = pixso.currentPage;
  let imported = null;
  let component = null;
  let registrationReturned = false;
  try {
    stage = "切换 NewComponents";
    pixso.currentPage = page;

    stage = "导入 SVG";
    imported = pixso.createNodeFromSvg(svgMarkup());
    if (!imported) throw new Error("Pixso 未返回导入的 SVG 节点。");
    imported.name = COMPONENT_NAME + "/SVG";
    const index = Array.isArray(page.children) ? page.children.length : 0;
    imported.x = (index % 20) * 48;
    imported.y = 40 + Math.floor(index / 20) * 48;

    stage = "注册共享组件";
    const registration = await createRegisteredComponent(imported);
    component = registration.component;
    registrationReturned = true;
    if (!component) throw new Error("Pixso 未返回共享组件节点。");
    component.name = COMPONENT_NAME;
    if (registration.importedOwned) imported = null;

    stage = "设置语义元数据";
    if (typeof component.setPluginData === "function") {
      component.setPluginData("text-to-ui-icon-alias", ALIAS);
      component.setPluginData("text-to-ui-icon-viewBox", DEFINITION.viewBox);
    } else {
      console.warn("当前 API 不支持 setPluginData；将使用组件名完成映射。");
    }

    stage = "回读确认";
    const verified = await readBack(page);
    return {
      status: "created",
      api,
      id: verified.id,
      name: verified.name,
    };
  } catch (error) {
    // If registration itself has not returned, remove only the temporary SVG.
    // Once a component exists, keep it on a read-back failure so a retry can
    // find it by name instead of creating a duplicate after a session timeout.
    if (!registrationReturned || stage !== "回读确认") {
      safeRemove(component);
      safeRemove(imported);
    }
    throw error;
  } finally {
    try {
      if (previousPage && pixso.currentPage !== previousPage) {
        pixso.currentPage = previousPage;
      }
    } catch (error) {
      console.warn("恢复当前页面失败", error);
    }
  }
}

function failureMessage(error) {
  const raw = error && error.message ? error.message : String(error);
  if (/(s[_ ]?guid|guid not exist|token|expire|coop|timeout|network|offline|server|超时|网络|认证|会话|令牌|服务器)/i.test(raw)) {
    return (
      "Pixso 连接/协作会话异常（阶段：" +
      stage +
      "）。请重新登录 Pixso，先运行‘连接自检（只读）’，未继续写入。原始信息：" +
      raw
    );
  }
  return "阶段‘" + stage + "’失败，未继续写入：" + raw;
}

function finish(message, options) {
  try {
    pixso.notify(message, options);
  } catch (error) {
    console.error("Pixso notify failed", error);
  }
  pixso.closePlugin();
}

async function run() {
  const command = pixso.command || "health";
  try {
    if (command === "health") {
      const info = await preflight();
      finish(
        "连接自检通过：API " +
          info.api +
          "，NewComponents 可读；本次未写入。",
      );
      return;
    }

    if (command === "create-add") {
      const result = await createOne();
      if (result.status === "existing") {
        finish(
          COMPONENT_NAME +
            " 已存在（" +
            result.id +
            "）；本次未写入。",
        );
      } else {
        finish(
          "已创建并回读确认 " +
            COMPONENT_NAME +
            "（" +
            result.id +
            "）；未替换任何现有槽位。",
        );
      }
      return;
    }

    finish("未知命令：本次未读取或修改文档。", { error: true });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    finish(failureMessage(error), { error: true });
  }
}

run();
