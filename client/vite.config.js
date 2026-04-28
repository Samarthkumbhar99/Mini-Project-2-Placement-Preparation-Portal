import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const configuredApiUrl = env.VITE_API_URL?.trim();
  const proxyTarget =
    configuredApiUrl && configuredApiUrl.startsWith("http")
      ? new URL(configuredApiUrl).origin
      : "http://localhost:5002";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
