import { createContext, useEffect, useState } from "react";
import api from "../api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );
  const [username, setUsername] = useState(localStorage.getItem("username") || "");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🔍 Verificando estado de autenticación...");
        const response = await api.get("auth/status/", { withCredentials: true });
        console.log("✅ Respuesta auth/status:", response.data);
        
        setIsAuthenticated(response.data.authenticated);
        setUsername(response.data.username || "");
        localStorage.setItem("isAuthenticated", response.data.authenticated);
        localStorage.setItem("username", response.data.username || "");
        
        if (!response.data.authenticated) {
          console.warn("⚠️ Usuario no autenticado según el servidor");
        }
      } catch (error) {
        console.error("❌ Error verificando autenticación:", error);
        console.error("   Status:", error.response?.status);
        console.error("   Data:", error.response?.data);
        setIsAuthenticated(false);
        setUsername("");
        localStorage.setItem("isAuthenticated", "false");
        localStorage.setItem("username", "");
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, username, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;