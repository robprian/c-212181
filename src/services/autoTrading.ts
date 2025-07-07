// Auto Trading Service
// This service handles automated trading based on AI signals

export interface TradingSignal {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  price: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timestamp: number;
}

export interface ExchangeCredentials {
  exchange: 'binance' | 'bybit' | 'okx' | 'demo';
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
}

export interface OrderResult {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  status: 'pending' | 'filled' | 'cancelled' | 'failed';
  timestamp: number;
  fees?: number;
  executedQty?: number;
  executedPrice?: number;
}

export class AutoTradingService {
  private credentials: ExchangeCredentials;
  private isEnabled: boolean = false;
  private orders: OrderResult[] = [];

  constructor(credentials: ExchangeCredentials) {
    this.credentials = credentials;
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public async executeSignal(signal: TradingSignal): Promise<OrderResult> {
    if (!this.isEnabled) {
      throw new Error('Auto trading is not enabled');
    }

    if (signal.action === 'hold') {
      return this.createHoldOrder(signal);
    }

    if (this.credentials.exchange === 'demo') {
      return this.executeDemoTrade(signal);
    }

    // Real exchange trading implementation
    return this.executeRealTrade(signal);
  }

  private createHoldOrder(signal: TradingSignal): OrderResult {
    return {
      orderId: `hold_${Date.now()}`,
      symbol: signal.symbol,
      side: 'buy', // Default side for hold
      quantity: 0,
      price: signal.price,
      status: 'cancelled',
      timestamp: Date.now()
    };
  }

  private async executeDemoTrade(signal: TradingSignal): Promise<OrderResult> {
    // Simulate trading delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const order: OrderResult = {
      orderId: `demo_${Date.now()}`,
      symbol: signal.symbol,
      side: signal.action as 'buy' | 'sell',
      quantity: signal.quantity,
      price: signal.price,
      status: Math.random() > 0.1 ? 'filled' : 'failed', // 90% success rate
      timestamp: Date.now(),
      fees: signal.price * signal.quantity * 0.001, // 0.1% fee
      executedQty: signal.quantity,
      executedPrice: signal.price + (Math.random() - 0.5) * signal.price * 0.001 // Small slippage
    };

    this.orders.push(order);
    return order;
  }

  private async executeRealTrade(signal: TradingSignal): Promise<OrderResult> {
    switch (this.credentials.exchange) {
      case 'binance':
        return this.executeBinanceTrade(signal);
      case 'bybit':
        return this.executeBybitTrade(signal);
      case 'okx':
        return this.executeOkxTrade(signal);
      default:
        throw new Error(`Unsupported exchange: ${this.credentials.exchange}`);
    }
  }

  private async executeBinanceTrade(signal: TradingSignal): Promise<OrderResult> {
    // Binance API implementation
    // This is a placeholder - real implementation would use Binance API
    const baseUrl = this.credentials.testnet ? 
      'https://testnet.binance.vision/api/v3' : 
      'https://api.binance.com/api/v3';

    try {
      // Example order payload
      const orderData = {
        symbol: signal.symbol,
        side: signal.action.toUpperCase(),
        type: 'MARKET',
        quantity: signal.quantity,
        timestamp: Date.now(),
        recvWindow: 5000
      };

      // In real implementation, you would:
      // 1. Create signature using API secret
      // 2. Make authenticated request to Binance
      // 3. Handle response and errors

      console.log('Executing Binance trade:', orderData);
      
      // Simulate response
      return {
        orderId: `binance_${Date.now()}`,
        symbol: signal.symbol,
        side: signal.action as 'buy' | 'sell',
        quantity: signal.quantity,
        price: signal.price,
        status: 'filled',
        timestamp: Date.now(),
        fees: signal.price * signal.quantity * 0.001,
        executedQty: signal.quantity,
        executedPrice: signal.price
      };
    } catch (error) {
      console.error('Binance trade error:', error);
      return {
        orderId: `binance_failed_${Date.now()}`,
        symbol: signal.symbol,
        side: signal.action as 'buy' | 'sell',
        quantity: signal.quantity,
        price: signal.price,
        status: 'failed',
        timestamp: Date.now()
      };
    }
  }

  private async executeBybitTrade(signal: TradingSignal): Promise<OrderResult> {
    // Bybit API implementation placeholder
    console.log('Executing Bybit trade:', signal);
    return this.executeDemoTrade(signal);
  }

  private async executeOkxTrade(signal: TradingSignal): Promise<OrderResult> {
    // OKX API implementation placeholder
    console.log('Executing OKX trade:', signal);
    return this.executeDemoTrade(signal);
  }

  public getOrders(): OrderResult[] {
    return this.orders;
  }

  public getOrderById(orderId: string): OrderResult | undefined {
    return this.orders.find(order => order.orderId === orderId);
  }

  public cancelOrder(orderId: string): boolean {
    const orderIndex = this.orders.findIndex(order => order.orderId === orderId);
    if (orderIndex >= 0) {
      this.orders[orderIndex].status = 'cancelled';
      return true;
    }
    return false;
  }

  public getAccountBalance(): Promise<{ [key: string]: number }> {
    // Placeholder for account balance
    return Promise.resolve({
      'USDT': 1000,
      'BTC': 0.1,
      'ETH': 2.5
    });
  }
}

// Market Data Service
export class MarketDataService {
  private static instance: MarketDataService;
  private wsConnections: Map<string, WebSocket> = new Map();

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  public async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error('Error fetching current price:', error);
      throw error;
    }
  }

  public async getMarketData(symbol: string): Promise<any> {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      const data = await response.json();
      return {
        symbol: data.symbol,
        price: parseFloat(data.lastPrice),
        change: parseFloat(data.priceChange),
        changePercent: parseFloat(data.priceChangePercent),
        volume: parseFloat(data.volume),
        high: parseFloat(data.highPrice),
        low: parseFloat(data.lowPrice),
        openPrice: parseFloat(data.openPrice),
        closePrice: parseFloat(data.lastPrice),
        bidPrice: parseFloat(data.bidPrice),
        askPrice: parseFloat(data.askPrice)
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  }

  public subscribeToPrice(symbol: string, callback: (price: number) => void): () => void {
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(parseFloat(data.c)); // Current price
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.wsConnections.set(symbol, ws);

    // Return unsubscribe function
    return () => {
      ws.close();
      this.wsConnections.delete(symbol);
    };
  }

  public async getKlines(symbol: string, interval: string, limit: number = 100): Promise<any[]> {
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
        volume: parseFloat(kline[5]),
        closeTime: kline[6],
        quoteAssetVolume: parseFloat(kline[7]),
        numberOfTrades: kline[8],
        takerBuyBaseAssetVolume: parseFloat(kline[9]),
        takerBuyQuoteAssetVolume: parseFloat(kline[10])
      }));
    } catch (error) {
      console.error('Error fetching klines:', error);
      throw error;
    }
  }
}

// Technical Analysis Service
export class TechnicalAnalysisService {
  public static calculateRSI(prices: number[], period: number = 14): number {
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

  public static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  }

  public static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  public static calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
    macd: number;
    signal: number;
    histogram: number;
  } {
    const ema12 = this.calculateEMA(prices, fastPeriod);
    const ema26 = this.calculateEMA(prices, slowPeriod);
    const macd = ema12 - ema26;

    // For simplicity, using simple average for signal line
    const signal = macd * 0.1; // Simplified signal calculation
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  public static calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): {
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

// Risk Management Service
export class RiskManagementService {
  public static calculatePositionSize(
    accountBalance: number,
    riskPercentage: number,
    entryPrice: number,
    stopLoss: number
  ): number {
    const riskAmount = accountBalance * (riskPercentage / 100);
    const riskPerUnit = Math.abs(entryPrice - stopLoss);
    return riskAmount / riskPerUnit;
  }

  public static calculateRiskReward(
    entryPrice: number,
    stopLoss: number,
    takeProfit: number
  ): number {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    return reward / risk;
  }

  public static isValidTrade(
    signal: TradingSignal,
    accountBalance: number,
    maxRiskPercentage: number = 2
  ): boolean {
    const riskAmount = accountBalance * (maxRiskPercentage / 100);
    const tradeValue = signal.price * signal.quantity;
    const maxLoss = Math.abs(signal.price - signal.stopLoss) * signal.quantity;

    return maxLoss <= riskAmount && tradeValue <= accountBalance;
  }
}
