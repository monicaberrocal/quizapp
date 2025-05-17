import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import AlertMessage from "../components/AlertMessage";
import { useNavigate } from "react-router-dom";
import AsignaturaHeader from "../components/Asignatura/AsignaturaHeader";

const AsignaturaDetalle = () => {
  const { asignaturaId } = useParams();
  const [asignatura, setAsignatura] = useState(null);
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoTema, setNuevoTema] = useState(""); // Estado para el nuevo tema
  const [csrfToken, setCsrfToken] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importFormat, setImportFormat] = useState("json");
  const [exportFormat, setExportFormat] = useState("json");
  const [isProcessing, setIsProcessing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [temaAEliminar, setTemaAEliminar] = useState(null);
  const [asignaturaAEliminar, setAsignaturaAEliminar] = useState(null);

  useEffect(() => {
    fetchAsignaturaDetalle();
    fetchCsrfToken();
  }, [asignaturaId]);

  const fetchAsignaturaDetalle = async () => {
    try {
      const response = await api.get(`/asignaturas/${asignaturaId}/`, {
        withCredentials: true,
      });
      setAsignatura(response.data);
      setTemas(response.data.temas);
      setNuevoTitulo(response.data.nombre);
    } catch (error) {
      setError("Error al cargar los detalles de la asignatura.");
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

  const handleActualizarTitulo = async () => {
    setEditing(true)
    try {
      const response = await api.put(
        `/asignaturas/${asignaturaId}/`,
        { nombre: nuevoTitulo },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );
      setAsignatura({ ...asignatura, nombre: response.data.nombre });
      setEditando(false);
    } catch (error) {
      setError("Error al actualizar el título de la asignatura.");
      fetchAsignaturaDetalle();
    } finally {
      setEditing(false)
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

  const navigate = useNavigate();

  const handleDeleteAsignatura = async () => {
    if (!asignaturaAEliminar) return;
    setDeleting(true)

    try {
      await api.delete(`/asignaturas/${asignaturaAEliminar.id}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
        withCredentials: true,
      });

      setShowModal(false);
      setAsignaturaAEliminar(null);
      navigate("/asignaturas");
    } catch (error) {
      console.error("Error al eliminar la asignatura:", error.response?.data);
      setError("Error al eliminar la asignatura.");
      fetchAsignaturaDetalle();
    } finally {
      setDeleting(false)
    }
  };

  const handleDeleteTema = async () => {
    if (!temaAEliminar) return;
    setDeleting(true)
    try {
      await api.delete(`/temas/${temaAEliminar.id}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
        withCredentials: true,
      });
      setTemas((prevTemas) =>
        prevTemas.filter((tema) => tema.id !== (temaAEliminar?.id || ""))
      );
    } catch (error) {
      console.error("Error al eliminar el tema:", error.response?.data);
      setError(error.response?.data?.error || "Error al eliminar el tema.");
    } finally {
      setShowModal(false);
      setTemaAEliminar(null);
      setDeleting(false)
    }
  };

  const handleCreateTema = async (e) => {
    e.preventDefault();
    setCreating(true);  
    if (!nuevoTema.trim()) return;

    try {
      const response = await api.post(
        "/temas/crear/",
        { asignatura_id: asignaturaId, nombre: nuevoTema },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );

      setTemas([...temas, response.data]); // Agregar el nuevo tema a la lista
      setNuevoTema(""); // Limpiar el input después de la creación
    } catch (error) {
      setError("Error al crear el tema.");
      fetchAsignaturaDetalle();
    }finally {
      setCreating(false);
    }
  };

  const handleImportarTema = async (e) => {
    e.preventDefault();
    const archivo = e.target.files[0];
    if (!archivo) return;

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      const response = await api.post(
        `/asignaturas/${asignaturaId}/importar_tema/?formato=${importFormat}`,
        formData,
        {
          headers: {
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );

      setShowImportModal(false);
      fetchAsignaturaDetalle();
    } catch (error) {
      setError("Error al importar el tema.");
      setShowImportModal(false);
      fetchAsignaturaDetalle();
    }
  };

  const handleExportarAsignatura = async (e) => {
    setIsProcessing(true);
    try {
      const response = await api.get(
        `/asignaturas/${asignaturaId}/exportar/?formato=${exportFormat}`,
        {
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
          responseType: "blob",
        }
      );

      let filename =
        asignatura.nombre.replace(/ /g, "_") +
        "_preguntas." +
        (exportFormat === "excel" ? "xlsx" : "json");

      let mimeType = "application/json"; // Por defecto JSON
      if (exportFormat === "excel") {
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (exportFormat === "txt") {
        mimeType = "text/plain";
      }

      // Crear un Blob con los datos descargados
      const blob = new Blob([response.data], { type: mimeType });

      // Crear un enlace de descarga y hacer clic en él
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Limpiar el enlace después de la descarga
      document.body.removeChild(link);

      setIsProcessing(false);
      setShowExportModal(false);
    } catch (error) {
      setError("Error al exportar la asignatura.");
      setShowExportModal(false);
      fetchAsignaturaDetalle();
    }
  };

  return (
    <div className="container mt-5">
      {error && (
        <AlertMessage message={error} setMessage={setError} type="danger" />
      )}
      <AsignaturaHeader
        asignatura={asignatura}
        editando={editando}
        loading={isEditing}
        nuevoTitulo={nuevoTitulo}
        setNuevoTitulo={setNuevoTitulo}
        setEditando={setEditando}
        handleActualizarTitulo={handleActualizarTitulo}
        handleOpenAsignaturaModal={handleOpenAsignaturaModal}
      />

      <hr />

      <div className="d-flex flex-column justify-content-center align-items-center gap-3 mt-3">
        <div className="d-flex justify-content-center align-items-center gap-3">
          {asignatura && asignatura.tiene_preguntas && (
            <Link
              to={`/cuestionario/estudiar/asignatura/${asignatura.id}`}
              className="btn i-menu i-orange w-auto"
            >
              <i className="bi bi-book-half"></i> Estudiar
            </Link>
          )}

          {asignatura && asignatura.tiene_fallos && (
            <Link
              to={`/cuestionario/repasar/asignatura/${asignatura.id}`}
              className="btn i-menu i-orange w-auto"
            >
              <i className="bi bi-reply-all-fill"></i> Repasar
            </Link>
          )}
        </div>

        {asignatura && asignatura.tiene_fallos && (
          <span className="badge bg-warning text-dark">
            {asignatura.numero_fallos} pregunta
            {asignatura.numero_fallos > 1 && "s"}
            &nbsp;con fallos
          </span>
        )}
      </div>

      {/* Formulario para crear un nuevo tema */}
      <form onSubmit={handleCreateTema} className="my-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Crear nuevo tema..."
            value={nuevoTema}
            onChange={(e) => setNuevoTema(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : "Agregar"}
            </button>
        </div>
      </form>
      {loading ? (
        <p className="text-center">Cargando asignatura...</p>
      ) : (
        <>
          {/* Lista de temas */}
          {temas.length === 0 ? (
            <p className="text-muted text-center">
              No hay temas en esta asignatura.
            </p>
          ) : (
            <ul className="list-group">
              {temas.map((tema) => (
                <li key={tema.id} className="list-group-item p-0 hover-pink">
                  <Link
                    to={`/temas/${tema.id}`}
                    className="d-flex justify-content-between align-items-center text-decoration-none text-dark p-2 w-100"
                  >
                    {tema.nombre}
                    <i
                      className="bi bi-trash3-fill i-orange i-menu-sm btn"
                      style={{ cursor: "pointer", fontSize: "1.2rem" }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenTemaModal(tema);
                      }}
                    ></i>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {/* Modal de Importación */}
      {showImportModal && (
        <div className="modal-backdrop fade-in">
          <div className="custom-modal">
            <div className="modal-content shadow-lg p-4 rounded animate-modal">
              <button
                className="close-button"
                onClick={() => setShowImportModal(false)}
              >
                ×
              </button>

              <h4 className="modal-title text-center mb-3">Importar Tema</h4>
              <p className="text-center text-muted">
                Selecciona el formato del archivo:
              </p>

              <div className="d-flex justify-content-center gap-3 mb-4">
                <button
                  className={`btn ${
                    importFormat === "json"
                      ? "btn-primary active"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setImportFormat("json")}
                >
                  JSON
                </button>
                <button
                  className={`btn ${
                    importFormat === "excel"
                      ? "btn-primary active"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setImportFormat("excel")}
                >
                  Excel
                </button>
              </div>

              {/* Input de archivo estilizado */}
              <div className="custom-file-input mb-3">
                <input
                  type="file"
                  accept={importFormat === "json" ? ".json" : ".xlsx"}
                  className="form-control"
                  onChange={handleImportarTema}
                />
              </div>

              <div className="d-flex justify-content-center gap-3">
                <button
                  className="btn btn-outline-secondary w-50"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportación */}
      {showExportModal && (
        <div className="modal-backdrop fade-in">
          <div className="custom-modal">
            <div className="modal-content shadow-lg p-4 rounded animate-modal">
              <button
                className="close-button"
                onClick={() => setShowExportModal(false)}
              >
                ×
              </button>

              <h4 className="modal-title text-center mb-3">
                Exportar Asignatura
              </h4>
              {isProcessing ? (
                // Loader mientras se espera la respuesta
                <div className="text-center">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                  ></div>
                  <p className="mt-2">Generando archivo...</p>
                </div>
              ) : (
                <>
                  <p className="text-center text-muted">
                    Selecciona el formato de exportación:
                  </p>

                  <div className="d-flex justify-content-center gap-3 mb-4">
                    <button
                      className={`btn ${
                        exportFormat === "json"
                          ? "btn-primary active"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => setExportFormat("json")}
                    >
                      JSON
                    </button>
                    <button
                      className={`btn ${
                        exportFormat === "excel"
                          ? "btn-primary active"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => setExportFormat("excel")}
                    >
                      Excel
                    </button>
                  </div>

                  <div className="d-flex justify-content-center gap-3">
                    <button
                      className="btn btn-success w-50"
                      onClick={handleExportarAsignatura}
                    >
                      Descargar
                    </button>
                    <button
                      className="btn btn-outline-secondary w-50"
                      onClick={() => setShowExportModal(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
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
                    {isDeleting ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsignaturaDetalle;
