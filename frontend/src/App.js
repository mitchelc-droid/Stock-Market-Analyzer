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

  const loadMetrics = async (selectedTicker = ticker, selectedSpan = timeSpan) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/api/metrics/${selectedTicker}?span=${selectedSpan}`
      );

      const data = response.data;

      if (data && data.timeseries && data.timeseries.length > 0) {
        // Store the entire response object, including latest & timeseries
        setMetrics(data);
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

      

      {/* Error message */}
      {error && <p className="text-danger">{error}</p>}

      {/* Loading message */}
      {loading && <p className="text-light">Loading...</p>}

      {/* Metrics panel */}
      {!loading && metrics && <MetricsPanel metrics={metrics} />}

      {/* Stock chart */}
      {!loading && metrics?.timeseries?.length > 0 && (
        <StockChart data={metrics.timeseries} height={400} />
      )}

      {/* Time span buttons */}
      <div className="btn-group mb-3">
        {["1d", "1w", "1m", "3m", "1y"].map((span) => (
          <button
            key={span}
            className={`btn btn-secondary ${timeSpan === span ? "active" : ""}`}
            onClick={() => setTimeSpan(span)}
            disabled={loading}
          >
            {span}
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
