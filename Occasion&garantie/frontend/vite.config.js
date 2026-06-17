import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5009,
    proxy: {
      '/api': 'http://localhost:5002',
      '/uploads': 'http://localhost:5002'
    }
  }
});
