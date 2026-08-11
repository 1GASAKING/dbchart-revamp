import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr({ svgrOptions: { exportType: 'named' } })],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../src/shared', import.meta.url)),
      '@lib': fileURLToPath(new URL('../lib', import.meta.url)),
    },
  },
   build: {
    outDir: "build",
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
    chunkSizeWarningLimit: 100000,
  },
  server: {
    port: 5174,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      host: "localhost",
      protocol: "ws",
      clientPort: 5174,
    },
    cors: {
      origin: "*",
      methods: "*",
      allowedHeaders: "*",
    },
  },
})



