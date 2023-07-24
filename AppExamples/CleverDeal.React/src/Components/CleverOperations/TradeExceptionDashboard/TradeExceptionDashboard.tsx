/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import {
  INITIAL_TRADE_EXCEPTIONS,
  TRADE_EXCEPTION_REQUEST_INTENT,
} from "../../../Data/operations";
import { TradeException } from "../../../Models/TradeException";
import "./TradeExceptionDashboard.scss";
import TradeExceptionDetails from "./TradeExceptionDetails";
import TradeExceptionTable from "./TradeExceptionTable";
import FakeTopMenu from "../FakeTopMenu";

interface TradeExceptionDashboardProps {
  ecpOrigin: string;
}

export const TradeExceptionDashboard = (
  props: TradeExceptionDashboardProps
) => {
  const [tradeExceptions, setTradeExceptions] = useState<TradeException[]>([
    ...INITIAL_TRADE_EXCEPTIONS,
  ]);
  const tradeExceptionsLatest = useRef<TradeException[]>(tradeExceptions);

  const [selectedException, setSelectedException] = useState<TradeException>();

  const updateTradeException = (newTradeException: TradeException) => {
    const tradeExceptionIndex = tradeExceptionsLatest.current
      .map((e) => e.entry1.reference)
      .findIndex((r) => r === newTradeException.entry1.reference);

    if (tradeExceptionIndex === -1) return;

    const newTradeExceptions = [...tradeExceptionsLatest.current];
    newTradeExceptions[tradeExceptionIndex] = newTradeException;

    setTradeExceptions(newTradeExceptions);
    setSelectedException(newTradeException);
  };

  useEffect(() => {
    tradeExceptionsLatest.current = tradeExceptions;
  }, [tradeExceptions]);

  useEffect(() => {
    (window as any).symphony.registerInterop((intent: any, context: any) => {
      if (intent === TRADE_EXCEPTION_REQUEST_INTENT) {
        updateTradeException(context.tradeException);
      }
    });
  }, []);

  return (
    <div className="trade-exception-dashboard">
      <div className="trade-exception-content">
        <div className="content-header">
          <FakeTopMenu />
        </div>

        <div className="table-container">
          <TradeExceptionTable
            selectedException={selectedException}
            onRowSelect={setSelectedException}
            tradeExceptions={tradeExceptions}
            ecpOrigin={props.ecpOrigin}
          />
        </div>
      </div>

      {!!selectedException && (
        <div className="details-container">
          <TradeExceptionDetails
            tradeException={selectedException}
            ecpOrigin={props.ecpOrigin}
            updateTradeExceptionHandler={updateTradeException}
          />
        </div>
      )}
    </div>
  );
};
