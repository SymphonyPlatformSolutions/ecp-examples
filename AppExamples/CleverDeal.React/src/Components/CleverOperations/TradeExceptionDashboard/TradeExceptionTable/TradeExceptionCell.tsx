import classNames from "classnames";
import { TradeExceptionFields, TradeField } from "../../../../Models";

interface TraceExceptionCellProps {
  field: TradeField;
  value1: any;
  value2: any;
  onConflictCellSelect?: (value: any) => void;
  selectedValue?: any;
}

const TradeExceptionCell = ({
  field,
  value1,
  value2,
  onConflictCellSelect,
  selectedValue,
}: TraceExceptionCellProps) => {
  const isExceptionField = TradeExceptionFields.includes(field);
  const valuesAreDifferent = value1 !== value2;
  const isConflict = isExceptionField && valuesAreDifferent;
  const isCellSelectable = isConflict && !!onConflictCellSelect;

  const renderValue = (value: any) => (
    <div
      className={classNames("cell-value", {
        selectable: isCellSelectable,
        selected: selectedValue !== undefined && value === selectedValue,
        discarded: selectedValue !== undefined && value !== selectedValue,
      })}
      onClick={() => isCellSelectable && onConflictCellSelect(value)}
    >
      {value}
    </div>
  );

  return (
    <td
      className={classNames({
        conflict: isConflict,
        "cell-selectable": isCellSelectable,
      })}
    >
      {renderValue(value1)}
      <hr />
      {renderValue(value2)}
    </td>
  );
};

export default TradeExceptionCell;
