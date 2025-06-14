
import MarketStats from "@/components/MarketStats";
import CryptoChart from "@/components/CryptoChart";
import PortfolioCard from "@/components/PortfolioCard";
import CryptoList from "@/components/CryptoList";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Brain } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Crypto Dashboard</h1>
              <p className="text-muted-foreground">Welcome back to your portfolio</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/signals')}
                className="flex items-center gap-2"
                variant="default"
              >
                <TrendingUp className="w-4 h-4" />
                Signal Generator
              </Button>
              <Button 
                onClick={() => navigate('/analysis')}
                className="flex items-center gap-2"
                variant="secondary"
              >
                <Brain className="w-4 h-4" />
                Deep Analysis
              </Button>
            </div>
          </div>
        </header>
        
        <MarketStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CryptoChart />
          </div>
          <div>
            <PortfolioCard />
          </div>
        </div>
        
        <CryptoList />
      </div>
    </div>
  );
};

export default Index;
