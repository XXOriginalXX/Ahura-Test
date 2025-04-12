import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart
} from 'recharts';
import { LineChartIcon, RefreshCw, Search, CandlestickChart, ExternalLink, X } from 'lucide-react';
import TimeframeSelector from './TimeframeSelector';
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import FinanceChatbot from './FinanceChatbot';

// Helper function to ensure proper decimal formatting
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
  const [timeframe, setTimeframe] = useState('1d');
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [previousClosePrice, setPreviousClosePrice] = useState<number | null>(null);
  const [showExternalFrame, setShowExternalFrame] = useState<string | null>(null);
  const suggestionRef = React.useRef<HTMLDivElement>(null);

  // External platforms for browsing
  const externalPlatforms = [
    { 
      id: 'tradingview', 
      name: 'TradingView', 
      url: (stock: string) => `https://www.tradingview.com/chart/?symbol=NSE:${stock.replace('.NS', '')}` 
    },
    { 
      id: 'groww', 
      name: 'Groww', 
      url: (stock: string) => `https://groww.in/charts/stocks/${stock.replace('.NS', '')}` 
    },
    { 
      id: 'zerodha', 
      name: 'Zerodha', 
      url: (stock: string) => `https://kite.zerodha.com/chart/ext/ciq/NSE/${stock.replace('.NS', '')}` 
    }
  ];

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

  // Popular stocks for quick access
  const popularStocks = [
    { symbol: '^NSEI', name: 'NIFTY 50' },
    { symbol: '^BSESN', name: 'SENSEX' },
    { symbol: 'ADANIENT.NS', name: 'Adani' },
    { symbol: 'RELIANCE.NS', name: 'Reliance' },
    { symbol: 'TCS.NS', name: 'TCS' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' }
  ];

  // Function to search any stock symbol using Yahoo Finance API
  const searchAnyStock = async (query: string) => {
    if (!query || query.length < 2) return [];
    setLoading(true);
    
    try {
      const proxyUrl = "https://api.allorigins.win/get?url=";
      const targetUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0`;
      
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch search results: ${response.status}`);
      }
      
      const responseData = await response.json();
      const data = JSON.parse(responseData.contents);
      
      if (!data.quotes || data.quotes.length === 0) {
        return [];
      }
      
      // Filter for Indian stocks and indices
      const filteredResults = data.quotes
        .filter((quote: any) => 
          quote.exchange === 'NSI' || 
          quote.exchange === 'BSE' || 
          (quote.quoteType === 'INDEX' && quote.market === 'in_market')
        )
        .map((quote: any) => ({
          symbol: quote.symbol,
          name: quote.longname || quote.shortname || quote.symbol
        }));
      
      return filteredResults;
      
    } catch (error) {
      console.error("Error searching stocks:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch real stock data
  const fetchRealStockData = async (stockSymbol: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const proxyUrl = "https://api.allorigins.win/get?url=";
      const interval = timeframeOptions.find(opt => opt.value === timeframe)?.interval || '1d';
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
      
      // Get previous close from meta data
      const previousClose = result.meta.previousClose;
      setPreviousClosePrice(previousClose);

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
        if (!quotes.open[i] || !quotes.close[i] || !quotes.high[i] || !quotes.low[i]) return null;
        return {
          date: new Date(timestamp * 1000).toLocaleString(),
          timestamp: timestamp * 1000,
          open: formatPrice(quotes.open[i]),
          close: formatPrice(quotes.close[i]),
          high: formatPrice(quotes.high[i]),
          low: formatPrice(quotes.low[i]),
          volume: quotes.volume?.[i] || 0,
          isIncreasing: quotes.close[i] >= quotes.open[i]
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

  // Handle search input change
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim() && value.length >= 2) {
      const results = await searchAnyStock(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
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

  // Open external platform in iframe
  const openExternalPlatform = (platformId: string) => {
    setShowExternalFrame(platformId);
  };

  // Close external platform iframe
  const closeExternalFrame = () => {
    setShowExternalFrame(null);
  };

  // Get URL for external platform with bypass proxy
  const getExternalPlatformUrl = () => {
    if (!showExternalFrame) return '';
    const platform = externalPlatforms.find(p => p.id === showExternalFrame);
    if (!platform) return '';
    
    // Use a CORS proxy to try to bypass X-Frame-Options restrictions
    // Note: This is not guaranteed to work for all sites and may have limitations
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = platform.url(selectedStock);
    
    return proxyUrl + encodeURIComponent(targetUrl);
  };

  // Calculate current profit/loss using previous day's close price
  const calculateProfitLoss = () => {
    if (stockData.length === 0) return { value: 0, percentage: 0 };
    
    // Get the current price
    const currentPrice = stockData[stockData.length - 1].price;
    
    // Use previousClose from Yahoo Finance API result
    const previousClose = previousClosePrice || stockData[0].price;
    
    const priceDiff = currentPrice - previousClose;
    const percentageDiff = (priceDiff / previousClose) * 100;
    
    return {
      value: formatPrice(priceDiff),
      percentage: formatPrice(percentageDiff)
    };
  };

  // Format axis ticks
  const formatXAxisTick = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeframe === '5m' || timeframe === '1h' || timeframe === '1d') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{new Date(label).toLocaleString()}</p>
          {chartType === 'line' ? (
            <p className="text-sm">Price: ₹{data.price}</p>
          ) : (
            <>
              <p className="text-sm">Open: ₹{data.open}</p>
              <p className="text-sm">Close: ₹{data.close}</p>
              <p className="text-sm">High: ₹{data.high}</p>
              <p className="text-sm">Low: ₹{data.low}</p>
            </>
          )}
          <p className="text-sm">Volume: {data.volume.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  // Effect for auto-refresh
  useEffect(() => {
    fetchRealStockData(symbol);
    const interval = setInterval(() => {
      fetchRealStockData(symbol);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  // Click outside handler for suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const profitLoss = calculateProfitLoss();
  const isPositive = profitLoss.value >= 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center">
          <LineChartIcon className="w-6 h-6 text-emerald-500 mr-2" />
          <h1 className="text-xl font-bold">Indian Stock Market</h1>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-3 flex items-center">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search stocks..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {showSuggestions && (
            <div ref={suggestionRef} className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border">
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
      <div className="mb-6">
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

      {/* Stock Info */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{selectedStock.replace('.NS', '')}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            ₹{stockData.length > 0 ? stockData[stockData.length - 1].price : '0.00'}
          </span>
          <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '▲' : '▼'}
            ₹{Math.abs(profitLoss.value)} ({profitLoss.percentage}%)
          </span>
        </div>
      </div>

      {/* Controls and External Platform Links */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <TimeframeSelector
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          timeframeOptions={timeframeOptions}
        />
        
        <div className="flex items-center gap-4">
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

          <button
            onClick={() => fetchRealStockData(symbol)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* External Platforms Section */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600 mr-1">Browse on:</span>
        {externalPlatforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => openExternalPlatform(platform.id)}
            className="inline-flex items-center px-3 py-1 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            {platform.name}
            <ExternalLink className="h-3 w-3 ml-1" />
          </button>
        ))}
      </div>

      {/* External Platform iFrame (when active) */}
      {showExternalFrame ? (
        <div className="mb-6 relative">
          <div className="flex justify-between items-center mb-2 bg-gray-100 p-2 rounded-t-lg">
            <div className="text-sm font-medium">
              Viewing {selectedStock.replace('.NS', '')} on {externalPlatforms.find(p => p.id === showExternalFrame)?.name}
            </div>
            <button 
              onClick={closeExternalFrame}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative w-full h-[600px] bg-gray-50 flex items-center justify-center border rounded-b-lg">
            <iframe 
              src={getExternalPlatformUrl()}
              className="w-full h-full border-0"
              title={`${selectedStock} on ${showExternalFrame}`}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-opacity-50 text-center p-4">
              <p className="text-gray-600 bg-white p-4 rounded-lg shadow-lg max-w-lg">
                Note: Some trading platforms may not display properly within this frame due to their security policies. 
                If the frame appears blank, try refreshing or check your browser console for blocked content messages.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Regular Chart (when no external platform is showing)
        <div className="h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
          )}
          
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
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
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
              <ComposedChart data={candleData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxisTick}
                  minTickGap={20}
                />
                <YAxis
                  domain={[
                    (dataMin: number) => Math.floor(dataMin * 0.995),
                    (dataMax: number) => Math.ceil(dataMax * 1.005)
                  ]}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="high"
                  barSize={8}
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    const fill = payload.isIncreasing ? "#16a34a" : "#ef4444";
                    const stroke = fill;
                    
                    // Calculate positions for the candlestick elements
                    const wickX = x + width / 2;
                    const openY = payload.isIncreasing 
                      ? y + ((payload.high - payload.open) / (payload.high - payload.low)) * height
                      : y + ((payload.high - payload.open) / (payload.high - payload.low)) * height;
                    const closeY = payload.isIncreasing 
                      ? y + ((payload.high - payload.close) / (payload.high - payload.low)) * height
                      : y + ((payload.high - payload.close) / (payload.high - payload.low)) * height;
                    const bodyTop = Math.min(openY, closeY);
                    const bodyHeight = Math.abs(closeY - openY);
                    
                    return (
                      <g>
                        {/* Top wick (high to open/close) */}
                        <line
                          x1={wickX}
                          y1={y}
                          x2={wickX}
                          y2={bodyTop}
                          stroke={stroke}
                          strokeWidth={1}
                        />
                        
                        {/* Body (open to close) */}
                        <rect
                          x={x + 1}
                          y={bodyTop}
                          width={width - 2}
                          height={Math.max(bodyHeight, 1)}
                          fill={fill}
                          stroke={stroke}
                        />
                        
                        {/* Bottom wick (open/close to low) */}
                        <line
                          x1={wickX}
                          y1={bodyTop + bodyHeight}
                          x2={wickX}
                          y2={y + height}
                          stroke={stroke}
                          strokeWidth={1}
                        />
                      </g>
                    );
                  }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {lastUpdated && (
        <div className="mt-4 text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleString()}
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