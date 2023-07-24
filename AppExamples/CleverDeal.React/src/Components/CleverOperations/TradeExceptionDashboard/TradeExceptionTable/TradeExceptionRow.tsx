import classNames from "classnames";
import { FaComments } from "react-icons/fa";
import { TradeException, TradeExceptionStatus, TradeField } from "../../../../Models";
import TradeExceptionCell from "./TradeExceptionCell";

interface TraceExceptionRowProps {
  tradeException: TradeException;
  isActive: boolean;
  onClick?: () => void;
  onConflictCellSelect?: (value: any) => void;
  fields?: TradeField[];
  showChatField: boolean;
  ecpOrigin: string;
}

const TradeExceptionRow = ({
  tradeException,
  isActive,
  onClick,
  onConflictCellSelect,
  fields = Object.values(TradeField),
  showChatField,
  ecpOrigin,
}: TraceExceptionRowProps) => (
  <tr
    className={classNames(
      { active: isActive, selectable: !!onClick },
      tradeException.status
    )}
    onClick={onClick}
  >
    {fields.map((field) => (
      <TradeExceptionCell
        key={field}
        field={field}
        value1={tradeException.entry1[field]}
        value2={tradeException.entry2[field]}
        onConflictCellSelect={onConflictCellSelect}
        selectedValue={
          tradeException.status !== TradeExceptionStatus.UNRESOLVED &&
          tradeException.resolution?.field === field
            ? tradeException.resolution.value
            : undefined
        }
      />
    ))}

    {showChatField && (
      <td>
        <FaComments
          className={classNames("chat-indicator", {
            disabled: !tradeException.streamId?.[ecpOrigin],
          })}
        />
      </td>
    )}
  </tr>
);

export default TradeExceptionRow;
