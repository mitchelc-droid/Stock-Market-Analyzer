import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export async function getMetrics(ticker) {
  try {
    const res = await axios.get(`${API_BASE}/metrics/${ticker}`);
    return res.data;
  } catch (err) {
    console.error('API error:', err);
    return null;
  }
}
