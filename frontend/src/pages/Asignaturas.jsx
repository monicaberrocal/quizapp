import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;  // 🔹 Acceder a la URL de la API
const NOMBRE_APP = import.meta.env.NOMBRE_APP;  // 🔹 Acceder a la constante definida en vite.config.js


const Asignaturas = () => {
  const [asignaturas, setAsignaturas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [asignaturaAEliminar, setAsignaturaAEliminar] = useState(null);

  useEffect(() => {
    console.log("API Base URL:", API_BASE_URL);
    console.log("Nombre de la App:", NOMBRE_APP);
  }, []);

  const fetchAsignaturas = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}asignaturas/`, { withCredentials: true });
      setAsignaturas(response.data);
    } catch (error) {
      setError("Error al cargar asignaturas.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCsrfToken = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}csrf/`, { withCredentials: true });
      setCsrfToken(response.data.csrfToken);
    } catch (error) {
      console.error("Error obteniendo CSRF Token", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}asignaturas/`,
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
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}asignaturas/${asignaturaAEliminar.id}/`, {
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
            placeholder="Nombre de la asignatura"
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
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(asignatura)}>Eliminar</button>
            </li>
          ))}
        </ul>
      )}

      {/* 🔹 Modal de Confirmación Mejorado con el Nombre de la Asignatura */}
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
