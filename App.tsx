
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AssetHoldings, MarketPrices, PortfolioStatus, AssetType } from './types';
import { fetchMarketPrices, getRebalanceAdvice } from './services/geminiService';
import { saveHoldings, getLatestHoldings } from './services/supabaseService';
import { sendTelegramNotification } from './services/telegramService';
import PortfolioCard from './components/PortfolioCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const App: React.FC = () => {
  const [holdings, setHoldings] = useState<AssetHoldings>({
    gold_chi: 0,
    savings_vnd: 0,
    usdt_amount: 0,
    updated_at: new Date().toISOString()
  });

  const [prices, setPrices] = useState<MarketPrices | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const [storedHoldings, currentPrices] = await Promise.all([
        getLatestHoldings(),
        fetchMarketPrices()
      ]);
      if (storedHoldings) {
          // Migration check for old data if needed, but assuming fresh start with 'gold_chi'
          setHoldings(storedHoldings);
      }
      setPrices(currentPrices);
      setIsLoading(false);
    };
    init();
  }, []);

  // Recalculate portfolio status
  const portfolioStatus = useMemo((): PortfolioStatus | null => {
    if (!prices) return null;

    // 1 Lượng (Tael) = 10 Chi. Prices are fetched per Lượng.
    const goldPricePerChi = prices.gold_price_vnd / 10;
    const goldValue = holdings.gold_chi * goldPricePerChi;
    const savingsValue = holdings.savings_vnd;
    const usdtValue = holdings.usdt_amount * prices.usdt_price_vnd;
    const totalValue = goldValue + savingsValue + usdtValue;

    if (totalValue === 0) return {
        totalValueVnd: 0,
        assets: [
            { type: AssetType.GOLD, currentValue: 0, currentPercentage: 0, targetPercentage: 33.33, deviation: 0, isOutOfBalance: false },
            { type: AssetType.SAVINGS, currentValue: 0, currentPercentage: 0, targetPercentage: 33.33, deviation: 0, isOutOfBalance: false },
            { type: AssetType.USDT, currentValue: 0, currentPercentage: 0, targetPercentage: 33.33, deviation: 0, isOutOfBalance: false }
        ]
    };

    const assets = [
      { type: AssetType.GOLD, value: goldValue },
      { type: AssetType.SAVINGS, value: savingsValue },
      { type: AssetType.USDT, value: usdtValue }
    ].map(a => {
      const percentage = (a.value / totalValue) * 100;
      const deviation = percentage - 33.33;
      return {
        type: a.type,
        currentValue: a.value,
        currentPercentage: percentage,
        targetPercentage: 33.33,
        deviation: deviation,
        isOutOfBalance: Math.abs(deviation) > 5
      };
    });

    return { totalValueVnd: totalValue, assets };
  }, [holdings, prices]);

  const handleUpdateHoldings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSyncing(true);
    const newHoldings = { ...holdings, updated_at: new Date().toISOString() };
    await saveHoldings(newHoldings);
    
    // Refresh advice
    if (portfolioStatus) {
      const advice = await getRebalanceAdvice(portfolioStatus);
      setAiAdvice(advice);
    }
    
    setIsSyncing(false);
  };

  const handleManualNotification = async () => {
    if (portfolioStatus) {
      await sendTelegramNotification(portfolioStatus);
      alert("Telegram notification sent!");
    }
  };

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981'];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Portfolio Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 px-4 py-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <i className="fas fa-layer-group"></i>
          </div>
          <h1 className="text-xl font-bold text-slate-900">ZenWealth Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Market Prices (Gemini AI Search)</p>
            <p className="text-sm font-semibold">Gold (Lượng): {prices?.gold_price_vnd.toLocaleString()} • USDT: {prices?.usdt_price_vnd.toLocaleString()}</p>
          </div>
          <button 
            onClick={handleManualNotification}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <i className="fab fa-telegram"></i>
            Push 8AM Report
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form & Settings */}
          <div className="space-y-8">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <i className="fas fa-edit text-slate-400"></i>
                Update Holdings
              </h2>
              <form onSubmit={handleUpdateHoldings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gold (Chi / Chỉ)</label>
                  <div className="relative">
                    <input 
                      type="number" step="0.01"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={holdings.gold_chi}
                      onChange={(e) => setHoldings({...holdings, gold_chi: parseFloat(e.target.value) || 0})}
                    />
                    <i className="fas fa-coins absolute left-3 top-3 text-slate-400"></i>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Savings (VND)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={holdings.savings_vnd}
                      onChange={(e) => setHoldings({...holdings, savings_vnd: parseFloat(e.target.value) || 0})}
                    />
                    <i className="fas fa-piggy-bank absolute left-3 top-3 text-slate-400"></i>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">USDT (Amount)</label>
                  <div className="relative">
                    <input 
                      type="number" step="0.01"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={holdings.usdt_amount}
                      onChange={(e) => setHoldings({...holdings, usdt_amount: parseFloat(e.target.value) || 0})}
                    />
                    <i className="fas fa-dollar-sign absolute left-3 top-3 text-slate-400"></i>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isSyncing}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isSyncing ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <i className="fas fa-save"></i>}
                  Save to Database
                </button>
              </form>
            </section>

            <section className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <i className="fas fa-robot text-blue-400"></i>
                AI Rebalance Advice
              </h2>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {aiAdvice || "Click 'Save' to get smart advice on how to balance your portfolio based on latest market trends."}
              </div>
            </section>
          </div>

          {/* Right Column: Cards & Chart */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {portfolioStatus?.assets.map((asset) => (
                <PortfolioCard 
                  key={asset.type}
                  type={asset.type}
                  value={asset.currentValue}
                  percentage={asset.currentPercentage}
                  deviation={asset.deviation}
                  isOutOfBalance={asset.isOutOfBalance}
                  unit={asset.type === AssetType.GOLD ? 'chi' : asset.type === AssetType.USDT ? 'USDT' : 'VND'}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
                <h2 className="text-lg font-bold mb-8">Asset Allocation</h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={portfolioStatus?.assets || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="currentValue"
                        >
                        {(portfolioStatus?.assets || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: number) => value.toLocaleString() + ' VND'}
                        />
                        <Legend />
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                    <p className="text-slate-500 text-sm">Total Portfolio Value</p>
                    <p className="text-3xl font-black text-slate-900">{portfolioStatus?.totalValueVnd.toLocaleString()} <span className="text-lg font-medium">VND</span></p>
                </div>
              </section>

              <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold mb-6">Target vs. Actual</h2>
                <div className="space-y-6">
                  {portfolioStatus?.assets.map((asset, idx) => (
                    <div key={asset.type}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-slate-700">{asset.type}</span>
                        <span className="text-sm text-slate-500">{asset.currentPercentage.toFixed(1)}% / 33.3%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                        <div 
                          className="h-full transition-all duration-500" 
                          style={{ width: `${Math.min(asset.currentPercentage, 100)}%`, backgroundColor: COLORS[idx] }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t mt-8">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                          <span>Balanced (+/- 5%)</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 mt-2">
                          <div className="w-4 h-4 rounded-full bg-red-500"></div>
                          <span>Needs Attention</span>
                      </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center text-slate-400 text-sm">
        <p>© 2024 ZenWealth. Monitoring Gold (DOJI) and USDT (Binance) prices in real-time.</p>
      </footer>
    </div>
  );
};

export default App;
