/* eslint-disable react-hooks/exhaustive-deps */
import { Chart, registerables } from "chart.js";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";

import { Icon } from "@symphony-ui/uitoolkit-components";
import { useState } from "react";
import ScopeToggle from "../ScopeToggle/ScopeToggle";
import "./Graph.scss";
import {
  CHART_COLORS,
  LABELS,
  SYNC_CHART_SCOPE_INTENT,
  Scope,
  numbers,
} from "./Graph.utils";
import classNames from "classnames";

export interface GraphProps {
  dealId: string;
  dealName: string;
  onShare: ((scope: Scope) => any) | undefined;
  onShareScreenshot: ((base64Image: string | undefined) => any) | undefined;
}

export interface GraphRefType {
  getChartImage: () => string | undefined;
}

const Graph = forwardRef((props: GraphProps, ref) => {
  const chartId = `chart-${props.dealId}`;
  const chartRef = useRef<HTMLCanvasElement>(null);

  const [chart, setChart] = useState<Chart | undefined>();
  const [activeScope, setActiveScope] = useState(Scope.YEAR);

  useEffect(() => {
    (window as any).symphony.registerInterop((intent: any, context: any) => {
      if (intent === SYNC_CHART_SCOPE_INTENT) {
        setActiveScope(context.scope);
      }
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
  }, [props.dealId, activeScope]);

  const getChartImage = () => chart?.toBase64Image("image/jpeg", 1);

  useImperativeHandle(ref, () => ({
    getChartImage,
  }));

  const onShareScreenshot = () => {
    if (chart) {
      props.onShareScreenshot?.(getChartImage());
    }
  };

  const onShare = () => {
    if (chart) {
      props.onShare?.(activeScope);
    }
  };

  return (
    <>
      <div className="actions-container">
        <Icon
          iconName="screenshot"
          onClick={onShareScreenshot}
          className={classNames({ disabled: !props.onShareScreenshot })}
        />
        <Icon
          iconName="share"
          onClick={onShare}
          className={classNames({ disabled: !props.onShare })}
        />
      </div>

      <div className="chart-container">
        <canvas ref={chartRef} id={chartId}></canvas>
      </div>

      <ScopeToggle value={activeScope} onChange={setActiveScope} />
    </>
  );
});

export default Graph;
