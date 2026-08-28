import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { PUBLIC_APP_URL } from "./site.config.mjs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "inject-public-app-url",
      transformIndexHtml(html) {
        return html.replaceAll("https://docracy.io", PUBLIC_APP_URL);
      },
    },
  ],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8787",
    },
  },
});
