import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://quizapp-production-6f2c.up.railway.app/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  // Ya no necesitamos withCredentials porque usamos Token Authentication
});

/**
 * Obtiene el token de autenticación desde localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem("auth_token");
};

/**
 * Guarda el token de autenticación en localStorage
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
};

// Interceptor de REQUEST: Agrega el token de autenticación automáticamente
api.interceptors.request.use(
  (config) => {
    // Obtener token de autenticación
    const token = getAuthToken();
    
    if (token) {
      // Agregar token al header Authorization
      config.headers["Authorization"] = `Token ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de RESPONSE: Maneja errores de autenticación
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Si es error 401 (No autenticado), limpiar token
    if (error.response?.status === 401) {
      console.warn("⚠️ Error 401 - Token inválido o expirado, limpiando token...");
      setAuthToken(null);
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("username");
      
      // Opcional: redirigir al login
      // window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
