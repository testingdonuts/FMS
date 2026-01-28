import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation': ['framer-motion'],
          'icons': ['react-icons'],
          'supabase': ['@supabase/supabase-js'],
          // Feature chunks
          'charts': ['recharts'],
        },
        // Asset file naming for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          if (ext === 'css') {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers for smaller bundle
    target: 'es2020'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
    exclude: []
  },
  // Server config for development
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    // Enable compression
    cors: true
  },
  // Preview config
  preview: {
    port: 4173,
    strictPort: false
  }
});