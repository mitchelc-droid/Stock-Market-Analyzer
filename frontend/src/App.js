import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import StockChart from "./components/StockChart";
import MetricsPanel from "./components/MetricsPanel";

/*React: JS library that uses a virtual DOM to only reflect changes made and emphasizes modularity
  useState: Allows webpage to remember things
  Bootstrap: CSS library 
  axios: Enables requests to backend server, skips JSON converting, catches errors, etc.
  StockChart & MetricsPanel: Custom components that appear on the page*/

//The entire page the user will see
function App() {
  const [ticker, setTicker] = useState();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  //Changing variables that the website will need to remember and automatically reflect changes

  const validateTicker = () => {
    if (!ticker || ticker.trim() === "") {
      setError("Ticker cannot be empty.");
      return false;
    }

    if (!/^[A-Z]{1,5}$/.test(ticker)) {
      setError("Ticker must be 1–5 letters (A–Z only).");
      return false;
    }

    return true;
  };

  //Function that fetches the backend stock infromation
  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    setMetrics(null);

    //Request information from provided ticker, if not found
    try {
      const response = await axios.get(
        //.then chain bypassed with axios
        `http://127.0.0.1:5000/api/metrics/${ticker}`
      );
      setMetrics(response.data); //Calls setMetrics so that UI changes when ticker changes
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        //Did the backend send a response, does it have a JSON body, does it have an error field?
        setError(err.response.data.error); //Set error message to response error
      } else {
        setError("An unexpected error occurred."); //Unkown error occured
      }
      console.error("API error:", err); //Alert user with error message
    } finally {
      setLoading(false); //Reflect that app is not loading anymore
    }
  };

  return (
    <div className="container mt-4">
      <h1>Stock Dashboard</h1>
      <div className="input-group mb-3">
        <input
          className="form-control"
          value={ticker}
          onChange={(e) => {
            setTicker(e.target.value.toUpperCase());
            setError(""); // Clear error when typing
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (validateTicker()) {
                loadMetrics();
              }
            }
          }}
          placeholder="Enter ticker (e.g., AAPL)"
        />

        <button
          className="btn btn-primary"
          onClick={() => {
            if (validateTicker()) {
              loadMetrics();
            }
          }}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {error && <p className="text-danger">{error}</p>}

      {metrics && (
        <>
          <StockChart timeseries={metrics.timeseries} />
          <MetricsPanel metrics={metrics} />
        </>
      )}
    </div>
  );
}

export default App;
