from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import os

app = Flask(__name__)
# Configure CORS to allow requests from GitHub Pages
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://dvdjsp.github.io",
            "http://localhost:3000",
            "http://localhost:5000"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": False
    }
})

@app.route('/api/stock-data', methods=['GET'])
def get_stock_data():
    """Fetch stock data from Yahoo Finance"""
    ticker = request.args.get('ticker', 'AAPL')
    start = request.args.get('start', '2024-01-01')
    end = request.args.get('end', '2024-12-31')
    interval = request.args.get('interval', '1d')
    
    try:
        # Download data from yfinance using download method (more reliable)
        print(f"Fetching {ticker} from {start} to {end} with interval {interval}")
        data = yf.download(ticker, start=start, end=end, interval=interval, progress=False)
        
        if data.empty:
            return jsonify({
                'success': False,
                'error': f'No data found for {ticker}. Check ticker symbol and date range.'
            }), 404
        
        # Convert to list of dicts for JSON
        result = []
        for index, row in data.iterrows():
            result.append({
                'time': index.isoformat(),
                'timestamp': index.timestamp(),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume'])
            })
        
        print(f"Successfully fetched {len(result)} data points")
        print(f"First timestamp: {result[0]['time']}, Last timestamp: {result[-1]['time']}")
        print(f"Price range: ${result[0]['close']:.2f} to ${result[-1]['close']:.2f}")
        
        return jsonify({
            'success': True,
            'ticker': ticker.upper(),
            'interval': interval,
            'data': result,
            'count': len(result)
        })
        
    except Exception as e:
        print(f"Error fetching data: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error fetching data: {str(e)}'
        }), 400

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'yfinance-api'})

if __name__ == '__main__':
    print("Starting Flask server on http://localhost:5000")
    print("Available intervals: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo")
    print("Note: 1m data only available for last 7-30 days")
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
