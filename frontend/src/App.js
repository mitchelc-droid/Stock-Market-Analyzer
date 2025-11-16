import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import StockChart from './components/StockChart';
import MetricsPanel from './components/MetricsPanel';

function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    setMetrics(null);

    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/metrics/${ticker}`);
      setMetrics(response.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An unexpected error occurred.');
      }
      console.error('API error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h1>Stock Dashboard</h1>
      <div className="input-group mb-3">
        <input
          className="form-control"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Enter ticker (e.g., AAPL)"
        />
        <button className="btn btn-primary" onClick={loadMetrics} disabled={loading}>
          {loading ? 'Loading...' : 'Load'}
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
