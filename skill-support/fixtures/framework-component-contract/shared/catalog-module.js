const moduleDefinitions = Object.freeze({
  buttons: Object.freeze({ logicalName: "Button/Module/Complete", label: "按钮" }),
  titlebars: Object.freeze({ logicalName: "Titlebar/Module/Complete", label: "Titlebar" }),
  fields: Object.freeze({ logicalName: "Field Controls/Module/Complete", label: "输入与选择" }),
  choices: Object.freeze({ logicalName: "Choice Controls/Module/Complete", label: "选择控件" }),
  navigation: Object.freeze({ logicalName: "Navigation/Module/Complete", label: "导航" }),
  "data-display": Object.freeze({ logicalName: "Data Display/Module/Complete", label: "卡片与数据" }),
  disclosure: Object.freeze({ logicalName: "Disclosure Navigation/Module/Complete", label: "披露与导航" }),
  overlays: Object.freeze({ logicalName: "Overlay Command/Module/Complete", label: "浮层与命令" }),
  "form-plus": Object.freeze({ logicalName: "Form Composition/Module/Complete", label: "复合表单" }),
  "loading-data": Object.freeze({ logicalName: "Loading Date/Module/Complete", label: "加载、图表与日期" }),
  specialized: Object.freeze({ logicalName: "Specialized Content/Module/Complete", label: "专用内容" }),
  feedback: Object.freeze({ logicalName: "Feedback/Module/Complete", label: "提示与反馈" })
});

const sourceUrl = new URL("../../component-gallery.html", import.meta.url).href;
let sourceDocumentPromise;

async function getSourceDocument() {
  if (!sourceDocumentPromise) {
    sourceDocumentPromise = fetch(sourceUrl).then((response) => {
      if (!response.ok) throw new Error(`无法读取组件源：${response.status}`);
      return response.text();
    }).then((markup) => new DOMParser().parseFromString(markup, "text/html"));
  }
  return sourceDocumentPromise;
}

function unwrap(node) {
  node.replaceWith(...node.childNodes);
}

function normalizeModule(section, root) {
  section.querySelectorAll(".framework-adapter-slot").forEach((node) => node.remove());
  section.querySelectorAll(".framework-native-surface").forEach(unwrap);
  section.querySelectorAll("[data-component]").forEach((node) => {
    node.dataset.logicalComponent = node.dataset.component;
    node.dataset.variant ||= "gallery";
    node.dataset.state ||= "default";
  });
  root.replaceChildren();
  const sprite = section.ownerDocument.querySelector(".hmos-sprite");
  if (sprite) root.append(sprite.cloneNode(true));
  root.append(section);
}

function findWithin(root, selector) { return root.querySelector(selector); }

function reportModuleHeight(root, moduleId) {
  const frameWindow = root.ownerDocument.defaultView;
  if (!frameWindow || frameWindow.parent === frameWindow) return;
  const publish = () => {
    const height = Math.ceil(Math.max(root.scrollHeight, root.getBoundingClientRect().height));
    if (height > 0) frameWindow.parent.postMessage({ type: "text-to-ui:catalog-module-height", moduleId, height }, "*");
  };
  frameWindow.requestAnimationFrame(() => frameWindow.requestAnimationFrame(publish));
  if (typeof frameWindow.ResizeObserver === "function") {
    const observer = new frameWindow.ResizeObserver(publish);
    observer.observe(root);
  }
}

function hydrateDropdowns(root) {
  const dropdowns = [...root.querySelectorAll("[data-dropdown]")];
  const close = (dropdown, returnFocus = false) => {
    const trigger = dropdown.querySelector(".dropdown-trigger");
    const menu = dropdown.querySelector(".dropdown-menu");
    if (!trigger || !menu) return;
    trigger.setAttribute("aria-expanded", "false");
    menu.hidden = true;
    if (returnFocus) trigger.focus();
  };
  const closeOthers = (current) => dropdowns.forEach((dropdown) => { if (dropdown !== current) close(dropdown); });

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector(".dropdown-trigger");
    const menu = dropdown.querySelector(".dropdown-menu");
    const items = [...dropdown.querySelectorAll(".dropdown-menu-item")];
    if (!trigger || !menu || !items.length) return;
    items.forEach((item) => { item.tabIndex = -1; });
    const open = (focusIndex) => {
      closeOthers(dropdown);
      trigger.setAttribute("aria-expanded", "true");
      menu.hidden = false;
      if (Number.isInteger(focusIndex)) items[focusIndex]?.focus();
    };
    const commit = (item) => {
      const label = dropdown.querySelector("[data-dropdown-label]");
      if (dropdown.dataset.mode === "select" && label && item.dataset.value) label.textContent = item.dataset.value;
      close(dropdown, true);
    };
    trigger.addEventListener("click", () => trigger.getAttribute("aria-expanded") === "true" ? close(dropdown) : open());
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault(); open(event.key === "ArrowDown" ? 0 : items.length - 1);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault(); open(event.key === "Home" ? 0 : items.length - 1);
      } else if ((event.key === "Enter" || event.key === " ") && trigger.getAttribute("aria-expanded") !== "true") {
        event.preventDefault(); open(0);
      } else if (event.key === "Escape" && trigger.getAttribute("aria-expanded") === "true") {
        event.preventDefault(); close(dropdown, true);
      }
    });
    items.forEach((item, index) => {
      item.addEventListener("click", () => commit(item));
      item.addEventListener("keydown", (event) => {
        let nextIndex = index;
        if (event.key === "ArrowDown") nextIndex = (index + 1) % items.length;
        else if (event.key === "ArrowUp") nextIndex = (index - 1 + items.length) % items.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = items.length - 1;
        else if (event.key === "Escape") { event.preventDefault(); close(dropdown, true); return; }
        else return;
        event.preventDefault(); items[nextIndex].focus();
      });
    });
  });
  const closeWhenOutside = (event) => dropdowns.forEach((dropdown) => { if (!dropdown.contains(event.target)) close(dropdown); });
  root.ownerDocument.addEventListener("pointerdown", closeWhenOutside);
  root.ownerDocument.addEventListener("focusin", closeWhenOutside);
}

function hydrateDisclosure(root) {
  root.querySelectorAll("[data-accordion]").forEach((accordion) => {
    const triggers = [...accordion.querySelectorAll(".accordion-trigger")];
    const setOpen = (trigger, open) => {
      triggers.forEach((item) => {
        const panel = root.querySelector(`#${CSS.escape(item.getAttribute("aria-controls") || "")}`);
        const selected = item === trigger && open;
        item.setAttribute("aria-expanded", String(selected));
        if (panel) panel.hidden = !selected;
      });
    };
    triggers.forEach((trigger, index) => {
      trigger.addEventListener("click", () => setOpen(trigger, trigger.getAttribute("aria-expanded") !== "true"));
      trigger.addEventListener("keydown", (event) => {
        const next = { ArrowDown: (index + 1) % triggers.length, ArrowUp: (index - 1 + triggers.length) % triggers.length, Home: 0, End: triggers.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault(); triggers[next].focus();
      });
    });
  });
  root.querySelectorAll("[data-collapsible]").forEach((collapsible) => {
    const trigger = collapsible.querySelector(".collapsible-trigger");
    const panel = root.querySelector(`#${CSS.escape(trigger?.getAttribute("aria-controls") || "")}`);
    if (!trigger || !panel) return;
    trigger.addEventListener("click", () => {
      const opening = trigger.getAttribute("aria-expanded") !== "true";
      trigger.setAttribute("aria-expanded", String(opening)); panel.hidden = !opening;
    });
  });
}

function hydratePopovers(root) {
  const popovers = [...root.querySelectorAll("[data-popover]")];
  const close = (popover, returnFocus = false) => {
    const trigger = popover.querySelector("button[aria-controls]");
    const panel = root.querySelector(`#${CSS.escape(trigger?.getAttribute("aria-controls") || "")}`);
    if (!trigger || !panel) return;
    trigger.setAttribute("aria-expanded", "false"); panel.hidden = true;
    if (returnFocus) trigger.focus();
  };
  popovers.forEach((popover) => {
    const trigger = popover.querySelector("button[aria-controls]");
    const panel = root.querySelector(`#${CSS.escape(trigger?.getAttribute("aria-controls") || "")}`);
    if (!trigger || !panel) return;
    trigger.addEventListener("click", () => {
      const opening = trigger.getAttribute("aria-expanded") !== "true";
      trigger.setAttribute("aria-expanded", String(opening)); panel.hidden = !opening;
      if (opening) panel.querySelector("input, button, [tabindex]")?.focus();
    });
    panel.querySelector("[data-close-popover]")?.addEventListener("click", () => close(popover, true));
    popover.addEventListener("keydown", (event) => { if (event.key === "Escape" && !panel.hidden) { event.preventDefault(); close(popover, true); } });
  });
  const closeWhenOutside = (event) => popovers.forEach((popover) => { if (!popover.contains(event.target)) close(popover); });
  root.ownerDocument.addEventListener("pointerdown", closeWhenOutside);
  root.ownerDocument.addEventListener("focusin", closeWhenOutside);
}

function hydrateMenubars(root) {
  root.querySelectorAll(".menubar").forEach((bar) => {
    const triggers = [...bar.querySelectorAll(":scope > [role='menuitem']")];
    const menu = bar.querySelector(".menubar-popup");
    const commands = [...(menu?.querySelectorAll("[role='menuitem']") || [])];
    if (!menu || !triggers.length || !commands.length) return;
    const close = (returnFocus = false) => { menu.hidden = true; triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false")); if (returnFocus) triggers.find((trigger) => trigger.tabIndex === 0)?.focus(); };
    const open = (trigger) => { triggers.forEach((item) => item.setAttribute("aria-expanded", String(item === trigger))); menu.hidden = false; commands[0].focus(); };
    triggers.forEach((trigger, index) => {
      trigger.tabIndex = index === 0 ? 0 : -1;
      trigger.addEventListener("click", () => menu.hidden ? open(trigger) : close());
      trigger.addEventListener("keydown", (event) => {
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % triggers.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + triggers.length) % triggers.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = triggers.length - 1;
        else if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") { event.preventDefault(); open(trigger); return; }
        else if (event.key === "Escape") { event.preventDefault(); close(true); return; }
        else return;
        event.preventDefault(); triggers.forEach((item, itemIndex) => { item.tabIndex = itemIndex === next ? 0 : -1; }); triggers[next].focus();
      });
    });
    commands.forEach((command, index) => command.addEventListener("keydown", (event) => {
      const next = { ArrowDown: (index + 1) % commands.length, ArrowUp: (index - 1 + commands.length) % commands.length, Home: 0, End: commands.length - 1 }[event.key];
      if (event.key === "Escape") { event.preventDefault(); close(true); return; }
      if (next === undefined) return;
      event.preventDefault(); commands[next].focus();
    }));
    commands.forEach((command) => command.addEventListener("click", () => close(true)));
    const closeWhenOutside = (event) => { if (!bar.contains(event.target)) close(); };
    root.ownerDocument.addEventListener("pointerdown", closeWhenOutside);
    root.ownerDocument.addEventListener("focusin", closeWhenOutside);
  });
}

function hydrateContextMenus(root) {
  root.querySelectorAll("[data-context-target]").forEach((target) => {
    const host = target.closest("[data-component='Context Menu']");
    const menu = host?.querySelector(".context-menu");
    const items = [...(menu?.querySelectorAll("[role='menuitem']") || [])];
    if (!menu || !items.length) return;
    const close = (returnFocus = false) => { menu.hidden = true; if (returnFocus) target.focus(); };
    const openAt = (left, top) => {
      menu.style.left = `${Math.max(8, left)}px`;
      menu.style.top = `${Math.max(8, top)}px`;
      menu.hidden = false; items[0].focus();
    };
    target.addEventListener("contextmenu", (event) => { event.preventDefault(); openAt(event.clientX, event.clientY); });
    target.addEventListener("keydown", (event) => {
      if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
      event.preventDefault(); const rect = target.getBoundingClientRect(); openAt(rect.left + 24, rect.top + 24);
    });
    items.forEach((item, index) => {
      item.addEventListener("click", () => close(true));
      item.addEventListener("keydown", (event) => {
        const next = { ArrowDown: (index + 1) % items.length, ArrowUp: (index - 1 + items.length) % items.length, Home: 0, End: items.length - 1 }[event.key];
        if (event.key === "Escape") { event.preventDefault(); close(true); return; }
        if (next === undefined) return;
        event.preventDefault(); items[next].focus();
      });
    });
    root.ownerDocument.addEventListener("pointerdown", (event) => { if (!host.contains(event.target)) close(); });
  });
}

function hydrateLayers(root) {
  const layers = [...root.querySelectorAll(".component-layer")];
  let lastTrigger = null;
  const syncModalLock = () => root.ownerDocument.body.classList.toggle("has-modal-layer", layers.some((layer) => layer.classList.contains("open") && layer.querySelector("[aria-modal='true']")));
  const close = (layer, returnFocus = true) => {
    if (!layer) return;
    layer.classList.remove("open");
    layer.setAttribute("aria-hidden", "true");
    syncModalLock();
    if (returnFocus) lastTrigger?.focus();
  };
  const open = (layer, trigger) => {
    if (!layer) return;
    lastTrigger = trigger;
    layer.classList.add("open");
    layer.setAttribute("aria-hidden", "false");
    syncModalLock();
    layer.querySelector("input, [data-close-layer], button")?.focus();
  };
  root.querySelectorAll("[data-open-layer]").forEach((trigger) => trigger.addEventListener("click", () => open(root.querySelector(`#${CSS.escape(trigger.dataset.openLayer || "")}`), trigger)));
  root.querySelectorAll("[data-open-semi-modal]").forEach((trigger) => trigger.addEventListener("click", () => {
    const layer = root.querySelector("#semi-modal-layer");
    const panel = layer?.querySelector("[data-semi-modal-panel]");
    if (panel) {
      panel.classList.remove("modal-size-s", "modal-size-m", "modal-size-l", "modal-surface-white", "modal-surface-gray");
      panel.classList.add(`modal-size-${trigger.dataset.modalSize}`, `modal-surface-${trigger.dataset.modalSurface}`);
      panel.setAttribute("aria-modal", String(trigger.dataset.modalMode === "modal"));
    }
    open(layer, trigger);
  }));
  root.querySelectorAll("[data-close-layer], [data-confirm-layer]").forEach((trigger) => trigger.addEventListener("click", () => close(trigger.closest(".component-layer"))));
  layers.forEach((layer) => layer.addEventListener("click", (event) => {
    if (event.target === layer && layer.dataset.dismissOutside === "true") close(layer);
  }));
  root.ownerDocument.addEventListener("keydown", (event) => {
    const activeLayer = layers.find((layer) => layer.classList.contains("open"));
    if (event.key === "Escape" && activeLayer) { event.preventDefault(); close(activeLayer); return; }
    if (event.key !== "Tab" || !activeLayer?.querySelector("[aria-modal='true']")) return;
    const focusable = [...activeLayer.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])")].filter((node) => !node.hidden);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && root.ownerDocument.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && root.ownerDocument.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}

function hydrateFeedback(root) {
  const toast = root.querySelector("#toast"); let timer;
  const show = (message) => { if (!toast) return; toast.textContent = message; toast.classList.add("show"); clearTimeout(timer); timer = setTimeout(() => toast.classList.remove("show"), 2400); };
  root.querySelectorAll("[data-alert-action]").forEach((button) => button.addEventListener("click", () => show(button.dataset.alertAction)));
  root.querySelectorAll("[data-dismiss-alert]").forEach((button) => button.addEventListener("click", () => button.closest(".alert")?.remove()));
  root.querySelector("#show-toast")?.addEventListener("click", () => show("设置已保存"));
}

function hydrateTooltips(root) {
  root.querySelectorAll("[data-tooltip]").forEach((tooltipRoot) => {
    const trigger = tooltipRoot.querySelector("button, [role='button'], [tabindex]");
    const tooltip = tooltipRoot.querySelector(".tooltip");
    if (!trigger || !tooltip) return;
    let timer;
    const hide = () => {
      clearTimeout(timer);
      tooltip.classList.remove("is-visible");
    };
    const show = () => {
      if (trigger.disabled) return;
      clearTimeout(timer);
      timer = setTimeout(() => tooltip.classList.add("is-visible"), 300);
    };
    tooltipRoot.addEventListener("mouseenter", show);
    tooltipRoot.addEventListener("mouseleave", hide);
    tooltipRoot.addEventListener("focusin", show);
    tooltipRoot.addEventListener("focusout", hide);
    tooltipRoot.addEventListener("keydown", (event) => {
      if (event.key === "Escape") hide();
    });
  });
}

function hydrateAttachments(root) {
  root.querySelectorAll(".attachment input[type='file']").forEach((input) => input.addEventListener("change", () => {
    const label = input.closest(".attachment")?.querySelector("[data-file-label]");
    if (label) label.textContent = input.files?.length ? `已选择 ${input.files.length} 个文件` : "支持图片、PDF 和压缩包";
  }));
}

function hydrateComposites(root) {
  root.querySelectorAll("[data-combobox]").forEach((box) => {
    const trigger = box.querySelector(".combobox-trigger"), panel = box.querySelector(".combobox-panel"), search = box.querySelector("[data-combobox-search]"), value = box.querySelector("[data-combobox-value]"), options = [...box.querySelectorAll("[role='option']")];
    if (!trigger || !panel || !search || !value) return;
    let activeIndex = Math.max(0, options.findIndex((option) => option.getAttribute("aria-selected") === "true"));
    const visibleOptions = () => options.filter((option) => !option.hidden);
    const setActive = (option) => {
      if (!option) return;
      activeIndex = options.indexOf(option);
      options.forEach((item) => item.classList.toggle("is-active", item === option));
      option.scrollIntoView({ block: "nearest" });
    };
    const close = (focus = false) => { trigger.setAttribute("aria-expanded", "false"); panel.hidden = true; search.value = ""; options.forEach((option) => { option.hidden = false; option.classList.remove("is-active"); }); if (focus) trigger.focus(); };
    const open = (focusSearch = true) => { trigger.setAttribute("aria-expanded", "true"); panel.hidden = false; setActive(options[activeIndex] || options[0]); if (focusSearch) search.focus(); };
    const commit = (option) => { if (!option) return; value.textContent = option.dataset.value || option.textContent; options.forEach((item) => item.setAttribute("aria-selected", String(item === option))); setActive(option); close(true); };
    trigger.addEventListener("click", () => panel.hidden ? open() : close());
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); open(false); const visible = visibleOptions(); setActive(visible[event.key === "ArrowDown" ? 0 : visible.length - 1]); visible[event.key === "ArrowDown" ? 0 : visible.length - 1]?.focus(); }
      else if ((event.key === "Enter" || event.key === " ") && panel.hidden) { event.preventDefault(); open(); }
      else if (event.key === "Escape" && !panel.hidden) { event.preventDefault(); close(true); }
    });
    search.addEventListener("input", () => { options.forEach((option) => option.hidden = !option.textContent.includes(search.value)); setActive(visibleOptions()[0]); });
    search.addEventListener("keydown", (event) => {
      const visible = visibleOptions();
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); const current = Math.max(0, visible.indexOf(options[activeIndex])); const next = (current + (event.key === "ArrowDown" ? 1 : -1) + visible.length) % visible.length; setActive(visible[next]); visible[next]?.focus(); }
      else if (event.key === "Enter") { event.preventDefault(); commit(options[activeIndex]); }
    });
    options.forEach((option) => {
      option.tabIndex = -1;
      option.addEventListener("click", () => commit(option));
      option.addEventListener("keydown", (event) => {
        const visible = visibleOptions(); const current = visible.indexOf(option);
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); commit(option); return; }
        if (event.key === "Escape") { event.preventDefault(); close(true); return; }
        const next = { ArrowDown: (current + 1) % visible.length, ArrowUp: (current - 1 + visible.length) % visible.length, Home: 0, End: visible.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault(); setActive(visible[next]); visible[next]?.focus();
      });
    });
    box.addEventListener("keydown", (event) => { if (event.key === "Escape" && !panel.hidden) { event.preventDefault(); close(true); } });
    root.ownerDocument.addEventListener("pointerdown", (event) => { if (!box.contains(event.target)) close(); });
  });
  root.querySelectorAll(".otp").forEach((otp) => {
    const inputs = [...otp.querySelectorAll("input")];
    inputs.forEach((input, index) => {
      input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, "").slice(0, 1); if (input.value) inputs[index + 1]?.focus(); });
      input.addEventListener("keydown", (event) => { if (event.key === "Backspace" && !input.value) inputs[index - 1]?.focus(); });
      input.addEventListener("paste", (event) => { const digits = event.clipboardData?.getData("text").replace(/\D/g, "").slice(0, inputs.length) || ""; if (!digits) return; event.preventDefault(); [...digits].forEach((digit, digitIndex) => { inputs[index + digitIndex] && (inputs[index + digitIndex].value = digit); }); inputs[Math.min(inputs.length - 1, index + digits.length)]?.focus(); });
    });
  });
  root.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const slides = [...carousel.querySelectorAll(".carousel-slide")]; let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));
    const show = (next) => { index = (next + slides.length) % slides.length; slides.forEach((slide, itemIndex) => slide.classList.toggle("active", itemIndex === index)); };
    carousel.querySelector("button[aria-label='上一张']")?.addEventListener("click", () => show(index - 1));
    carousel.querySelector("button[aria-label='下一张']")?.addEventListener("click", () => show(index + 1));
  });
}

function hydrateNavigationControls(root) {
  root.querySelectorAll("[data-tabs]").forEach((tabsRoot) => {
    const tabs = [...tabsRoot.querySelectorAll("[role='tab']:not([disabled])")];
    const activate = (tab, focus = false) => { tabs.forEach((item) => { const selected = item === tab; item.setAttribute("aria-selected", String(selected)); item.tabIndex = selected ? 0 : -1; const panel = tabsRoot.querySelector(`#${CSS.escape(item.getAttribute("aria-controls") || "")}`); if (panel) panel.hidden = !selected; }); if (focus) tab.focus(); };
    const orientation = tabsRoot.dataset.orientation || "horizontal";
    const manual = tabsRoot.dataset.activation === "manual";
    tabs.forEach((tab, index) => { tab.addEventListener("click", () => activate(tab)); tab.addEventListener("keydown", (event) => {
      const next = orientation === "vertical"
        ? { ArrowDown: (index + 1) % tabs.length, ArrowUp: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key]
        : { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(tab); return; }
      if (next === undefined) return;
      event.preventDefault();
      if (manual) tabs[next].focus(); else activate(tabs[next], true);
    }); });
  });
  root.querySelectorAll(".pagination").forEach((pagination) => {
    const pages = [...pagination.querySelectorAll(".pagination-item:not([aria-label])")];
    const previous = pagination.querySelector(".pagination-item[aria-label='上一页']");
    const next = pagination.querySelector(".pagination-item[aria-label='下一页']");
    const activate = (page) => { if (!page) return; pages.forEach((candidate) => candidate.toggleAttribute("aria-current", candidate === page)); const index = pages.indexOf(page); if (previous) previous.disabled = index === 0; if (next) next.disabled = index === pages.length - 1; };
    pages.forEach((page) => page.addEventListener("click", () => activate(page)));
    previous?.addEventListener("click", () => activate(pages[Math.max(0, pages.findIndex((page) => page.hasAttribute("aria-current")) - 1)]));
    next?.addEventListener("click", () => activate(pages[Math.min(pages.length - 1, pages.findIndex((page) => page.hasAttribute("aria-current")) + 1)]));
  });
  root.querySelectorAll(".gallery-sidebar-nav").forEach((navigation) => {
    const items = [...navigation.querySelectorAll("button:not([disabled])")];
    const activate = (item, focus = false) => {
      items.forEach((candidate) => {
        const selected = candidate === item;
        candidate.dataset.state = selected ? "selected" : "default";
        candidate.toggleAttribute("aria-current", selected);
        candidate.tabIndex = selected ? 0 : -1;
      });
      if (focus) item.focus();
    };
    items.forEach((item, index) => {
      item.addEventListener("click", () => activate(item));
      item.addEventListener("keydown", (event) => {
        const next = { ArrowDown: (index + 1) % items.length, ArrowUp: (index - 1 + items.length) % items.length, Home: 0, End: items.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault(); activate(items[next], true);
      });
    });
  });
}

function hydrateCalendar(root) {
  const pad = (value) => String(value).padStart(2, "0");
  root.querySelectorAll("[data-calendar]").forEach((calendar) => {
    const monthLabel = calendar.querySelector(".calendar-head strong");
    const days = calendar.querySelector(".calendar-grid.days");
    const previous = calendar.querySelector(".calendar-head button[aria-label='上个月']");
    const next = calendar.querySelector(".calendar-head button[aria-label='下个月']");
    if (!monthLabel || !days) return;
    const match = monthLabel.textContent.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/);
    let selected = new Date(match?.[1] ?? 2026, Number(match?.[2] ?? 7) - 1, 13);
    let view = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const render = () => {
      monthLabel.textContent = `${view.getFullYear()} 年 ${view.getMonth() + 1} 月`;
      days.replaceChildren();
      const start = new Date(view.getFullYear(), view.getMonth(), 1 - new Date(view.getFullYear(), view.getMonth(), 1).getDay());
      for (let index = 0; index < 42; index += 1) {
        const date = new Date(start); date.setDate(start.getDate() + index);
        const day = root.ownerDocument.createElement("button");
        day.type = "button"; day.textContent = String(date.getDate()); day.dataset.date = iso(date);
        day.setAttribute("aria-pressed", String(iso(date) === iso(selected)));
        if (date.getMonth() !== view.getMonth()) day.classList.add("outside");
        if (iso(date) === iso(selected)) day.classList.add("selected");
        day.addEventListener("click", () => { selected = date; view = new Date(date.getFullYear(), date.getMonth(), 1); render(); });
        days.append(day);
      }
    };
    previous?.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
    next?.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });
    calendar.addEventListener("keydown", (event) => {
      const active = root.ownerDocument.activeElement;
      if (!active?.dataset.date) return;
      const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7, Home: -((new Date(`${active.dataset.date}T00:00:00`).getDay())), End: 6 - new Date(`${active.dataset.date}T00:00:00`).getDay() }[event.key];
      if (delta === undefined) return;
      event.preventDefault();
      const date = new Date(`${active.dataset.date}T00:00:00`); date.setDate(date.getDate() + delta);
      if (date.getMonth() !== view.getMonth()) view = new Date(date.getFullYear(), date.getMonth(), 1);
      render(); days.querySelector(`[data-date='${iso(date)}']`)?.focus();
    });
    render();
  });
}

function hydrateDateTimePickers(root) {
  const pad = (value) => String(value).padStart(2, "0");
  root.querySelectorAll("[data-date-picker]").forEach((picker) => {
    const trigger = picker.querySelector(".date-picker-trigger"), panel = picker.querySelector(".date-picker-panel"), days = picker.querySelector("[data-date-days]"), month = picker.querySelector("[data-date-month]"), value = picker.querySelector("[data-date-value]"), input = picker.querySelector("[data-date-input]");
    if (!trigger || !panel || !days || !month || !value || !input) return;
    let selected = input.value ? new Date(`${input.value}T00:00:00`) : null, view = selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date();
    const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const label = (date) => `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日`;
    const close = (focus = false) => { trigger.setAttribute("aria-expanded", "false"); panel.hidden = true; if (focus) trigger.focus(); };
    const render = () => { month.textContent = `${view.getFullYear()}年${pad(view.getMonth() + 1)}月`; days.replaceChildren(); const start = new Date(view.getFullYear(), view.getMonth(), 1 - new Date(view.getFullYear(), view.getMonth(), 1).getDay()); for (let index = 0; index < 42; index += 1) { const date = new Date(start); date.setDate(start.getDate() + index); const day = document.createElement("button"); day.type = "button"; day.className = "date-picker-day"; day.textContent = String(date.getDate()); day.dataset.date = iso(date); day.setAttribute("role", "gridcell"); day.setAttribute("aria-selected", String(selected && iso(date) === iso(selected))); if (date.getMonth() !== view.getMonth()) day.classList.add("outside"); if (selected && iso(date) === iso(selected)) day.classList.add("selected"); day.addEventListener("click", () => { selected = date; input.value = iso(date); value.textContent = label(date); close(true); }); days.append(day); } };
    const open = () => { render(); trigger.setAttribute("aria-expanded", "true"); panel.hidden = false; (days.querySelector(".selected") || days.querySelector("button"))?.focus(); };
    trigger.addEventListener("click", () => panel.hidden ? open() : close());
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") { event.preventDefault(); if (panel.hidden) open(); }
      else if (event.key === "Escape" && !panel.hidden) { event.preventDefault(); close(true); }
    });
    picker.querySelector("[data-date-previous]")?.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
    picker.querySelector("[data-date-next]")?.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });
    picker.querySelector("[data-date-clear]")?.addEventListener("click", () => { selected = null; input.value = ""; value.textContent = "选择日期"; close(true); });
    picker.querySelector("[data-date-today]")?.addEventListener("click", () => { selected = new Date(); view = new Date(selected.getFullYear(), selected.getMonth(), 1); input.value = iso(selected); value.textContent = label(selected); close(true); });
    picker.addEventListener("keydown", (event) => { if (event.key === "Escape" && !panel.hidden) { event.preventDefault(); close(true); return; } const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[event.key]; const active = root.ownerDocument.activeElement; if (!delta || !active?.classList.contains("date-picker-day")) return; event.preventDefault(); const date = new Date(`${active.dataset.date}T00:00:00`); date.setDate(date.getDate() + delta); if (date.getMonth() !== view.getMonth()) view = new Date(date.getFullYear(), date.getMonth(), 1); render(); days.querySelector(`[data-date='${iso(date)}']`)?.focus(); });
    root.ownerDocument.addEventListener("pointerdown", (event) => { if (!picker.contains(event.target)) close(); }); render();
  });
  root.querySelectorAll("[data-time-picker]").forEach((picker) => {
    const trigger = picker.querySelector(".time-picker-trigger"), panel = picker.querySelector(".time-picker-panel"), value = picker.querySelector("[data-time-value]"), input = picker.querySelector("[data-time-input]"), hours = picker.querySelector("[data-time-hours]"), minutes = picker.querySelector("[data-time-minutes]");
    if (!trigger || !panel || !value || !input || !hours || !minutes) return;
    let draft = input.value || "09:30";
    const make = (list, values, unit) => values.forEach((number) => { const option = document.createElement("button"); option.type = "button"; option.className = "time-picker-option"; option.textContent = pad(number); option.dataset.unit = unit; option.dataset.value = String(number); option.setAttribute("role", "option"); option.tabIndex = -1; option.addEventListener("click", () => { const [hour, minute] = draft.split(":"); draft = unit === "hour" ? `${pad(number)}:${minute}` : `${hour}:${pad(number)}`; sync(); }); list.append(option); });
    make(hours, Array.from({ length: 24 }, (_, index) => index), "hour"); make(minutes, Array.from({ length: 12 }, (_, index) => index * 5), "minute");
    const sync = () => { const [hour, minute] = draft.split(":"); picker.querySelectorAll(".time-picker-option").forEach((option) => { const selected = option.dataset.unit === "hour" ? option.dataset.value === String(Number(hour)) : option.dataset.value === String(Number(minute)); option.classList.toggle("selected", selected); option.setAttribute("aria-selected", String(selected)); }); };
    const close = (focus = false) => { trigger.setAttribute("aria-expanded", "false"); panel.hidden = true; if (focus) trigger.focus(); };
    const open = () => { draft = input.value || "09:30"; sync(); trigger.setAttribute("aria-expanded", "true"); panel.hidden = false; const [hour] = draft.split(":"); hours.querySelector(`[data-value='${Number(hour)}']`)?.focus(); };
    trigger.addEventListener("click", () => panel.hidden ? open() : close());
    trigger.addEventListener("keydown", (event) => { if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") { event.preventDefault(); if (panel.hidden) open(); } else if (event.key === "Escape" && !panel.hidden) { event.preventDefault(); close(true); } });
    picker.querySelector("[data-time-confirm]")?.addEventListener("click", () => { input.value = draft; value.textContent = draft; close(true); });
    picker.querySelector("[data-time-clear]")?.addEventListener("click", () => { input.value = ""; value.textContent = "选择时间"; close(true); });
    picker.querySelector("[data-time-now]")?.addEventListener("click", () => { const now = new Date(); draft = `${pad(now.getHours())}:${pad(Math.floor(now.getMinutes() / 5) * 5)}`; sync(); });
    picker.addEventListener("keydown", (event) => { if (event.key === "Escape" && !panel.hidden) { event.preventDefault(); close(true); return; } const active = root.ownerDocument.activeElement; if (!active?.classList.contains("time-picker-option")) return; const list = active.closest(".time-picker-list"), options = [...list.querySelectorAll(".time-picker-option")], index = options.indexOf(active); const next = { ArrowDown: Math.min(options.length - 1, index + 1), ArrowUp: Math.max(0, index - 1), Home: 0, End: options.length - 1 }[event.key]; if (next === undefined) return; event.preventDefault(); options[next].focus(); options[next].click(); });
    root.ownerDocument.addEventListener("pointerdown", (event) => { if (!picker.contains(event.target)) close(); }); sync();
  });
}

function hydrateSelects(root) {
  const selects = [...root.querySelectorAll("[data-select]")];

  const closeSelect = (select, returnFocus = false) => {
    const trigger = select.querySelector(".select-trigger");
    const listbox = select.querySelector(".select-listbox");
    if (!trigger || !listbox) return;
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-activedescendant");
    listbox.hidden = true;
    select.querySelectorAll(".select-option").forEach((option) => option.classList.remove("is-active"));
    if (returnFocus) trigger.focus();
  };

  const closeOtherSelects = (except) => {
    selects.forEach((select) => { if (select !== except) closeSelect(select); });
  };

  selects.forEach((select, selectIndex) => {
    const trigger = select.querySelector(".select-trigger");
    const listbox = select.querySelector(".select-listbox");
    const options = [...select.querySelectorAll(".select-option")];
    if (!trigger || !listbox || options.length === 0) return;
    let activeIndex = Math.max(0, options.findIndex((option) => option.getAttribute("aria-selected") === "true"));

    options.forEach((option, optionIndex) => {
      option.id ||= `catalog-select-${selectIndex}-option-${optionIndex}`;
      option.tabIndex = -1;
    });

    const setActive = (index) => {
      activeIndex = (index + options.length) % options.length;
      options.forEach((option, optionIndex) => option.classList.toggle("is-active", optionIndex === activeIndex));
      trigger.setAttribute("aria-activedescendant", options[activeIndex].id);
      options[activeIndex].scrollIntoView({ block: "nearest" });
    };

    const openSelect = (initialIndex = activeIndex) => {
      closeOtherSelects(select);
      trigger.setAttribute("aria-expanded", "true");
      listbox.hidden = false;
      setActive(initialIndex);
    };

    const commitOption = (option) => {
      const value = select.querySelector("[data-select-value]");
      if (value) value.textContent = option.dataset.value || option.textContent;
      options.forEach((item) => item.setAttribute("aria-selected", String(item === option)));
      activeIndex = options.indexOf(option);
      closeSelect(select, true);
    };

    trigger.addEventListener("click", () => {
      if (trigger.getAttribute("aria-expanded") === "true") closeSelect(select);
      else openSelect();
    });

    trigger.addEventListener("keydown", (event) => {
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!isOpen) openSelect(event.key === "ArrowDown" ? activeIndex : options.length - 1);
        else setActive(activeIndex + (event.key === "ArrowDown" ? 1 : -1));
      } else if (event.key === "Home" && isOpen) {
        event.preventDefault();
        setActive(0);
      } else if (event.key === "End" && isOpen) {
        event.preventDefault();
        setActive(options.length - 1);
      } else if ((event.key === "Enter" || event.key === " ") && isOpen) {
        event.preventDefault();
        commitOption(options[activeIndex]);
      } else if ((event.key === "Enter" || event.key === " ") && !isOpen) {
        event.preventDefault();
        openSelect();
      } else if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        closeSelect(select, true);
      }
    });

    options.forEach((option, optionIndex) => {
      option.addEventListener("mouseenter", () => setActive(optionIndex));
      option.addEventListener("click", () => commitOption(option));
    });
  });

  const closeWhenOutside = (event) => {
    if (selects.some((select) => select.contains(event.target))) return;
    selects.forEach((select) => closeSelect(select));
  };
  root.ownerDocument.addEventListener("pointerdown", closeWhenOutside);
  root.ownerDocument.addEventListener("focusin", closeWhenOutside);
}

export async function mountCatalogModule(root, moduleId, framework) {
  const definition = moduleDefinitions[moduleId];
  if (!definition) throw new Error(`未知组件模块：${moduleId}`);
  const sourceDocument = await getSourceDocument();
  const section = sourceDocument.querySelector(`#${CSS.escape(moduleId)}`)?.cloneNode(true);
  if (!section) throw new Error(`组件源中缺少模块：${moduleId}`);
  if (moduleId === "overlays") {
    sourceDocument.querySelectorAll("[data-catalog-overlay-layer]").forEach((layer) => section.append(layer.cloneNode(true)));
  }
  if (moduleId === "feedback") {
    sourceDocument.querySelectorAll("[data-catalog-feedback-layer]").forEach((layer) => section.append(layer.cloneNode(true)));
  }
  normalizeModule(section, root);
  root.dataset.component = definition.logicalName;
  root.dataset.framework = framework;
  root.dataset.state = "ready";
  const status = document.createElement("span");
  status.dataset.moduleStatus = "";
  status.setAttribute("aria-live", "polite");
  status.textContent = `${framework} ${definition.label}组件模块已加载`;
  root.append(status);
  hydrateCatalogModule(root);
  reportModuleHeight(root, moduleId);
  return definition;
}

export function hydrateCatalogModule(root) {
  if (root.dataset.hydrated === "true") return;
  root.dataset.hydrated = "true";
  hydrateSelects(root);
  hydrateDropdowns(root);
  hydrateDisclosure(root);
  hydratePopovers(root);
  hydrateMenubars(root);
  hydrateContextMenus(root);
  hydrateLayers(root);
  hydrateComposites(root);
  hydrateNavigationControls(root);
  hydrateCalendar(root);
  hydrateDateTimePickers(root);
  hydrateFeedback(root);
  hydrateTooltips(root);
  hydrateAttachments(root);
  root.addEventListener("input", (event) => {
    const input = event.target.closest?.("[data-search-input]");
    if (!input) return;
    const clear = input.closest(".search-shell")?.querySelector("[data-search-clear]");
    if (clear) clear.hidden = input.value.length === 0;
    const output = input.closest(".range-field")?.querySelector("output");
    if (output) output.value = `${input.value}%`;
  });
  root.addEventListener("click", (event) => {
    const target = event.target.closest?.("button, [role='tab']");
    if (!target || !root.contains(target) || target.disabled) return;
    if (target.matches("[data-search-clear]")) {
      const input = target.closest(".search-shell")?.querySelector("[data-search-input]");
      if (input) { input.value = ""; target.hidden = true; input.focus(); }
      return;
    }
    if (target.matches(".switch")) { target.setAttribute("aria-checked", String(target.getAttribute("aria-checked") !== "true")); return; }
    if (target.matches(".toggle-btn")) { target.setAttribute("aria-pressed", String(target.getAttribute("aria-pressed") !== "true")); return; }
    if (target.matches(".calendar .days button")) {
      target.closest(".days")?.querySelectorAll("button").forEach((day) => { day.classList.toggle("selected", day === target); day.setAttribute("aria-pressed", String(day === target)); });
      return;
    }
    if (target.matches(".carousel > button")) {
      const carousel = target.closest(".carousel");
      const slides = [...(carousel?.querySelectorAll(".carousel-slide") || [])];
      const current = Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));
      const next = target.getAttribute("aria-label") === "下一张" ? (current + 1) % slides.length : (current - 1 + slides.length) % slides.length;
      slides.forEach((slide, index) => slide.classList.toggle("active", index === next));
      return;
    }
    if (target.matches("[data-dismiss-alert], .alert-close")) { target.closest(".alert")?.remove(); return; }
    if (target.matches(".pagination-item:not([aria-label])")) {
      target.closest(".pagination")?.querySelectorAll(".pagination-item:not([aria-label])").forEach((item) => item.toggleAttribute("aria-current", item === target));
      return;
    }
  });
}

export { moduleDefinitions };
