import React from "react";

const BotonesAccion = ({
  tema,
  setShowImportModal,
  setShowGenerateModal,
  setShowExportModal,
}) => {
  return (
    <div className="d-flex justify-content-center gap-4 mt-4">
      {/* Botón para importar preguntas */}
      <button
        className="btn btn-outline-primary"
        onClick={() => setShowImportModal(true)}
      >
        <i className="bi bi-upload"></i> Importar Preguntas
      </button>

      {/* Botón para generar preguntas */}
      <button
        className="btn btn-outline-primary magic-button"
        onClick={() => setShowGenerateModal(true)}
      >
        <i className="fa-solid fa-wand-magic-sparkles magic-icon"></i> GENERAR
        preguntas para el tema{" "}
        <span className="name-bold-naranja">{tema?.nombre}</span>
      </button>

      {/* Botón para exportar tema (si lo quieres activar) */}
      <button
        className="btn btn-outline-primary"
        onClick={() => setShowExportModal(true)}
      >
        <i className="bi bi-download"></i> Exportar Tema
      </button>
    </div>
  );
};

export default BotonesAccion;
