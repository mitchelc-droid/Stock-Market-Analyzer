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

        # Flatten MultiIndex columns if necessary
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # Ensure required columns exist
        required_cols = ['Close', 'High', 'Low', 'Volume']
        for col in required_cols:
            if col not in df.columns:
                if col == 'Close':
                    df[col] = df.get('Adj Close', pd.NA)
                elif col == 'Volume':
                    df[col] = 0
                else:  # High or Low
                    df[col] = df.get('Close', pd.NA)

        # Drop rows where Close is missing
        df = df.dropna(subset=['Close'])
        if df.empty:
            return jsonify({"error": f"No valid rows for ticker {ticker}"}), 404

        # Squeeze columns to Series
        close = df['Close'].squeeze()
        high = df['High'].squeeze()
        low = df['Low'].squeeze()
        volume = df['Volume'].squeeze()

        # --- Technical Indicators ---
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

        latest = df.iloc[-1]

        response = {
            "ticker": ticker,
            "latest": {
                "close": float(latest['Close']),
                "sma50": float(latest['SMA_50']) if pd.notna(latest['SMA_50']) else None,
                "sma200": float(latest['SMA_200']) if pd.notna(latest['SMA_200']) else None,
                "rsi": float(latest['RSI']) if pd.notna(latest['RSI']) else None,
                "atr": float(latest['ATR']) if pd.notna(latest['ATR']) else None,
                "obv": int(latest['OBV']) if pd.notna(latest['OBV']) else None
            },
            "timeseries": {
                "dates": df.index.strftime('%Y-%m-%d').tolist(),
                "close": [float(x) if pd.notna(x) else None for x in df['Close'].round(2)],
                "sma50": [float(x) if pd.notna(x) else None for x in df['SMA_50'].round(2)],
                "sma200": [float(x) if pd.notna(x) else None for x in df['SMA_200'].round(2)],
                "macd": [float(x) if pd.notna(x) else None for x in df['MACD_line'].round(4)],
                "macd_signal": [float(x) if pd.notna(x) else None for x in df['MACD_signal'].round(4)],
                "bb_high": [float(x) if pd.notna(x) else None for x in df['BB_high'].round(2)],
                "bb_low": [float(x) if pd.notna(x) else None for x in df['BB_low'].round(2)],
                "rsi": [float(x) if pd.notna(x) else None for x in df['RSI'].round(2)],
                "atr": [float(x) if pd.notna(x) else None for x in df['ATR'].round(2)],
                "obv": [int(x) if pd.notna(x) else 0 for x in df['OBV']]
            }
        }

        return jsonify(response)

    except Exception as e:
        print(f"Error processing {ticker}:")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)
