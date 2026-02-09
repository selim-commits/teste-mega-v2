import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import type { PluginOption } from 'vite'

const isAnalyze = process.env.ANALYZE === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    isAnalyze &&
      (visualizer({
        open: true,
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
      }) as PluginOption),
  ],
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        embed: resolve(__dirname, 'src/embed/index.html'),
        'embed-chat': resolve(__dirname, 'src/embed-chat/index.html'),
        'embed-packs': resolve(__dirname, 'src/embed-packs/index.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name.startsWith('embed')) {
            return `${chunkInfo.name}/[name].[hash].js`
          }
          return 'assets/[name].[hash].js'
        },
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-motion': ['framer-motion'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-zustand': ['zustand'],
        },
      },
    },
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
})
