import { RoomIdMap } from "./DashboardItemDetails";

export type TradeType = "BUY" | "SELL";

export enum TradeField {
  EXECUTING_PARTY = "executingParty",
  SECURITY_ISIN = "securityIsin",
  TRADE_TYPE = "tradeType",
  PRICE = "price",
  TOTAL_TRADE_AMOUNT = "totalTradeAmount",
  TRADE_COMMISSION = "tradeCommission",
  CURRENCY = "currency",
  SETTLEMENT_DATE = "settlementDate",
  REFERENCE = "reference",
}

export enum TradeExceptionStatus {
  UNRESOLVED = "unresolved",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export const TradeFieldLabels = {
  [TradeField.EXECUTING_PARTY]: "Executing Party",
  [TradeField.SECURITY_ISIN]: "Security ISIN",
  [TradeField.TRADE_TYPE]: "Buy/Sell",
  [TradeField.PRICE]: "Price",
  [TradeField.TOTAL_TRADE_AMOUNT]: "Total Trade Amount",
  [TradeField.TRADE_COMMISSION]: "Trade Commission",
  [TradeField.CURRENCY]: "Currency",
  [TradeField.SETTLEMENT_DATE]: "Settlement Date",
  [TradeField.REFERENCE]: "Reference",
};

export const TradeExceptionFields = [
  TradeField.PRICE,
  TradeField.TOTAL_TRADE_AMOUNT,
  TradeField.TRADE_COMMISSION,
  TradeField.SETTLEMENT_DATE,
  TradeField.CURRENCY,
];

export type TradeEntry = {
  [TradeField.EXECUTING_PARTY]: string;
  [TradeField.SECURITY_ISIN]: string;
  [TradeField.TRADE_TYPE]: TradeType;
  [TradeField.PRICE]: number;
  [TradeField.TOTAL_TRADE_AMOUNT]: number;
  [TradeField.TRADE_COMMISSION]: number;
  [TradeField.SETTLEMENT_DATE]: string;
  [TradeField.CURRENCY]: string;
  [TradeField.REFERENCE]: string;
};

export type TradeExceptionResolution = {
  field: TradeField;
  value: any;
};

export interface TradeException {
  entry1: TradeEntry;
  entry2: TradeEntry;
  status: TradeExceptionStatus;
  resolution?: TradeExceptionResolution;
  streamId?: RoomIdMap;
  forceUserIds?: string[];
}

export interface EcpApiResponse {
  userIds: string[];
  streamId: string;
  messages: {
    messageId: string;
  }[];
}
