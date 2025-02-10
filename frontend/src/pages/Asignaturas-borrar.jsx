import React, { useEffect, useState } from "react";
import api from "../api";

const Asignaturas = () => {
  const [asignaturas, setAsignaturas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [asignaturaAEliminar, setAsignaturaAEliminar] = useState(null);

  useEffect(() => {
    fetchAsignaturas();
    fetchCsrfToken();
  }, []);

  const fetchAsignaturas = async () => {
    try {
      const response = await api.get("asignaturas/", { withCredentials: true });
      setAsignaturas(response.data);
    } catch (error) {
      setError("Error al cargar asignaturas.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCsrfToken = async () => {
    try {
      const response = await api.get("csrf/", { withCredentials: true });
      setCsrfToken(response.data.csrfToken);
    } catch (error) {
      console.error("❌ Error obteniendo CSRF Token", error);
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post(
        `asignaturas/`,
        { nombre },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );

      setAsignaturas([...asignaturas, response.data]);
      setNombre("");
    } catch (error) {
      console.error("Error al crear asignatura:", error.response?.data);
      setError("Error al crear la asignatura.");
    }
  };

  const handleDeleteClick = (asignatura) => {
    setAsignaturaAEliminar(asignatura);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!asignaturaAEliminar) return;

    try {
      await api.delete(`asignaturas/${asignaturaAEliminar.id}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
        withCredentials: true,
      });

      setAsignaturas(asignaturas.filter(asignatura => asignatura.id !== asignaturaAEliminar.id));
      setShowModal(false);
      setAsignaturaAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar asignatura:", error.response?.data);
      setError("Error al eliminar la asignatura.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center">Mis Asignaturas</h2>

      {error && <p className="alert alert-danger text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Crear asignatura..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">Agregar</button>
        </div>
      </form>

      {loading ? (
        <p className="text-center">Cargando asignaturas...</p>
      ) : (
        <ul className="list-group">
          {asignaturas.map((asignatura) => (
            <li key={asignatura.id} className="list-group-item d-flex justify-content-between align-items-center">
              {asignatura.nombre}
              <button className="btn btn-sm" onClick={() => handleDeleteClick(asignatura)}><i className="bi bi-trash3-fill i-orange"></i></button>
            </li>
          ))}
        </ul>
      )}

      {showModal && asignaturaAEliminar && (
        <div className="modal-backdrop">
          <div className="custom-modal">
            <div className="modal-content shadow-lg p-4 rounded">
              <h5 className="modal-title text-center mb-3">Confirmar Eliminación</h5>
              <p className="text-center">
                ¿Estás seguro de que quieres eliminar la asignatura <strong>{asignaturaAEliminar.nombre}</strong>?
              </p>
              <div className="d-flex justify-content-center gap-3 mt-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asignaturas;
