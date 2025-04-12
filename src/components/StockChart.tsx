import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  LineChartIcon, 
  RefreshCw, 
  Search, 
  X, 
  CandlestickChart
} from 'lucide-react';
import TimeframeSelector from './TimeframeSelector';
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "./ui/toggle-group";
import FinanceChatbot from './FinanceChatbot';

// Helper function to ensure we get proper decimal formatting
const formatPrice = (price: number) => parseFloat(price.toFixed(2));

const StockChart = () => {
  // State for data and UI
  const [stockData, setStockData] = useState<any[]>([]);
  const [candleData, setCandleData] = useState<any[]>([]);
  const [symbol, setSymbol] = useState('ADANIENT.NS');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState('ADANIENT.NS');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [timeframe, setTimeframe] = useState('1mo');
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const suggestionRef = React.useRef<HTMLDivElement>(null);

  // Extended timeframe options
  const timeframeOptions = [
    { value: '5m', label: '5 Min', interval: '1m' },
    { value: '1h', label: '1 Hour', interval: '5m' },
    { value: '1d', label: '1 Day', interval: '15m' },
    { value: '5d', label: '5 Days', interval: '30m' },
    { value: '1mo', label: '1 Month', interval: '1d' },
    { value: '3mo', label: '3 Months', interval: '1d' },
    { value: '6mo', label: '6 Months', interval: '1d' },
    { value: '1y', label: '1 Year', interval: '1wk' },
    { value: '5y', label: '5 Years', interval: '1mo' },
  ];

  // Get interval based on selected timeframe
  const getInterval = () => {
    const selected = timeframeOptions.find(option => option.value === timeframe);
    return selected ? selected.interval : '1d';
  };

  // Extended Indian stocks database
  const indianStocks = [
    // Market Indices
    { symbol: '^NSEI', name: 'NIFTY 50 Index' },
    { symbol: '^BSESN', name: 'S&P BSE SENSEX' },
    { symbol: '^NSEBANK', name: 'NIFTY Bank Index' },
    { symbol: '^CNXIT', name: 'NIFTY IT Index' },
    { symbol: '^CNXPHARMA', name: 'NIFTY Pharma Index' },
    
    // Adani Group
    { symbol: 'ADANIENT.NS', name: 'Adani Enterprises Ltd.' },
    { symbol: 'ADANIPORTS.NS', name: 'Adani Ports and Special Economic Zone Ltd.' },
    { symbol: 'ADANIPOWER.NS', name: 'Adani Power Ltd.' },
    { symbol: 'ADANIGREEN.NS', name: 'Adani Green Energy Ltd.' },
    
    // Popular stocks
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd.' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.' },
    { symbol: 'INFY.NS', name: 'Infosys Ltd.' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd.' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd.' },
    { symbol: 'SBIN.NS', name: 'State Bank of India' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd.' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Ltd.' }
  ];

  // Popular stocks for quick access
  const popularStocks = [
    { symbol: '^NSEI', name: 'NIFTY 50' },
    { symbol: '^BSESN', name: 'SENSEX' },
    { symbol: 'ADANIENT.NS', name: 'Adani Enterprises' },
    { symbol: 'RELIANCE.NS', name: 'Reliance' },
    { symbol: 'TCS.NS', name: 'TCS' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' }
  ];

  // Function to fetch real stock data
  const fetchRealStockData = async (stockSymbol: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const proxyUrl = "https://api.allorigins.win/get?url=";
      const interval = getInterval();
      const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${stockSymbol}?interval=${interval}&range=${timeframe}`;
      
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const responseData = await response.json();
      const data = JSON.parse(responseData.contents);
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error("No data available for this symbol");
      }
      
      const result = data.chart.result[0];
      const quotes = result.indicators.quote[0];
      const timestamps = result.timestamp;

      // Format data for line chart
      const formattedLineData = timestamps.map((timestamp: number, i: number) => {
        if (quotes.close[i] === null) return null;
        return {
          date: new Date(timestamp * 1000).toLocaleString(),
          timestamp: timestamp * 1000,
          price: formatPrice(quotes.close[i]),
          volume: quotes.volume?.[i] || 0,
          name: stockSymbol.replace('.NS', '')
        };
      }).filter(Boolean);

      // Format data for candlestick chart
      const formattedCandleData = timestamps.map((timestamp: number, i: number) => {
        const open = quotes.open[i];
        const close = quotes.close[i];
        const high = quotes.high[i];
        const low = quotes.low[i];

        if (open === null || close === null || high === null || low === null) {
          return null;
        }

        return {
          date: new Date(timestamp * 1000).toLocaleString(),
          timestamp: timestamp * 1000,
          open: formatPrice(open),
          close: formatPrice(close),
          high: formatPrice(high),
          low: formatPrice(low),
          volume: quotes.volume?.[i] || 0,
          isIncreasing: close >= open,
          name: stockSymbol.replace('.NS', '')
        };
      }).filter(Boolean);

      setStockData(formattedLineData);
      setCandleData(formattedCandleData);
      setSelectedStock(stockSymbol);
      setLastUpdated(new Date());
      
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(`Failed to fetch data: ${error.message}`);
      setStockData([]);
      setCandleData([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to search for stock symbols
  const searchStocks = async (query: string) => {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    return indianStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(lowerQuery) || 
      stock.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
  };

  // Handle input change for search
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim() && value.length >= 2) {
      const matchedStocks = await searchStocks(value);
      setSuggestions(matchedStocks);
      setShowSuggestions(matchedStocks.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (stockSymbol: string) => {
    setSymbol(stockSymbol);
    setSearchTerm('');
    setShowSuggestions(false);
    fetchRealStockData(stockSymbol);
  };

  // Format functions
  const formatXAxisTick = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeframe === '5m' || timeframe === '1h' || timeframe === '1d') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeframe === '5m' || timeframe === '1h' || timeframe === '1d') {
      return date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Custom tooltip for candlestick chart
  const CustomCandlestickTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-white border border-gray-200 shadow-lg rounded-md">
          <p className="font-semibold">{formatTooltipLabel(data.timestamp)}</p>
          <div className="grid grid-cols-2 gap-2 text-sm mt-1">
            <div>Open: <span className="font-medium">{formatCurrency(data.open)}</span></div>
            <div>Close: <span className="font-medium">{formatCurrency(data.close)}</span></div>
            <div>High: <span className="font-medium">{formatCurrency(data.high)}</span></div>
            <div>Low: <span className="font-medium">{formatCurrency(data.low)}</span></div>
            <div className="col-span-2">Volume: <span className="font-medium">{data.volume.toLocaleString()}</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Format currency based on stock type
  const formatCurrency = (value: number) => {
    return selectedStock.startsWith('^') ? 
      value.toLocaleString('en-IN') : 
      `₹${value.toLocaleString('en-IN')}`;
  };

  // Calculate stats for the current stock
  const calculateStats = () => {
    if (stockData.length === 0) return { current: 0, change: 0, changePercent: 0 };
    
    const firstPrice = stockData[0].price;
    const lastPrice = stockData[stockData.length - 1].price;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    
    return {
      current: lastPrice,
      change: change,
      changePercent: changePercent
    };
  };

  // Custom candlestick renderer
  const renderCandlestick = (props: any) => {
    const { x, y, width, height, payload } = props;
    const fill = payload.isIncreasing ? "#16a34a" : "#dc2626";
    
    if (!payload.high || !payload.low || payload.high === payload.low) {
      return null;
    }
    
    const bodyWidth = Math.max(width * 0.6, 2);
    const bodyX = x + (width - bodyWidth) / 2;
    const wickX = x + width / 2;
    
    const heightRange = payload.high - payload.low;
    if (heightRange === 0) return null;
    
    const openY = y + (height * (payload.high - payload.open) / heightRange);
    const closeY = y + (height * (payload.high - payload.close) / heightRange);
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
    
    return (
      <g key={`candlestick-${x}-${y}`}>
        <line 
          x1={wickX} 
          y1={y} 
          x2={wickX} 
          y2={y + height} 
          stroke={fill} 
          strokeWidth={1} 
        />
        <rect 
          x={bodyX} 
          y={bodyTop}
          width={bodyWidth} 
          height={bodyHeight}
          fill={fill} 
        />
      </g>
    );
  };

  // Effect for initial load and refresh
  useEffect(() => {
    fetchRealStockData(symbol);
    const refreshInterval = setInterval(() => {
      fetchRealStockData(symbol);
    }, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [symbol, timeframe]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stats = calculateStats();
  const isPositive = stats.change >= 0;

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      {/* Header with search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="flex items-center">
          <LineChartIcon className="w-5 h-5 text-emerald-500 mr-2" />
          <span className="text-lg font-semibold">INDIAN STOCKS</span>
          <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
            Live Data
          </span>
        </div>
        
        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search stocks..."
            className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {showSuggestions && (
            <div ref={suggestionRef} className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
              {suggestions.map((stock) => (
                <div
                  key={stock.symbol}
                  onClick={() => handleSelectSuggestion(stock.symbol)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-sm text-gray-600">{stock.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popular stocks */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {popularStocks.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleSelectSuggestion(stock.symbol)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedStock === stock.symbol
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {stock.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chart controls */}
      <div className="flex justify-between items-center mb-4">
        <TimeframeSelector
          timeframe={timeframe}
          onTimeframeChange={(t) => setTimeframe(t)}
          timeframeOptions={timeframeOptions}
        />
        
        <ToggleGroup 
          type="single" 
          value={chartType} 
          onValueChange={(value) => value && setChartType(value as 'line' | 'candlestick')}
          className="bg-gray-100 rounded-lg p-1"
        >
          <ToggleGroupItem value="line" aria-label="Line Chart">
            <LineChartIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="candlestick" aria-label="Candlestick Chart">
            <CandlestickChart className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Stock info */}
      <div className="mb-4">
        <h2 className="text-xl font-bold">{selectedStock}</h2>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{formatCurrency(stats.current)}</span>
          <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '▲' : '▼'}
            {formatCurrency(Math.abs(stats.change))} ({stats.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxisTick}
                  minTickGap={20}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  labelFormatter={formatTooltipLabel}
                  formatter={(value: any) => [formatCurrency(value), 'Price']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <BarChart data={candleData} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxisTick}
                  minTickGap={20}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomCandlestickTooltip />} />
                <Bar
                  dataKey="high"
                  fill="transparent"
                  shape={renderCandlestick}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Add FinanceChatbot component */}
      <FinanceChatbot 
        stockData={stockData}
        candleData={candleData}
        selectedStock={selectedStock}
        timeframe={timeframe}
        chartType={chartType}
      />
    </div>
  );
};

export default StockChart;
