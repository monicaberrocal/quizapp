import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

const Logout = () => {
  const { setIsAuthenticated, setUsername } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
        await api.get("logout/");

      // Borrar la sesión en React
      setIsAuthenticated(false);
      setUsername("");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("username");
      localStorage.removeItem("auth_token");

      // 🔹 Redirigir al usuario a la página de inicio
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <button className="nav-item nav-link btn my-btn" onClick={handleLogout}>Cerrar Sesión</button>
  );
};

export default Logout;
