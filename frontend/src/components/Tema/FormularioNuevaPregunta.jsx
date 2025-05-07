import React from "react";

const FormularioNuevaPregunta = ({
  nuevaPregunta,
  handleChange,
  handleRespuestaChange,
  handleEliminarRespuesta,
  handleAgregarRespuesta,
  handleCrearPregunta,
  MAX_RESPUESTAS,
  MIN_RESPUESTAS,
}) => {
  return (
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
                  <h6 className="mb-2 text-naranja">1. Pregunta</h6>
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

              {/* Respuestas */}
              <div className="mb-3">
                <div className="answers-container p-3 rounded bg-white shadow-sm">
                  <h6 className="mb-2 text-naranja">2. Respuestas</h6>
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
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="answer-letter rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "28px",
                                height: "28px",
                                background: "var(--naranja-quemado)",
                                color: "var(--blanco)",
                                fontSize: "0.8rem",
                              }}
                            >
                              {String.fromCharCode(65 + index)}
                            </div>
                            <input
                              type="text"
                              className="form-control form-control-sm border-0"
                              style={{ background: "transparent" }}
                              placeholder={`Respuesta ${index + 1}`}
                              value={respuesta.texto}
                              onChange={(e) =>
                                handleRespuestaChange(index, e.target.value)
                              }
                              required
                            />
                            {index === 0 && (
                              <span
                                className="badge bg-naranja text-white"
                                style={{ fontSize: "0.85rem" }}
                              >
                                <i className="bi bi-check-circle me-1"></i>
                                Correcta
                              </span>
                            )}
                            {nuevaPregunta.respuestas.length > MIN_RESPUESTAS && (
                              <button
                                type="button"
                                className="btn btn-link text-danger"
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

              {/* Campo de ayuda */}
              <div className="mb-3">
                <div className="explanation-container p-3 rounded bg-white shadow-sm">
                  <h6 className="mb-2 text-naranja">3. Explicación</h6>
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
                >
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Guardar Pregunta
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioNuevaPregunta;
