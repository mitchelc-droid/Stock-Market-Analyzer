import React from "react";

export default function MetricsPanel({ metrics }) {
  if (!metrics || !metrics.latest) return null;

  const latest = metrics.latest || {};

  // Helper to format keys
  const formatKey = (key) => {
    switch (key) {
      case "close":
        return "Close";
      case "sma50":
        return "SMA 50";
      case "sma200":
        return "SMA 200";
      case "rsi":
        return "RSI";
      case "atr":
        return "ATR";
      case "obv":
        return "OBV";
      default:
        return key.toUpperCase();
    }
  };

  // Helper to format values
  const formatValue = (key, value) => {
    if (value === null || value === undefined) return "N/A";

    switch (key) {
      case "close":
      case "sma50":
      case "sma200":
      case "atr":
        return `$${value.toFixed(2)}`;
      case "rsi":
        return value.toFixed(2);
      case "obv":
        return value.toLocaleString();
      default:
        return value;
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-header py-2" style={{ backgroundColor: "#b6afafff" }}>
        <h6 className="mb-0">Key Metrics: {metrics.ticker}</h6>
      </div>
      <div className="card-body py-2" style={{ backgroundColor: "#333" }}>
        <div
          className="row"
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            flexWrap: "wrap",
          }}
        >
          {Object.entries(latest).map(([key, value]) => (
            <div className="col-lg-2 col-md-4 col-sm-6 mb-2" key={key}>
              <div className="card text-center h-100">
                <div className="card-body py-2 px-2">
                  <h6
                    className="card-title text-muted mb-1"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {formatKey(key)}
                  </h6>
                  <p className="card-text fs-6 fw-bold mb-0">
                    {formatValue(key, value)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}