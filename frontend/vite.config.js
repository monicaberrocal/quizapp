import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 🔹 Cargar variables de entorno correctamente
  // loadEnv carga primero .env.local, luego .env, luego .env.[mode]
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Permitir acceso desde la red local
      port: 5173,
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || "https://quizapp-production-6f2c.up.railway.app/api/"
      ),
      'import.meta.env.NOMBRE_APP': JSON.stringify("QuizApp"),
    },
  };
});
