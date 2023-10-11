import { RoomIdMap } from "../Models";
import {
  TradeException,
  TradeExceptionStatus,
  TradeFieldLabels,
  TradeField,
} from "../Models/TradeException";

const TODAY = new Date();

export const TODAY_MINUS = (nDays: number): Date => {
  const date = new Date(TODAY);
  date.setDate(date.getDate() - nDays);
  return date;
};

export const INITIAL_TRADE_EXCEPTIONS: TradeException[] = [
  {
    entry1: {
      executingParty: "ABC Broker",
      securityIsin: "US88160R1014",
      tradeType: "BUY",
      price: 238.54,
      totalTradeAmount: 150000,
      tradeCommission: 54350,
      settlementDate: TODAY.toLocaleDateString(),
      currency: "USD",
      reference: "E18389829323",
    },
    entry2: {
      executingParty: "Capital Management",
      securityIsin: "US88160R1014",
      tradeType: "BUY",
      price: 238.54,
      totalTradeAmount: 150000,
      tradeCommission: 4350,
      settlementDate: TODAY.toLocaleDateString(),
      currency: "USD",
      reference: "I18389829323",
    },
    status: TradeExceptionStatus.UNRESOLVED,
    streamId: {
      "corporate.symphony.com": "SKFW0sGWPuZM9EagQpotin///nZkSTrCdA==",
      "st3.symphony.com": "xcOpL0MuJjmIVbq22DpFA3///nZtMty9dA==",
      "preview.symphony.com": "t9KU+xY4WOKj6Y+Zvrxc+H///nUHUhaadA==",
    } as RoomIdMap,
  },
  {
    entry1: {
      executingParty: "ABC Broker",
      securityIsin: "US5949181045",
      tradeType: "SELL",
      price: 67.69,
      totalTradeAmount: 150000,
      tradeCommission: 25000,
      settlementDate: TODAY_MINUS(1).toLocaleDateString(),
      currency: "USD",
      reference: "E93274809824",
    },
    entry2: {
      executingParty: "XY HF",
      securityIsin: "US5949181045",
      tradeType: "SELL",
      price: 67.69,
      totalTradeAmount: 250000,
      tradeCommission: 25000,
      settlementDate: TODAY_MINUS(1).toLocaleDateString(),
      currency: "USD",
      reference: "I93274809824",
    },
    status: TradeExceptionStatus.UNRESOLVED,
  },
  {
    entry1: {
      executingParty: "ABC Broker",
      securityIsin: "ES0105066007",
      tradeType: "BUY",
      price: 54.5,
      totalTradeAmount: 1230000,
      tradeCommission: 54000,
      settlementDate: TODAY_MINUS(1).toLocaleDateString(),
      currency: "USD",
      reference: "E02348237923",
    },
    entry2: {
      executingParty: "1x IDB",
      securityIsin: "ES0105066007",
      tradeType: "BUY",
      price: 54.5,
      totalTradeAmount: 1230000,
      tradeCommission: 0,
      settlementDate: TODAY_MINUS(1).toLocaleDateString(),
      currency: "USD",
      reference: "I02348237923",
    },
    status: TradeExceptionStatus.UNRESOLVED,
  },
  {
    entry1: {
      executingParty: "ABC Broker",
      securityIsin: "GB0005405286",
      tradeType: "SELL",
      price: 36.2,
      totalTradeAmount: 800000,
      tradeCommission: 32000,
      settlementDate: TODAY_MINUS(2).toLocaleDateString(),
      currency: "GBP",
      reference: "E0983745621",
    },
    entry2: {
      executingParty: "Global Traders",
      securityIsin: "GB0005405286",
      tradeType: "SELL",
      price: 36.2,
      totalTradeAmount: 800000,
      tradeCommission: 32000,
      settlementDate: TODAY_MINUS(2).toLocaleDateString(),
      currency: "EUR",
      reference: "I0983745621",
    },
    status: TradeExceptionStatus.UNRESOLVED,
  },
  {
    entry1: {
      executingParty: "ABC Broker",
      securityIsin: "FR0000131104",
      tradeType: "BUY",
      price: 42.9,
      totalTradeAmount: 3000000,
      tradeCommission: 90000,
      settlementDate: TODAY_MINUS(3).toLocaleDateString(),
      currency: "EUR",
      reference: "E0764938172",
    },
    entry2: {
      executingParty: "Alpha Investments",
      securityIsin: "FR0000131104",
      tradeType: "BUY",
      price: 42.9,
      totalTradeAmount: 3000000,
      tradeCommission: 90000,
      settlementDate: TODAY_MINUS(4).toLocaleDateString(),
      currency: "EUR",
      reference: "I0764938172",
    },
    status: TradeExceptionStatus.UNRESOLVED,
  },

  {
    entry1: {
      executingParty: "ABC Broker",
      securityIsin: "CH0038863350",
      tradeType: "BUY",
      price: 91.8,
      totalTradeAmount: 1500000,
      tradeCommission: 45000,
      settlementDate: TODAY_MINUS(10).toLocaleDateString(),
      currency: "CHF",
      reference: "E0293847562",
    },
    entry2: {
      executingParty: "Wealth Managers",
      securityIsin: "CH0038863350",
      tradeType: "BUY",
      price: 918.0,
      totalTradeAmount: 1500000,
      tradeCommission: 45000,
      settlementDate: TODAY_MINUS(10).toLocaleDateString(),
      currency: "CHF",
      reference: "I0293847562",
    },
    status: TradeExceptionStatus.UNRESOLVED,
  },
];

export const TRADE_EXCEPTION_REQUEST_INTENT = "TradeExceptionApprovalRequest";

export const TRADE_TARGET_SYM_IDS = {
  userId: {
    "corporate.symphony.com": "71811853191701",
    "st3.symphony.com": "9139691040326",
    "preview.symphony.com": "71811853191701",
  } as RoomIdMap,
};

export const getTradeExceptionRoomName = (tradeException: TradeException) =>
  `${tradeException.entry1.securityIsin} ${
    tradeException.entry1.executingParty
  } - ${tradeException.entry1.settlementDate} [${String(Date.now()).slice(
    -4
  )}]`;

export const getMessageTable = (
  tradeException: TradeException,
  fields = Object.values(TradeField)
) => `<table>
  <thead>
    <tr>
      <th>Reference</th>
      <th>${tradeException.entry1.reference}</th>
      <th>${tradeException.entry2.reference}</th>
    </tr>
  </thead>
  <tbody>
    ${fields.filter((field) => field !== 'reference').map((field) => (
      `<tr>
        <td>${TradeFieldLabels[field]}</td>
        <td>${tradeException.entry1[field]}</td>
        <td>${tradeException.entry2[field]}</td>
      </tr>`
    )).join('')}
  </tbody>
  </table>`;

export const getTradeExceptionInitialMessage = (
  tradeException: TradeException,
  conflictingField: TradeField
) => ({
  text: {
    "text/markdown": [
      `**Trade Exception Resolution**`,
      '&nbsp;',
      `Conflict on field **${TradeFieldLabels[conflictingField]}**: *${tradeException.entry1[conflictingField]}* vs *${tradeException.entry2[conflictingField]}*`,
      'Please select the correct value in the table above this chat',
      '&nbsp;',
      getMessageTable(tradeException),
    ].join("\n"),
  },
});

export const getTradeExceptionRequestMessage = (
  tradeException: TradeException,
  conflictingField: TradeField,
  selectedValue: any
) => ({
  text: {
    "text/markdown": [
      `I'm selecting **${selectedValue}** as the correct value for **${TradeFieldLabels[conflictingField]}**.`,
      `Do you agree with this choice?`,
    ].join("\n"),
  },
  entities: {
    button1: {
      type: "fdc3.fdc3Intent",
      data: {
        title: "Approve",
        intent: TRADE_EXCEPTION_REQUEST_INTENT,
        context: {
          type: "fdc3.trade.exception.response",
          tradeException: {
            ...tradeException,
            status: TradeExceptionStatus.APPROVED,
          },
        },
      },
    },
    button2: {
      type: "fdc3.fdc3Intent",
      data: {
        title: "Reject",
        intent: TRADE_EXCEPTION_REQUEST_INTENT,
        context: {
          type: "fdc3.trade.exception.response",
          tradeException: {
            ...tradeException,
            status: TradeExceptionStatus.REJECTED,
          },
        },
      },
    },
  },
});
