(function mountFrameworkComponentPreviews(document, registry) {
  "use strict";

  const routes = Object.freeze({
    react: "./framework-component-contract/runtime/react.html",
    vue: "./framework-component-contract/runtime/vue.html",
    html: "./framework-component-contract/html/component-playground.html"
  });
  const frameworkLabels = Object.freeze({ react: "React", vue: "Vue", html: "HTML" });
  const rootStyle = getComputedStyle(document.documentElement);
  const previewVersion = new URL(window.location.href).searchParams.get("v") || "current";
  const minOverlayWidth = Number.parseFloat(rootStyle.getPropertyValue("--width-modal-md"));
  const collisionGap = Number.parseFloat(rootStyle.getPropertyValue("--space-4"));

  function notifyFrameworkLoaded(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function createFrameworkControl(componentKey, framework) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `framework-${componentKey}`;
    input.value = framework;
    input.checked = framework === "react";
    label.append(input, document.createTextNode(frameworkLabels[framework]));
    return label;
  }

  // A framework selector is a promise that the *whole visible module* is
  // implemented in each framework.  Register a module host before scanning
  // the older, component-level slots so nested legacy slots do not create
  // competing previews inside a module that is already covered as a whole.
  function installRegisteredModuleSlots() {
    Object.entries(registry || {}).forEach(([componentKey, contract]) => {
      if (contract.coverageScope !== "module" || !contract.hostSelector) return;
      const host = document.querySelector(contract.hostSelector);
      if (!host || host.querySelector(":scope > .framework-adapter-slot")) return;

      const slot = document.createElement("div");
      slot.className = "framework-adapter-slot";
      slot.dataset.frameworkComponent = componentKey;

      const nativeSurface = document.createElement("div");
      nativeSurface.className = "framework-native-surface";
      while (host.firstChild) nativeSurface.append(host.firstChild);
      host.append(slot, nativeSurface);
    });
  }

  installRegisteredModuleSlots();

  document.querySelectorAll("[data-framework-component]").forEach((slot) => {
    // This slot is inside a module that owns framework coverage.  The module
    // adapter replaces it as part of its source rendering; mounting a second
    // control here would falsely suggest an independent implementation.
    if (slot.closest(".framework-native-surface")?.closest(".framework-module-card")) return;
    const componentKey = slot.dataset.frameworkComponent;
    const contract = registry?.[componentKey];
    if (!contract) {
      slot.dataset.frameworkState = "missing-contract";
      slot.textContent = `缺少组件预览注册：${componentKey}`;
      return;
    }

    const switcher = document.createElement("fieldset");
    switcher.className = "framework-adapter-switch";
    const legend = document.createElement("legend");
    legend.textContent = "开发框架";
    switcher.append(legend);
    Object.keys(routes).forEach((framework) => switcher.append(createFrameworkControl(componentKey, framework)));

    const isModuleCoverage = contract.coverageScope === "module";
    const frame = document.createElement("iframe");
    frame.className = isModuleCoverage ? "framework-adapter-frame" : "framework-adapter-probe";
    frame.title = contract.frameTitle;
    frame.loading = "eager";
    frame.tabIndex = -1;

    const status = document.createElement("span");
    status.className = "sr-only";
    status.setAttribute("aria-live", "polite");
    status.textContent = `${contract.logicalName} 当前使用 React 实现`;

    const host = slot.closest(".panel, .field-demo, .component-sample, .section");
    const nativeSurface = isModuleCoverage ? host?.querySelector(":scope > .framework-native-surface") : null;
    host?.classList.add("framework-module-card");
    let currentFramework = "react";
    let announceOnLoad = false;
    let frameResizeObserver = null;

    const updatePlacement = () => {
      if (!host) return;
      slot.dataset.frameworkPlacement = "overlay";
      const collisionTarget = host.matches(".section")
        ? null
        : host.matches(".button-matrix")
        ? host.querySelector(".button-size-title")
        : host.matches(".field-demo")
          ? host.querySelector(":scope > .section-head")
          : host.matches(".component-sample")
            ? host.querySelector(":scope > header")
            : host.querySelector(".tabs-demo-head");
      const slotRect = slot.getBoundingClientRect();
      const contentRange = collisionTarget ? document.createRange() : null;
      contentRange?.selectNodeContents(collisionTarget);
      const contentRect = contentRange?.getBoundingClientRect();
      const widthBlocked = Number.isFinite(minOverlayWidth) && host.clientWidth < minOverlayWidth;
      const contentBlocked = contentRect && contentRect.width > 0 && contentRect.right + (collisionGap || 0) > slotRect.left;
      if (widthBlocked || contentBlocked) slot.dataset.frameworkPlacement = "stacked";
      contentRange?.detach();
    };

    let lastObservedWidth = -1;
    if (host && typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(([entry]) => {
        const width = Math.round(entry.contentRect.width);
        if (width === lastObservedWidth) return;
        lastObservedWidth = width;
        updatePlacement();
      });
      observer.observe(host);
    } else {
      window.addEventListener("resize", updatePlacement);
    }

    const selectFramework = (framework, announce = true) => {
      frameResizeObserver?.disconnect();
      frameResizeObserver = null;
      currentFramework = framework;
      announceOnLoad = announce;
      slot.dataset.framework = framework;
      slot.dataset.frameworkState = "loading";
      if (host) host.dataset.framework = framework;
      status.textContent = `${contract.logicalName} 正在加载 ${frameworkLabels[framework]} 实现`;
      const query = new URLSearchParams({
        component: contract.runtimeKey,
        v: previewVersion
      });
      if (contract.moduleId) query.set("module", contract.moduleId);
      const htmlRoute = contract.htmlRoute || (contract.runtimeKey === "catalog-module"
        ? "./framework-component-contract/html/catalog-module.html"
        : routes.html);
      frame.src = framework === "html"
        ? `${htmlRoute}?${query}`
        : `${routes[framework]}?${query}`;
    };

    const setModuleFrameHeight = (height) => {
      if (!isModuleCoverage || !Number.isFinite(height) || height <= 0) return;
      frame.style.height = `${Math.ceil(height)}px`;
    };

    const syncModuleFrameHeight = () => {
      if (!isModuleCoverage) return;
      try {
        const frameDocument = frame.contentDocument;
        const moduleRoot = frameDocument.querySelector(".framework-catalog-module");
        const height = Math.max(
          moduleRoot?.scrollHeight || 0,
          moduleRoot?.getBoundingClientRect().height || 0,
          frameDocument.documentElement.scrollHeight,
          frameDocument.body?.scrollHeight || 0
        );
        setModuleFrameHeight(height);
      } catch {
        slot.dataset.frameworkState = "height-unavailable";
      }
    };

    const observeModuleFrame = () => {
      if (!isModuleCoverage) return;
      try {
        const frameDocument = frame.contentDocument;
        const frameWindow = frame.contentWindow;
        if (!frameDocument?.documentElement || !frameDocument.body || !frameWindow) return;
        if (typeof frameWindow.ResizeObserver === "function") {
          frameResizeObserver = new frameWindow.ResizeObserver(syncModuleFrameHeight);
          frameResizeObserver.observe(frameDocument.documentElement);
          frameResizeObserver.observe(frameDocument.body);
        }
      } catch {
        slot.dataset.frameworkState = "size-observer-unavailable";
      }
    };

    frame.addEventListener("load", () => {
      observeModuleFrame();
      syncModuleFrameHeight();
      window.setTimeout(syncModuleFrameHeight, 80);
      if (nativeSurface) nativeSurface.hidden = true;
      frame.hidden = false;
      slot.dataset.frameworkState = "ready";
      const loadedLabel = frameworkLabels[currentFramework];
      status.textContent = `${contract.logicalName} 已切换到 ${loadedLabel} 实现`;
      slot.title = `当前：${loadedLabel} 实现`;
      if (announceOnLoad) notifyFrameworkLoaded(`已切换到 ${loadedLabel} 实现`);
      announceOnLoad = false;
    });

    window.addEventListener("message", (event) => {
      if (event.source !== frame.contentWindow || event.data?.type !== "text-to-ui:catalog-module-height") return;
      setModuleFrameHeight(event.data.height);
    });

    switcher.addEventListener("change", (event) => {
      const framework = event.target.value;
      if (!routes[framework]) return;
      selectFramework(framework);
    });

    if (isModuleCoverage && host) {
      frame.hidden = true;
      slot.replaceChildren(switcher, status);
      host.append(frame);
    } else {
      slot.replaceChildren(switcher, frame, status);
    }
    selectFramework("react", false);
    updatePlacement();
  });
})(document, window.TEXT_TO_UI_FRAMEWORK_COMPONENTS);
