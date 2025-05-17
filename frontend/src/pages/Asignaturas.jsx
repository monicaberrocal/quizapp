import React, { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import SkeletonAsignatura from "../components/Asignatura/SkeletonAsignatura";

const Temas = () => {
  const [temasPorAsignatura, setTemasPorAsignatura] = useState([]);
  const [nombreAsignatura, setNombreAsignatura] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [creating, setCreating] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

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
      const response = await api.get("/asignaturas/", {
        withCredentials: true,
      });
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
    setCreating(true);

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
        },
      );

      // 🔹 Agregar la nueva asignatura con una lista vacía de temas
      setTemasPorAsignatura([
        ...temasPorAsignatura,
        { nombre: response.data.nombre, id: response.data.id, temas: [] },
      ]);
      setNombreAsignatura("");
    } catch (error) {
      console.error("Error al crear asignatura:", error.response?.data);
      setError("Error al crear la asignatura.");
    } finally {
      setCreating(false);
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
    setDeleting(true);

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
          temas: asignatura.temas.filter(
            (tema) => tema.id !== temaAEliminar.id,
          ),
        })),
      );
    } catch (error) {
      console.error("Error al eliminar el tema:", error.response?.data);
      setError("Error al eliminar el tema.");
    } finally {
      setShowModal(false);
      setTemaAEliminar(null);
      setDeleting(false);
    }
  };

  const handleDeleteAsignatura = async () => {
    if (!asignaturaAEliminar) return;
    setDeleting(true);

    try {
      await api.delete(`/asignaturas/${asignaturaAEliminar.id}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
        withCredentials: true,
      });

      // 🔹 Eliminar la asignatura de la lista en React
      setTemasPorAsignatura(
        temasPorAsignatura.filter((a) => a.id !== asignaturaAEliminar.id),
      );
    } catch (error) {
      console.error("Error al eliminar la asignatura:", error.response?.data);
      setError("Error al eliminar la asignatura.");
    } finally {
      setShowModal(false);
      setAsignaturaAEliminar(null);
      setDeleting(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center">Mis Asignaturas</h2>

      {error && (
        <AlertMessage message={error} setMessage={setError} type="danger" />
      )}

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
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              "Agregar"
            )}
          </button>
        </div>
      </form>

      {loading ? (
        <>
          {[...Array(5)].map((_, i) => (
            <SkeletonAsignatura key={i} />
          ))}
        </>
      ) : (
        <div className="accordion" id="accordionTemas">
          {temasPorAsignatura.length === 0 ? (
            <p className="text-center">No hay asignaturas disponibles.</p>
          ) : (
            temasPorAsignatura.map((asignatura, index) => (
              <div className="accordion-item" key={index}>
                <h2 className="accordion-header" id={`heading-${index}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapse-${index}`}
                      aria-expanded="false"
                      aria-controls={`collapse-${index}`}
                    >
                      {asignatura.nombre}
                    </button>
                    <div className="d-flex align-items-center">
                      {/* 📌 Botón de Estudiar */}
                      {asignatura.tiene_preguntas ? (
                        <Link
                          to={`/cuestionario/estudiar/asignatura/${asignatura.id}`}
                          className="btn i-menu i-orange"
                          data-toggle="tooltip"
                          data-placement="top"
                          title="Estudiar"
                        >
                          <i className="bi bi-book-half"></i>
                          {/* Estudiar */}
                        </Link>
                      ) : (
                        <span className="btn i-menu i-orange invisible">
                          <i className="bi bi-book-half"></i>
                          {/* Estudiar */}
                        </span>
                      )}

                      {/* 📌 Botón de Repasar */}
                      {asignatura.tiene_fallos ? (
                        <Link
                          to={`/cuestionario/repasar/asignatura/${asignatura.id}`}
                          className="btn i-menu i-orange"
                          title="Repasar preguntas falladas"
                          aria-label="Repasar preguntas falladas"
                          data-bs-toggle="tooltip"
                        >
                          <i className="bi bi-reply-all-fill"></i>
                          {/* Repasar */}
                        </Link>
                      ) : (
                        <span className="btn i-menu i-orange invisible">
                          <i className="bi bi-reply-all-fill"></i>
                          {/* Repasar */}
                        </span>
                      )}

                      {/* 📌 Botón de Ver Asignatura */}
                      <Link
                        to={`/asignaturas/${asignatura.id}`}
                        className="btn i-menu i-orange"
                        title="Ver detalles de la asignatura"
                        aria-label="Ver detalles de la asignatura"
                        data-bs-toggle="tooltip"
                      >
                        <i className="bi bi-eye-fill"></i>
                        {/* Abrir */}
                      </Link>

                      {/* 📌 Botón de Eliminar */}
                      <i
                        className="bi bi-trash3-fill i-orange i-menu btn"
                        style={{ cursor: "pointer", fontSize: "1.2rem" }}
                        title="Eliminar asignatura"
                        aria-label="Eliminar asignatura"
                        data-bs-toggle="tooltip"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAsignaturaModal(asignatura);
                        }}
                      >
                        {/* Eliminar */}
                      </i>
                    </div>
                  </div>
                </h2>
                <div
                  id={`collapse-${index}`}
                  className="accordion-collapse collapse"
                  aria-labelledby={`heading-${index}`}
                  data-bs-parent="#accordionTemas"
                >
                  <div className="accordion-body pr-100">
                    {asignatura.temas.length === 0 ? (
                      <p className="text-muted text-center">
                        No hay temas en esta asignatura.
                      </p>
                    ) : (
                      <ul className="list-group">
                        {asignatura.temas.map((tema) => (
                          <li
                            key={tema.id}
                            className="list-group-item p-0 hover-pink"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <Link
                                to={`/temas/${tema.id}`}
                                className="text-decoration-none text-dark p-2"
                              >
                                {tema.nombre}
                              </Link>
                              <div>
                                {/* 📌 Botón de Estudiar */}
                                {tema.tiene_preguntas ? (
                                  <Link
                                    to={`/cuestionario/estudiar/tema/${tema.id}`}
                                    className="btn i-menu i-orange"
                                    data-toggle="tooltip"
                                    data-placement="top"
                                    title="Estudiar"
                                  >
                                    <i className="bi bi-book-half"></i>
                                    {/* Estudiar */}
                                  </Link>
                                ) : (
                                  <span className="btn i-menu i-orange invisible">
                                    <i className="bi bi-book-half"></i>
                                    {/* Estudiar */}
                                  </span>
                                )}

                                {/* 📌 Botón de Repasar */}
                                {tema.tiene_fallos ? (
                                  <Link
                                    to={`/cuestionario/repasar/tema/${asignatura.id}`}
                                    className="btn i-menu i-orange"
                                    title="Repasar preguntas falladas"
                                    aria-label="Repasar preguntas falladas"
                                    data-bs-toggle="tooltip"
                                  >
                                    <i className="bi bi-reply-all-fill"></i>
                                    {/* Repasar */}
                                  </Link>
                                ) : (
                                  <span className="btn i-menu i-orange invisible">
                                    <i className="bi bi-reply-all-fill"></i>
                                    {/* Repasar */}
                                  </span>
                                )}
                                <i
                                  className="bi bi-trash3-fill i-orange i-menu-sm btn"
                                  style={{
                                    cursor: "pointer",
                                    fontSize: "1.2rem",
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleOpenTemaModal(tema);
                                  }}
                                >
                                  {/* Eliminar */}
                                </i>
                              </div>
                            </div>
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
              <h5 className="modal-title text-center mb-3">
                Confirmar Eliminación
              </h5>
              {temaAEliminar ? (
                <p className="text-center">
                  ¿Estás seguro de que quieres eliminar el tema{" "}
                  <strong>{temaAEliminar.nombre}</strong>?
                </p>
              ) : (
                <p className="text-center">
                  ¿Estás seguro de que quieres eliminar la asignatura{" "}
                  <strong>{asignaturaAEliminar.nombre}</strong>?
                </p>
              )}
              <div className="d-flex justify-content-center gap-3 mt-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={
                    temaAEliminar ? handleDeleteTema : handleDeleteAsignatura
                  }
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Temas;
