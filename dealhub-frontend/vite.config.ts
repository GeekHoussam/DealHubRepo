import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/agreements": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/documents": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/extractions": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/debug": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
