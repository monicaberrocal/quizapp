import React from "react";

const ExportModal = ({ setShowExportModal, exportFormat, setExportFormat, handleExportarTema, isProcessing }) => {
  return (
    <div className="modal-backdrop fade-in">
      <div className="custom-modal">
        <div className="modal-content shadow-lg p-4 rounded animate-modal">
          <button className="close-button" onClick={() => setShowExportModal(false)}>×</button>
          <h4 className="modal-title text-center mb-3">Exportar Tema</h4>

          {isProcessing ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2">Generando archivo...</p>
            </div>
          ) : (
            <>
              <p className="text-center text-muted">Selecciona el formato de exportación:</p>
              <div className="d-flex justify-content-center gap-3 mb-4">
                <button className={`btn ${exportFormat === "json" ? "btn-primary active" : "btn-outline-primary"}`} onClick={() => setExportFormat("json")}>JSON</button>
                <button className={`btn ${exportFormat === "excel" ? "btn-primary active" : "btn-outline-primary"}`} onClick={() => setExportFormat("excel")}>Excel</button>
              </div>

              <div className="d-flex justify-content-center gap-3">
                <button className="btn btn-success w-50" onClick={handleExportarTema}>Descargar</button>
                <button className="btn btn-outline-secondary w-50" onClick={() => setShowExportModal(false)}>Cancelar</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
