import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  PieChart,
  BarChart3,
  Zap
} from 'lucide-react';

import {
  AutoTradingService,
  MarketDataService,
  TradingSignal,
  OrderResult,
  ExchangeCredentials
} from '@/services/autoTrading';

interface TradingDashboardProps {
  onSignalGenerated?: (signal: TradingSignal) => void;
}

const TradingDashboard: React.FC<TradingDashboardProps> = ({ onSignalGenerated }) => {
  const [autoTradingService, setAutoTradingService] = useState<AutoTradingService | null>(null);
  const [marketDataService] = useState(MarketDataService.getInstance());
  
  const [isAutoTradingEnabled, setIsAutoTradingEnabled] = useState(false);
  const [activeSignals, setActiveSignals] = useState<TradingSignal[]>([]);
  const [orders, setOrders] = useState<OrderResult[]>([]);
  const [accountBalance, setAccountBalance] = useState<{ [key: string]: number }>({});
  const [marketData, setMarketData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  
  const [exchangeCredentials, setExchangeCredentials] = useState<ExchangeCredentials>({
    exchange: 'demo',
    apiKey: '',
    apiSecret: '',
    testnet: true
  });

  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [riskPercentage, setRiskPercentage] = useState(1);
  const [maxActiveSignals, setMaxActiveSignals] = useState(5);

  // Initialize services
  useEffect(() => {
    const service = new AutoTradingService(exchangeCredentials);
    setAutoTradingService(service);
    
    if (isAutoTradingEnabled) {
      service.enable();
    }
  }, [exchangeCredentials, isAutoTradingEnabled]);

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const data = await marketDataService.getMarketData(selectedSymbol);
        setMarketData(prev => ({ ...prev, [selectedSymbol]: data }));
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [selectedSymbol, marketDataService]);

  // Generate AI trading signal
  const generateTradingSignal = async (apiKey: string) => {
    if (!apiKey.trim()) {
      alert('Please enter your OpenAI API key');
      return;
    }

    setLoading(true);
    try {
      const currentMarketData = await marketDataService.getMarketData(selectedSymbol);
      const klines = await marketDataService.getKlines(selectedSymbol, '1h', 100);
      
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
              content: `You are a professional crypto trading bot. Generate a trading signal based on real market data. 
              Return JSON format with: symbol, action (buy/sell/hold), price, quantity, stopLoss, takeProfit, confidence (1-100).
              Consider risk management - use appropriate position sizing and stop losses.`
            },
            {
              role: 'user',
              content: `Generate a trading signal for ${selectedSymbol} based on this data:
              Current Price: ${currentMarketData.price}
              24h Change: ${currentMarketData.changePercent}%
              Volume: ${currentMarketData.volume}
              High: ${currentMarketData.high}
              Low: ${currentMarketData.low}
              
              Recent price action: ${klines.slice(-10).map(k => k.close).join(', ')}
              
              Risk tolerance: ${riskPercentage}%
              Max active signals: ${maxActiveSignals}
              Current active signals: ${activeSignals.length}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        try {
          const signalData = JSON.parse(data.choices[0].message.content);
          
          const signal: TradingSignal = {
            symbol: selectedSymbol,
            action: signalData.action || 'hold',
            price: signalData.price || currentMarketData.price,
            quantity: signalData.quantity || 0.01,
            stopLoss: signalData.stopLoss || currentMarketData.price * 0.95,
            takeProfit: signalData.takeProfit || currentMarketData.price * 1.05,
            confidence: signalData.confidence || 50,
            timestamp: Date.now()
          };

          setActiveSignals(prev => [...prev, signal]);
          
          if (onSignalGenerated) {
            onSignalGenerated(signal);
          }

          // Auto-execute if enabled
          if (isAutoTradingEnabled && autoTradingService && signal.action !== 'hold') {
            const order = await autoTradingService.executeSignal(signal);
            setOrders(prev => [order, ...prev]);
          }
          
        } catch (parseError) {
          console.error('Error parsing signal:', parseError);
        }
      }
    } catch (error) {
      console.error('Error generating signal:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeSignal = async (signal: TradingSignal) => {
    if (!autoTradingService) return;
    
    try {
      const order = await autoTradingService.executeSignal(signal);
      setOrders(prev => [order, ...prev]);
      
      // Remove signal from active signals
      setActiveSignals(prev => prev.filter(s => s.timestamp !== signal.timestamp));
    } catch (error) {
      console.error('Error executing signal:', error);
    }
  };

  const getCurrentPnL = () => {
    return orders.reduce((total, order) => {
      if (order.status === 'filled') {
        const currentPrice = marketData[order.symbol]?.price || order.price;
        const pnl = order.side === 'buy' ? 
          (currentPrice - order.price) * order.quantity :
          (order.price - currentPrice) * order.quantity;
        return total + pnl;
      }
      return total;
    }, 0);
  };

  const getWinRate = () => {
    const filledOrders = orders.filter(o => o.status === 'filled');
    if (filledOrders.length === 0) return 0;
    
    const profitable = filledOrders.filter(order => {
      const currentPrice = marketData[order.symbol]?.price || order.price;
      const pnl = order.side === 'buy' ? 
        (currentPrice - order.price) * order.quantity :
        (order.price - currentPrice) * order.quantity;
      return pnl > 0;
    });
    
    return (profitable.length / filledOrders.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Trading Dashboard Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Auto Trading Dashboard
          </CardTitle>
          <CardDescription>
            Real-time trading with AI-powered signals
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${accountBalance.USDT?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">Total Balance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCurrentPnL() >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${getCurrentPnL().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Current Session</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getWinRate().toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSignals.length}</div>
            <p className="text-xs text-muted-foreground">Pending Execution</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Trading Interface */}
      <Tabs defaultValue="signals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Trading Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Signal Generation */}
                <div className="flex items-center gap-4">
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select Symbol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                      <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                      <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                      <SelectItem value="ADAUSDT">ADA/USDT</SelectItem>
                      <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={() => generateTradingSignal('your-api-key')}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Generate Signal
                  </Button>
                </div>

                {/* Active Signals */}
                <div className="space-y-2">
                  {activeSignals.map((signal, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-secondary/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{signal.symbol}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(signal.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge variant={signal.action === 'buy' ? 'default' : signal.action === 'sell' ? 'destructive' : 'secondary'}>
                            {signal.action.toUpperCase()}
                          </Badge>
                          <div className="text-right">
                            <p className="text-sm">Price: ${signal.price.toLocaleString()}</p>
                            <p className="text-sm">Qty: {signal.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-green-500">TP: ${signal.takeProfit.toLocaleString()}</p>
                            <p className="text-sm text-red-500">SL: ${signal.stopLoss.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm">Confidence</p>
                            <p className="text-lg font-bold">{signal.confidence}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => executeSignal(signal)}
                            disabled={!autoTradingService || signal.action === 'hold'}
                          >
                            Execute
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveSignals(prev => prev.filter((_, i) => i !== index))}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {activeSignals.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No active signals. Generate a signal to get started.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {order.status === 'filled' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {order.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                      {order.status === 'pending' && <RefreshCw className="w-4 h-4 text-yellow-500" />}
                      <div>
                        <p className="font-medium">{order.symbol} {order.side.toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${order.price.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Qty: {order.quantity}</p>
                    </div>
                    <Badge variant={order.status === 'filled' ? 'default' : order.status === 'failed' ? 'destructive' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
                
                {orders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders yet. Execute a signal to see orders here.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Trading Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Auto Trading Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-trading">Auto Trading</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically execute signals when generated
                    </p>
                  </div>
                  <Switch
                    id="auto-trading"
                    checked={isAutoTradingEnabled}
                    onCheckedChange={setIsAutoTradingEnabled}
                  />
                </div>

                {/* Risk Management */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="risk-percentage">Risk Per Trade (%)</Label>
                    <Input
                      id="risk-percentage"
                      type="number"
                      value={riskPercentage}
                      onChange={(e) => setRiskPercentage(Number(e.target.value))}
                      min="0.1"
                      max="10"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="max-signals">Max Active Signals</Label>
                    <Input
                      id="max-signals"
                      type="number"
                      value={maxActiveSignals}
                      onChange={(e) => setMaxActiveSignals(Number(e.target.value))}
                      min="1"
                      max="20"
                    />
                  </div>
                </div>

                {/* Exchange Configuration */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="exchange">Exchange</Label>
                    <Select 
                      value={exchangeCredentials.exchange} 
                      onValueChange={(value) => setExchangeCredentials(prev => ({ ...prev, exchange: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Exchange" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Demo Trading</SelectItem>
                        <SelectItem value="binance">Binance</SelectItem>
                        <SelectItem value="bybit">Bybit</SelectItem>
                        <SelectItem value="okx">OKX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {exchangeCredentials.exchange !== 'demo' && (
                    <>
                      <div>
                        <Label htmlFor="api-key">API Key</Label>
                        <Input
                          id="api-key"
                          type="password"
                          value={exchangeCredentials.apiKey}
                          onChange={(e) => setExchangeCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="api-secret">API Secret</Label>
                        <Input
                          id="api-secret"
                          type="password"
                          value={exchangeCredentials.apiSecret}
                          onChange={(e) => setExchangeCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="testnet"
                          checked={exchangeCredentials.testnet}
                          onCheckedChange={(checked) => setExchangeCredentials(prev => ({ ...prev, testnet: checked }))}
                        />
                        <Label htmlFor="testnet">Use Testnet</Label>
                      </div>
                    </>
                  )}
                </div>

                {isAutoTradingEnabled && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Auto trading is enabled. Signals will be executed automatically.
                      {exchangeCredentials.exchange === 'demo' ? ' (Demo mode - no real funds)' : ' (Real trading mode)'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Trading Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-2xl font-bold">{orders.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Successful Trades</p>
                    <p className="text-2xl font-bold text-green-500">
                      {orders.filter(o => o.status === 'filled').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Failed Trades</p>
                    <p className="text-2xl font-bold text-red-500">
                      {orders.filter(o => o.status === 'failed').length}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Best Performing Symbol</p>
                    <p className="text-lg font-semibold">
                      {orders.length > 0 ? orders[0].symbol : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Trade Size</p>
                    <p className="text-lg font-semibold">
                      ${orders.length > 0 ? (orders.reduce((sum, o) => sum + (o.price * o.quantity), 0) / orders.length).toFixed(2) : '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Fees Paid</p>
                    <p className="text-lg font-semibold">
                      ${orders.reduce((sum, o) => sum + (o.fees || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradingDashboard;
