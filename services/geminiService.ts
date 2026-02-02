
import { GoogleGenAI, Type } from "@google/genai";
import { MarketPrices, PortfolioStatus, AssetType } from "../types";
import { GEMINI_API_KEY } from "../config";

// Khởi tạo AI sử dụng key từ file config
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const fetchMarketPrices = async (): Promise<MarketPrices> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Lấy giá vàng DOJI SJC hiện tại (VND/lượng) và tỷ giá USDT/VND trên Binance P2P tại Việt Nam. Chỉ trả về các con số.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gold_price_vnd: { type: Type.NUMBER, description: "Giá vàng DOJI SJC mỗi lượng bằng VND" },
            usdt_price_vnd: { type: Type.NUMBER, description: "Giá USDT bằng VND" }
          },
          required: ["gold_price_vnd", "usdt_price_vnd"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      gold_price_vnd: data.gold_price_vnd || 80000000,
      usdt_price_vnd: data.usdt_price_vnd || 25400,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching market prices:", error);
    return {
      gold_price_vnd: 82500000,
      usdt_price_vnd: 25450,
      timestamp: new Date().toISOString()
    };
  }
};

export const getRebalanceAdvice = async (status: PortfolioStatus): Promise<string> => {
  const prompt = `
    Phân tích danh mục tài chính này để cân bằng lại.
    Tổng giá trị: ${status.totalValueVnd.toLocaleString()} VND.
    Tài sản: ${status.assets.map(a => `${a.type}: ${a.currentPercentage.toFixed(2)}% (Giá trị: ${a.currentValue.toLocaleString()} VND)`).join(', ')}.
    Mục tiêu: 33.33% cho mỗi loại.
    Ngưỡng cân bằng: +/- 5%.
    Xác định tài sản nào cần mua hoặc bán để đưa về tỷ lệ 1/3 đều nhau.
    Đưa ra lời khuyên ngắn gọn cần mua gì, mua bao nhiêu để cân bằng lại danh mục, súc tích bằng tiếng Việt cho nhà đầu tư chuyên nghiệp.
    
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text || "Hiện tại không có lời khuyên nào.";
};
