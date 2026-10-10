import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { PrimaryAction } from "../react/PrimaryAction.jsx";
import { SearchField } from "../react/SearchField.jsx";
import { SidebarItem } from "../react/SidebarItem.jsx";
import { ListItem } from "../react/ListItem.jsx";
import { ButtonGallery } from "../react/ButtonGallery.jsx";
import { CatalogModule } from "../react/CatalogModule.jsx";
import "./demo-shell.css";

const items = [
  { label: "设计系统", meta: "刚刚更新" },
  { label: "Coremail", meta: "3 个任务" },
  { label: "组件映射", meta: "待验证" }
];

function ReactFixture() {
  const [disabled, setDisabled] = useState(false);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("收件箱");
  const [selected, setSelected] = useState(items[0].label);
  const [notice, setNotice] = useState("准备就绪");
  const filtered = useMemo(() => items.filter((item) => item.label.includes(query)), [query]);

  window.setFixtureState = setDisabled;
  const component = new URLSearchParams(window.location.search).get("component") ?? "button";
  const moduleId = new URLSearchParams(window.location.search).get("module");
  if (component === "button-gallery") return <ButtonGallery />;
  if (component === "catalog-module" && moduleId) return <CatalogModule moduleId={moduleId} />;
  if (component === "search") {
    return <main className="fixture-demo-shell"><p className="fixture-demo-kicker">React · Search · 可交互</p><SearchField value={query} onChange={(value) => { setQuery(value); setNotice(value ? `正在搜索：${value}` : "搜索已清除"); }} onClear={() => { setQuery(""); setNotice("搜索已清除"); }} /><p className="hm-component-lab__status" aria-live="polite">{notice}</p></main>;
  }
  if (component === "sidebar") {
    return <main className="fixture-demo-shell"><p className="fixture-demo-kicker">React · Sidebar Item · 可交互</p><nav className="hm-sidebar-nav" aria-label="邮件导航">{["收件箱", "草稿", "已发送"].map((label) => <SidebarItem key={label} label={label} selected={section === label} onSelect={() => { setSection(label); setNotice(`已切换到${label}`); }} />)}</nav><p className="hm-component-lab__status" aria-live="polite">{notice}</p></main>;
  }
  if (component === "list") {
    return <main className="fixture-demo-shell"><p className="fixture-demo-kicker">React · List Item · 可交互</p><section className="hm-work-list" aria-label="项目列表">{items.map((item) => <ListItem key={item.label} item={item} selected={selected === item.label} onSelect={() => { setSelected(item.label); setNotice(`已选择${item.label}`); }} />)}<p className="hm-component-lab__status" aria-live="polite">{notice}</p></section></main>;
  }
  return (
    <main className="fixture-demo-shell">
      <p className="fixture-demo-kicker">React · source-component · 可交互</p>
      <PrimaryAction label="写邮件" disabled={disabled} onClick={() => setNotice("已打开写邮件流程")} />
      <p className="hm-component-lab__status" aria-live="polite">{notice}</p>
    </main>
  );
}

createRoot(document.querySelector("#root")).render(<ReactFixture />);
