import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // Optional: visualize bundle size after build
    visualizer({
      filename: 'dist/stats.html',
      open: false, // set to true if you want it to auto-open after build
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  resolve: {
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer',
      process: 'process/browser',
    },
  },

  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },

  build: {
    // 🚀 raise the chunk size warning limit (default = 500 kB)
    chunkSizeWarningLimit: 1500,

    // ⚡ custom chunk splitting to improve caching and load speed
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
          ],
          ui: ['framer-motion', 'lucide-react'],
          utils: ['axios', 'lodash'],
        },
      },
    },
  },
});
