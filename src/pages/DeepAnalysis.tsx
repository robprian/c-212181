
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Brain, Target, RefreshCw } from 'lucide-react';

interface Analysis {
  symbol: string;
  currentPrice: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  technicalAnalysis: {
    support: number;
    resistance: number;
    trend: string;
    indicators: string[];
  };
  fundamentalAnalysis: {
    marketCap: string;
    volume: string;
    news: string;
    outlook: string;
  };
  scalpingOpportunities: {
    shortTerm: string;
    entryPoints: number[];
    exitPoints: number[];
  };
  riskAssessment: {
    volatility: 'low' | 'medium' | 'high';
    liquidityRisk: string;
    marketRisk: string;
  };
}

const DeepAnalysis = () => {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [apiKey, setApiKey] = useState('');

  const performAnalysis = async () => {
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
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional crypto trader and analyst. Provide comprehensive deep analysis for scalping and trading. Return detailed JSON format with: symbol, currentPrice, marketSentiment, technicalAnalysis (support, resistance, trend, indicators array), fundamentalAnalysis (marketCap, volume, news, outlook), scalpingOpportunities (shortTerm, entryPoints array, exitPoints array), riskAssessment (volatility, liquidityRisk, marketRisk). Be detailed and professional.'
            },
            {
              role: 'user',
              content: `Perform a deep analysis of ${symbol} for scalping opportunities. Include technical indicators, market sentiment, risk assessment, and specific entry/exit points for scalping strategies. Focus on actionable insights for quick profit opportunities.`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        try {
          const analysisData = JSON.parse(data.choices[0].message.content);
          setAnalysis(analysisData);
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
    }
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
          <p className="text-muted-foreground">Professional-grade analysis for scalping strategies</p>
        </header>

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
            <div>
              <label className="block text-sm font-medium mb-2">Symbol</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="px-3 py-2 bg-secondary rounded-md border border-muted"
              >
                <option value="BTCUSDT">Bitcoin (BTC)</option>
                <option value="ETHUSDT">Ethereum (ETH)</option>
                <option value="BNBUSDT">Binance Coin (BNB)</option>
                <option value="ADAUSDT">Cardano (ADA)</option>
                <option value="SOLUSDT">Solana (SOL)</option>
              </select>
            </div>
            <Button 
              onClick={performAnalysis} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              Analyze
            </Button>
          </div>
        </div>

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
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Tabs defaultValue="technical" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="fundamental">Fundamental</TabsTrigger>
                <TabsTrigger value="scalping">Scalping</TabsTrigger>
                <TabsTrigger value="risk">Risk</TabsTrigger>
              </TabsList>

              <TabsContent value="technical" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Technical Analysis</CardTitle>
                    <CardDescription>Key technical indicators and levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Support Level</p>
                          <p className="text-xl font-semibold text-success">${analysis.technicalAnalysis?.support?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Resistance Level</p>
                          <p className="text-xl font-semibold text-warning">${analysis.technicalAnalysis?.resistance?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Trend</p>
                          <p className="text-lg font-medium">{analysis.technicalAnalysis?.trend}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Key Indicators</p>
                        <div className="space-y-2">
                          {analysis.technicalAnalysis?.indicators?.map((indicator, index) => (
                            <Badge key={index} variant="outline" className="mr-2 mb-2">
                              {indicator}
                            </Badge>
                          ))}
                        </div>
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
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Market News</p>
                          <p className="text-sm">{analysis.fundamentalAnalysis?.news}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Outlook</p>
                          <p className="text-sm">{analysis.fundamentalAnalysis?.outlook}</p>
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
                    <CardDescription>Quick profit opportunities and entry/exit points</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Short-term Strategy</p>
                        <p className="text-sm bg-secondary/50 p-3 rounded-md">{analysis.scalpingOpportunities?.shortTerm}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Entry Points</p>
                          <div className="space-y-1">
                            {analysis.scalpingOpportunities?.entryPoints?.map((point, index) => (
                              <p key={index} className="text-sm font-medium text-success">${point?.toLocaleString()}</p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Exit Points</p>
                          <div className="space-y-1">
                            {analysis.scalpingOpportunities?.exitPoints?.map((point, index) => (
                              <p key={index} className="text-sm font-medium text-warning">${point?.toLocaleString()}</p>
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Volatility</p>
                          <p className={`text-xl font-semibold ${getVolatilityColor(analysis.riskAssessment?.volatility)}`}>
                            {analysis.riskAssessment?.volatility?.toUpperCase()}
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
                      </div>
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
            <p>No analysis performed yet. Select a symbol and click "Analyze" to get comprehensive market insights.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeepAnalysis;
