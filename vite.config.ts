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
      },
    },
  },
})
