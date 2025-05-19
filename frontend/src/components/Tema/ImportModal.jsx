import React from "react";

const ImportModal = ({ setShowImportModal, importFormat, setImportFormat, handleImportarPreguntas }) => {
  return (
    <div className="modal-backdrop fade-in">
      <div className="custom-modal">
        <div className="modal-content shadow-lg p-4 rounded animate-modal">
          <button className="close-button" onClick={() => setShowImportModal(false)}>×</button>
          <h4 className="modal-title text-center mb-3">Importar Preguntas</h4>
          <p className="text-center text-muted">Selecciona el formato del archivo:</p>

          <div className="d-flex justify-content-center gap-3 mb-4">
            <button className={`btn ${importFormat === "json" ? "btn-primary active" : "btn-outline-primary"}`} onClick={() => setImportFormat("json")}>JSON</button>
            <button className={`btn ${importFormat === "excel" ? "btn-primary active" : "btn-outline-primary"}`} onClick={() => setImportFormat("excel")}>Excel</button>
          </div>

          <button className="btn btn-outline-secondary w-50 mt-3" onClick={() => setShowImportModal(false)}>Cancelar</button>
          <input type="file" accept={importFormat === "json" ? ".json" : ".xlsx"} className="form-control" onChange={handleImportarPreguntas} />
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
