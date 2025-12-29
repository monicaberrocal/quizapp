import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api";
import { AuthContext } from "../context/AuthContext";
import AlertMessage from "../components/AlertMessage";

const Login = () => {
  const { setIsAuthenticated, setUsername } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrors({});
    setLoading(true);  

    try {
        console.log("🔐 Intentando iniciar sesión...");
        const response = await api.post(`login/`, formData);
        console.log("✅ Login exitoso:", response.data);
    
        // Guardar token de autenticación
        if (response.data.token) {
          setAuthToken(response.data.token);
          console.log("✅ Token guardado en localStorage");
        }
    
        setIsAuthenticated(true);
        setUsername(response.data.username);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("username", response.data.username);
    
        navigate("/");
      } catch (error) {
        console.error("❌ Error en login:", error);
        console.error("   Status:", error.response?.status);
        console.error("   Data:", error.response?.data);
        console.error("   Message:", error.message);
        
        if (error.response) {
          if (error.response.status === 401) {
            setMessage("Nombre de usuario o contraseña incorrectos.");
          } else if (error.response.status === 400) {
            setMessage("Por favor, completa todos los campos.");
          } else if (error.response.status === 403) {
            setMessage(error.response.data.error || "Error de autenticación. Por favor, intenta de nuevo.");
          } else {
            setMessage(error.response.data.error || "Error en el inicio de sesión.");
          }
        } else {
          setMessage("Error en la conexión con el servidor.");
        }
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="container d-flex justify-content-center align-items-center mt-5">
      <div className="card shadow-lg p-4 rounded" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center h1 mb-3">Iniciar Sesión</h2>

        {message && <AlertMessage message={message} setMessage={setMessage} type="danger" />}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold">Nombre de usuario</label>
            <input type="text" name="username" className="form-control" value={formData.username} onChange={handleChange} required />
            {errors.username && <p className="text-danger">{errors.username}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Contraseña</label>
            <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required />
            {errors.password && <p className="text-danger">{errors.password}</p>}
          </div>

          {errors.non_field_errors && (
            <div className="text-danger text-center">
              {errors.non_field_errors.map((err, index) => <p key={index}>{err}</p>)}
            </div>
          )}

          <div className="d-grid">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : "Iniciar Sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
