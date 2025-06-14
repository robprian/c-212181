
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, TrendingDown, Volume2, BarChart3 } from 'lucide-react';

interface ScanResult {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  rsi: number;
  macd: string;
  signal: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
}

const MarketScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [activeTab, setActiveTab] = useState('trending');

  const generateScanResults = (): ScanResult[] => {
    const symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'MATIC', 'AVAX', 'LINK'];
    const signals = ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'] as const;
    
    return symbols.map(symbol => ({
      symbol,
      price: Math.random() * 100000 + 1000,
      change24h: (Math.random() - 0.5) * 20,
      volume: Math.random() * 1000000000 + 100000000,
      rsi: Math.random() * 100,
      macd: Math.random() > 0.5 ? 'Bullish' : 'Bearish',
      signal: signals[Math.floor(Math.random() * signals.length)],
    }));
  };

  const startScan = () => {
    setScanning(true);
    setTimeout(() => {
      setResults(generateScanResults());
      setScanning(false);
    }, 2000);
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'Strong Buy': return 'bg-green-600 text-white';
      case 'Buy': return 'bg-green-500 text-white';
      case 'Hold': return 'bg-yellow-500 text-black';
      case 'Sell': return 'bg-red-500 text-white';
      case 'Strong Sell': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const filteredResults = results.filter(result => {
    switch (activeTab) {
      case 'trending':
        return Math.abs(result.change24h) > 5;
      case 'overbought':
        return result.rsi > 70;
      case 'oversold':
        return result.rsi < 30;
      case 'volume':
        return result.volume > 500000000;
      default:
        return true;
    }
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Market Scanner
            </CardTitle>
            <CardDescription>Scan the market for trading opportunities</CardDescription>
          </div>
          <Button onClick={startScan} disabled={scanning}>
            {scanning ? (
              <>
                <BarChart3 className="w-4 h-4 mr-2 animate-pulse" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Start Scan
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="overbought">Overbought</TabsTrigger>
            <TabsTrigger value="oversold">Oversold</TabsTrigger>
            <TabsTrigger value="volume">High Volume</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            {results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No scan results yet. Click "Start Scan" to analyze the market.</p>
              </div>
            ) : (
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>24h Change</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>RSI</TableHead>
                      <TableHead>MACD</TableHead>
                      <TableHead>Signal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow key={result.symbol}>
                        <TableCell className="font-medium">{result.symbol}</TableCell>
                        <TableCell>${result.price.toLocaleString()}</TableCell>
                        <TableCell className={result.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {result.change24h >= 0 ? '+' : ''}{result.change24h.toFixed(2)}%
                        </TableCell>
                        <TableCell>${(result.volume / 1000000).toFixed(0)}M</TableCell>
                        <TableCell>{result.rsi.toFixed(0)}</TableCell>
                        <TableCell>
                          <Badge variant={result.macd === 'Bullish' ? 'default' : 'secondary'}>
                            {result.macd}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSignalColor(result.signal)}>
                            {result.signal}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarketScanner;
