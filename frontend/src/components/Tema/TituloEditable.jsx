import React, { useState } from "react";
import { Link } from "react-router-dom";

const TituloEditable = ({ tema, loading, setTema, setError }) => {
  const [editando, setEditando] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState(tema ? tema.nombre : "...");

  const handleActualizarTitulo = async () => {
    try {
      const response = await api.put(
        `/temas/${tema.id}/`,
        { nombre: nuevoTitulo },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );
      setTema({ ...tema, nombre: response.data.nombre });
      setEditando(false);
    } catch (error) {
      setError("Error al actualizar el título del tema.");
    }
  };

  return (
    <div className="position-relative d-flex align-items-center justify-content-between">
      {/* 📌 Botón para regresar a la asignatura (pegado a la izquierda) */}
      {loading ? (
        <button
          className="btn i-menu i-orange d-flex align-items-center"
          disabled
        >
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
            Volver a {tema ? tema.asignatura_nombre : ""}
          </span>
        </Link>
      )}

      {/* 📌 Contenedor central con título e icono de editar (centrado absolutamente) */}
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
          <h2 className="mb-0 text-center">{tema ? tema.nombre : ""}</h2>
        )}

        <button
          className="btn i-menu i-orange ms-2"
          onClick={editando ? handleActualizarTitulo : () => setEditando(true)}
        >
          {editando ? (
            <i className="bi bi-check-lg"></i>
          ) : (
            <i className="bi bi-pencil-square"></i>
          )}
        </button>
      </div>

      {/* 📌 Botón para eliminar el tema (pegado a la derecha) */}
      <button className="btn i-menu i-orange">
        <i className="bi bi-trash3-fill"></i>
      </button>
    </div>
  );
};

export default TituloEditable;
