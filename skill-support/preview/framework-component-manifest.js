(function registerFrameworkComponentPreviews(global) {
  global.TEXT_TO_UI_FRAMEWORK_COMPONENTS = Object.freeze({
    button: Object.freeze({
      logicalName: "Button/Module/Complete",
      coverageScope: "module",
      hostSelector: "#buttons",
      moduleId: "buttons",
      coverageLogicalNames: Object.freeze([
        "Button/Primary/Default", "Button/Secondary/Default", "Button/Ghost/Default", "Button/Danger/Default",
        "Button/Icon Text/Default", "Button/Icon/Default", "Button/Selection Dropdown/Default", "Button/Split Dropdown/Default"
      ]),
      states: "Standard · Small · Default · Hover · Pressed · Focus · Disabled · Open · Selected",
      runtimeKey: "catalog-module",
      frameTitle: "Button 完整模块真实组件"
    }),
    search: Object.freeze({
      logicalName: "Search/White Surface/Default",
      states: "Default · Hover · Focus · Value · Clear",
      runtimeKey: "search",
      frameTitle: "Search 真实组件"
    }),
    sidebar: Object.freeze({
      logicalName: "Sidebar Item/Default",
      states: "Default · Hover · Pressed · Focus · Selected",
      runtimeKey: "sidebar",
      frameTitle: "Sidebar Item 真实组件"
    }),
    list: Object.freeze({
      logicalName: "List Item/White Surface/Default",
      states: "Default · Hover · Pressed · Focus · Selected",
      runtimeKey: "list",
      frameTitle: "List Item 真实组件"
    }),
    titlebars: Object.freeze({
      logicalName: "Titlebar/Module/Complete", coverageScope: "module", hostSelector: "#titlebars", runtimeKey: "catalog-module", moduleId: "titlebars", frameTitle: "Titlebar 完整模块真实组件",
      coverageLogicalNames: Object.freeze(["Titlebar"])
    }),
    fields: Object.freeze({
      logicalName: "Field Controls/Module/Complete", coverageScope: "module", hostSelector: "#fields", runtimeKey: "catalog-module", moduleId: "fields", frameTitle: "输入与选择完整模块真实组件",
      coverageLogicalNames: Object.freeze(["Input", "Search", "Textarea", "Select"])
    }),
    choices: Object.freeze({
      logicalName: "Choice Controls/Module/Complete", coverageScope: "module", hostSelector: "#choices", runtimeKey: "catalog-module", moduleId: "choices", frameTitle: "选择控件完整模块真实组件",
      coverageLogicalNames: Object.freeze(["Checkbox", "Radio Group", "Switch", "Badge"])
    }),
    navigation: Object.freeze({
      logicalName: "Navigation/Module/Complete", coverageScope: "module", hostSelector: "#navigation", runtimeKey: "catalog-module", moduleId: "navigation", frameTitle: "导航完整模块真实组件",
      coverageLogicalNames: Object.freeze(["Tabs", "List"])
    }),
    dataDisplay: Object.freeze({
      logicalName: "Data Display/Module/Complete", coverageScope: "module", hostSelector: "#data-display", runtimeKey: "catalog-module", moduleId: "data-display", frameTitle: "数据展示完整模块真实组件",
      coverageLogicalNames: Object.freeze(["Avatar", "Badge", "Card", "Table", "Data Table", "Progress", "Pagination", "Empty"])
    }),
    disclosure: Object.freeze({
      logicalName: "Disclosure Navigation/Module/Complete", coverageScope: "module", hostSelector: "#disclosure", runtimeKey: "catalog-module", moduleId: "disclosure", frameTitle: "披露与导航完整模块真实组件",
      coverageLogicalNames: Object.freeze(["Breadcrumb", "Accordion", "Collapsible", "Menubar", "Separator", "Sidebar", "Item"])
    }),
    overlays: Object.freeze({
      logicalName: "Overlay Command/Module/Complete", coverageScope: "module", hostSelector: "#overlays", runtimeKey: "catalog-module", moduleId: "overlays", frameTitle: "浮层与命令完整模块真实组件",
      coverageLogicalNames: Object.freeze(["Dialog", "Alert Dialog", "Semi-modal", "Popover", "Hover Card", "Context Menu"])
    }),
    formPlus: Object.freeze({
      logicalName: "Form Composition/Module/Complete", coverageScope: "module", hostSelector: "#form-plus", runtimeKey: "catalog-module", moduleId: "form-plus", frameTitle: "复合表单完整模块真实组件",
      coverageLogicalNames: Object.freeze(["Field", "Label", "Combobox", "Native Select", "Slider", "Toggle", "Input OTP", "Kbd"])
    }),
    loadingData: Object.freeze({
      logicalName: "Loading Date/Module/Complete", coverageScope: "module", hostSelector: "#loading-data", runtimeKey: "catalog-module", moduleId: "loading-data", frameTitle: "加载与日期完整模块真实组件",
      coverageLogicalNames: Object.freeze(["Skeleton", "Spinner", "Chart", "Calendar", "Date Picker", "Time Picker"])
    }),
    specialized: Object.freeze({
      logicalName: "Specialized Content/Module/Complete", coverageScope: "module", hostSelector: "#specialized", runtimeKey: "catalog-module", moduleId: "specialized", frameTitle: "专用内容完整模块真实组件",
      coverageLogicalNames: Object.freeze(["Attachment", "Carousel"])
    }),
    feedback: Object.freeze({
      logicalName: "Feedback/Module/Complete", coverageScope: "module", hostSelector: "#feedback", runtimeKey: "catalog-module", moduleId: "feedback", frameTitle: "提示与反馈完整模块真实组件",
      coverageLogicalNames: Object.freeze(["Alert", "Tooltip", "Snackbar"])
    })
  });
})(window);
