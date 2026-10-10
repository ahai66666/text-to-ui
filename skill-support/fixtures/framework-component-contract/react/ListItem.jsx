import "../shared/interactive-components.css";

export function ListItem({ item, selected, onSelect }) {
  return <button className="hm-list-item" type="button" data-component="fixture-list-item" data-logical-component="List Item/White Surface/Default" data-variant="surface=white" data-state={selected ? "selected" : "default"} aria-pressed={selected} onClick={onSelect}><span>{item.label}</span><span className="hm-list-item__meta">{item.meta}</span></button>;
}
