
import { createClient } from "@supabase/supabase-js";
import { config } from "../config";
import { AssetHoldings } from "../types";

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

export const saveHoldings = async (holdings: AssetHoldings): Promise<void> => {
  try {
    const { error } = await supabase
      .from('holdings')
      .insert([
        { 
          gold_chi: holdings.gold_chi, 
          savings_vnd: holdings.savings_vnd, 
          usdt_amount: holdings.usdt_amount,
          updated_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;
    console.log("Holdings successfully saved to Supabase.");
  } catch (error) {
    console.error("Error saving to Supabase:", error);
    // Fallback to localStorage if Supabase fails
    localStorage.setItem('zenwealth_holdings', JSON.stringify(holdings));
  }
};

export const getLatestHoldings = async (): Promise<AssetHoldings | null> => {
  try {
    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return {
      gold_chi: data.gold_chi,
      savings_vnd: data.savings_vnd,
      usdt_amount: data.usdt_amount,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error("Error fetching from Supabase:", error);
    // Fallback to localStorage
    const localData = localStorage.getItem('zenwealth_holdings');
    return localData ? JSON.parse(localData) : null;
  }
};
