import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../synchronicity-space-backend/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../synchronicity-space-backend/cert.pem')),
    },
  },
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

export const API_IP = "172.20.10.3"; 
export const API_BASE_URL = `https://${API_IP}:3000`;