import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
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

export const API_IP = "170.20.10.3"; 
export const API_BASE_URL = `http://${API_IP}:3000`;
