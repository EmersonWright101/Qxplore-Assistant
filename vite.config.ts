import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";


const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [vue()],

  worker: {
    format: 'es' as const,
  },

  // Required so ONNX Runtime WASM files load correctly in dev and prod
  optimizeDeps: {
    exclude: ['@huggingface/transformers'],
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // Heavy AI/ML libs — only loaded when RemoveBg is opened
          if (id.includes('@huggingface/transformers') || id.includes('@imgly/background-removal')) {
            return 'vendor-ai'
          }
          // PDF processing — only loaded when relevant pages open
          if (id.includes('pdfjs-dist')) {
            return 'vendor-pdf'
          }
          // LaTeX rendering
          if (id.includes('katex')) {
            return 'vendor-katex'
          }
          // QR code
          if (id.includes('qr-code-styling') || id.includes('jsqr')) {
            return 'vendor-qr'
          }
          // Core Vue framework — shared by all pages, load once
          if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router') || id.includes('node_modules/vue-i18n')) {
            return 'vendor-vue'
          }
        },
      },
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
