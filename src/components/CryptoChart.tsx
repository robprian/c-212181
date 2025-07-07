import { useState, useEffect } from 'react';
import TradingViewWidget from 'react-tradingview-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
}

const CryptoChart = ({ symbol = 'BTCUSDT' }: { symbol?: string }) => {
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [interval, setInterval] = useState('1D');

  const fetchMarketData = async (symbol: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      const data = await response.json();
      
      setMarketData({
        symbol: data.symbol,
        price: parseFloat(data.lastPrice),
        change: parseFloat(data.priceChange),
        changePercent: parseFloat(data.priceChangePercent),
        volume: parseFloat(data.volume),
        high: parseFloat(data.highPrice),
        low: parseFloat(data.lowPrice)
      });
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData(selectedSymbol);
    const interval = setInterval(() => fetchMarketData(selectedSymbol), 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol);
  };

  const getTradingViewSymbol = (symbol: string) => {
    const binanceSymbol = `BINANCE:${symbol}`;
    return binanceSymbol;
  };

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Real-time Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMarketData(selectedSymbol)}
              disabled={loading}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select Symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                <SelectItem value="ADAUSDT">ADA/USDT</SelectItem>
                <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                <SelectItem value="DOTUSDT">DOT/USDT</SelectItem>
                <SelectItem value="MATICUSDT">MATIC/USDT</SelectItem>
                <SelectItem value="AVAXUSDT">AVAX/USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Market Data Overview */}
        {marketData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-lg font-bold">${marketData.price.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground">24h Change</p>
              <p className={`text-lg font-bold flex items-center justify-center gap-1 ${
                marketData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {marketData.changePercent >= 0 ? 
                  <TrendingUp className="w-4 h-4" /> : 
                  <TrendingDown className="w-4 h-4" />
                }
                {marketData.changePercent.toFixed(2)}%
              </p>
            </div>
            <div className="text-center p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground">24h High</p>
              <p className="text-lg font-bold">${marketData.high.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground">24h Low</p>
              <p className="text-lg font-bold">${marketData.low.toLocaleString()}</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="orderbook">Order Book</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="space-y-4">
            {/* Interval Selection */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Interval:</span>
              <div className="flex gap-1">
                {['1m', '5m', '15m', '1h', '4h', '1D', '1W'].map((int) => (
                  <Button
                    key={int}
                    variant={interval === int ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInterval(int)}
                  >
                    {int}
                  </Button>
                ))}
              </div>
            </div>

            {/* TradingView Chart */}
            <div className="h-[500px] w-full bg-secondary/20 rounded-lg overflow-hidden">
              <TradingViewWidget
                symbol={getTradingViewSymbol(selectedSymbol)}
                theme="dark"
                locale="en"
                autosize
                hide_side_toolbar={false}
                allow_symbol_change={true}
                interval={interval}
                toolbar_bg="#1a1a1a"
                enable_publishing={false}
                hide_top_toolbar={false}
                save_image={false}
                container_id={`tradingview_${selectedSymbol}`}
                details={true}
                hotlist={true}
                calendar={false}
                news={[]  as any}
                studies={[
                  'RSI@tv-basicstudies',
                  'MACD@tv-basicstudies',
                  'MASimple@tv-basicstudies',
                  'BB@tv-basicstudies'
                ]}
                show_popup_button={true}
                popup_width="1000"
                popup_height="650"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="orderbook" className="space-y-4">
            <OrderBookComponent symbol={selectedSymbol} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Order Book Component
const OrderBookComponent = ({ symbol }: { symbol: string }) => {
  const [orderBook, setOrderBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrderBook = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=20`);
      const data = await response.json();
      setOrderBook(data);
    } catch (error) {
      console.error('Error fetching order book:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading && !orderBook) {
    return <div className="text-center py-8">Loading order book...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Order Book</h3>
        <Button variant="outline" size="sm" onClick={fetchOrderBook} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>
      
      {orderBook && (
        <div className="grid grid-cols-2 gap-4">
          {/* Bids */}
          <div>
            <h4 className="text-sm font-medium text-green-500 mb-2">Bids</h4>
            <div className="space-y-1">
              {orderBook.bids.slice(0, 10).map((bid: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-green-500">${parseFloat(bid[0]).toLocaleString()}</span>
                  <span className="text-muted-foreground">{parseFloat(bid[1]).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Asks */}
          <div>
            <h4 className="text-sm font-medium text-red-500 mb-2">Asks</h4>
            <div className="space-y-1">
              {orderBook.asks.slice(0, 10).map((ask: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-red-500">${parseFloat(ask[0]).toLocaleString()}</span>
                  <span className="text-muted-foreground">{parseFloat(ask[1]).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {orderBook && (
        <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Spread: ${(parseFloat(orderBook.asks[0][0]) - parseFloat(orderBook.bids[0][0])).toFixed(8)}
          </p>
        </div>
      )}
    </div>
  );
};

export default CryptoChart;