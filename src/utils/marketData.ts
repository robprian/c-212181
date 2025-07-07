// Market Data Service for Real-time Trading
export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  timestamp: number;
}

export class MarketDataProvider {
  private cache: Map<string, MarketData> = new Map();
  private subscribers: Map<string, Set<(data: MarketData) => void>> = new Map();
  private intervals: Map<string, number> = new Map();

  async fetchMarketData(symbol: string): Promise<MarketData> {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      const data: MarketData = {
        symbol: result.symbol,
        price: parseFloat(result.lastPrice),
        change: parseFloat(result.priceChange),
        changePercent: parseFloat(result.priceChangePercent),
        volume: parseFloat(result.volume),
        high: parseFloat(result.highPrice),
        low: parseFloat(result.lowPrice),
        timestamp: Date.now()
      };

      this.cache.set(symbol, data);
      this.notifySubscribers(symbol, data);
      
      return data;
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      throw error;
    }
  }

  getCachedData(symbol: string): MarketData | null {
    return this.cache.get(symbol) || null;
  }

  subscribe(symbol: string, callback: (data: MarketData) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    
    this.subscribers.get(symbol)!.add(callback);
    
    // Start auto-refresh if not already running
    if (!this.intervals.has(symbol)) {
      this.startAutoRefresh(symbol);
    }
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(symbol);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.stopAutoRefresh(symbol);
        }
      }
    };
  }

  private startAutoRefresh(symbol: string): void {
    const interval = setInterval(() => {
      this.fetchMarketData(symbol).catch(console.error);
    }, 30000); // Refresh every 30 seconds
    
    this.intervals.set(symbol, interval);
  }

  private stopAutoRefresh(symbol: string): void {
    const interval = this.intervals.get(symbol);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(symbol);
    }
  }

  private notifySubscribers(symbol: string, data: MarketData): void {
    const subs = this.subscribers.get(symbol);
    if (subs) {
      subs.forEach(callback => callback(data));
    }
  }
}

// Technical Analysis Utilities
export class TechnicalIndicators {
  static calculateRSI(prices: number[], period: number = 14): number {
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
  }

  static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  }

  static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  static calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26): {
    macd: number;
    signal: number;
    histogram: number;
  } {
    const ema12 = this.calculateEMA(prices, fastPeriod);
    const ema26 = this.calculateEMA(prices, slowPeriod);
    const macd = ema12 - ema26;
    const signal = macd * 0.1; // Simplified signal calculation
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  static calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const sma = this.calculateSMA(prices, period);
    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: sma + (stdDev * multiplier),
      middle: sma,
      lower: sma - (stdDev * multiplier)
    };
  }
}

// Trading Signal Generator
export class SignalGenerator {
  private marketDataProvider: MarketDataProvider;

  constructor(marketDataProvider: MarketDataProvider) {
    this.marketDataProvider = marketDataProvider;
  }

  async generateSignal(symbol: string, apiKey: string): Promise<{
    action: 'buy' | 'sell' | 'hold';
    confidence: number;
    price: number;
    reasoning: string;
  }> {
    try {
      const marketData = await this.marketDataProvider.fetchMarketData(symbol);
      
      // Get historical data for technical analysis
      const klines = await this.getKlines(symbol, '1h', 100);
      const prices = klines.map(k => k.close);
      
      const rsi = TechnicalIndicators.calculateRSI(prices);
      const sma20 = TechnicalIndicators.calculateSMA(prices, 20);
      const sma50 = TechnicalIndicators.calculateSMA(prices, 50);
      const macd = TechnicalIndicators.calculateMACD(prices);
      
      // Simple signal logic
      let action: 'buy' | 'sell' | 'hold' = 'hold';
      let confidence = 50;
      let reasoning = 'Market analysis inconclusive';
      
      if (rsi < 30 && marketData.price < sma20 && macd.macd > 0) {
        action = 'buy';
        confidence = 75;
        reasoning = 'Oversold conditions with potential reversal';
      } else if (rsi > 70 && marketData.price > sma20 && macd.macd < 0) {
        action = 'sell';
        confidence = 75;
        reasoning = 'Overbought conditions with potential reversal';
      } else if (marketData.price > sma50 && macd.macd > 0) {
        action = 'buy';
        confidence = 60;
        reasoning = 'Uptrend confirmed by moving averages';
      } else if (marketData.price < sma50 && macd.macd < 0) {
        action = 'sell';
        confidence = 60;
        reasoning = 'Downtrend confirmed by moving averages';
      }
      
      return {
        action,
        confidence,
        price: marketData.price,
        reasoning
      };
    } catch (error) {
      console.error('Error generating signal:', error);
      return {
        action: 'hold',
        confidence: 0,
        price: 0,
        reasoning: 'Error generating signal'
      };
    }
  }

  private async getKlines(symbol: string, interval: string, limit: number): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      const data = await response.json();
      return data.map((kline: any) => ({
        openTime: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));
    } catch (error) {
      console.error('Error fetching klines:', error);
      return [];
    }
  }
}

// Export singleton instance
export const marketDataProvider = new MarketDataProvider();
export const signalGenerator = new SignalGenerator(marketDataProvider);
