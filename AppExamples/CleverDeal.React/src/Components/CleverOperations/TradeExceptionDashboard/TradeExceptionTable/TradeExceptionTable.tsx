import {
  TradeException,
  TradeField,
  TradeFieldLabels,
} from "../../../../Models";
import TradeExceptionRow from "./TradeExceptionRow";

import "./TradeExceptionTable.scss";

interface TraceExceptionTableProps {
  tradeExceptions: TradeException[];
  selectedException?: TradeException | undefined;
  onRowSelect?: (t: TradeException) => void;
  onConflictCellSelect?: (value: any) => void;
  fields?: TradeField[];
  showChatField?: boolean;
  ecpOrigin: string;
}

const TradeExceptionTable = ({
  tradeExceptions,
  onRowSelect,
  onConflictCellSelect,
  selectedException,
  fields = Object.values(TradeField),
  showChatField = true,
  ecpOrigin,
}: TraceExceptionTableProps) => (
  <table className="trade-exception-table">
    <thead>
      <tr>
        {fields.map((field: TradeField) => (
          <th key={field}>{TradeFieldLabels[field]}</th>
        ))}
        {showChatField && <th>Chat</th>}
      </tr>
    </thead>
    <tbody>
      {tradeExceptions.map((tradeException, index: number) => (
        <TradeExceptionRow
          key={`${tradeException.entry1.executingParty}-${index}`}
          isActive={tradeException === selectedException}
          tradeException={tradeException}
          onClick={
            !!onRowSelect ? () => onRowSelect(tradeException) : undefined
          }
          onConflictCellSelect={onConflictCellSelect}
          fields={fields}
          showChatField={showChatField}
          ecpOrigin={ecpOrigin}
        />
      ))}
    </tbody>
  </table>
);

export default TradeExceptionTable;
