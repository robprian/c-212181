import { useState, useEffect } from 'react';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  timestamp: number;
}

export const useMarketData = (symbol: string, interval: number = 30000) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      setData({
        symbol: result.symbol,
        price: parseFloat(result.lastPrice),
        change: parseFloat(result.priceChange),
        changePercent: parseFloat(result.priceChangePercent),
        volume: parseFloat(result.volume),
        high: parseFloat(result.highPrice),
        low: parseFloat(result.lowPrice),
        timestamp: Date.now()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      console.error('Market data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    
    const intervalId = setInterval(fetchMarketData, interval);
    
    return () => clearInterval(intervalId);
  }, [symbol, interval]);

  return { data, loading, error, refetch: fetchMarketData };
};

export const useMultipleMarketData = (symbols: string[]) => {
  const [data, setData] = useState<{ [key: string]: MarketData }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMultipleMarketData = async () => {
    if (symbols.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const promises = symbols.map(symbol => 
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
          .then(res => res.json())
          .then(result => ({
            symbol: result.symbol,
            price: parseFloat(result.lastPrice),
            change: parseFloat(result.priceChange),
            changePercent: parseFloat(result.priceChangePercent),
            volume: parseFloat(result.volume),
            high: parseFloat(result.highPrice),
            low: parseFloat(result.lowPrice),
            timestamp: Date.now()
          }))
      );
      
      const results = await Promise.all(promises);
      const dataMap = results.reduce((acc, item) => {
        acc[item.symbol] = item;
        return acc;
      }, {} as { [key: string]: MarketData });
      
      setData(dataMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      console.error('Multiple market data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMultipleMarketData();
    
    const intervalId = setInterval(fetchMultipleMarketData, 30000);
    
    return () => clearInterval(intervalId);
  }, [symbols.join(',')]);

  return { data, loading, error, refetch: fetchMultipleMarketData };
};

// Technical Analysis Utilities
export const calculateTechnicalIndicators = (prices: number[]) => {
  const rsi = calculateRSI(prices);
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  return {
    rsi,
    sma20,
    sma50,
    ema12,
    ema26,
    macd: ema12 - ema26
  };
};

const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50;

  const gains = [];
  const losses = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateSMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1];
  return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
};

const calculateEMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }

  return ema;
};

export type { MarketData };
