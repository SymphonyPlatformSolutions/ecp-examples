import {
  SYNC_CHART_SCOPE_INTENT,
  Scope,
} from "../Components/Graph/Graph.utils";
import { DealInterface, RoomIdMap } from "../Models";

const yannick = {
  id: "",
  name: "Yannick Malins",
  email: "yannick.malins@symphony.com",
};

const zimmy = {
  id: "",
  name: "Cedric Zimmermann",
  email: "cedric.zimmermann@symphony.com",
};

const thomas = {
  id: "",
  name: "Thomas Zhao",
  email: "thomas.zhao@symphony.com",
};

const antoine = {
  id: "",
  name: "Antoine Picolet",
  email: "antoine.picolet@symphony.com",
};

const CITIES = [
  "Paris",
  "Marseille",
  "Lyon",
  "Toulouse",
  "Nice",
  "Nantes",
  "Strasbourg",
  "Montpellier",
  "Bordeaux",
  "Lille",
  "Rennes",
  "Reims",
  "Toulon",
  "Grenoble",
];

const generateInactiveDeals = (n: number): DealInterface[] => {
  const deals: DealInterface[] = [];
  for (let i = 0; i < n; i++) {
    deals.push({
      dealId: `${Math.floor(Math.random() * 10000000)}`,
      lastUpdated: `${Math.floor(Math.random() * 20 + 2)} days ago`,
      status: "inactive",
      name: `${`${
        CITIES[Math.floor(Math.random() * (CITIES.length - 1))]
      }`} deal`,
      details: {
        members: [],
        country: "France",
        riskLevel: "Medium",
        type: "Whatever",
        minimum: "$100k",
      },
    });
  }
  return deals;
};

export const INITIAL_DEALS: DealInterface[] = [
  {
    dealId: "123456",
    lastUpdated: "Today",
    status: "active",
    name: "Biot investment",
    details: {
      members: [yannick, thomas, zimmy],
      roomId: {
        "st3.symphony.com": "Cm2ZKi4E3qdH8NqUt4BHQH///oCvvlv6dA==",
        "corporate.symphony.com": "VkaN/ZxK+37EYQLBiKHyNH///ncESK8ndA==",
      },
      country: "France",
      riskLevel: "Medium",
      type: "Equity",
      minimum: "$100k",
    },
  },
  ...generateInactiveDeals(2),
  {
    dealId: "654321",
    lastUpdated: "Yesterday",
    status: "active",
    name: "Sophia investment",
    details: {
      members: [yannick, antoine, thomas],
      roomId: {
        "st3.symphony.com": "egJ5XAdOKzC+1f42Zhewy3///oCvvdYAdA==",
        "corporate.symphony.com": "eboDMTcQT4GsDk6AjQP3zn///n8cy6jVdA==",
      },
      country: "China",
      riskLevel: "High",
      type: "Commodity Future",
      minimum: "$150k",
    },
  },
  ...generateInactiveDeals(3),
  {
    dealId: "789103",
    lastUpdated: "2 days ago",
    status: "active",
    name: "Valbonne investment",
    details: {
      members: [yannick, antoine],
      roomId: {
        "st3.symphony.com": "egJ5XAdOKzC+1f42Zhewy3///oCvvdYAdA==",
        "corporate.symphony.com": "m4okqNL/fAtDdRBhVOxloX///n8cyzwNdA==",
      },
      country: "USA",
      riskLevel: "Low",
      type: "Corporate Bond",
      minimum: "$150k",
    },
  },
  ...generateInactiveDeals(12),
];

export const helpRoom: RoomIdMap = {
  "st3.symphony.com": "+Slk3L9bALdV8EW82EPCfX///ndFonF/dA==",
  "corporate.symphony.com": "HASQkcT2VaQXxHKFPjFb9H///ndGbRFidA==",
};

export const getShareScreenshotMessage = (b64Image: string | undefined) => ({
  text: {
    "text/markdown": "",
  },
  entities: {
    attachmentImage: {
      type: "fdc3.fileAttachment",
      data: {
        name: "graph.jpeg",
        dataUri: b64Image,
      },
    },
  },
});

export const getShareMessage = (scope: Scope) => ({
  text: {
    "text/markdown": "",
  },
  entities: {
    button1: {
      type: "fdc3.fdc3Intent",
      data: {
        title: `View ${scope} Chart`,
        intent: SYNC_CHART_SCOPE_INTENT,
        context: {
          type: "fdc3.chart.scope",
          scope,
        },
      },
    },
  },
});

export const getCreateDealRoomMessage = (b64Image: string | undefined) => ({
  text: {
    "text/markdown": "",
  },
  entities: {
    attachmentImage: {
      type: "fdc3.fileAttachment",
      data: {
        name: "graph.jpeg",
        dataUri: b64Image,
      },
    },
  },
});
