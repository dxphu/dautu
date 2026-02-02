
import { config } from "../config";
import { PortfolioStatus } from "../types";

export const sendTelegramNotification = async (status: PortfolioStatus) => {
  if (!config.telegramBotToken || !config.telegramChatId || config.telegramBotToken === 'your-bot-token') {
    console.warn("Telegram bot token or chat ID not configured.");
    return;
  }

  const date = new Date().toLocaleDateString('vi-VN');
  const message = `
📊 *BÁO CÁO DANH MỤC ZenWealth* (${date})
---------------------------------------
💰 *Tổng tài sản:* ${status.totalValueVnd.toLocaleString()} VND

${status.assets.map(a => {
  const statusEmoji = a.isOutOfBalance ? "⚠️" : "✅";
  return `${statusEmoji} *${a.type}:* ${a.currentPercentage.toFixed(2)}%
   - Giá trị: ${a.currentValue.toLocaleString()} VND
   - Chênh lệch: ${a.deviation > 0 ? '+' : ''}${a.deviation.toFixed(2)}%`;
}).join('\n\n')}

---------------------------------------
🔔 *Thông báo:* ${status.assets.some(a => a.isOutOfBalance) ? 'Cần cân bằng lại danh mục!' : 'Danh mục đang ở trạng thái cân bằng.'}
  `;

  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
  }
};
