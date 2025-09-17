import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  appType:'spa',
  root:'public',
  plugins: [react()],
  base: '/animaciongnomitosmetrics/',
  build:{
    outDir: 'dist',
  },
  server: {
    host: '0.0.0.0', // Permite acceder desde tu IP local (192.168.1.4, etc.)
    port: 5173,      // Puerto del frontend (opcional, Vite usa 5173 por defecto)
    proxy: {
      '/api': {
        target: 'https://animaciongnomitosmetrics.onrender.com', // Tu backend
        changeOrigin: true,              // Importante para que funcione bien
        secure: false,                   // Para desarrollo (no requiere HTTPS)
        rewrite: path => path.replace(/^\/api/, '/api') // Opcional, pero recomendado
      }
    }
  },
  define: {
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID),
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL),
  },
});