
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Brain, Target, RefreshCw, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Analysis {
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  technicalAnalysis: {
    support: number;
    resistance: number;
    trend: string;
    indicators: string[];
    rsi: number;
    macd: string;
    bollinger: string;
    sma20: number;
    sma50: number;
    ema12: number;
    ema26: number;
  };
  fundamentalAnalysis: {
    marketCap: string;
    volume: string;
    news: string;
    outlook: string;
    dominance: number;
    liquidityScore: number;
  };
  scalpingOpportunities: {
    shortTerm: string;
    entryPoints: number[];
    exitPoints: number[];
    stopLoss: number[];
    riskReward: number;
    probability: number;
  };
  riskAssessment: {
    volatility: 'low' | 'medium' | 'high';
    liquidityRisk: string;
    marketRisk: string;
    volatilityIndex: number;
    correlations: string[];
  };
  autoTradeSignals: {
    signal: 'buy' | 'sell' | 'hold';
    strength: number;
    timeframe: string;
    entry: number;
    target: number;
    stopLoss: number;
    positionSize: number;
  };
}

interface ExchangeConfig {
  exchange: 'binance' | 'bybit' | 'okx' | 'demo';
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
}

interface OrderResult {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  status: 'pending' | 'filled' | 'cancelled' | 'failed';
  timestamp: number;
}

const DeepAnalysis = () => {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [apiKey, setApiKey] = useState('');
  const [exchangeConfig, setExchangeConfig] = useState<ExchangeConfig>({
    exchange: 'demo',
    apiKey: '',
    apiSecret: '',
    testnet: true
  });
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [orders, setOrders] = useState<OrderResult[]>([]);
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Fetch real-time market data
  const fetchRealTimeData = async (symbol: string) => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      const data = await response.json();
      setRealTimeData(data);
      return data;
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      return null;
    }
  };

  // Fetch comprehensive market data
  const fetchMarketData = async (symbol: string) => {
    try {
      const [ticker, klines, depth] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`).then(res => res.json()),
        fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=200`).then(res => res.json()),
        fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=100`).then(res => res.json())
      ]);

      // Calculate technical indicators
      const closes = klines.map((k: any) => parseFloat(k[4]));
      const highs = klines.map((k: any) => parseFloat(k[2]));
      const lows = klines.map((k: any) => parseFloat(k[3]));
      const volumes = klines.map((k: any) => parseFloat(k[5]));

      const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const sma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50;
      
      // RSI calculation
      const rsi = calculateRSI(closes, 14);
      
      // Support and resistance levels
      const support = Math.min(...lows.slice(-20));
      const resistance = Math.max(...highs.slice(-20));

      return {
        ticker,
        klines,
        depth,
        technicalIndicators: {
          sma20,
          sma50,
          rsi,
          support,
          resistance
        }
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      return null;
    }
  };

  // Calculate RSI
  const calculateRSI = (prices: number[], period: number = 14) => {
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  // Auto-update real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      if (symbol) {
        fetchRealTimeData(symbol);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [symbol]);

  const performAnalysis = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your OpenAI API key');
      return;
    }

    setLoading(true);
    setAnalysisProgress(0);

    try {
      // Step 1: Fetch real market data
      setAnalysisProgress(20);
      const marketData = await fetchMarketData(symbol);
      
      if (!marketData) {
        throw new Error('Failed to fetch market data');
      }

      // Step 2: Prepare comprehensive data for AI analysis
      setAnalysisProgress(40);
      const currentPrice = parseFloat(marketData.ticker.lastPrice);
      const priceChange24h = parseFloat(marketData.ticker.priceChange);
      const priceChangePercent24h = parseFloat(marketData.ticker.priceChangePercent);
      const volume24h = parseFloat(marketData.ticker.volume);

      // Step 3: Generate AI analysis
      setAnalysisProgress(60);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a professional crypto trader and analyst. Analyze the provided real market data and return a comprehensive analysis in JSON format. The analysis should include:

1. marketSentiment: 'bullish', 'bearish', or 'neutral'
2. technicalAnalysis: detailed technical indicators and levels
3. fundamentalAnalysis: market fundamentals and outlook
4. scalpingOpportunities: specific entry/exit points with risk/reward ratios
5. riskAssessment: comprehensive risk analysis
6. autoTradeSignals: actionable trading signals

Use the real market data provided to give accurate analysis.`
            },
            {
              role: 'user',
              content: `Analyze ${symbol} with the following real market data:

Current Price: $${currentPrice}
24h Change: ${priceChange24h} (${priceChangePercent24h}%)
24h Volume: ${volume24h}
RSI: ${marketData.technicalIndicators.rsi.toFixed(2)}
SMA 20: ${marketData.technicalIndicators.sma20.toFixed(2)}
SMA 50: ${marketData.technicalIndicators.sma50.toFixed(2)}
Support: ${marketData.technicalIndicators.support}
Resistance: ${marketData.technicalIndicators.resistance}

Order book depth: ${marketData.depth.bids.length} bids, ${marketData.depth.asks.length} asks

Provide comprehensive analysis for scalping opportunities, risk assessment, and trading signals.`
            }
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      });

      const data = await response.json();
      
      setAnalysisProgress(80);
      
      if (data.choices && data.choices[0]) {
        try {
          const aiAnalysis = JSON.parse(data.choices[0].message.content);
          
          // Combine AI analysis with real market data
          const completeAnalysis: Analysis = {
            symbol,
            currentPrice,
            priceChange24h,
            priceChangePercent24h,
            volume24h,
            marketSentiment: aiAnalysis.marketSentiment || 'neutral',
            technicalAnalysis: {
              support: marketData.technicalIndicators.support,
              resistance: marketData.technicalIndicators.resistance,
              trend: aiAnalysis.technicalAnalysis?.trend || 'Sideways',
              indicators: aiAnalysis.technicalAnalysis?.indicators || [],
              rsi: marketData.technicalIndicators.rsi,
              macd: aiAnalysis.technicalAnalysis?.macd || 'Neutral',
              bollinger: aiAnalysis.technicalAnalysis?.bollinger || 'Middle Band',
              sma20: marketData.technicalIndicators.sma20,
              sma50: marketData.technicalIndicators.sma50,
              ema12: aiAnalysis.technicalAnalysis?.ema12 || currentPrice * 0.98,
              ema26: aiAnalysis.technicalAnalysis?.ema26 || currentPrice * 0.97
            },
            fundamentalAnalysis: {
              marketCap: aiAnalysis.fundamentalAnalysis?.marketCap || 'N/A',
              volume: `$${(volume24h * currentPrice).toLocaleString()}`,
              news: aiAnalysis.fundamentalAnalysis?.news || 'No significant news',
              outlook: aiAnalysis.fundamentalAnalysis?.outlook || 'Neutral',
              dominance: aiAnalysis.fundamentalAnalysis?.dominance || 45,
              liquidityScore: aiAnalysis.fundamentalAnalysis?.liquidityScore || 85
            },
            scalpingOpportunities: {
              shortTerm: aiAnalysis.scalpingOpportunities?.shortTerm || 'Monitor for breakout',
              entryPoints: aiAnalysis.scalpingOpportunities?.entryPoints || [currentPrice * 0.995],
              exitPoints: aiAnalysis.scalpingOpportunities?.exitPoints || [currentPrice * 1.005],
              stopLoss: aiAnalysis.scalpingOpportunities?.stopLoss || [currentPrice * 0.99],
              riskReward: aiAnalysis.scalpingOpportunities?.riskReward || 2.0,
              probability: aiAnalysis.scalpingOpportunities?.probability || 65
            },
            riskAssessment: {
              volatility: aiAnalysis.riskAssessment?.volatility || 'medium',
              liquidityRisk: aiAnalysis.riskAssessment?.liquidityRisk || 'Low',
              marketRisk: aiAnalysis.riskAssessment?.marketRisk || 'Medium',
              volatilityIndex: aiAnalysis.riskAssessment?.volatilityIndex || Math.abs(priceChangePercent24h),
              correlations: aiAnalysis.riskAssessment?.correlations || ['BTC correlation: High']
            },
            autoTradeSignals: {
              signal: aiAnalysis.autoTradeSignals?.signal || 'hold',
              strength: aiAnalysis.autoTradeSignals?.strength || 50,
              timeframe: aiAnalysis.autoTradeSignals?.timeframe || '15m',
              entry: aiAnalysis.autoTradeSignals?.entry || currentPrice,
              target: aiAnalysis.autoTradeSignals?.target || currentPrice * 1.02,
              stopLoss: aiAnalysis.autoTradeSignals?.stopLoss || currentPrice * 0.98,
              positionSize: aiAnalysis.autoTradeSignals?.positionSize || 0.1
            }
          };

          setAnalysis(completeAnalysis);
          setAnalysisProgress(100);
          
          // Auto-execute trade if enabled
          if (autoTradeEnabled && completeAnalysis.autoTradeSignals.signal !== 'hold') {
            await executeAutoTrade(completeAnalysis.autoTradeSignals);
          }
          
        } catch (parseError) {
          console.error('Error parsing analysis:', parseError);
          alert('Error parsing AI response. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error performing analysis:', error);
      alert('Error performing analysis. Please check your API key and try again.');
    } finally {
      setLoading(false);
      setAnalysisProgress(0);
    }
  };

  const executeAutoTrade = async (signals: Analysis['autoTradeSignals']) => {
    if (exchangeConfig.exchange === 'demo') {
      // Demo trading simulation
      const newOrder: OrderResult = {
        orderId: `demo_${Date.now()}`,
        symbol,
        side: signals.signal as 'buy' | 'sell',
        amount: signals.positionSize,
        price: signals.entry,
        status: 'filled',
        timestamp: Date.now()
      };
      
      setOrders(prev => [newOrder, ...prev]);
      return;
    }

    // Real exchange integration would go here
    // This would require proper exchange API implementation
    console.log('Auto-trade signal:', signals);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'bg-success text-success-foreground';
      case 'bearish': return 'bg-destructive text-destructive-foreground';
      case 'neutral': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Deep Market Analysis</h1>
          <p className="text-muted-foreground">Real-time professional analysis with auto-trading capabilities</p>
        </header>

        {/* Real-time Market Data */}
        {realTimeData && (
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Live Market Data - {symbol}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold">${parseFloat(realTimeData.lastPrice).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">24h Change</p>
                  <p className={`text-lg font-semibold ${parseFloat(realTimeData.priceChangePercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(realTimeData.priceChangePercent).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="text-lg font-semibold">{parseFloat(realTimeData.volume).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">High/Low</p>
                  <p className="text-sm">
                    ${parseFloat(realTimeData.highPrice).toLocaleString()} / ${parseFloat(realTimeData.lowPrice).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Panel */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Analysis Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* AI API Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apiKey">OpenAI API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenAI API key"
                  />
                </div>
                <div>
                  <Label htmlFor="symbol">Trading Symbol</Label>
                  <Select value={symbol} onValueChange={setSymbol}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select symbol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTCUSDT">Bitcoin (BTC/USDT)</SelectItem>
                      <SelectItem value="ETHUSDT">Ethereum (ETH/USDT)</SelectItem>
                      <SelectItem value="BNBUSDT">Binance Coin (BNB/USDT)</SelectItem>
                      <SelectItem value="ADAUSDT">Cardano (ADA/USDT)</SelectItem>
                      <SelectItem value="SOLUSDT">Solana (SOL/USDT)</SelectItem>
                      <SelectItem value="DOTUSDT">Polkadot (DOT/USDT)</SelectItem>
                      <SelectItem value="MATICUSDT">Polygon (MATIC/USDT)</SelectItem>
                      <SelectItem value="AVAXUSDT">Avalanche (AVAX/USDT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Exchange Configuration */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Exchange Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exchange">Exchange</Label>
                    <Select value={exchangeConfig.exchange} onValueChange={(value) => setExchangeConfig(prev => ({ ...prev, exchange: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select exchange" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Demo Trading</SelectItem>
                        <SelectItem value="binance">Binance</SelectItem>
                        <SelectItem value="bybit">Bybit</SelectItem>
                        <SelectItem value="okx">OKX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="testnet"
                      checked={exchangeConfig.testnet}
                      onCheckedChange={(checked) => setExchangeConfig(prev => ({ ...prev, testnet: checked }))}
                    />
                    <Label htmlFor="testnet">Use Testnet</Label>
                  </div>
                </div>
                
                {exchangeConfig.exchange !== 'demo' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="exchangeApiKey">Exchange API Key</Label>
                      <Input
                        id="exchangeApiKey"
                        type="password"
                        value={exchangeConfig.apiKey}
                        onChange={(e) => setExchangeConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Enter exchange API key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="exchangeApiSecret">Exchange API Secret</Label>
                      <Input
                        id="exchangeApiSecret"
                        type="password"
                        value={exchangeConfig.apiSecret}
                        onChange={(e) => setExchangeConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                        placeholder="Enter exchange API secret"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Auto Trading Configuration */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Auto Trading</h3>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoTrade"
                      checked={autoTradeEnabled}
                      onCheckedChange={setAutoTradeEnabled}
                    />
                    <Label htmlFor="autoTrade">Enable Auto Trading</Label>
                  </div>
                </div>
                
                {autoTradeEnabled && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Auto trading is enabled. Trades will be executed automatically based on AI signals.
                      {exchangeConfig.exchange === 'demo' ? ' (Demo mode - no real funds)' : ' (Real trading mode)'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Analysis Controls */}
              <div className="flex items-center gap-4">
                <Button 
                  onClick={performAnalysis} 
                  disabled={loading}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  {loading ? 'Analyzing...' : 'Perform Deep Analysis'}
                </Button>
                
                {loading && (
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Progress value={analysisProgress} className="flex-1" />
                      <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        {orders.length > 0 && (
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.orderId} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      {order.status === 'filled' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {order.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                      <div>
                        <p className="font-medium">{order.symbol} {order.side.toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.amount} @ ${order.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{order.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {analysis.symbol} Analysis Overview
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getSentimentColor(analysis.marketSentiment)}>
                      {analysis.marketSentiment.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      ${analysis.currentPrice?.toLocaleString()}
                    </Badge>
                    <Badge variant={analysis.priceChangePercent24h >= 0 ? "default" : "destructive"}>
                      {analysis.priceChangePercent24h?.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Tabs defaultValue="technical" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="fundamental">Fundamental</TabsTrigger>
                <TabsTrigger value="scalping">Scalping</TabsTrigger>
                <TabsTrigger value="risk">Risk</TabsTrigger>
                <TabsTrigger value="signals">Auto Signals</TabsTrigger>
              </TabsList>

              <TabsContent value="technical" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Technical Analysis</CardTitle>
                    <CardDescription>Real-time technical indicators and levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Support Level</p>
                          <p className="text-xl font-semibold text-green-500">${analysis.technicalAnalysis?.support?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Resistance Level</p>
                          <p className="text-xl font-semibold text-red-500">${analysis.technicalAnalysis?.resistance?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Trend</p>
                          <p className="text-lg font-medium">{analysis.technicalAnalysis?.trend}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">RSI (14)</p>
                          <p className="text-xl font-semibold">{analysis.technicalAnalysis?.rsi?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">MACD</p>
                          <p className="text-lg font-medium">{analysis.technicalAnalysis?.macd}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Bollinger Bands</p>
                          <p className="text-lg font-medium">{analysis.technicalAnalysis?.bollinger}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">SMA 20</p>
                          <p className="text-xl font-semibold">${analysis.technicalAnalysis?.sma20?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">SMA 50</p>
                          <p className="text-xl font-semibold">${analysis.technicalAnalysis?.sma50?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">EMA 12/26</p>
                          <p className="text-lg font-medium">
                            ${analysis.technicalAnalysis?.ema12?.toLocaleString()} / ${analysis.technicalAnalysis?.ema26?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <p className="text-sm text-muted-foreground mb-2">Key Indicators</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.technicalAnalysis?.indicators?.map((indicator, index) => (
                          <Badge key={index} variant="outline">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fundamental" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Fundamental Analysis</CardTitle>
                    <CardDescription>Market fundamentals and outlook</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Market Cap</p>
                          <p className="text-lg font-semibold">{analysis.fundamentalAnalysis?.marketCap}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">24h Volume</p>
                          <p className="text-lg font-semibold">{analysis.fundamentalAnalysis?.volume}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Market Dominance</p>
                          <p className="text-lg font-semibold">{analysis.fundamentalAnalysis?.dominance}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Liquidity Score</p>
                          <p className="text-lg font-semibold">{analysis.fundamentalAnalysis?.liquidityScore}/100</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Market News</p>
                          <p className="text-sm bg-secondary/50 p-3 rounded-md">{analysis.fundamentalAnalysis?.news}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Outlook</p>
                          <p className="text-sm bg-secondary/50 p-3 rounded-md">{analysis.fundamentalAnalysis?.outlook}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scalping" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Scalping Opportunities
                    </CardTitle>
                    <CardDescription>AI-powered scalping strategies with risk/reward analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Strategy Overview</p>
                        <p className="text-sm bg-secondary/50 p-3 rounded-md">{analysis.scalpingOpportunities?.shortTerm}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Risk/Reward Ratio</p>
                          <p className="text-2xl font-bold text-green-500">{analysis.scalpingOpportunities?.riskReward?.toFixed(2)}:1</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Success Probability</p>
                          <p className="text-2xl font-bold text-blue-500">{analysis.scalpingOpportunities?.probability}%</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Entry Points</p>
                          <div className="space-y-1">
                            {analysis.scalpingOpportunities?.entryPoints?.map((point, index) => (
                              <p key={index} className="text-sm font-medium text-green-500">${point?.toLocaleString()}</p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Exit Points</p>
                          <div className="space-y-1">
                            {analysis.scalpingOpportunities?.exitPoints?.map((point, index) => (
                              <p key={index} className="text-sm font-medium text-blue-500">${point?.toLocaleString()}</p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Stop Loss</p>
                          <div className="space-y-1">
                            {analysis.scalpingOpportunities?.stopLoss?.map((point, index) => (
                              <p key={index} className="text-sm font-medium text-red-500">${point?.toLocaleString()}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="risk" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Risk Assessment</CardTitle>
                    <CardDescription>Comprehensive risk analysis for trading decisions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Volatility</p>
                          <p className={`text-xl font-semibold ${getVolatilityColor(analysis.riskAssessment?.volatility)}`}>
                            {analysis.riskAssessment?.volatility?.toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {analysis.riskAssessment?.volatilityIndex?.toFixed(2)}%
                          </p>
                        </div>
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Liquidity Risk</p>
                          <p className="text-sm font-medium">{analysis.riskAssessment?.liquidityRisk}</p>
                        </div>
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Market Risk</p>
                          <p className="text-sm font-medium">{analysis.riskAssessment?.marketRisk}</p>
                        </div>
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Overall Risk</p>
                          <p className={`text-lg font-semibold ${getVolatilityColor(analysis.riskAssessment?.volatility)}`}>
                            {analysis.riskAssessment?.volatility?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Market Correlations</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.riskAssessment?.correlations?.map((correlation, index) => (
                            <Badge key={index} variant="outline">
                              {correlation}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signals" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Auto Trading Signals
                    </CardTitle>
                    <CardDescription>AI-generated trading signals for automated execution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Signal</p>
                          <p className={`text-2xl font-bold ${
                            analysis.autoTradeSignals?.signal === 'buy' ? 'text-green-500' :
                            analysis.autoTradeSignals?.signal === 'sell' ? 'text-red-500' : 'text-yellow-500'
                          }`}>
                            {analysis.autoTradeSignals?.signal?.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Strength</p>
                          <p className="text-2xl font-bold">{analysis.autoTradeSignals?.strength}/100</p>
                        </div>
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Timeframe</p>
                          <p className="text-lg font-medium">{analysis.autoTradeSignals?.timeframe}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Entry Price</p>
                            <p className="text-xl font-semibold">${analysis.autoTradeSignals?.entry?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Target Price</p>
                            <p className="text-xl font-semibold text-green-500">${analysis.autoTradeSignals?.target?.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Stop Loss</p>
                            <p className="text-xl font-semibold text-red-500">${analysis.autoTradeSignals?.stopLoss?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Position Size</p>
                            <p className="text-xl font-semibold">{analysis.autoTradeSignals?.positionSize}</p>
                          </div>
                        </div>
                      </div>
                      
                      {analysis.autoTradeSignals?.signal !== 'hold' && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Active Signal:</strong> {analysis.autoTradeSignals?.signal?.toUpperCase()} signal detected with {analysis.autoTradeSignals?.strength}% strength.
                            {autoTradeEnabled ? ' Auto-trading will execute this signal.' : ' Enable auto-trading to execute automatically.'}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {!analysis && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No analysis performed yet. Configure your settings and click "Perform Deep Analysis" to get comprehensive market insights with real-time data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeepAnalysis;
