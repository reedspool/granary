import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [],
  server: {
    open: "pages/index.html",
  },
  build: {
    rolldownOptions: {
      input: {
        index: resolve(__dirname, "pages/index.html"),
        kitchensink: resolve(__dirname, "pages/kitchensink/index.html"),
      },
    },
  },
});
