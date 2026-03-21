import { defineConfig } from 'vite';

export default defineConfig({
  // Tauri requires relative paths for file:// protocol
  base: './',
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
  },
  clearScreen: false,
});
