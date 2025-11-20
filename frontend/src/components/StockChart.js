import React, { useRef, useEffect } from "react";
import { createChart } from "lightweight-charts";

export default function StockChart({ data, height = 400 }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candleSeriesRef = useRef();

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !data || !data.length) return;

    // Create chart
    chartRef.current = createChart(container, {
      width: container.clientWidth,
      height,
      layout: { backgroundColor: "#1e1e1e", textColor: "aliceblue" },
      grid: { vertLines: { color: "#444" }, horzLines: { color: "#444" } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#555" },
      timeScale: { borderColor: "#555", timeVisible: true },
    });

    // Candlestick series
    candleSeriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: "#4caf50",
      downColor: "#f44336",
      borderUpColor: "#4caf50",
      borderDownColor: "#f44336",
      wickUpColor: "#4caf50",
      wickDownColor: "#f44336",
    });

    // Set initial data
    candleSeriesRef.current.setData(
      data.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    );

    // Handle resizing
    const handleResize = () => {
      chartRef.current?.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      chartRef.current?.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [data, height]);

  return <div ref={chartContainerRef} style={{ width: "100%", height }} />;
}
