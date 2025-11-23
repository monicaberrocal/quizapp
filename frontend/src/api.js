import axios from "axios";

const getApiBaseUrl = () => {
  // 1. Si hay variable de entorno, usarla (para desarrollo local o si funciona)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2. Detectar automáticamente según el dominio actual
  const hostname = window.location.hostname;
  
  // Si es staging
  if (hostname.includes('staging') || hostname.includes('react-staging')) {
    return 'https://quizapp-staging.up.railway.app/api/';
  }
  
  // Si es producción (gemastudies.up.railway.app)
  if (hostname.includes('gemastudies') || hostname.includes('production')) {
    return 'https://quizapp-production-6f2c.up.railway.app/api/';
  }
  
  // Por defecto, producción (para desarrollo local)
  return 'https://quizapp-production-6f2c.up.railway.app/api/';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
