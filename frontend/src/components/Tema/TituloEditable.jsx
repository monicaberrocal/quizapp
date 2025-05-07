import React from "react";
import { Link } from "react-router-dom";

const TituloEditable = ({
  tema,
  editando,
  setEditando,
  nuevoTitulo,
  setNuevoTitulo,
  handleActualizarTitulo,
  loading,
  handleOpenTemaModal,
}) => {
  return (
    <div className="position-relative d-flex align-items-center justify-content-between">
      {loading ? (
        <button className="btn i-menu i-orange d-flex align-items-center" disabled>
          <i className="bi bi-arrow-left"></i>
          <span className="d-none d-md-inline ms-2">Cargando...</span>
        </button>
      ) : (
        <Link
          to={`/asignaturas/${tema.asignatura_id}`}
          className="btn i-menu i-orange d-flex align-items-center"
        >
          <i className="bi bi-arrow-left"></i>
          <span className="d-none d-md-inline ms-2">
            Volver a {tema?.asignatura_nombre}
          </span>
        </Link>
      )}

      <div className="position-absolute start-50 translate-middle-x d-flex align-items-center">
        {editando ? (
          <input
            type="text"
            className="form-control text-center fw-bold"
            value={nuevoTitulo}
            onChange={(e) => setNuevoTitulo(e.target.value)}
            style={{ maxWidth: "600px" }}
          />
        ) : (
          <h2 className="mb-0 text-center">{tema?.nombre}</h2>
        )}

        <button
          className="btn i-menu i-orange ms-2"
          onClick={editando ? handleActualizarTitulo : () => setEditando(true)}
        >
          {editando ? <i className="bi bi-check-lg"></i> : <i className="bi bi-pencil-square"></i>}
        </button>
      </div>

      <i
        className="bi bi-trash3-fill i-orange px-3 i-menu btn"
        style={{ cursor: "pointer", fontSize: "1.2rem" }}
        onClick={(e) => {
          e.stopPropagation();
          handleOpenTemaModal(tema);
        }}
      ></i>
    </div>
  );
};

export default TituloEditable;
