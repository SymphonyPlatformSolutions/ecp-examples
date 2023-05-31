var _seed = Date.now();

export function rand(min?: number, max?: number) {
  min = min || 0;
  max = max || 0;
  _seed = (_seed * 9301 + 49297) % 233280;
  return min + (_seed / 233280) * (max - min);
}

const valueOrDefault = (l: any, r: any) => {
  return l || r;
};

export function numbers(config: any) {
  var cfg = config || {};
  var min = valueOrDefault(cfg.min, 0);
  var max = valueOrDefault(cfg.max, 100);
  var from = valueOrDefault(cfg.from, []);
  var count = valueOrDefault(cfg.count, 8);
  var decimals = valueOrDefault(cfg.decimals, 8);
  var continuity = valueOrDefault(cfg.continuity, 1);
  var dfactor = Math.pow(10, decimals) || 0;
  var data = [];
  var i, value;

  for (i = 0; i < count; ++i) {
    value = (from[i] || 0) + rand(min, max);
    if (rand() <= continuity) {
      data.push(Math.round(dfactor * value) / dfactor);
    } else {
      data.push(null);
    }
  }

  return data;
}

export enum Scope {
  DAY = "Day",
  WEEK = "Week",
  MONTH = "Month",
  YEAR = "Year",
}

export const DAY_LABELS = Array.from(Array(12).keys())
  .map((h) => ((h + 11) % 12) + 1 + ":00 AM")
  .concat(
    Array.from(Array(12).keys()).map((h) => ((h + 11) % 12) + 1 + ":00 PM")
  );

export const WEEK_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const monthIndex = new Date().getMonth() + 1;
export const MONTH_LABELS = Array.from(Array(30).keys()).map(
  (d) =>
    (monthIndex < 10 ? "0" : "") +
    monthIndex +
    "/" +
    (d + 1 < 10 ? "0" : "") +
    (d + 1)
);

export const YEAR_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const LABELS: any = {
  [Scope.DAY]: DAY_LABELS,
  [Scope.WEEK]: WEEK_LABELS,
  [Scope.MONTH]: MONTH_LABELS,
  [Scope.YEAR]: YEAR_LABELS,
};

export const CHART_COLORS = {
  red: "rgb(255, 99, 132)",
  orange: "rgb(255, 159, 64)",
  yellow: "rgb(255, 205, 86)",
  green: "rgb(75, 192, 192)",
  blue: "rgb(54, 162, 235)",
  purple: "rgb(153, 102, 255)",
  grey: "rgb(201, 203, 207)",
};

export const SYNC_CHART_SCOPE_INTENT = "SyncChartScope";
