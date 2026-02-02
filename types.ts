
export enum AssetType {
  GOLD = 'GOLD',
  SAVINGS = 'SAVINGS',
  USDT = 'USDT'
}

export interface AssetHoldings {
  gold_chi: number;
  savings_vnd: number;
  usdt_amount: number;
  updated_at: string;
}

export interface MarketPrices {
  gold_price_vnd: number; // Price per tael (lượng)
  usdt_price_vnd: number; // Price per USDT
  timestamp: string;
}

export interface PortfolioStatus {
  totalValueVnd: number;
  assets: {
    type: AssetType;
    currentValue: number;
    currentPercentage: number;
    targetPercentage: number;
    deviation: number;
    isOutOfBalance: boolean;
  }[];
}

export interface Config {
  supabaseUrl: string;
  supabaseKey: string;
  telegramBotToken: string;
  telegramChatId: string;
}
