from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
from ta.trend import MACD
from ta.volatility import BollingerBands, AverageTrueRange
from ta.momentum import RSIIndicator
from ta.volume import OnBalanceVolumeIndicator
import traceback

app = Flask(__name__)
CORS(app)

@app.route('/api/metrics/<ticker>')
def get_metrics(ticker):
    try:
        # Download historical data
        df = yf.download(ticker, period='2y', progress=False, auto_adjust=True)
        if df.empty:
            return jsonify({"error": f"No data returned for ticker {ticker}"}), 404

        # Flatten MultiIndex if needed
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # Ensure required columns exist
        for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
            if col not in df.columns:
                if col == 'Close':
                    df[col] = df.get('Adj Close', pd.NA)
                elif col == 'Volume':
                    df[col] = 0
                else:  # Open, High, Low
                    df[col] = df.get('Close', pd.NA)

        df = df.dropna(subset=['Close'])
        if df.empty:
            return jsonify({"error": f"No valid rows for ticker {ticker}"}), 404

        # --- Technical indicators ---
        close = df['Close']
        high = df['High']
        low = df['Low']
        volume = df['Volume']

        df['SMA_50'] = close.rolling(50).mean()
        df['SMA_200'] = close.rolling(200).mean()
        macd = MACD(close)
        df['MACD_line'] = macd.macd()
        df['MACD_signal'] = macd.macd_signal()
        bb = BollingerBands(close)
        df['BB_high'] = bb.bollinger_hband()
        df['BB_low'] = bb.bollinger_lband()
        df['RSI'] = RSIIndicator(close).rsi()
        df['ATR'] = AverageTrueRange(high, low, close).average_true_range()
        df['OBV'] = OnBalanceVolumeIndicator(close, volume).on_balance_volume()

        # --- Timeseries for Lightweight Charts ---
        timeseries = []
        for i, row in df.iterrows():
            timeseries.append({
                "time": int(row.name.timestamp()),  # seconds
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "sma50": float(row["SMA_50"]) if pd.notna(row["SMA_50"]) else None,
                "sma200": float(row["SMA_200"]) if pd.notna(row["SMA_200"]) else None,
                "bb_high": float(row["BB_high"]) if pd.notna(row["BB_high"]) else None,
                "bb_low": float(row["BB_low"]) if pd.notna(row["BB_low"]) else None
            })

        latest = df.iloc[-1]
        response = {
            "ticker": ticker,
            "latest": {
                "close": float(latest['Close']),
                "sma50": float(latest['SMA_50']) if pd.notna(latest['SMA_50']) else None,
                "sma200": float(latest['SMA_200']) if pd.notna(latest['SMA_200']) else None
            },
            "timeseries": timeseries
        }

        return jsonify(response)

    except Exception as e:
        print(f"Error processing {ticker}:")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)
