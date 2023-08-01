/* eslint-disable react-hooks/exhaustive-deps */
import { FaQuestionCircle } from "react-icons/fa";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import {
  TRADE_TARGET_SYM_IDS,
  getTradeExceptionInitialMessage,
  getTradeExceptionRequestMessage,
  getTradeExceptionRoomName,
} from "../../../../Data/operations";
import {
  EcpApiResponse,
  TradeException,
  TradeExceptionFields,
  TradeExceptionStatus,
  TradeField,
  TradeFieldLabels,
} from "../../../../Models";
import "./TradeExceptionDetails.scss";
import TradeExceptionTable from "../TradeExceptionTable";

const CHAT_ID = `symphony-ecm-trade-chat`;
interface TraceExceptionDetailsProps {
  tradeException: TradeException;
  ecpOrigin: string;
  updateTradeExceptionHandler: (newTradeException: TradeException) => void;
}

const TradeExceptionDetails = ({
  updateTradeExceptionHandler,
  tradeException,
  ecpOrigin,
}: TraceExceptionDetailsProps) => {
  const [loadedStreamId, setLoadedStreamId] = useState<string>();
  const [isStreamReady, setIsStreamReady] = useState<boolean>(false);

  const chatRef = useRef<HTMLDivElement>(null);

  const conflictingField = Object.values(TradeField).find(
    (field) =>
      TradeExceptionFields.includes(field) &&
      tradeException.entry1[field] !== tradeException.entry2[field]
  ) as TradeField;

  const detailsFields = [
    TradeField.EXECUTING_PARTY,
    TradeField.SECURITY_ISIN,
    conflictingField,
    TradeField.REFERENCE,
  ];

  const targetStreamId = tradeException.streamId?.[ecpOrigin];
  const showHelper = tradeException.status === TradeExceptionStatus.UNRESOLVED;
  const canSelectConflictCell = showHelper && isStreamReady;

  useEffect(() => {
    // no stream associated to the trade --> create a new room
    if (!targetStreamId) {
      setIsStreamReady(false);
      setLoadedStreamId(undefined);
      (window as any).symphony
        .createRoom(
          getTradeExceptionRoomName(tradeException),
          [TRADE_TARGET_SYM_IDS.userId[ecpOrigin]],
          {
            message: getTradeExceptionInitialMessage(
              tradeException,
              conflictingField
            ),
          },
          `#${CHAT_ID}`
        )
        .then(async (response: EcpApiResponse) => {
          await (window as any).symphony.pinMessage(
            response.messages[0].messageId
          );
          return response;
        })
        .then((response: { streamId: string }) => {
          setLoadedStreamId(response.streamId);
          setIsStreamReady(true);

          updateTradeExceptionHandler({
            ...tradeException,
            streamId: { [ecpOrigin]: response.streamId },
          });
        });

      return;
    }

    // another trade has been selected --> open the given stream
    if (loadedStreamId !== targetStreamId) {
      setIsStreamReady(false);
      (window as any).symphony
        .openStream(targetStreamId, `#${CHAT_ID}`)
        .then(() => {
          setLoadedStreamId(targetStreamId);
          setIsStreamReady(true);
        });
      return;
    }
  }, [targetStreamId]);

  const handleExceptionRequest = (value: any) => {
    const newTradeException = {
      ...tradeException,
      status: TradeExceptionStatus.PENDING,
      resolution: {
        field: conflictingField,
        value,
      },
    };

    const message = getTradeExceptionRequestMessage(
      newTradeException,
      conflictingField,
      value
    );

    return (window as any).symphony
      .sendMessage(message, {
        mode: "blast",
        streamIds: [loadedStreamId],
        container: CHAT_ID,
      })
      .then((response: EcpApiResponse) => {
        if (response.messages) {
          updateTradeExceptionHandler(newTradeException);
        }
      });
  };

  return (
    <div className="details-content">
      <div className="details-panel">
        <div className="details-header">
          <h3>{TradeFieldLabels[conflictingField]} exception</h3>
          {tradeException.status !== TradeExceptionStatus.UNRESOLVED && (
            <div
              className={classNames("status-container", tradeException.status)}
            >
              {tradeException.status}
            </div>
          )}
        </div>

        {showHelper && (
          <div className="helper-container">
            <FaQuestionCircle />
            {canSelectConflictCell
              ? "Please select the correct value in the following table"
              : "Once the Symphony room is created, you will be able to select the correct trade value."}
          </div>
        )}

        <div className="table-container">
          <TradeExceptionTable
            fields={detailsFields}
            tradeExceptions={[tradeException]}
            onConflictCellSelect={
              canSelectConflictCell ? handleExceptionRequest : undefined
            }
            showChatField={false}
            ecpOrigin={ecpOrigin}
          />
        </div>
      </div>

      <div
        ref={chatRef}
        id={CHAT_ID}
        className="details-panel chat-container"
      />
    </div>
  );
};

export default TradeExceptionDetails;
