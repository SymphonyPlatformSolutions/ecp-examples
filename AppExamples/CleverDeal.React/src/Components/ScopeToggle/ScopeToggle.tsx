import { Scope } from "../Graph/Graph.utils";
import "./ScopeToggle.scss";

export interface ScopeToggleProps {
  value: Scope;
  onChange: (opt: Scope) => void;
}

const ScopeToggle = (props: ScopeToggleProps) => (
  <div className="toggle-button-container">
    <button
      onClick={() => props.onChange(Scope.Day)}
      className={props.value === Scope.Day ? "active" : ""}
    >
      Day
    </button>
    <button
      onClick={() => props.onChange(Scope.Week)}
      className={props.value === Scope.Week ? "active" : ""}
    >
      Week
    </button>
    <button
      onClick={() => props.onChange(Scope.Month)}
      className={props.value === Scope.Month ? "active" : ""}
    >
      Month
    </button>
    <button
      onClick={() => props.onChange(Scope.Year)}
      className={props.value === Scope.Year ? "active" : ""}
    >
      Year
    </button>
  </div>
);

export default ScopeToggle;
