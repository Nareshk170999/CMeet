import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use a relative base so the built assets load correctly when the app is
  // hosted from a subpath (e.g. GitHub Pages or nested deployments).
  base: './',
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
