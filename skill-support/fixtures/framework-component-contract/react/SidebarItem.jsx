import "../shared/interactive-components.css";

export function SidebarItem({ label, selected, onSelect }) {
  return <button className="hm-sidebar-item" type="button" data-component="fixture-sidebar-item" data-logical-component="Sidebar Item/Default" data-variant="size=medium" data-state={selected ? "selected" : "default"} aria-current={selected ? "page" : undefined} onClick={onSelect}>{label}</button>;
}
