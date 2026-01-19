import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        embed: resolve(__dirname, 'src/embed/index.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'embed'
            ? 'embed/[name].[hash].js'
            : 'assets/[name].[hash].js'
        },
      },
    },
  },
})
