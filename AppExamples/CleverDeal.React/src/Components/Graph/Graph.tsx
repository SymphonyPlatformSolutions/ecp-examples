/* eslint-disable react-hooks/exhaustive-deps */
import { Chart, registerables } from "chart.js";
import { useEffect, useLayoutEffect, useRef } from "react";

import { Icon } from "@symphony-ui/uitoolkit-components";
import { useState } from "react";
import ScopeToggle from "../ScopeToggle/ScopeToggle";
import "./Graph.scss";
import {
  CHART_COLORS,
  LABELS,
  Scope,
  SYNC_CHART_SCOPE_INTENT,
  numbers,
} from "./Graph.utils";

export interface GraphProps {
  dealId: string;
  dealName: string;
  onShare: (scope: Scope) => any;
  onShareScreenshot: (base64Image: string) => any;
  sdkLoaded: Promise<any>;
}

export function Graph(props: GraphProps) {
  const chartId = `chart-${props.dealId}`;
  const chartRef = useRef<HTMLCanvasElement>(null);

  const [chart, setChart] = useState<Chart | undefined>();
  const [activeScope, setActiveScope] = useState(Scope.Year);

  useEffect(() => {
    props.sdkLoaded.then(() => {
      (window as any).symphony.registerInterop((intent: any, context: any) => {
        if (intent === SYNC_CHART_SCOPE_INTENT) {
          setActiveScope(context.scope);
        }
      });
    });

    return () => {
      chart?.destroy();
    };
  }, []);

  useLayoutEffect(() => {
    chart?.destroy();

    Chart.register(...registerables);
    const labels = LABELS[activeScope];
    const newChart = new Chart(chartRef.current!.getContext("2d")!, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data: numbers({
              count: labels.length,
              min: 50,
              max: 100,
            }),
            borderColor: CHART_COLORS.red,
            backgroundColor: CHART_COLORS.red,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: props.dealName,
          },
        },
      },
    });

    setChart(newChart);
  }, [activeScope]);

  const onShareScreenshot = () => {
    if (chart) {
      props.onShareScreenshot(chart.toBase64Image("image/jpeg", 1));
    }
  };

  const onShare = () => {
    if (chart) {
      props.onShare(activeScope);
    }
  };

  return (
    <>
      <div className="actions-container">
        <Icon iconName="screenshot" onClick={onShareScreenshot} />
        <Icon iconName="share" onClick={onShare} />
      </div>

      <div className="chart-container">
        <canvas ref={chartRef} id={chartId}></canvas>
      </div>

      <ScopeToggle value={activeScope} onChange={setActiveScope} />
    </>
  );
}
