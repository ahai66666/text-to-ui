import "@text-to-ui/tokens";
import "@text-to-ui/components-html/styles.css";
import "@text-to-ui/components-html/pattern-shell.css";
import { collectHtmlComponentEvidence, renderHtmlComponent } from "@text-to-ui/components-html";
import "./page.css";

const node = (markup) => {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
};
const component = (rendererKey, options = {}) => node(renderHtmlComponent(rendererKey, options));

export function renderTaskWorkbench(root) {
  const shell = document.createElement("main");
  shell.className = "task-workbench";
  shell.dataset.tuiPattern = "pattern-b-three-pane";
  shell.dataset.tuiPaneOrder = "primary-navigation secondary-list main-detail";
  const navigation = document.createElement("aside");
  navigation.dataset.uiRegion = "navigation";
  navigation.dataset.tuiPaneRole = "primary-navigation";
  const list = document.createElement("section");
  list.dataset.uiRegion = "list";
  list.dataset.tuiPaneRole = "secondary-list";
  list.className = "task-list";
  const detail = document.createElement("section");
  detail.dataset.uiRegion = "detail";
  detail.dataset.tuiPaneRole = "main-detail";
  navigation.append(
    component("button", { label: "新增任务", variant: "primary", mode: "text" }),
    component("sidebar", { items: [{ label: "我的任务", selected: true, count: 8 }, { label: "已完成", count: 21 }] })
  );
  list.append(
    component("search", { placeholder: "搜索任务" }),
    component("list-card", { title: "完成技能严格复用", description: "今天", trailingText: "进行中" }),
    component("list-card", { title: "整理设计系统文档", description: "明天", trailingText: "待处理" })
  );
  detail.append(
    component("titlebar", { paneTitle: "任务详情", layout: "three-column", segmentRole: "final-pane", mainDetailActions: [{ id: "save", label: "保存", icon: "action/save", buttonType: "icon" }], size: "medium" }),
    component("checkbox", { label: "标记为完成", description: "同步到任务记录", checked: false })
  );
  shell.append(navigation, list, detail);
  root.append(shell);
  return collectHtmlComponentEvidence(document);
}
