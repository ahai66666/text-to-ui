import "../shared/primary-action.css";

export function PrimaryAction({ label, disabled = false, onClick }) {
  return (
    <button
      className="hm-primary-action"
      type="button"
      data-component="fixture-primary-action"
      data-logical-component="Button/Primary/Default"
      data-variant="size=medium"
      data-state={disabled ? "disabled" : "default"}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
