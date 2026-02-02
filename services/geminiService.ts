
import { GoogleGenAI, Type } from "@google/genai";
import { MarketPrices, PortfolioStatus, AssetType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const fetchMarketPrices = async (): Promise<MarketPrices> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Get the current DOJI Gold price per tael (lượng) and the current USDT/VND exchange rate on Binance P2P in Vietnam. Provide only the numerical values.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gold_price_vnd: { type: Type.NUMBER, description: "DOJI Gold SJC price per tael in VND" },
            usdt_price_vnd: { type: Type.NUMBER, description: "USDT price in VND" }
          },
          required: ["gold_price_vnd", "usdt_price_vnd"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      gold_price_vnd: data.gold_price_vnd || 80000000, // Fallback price
      usdt_price_vnd: data.usdt_price_vnd || 25400,   // Fallback price
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching market prices:", error);
    // Return dummy data if search fails (e.g. rate limit)
    return {
      gold_price_vnd: 82500000,
      usdt_price_vnd: 25450,
      timestamp: new Date().toISOString()
    };
  }
};

export const getRebalanceAdvice = async (status: PortfolioStatus): Promise<string> => {
  const prompt = `
    Analyze this financial portfolio for rebalancing. 
    Total Value: ${status.totalValueVnd.toLocaleString()} VND.
    Assets: ${status.assets.map(a => `${a.type}: ${a.currentPercentage.toFixed(2)}% (Current Value: ${a.currentValue.toLocaleString()} VND)`).join(', ')}.
    Target: 33.33% each. 
    Balance threshold: +/- 5%.
    Identify which assets need to be bought or sold to return to an equal 1/3 split. 
    Keep the advice concise and actionable for a professional investor in Vietnam.
    Lưu ý hãy trả lời bằng tiêng việt
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text || "No advice available at this time.";
};
