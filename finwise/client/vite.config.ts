import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// The modern ES Module way to get the current directory
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The path is simpler now because this config file is inside the 'client' folder.
      // It points from the current directory ('client') into its 'src' subfolder.
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // This part is correct. It forwards any /api requests to your backend server.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
