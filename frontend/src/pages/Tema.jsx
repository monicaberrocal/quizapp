import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import AlertMessage from "../components/AlertMessage";

const TemaDetalle = () => {
  const { temaId } = useParams();
  const [tema, setTema] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mostrarRespuestas, setMostrarRespuestas] = useState({});
  const [nuevaPregunta, setNuevaPregunta] = useState({
    texto: "",
    ayuda: "",
    respuestas: [{ texto: "" }, { texto: "" }, { texto: "" }, { texto: "" }],
    respuesta_correcta: 1,
  });
  const [csrfToken, setCsrfToken] = useState("");

  console.log(preguntas);

  useEffect(() => {
    fetchTemaDetalle();
    fetchCsrfToken();
  }, [temaId]);

  const fetchTemaDetalle = async () => {
    try {
      const response = await api.get(`/temas/${temaId}/`, {
        withCredentials: true,
      });
      setTema(response.data.tema);
      setPreguntas(response.data.tema.preguntas);
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

  const toggleRespuestas = (preguntaId) => {
    setMostrarRespuestas((prevState) => ({
      ...prevState,
      [preguntaId]: !prevState[preguntaId],
    }));
  };

  const handleChange = (e) => {
    setNuevaPregunta({ ...nuevaPregunta, [e.target.name]: e.target.value });
  };

  const handleRespuestaChange = (index, value) => {
    const nuevasRespuestas = [...nuevaPregunta.respuestas];
    nuevasRespuestas[index].texto = value;
    setNuevaPregunta({ ...nuevaPregunta, respuestas: nuevasRespuestas });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(
        "/preguntas/crear/",
        { ...nuevaPregunta, tema: temaId },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        },
      );

      setPreguntas([...preguntas, response.data]);
      setNuevaPregunta({
        texto: "",
        ayuda: "",
        respuestas: [
          { texto: "" },
          { texto: "" },
          { texto: "" },
          { texto: "" },
        ],
        respuesta_correcta: 1,
      });
    } catch (error) {
      setError("Error al crear la pregunta.");
    }
  };

  return (
    <div className="container mt-5">
      {loading ? (
        <p className="text-center">Cargando tema...</p>
      ) : error ? (
        <AlertMessage message={error} type="danger" />
      ) : (
        <>
          <h2 className="text-center">{tema.nombre}</h2>
          <hr />

          <div className="accordion mb-4" id="accordionNuevaPregunta">
            <div className="accordion-item border-0 shadow-sm">
              <h2 className="accordion-header">
                <button
                  className="accordion-button collapsed fw-bold"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseNuevaPregunta"
                  aria-expanded="false"
                  aria-controls="collapseNuevaPregunta">
                  <i className="bi bi-plus-circle me-2"></i> Nueva Pregunta
                </button>
              </h2>
              <div
                id="collapseNuevaPregunta"
                className="accordion-collapse collapse"
                aria-labelledby="headingNuevaPregunta"
                data-bs-parent="#accordionNuevaPregunta">
                <div className="accordion-body bg-light p-4 rounded">
                  <form
                    onSubmit={handleSubmit}
                    className="p-3 shadow-sm bg-white rounded">
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="bi bi-pencil me-2"></i>Enunciado de la
                        pregunta
                      </label>
                      <input
                        type="text"
                        name="texto"
                        className="form-control border-primary"
                        value={nuevaPregunta.texto}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="bi bi-chat-square-text me-2"></i>
                        Respuestas
                      </label>
                      {nuevaPregunta.respuestas.map((respuesta, index) => (
                        <div key={index} className="input-group mb-2">
                          <span className="input-group-text bg-secondary text-white">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            className="form-control border-primary"
                            placeholder={`Respuesta ${index + 1}`}
                            value={respuesta.texto}
                            onChange={(e) =>
                              handleRespuestaChange(index, e.target.value)
                            }
                            required
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="bi bi-check-circle me-2"></i>Respuesta
                        Correcta
                      </label>
                      <select
                        name="respuesta_correcta"
                        className="form-select border-primary "
                        value={nuevaPregunta.respuesta_correcta}
                        onChange={handleChange}
                        required>
                        <option value={1}>Respuesta 1</option>
                        <option value={2}>Respuesta 2</option>
                        <option value={3}>Respuesta 3</option>
                        <option value={4}>Respuesta 4</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="bi bi-info-circle me-2"></i>Explicación
                        (opcional)
                      </label>
                      <input
                        type="text"
                        name="ayuda"
                        className="form-control border-primary"
                        value={nuevaPregunta.ayuda}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="d-grid">
                      <button type="submit" className="btn btn-primary fw-bold">
                        <i className="bi bi-check-lg me-2"></i>Crear Pregunta
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {preguntas.length === 0 ? (
            <p className="text-center text-muted">
              No hay preguntas en este tema.
            </p>
          ) : (
<div className="accordion" id="accordionPreguntas">
  {preguntas.map((pregunta, index) => (
    <div className="accordion-item" key={pregunta.id}>
      <h2 className="accordion-header" id={`heading${index}`}>
        <button
          className="accordion-button collapsed"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#collapse${index}`}
          aria-expanded="false"
          aria-controls={`collapse${index}`}>
          {pregunta.texto}
        </button>
      </h2>
      <div
        id={`collapse${index}`}
        className="accordion-collapse collapse"
        aria-labelledby={`heading${index}`}
        data-bs-parent="#accordionPreguntas">
        <div className="accordion-body">
          <div className="row">
            {/* 📌 Columna izquierda (Lista de respuestas) */}
            <div className="col-md-6">
              <ul className="list-group">
                {pregunta.respuestas.map((respuesta) => (
                  <li
                    key={respuesta.id}
                    className={`list-group-item ${
                      respuesta.id === pregunta.respuesta_correcta_id
                        ? "respuesta-correcta"
                        : ""
                    }`}>
                    {respuesta.id === pregunta.respuesta_correcta_id && (
                      <>
                        <i className="bi bi-arrow-right-circle-fill"></i>&nbsp;&nbsp;
                      </>
                    )}
                    {respuesta.texto}
                  </li>
                ))}
              </ul>
            </div>

            {/* 📌 Columna derecha (Ayuda + Estado de fallos) */}
            <div className="col-md-6 d-flex flex-column">
              {/* 🔹 Parte superior: Ayuda de la pregunta */}
              <div className="p-3 border bg-light">
                <h6 className="fw-bold">Ayuda:</h6>
                <p className="text-muted">{pregunta.ayuda || "No hay ayuda disponible"}</p>
              </div>

              {/* 🔹 Parte inferior: Estado de la pregunta (Correcto / Fallada) */}
              <div className={`p-3 mt-2 border ${pregunta.fallos > 0 ? "bg-danger text-white" : "bg-success text-white"}`}>
                <h6 className="fw-bold">Estado:</h6>
                <p>{pregunta.fallos > 0 ? "Fallada" : "Correcto"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

          )}
        </>
      )}
    </div>
  );
};

export default TemaDetalle;
