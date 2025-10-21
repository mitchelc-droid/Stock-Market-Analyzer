# --- api.py ---

from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import yfinance as yf
from ta.volatility import BollingerBands
from ta.momentum import RSIIndicator
from ta.trend import MACD

# Initialize the Flask app
app = Flask(__name__)
# Enable CORS (Cross-Origin Resource Sharing) to allow our front-end to access the API
CORS(app)

@app.route('/api/stock-data/<ticker>')
def get_stock_data(ticker):
    try:
        # --- 1. FETCH DATA ---
        stock_data_raw = yf.download(ticker, period='2y')
        if stock_data_raw.empty:
            return jsonify({"error": f"No data found for ticker: {ticker}"}), 404

        # Flatten MultiIndex columns (sometimes happens if Yahoo returns multi-level names)
        if isinstance(stock_data_raw.columns, pd.MultiIndex):
            stock_data_raw.columns = stock_data_raw.columns.get_level_values(0)

        stock_data = stock_data_raw.copy()

        # --- 2. ENSURE CLOSE IS 1D ---
        close_prices = stock_data['Close']
        if isinstance(close_prices, pd.DataFrame):
            close_prices = close_prices.squeeze()  # convert (n,1) → (n,)

        # --- 3. CALCULATE METRICS ---
        stock_data['SMA_50'] = close_prices.rolling(window=50).mean()
        stock_data['SMA_200'] = close_prices.rolling(window=200).mean()

        bb_indicator = BollingerBands(close=close_prices, window=20, window_dev=2)
        stock_data['BB_High'] = bb_indicator.bollinger_hband()
        stock_data['BB_Low'] = bb_indicator.bollinger_lband()

        macd_indicator = MACD(close=close_prices)
        stock_data['MACD_line'] = macd_indicator.macd()
        stock_data['MACD_signal'] = macd_indicator.macd_signal()
        stock_data['MACD_hist'] = macd_indicator.macd_diff()

        rsi_indicator = RSIIndicator(close=close_prices)
        stock_data['RSI'] = rsi_indicator.rsi()

        # --- 4. FETCH FUNDAMENTALS ---
        ticker_obj = yf.Ticker(ticker)
        info = ticker_obj.info or {}

        fundamentals_json = {
            "marketCap": info.get('marketCap'),
            "trailingPE": info.get('trailingPE'),
            "forwardPE": info.get('forwardPE'),
            "debtToEquity": info.get('debtToEquity'),
            "dividendYield": info.get('dividendYield'),
            "fiftyTwoWeekHigh": info.get('fiftyTwoWeekHigh'),
            "fiftyTwoWeekLow": info.get('fiftyTwoWeekLow')
        }

        # --- 5. PREPARE DATA FOR JSON ---
        historical_data_json = stock_data.reset_index().to_json(
            orient="split", date_format="iso"
        )

        # --- 6. RETURN RESPONSE ---
        return jsonify({
            "historicalData": historical_data_json,
            "fundamentals": fundamentals_json
        })

    except Exception as e:
        # Return a readable error if something goes wrong
        return jsonify({"error": f"Error fetching data: {str(e)}"}), 500


if __name__ == '__main__':
    # Run the app in debug mode on port 5000
    app.run(debug=True, use_reloader=False, port=5000)
