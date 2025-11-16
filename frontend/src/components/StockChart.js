import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

export default function StockChart({ timeseries }) {
  if (!timeseries || !timeseries.dates) return null;

  const data = timeseries.dates.map((d, i) => ({
    date: d,
    close: timeseries.close[i],
    sma50: timeseries.sma50[i],
    sma200: timeseries.sma200[i],
    bb_high: timeseries.bb_high[i],
    bb_low: timeseries.bb_low[i]
  }));

  return (
    <div style={{ width: '100%', height: 400 }} className="mb-4">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" hide />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="close" dot={false} stroke="#0d6efd" />
          <Line type="monotone" dataKey="sma50" dot={false} stroke="#198754" />
          <Line type="monotone" dataKey="sma200" dot={false} stroke="#dc3545" />
          <Line
            type="monotone"
            dataKey="bb_high"
            dot={false}
            stroke="#6c757d"
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="bb_low"
            dot={false}
            stroke="#6c757d"
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
