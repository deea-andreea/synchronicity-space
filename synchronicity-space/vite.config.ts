import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

const serverConfig = isProduction
  ? {
      host: true,
    }
  : {
      host: '0.0.0.0',
      port: 5173,
      https: {
        key: fs.readFileSync(path.resolve(__dirname, '../synchronicity-space-backend/key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, '../synchronicity-space-backend/cert.pem')),
      },
    };

export default defineConfig({
  plugins: [react()],
  server: serverConfig,
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    exclude: [
      "tests/**", 
      "node_modules/**"
    ],
  },
});