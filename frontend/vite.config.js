import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 🔹 Cargar variables de entorno correctamente
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || "https://quizapp-production-d9e0.up.railway.app/api/"),
      'import.meta.env.NOMBRE_APP': JSON.stringify("QuizApp"),
    },
  };
});
