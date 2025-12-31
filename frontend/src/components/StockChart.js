import React, { useRef, useEffect } from "react";
import { createChart } from "lightweight-charts";

export default function StockChart({ data, height = 400 }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candleSeriesRef = useRef();
  const volumeSeriesRef = useRef();

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !data || !data.length) return;

    // Create chart
    chartRef.current = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { color: "#222" },
        textColor: "#DDD",
      },
      grid: {
        vertLines: { color: "#444" },
        horzLines: { color: "#444" },
      },
      height: 400,
      width: 1200,
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#555" },
      timeScale: { borderColor: "#555", timeVisible: true },
    });

    // Candlestick series
    candleSeriesRef.current = chartRef.current.addCandlestickSeries({
      color: "#2962FF",
      upColor: "#4caf50",
      downColor: "#f44336",
      borderUpColor: "#4caf50",
      borderDownColor: "#f44336",
      wickUpColor: "#4caf50",
      wickDownColor: "#f44336",
    });

    // Set initial data
    candleSeriesRef.current.setData(
      data.map((d) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    );

    candleSeriesRef.current.priceScale().applyOptions({
      autoScale: false, // disables auto scaling based on visible content
      scaleMargins: {
        top: 0.1,
        bottom: 0.2,
      },
    });

    // Handle resizing
    const handleResize = () => {
      chartRef.current?.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    // Adding volume histogram
    volumeSeriesRef.current = chartRef.current.addHistogramSeries({
      priceScaleId: "volume",
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      scaleMargins: {
        top: 0.8, // volume takes bottom 20%
        bottom: 0,
      },
    });

    chartRef.current.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeriesRef.current.setData(
      data.map((d) => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? "#4caf50" : "#f44336",
      }))
    );

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      chartRef.current?.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [data, height]);

  return <div ref={chartContainerRef} style={{ width: "100%", height }} />;
}
