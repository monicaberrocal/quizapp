import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const ActivateAccount = () => {
  const { token } = useParams();
  const { setIsAuthenticated, setUsername } = useContext(AuthContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activateAccount = async () => {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}activar/${token}/`, {}, { withCredentials: true });

        setMessage(response.data.message);
        setIsAuthenticated(true);
        setUsername(response.data.username); // 🔹 Guardamos el nombre del usuario
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("username", response.data.username);

        // 🔹 Redirigir a /homepage después de 3 segundos si la activación es exitosa
        setTimeout(() => navigate("/"), 3000);

      } catch (error) {
        setMessage(error.response?.data?.error || "Error al activar la cuenta.");
      } finally {
        setLoading(false);
      }
    };

    activateAccount();
  }, [token, navigate, setIsAuthenticated, setUsername]);

  return (
    <div className="container text-center mt-5">
      {loading ? (
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Activando cuenta...</span>
        </div>
      ) : (
        <div className="card shadow-lg p-4 rounded">
          <h2>{message}</h2>
          {message === "Cuenta activada correctamente." && (
            <>
              <p>¡Tu cuenta ha sido activada y ya has iniciado sesión! 🎉</p>
              <p>Serás redirigido a la página de inicio en breve...</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivateAccount;
