import React from "react";

// This component uses the simple Object.entries layout you provided.
// I've just wrapped it in the Bootstrap card structure for consistency.
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
    <div className="card mb-3" style={{height: 200}}>
      <div className="card-header" style={{ backgroundColor: "#b6afafff" }}>
        <h5>Key Metrics for: {metrics.ticker}</h5>
      </div>
      <div className="card-body" style={{ backgroundColor: "#333" }}>
        <div
          className="row"
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            flexWrap: "wrap",
          }}
        >
          {Object.entries(latest).map(([key, value]) => (
            <div className="col-lg-2 col-md-4 col-sm-6 mb-3" key={key}>
              <div className="card text-center h-100">
                <div className="card-body">
                  <h6
                    className="card-title text-muted"
                    style={{ fontSize: "0.9rem" }}
                  >
                    {formatKey(key)}
                  </h6>
                  <p className="card-text fs-5 fw-bold">
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
