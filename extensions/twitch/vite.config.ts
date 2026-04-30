import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        config: resolve(root, "config.html"),
        panel: resolve(root, "panel.html"),
      },
    },
  },
  server: { allowedHosts: ["extension.kiriko.tv"] },
});
