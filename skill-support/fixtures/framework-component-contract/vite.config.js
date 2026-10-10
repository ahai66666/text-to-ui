import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";

const localPath = (relativePath) => fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [react(), vue()],
  server: {
    fs: {
      allow: [localPath("../..")]
    }
  },
  build: {
    modulePreload: {
      polyfill: false
    },
    rollupOptions: {
      input: {
        preview: localPath("./preview.html"),
        react: localPath("./runtime/react.html"),
        vue: localPath("./runtime/vue.html"),
        html: localPath("./html/primary-action.html"),
        buttonGallery: localPath("./html/button-gallery.html"),
        catalogModule: localPath("./html/catalog-module.html"),
        playground: localPath("./html/component-playground.html")
      }
    }
  }
});
