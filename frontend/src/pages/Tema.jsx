import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import AlertMessage from "../components/AlertMessage";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import TituloEditable from "../components/Tema/TituloEditable";
import BotonesAccion from "../components/Tema/BotonesAccion";

const TemaDetalle = () => {
  const MAX_RESPUESTAS = 10;
  const MIN_RESPUESTAS = 2;

  const { temaId } = useParams();
  const [tema, setTema] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaPregunta, setNuevaPregunta] = useState({
    texto: "",
    ayuda: "",
    respuestas: [{ texto: "" }, { texto: "" }, { texto: "" }, { texto: "" }],
  });
  const [csrfToken, setCsrfToken] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [importFormat, setImportFormat] = useState("json");
  const [exportFormat, setExportFormat] = useState("json");
  const [isProcessing, setIsProcessing] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [isEditing, setEditing] = useState(false);

  // Estado para el modal de eliminación
  const [showModal, setShowModal] = useState(false);
  const [temaAEliminar, setTemaAEliminar] = useState(null);
  const [preguntaAEliminar, setPreguntaAEliminar] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [editandoPreguntaId, setEditandoPreguntaId] = useState(null);
  const [preguntaEditada, setPreguntaEditada] = useState(null);

  const [loadingButton, setLoadingButton] = useState(false);
  const [creatingPregunta, setCreatingPregunta] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTema();
    fetchCsrfToken();
  }, [temaId]);

  const fetchTema = async () => {
    try {
      const response = await api.get(`/temas/${temaId}/`, {
        withCredentials: true,
      });
      setTema(response.data.tema);
      setPreguntas(response.data.tema.preguntas);
      setNuevoTitulo(response.data.tema.nombre);
    } catch (error) {
      setError("Error al cargar los detalles del tema.");
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
    setEditing(true);
    try {
      const response = await api.put(
        `/temas/${temaId}/`,
        { nombre: nuevoTitulo },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        },
      );
      setTema({ ...tema, nombre: response.data.nombre });
      setEditando(false);
    } catch (error) {
      setError("Error al actualizar el título del tema.");
    } finally {
      setEditing(false);
    }
  };

  const handleChange = (e) => {
    setNuevaPregunta({ ...nuevaPregunta, [e.target.name]: e.target.value });
  };

  const handleRespuestaChange = (index, value) => {
    const nuevasRespuestas = [...nuevaPregunta.respuestas];
    nuevasRespuestas[index].texto = value;
    setNuevaPregunta({ ...nuevaPregunta, respuestas: nuevasRespuestas });
  };

  const handleCrearPregunta = async (e) => {
    e.preventDefault();
    setCreatingPregunta(true);

    try {
      // 📌 Formatear la estructura de la pregunta antes de enviarla
      const nuevaPreguntaData = {
        texto: nuevaPregunta.texto,
        ayuda: nuevaPregunta.ayuda,
        respuestas: nuevaPregunta.respuestas, // Enviar todas las respuestas
        tema: temaId,
      };

      const response = await api.post("/preguntas/crear/", nuevaPreguntaData, {
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        withCredentials: true,
      });

      setPreguntas([...preguntas, response.data]); // 📌 Agregar la nueva pregunta a la lista

      // 📌 Reiniciar el formulario con solo 2 respuestas vacías
      setNuevaPregunta({
        texto: "",
        ayuda: "",
        respuestas: [
          { texto: "" },
          { texto: "" },
          { texto: "" },
          { texto: "" },
        ],
      });
    } catch (error) {
      setError("Error al crear la pregunta.");
    } finally {
      setCreatingPregunta(false);
    }
  };

  // 📌 Agregar una nueva respuesta (máximo 10)
  const handleAgregarRespuesta = () => {
    if (nuevaPregunta.respuestas.length < MAX_RESPUESTAS) {
      handleChange({
        target: {
          name: "respuestas",
          value: [...nuevaPregunta.respuestas, { texto: "" }],
        },
      });
    }
  };

  const handleAgregarRespuestaEditada = () => {
    if (preguntaEditada.respuestas.length < MAX_RESPUESTAS) {
      setPreguntaEditada({
        ...preguntaEditada,
        respuestas: [...preguntaEditada.respuestas, { texto: "" }],
      });
    }
  };

  const handleOpenTemaModal = (tema) => {
    setTemaAEliminar(tema);
    setShowModal(true);
  };

  const handleOpenPreguntaModal = (asignatura) => {
    setPreguntaAEliminar(asignatura);
    setShowModal(true);
  };

  const handleEliminarRespuesta = (index) => {
    if (nuevaPregunta.respuestas.length > MIN_RESPUESTAS) {
      const nuevasRespuestas = nuevaPregunta.respuestas.filter(
        (_, i) => i !== index,
      );
      handleChange({
        target: {
          name: "respuestas",
          value: nuevasRespuestas,
        },
      });
    }
  };

  const handleDeleteTema = async () => {
    if (!temaAEliminar || !tema) return; // 📌 Asegurar que `tema` está definido
    setDeleting(true);

    try {
      await api.delete(`/temas/${temaAEliminar.id}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
        withCredentials: true,
      });
      // 📌 Asegurar que `asignatura_id` está definido antes de redirigir
      if (tema.asignatura_id) {
        navigate(`/asignaturas/${tema.asignatura_id}`);
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error al eliminar el tema:", error.response?.data);
      setError("Error al eliminar el tema.");
      fetchTema();
    } finally {
      setTemaAEliminar(null);
      setDeleting(false);
    }
  };

  const handleEliminarPregunta = async () => {
    if (!preguntaAEliminar) return;
    setDeleting(true);

    try {
      await api.delete(`/preguntas/${preguntaAEliminar.id}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
        withCredentials: true,
      });

      // 📌 Corregido: Ahora elimina la pregunta correctamente de la lista
      setPreguntas((prevPreguntas) =>
        prevPreguntas.filter(
          (pregunta) => pregunta.id !== preguntaAEliminar.id,
        ),
      );
    } catch (error) {
      console.error("Error al eliminar la pregunta:", error.response?.data);
      setError("Error al eliminar la pregunta.");
      fetchTema();
    } finally {
      setShowModal(false);
      setPreguntaAEliminar(null);
      setDeleting(false);
    }
  };

  const handleCancelarEdicion = () => {
    setEditandoPreguntaId(null);
    setPreguntaEditada(null);
  };

  const handleExportarTema = async () => {
    setIsProcessing(true);
    setLoadingButton(true);
    try {
      const response = await api.get(
        `/temas/${temaId}/descargar/?formato=${exportFormat}`,
        {
          headers: {
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
          responseType: "blob", // 📌 Importante: Recibir la respuesta como un archivo
        },
      );

      let filename =
        tema.asignatura_nombre.replace(/ /g, "_") +
        "_" +
        tema.nombre.replace(/ /g, "_") +
        "_preguntas." +
        (exportFormat === "excel" ? "xlsx" : "json");

      // 📌 Determinar el tipo de archivo dinámicamente
      let mimeType = "application/json"; // Por defecto JSON
      if (exportFormat === "excel") {
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (exportFormat === "txt") {
        mimeType = "text/plain";
      }

      // 📌 Crear un Blob con los datos descargados
      const blob = new Blob([response.data], { type: mimeType });

      // 📌 Crear un enlace de descarga y hacer clic en él
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // 📌 Limpiar el enlace después de la descarga
      document.body.removeChild(link);

      setIsProcessing(false);
      setShowExportModal(false);
    } catch (error) {
      setError("Error al exportar el tema.");
      setIsProcessing(false);
      setShowExportModal(false);
    } finally {
      setLoadingButton(false);
    }
  };

  const handleDescargarPlantilla = () => {
    if (importFormat === "json") {
      // 📌 Generar plantilla JSON
      const plantillaJson = {
        preguntas: [
          {
            texto: "Ejemplo de pregunta",
            ayuda: "Explicación opcional",
            respuestas: [
              { texto: "Respuesta correcta" },
              { texto: "Respuesta incorrecta" },
              { texto: "Otra incorrecta" },
            ],
          },
        ],
      };

      const blob = new Blob([JSON.stringify(plantillaJson, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "plantilla_preguntas.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // 📌 Generar plantilla Excel
      const wb = XLSX.utils.book_new();
      const wsData = [
        [
          "Pregunta",
          "Ayuda",
          "Respuesta Correcta",
          "Respuesta 2",
          "Respuesta 3",
        ], // Encabezados
        [
          "Ejemplo de pregunta",
          "Explicación opcional",
          "Opción A",
          "Opción B",
          "Opción C",
        ], // Ejemplo de datos
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Plantilla");

      XLSX.writeFile(wb, "plantilla_preguntas.xlsx");
    }
  };

  const handleSeleccionarArchivo = (e) => {
    setArchivoSeleccionado(e.target.files[0]); // 📌 Guardar el archivo seleccionado
  };

  const handleGenerarPreguntas = async () => {
    if (!archivoSeleccionado) return;
    setLoadingButton(true);
    const formData = new FormData();
    formData.append("archivo", archivoSeleccionado);

    try {
      const response = await api.post(`/temas/${temaId}/generar/`, formData, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
        withCredentials: true,
      });
      const data = response.data;

      setShowGenerateModal(false);
      setArchivoSeleccionado(null);

      if (!data.success) {
        setError(`${data.message} Te quedan ${data.credits} caracteres.`);
      } else {
        setSuccessMessage(
          "Se están generando las preguntas. Te enviaremos un email cuando el proceso termine.",
        );
      }
      fetchTema();
    } catch (error) {
      setError("Error al importar preguntas.");
      fetchTema();
    } finally {
      setLoadingButton(false);
    }
  };

  const handleImportarPreguntas = async () => {
    if (!archivoSeleccionado) return;
    setLoadingButton(true);

    const formData = new FormData();
    formData.append("archivo", archivoSeleccionado);

    try {
      const response = await api.post(
        `/temas/${temaId}/importar/?formato=${importFormat}`,
        formData,
        {
          headers: {
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        },
      );

      // alert(response.data.message);
      setShowImportModal(false);
      setArchivoSeleccionado(null); // 📌 Resetear el estado
      fetchTema();
    } catch (error) {
      setError("Error al importar preguntas.");
      fetchTema();
    } finally {
      setLoadingButton(false);
    }
  };

  // 📌 Manejar cambios en la pregunta editada
  const handleEditarPreguntaChange = (e) => {
    setPreguntaEditada({ ...preguntaEditada, [e.target.name]: e.target.value });
  };

  // 📌 Manejar cambios en las respuestas editadas
  const handleEditarRespuestaChange = (index, value) => {
    // Copia profunda del array de respuestas
    const nuevasRespuestas = preguntaEditada.respuestas.map((respuesta, i) =>
      i === index ? { ...respuesta, texto: value } : { ...respuesta },
    );

    setPreguntaEditada({ ...preguntaEditada, respuestas: nuevasRespuestas });
  };

  // 📌 Manejar la selección de la respuesta correcta
  const handleSeleccionarRespuestaCorrecta = (e) => {
    setPreguntaEditada({
      ...preguntaEditada,
      respuesta_correcta: parseInt(e.target.value),
    });
  };

  // 📌 Activar el modo edición para una pregunta
  const handleActivarEdicion = (pregunta) => {
    setEditandoPreguntaId(pregunta.id);
    setPreguntaEditada({ ...pregunta });
  };

  // 📌 Guardar la pregunta editada
  const handleGuardarPregunta = async () => {
    if (!preguntaEditada) return;

    // 📌 Buscar la pregunta original antes de la edición
    const preguntaOriginal = preguntas.find((p) => p.id === preguntaEditada.id);

    // 📌 Inicializar objeto con solo los cambios detectados
    let datosPregunta = {};

    // ✅ Comparar cada campo y agregarlo solo si cambió
    if (preguntaEditada.texto !== preguntaOriginal.texto) {
      datosPregunta.texto = preguntaEditada.texto;
    }

    if (preguntaEditada.ayuda !== preguntaOriginal.ayuda) {
      datosPregunta.ayuda = preguntaEditada.ayuda;
    }

    const respuestasEliminadas = preguntaOriginal.respuestas
      .map((respuesta) => {
        const existe = preguntaEditada.respuestas.some(
          (r) => r.id === respuesta.id,
        );

        if (existe) return null;

        return { id: respuesta.id || null, texto: respuesta.texto };
      })
      .filter(Boolean);

    if (respuestasEliminadas.length > 0) {
      datosPregunta.respuestas_eliminadas = respuestasEliminadas;
    }

    const correcta_eliminada = respuestasEliminadas.some(
      (r) => r.id === preguntaOriginal.respuesta_correcta,
    );

    if (
      correcta_eliminada &&
      preguntaEditada.respuesta_correcta === preguntaOriginal.respuesta_correcta
    ) {
      setError("Tienes que seleccionar una respuesta correcta.");
      return;
    }

    if (
      preguntaEditada.respuesta_correcta !== preguntaOriginal.respuesta_correcta
    ) {
      datosPregunta.respuesta_correcta = preguntaEditada.respuesta_correcta;
    }

    // ✅ Comparar respuestas individualmente
    const respuestasModificadas = preguntaEditada.respuestas
      .map((respuesta, index) => {
        if (respuesta.texto.trim() === "") {
          return;
        }
        const respuestaOriginal = preguntaOriginal.respuestas[index];
        if (!respuestaOriginal || respuesta.texto !== respuestaOriginal.texto) {
          return { id: respuesta.id || null, texto: respuesta.texto };
        }
        return null;
      })
      .filter(Boolean); // Eliminar `null` (respuestas que no cambiaron)

    if (respuestasModificadas.length > 0) {
      datosPregunta.respuestas = respuestasModificadas;
    }

    // 📌 Si no hay cambios, no hacer la petición
    if (Object.keys(datosPregunta).length === 0) {
      console.log("❌ No hay cambios para guardar.");
      setEditandoPreguntaId(null);
      setPreguntaEditada(null);
      return;
    }
    setEditingPregunta(true);
    try {
      const response = await api.put(
        `/preguntas/${preguntaEditada.id}/`,
        datosPregunta,
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        },
      );

      // 📌 Actualizar la pregunta en la lista
      setPreguntas(
        preguntas.map((pregunta) =>
          pregunta.id === preguntaEditada.id ? response.data : pregunta,
        ),
      );
      console.log("✅ Pregunta actualizada correctamente.");
      setEditandoPreguntaId(null);
      setPreguntaEditada(null);
    } catch (error) {
      console.error(
        "❌ Error al actualizar la pregunta:",
        error.response?.data,
      );
      console.error(error);
      setError("Error al actualizar la pregunta.");
      setEditandoPreguntaId(null);
      setPreguntaEditada(null);
    } finally {
      setEditingPregunta(false);
    }
  };

  const autoResize = (e) => {
    e.target.style.height = "auto"; // 📌 Restablece altura para recalcular
    e.target.style.height = `${e.target.scrollHeight}px`; // 📌 Ajusta la altura según el contenido
  };

  const handleEliminarRespuestaEditada = (index) => {
    if (preguntaEditada.respuestas.length > MIN_RESPUESTAS) {
      const nuevasRespuestas = preguntaEditada.respuestas.filter(
        (_, i) => i !== index,
      );

      setPreguntaEditada({
        ...preguntaEditada,
        respuestas: nuevasRespuestas,
      });
    }
  };

  return (
    <div className="container mt-5">
      {error && (
        <AlertMessage message={error} setMessage={setError} type="danger" />
      )}
      {successMessage && (
        <AlertMessage
          message={successMessage}
          setMessage={setSuccessMessage}
          type="success"
        />
      )}

      <TituloEditable
        tema={tema}
        editando={editando}
        editing={isEditing}
        setEditando={setEditando}
        nuevoTitulo={nuevoTitulo}
        setNuevoTitulo={setNuevoTitulo}
        handleActualizarTitulo={handleActualizarTitulo}
        loading={loading}
        handleOpenTemaModal={handleOpenTemaModal}
      />

      <hr />

      <BotonesAccion
        tema={tema}
        setShowImportModal={setShowImportModal}
        setShowGenerateModal={setShowGenerateModal}
        setShowExportModal={setShowExportModal}
      />

      {/* 📌 Contenedor de botones centrados */}
      <div className="d-flex flex-column justify-content-center align-items-center gap-3 mt-3">
        <div className="d-flex justify-content-center align-items-center gap-3">
          {tema && tema.numero_preguntas > 0 && (
            <Link
              to={`/cuestionario/estudiar/tema/${tema.id}`}
              className="btn i-menu i-orange w-auto"
            >
              <i className="bi bi-book-half"></i> Estudiar
            </Link>
          )}

          {tema && tema.numero_fallos > 0 && (
            <Link
              to={`/cuestionario/repasar/tema/${tema.id}`}
              className="btn i-menu i-orange w-auto"
            >
              <i className="bi bi-reply-all-fill"></i> Repasar
            </Link>
          )}
        </div>

        {tema && tema.numero_fallos > 0 && (
          <span className="badge bg-warning text-dark">
            {tema.numero_fallos} pregunta
            {tema.numero_fallos > 1 && "s"}
            &nbsp;con fallos
          </span>
        )}
      </div>

      <div className="accordion my-3" id="accordionNuevaPregunta">
        <div className="accordion-item border-0 shadow-sm">
          <h2 className="accordion-header">
            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseNuevaPregunta"
              aria-expanded="false"
              aria-controls="collapseNuevaPregunta"
              style={{
                background: "var(--naranja-quemado)",
                color: "var(--blanco)",
                fontSize: "0.95rem",
              }}
            >
              <i className="bi bi-plus-circle me-2"></i> Nueva Pregunta
            </button>
          </h2>
          <div
            id="collapseNuevaPregunta"
            className="accordion-collapse collapse"
            data-bs-parent="#accordionNuevaPregunta"
          >
            <div
              className="accordion-body p-3"
              style={{ background: "var(--rosa-muy-muy-claro)" }}
            >
              <form onSubmit={handleCrearPregunta} className="question-form">
                {/* Campo de pregunta */}
                <div className="mb-3">
                  <div className="question-input-container p-3 rounded bg-white shadow-sm">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div
                        className="step-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "24px",
                          height: "24px",
                          background: "var(--naranja-quemado)",
                          color: "var(--blanco)",
                          borderRadius: "50%",
                          fontSize: "0.8rem",
                        }}
                      >
                        1
                      </div>
                      <h6
                        className="mb-0"
                        style={{ color: "var(--naranja-quemado)" }}
                      >
                        Pregunta
                      </h6>
                    </div>
                    <input
                      type="text"
                      name="texto"
                      className="form-control border-0 bg-light"
                      style={{ fontSize: "0.9rem" }}
                      value={nuevaPregunta.texto}
                      onChange={handleChange}
                      placeholder="Escribe aquí tu pregunta..."
                      required
                    />
                  </div>
                </div>

                {/* Sección de respuestas */}
                <div className="mb-3">
                  <div className="answers-container p-3 rounded bg-white shadow-sm">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div
                        className="step-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "24px",
                          height: "24px",
                          background: "var(--naranja-quemado)",
                          color: "var(--blanco)",
                          borderRadius: "50%",
                          fontSize: "0.8rem",
                        }}
                      >
                        2
                      </div>
                      <h6
                        className="mb-0"
                        style={{ color: "var(--naranja-quemado)" }}
                      >
                        Respuestas
                      </h6>
                    </div>

                    <div className="answers-grid">
                      {nuevaPregunta.respuestas.map((respuesta, index) => (
                        <div key={index} className="answer-card mb-2">
                          <div
                            className={`p-2 rounded ${
                              index === 0 ? "correct-answer" : ""
                            }`}
                            style={{
                              background:
                                index === 0
                                  ? "var(--rosa-muy-claro)"
                                  : "var(--rosa-muy-muy-claro)",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="answer-letter rounded-circle d-flex align-items-center justify-content-center"
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  background:
                                    index === 0
                                      ? "var(--naranja-quemado)"
                                      : "var(--naranja-quemado-oscuro)",
                                  color: "var(--blanco)",
                                  fontSize: "0.8rem",
                                  fontWeight: "bold",
                                }}
                              >
                                {String.fromCharCode(65 + index)}
                              </div>

                              <input
                                type="text"
                                className="form-control form-control-sm border-0"
                                style={{
                                  background: "transparent",
                                  fontSize: "0.9rem",
                                }}
                                placeholder={`Respuesta ${index + 1}`}
                                value={respuesta.texto}
                                onChange={(e) =>
                                  handleRespuestaChange(index, e.target.value)
                                }
                                required
                              />

                              {index === 0 && (
                                <span
                                  className="badge"
                                  style={{
                                    background: "var(--naranja-quemado)",
                                    color: "var(--blanco)",
                                    fontSize: "1rem",
                                  }}
                                >
                                  <i className="bi bi-check-circle me-1"></i>
                                  Correcta
                                </span>
                              )}

                              {nuevaPregunta.respuestas.length >
                                MIN_RESPUESTAS && (
                                <button
                                  type="button"
                                  className="btn btn-link p-0 text-danger"
                                  onClick={() => handleEliminarRespuesta(index)}
                                  style={{ fontSize: "0.9rem" }}
                                >
                                  <i className="bi bi-x-circle"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {nuevaPregunta.respuestas.length < MAX_RESPUESTAS && (
                      <button
                        type="button"
                        className="btn btn-sm w-100 mt-2"
                        onClick={handleAgregarRespuesta}
                        style={{
                          background: "var(--rosa-muy-claro)",
                          color: "var(--naranja-quemado)",
                          border: `2px dashed var(--naranja-quemado)`,
                          fontSize: "0.85rem",
                        }}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Añadir respuesta
                      </button>
                    )}
                  </div>
                </div>

                {/* Campo de explicación */}
                <div className="mb-3">
                  <div className="explanation-container p-3 rounded bg-white shadow-sm">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div
                        className="step-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "24px",
                          height: "24px",
                          background: "var(--naranja-quemado)",
                          color: "var(--blanco)",
                          borderRadius: "50%",
                          fontSize: "0.8rem",
                        }}
                      >
                        3
                      </div>
                      <h6
                        className="mb-0"
                        style={{ color: "var(--naranja-quemado)" }}
                      >
                        Explicación
                      </h6>
                    </div>
                    <input
                      type="text"
                      name="ayuda"
                      className="form-control form-control-sm border-0 bg-light"
                      style={{ fontSize: "0.9rem" }}
                      value={nuevaPregunta.ayuda}
                      onChange={handleChange}
                      placeholder="Explicación opcional"
                    />
                  </div>
                </div>

                {/* Botón submit */}
                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-sm"
                    style={{
                      background: "var(--naranja-quemado)",
                      color: "var(--blanco)",
                      fontSize: "0.9rem",
                      padding: "0.5rem",
                    }}
                    disabled={creatingPregunta}
                  >
                    {creatingPregunta ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill me-2"></i>
                        Guardar Pregunta
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center">Cargando tema...</p>
      ) : (
        <>
          {preguntas.length === 0 ? (
            <p className="text-center text-muted">
              No hay preguntas en este tema.
            </p>
          ) : (
            <div className="accordion my-3" id="accordionMostrarPreguntas">
              <div className="accordion-item border-0 shadow-sm">
                <h2 className="accordion-header">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseMostrarPreguntas"
                    aria-expanded="false"
                    aria-controls="collapseMostrarPreguntas"
                    style={{
                      background: "var(--rosa-muy-claro)",
                      color: "var(--naranja-quemado-oscuro)",
                      fontSize: "0.95rem",
                    }}
                  >
                    <i className="bi bi-list-ul me-2"></i> Mostrar preguntas -{" "}
                    {tema.numero_preguntas}
                    {/* <div className="d-flex align-items-center">
                      <i className="bi bi-list-ul me-2"></i>
                      <span>Mostrar preguntas</span>
                      <span className="badge bg-secondary ms-2">
                        {tema.numero_preguntas}
                      </span>
                    </div> */}
                  </button>
                </h2>
                <div
                  id="collapseMostrarPreguntas"
                  className="accordion-collapse collapse"
                >
                  <div className="accordion mb-4" id="accordionPreguntas">
                    {preguntas.map((pregunta, index) => (
                      <div className="accordion-item" key={pregunta.id}>
                        <div className="accordion-header d-flex justify-content-between align-items-center pr-3">
                          {/* 📌 Botón de acordeón */}
                          {/* 📌 Si está en edición, mostrar inputs */}
                          {editandoPreguntaId === pregunta.id ? (
                            <input
                              type="text"
                              className="form-control w-100"
                              style={{
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                              }}
                              value={preguntaEditada.texto}
                              onChange={handleEditarPreguntaChange}
                              name="texto"
                            />
                          ) : (
                            <button
                              className="accordion-button collapsed flex-grow-1 text-start"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={`#collapse${index}`}
                              aria-expanded="false"
                              aria-controls={`collapse${index}`}
                            >
                              {pregunta.texto}
                            </button>
                          )}
                          {/* 📌 Botón para editar la pregunta */}
                          {editandoPreguntaId === pregunta.id ? (
                            <>
                              {editingPregunta ? (
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                  aria-hidden="true"
                                  style={{ margin: "20px" }}
                                ></span>
                              ) : (
                                <i
                                  className="bi bi-check-circle-fill text-success hover-pink btn"
                                  style={{
                                    cursor: "pointer",
                                    fontSize: "1.2rem",
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleGuardarPregunta();
                                  }}
                                  disabled={editingPregunta}
                                ></i>
                              )}
                              <i
                                className="bi bi-x-circle-fill text-danger hover-pink btn"
                                style={{
                                  cursor: "pointer",
                                  fontSize: "1.2rem",
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleCancelarEdicion();
                                }}
                                disabled={editingPregunta}
                              ></i>
                            </>
                          ) : (
                            <i
                              className="bi bi-pencil-square i-orange i-menu-sm btn"
                              style={{ cursor: "pointer", fontSize: "1.2rem" }}
                              onClick={(e) => {
                                e.preventDefault();
                                handleActivarEdicion(pregunta);
                              }}
                            ></i>
                          )}

                          {/* 📌 Botón de eliminar al final de la línea */}
                          <i
                            className="bi bi-trash3-fill i-orange i-menu-sm btn"
                            style={{ cursor: "pointer", fontSize: "1.2rem" }}
                            onClick={(e) => {
                              e.preventDefault();
                              handleOpenPreguntaModal(pregunta);
                            }}
                          ></i>
                        </div>

                        <div
                          id={`collapse${index}`}
                          className="accordion-collapse collapse"
                          aria-labelledby={`heading${index}`}
                          data-bs-parent="#accordionPreguntas"
                        >
                          <div className="accordion-body">
                            <div className="row">
                              {/* 📌 Columna izquierda (Lista de respuestas) */}
                              <div className="col-md-6">
                                <ul className="list-group">
                                  {(editandoPreguntaId === pregunta.id
                                    ? preguntaEditada.respuestas
                                    : pregunta.respuestas
                                  ).map((respuesta, idx) => (
                                    <li
                                      key={idx} // 🔹 Cambiado a idx para evitar errores con respuestas nuevas sin id
                                      className={`list-group-item d-flex align-items-center ${
                                        respuesta.id ===
                                        pregunta.respuesta_correcta
                                          ? "respuesta-correcta text-success"
                                          : ""
                                      }`}
                                    >
                                      {editandoPreguntaId === pregunta.id ? (
                                        <div className="d-flex align-items-center w-100 gap-2">
                                          {/* 📌 Radio button */}
                                          <div className="form-check ms-2">
                                            <input
                                              type="radio"
                                              className="form-check-input"
                                              name={`respuesta_correcta_${pregunta.id}`}
                                              value={respuesta.id} // 🔹 Usamos el ID real de la respuesta
                                              checked={
                                                preguntaEditada.respuesta_correcta ===
                                                respuesta.id
                                              } // 🔹 Comparar con el ID real
                                              onChange={
                                                handleSeleccionarRespuestaCorrecta
                                              }
                                            />
                                          </div>

                                          {/* 📌 Input de texto para editar respuesta */}
                                          <textarea
                                            className="form-control w-100"
                                            style={{
                                              overflowWrap: "break-word",
                                              resize: "none",
                                            }}
                                            value={
                                              preguntaEditada.respuestas[idx]
                                                ?.texto || ""
                                            }
                                            onChange={(e) =>
                                              handleEditarRespuestaChange(
                                                idx,
                                                e.target.value,
                                              )
                                            }
                                            onInput={(e) => autoResize(e)}
                                          />

                                          {/* Botón para eliminar una respuesta */}
                                          {preguntaEditada &&
                                            preguntaEditada.respuestas.length >
                                              MIN_RESPUESTAS && (
                                              <i
                                                className="bi bi-x-circle-fill text-danger hover-pink btn"
                                                style={{
                                                  cursor: "pointer",
                                                  fontSize: "1.2rem",
                                                }}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  handleEliminarRespuestaEditada(
                                                    idx,
                                                  );
                                                }}
                                              ></i>
                                            )}
                                        </div>
                                      ) : (
                                        <>
                                          {respuesta.id ===
                                            pregunta.respuesta_correcta && (
                                            <>
                                              <i className="bi bi-arrow-right-circle-fill"></i>
                                              &nbsp;&nbsp;
                                            </>
                                          )}
                                          {respuesta.texto}
                                        </>
                                      )}
                                    </li>
                                  ))}
                                </ul>

                                {/* Botón para agregar una nueva respuesta */}
                                {preguntaEditada &&
                                  preguntaEditada.respuestas.length <
                                    MAX_RESPUESTAS && (
                                    <button
                                      type="button"
                                      className="btn btn-sm w-100 mt-2 btn-outline-primary"
                                      onClick={handleAgregarRespuestaEditada}
                                    >
                                      <i className="bi bi-plus-circle me-1"></i>
                                      Añadir respuesta
                                    </button>
                                  )}
                              </div>

                              {/* 📌 Columna derecha (Ayuda + Estado de fallos) */}
                              <div className="col-md-6 d-flex flex-column">
                                {/* 🔹 Parte superior: Ayuda de la pregunta */}
                                <div className="p-3 border bg-light">
                                  <h6 className="fw-bold">Ayuda:</h6>
                                  {editandoPreguntaId === pregunta.id ? (
                                    <div className="mb-2">
                                      <textarea
                                        className="form-control w-100"
                                        style={{
                                          overflowWrap: "break-word",
                                          resize: "none",
                                        }}
                                        name="ayuda" // Asegurar que este campo se relacione con handleEditarPreguntaChange
                                        value={preguntaEditada.ayuda}
                                        onChange={handleEditarPreguntaChange}
                                        onInput={(e) => autoResize(e)}
                                      />
                                    </div>
                                  ) : (
                                    <p className="text-muted">
                                      {pregunta.ayuda ||
                                        "No hay ayuda disponible"}
                                    </p>
                                  )}
                                </div>
                                {/* 🔹 Parte inferior: Estado de la pregunta */}
                                <div
                                  className={`p-3 mt-2 border ${
                                    pregunta.respondida > 0
                                      ? pregunta.fallos > 0
                                        ? "bg-danger text-white"
                                        : "bg-success text-white"
                                      : "bg-light text-muted"
                                  }`}
                                >
                                  <h6 className="fw-bold">Estado:</h6>
                                  <p>
                                    {pregunta.respondida > 0
                                      ? pregunta.fallos > 0
                                        ? "Fallada"
                                        : "Acertada"
                                      : "Nunca respondida"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 📌 Modal de Importación */}
      {showImportModal && (
        <div className="modal-backdrop fade-in">
          <div className="custom-modal">
            <div className="modal-content shadow-lg p-4 rounded animate-modal">
              {/* Botón de cierre */}
              <button
                className="close-button"
                onClick={() => setShowImportModal(false)}
              >
                ×
              </button>

              <h4 className="modal-title text-center mb-3">
                Importar Preguntas
              </h4>
              <p className="text-center text-muted">
                Selecciona el formato del archivo:
              </p>

              {/* 📌 Botones para elegir formato */}
              <div className="d-flex justify-content-center gap-3 mb-2">
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

              {/* 📌 Botones de descarga de plantilla */}
              <div className="text-center mb-4">
                <button
                  className="btn btn-link text-decoration-none"
                  onClick={handleDescargarPlantilla}
                >
                  <i className="bi bi-download"></i> Descargar plantilla{" "}
                  {importFormat.toUpperCase()}
                </button>
              </div>

              {/* 📌 Input de archivo estilizado */}
              <div className="custom-file-input mb-3">
                <input
                  type="file"
                  accept={importFormat === "json" ? ".json" : ".xlsx"}
                  className="form-control"
                  onChange={handleSeleccionarArchivo}
                />
              </div>

              {/* 📌 Botón de aceptar y cancelar */}
              <div className="d-flex justify-content-center gap-3">
                <button
                  className="btn btn-primary w-50"
                  onClick={handleImportarPreguntas}
                  disabled={!archivoSeleccionado || loadingButton} // 📌 Deshabilitar hasta que haya un archivo
                >
                  {loadingButton ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    "Aceptar"
                  )}
                </button>
                <button
                  className="btn btn-outline-secondary w-50"
                  onClick={() => setShowImportModal(false)}
                  disabled={loadingButton}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📌 Modal de Generación */}
      {showGenerateModal && (
        <div className="modal-backdrop fade-in">
          <div className="custom-modal">
            <div className="modal-content shadow-lg p-3 rounded animate-modal">
              {/* Botón de cierre */}
              <button
                className="close-button"
                onClick={() => setShowGenerateModal(false)}
              >
                ×
              </button>

              <h4 className="modal-title text-center mb-3 naranja">
                ✨ Generador de Preguntas ✨
              </h4>
              <p className="text-center text-muted">
                Selecciona un archivo PDF o Word:
              </p>

              {/* 📌 Input de archivo estilizado */}
              <div className="custom-file-input mb-3">
                <input
                  type="file"
                  accept={".pdf, .doc, .docx"}
                  className="form-control"
                  onChange={handleSeleccionarArchivo}
                />
              </div>

              {/* 📌 Botón de aceptar y cancelar */}
              <div className="d-flex justify-content-center gap-3">
                <button
                  className="btn btn-primary btn-glow"
                  onClick={handleGenerarPreguntas}
                  disabled={!archivoSeleccionado || loadingButton} // 📌 Deshabilitar hasta que haya un archivo
                >
                  {loadingButton ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    "🚀 Subir Archivo"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📌 Modal de Exportación */}
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

              <h4 className="modal-title text-center mb-3">Exportar Tema</h4>
              {isProcessing ? (
                // 📌 Loader mientras se espera la respuesta
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
                      onClick={handleExportarTema}
                      disabled={loadingButton}
                    >
                      {loadingButton ? (
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                      ) : (
                        "Descargar"
                      )}
                    </button>
                    <button
                      className="btn btn-outline-secondary w-50"
                      onClick={() => setShowExportModal(false)}
                      disabled={loadingButton}
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
      {showModal && (temaAEliminar || preguntaAEliminar) && (
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
                  ¿Estás seguro de que quieres eliminar la pregunta{" "}
                  <strong>{preguntaAEliminar.texto}</strong>?
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
                    temaAEliminar ? handleDeleteTema : handleEliminarPregunta
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

export default TemaDetalle;
