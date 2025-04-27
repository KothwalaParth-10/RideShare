import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      compression({
        algorithm: 'gzip',
        ext: '.gz'
      }),
      compression({
        algorithm: 'brotliCompress',
        ext: '.br'
      }),
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ],
    optimizeDeps: {
      exclude: ['lucide-react']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'map-vendor': ['leaflet', 'react-leaflet', 'leaflet-routing-machine'],
            'ui-vendor': ['lucide-react']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    server: {
      port: 5173,
      host: true,
      headers: {
        'Cache-Control': 'public, max-age=31536000'
      },
      proxy: {
        '/supabase': {
          target: env.VITE_SUPABASE_URL || 'https://znbbjanyymvpnckmzyhb.supabase.co',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/supabase/, '')
        }
      }
    }
  };
});