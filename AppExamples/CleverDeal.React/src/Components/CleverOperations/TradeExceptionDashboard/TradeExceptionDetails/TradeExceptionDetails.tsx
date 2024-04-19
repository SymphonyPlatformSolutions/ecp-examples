/* eslint-disable react-hooks/exhaustive-deps */
import { FaQuestionCircle } from "react-icons/fa";

import classNames from "classnames";
import { useEffect, useState } from "react";
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
import TradeExceptionTable from "../TradeExceptionTable";
import "./TradeExceptionDetails.scss";

const CHAT_ID_PREFIX = `symphony-ecm-trade-chat`;
const CHAT_CONTAINER_CLASS = "chat-container";

interface TraceExceptionDetailsProps {
  tradeException: TradeException;
  ecpOrigin: string;
  updateTradeExceptionHandler: (newTradeException: TradeException) => void;
  sendData: (tradeException: TradeException) => void;
}

const TradeExceptionDetails = ({
  updateTradeExceptionHandler,
  tradeException,
  ecpOrigin,
  sendData
}: TraceExceptionDetailsProps) => {
  const [loadedStreamId, setLoadedStreamId] = useState<string>();
  const [isStreamReady, setIsStreamReady] = useState<boolean>(false);

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

  const showHelper = tradeException.status === TradeExceptionStatus.UNRESOLVED;
  const canSelectConflictCell = showHelper && isStreamReady;

  const generateChatId = () => {
    const container = document.querySelector(`.${CHAT_CONTAINER_CLASS}`);
    const id = CHAT_ID_PREFIX + Date.now();

    if (container) {
      container.innerHTML = "";
      container.id = id;
    }

    return id;
  };

  const getChatId = () =>
    document.querySelector(`.${CHAT_CONTAINER_CLASS}`)?.id || generateChatId();

  useEffect(() => {
    const targetStreamId = tradeException.streamId?.[ecpOrigin];

    // no stream associated to the trade --> create a new room
    if (!targetStreamId) {
      setIsStreamReady(false);
      setLoadedStreamId(undefined);

      (window as any).symphony
        .createRoom(
          getTradeExceptionRoomName(tradeException),
          [
            tradeException.forceUserIds ||
              TRADE_TARGET_SYM_IDS.userId[ecpOrigin],
          ],
          {
            message: getTradeExceptionInitialMessage(
              tradeException,
              conflictingField
            ),
            filters: tradeException.createRoomFilters,
          },
          `#${getChatId()}`
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
        .openStream(targetStreamId, `#${getChatId()}`)
        .then(() => {
          setLoadedStreamId(targetStreamId);
          setIsStreamReady(true);
        });
      return;
    }
  }, [tradeException.entry1.reference]);

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
        container: getChatId(),
      })
      .then((response: EcpApiResponse) => {
        if (response.messages) {
          updateTradeExceptionHandler(newTradeException);
          sendData(newTradeException);
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

      <div className={`details-panel ${CHAT_CONTAINER_CLASS}`} />
    </div>
  );
};

export default TradeExceptionDetails;
