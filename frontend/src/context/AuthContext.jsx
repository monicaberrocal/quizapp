import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 🔹 1️⃣ Primero intenta obtener `isAuthenticated` de localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );
  const [username, setUsername] = useState(localStorage.getItem("username") || "");

  useEffect(() => {
    // 🔹 2️⃣ Luego, verifica con Django si el usuario sigue autenticado
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}auth/status/`, {
          withCredentials: true, // Enviar cookies de sesión
        });
        
        setIsAuthenticated(response.data.authenticated); // Actualiza el estado global
        setUsername(response.data.username || "");
        localStorage.setItem("isAuthenticated", response.data.authenticated); // 🔹 Guardar en localStorage
        localStorage.setItem("username", response.data.username || "");
      } catch (error) {
        setIsAuthenticated(false);
        setUsername("");
        localStorage.setItem("isAuthenticated", "false");
        localStorage.setItem("username", "");
      }
    };

    checkAuth();
  }, []); // 🔹 Se ejecuta SOLO al cargar la app

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, username, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;