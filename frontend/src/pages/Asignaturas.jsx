import React, { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";

const Temas = () => {
  const [temasPorAsignatura, setTemasPorAsignatura] = useState([]);
  const [nombreAsignatura, setNombreAsignatura] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  // Estado para el modal de eliminación
  const [showModal, setShowModal] = useState(false);
  const [temaAEliminar, setTemaAEliminar] = useState(null);
  const [asignaturaAEliminar, setAsignaturaAEliminar] = useState(null);

  useEffect(() => {
    fetchTemas();
    fetchCsrfToken();
  }, []);

  const fetchTemas = async () => {
    try {
      const response = await api.get("/asignaturas/", { withCredentials: true });
      setTemasPorAsignatura(response.data);
    } catch (error) {
      setError("Error al cargar los temas.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCsrfToken = async () => {
    try {
      const response = await api.get("/csrf/", { withCredentials: true });
      setCsrfToken(response.data.csrfToken);
    } catch (error) {
      console.error("❌ Error obteniendo CSRF Token", error);
    }
  };

  const handleCreateAsignatura = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post(
        "/asignaturas/",
        { nombre: nombreAsignatura },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );

      // 🔹 Agregar la nueva asignatura con una lista vacía de temas
      setTemasPorAsignatura([...temasPorAsignatura, { asignatura: response.data.nombre, id: response.data.id, temas: [] }]);
      setNombreAsignatura("");
    } catch (error) {
      console.error("Error al crear asignatura:", error.response?.data);
      setError("Error al crear la asignatura.");
    }
  };

  const handleOpenTemaModal = (tema) => {
    setTemaAEliminar(tema);
    setShowModal(true);
  };

  const handleOpenAsignaturaModal = (asignatura) => {
    setAsignaturaAEliminar(asignatura);
    setShowModal(true);
  };

  const handleDeleteTema = async () => {
    if (!temaAEliminar) return;

    try {
      await api.delete(`/temas/${temaAEliminar.id}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
        withCredentials: true,
      });

      // 🔹 Eliminar el tema de la lista en React
      setTemasPorAsignatura((prevTemas) =>
        prevTemas.map((asignatura) => ({
          ...asignatura,
          temas: asignatura.temas.filter((tema) => tema.id !== temaAEliminar.id),
        }))
      );
    } catch (error) {
      console.error("Error al eliminar el tema:", error.response?.data);
      setError("Error al eliminar el tema.");
    } finally {
      setShowModal(false);
      setTemaAEliminar(null);
    }
  };

  const handleDeleteAsignatura = async () => {
    if (!asignaturaAEliminar) return;

    try {
      await api.delete(`/asignaturas/${asignaturaAEliminar.id}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
        withCredentials: true,
      });

      // 🔹 Eliminar la asignatura de la lista en React
      setTemasPorAsignatura(temasPorAsignatura.filter(a => a.id !== asignaturaAEliminar.id));
    } catch (error) {
      console.error("Error al eliminar la asignatura:", error.response?.data);
      setError("Error al eliminar la asignatura.");
    } finally {
      setShowModal(false);
      setAsignaturaAEliminar(null);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center">Mis Asignaturas</h2>

      <AlertMessage message={error} type="danger" />

      {/* Formulario para crear una nueva asignatura */}
      <form onSubmit={handleCreateAsignatura} className="mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Crear nueva asignatura..."
            value={nombreAsignatura}
            onChange={(e) => setNombreAsignatura(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">Agregar</button>
        </div>
      </form>

      {loading ? (
        <p className="text-center">Cargando asignaturas y temas...</p>
      ) : (
        <div className="accordion" id="accordionTemas">
          {temasPorAsignatura.length === 0 ? (
            <p className="text-center">No hay asignaturas disponibles.</p>
          ) : (
            temasPorAsignatura.map((asignatura, index) => (
              <div className="accordion-item" key={index}>
                <h2 className="accordion-header" id={`heading-${index}`}>
                  <div className="d-flex justify-content-between align-items-center px-3">
                    <button
                      className="accordion-button collapsed flex-grow-1 text-start"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapse-${index}`}
                      aria-expanded="false"
                      aria-controls={`collapse-${index}`}
                    >
                      {asignatura.asignatura}
                    </button>
                    <i
                      className="bi bi-trash3-fill i-orange"
                      style={{ cursor: "pointer", fontSize: "1.2rem" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAsignaturaModal(asignatura);
                      }}
                    ></i>
                  </div>
                </h2>
                <div
                  id={`collapse-${index}`}
                  className="accordion-collapse collapse"
                  aria-labelledby={`heading-${index}`}
                  data-bs-parent="#accordionTemas"
                >
                  <div className="accordion-body">
                    {asignatura.temas.length === 0 ? (
                      <p className="text-muted text-center">No hay temas en esta asignatura.</p>
                    ) : (
                      <ul className="list-group">
                        {asignatura.temas.map((tema) => (
                          <li key={tema.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <Link to={`/temas/${tema.id}`} className="text-decoration-none">
                              {tema.nombre}
                            </Link>
                            <i
                              className="bi bi-trash3-fill i-orange"
                              style={{ cursor: "pointer", fontSize: "1.2rem" }}
                              onClick={() => handleOpenTemaModal(tema)}
                            ></i>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Confirmación */}
      {showModal && (temaAEliminar || asignaturaAEliminar) && (
        <div className="modal-backdrop">
          <div className="custom-modal">
            <div className="modal-content shadow-lg p-4 rounded">
              <h5 className="modal-title text-center mb-3">Confirmar Eliminación</h5>
              {temaAEliminar ? (
                <p className="text-center">
                  ¿Estás seguro de que quieres eliminar el tema <strong>{temaAEliminar.nombre}</strong>?
                </p>
              ) : (
                <p className="text-center">
                  ¿Estás seguro de que quieres eliminar la asignatura <strong>{asignaturaAEliminar.asignatura}</strong>?
                </p>
              )}
              <div className="d-flex justify-content-center gap-3 mt-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-danger" onClick={temaAEliminar ? handleDeleteTema : handleDeleteAsignatura}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Temas;
