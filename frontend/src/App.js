import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import StockChart from "./components/StockChart";
import MetricsPanel from "./components/MetricsPanel";
import axios from "axios";

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [inputTicker, setInputTicker] = useState("AAPL");
  const [metrics, setMetrics] = useState(null);
  const [timeSpan, setTimeSpan] = useState("1m");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60); // seconds
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadMetrics = async (
    selectedTicker = ticker,
    selectedSpan = timeSpan
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/api/metrics/${selectedTicker}?span=${selectedSpan}`
      );

      const data = response.data;

      if (data && data.timeseries && data.timeseries.length > 0) {
        setMetrics(data);
        setLastUpdated(new Date());
      } else {
        setMetrics(null);
        setError("No data available for this ticker/time span.");
      }
    } catch (err) {
      console.error(err);
      setMetrics(null);
      setError("Failed to fetch stock data.");
    } finally {
      setLoading(false);
    }
  };

  // Reload when ticker or timespan changes
  useEffect(() => {
    loadMetrics(ticker, timeSpan);
  }, [ticker, timeSpan]);

  // Auto-refresh effect
  useEffect(() => {
    // Only auto-refresh for intraday timeframes and if enabled
    if (!autoRefresh || (timeSpan !== "1d" && timeSpan !== "1w")) return;
    
    const interval = setInterval(() => {
      console.log("Auto-refreshing data...");
      loadMetrics(ticker, timeSpan);
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [ticker, timeSpan, autoRefresh, refreshInterval]);

  // Format last updated time
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return "Never";
    
    const seconds = Math.floor((new Date() - lastUpdated) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Update the "time ago" display every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="container-fluid mt-4"
      style={{ backgroundColor: "#1e1e1e", minHeight: "100vh" }}
    >
      <h1 className="text-light mb-3">Stock Dashboard</h1>

      {/* Ticker input */}
      <div className="input-group mb-3">
        <input
          className="form-control"
          value={inputTicker}
          onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
          placeholder="Enter ticker (e.g., AAPL)"
        />
        <button
          className="btn btn-primary"
          onClick={() => setTicker(inputTicker)}
          disabled={loading || !inputTicker.trim()}
        >
          Load
        </button>
      </div>

      {/* Auto-refresh controls */}
      <div className="mb-3 d-flex align-items-center gap-3">
        <button
          className={`btn ${autoRefresh ? "btn-success" : "btn-secondary"}`}
          onClick={() => setAutoRefresh(!autoRefresh)}
          disabled={timeSpan !== "1d" && timeSpan !== "1w"}
        >
          {autoRefresh ? "⏸ Pause" : "▶ Play"} Auto-Refresh
        </button>
        
        <select
          className="form-select"
          style={{ width: "150px" }}
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
          disabled={!autoRefresh}
        >
          <option value={30}>30 seconds</option>
          <option value={60}>1 minute</option>
          <option value={300}>5 minutes</option>
          <option value={600}>10 minutes</option>
        </select>

        <span className="text-light">
          Last updated: {getTimeSinceUpdate()}
        </span>

        <button
          className="btn btn-outline-light btn-sm"
          onClick={() => loadMetrics(ticker, timeSpan)}
          disabled={loading}
        >
          🔄 Refresh Now
        </button>
      </div>

      {/* Info text for auto-refresh */}
      {(timeSpan === "1d" || timeSpan === "1w") && autoRefresh && (
        <div className="alert alert-info mb-3">
          Auto-refresh enabled - updating every {refreshInterval} seconds
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-danger">{error}</p>}

      {/* Loading message */}
      {loading && <p className="text-light">Loading...</p>}

      <div style={{ width: "70%" }}>
        {/* Metrics panel */}
        {!loading && metrics && <MetricsPanel metrics={metrics} />}

        {/* Stock chart */}
        {!loading && metrics?.timeseries?.length > 0 && (
          <StockChart
            data={metrics.timeseries}
            height={400}
            timeSpan={timeSpan}
          />
        )}
      </div>

      {/* Time span buttons */}
      <div className="btn-group mb-3">
        {["1d", "1w", "1m", "3m", "1y", "ytd"].map((span) => (
          <button
            key={span}
            className={`btn btn-secondary ${timeSpan === span ? "active" : ""}`}
            onClick={() => setTimeSpan(span)}
            disabled={loading}
          >
            {span.toUpperCase()}
          </button>
        ))}
      </div>

      {!loading && !metrics && !error && (
        <p className="text-light">No data to display.</p>
      )}
    </div>
  );
}

export default App;