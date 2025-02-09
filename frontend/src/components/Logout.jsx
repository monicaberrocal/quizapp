import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const Logout = () => {
  const { setIsAuthenticated, setUsername } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
        await axios.get(`${import.meta.env.VITE_API_BASE_URL}logout/`, { withCredentials: true });

      // 🔹 Borrar la sesión en React
      setIsAuthenticated(false);
      setUsername("");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("username");

      // 🔹 Redirigir al usuario a la página de inicio
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <button className="btn my-btn" onClick={handleLogout}>Cerrar Sesión</button>
  );
};

export default Logout;
