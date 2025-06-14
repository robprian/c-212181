
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, TrendingDown, MessageCircle, RefreshCw } from 'lucide-react';

interface SentimentData {
  overall: 'Bullish' | 'Bearish' | 'Neutral';
  score: number;
  confidence: number;
  sources: {
    social: number;
    news: number;
    technical: number;
  };
  trending: {
    keyword: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    mentions: number;
  }[];
}

const AISentiment = () => {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const generateSentiment = async () => {
    if (!apiKey.trim()) {
      // Generate mock data for demo
      const mockSentiment: SentimentData = {
        overall: Math.random() > 0.5 ? 'Bullish' : Math.random() > 0.25 ? 'Bearish' : 'Neutral',
        score: Math.random() * 100,
        confidence: Math.random() * 100,
        sources: {
          social: Math.random() * 100,
          news: Math.random() * 100,
          technical: Math.random() * 100,
        },
        trending: [
          { keyword: 'Bitcoin ETF', sentiment: 'positive', mentions: Math.floor(Math.random() * 1000) },
          { keyword: 'DeFi Summer', sentiment: 'positive', mentions: Math.floor(Math.random() * 1000) },
          { keyword: 'Regulation', sentiment: 'negative', mentions: Math.floor(Math.random() * 1000) },
          { keyword: 'Adoption', sentiment: 'positive', mentions: Math.floor(Math.random() * 1000) },
        ],
      };
      setSentiment(mockSentiment);
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
              content: 'You are an AI sentiment analyst for cryptocurrency markets. Analyze current market sentiment and return JSON format with: overall (Bullish/Bearish/Neutral), score (0-100), confidence (0-100), sources (social, news, technical scores), and trending keywords array with sentiment and mentions.'
            },
            {
              role: 'user',
              content: 'Analyze the current cryptocurrency market sentiment based on recent news, social media, and technical indicators. Focus on Bitcoin, Ethereum, and major altcoins.'
            }
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        try {
          const sentimentData = JSON.parse(data.choices[0].message.content);
          setSentiment(sentimentData);
        } catch (parseError) {
          console.error('Error parsing sentiment data:', parseError);
          alert('Error parsing AI response. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      alert('Error analyzing sentiment. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Bullish': return 'text-green-500';
      case 'Bearish': return 'text-red-500';
      case 'Neutral': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getSentimentBadgeColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Bullish': return 'bg-green-500 text-white';
      case 'Bearish': return 'bg-red-500 text-white';
      case 'Neutral': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getKeywordSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Sentiment Analysis
            </CardTitle>
            <CardDescription>Real-time market sentiment powered by AI</CardDescription>
          </div>
          <Button onClick={generateSentiment} disabled={loading}>
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Analyze Sentiment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">OpenAI API Key (Optional)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Leave empty for demo data"
                className="w-full px-3 py-2 bg-secondary rounded-md border border-muted"
              />
            </div>
          </div>

          {!sentiment ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sentiment analysis yet. Click "Analyze Sentiment" to get AI insights.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary/30 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Overall Sentiment</h3>
                  <Badge className={getSentimentBadgeColor(sentiment.overall)}>
                    {sentiment.overall === 'Bullish' ? <TrendingUp className="w-4 h-4 mr-1" /> : 
                     sentiment.overall === 'Bearish' ? <TrendingDown className="w-4 h-4 mr-1" /> : 
                     <MessageCircle className="w-4 h-4 mr-1" />}
                    {sentiment.overall}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-secondary/30 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Sentiment Score</h3>
                  <p className={`text-2xl font-bold ${getSentimentColor(sentiment.overall)}`}>
                    {sentiment.score.toFixed(0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-secondary/30 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Confidence</h3>
                  <p className="text-2xl font-bold">{sentiment.confidence.toFixed(0)}%</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sentiment Sources</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Social Media</span>
                      <span>{sentiment.sources.social.toFixed(0)}%</span>
                    </div>
                    <Progress value={sentiment.sources.social} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>News</span>
                      <span>{sentiment.sources.news.toFixed(0)}%</span>
                    </div>
                    <Progress value={sentiment.sources.news} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Technical Analysis</span>
                      <span>{sentiment.sources.technical.toFixed(0)}%</span>
                    </div>
                    <Progress value={sentiment.sources.technical} className="h-2" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Trending Keywords</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sentiment.trending.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <Badge className={getKeywordSentimentColor(trend.sentiment)}>
                          {trend.keyword}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{trend.mentions} mentions</p>
                        <p className="text-xs text-muted-foreground">{trend.sentiment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AISentiment;
