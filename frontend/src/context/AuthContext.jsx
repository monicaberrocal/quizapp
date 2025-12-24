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
        const response = await api.get("auth/status/");
        
        setIsAuthenticated(response.data.authenticated);
        setUsername(response.data.username || "");
        localStorage.setItem("isAuthenticated", response.data.authenticated);
        localStorage.setItem("username", response.data.username || "");
      } catch (error) {
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