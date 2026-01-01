from flask import Flask, jsonify, request
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
        # Get span parameter from query string (default to 1m)
        span = request.args.get('span', '1m')
        
        # Map span to yfinance period and interval (TradingView-style)
        span_config = {
            '1d': {'period': 'max', 'interval': '1m'},    # 1-min candles over all available data
            '1w': {'period': 'max', 'interval': '5m'},    # 5-min candles over all available data
            '1m': {'period': 'max', 'interval': '30m'},   # 30-min candles over all available data
            '3m': {'period': 'max', 'interval': '1h'},    # 1-hour candles over all available data
            '1y': {'period': 'max', 'interval': '1d'},    # Daily candles over all available data
            'ytd': {'period': 'max', 'interval': '1d'}    # Daily candles over all available data
        }
        
        config = span_config.get(span, {'period': '3mo', 'interval': '1d'})
        
        # Download historical data with appropriate period and interval
        df = yf.download(
            ticker, 
            period=config['period'], 
            interval=config['interval'],
            progress=False, 
            auto_adjust=True
        )
        
        if df.empty:
            return jsonify({"error": f"No data returned for ticker {ticker}"}), 404
        
        print(f"Downloaded {len(df)} rows for {ticker} with span={span}")
        print(df[['Close', 'Volume']].tail())

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
        
        # Only calculate MACD if we have enough data
        if len(df) > 26:
            macd = MACD(close)
            df['MACD_line'] = macd.macd()
            df['MACD_signal'] = macd.macd_signal()
        
        # Only calculate Bollinger Bands if we have enough data
        if len(df) > 20:
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
                "volume": int(row["Volume"]),
                "sma50": float(row["SMA_50"]) if pd.notna(row["SMA_50"]) else None,
                "sma200": float(row["SMA_200"]) if pd.notna(row["SMA_200"]) else None,
                "bb_high": float(row.get("BB_high", pd.NA)) if pd.notna(row.get("BB_high", pd.NA)) else None,
                "bb_low": float(row.get("BB_low", pd.NA)) if pd.notna(row.get("BB_low", pd.NA)) else None
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
    app.run(debug=True, port=5000)