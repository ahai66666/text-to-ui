(function installFrameworkComponentInteractionAudit(document, window) {
  const registry = window.TEXT_TO_UI_FRAMEWORK_COMPONENTS || {};
  const frameworks = ["react", "vue", "html"];
  const pause = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  const waitFor = async (predicate, message) => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (predicate()) return;
      await pause(25);
    }
    throw new Error(message);
  };
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const key = (node, name) => node.dispatchEvent(new node.ownerDocument.defaultView.KeyboardEvent("keydown", { key: name, bubbles: true }));
  const first = (root, selector, message) => {
    const node = root.querySelector(selector);
    assert(node, message || `missing ${selector}`);
    return node;
  };
  const selectedCount = (root, selector) => root.querySelectorAll(selector).length;

  const scenarios = {
    buttons(root) {
      const trigger = first(root, "[data-dropdown] .dropdown-trigger", "Button module has no dropdown trigger");
      trigger.click(); assert(trigger.getAttribute("aria-expanded") === "true", "dropdown did not open");
      key(trigger, "Escape"); assert(trigger.getAttribute("aria-expanded") === "false", "dropdown did not close on Escape");
    },
    titlebars(root) { assert(selectedCount(root, ".titlebar") >= 4, "Titlebar matrix is incomplete"); },
    fields(root) {
      const trigger = first(root, "[data-select] .select-trigger", "Field module has no Select trigger");
      trigger.click(); assert(trigger.getAttribute("aria-expanded") === "true", "Select did not open");
      key(trigger, "Escape"); assert(trigger.getAttribute("aria-expanded") === "false", "Select did not close on Escape");
    },
    choices(root) {
      const control = first(root, ".switch", "Choice module has no Switch");
      const before = control.getAttribute("aria-checked"); control.click();
      assert(control.getAttribute("aria-checked") !== before, "Switch state did not change");
    },
    navigation(root) {
      const tab = first(root, "[data-tabs] [role='tab'][aria-selected='true']", "Navigation module has no selected Tab");
      key(tab, "ArrowRight"); assert(selectedCount(root, "[data-tabs] [role='tab'][aria-selected='true']") >= 1, "Tab selection was lost");
    },
    "data-display"(root) {
      const page = first(root, ".pagination-item:not([aria-label]):not([aria-current])", "Data display module has no target page");
      page.click(); assert(page.hasAttribute("aria-current"), "Pagination did not set current page");
    },
    disclosure(root) {
      const trigger = first(root, ".accordion-trigger", "Disclosure module has no Accordion trigger");
      const before = trigger.getAttribute("aria-expanded"); trigger.click();
      assert(trigger.getAttribute("aria-expanded") !== before, "Accordion state did not change");
      const menu = first(root, ".menubar [role='menuitem']", "Disclosure module has no Menubar item");
      key(menu, "ArrowDown"); assert(!first(root, ".menubar-popup").hidden, "Menubar did not open with ArrowDown");
      key(menu.ownerDocument.activeElement, "Escape"); assert(first(root, ".menubar-popup").hidden, "Menubar did not close on Escape");
      const sidebar = first(root, ".gallery-sidebar-nav", "Disclosure module has no Sidebar matrix");
      const sidebarTarget = first(sidebar, "button[data-state='default']", "Sidebar has no selectable default item");
      sidebarTarget.click(); assert(sidebarTarget.dataset.state === "selected" && sidebarTarget.getAttribute("aria-current") === "", "Sidebar did not retain selected state");
    },
    overlays(root) {
      const trigger = first(root, "[data-open-layer]", "Overlay module has no Dialog trigger");
      trigger.click(); const layer = first(root, "#dialog-layer"); assert(layer.classList.contains("open"), "Dialog did not open");
      key(root, "Escape"); assert(!layer.classList.contains("open"), "Dialog did not close on Escape");
      const popover = first(root, "[data-popover] button[aria-controls]", "Overlay module has no Popover trigger");
      popover.click(); assert(popover.getAttribute("aria-expanded") === "true", "Popover did not open"); key(popover, "Escape"); assert(popover.getAttribute("aria-expanded") === "false", "Popover did not close on Escape");
    },
    "form-plus"(root) {
      const trigger = first(root, ".combobox-trigger", "Form module has no Combobox trigger");
      trigger.click(); assert(trigger.getAttribute("aria-expanded") === "true", "Combobox did not open");
      const option = first(root, "[data-combobox] [role='option']", "Combobox has no option"); option.click();
      assert(trigger.getAttribute("aria-expanded") === "false", "Combobox did not commit and close");
      const otp = first(root, ".otp input", "Form module has no OTP input"); otp.value = "7"; otp.dispatchEvent(new otp.ownerDocument.defaultView.Event("input", { bubbles: true }));
      assert(otp.value === "7", "OTP did not retain entered digit");
    },
    "loading-data"(root) {
      const date = first(root, ".date-picker-trigger", "Loading module has no Date Picker"); date.click();
      assert(selectedCount(root, ".date-picker-day") === 42, "Date Picker grid is not stable 6×7"); key(date, "Escape");
      const time = first(root, ".time-picker-trigger", "Loading module has no Time Picker"); time.click();
      assert(selectedCount(root, ".time-picker-option") === 36, "Time Picker options are incomplete"); key(time, "Escape");
      const calendarNext = first(root, "[data-calendar] .calendar-head button[aria-label='下个月']", "Calendar has no next-month control");
      const label = first(root, "[data-calendar] .calendar-head strong"); const before = label.textContent; calendarNext.click(); assert(label.textContent !== before, "Calendar month did not change");
    },
    specialized(root) {
      const next = first(root, "[data-carousel] button[aria-label='下一张']", "Specialized module has no Carousel next control");
      const before = first(root, ".carousel-slide.active").textContent; next.click();
      assert(first(root, ".carousel-slide.active").textContent !== before, "Carousel did not advance");
      assert(first(root, ".attachment input[type='file']").multiple, "Attachment does not support multiple files");
    },
    async feedback(root) {
      const tooltipRoot = first(root, "[data-tooltip]", "Feedback module has no Tooltip trigger");
      const tooltip = first(tooltipRoot, ".tooltip", "Tooltip trigger has no tooltip content");
      tooltipRoot.dispatchEvent(new root.ownerDocument.defaultView.Event("mouseenter"));
      await pause(340);
      assert(tooltip.classList.contains("is-visible"), "Tooltip did not appear on hover");
      tooltipRoot.dispatchEvent(new root.ownerDocument.defaultView.Event("mouseleave"));
      assert(!tooltip.classList.contains("is-visible"), "Tooltip did not hide after hover leave");
      const toast = first(root, "#show-toast", "Feedback module has no Toast trigger"); toast.click(); assert(first(root, "#toast").classList.contains("show"), "Toast did not appear");
      const close = first(root, "[data-dismiss-alert]", "Feedback module has no dismissible Alert"); const alert = close.closest(".alert"); close.click(); assert(!alert.isConnected, "Alert did not dismiss");
    }
  };

  const loadFramework = async (contract, framework) => {
    const host = document.querySelector(contract.hostSelector);
    assert(host, `missing gallery host ${contract.hostSelector}`);
    const frame = first(host, "iframe.framework-adapter-frame", `${contract.moduleId} has no real framework frame`);
    const input = first(host, `.framework-adapter-switch input[value='${framework}']`, `${contract.moduleId} has no ${framework} switch`);
    if (host.dataset.framework !== framework) {
      const loaded = new Promise((resolve) => frame.addEventListener("load", resolve, { once: true }));
      input.checked = true; input.dispatchEvent(new Event("change", { bubbles: true })); await loaded;
    }
    await waitFor(() => frame.contentDocument?.querySelector(".framework-catalog-module")?.dataset.state === "ready", `${contract.moduleId}/${framework} did not mount`);
    const root = frame.contentDocument.querySelector(".framework-catalog-module");
    await pause(40);
    assert(frame.offsetHeight >= Math.ceil(root.getBoundingClientRect().height), `${contract.moduleId}/${framework} frame height clips mounted content`);
    return root;
  };

  const run = async () => {
    const results = [];
    const modules = Object.values(registry).filter((contract) => contract.coverageScope === "module");
    for (const contract of modules) {
      for (const framework of frameworks) {
        try {
          const root = await loadFramework(contract, framework);
          await scenarios[contract.moduleId](root);
          results.push({ module: contract.moduleId, framework, status: "passed" });
        } catch (error) {
          results.push({ module: contract.moduleId, framework, status: "failed", reason: error.message });
        }
      }
    }
    const failures = results.filter((result) => result.status === "failed");
    document.documentElement.dataset.frameworkInteractionAudit = failures.length ? "failed" : "passed";
    window.__TEXT_TO_UI_FRAMEWORK_INTERACTION_AUDIT__ = Object.freeze({ results, failures, passed: failures.length === 0 });
    return window.__TEXT_TO_UI_FRAMEWORK_INTERACTION_AUDIT__;
  };

  window.runTextToUiFrameworkInteractionAudit = run;
  const auditButton = document.querySelector("#run-framework-audit");
  const auditStatus = document.querySelector("#framework-audit-status");
  const runAndReport = async () => {
    if (auditButton?.disabled) return;
    if (auditButton) auditButton.disabled = true;
    if (auditStatus) { auditStatus.dataset.state = "running"; auditStatus.textContent = "正在巡检三框架…"; }
    try {
      const audit = await run();
      if (auditStatus) {
        auditStatus.dataset.state = audit.passed ? "passed" : "failed";
        auditStatus.textContent = audit.passed
          ? `已通过：${audit.results.length} 项`
          : `失败：${audit.failures.length} 项`;
      }
      return audit;
    } catch (error) {
      if (auditStatus) { auditStatus.dataset.state = "failed"; auditStatus.textContent = `验收异常：${error.message}`; }
      return { passed: false, results: [], failures: [{ module: "gallery", framework: "all", status: "failed", reason: error.message }] };
    } finally {
      if (auditButton) auditButton.disabled = false;
    }
  };
  auditButton?.addEventListener("click", () => { runAndReport(); });
  if (new URLSearchParams(window.location.search).get("frameworkAudit") === "1") runAndReport();
})(document, window);
