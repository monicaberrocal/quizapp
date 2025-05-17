import React from "react";

const LoadingScreen = ({ mensaje = "Cargando..." }) => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "70vh" }}>
      <div className="spinner-border mb-3" role="status" style={{ width: "3rem", height: "3rem", color: "var(--naranja-quemado)" }}>
        <span className="visually-hidden">{mensaje}</span>
      </div>
      <p className="text-muted fw-bold">{mensaje}</p>
    </div>
  );
};

export default LoadingScreen;
