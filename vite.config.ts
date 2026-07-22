import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  build: {
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        codeSplitting: true,
        manualChunks(id: string) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@tanstack/react-router") || id.includes("node_modules/@tanstack/react-query") || id.includes("node_modules/@tanstack/router-core") || id.includes("node_modules/@tanstack/history")) {
            return "vendor-tanstack";
          }
          if (id.includes("node_modules/@supabase/")) {
            return "vendor-supabase";
          }
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-") || id.includes("node_modules/victory-")) {
            return "vendor-recharts";
          }
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-lucide";
          }
        },
      },
    },
  },
});
