import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw, ArrowLeft, Zap, Target, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RealtimeSignals from '@/components/RealtimeSignals';
import MarketScanner from '@/components/MarketScanner';
import AISentiment from '@/components/AISentiment';

interface Signal {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  timeframe: string;
  reason: string;
  risk: 'low' | 'medium' | 'high';
}

const SignalSuggestion = () => {
  const navigate = useNavigate();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const generateSignals = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your OpenAI API key');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: 'You are a professional crypto scalping trader. Generate 3-5 scalping signals for major cryptocurrencies. Focus on small profits (0.5-2%) with tight stop losses. Return JSON format with: symbol, direction (long/short), entryPrice, targetPrice, stopLoss, confidence (1-100), timeframe, reason, risk (low/medium/high). Use realistic current market prices.'
            },
            {
              role: 'user',
              content: 'Generate scalping signals for the current market conditions focusing on BTC, ETH, BNB, ADA, and SOL. Prioritize quick profits with minimal risk.'
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        try {
          const signalsData = JSON.parse(data.choices[0].message.content);
          const formattedSignals = Array.isArray(signalsData) ? signalsData : [signalsData];
          setSignals(formattedSignals.map((signal, index) => ({
            ...signal,
            id: `signal-${Date.now()}-${index}`
          })));
        } catch (parseError) {
          console.error('Error parsing signals:', parseError);
          alert('Error parsing AI response. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error generating signals:', error);
      alert('Error generating signals. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'high': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2">Advanced Trading Signals</h1>
          <p className="text-muted-foreground">AI-powered signals, real-time monitoring, and market sentiment analysis</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RealtimeSignals />
          <AISentiment />
        </div>

        <div className="mb-8">
          <MarketScanner />
        </div>

        <div className="glass-card p-6 rounded-lg mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
                className="w-full px-3 py-2 bg-secondary rounded-md border border-muted"
              />
            </div>
            <Button 
              onClick={generateSignals} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              Generate AI Signals
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {signals.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No AI signals generated yet. Click "Generate AI Signals" to get professional scalping opportunities.</p>
            </div>
          )}

          {signals.map((signal) => (
            <Card key={signal.id} className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {signal.direction === 'long' ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-warning" />
                    )}
                    {signal.symbol}
                    <Badge variant={signal.direction === 'long' ? 'default' : 'secondary'}>
                      {signal.direction.toUpperCase()}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getRiskColor(signal.risk)}>
                      {signal.risk.toUpperCase()} RISK
                    </Badge>
                    <Badge variant="outline">
                      {signal.confidence}% Confidence
                    </Badge>
                  </div>
                </div>
                <CardDescription>{signal.timeframe} • {signal.reason}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Entry Price</p>
                    <p className="text-lg font-semibold">${signal.entryPrice?.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Target Price</p>
                    <p className="text-lg font-semibold text-success">${signal.targetPrice?.toLocaleString()}</p>
                    <p className="text-xs text-success">
                      +{(((signal.targetPrice - signal.entryPrice) / signal.entryPrice) * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Stop Loss</p>
                    <p className="text-lg font-semibold text-warning">${signal.stopLoss?.toLocaleString()}</p>
                    <p className="text-xs text-warning">
                      -{(((signal.entryPrice - signal.stopLoss) / signal.entryPrice) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-secondary/50 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Risk/Reward Ratio</p>
                  <p className="font-medium">
                    1:{((signal.targetPrice - signal.entryPrice) / (signal.entryPrice - signal.stopLoss)).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignalSuggestion;
