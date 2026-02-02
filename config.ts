
import { Config } from './types';

// In a real app, these would come from process.env or a secure vault
// For this SPA, we expect these to be configured or provided via UI placeholders
export const config: Config = {
  supabaseUrl: 'https://evyoqbkdnneiqmamwkll.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2eW9xYmtkbm5laXFtYW13a2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODU1NDQsImV4cCI6MjA4NTU2MTU0NH0.0bFrMYG0dwJdsLeG096u1L18oBh6BaQpQ_J8kcKojUI',
  telegramBotToken: '8459324070:AAE8x2nNGt2c2RVgUCP-F1KcY0SInFOZeqA',
  telegramChatId: '6305931650'
};

export const GEMINI_API_KEY = process.env.API_KEY || 'AIzaSyDhgaqfa_cDWdEpl-nqIGtcdD4YotZgI-Q';
