/* app.js */

// Wait for the entire webpage to load before running our code
document.addEventListener('DOMContentLoaded', () => {
    
    // Get references to our HTML elements
    const tickerInput = document.getElementById('ticker-input');
    const searchButton = document.getElementById('search-button');
    const fundamentalsContainer = document.getElementById('fundamentals-container');
    const priceChartDiv = document.getElementById('price-chart');
    const macdChartDiv = document.getElementById('macd-chart');
    const rsiChartDiv = document.getElementById('rsi-chart');
    const loadingMessage = document.getElementById('loading-message');

    // Add a click event listener to the search button
    searchButton.addEventListener('click', fetchData);
    
    // Allow pressing 'Enter' in the input box
    tickerInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            fetchData();
        }
    });

    // --- Main function to fetch and display data ---
    async function fetchData() {
        const ticker = tickerInput.value.toUpperCase();
        if (!ticker) {
            alert('Please enter a stock ticker.');
            return;
        }

        // Show loading message and clear old data
        loadingMessage.classList.remove('hidden');
        fundamentalsContainer.innerHTML = '';
        priceChartDiv.innerHTML = '';
        macdChartDiv.innerHTML = '';
        rsiChartDiv.innerHTML = '';

        try {
            // --- This is the API CALL ---
            // We fetch data from our Python Flask server, which is running on port 5000
            const response = await fetch(`http://127.0.0.1:5000/api/stock-data/${ticker}`);
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Hide loading message
            loadingMessage.classList.add('hidden');

            // Display the data
            displayFundamentals(data.fundamentals);
            
            // Parse the historical data JSON
            const historicalData = JSON.parse(data.historicalData);
            displayCharts(historicalData);

        } catch (error) {
            loadingMessage.classList.add('hidden');
            alert(`Error fetching data: ${error.message}`);
            console.error('Error:', error);
        }
    }

    // --- Function to display fundamentals ---
    function displayFundamentals(fundamentals) {
        // Clear previous data
        fundamentalsContainer.innerHTML = '';

        // Helper to format numbers
        const formatNum = (num, type) => {
            if (num === null || num === undefined) return 'N/A';
            if (type === 'money') return `$${(num / 1_000_000_000).toFixed(2)}B`;
            if (type === 'percent') return `${(num * 100).toFixed(2)}%`;
            return num.toFixed(2);
        };
        
        // Create metric "cards" and add them
        const metrics = [
            { label: 'Market Cap', value: formatNum(fundamentals.marketCap, 'money') },
            { label: 'P/E (TTM)', value: formatNum(fundamentals.trailingPE) },
            { label: 'P/E (Fwd)', value: formatNum(fundamentals.forwardPE) },
            { label: 'Debt/Equity', value: formatNum(fundamentals.debtToEquity) },
            { label: 'Div. Yield', value: formatNum(fundamentals.dividendYield, 'percent') },
            { label: '52-Wk High', value: formatNum(fundamentals.fiftyTwoWeekHigh) },
            { label: '52-Wk Low', value: formatNum(fundamentals.fiftyTwoWeekLow) }
        ];

        metrics.forEach(metric => {
            const metricDiv = document.createElement('div');
            metricDiv.className = 'metric';
            metricDiv.innerHTML = `
                <div class="metric-label">${metric.label}</div>
                <div class="metric-value">${metric.value}</div>
            `;
            fundamentalsContainer.appendChild(metricDiv);
        });
    }

    // --- Function to display all charts ---
    function displayCharts(data) {
        // 'data' is now an object: { index: [...], columns: [...], data: [[...], [...]] }
        // We need to re-organize this for Plotly.js
        const dates = data.index.map(d => new Date(d));
        
        // Helper to get a column by its name
        const getColumn = (name) => {
            const index = data.columns.indexOf(name);
            return data.data.map(row => row[index]);
        };

        const chartLayout = {
            xaxis: { rangeslider: { visible: false } },
            margin: { t: 30, b: 30, l: 50, r: 20 },
            legend: { x: 0, y: 1.1, orientation: 'h' }
        };

        // 1. Price Chart
        const priceTrace = {
            x: dates,
            open: getColumn('Open'),
            high: getColumn('High'),
            low: getColumn('Low'),
            close: getColumn('Close'),
            type: 'candlestick',
            name: 'Price'
        };
        const sma50Trace = { x: dates, y: getColumn('SMA_50'), type: 'scatter', mode: 'lines', name: 'SMA 50', line: { color: 'orange' } };
        const sma200Trace = { x: dates, y: getColumn('SMA_200'), type: 'scatter', mode: 'lines', name: 'SMA 200', line: { color: 'red' } };
        const bbHighTrace = { x: dates, y: getColumn('BB_High'), type: 'scatter', mode: 'lines', name: 'BB High', line: { color: 'gray', dash: 'dash' } };
        const bbLowTrace = { x: dates, y: getColumn('BB_Low'), type: 'scatter', mode: 'lines', name: 'BB Low', line: { color: 'gray', dash: 'dash' } };

        Plotly.newPlot(priceChartDiv, [priceTrace, sma50Trace, sma200Trace, bbHighTrace, bbLowTrace], 
            { ...chartLayout, title: 'Price Chart' });

        // 2. MACD Chart
        const macdLineTrace = { x: dates, y: getColumn('MACD_line'), type: 'scatter', mode: 'lines', name: 'MACD Line', line: { color: 'blue' } };
        const macdSignalTrace = { x: dates, y: getColumn('MACD_signal'), type: 'scatter', mode: 'lines', name: 'Signal Line', line: { color: 'orange' } };
        const macdHistTrace = { x: dates, y: getColumn('MACD_hist'), type: 'bar', name: 'Histogram', marker: { color: 'grey' } };
        
        Plotly.newPlot(macdChartDiv, [macdLineTrace, macdSignalTrace, macdHistTrace], 
            { ...chartLayout, title: 'MACD' });

        // 3. RSI Chart
        const rsiTrace = { x: dates, y: getColumn('RSI'), type: 'scatter', mode: 'lines', name: 'RSI', line: { color: 'purple' } };
        
        Plotly.newPlot(rsiChartDiv, [rsiTrace], {
            ...chartLayout,
            title: 'RSI',
            shapes: [ // Add overbought/oversold lines
                { type: 'line', x0: dates[0], y0: 70, x1: dates[dates.length - 1], y1: 70, line: { color: 'red', dash: 'dash' } },
                { type: 'line', x0: dates[0], y0: 30, x1: dates[dates.length - 1], y1: 30, line: { color: 'green', dash: 'dash' } }
            ]
        });
    }

});