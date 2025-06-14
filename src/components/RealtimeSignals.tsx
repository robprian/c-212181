
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

interface RealtimeSignal {
  id: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  strength: number;
  timestamp: Date;
  change: number;
}

const RealtimeSignals = () => {
  const [signals, setSignals] = useState<RealtimeSignal[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const generateRandomSignal = (): RealtimeSignal => {
    const symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'MATIC'];
    const signalTypes = ['BUY', 'SELL', 'HOLD'] as const;
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    return {
      id: `signal-${Date.now()}-${Math.random()}`,
      symbol,
      signal: signalTypes[Math.floor(Math.random() * signalTypes.length)],
      price: Math.random() * 100000 + 1000,
      strength: Math.floor(Math.random() * 100) + 1,
      timestamp: new Date(),
      change: (Math.random() - 0.5) * 10,
    };
  };

  const startRealtime = () => {
    setIsConnected(true);
    const interval = setInterval(() => {
      const newSignal = generateRandomSignal();
      setSignals(prev => [newSignal, ...prev.slice(0, 9)]);
    }, 3000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  };

  const stopRealtime = () => {
    setIsConnected(false);
  };

  useEffect(() => {
    if (isConnected) {
      return startRealtime();
    }
  }, [isConnected]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'bg-green-500 text-white';
      case 'SELL': return 'bg-red-500 text-white';
      case 'HOLD': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY': return <TrendingUp className="w-4 h-4" />;
      case 'SELL': return <TrendingDown className="w-4 h-4" />;
      case 'HOLD': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Real-time Signals
            </CardTitle>
            <CardDescription>Live trading signals updated every 3 seconds</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <Button
              onClick={isConnected ? stopRealtime : () => setIsConnected(true)}
              size="sm"
              variant={isConnected ? 'secondary' : 'default'}
            >
              {isConnected ? 'Stop' : 'Start'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {signals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No signals yet. Click "Start" to begin real-time monitoring.</p>
            </div>
          ) : (
            signals.map((signal) => (
              <div key={signal.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={getSignalColor(signal.signal)}>
                    {getSignalIcon(signal.signal)}
                    {signal.signal}
                  </Badge>
                  <div>
                    <p className="font-semibold">{signal.symbol}</p>
                    <p className="text-sm text-muted-foreground">
                      ${signal.price.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Strength: {signal.strength}%</p>
                  <p className={`text-xs ${signal.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {signal.change >= 0 ? '+' : ''}{signal.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeSignals;
