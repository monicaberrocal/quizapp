import axios from "axios";

const getApiBaseUrl = () => {
  // Detectar automáticamente según el dominio actual (prioridad)
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    
    // Si es desarrollo local (localhost o 127.0.0.1)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/';
    }
    
    // Si es staging
    if (hostname.includes('staging') || hostname.includes('react-staging')) {
      return 'https://quizapp-staging.up.railway.app/api/';
    }
    
    // Si es producción (gemastudies.up.railway.app)
    if (hostname.includes('gemastudies') || hostname.includes('production')) {
      return 'https://quizapp-production-6f2c.up.railway.app/api/';
    }
  }
  
  // Si hay variable de entorno y no es el valor por defecto, usarla (para desarrollo local)
  if (import.meta.env.VITE_API_BASE_URL && 
      import.meta.env.VITE_API_BASE_URL !== 'https://quizapp-production-6f2c.up.railway.app/api/') {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Por defecto, producción
  return 'https://quizapp-production-6f2c.up.railway.app/api/';
};

// Crear instancia de axios con interceptor para obtener la URL dinámicamente
const api = axios.create({
  withCredentials: true,
});

// Interceptor para establecer la baseURL dinámicamente en cada request
api.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = getApiBaseUrl();
  }
  return config;
});

export default api;
