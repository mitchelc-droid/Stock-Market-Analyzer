import React, { useRef, useEffect } from "react";
import { createChart } from "lightweight-charts";

export default function StockChart({ data, height = 550, timeSpan = "1m" }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candleSeriesRef = useRef();
  const volumeSeriesRef = useRef();

  // Create chart once on mount
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

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

    candleSeriesRef.current.priceScale().applyOptions({
      autoScale: false,
      scaleMargins: {
        top: 0.1,
        bottom: 0.2,
      },
    });

    // Adding volume histogram
    volumeSeriesRef.current = chartRef.current.addHistogramSeries({
      priceScaleId: "volume",
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Handle resizing
    const handleResize = () => {
      chartRef.current?.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      chartRef.current?.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [height]); // Only recreate if height changes

  // Update data when it changes
  useEffect(() => {
    if (!data || !data.length || !candleSeriesRef.current || !volumeSeriesRef.current) return;

    // Update candlestick data
    candleSeriesRef.current.setData(
      data.map((d) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    );

    // Update volume data
    volumeSeriesRef.current.setData(
      data.map((d) => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? "#4caf50" : "#f44336",
      }))
    );
  }, [data]);

  // Zoom to selected timespan, but allow scrolling back
  useEffect(() => {
    if (!data || !data.length || !chartRef.current) return;

    const latestTime = data[data.length - 1].time;
    let fromTime;

    switch (timeSpan) {
      case "1d":
        fromTime = latestTime - 86400; // 1 day
        break;
      case "1w":
        fromTime = latestTime - 604800; // 7 days
        break;
      case "1m":
        fromTime = latestTime - 2592000; // 30 days
        break;
      case "3m":
        fromTime = latestTime - 7776000; // 90 days
        break;
      case "1y":
        fromTime = latestTime - 31536000; // 365 days
        break;
      case "ytd":
        // Calculate from Jan 1 of the current year (2026)
        const currentYear = new Date().getFullYear();
        let ytdJanFirst = new Date(currentYear, 0, 1);
        let ytdFromTime = Math.floor(ytdJanFirst.getTime() / 1000);
        
        // If current year data isn't available, fallback to previous year
        if (ytdFromTime > latestTime) {
          ytdJanFirst = new Date(currentYear - 1, 0, 1);
          ytdFromTime = Math.floor(ytdJanFirst.getTime() / 1000);
        }
        
        fromTime = ytdFromTime;
        break;
      default:
        chartRef.current.timeScale().fitContent();
        return;
    }

    chartRef.current.timeScale().setVisibleRange({
      from: fromTime,
      to: latestTime,
    });
  }, [timeSpan, data]);

  return <div ref={chartContainerRef} style={{ width: "100%", height }} />;
}