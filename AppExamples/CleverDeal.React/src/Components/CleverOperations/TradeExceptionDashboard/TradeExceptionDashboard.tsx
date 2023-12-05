/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from "react";
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
  const { ecpOrigin } = props;
  const [tradeExceptions, setTradeExceptions] = useState<TradeException[]>([
    ...INITIAL_TRADE_EXCEPTIONS,
  ]);
  const tradeExceptionsLatest = useRef<TradeException[]>(tradeExceptions);
  const dataListenersRef = useRef<string[]>([]);
  const [selectedException, setSelectedException] = useState<TradeException>();

  const updateTradeException = (newTradeException: TradeException) => {
    const tradeExceptionIndex = tradeExceptionsLatest.current
      .map((e) => e.entry1.reference)
      .findIndex((r) => r === newTradeException.entry1.reference);

    if (tradeExceptionIndex === -1) return;

    const newTradeExceptions = [...tradeExceptionsLatest.current];
    newTradeExceptions[tradeExceptionIndex] = newTradeException;

    setTradeExceptions(newTradeExceptions);
    setSelectedException((currentSelection) => {
      if (!currentSelection || currentSelection.streamId?.[ecpOrigin] === newTradeException.streamId?.[ecpOrigin]) {
        return newTradeException
      }
      return currentSelection;
    });
  };

  useEffect(() => {
    tradeExceptionsLatest.current = tradeExceptions;
    tradeExceptions.forEach((tradeException: TradeException) => {
      const streamId = tradeException.streamId?.[ecpOrigin];
      if (streamId && !dataListenersRef.current.includes(streamId)) {
        dataListenersRef.current = [...dataListenersRef.current, streamId];
        (window as any).symphony.listen({
          type: 'DataNotifications',
          params: {
            type: TRADE_EXCEPTION_REQUEST_INTENT,
            streamId
          },
          callback: onReceivedData
        });
      }
    })
  }, [tradeExceptions]);

  const sendData = (tradeException: TradeException) => {
    const streamId = tradeException.streamId?.[ecpOrigin];
    (window as any).symphony.sendData({
      type: TRADE_EXCEPTION_REQUEST_INTENT,
      content: tradeException,
    }, {streamId});
  };

  const onReceivedData = useCallback(({content}: any) => {
    updateTradeException(content);
  }, [selectedException]);

  useEffect(() => {
    (window as any).symphony.registerInterop((intent: any, context: any) => {
      if (intent === TRADE_EXCEPTION_REQUEST_INTENT) {
        updateTradeException(context.tradeException);
        sendData(context.tradeException);
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
            ecpOrigin={ecpOrigin}
          />
        </div>
      </div>

      {!!selectedException && (
        <div className="details-container">
          <TradeExceptionDetails
            tradeException={selectedException}
            ecpOrigin={ecpOrigin}
            updateTradeExceptionHandler={updateTradeException}
            sendData={sendData}
          />
        </div>
      )}
    </div>
  );
};
