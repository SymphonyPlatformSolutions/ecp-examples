import { Scope } from "../../Graph/Graph.utils";
import "./ScopeToggle.scss";

export interface ScopeToggleProps {
  value: Scope;
  onChange: (opt: Scope) => void;
}

const ScopeToggle = (props: ScopeToggleProps) => (
  <div className="toggle-button-container">
    {Object.values(Scope).map((value) => (
      <button
        key={value}
        onClick={() => props.onChange(value)}
        className={props.value === value ? "active" : ""}
      >
        {value}
      </button>
    ))}
  </div>
);

export default ScopeToggle;
