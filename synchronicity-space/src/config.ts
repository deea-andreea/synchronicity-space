// Detect if running live in production
const isProduction = import.meta.env.MODE === 'production' || window.location.hostname.includes('vercel.app');

export const API_BASE_URL = isProduction
  ? 'https://synchronicity-space.onrender.com' // 🚀 Exactly your Render URL
  : `https://172.20.10.3:3000`;                // Your local mobile-testing URL