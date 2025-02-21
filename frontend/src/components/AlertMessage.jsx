import React from "react";

const AlertMessage = ({ message, setMessage, type = "info" }) => {
  if (!message) return null;

  return (
    <div className={`alert alert-${type} d-flex align-items-center justify-content-between`} role="alert">
      {/* Contenedor para centrar el mensaje */}
      <span className="flex-grow-1 text-center">{message}</span>

      {/* Botón de cierre alineado a la derecha */}
      <button type="button" className="btn-close ms-2" onClick={() => setMessage("")} aria-label="Cerrar"></button>
    </div>
  );
};

export default AlertMessage;
