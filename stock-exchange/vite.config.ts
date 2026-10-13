import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

function fixEnvDefinesPlugin(): Plugin {
  return {
    name: 'vite-plugin-fix-env-defines',
    transform(code, id) {
      if (id.includes('env.mjs')) {
        return {
          code: code.replace(/__DEFINES__/g, '{}'),
          map: null,
        }
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  define: {
    __DEFINES__: {},
    'process.env': {},
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  plugins: [
    fixEnvDefinesPlugin(),
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 14033,
    headers: {
      'Cache-Control': 'no-store',
    },
    proxy: {
      '/api': {
        target: 'https://stock-exchange.runasp.net',
        changeOrigin: true,
        secure: false,
        headers: {
          'X-Forwarded-Proto': 'https',
        },
      },
      '/files': {
        target: 'https://stock-exchange.runasp.net',
        changeOrigin: true,
        secure: false,
        headers: {
          'X-Forwarded-Proto': 'https',
        },
      },
      '/pages': {
        target: 'https://stock-exchange.runasp.net',
        changeOrigin: true,
        secure: false,
        headers: {
          'X-Forwarded-Proto': 'https',
        },
      },
    },
  },
})
