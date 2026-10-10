import "../shared/interactive-components.css";

export function SearchField({ value, onChange, onClear }) {
  return (
    <label className="hm-search" data-component="fixture-search" data-logical-component="Search/White Surface/Default" data-variant="surface=white" data-state={value ? "value" : "default"}>
      <input className="hm-search__input" type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder="搜索项目" aria-label="搜索项目" />
      {value ? <button className="hm-search__clear" type="button" onClick={onClear}>清除</button> : null}
    </label>
  );
}
