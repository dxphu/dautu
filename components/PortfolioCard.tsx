
import React from 'react';
import { AssetType } from '../types';

interface PortfolioCardProps {
  type: AssetType;
  value: number;
  percentage: number;
  deviation: number;
  isOutOfBalance: boolean;
  unit: string;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ type, value, percentage, deviation, isOutOfBalance, unit }) => {
  const icons = {
    [AssetType.GOLD]: 'fa-coins text-yellow-500',
    [AssetType.SAVINGS]: 'fa-piggy-bank text-blue-500',
    [AssetType.USDT]: 'fa-dollar-sign text-emerald-500',
  };

  return (
    <div className={`p-6 rounded-2xl bg-white shadow-sm border ${isOutOfBalance ? 'border-red-200' : 'border-slate-100'} transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50`}>
          <i className={`fas ${icons[type]} text-xl`}></i>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">{type}</p>
          <p className="text-2xl font-bold">{percentage.toFixed(1)}%</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Value (VND)</span>
          <span className="font-semibold">{value.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Target</span>
          <span className="font-semibold">33.3%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Deviation</span>
          <span className={`font-bold ${Math.abs(deviation) > 5 ? 'text-red-500' : 'text-emerald-500'}`}>
            {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
          </span>
        </div>
      </div>

      {isOutOfBalance && (
        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">
          <i className="fas fa-exclamation-triangle"></i>
          REBALANCE NEEDED (+/- 5%)
        </div>
      )}
    </div>
  );
};

export default PortfolioCard;
