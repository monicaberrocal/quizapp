import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password2: "",
  });

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
      await api.post(`registro/`, formData);
      navigate("/register-success", { state: { email: formData.email } });
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      } else {
        setMessage("Error en el registro. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="card shadow-lg p-4 rounded" style={{ maxWidth: "500px", width: "100%" }}>
        <h2 className="text-center h1 mb-3">Crear Cuenta</h2>
        {message && <p className="alert alert-info text-center">{message}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold">Nombre de usuario</label>
            <input type="text" name="username" className="form-control" value={formData.username} onChange={handleChange} required />
            {errors.username && <p className="text-danger">{errors.username}</p>}
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">Nombre</label>
              <input type="text" name="first_name" className="form-control" value={formData.first_name} onChange={handleChange} required />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">Apellido</label>
              <input type="text" name="last_name" className="form-control" value={formData.last_name} onChange={handleChange} required />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Correo electrónico</label>
            <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
            {errors.email && <p className="text-danger">{errors.email}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Contraseña</label>
            <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required />
            {errors.password && (
              <div className="text-danger">
                {Array.isArray(errors.password) ? errors.password.map((err, index) => <p key={index}>{err}</p>) : <p>{errors.password}</p>}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Confirmar Contraseña</label>
            <input type="password" name="password2" className="form-control" value={formData.password2} onChange={handleChange} required />
            {errors.password2 && errors.password2.map((err, index) => <p key={index} className="text-danger">{err}</p>)}
          </div>

          {errors.non_field_errors && (
            <div className="text-danger text-center">
              {errors.non_field_errors.map((err, index) => <p key={index}>{err}</p>)}
            </div>
          )}

          <div className="d-grid">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : "Registrarse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
