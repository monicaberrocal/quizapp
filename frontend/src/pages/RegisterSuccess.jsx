import React from "react";
import { useLocation } from "react-router-dom";

const RegisterSuccess = () => {
  const location = useLocation();
  const email = location.state?.email || "tu correo";

  return (
    <div className="container mt-5 text-center">
      <div className="card shadow-lg p-4 rounded">
        <h2 className="mb-3">¡Registro Exitoso! 🎉</h2>
        <p className="fs-5">Hemos enviado un correo de confirmación a <strong>{email}</strong>.</p>
        <p className="fs-6 text-muted">Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.</p>
      </div>
    </div>
  );
};

export default RegisterSuccess;
