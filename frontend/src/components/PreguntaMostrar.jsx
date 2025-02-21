import { useState } from "react";

const PreguntaMostrar = ({
  preguntaActual,
  preguntaActualIndex,
  totalPreguntas,
  handleEnviarRespuesta,
  handleSeleccionarRespuestaSuper,
}) => {
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null);

  const handleSeleccionarRespuesta = (respuestaId, esCorrecta) => {
    setRespuestaSeleccionada({ id: respuestaId, correcta: esCorrecta });
    handleSeleccionarRespuestaSuper(respuestaId, esCorrecta);
  };

  return (
    <div className="container mt-5">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="text-center mb-4">
            Pregunta {preguntaActualIndex} de {totalPreguntas}
          </h2>
          <div className="progress mb-4" style={{ height: "10px" }}>
            <div
              className="progress-bar bg-naranja-quemado"
              role="progressbar"
              style={{
                width: `${(preguntaActualIndex / totalPreguntas) * 100}%`,
              }}
              aria-valuenow={preguntaActualIndex}
              aria-valuemin="0"
              aria-valuemax={totalPreguntas}
            ></div>
          </div>
          <h3 className="card-title mb-4">{preguntaActual.texto}</h3>

          <div className="row g-4">
            {preguntaActual.respuestas.map((respuesta) => (
              <div className="col-md-6" key={respuesta.id}>
                <div className="form-check">
                  <input
                    type="radio"
                    id={`respuesta_${respuesta.id}`}
                    name="respuesta"
                    value={respuesta.id}
                    className="form-check-input d-none"
                    onChange={() =>
                      handleSeleccionarRespuesta(
                        respuesta.id,
                        respuesta.id === preguntaActual.respuesta_correcta
                      )
                    }
                  />
                  <label
                    htmlFor={`respuesta_${respuesta.id}`}
                    style={{
                      backgroundColor:
                        respuestaSeleccionada?.id === respuesta.id
                          ? "var(--naranja-quemado)"
                          : "",
                      color:
                        respuestaSeleccionada?.id === respuesta.id
                          ? "white"
                          : "",
                    }}
                    className={`form-check-label-custom respuesta-rectangulo w-100 ${
                      respuestaSeleccionada?.id === respuesta.id ? "active" : ""
                    }`}
                  >
                    {respuesta.texto}
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={!respuestaSeleccionada}
              onClick={() => handleEnviarRespuesta()}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreguntaMostrar;
