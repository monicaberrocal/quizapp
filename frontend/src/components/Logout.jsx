import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api";
import { AuthContext } from "../context/AuthContext";

const Logout = () => {
  const { setIsAuthenticated, setUsername } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
        await api.get("logout/");

      // 🔹 Borrar token de autenticación
      setAuthToken(null);
      
      // 🔹 Borrar la sesión en React
      setIsAuthenticated(false);
      setUsername("");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("username");
      localStorage.removeItem("auth_token");

      // 🔹 Redirigir al usuario a la página de inicio
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Aún así, limpiar el token localmente
      setAuthToken(null);
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("username");
      localStorage.removeItem("auth_token");
      setIsAuthenticated(false);
      setUsername("");
      navigate("/");
    }
  };

  return (
    <button className="nav-item nav-link btn my-btn" onClick={handleLogout}>Cerrar Sesión</button>
  );
};

export default Logout;
