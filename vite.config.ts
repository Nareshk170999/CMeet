import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use the default base path so both dev and production builds serve from the
  // site root without requiring a subdirectory prefix.
  base: '/',
  build: {
    outDir: 'dist', // Output directory for the build
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps for production build
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    host: true, // Expose to network (useful for testing on mobile/other devices)
  }
});