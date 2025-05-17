import { useNavigate } from "react-router-dom"

const RespuestaMostrar = ({ pregunta, respuestaSeleccionada, handleSiguientePregunta, testId }) => {
  const navigate = useNavigate()

  return (
    <div className="container mt-5">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h3 className="card-title mb-4">
            <strong>Pregunta:</strong> {pregunta.texto}
          </h3>

          {respuestaSeleccionada?.correcta ? (
            <div className="alert alert-success" role="alert">
              <h4 className="alert-heading">¡Bien hecho!</h4>
              <p>Has respondido correctamente.</p>
            </div>
          ) : (
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">Respuesta incorrecta</h4>
              <p>
                La respuesta correcta era: <strong>{pregunta.respuesta_correcta.texto}</strong>
              </p>
            </div>
          )}

          <div className="row g-4 mt-3">
            {pregunta.respuestas.map((respuesta) => (
              <div className="col-md-6" key={respuesta.id}>
                <div
                  className={`card h-100 ${
                    respuesta.id === pregunta.respuesta_correcta
                      ? "border-success"
                      : respuesta.id === respuestaSeleccionada?.id
                        ? "border-danger"
                        : "border-secondary"
                  }`}
                >
                  <div className="card-body d-flex flex-column justify-content-between">
                    <h5 className="card-title">{respuesta.texto}</h5>
                    {respuesta.id === pregunta.respuesta_correcta && (
                      <p className="card-text text-success mt-2 mb-0">
                        <strong>¡Correcta!</strong>
                      </p>
                    )}
                    {respuestaSeleccionada?.correcta === false && respuesta.id === respuestaSeleccionada?.id && (
                      <p className="card-text text-danger mt-2 mb-0">
                        <strong>Incorrecta</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pregunta.ayuda && (
            <div className="alert alert-info mt-4" role="alert">
              <h4 className="alert-heading">Ayuda:</h4>
              <p className="mb-0">{pregunta.ayuda}</p>
            </div>
          )}

          <div className="text-center mt-4">
            <button className="btn btn-primary btn-lg me-3" onClick={() => handleSiguientePregunta()}>
              Continuar
            </button>
            <button className="btn btn-outline-primary btn-lg" onClick={() => navigate(`/finalizar/${testId}`)}>
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RespuestaMostrar

