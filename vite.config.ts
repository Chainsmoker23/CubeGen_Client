import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // This will load all variables from the relevant .env file.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // The define option allows us to replace global variables at build time.
    // We are creating a process.env object on the client-side that mirrors
    // the VITE_ prefixed variables from our .env file.
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY),
      'process.env.DODO_MODE': JSON.stringify(env.DODO_MODE),
      'process.env.VITE_DODO_PUBLISHABLE_KEY': JSON.stringify(env.VITE_DODO_PUBLISHABLE_KEY),
      'process.env.VITE_DODO_PUBLISHABLE_KEY_TEST': JSON.stringify(env.VITE_DODO_PUBLISHABLE_KEY_TEST),
      'process.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL),
    },
    build: {
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Function-based manual chunks - more reliable than array-based
          manualChunks(id) {
            // React core
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'vendor-react';
            }
            // D3 visualization libs
            if (id.includes('node_modules/d3')) {
              return 'vendor-d3';
            }
            // Animation
            if (id.includes('node_modules/framer-motion')) {
              return 'vendor-motion';
            }
            // Firebase
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'vendor-firebase';
            }
            // Supabase
            if (id.includes('node_modules/@supabase')) {
              return 'vendor-supabase';
            }
            // Payments
            if (id.includes('node_modules/@stripe') || id.includes('node_modules/dodo')) {
              return 'vendor-payments';
            }
          }
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: 'https://cubeapi-production-41a2.up.railway.app',
          changeOrigin: true,
        },
      },
    },
  };
});


