import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://quizapp-production-6f2c.up.railway.app/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Variable para cachear el token CSRF
let csrfTokenCache = null;
let csrfTokenPromise = null;

/**
 * Obtiene el token CSRF del servidor
 * Usa un sistema de cache para evitar múltiples peticiones simultáneas
 */
const getCsrfToken = async (forceRefresh = false) => {
  // Si ya hay una petición en curso, esperar a que termine
  if (csrfTokenPromise && !forceRefresh) {
    return csrfTokenPromise;
  }

  // Si tenemos token en cache y no forzamos refresh, devolverlo
  if (csrfTokenCache && !forceRefresh) {
    return csrfTokenCache;
  }

  // Crear nueva petición para obtener token
  csrfTokenPromise = axios
    .get(`${API_BASE_URL}csrf/`, {
      withCredentials: true,
    })
    .then((response) => {
      csrfTokenCache = response.data.csrfToken;
      csrfTokenPromise = null;
      console.log("✅ CSRF token obtenido correctamente");
      return csrfTokenCache;
    })
    .catch((error) => {
      csrfTokenPromise = null;
      console.error("❌ Error obteniendo CSRF token:", error);
      console.error("   Status:", error.response?.status);
      console.error("   Message:", error.response?.data);
      throw error;
    });

  return csrfTokenPromise;
};

// Interceptor de REQUEST: Agrega el token CSRF automáticamente
api.interceptors.request.use(
  async (config) => {
    // Solo agregar token a métodos que lo requieren
    const methodsRequiringCsrf = ["post", "put", "patch", "delete"];
    
    if (methodsRequiringCsrf.includes(config.method?.toLowerCase())) {
      try {
        // Obtener token (usa cache si está disponible)
        const token = await getCsrfToken();
        
        // Agregar token al header
        config.headers["X-CSRFToken"] = token;
        console.log("✅ Token CSRF agregado a petición", config.method?.toUpperCase(), config.url);
      } catch (error) {
        console.error("❌ No se pudo obtener token CSRF para", config.method?.toUpperCase(), config.url);
        console.error("   Error:", error.message);
        // Continuar sin token - el servidor rechazará si es necesario
        // Pero esto causará un 403 que será manejado por el interceptor de respuesta
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de RESPONSE: Maneja errores 403 (CSRF) automáticamente
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, limpiar cualquier error previo
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si es error 403 y parece ser CSRF, intentar refrescar token
    if (
      error.response?.status === 403 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.warn("⚠️ Error 403 detectado, intentando refrescar token CSRF...");

      try {
        // Forzar refresh del token CSRF
        const newToken = await getCsrfToken(true);
        console.log("✅ Nuevo token CSRF obtenido, reintentando petición...");

        // Reintentar la petición original con el nuevo token
        originalRequest.headers["X-CSRFToken"] = newToken;

        return api(originalRequest);
      } catch (retryError) {
        // Si falla al obtener nuevo token, rechazar el error original
        console.error("❌ Error al refrescar token CSRF:", retryError);
        console.error("   Petición original:", originalRequest.method, originalRequest.url);
        return Promise.reject(error);
      }
    }

    // Para otros errores, rechazar normalmente
    return Promise.reject(error);
  }
);

export default api;
