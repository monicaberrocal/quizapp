import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import InputField from "../components/InputField";
import AlertMessage from "../components/AlertMessage";

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

        <AlertMessage message={message} type="info" />

        <form onSubmit={handleSubmit}>
          <InputField
            label="Nombre de usuario"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            className={"mb-3"}
          />

          <div className="row">
            <InputField
            label="Nombre"
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={"col-md-6 mb-3"}
            />
            <InputField
            label="Apellido"
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={"col-md-6 mb-3"}
            />
          </div>

          <InputField
            label="Correo electrónico"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <InputField
            label="Contraseña"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />

          <InputField
            label="Confirmar Contraseña"
            type="password"
            name="password2"
            value={formData.password2}
            onChange={handleChange}
            error={errors.password2}
          />

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
