import React from "react";
import { Link } from "react-router-dom";

const AsignaturaHeader = ({
  asignatura,
  editando,
  loading,
  nuevoTitulo,
  setNuevoTitulo,
  setEditando,
  handleActualizarTitulo,
  handleOpenAsignaturaModal,
}) => {
  return (
    <div className="d-flex justify-content-between align-items-center">
      <Link to="/asignaturas" className="btn i-menu i-orange">
        <i className="bi bi-arrow-left"></i>
        <span className="d-none d-md-inline ms-2">Volver a asignaturas</span>
      </Link>

      <div className="position-absolute start-50 translate-middle-x d-flex align-items-center">
        {editando ? (
          <input
            type="text"
            className="form-control text-center fw-bold"
            value={nuevoTitulo}
            onChange={(e) => setNuevoTitulo(e.target.value)}
            style={{ maxWidth: "400px" }}
          />
        ) : (
          <h2 className="text-center mb-0">
            {asignatura ? asignatura.nombre : ""}
          </h2>
        )}

        <button
          className="btn i-menu i-orange ms-2"
          onClick={
            editando ? handleActualizarTitulo : () => setEditando(true)
          }
          disabled={loading}
        >
          {asignatura ? (
            editando ? (
              loading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              : <i className="bi bi-check-lg"></i>
            ) : (
              <i className="bi bi-pencil-square"></i>
            )
          ) : (
            ""
          )}
        </button>
      </div>

      <i
        className="bi bi-trash3-fill i-orange px-3 i-menu btn"
        style={{ cursor: "pointer", fontSize: "1.2rem" }}
        onClick={(e) => {
          e.stopPropagation();
          handleOpenAsignaturaModal(asignatura);
        }}
      ></i>
    </div>
  );
};

export default AsignaturaHeader;
