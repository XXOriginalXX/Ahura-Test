
export interface TimeframeOption {
  value: string;
  label: string;
  interval: string;
}

export interface StockInfo {
  symbol: string;
  name: string;
}

export interface FinanceChatbotProps {
  stockData: any[];
  candleData: any[];
  selectedStock: string;
  timeframe: string;
  chartType: string;
}
