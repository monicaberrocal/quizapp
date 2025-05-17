import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import LoadingScreen from "../components/LoadingScreen"

const Finalizar = () => {
  const [resultados, setResultados] = useState(null)
  const { tipo, filtro, id } = useParams();
  const navigate = useNavigate()

  useEffect(() => {
    const fetchResultados = async () => {
      try {
        const response = await api.get(`/finalizar_test?tipo=${tipo}&filtro=${filtro}&id=${id}`, {
          withCredentials: true,
        })
        setResultados(response.data)
      } catch (error) {
        console.error(error)
      }
    }

    fetchResultados()
  }, [tipo, filtro, id])

  if (!resultados) {
    return (
      LoadingScreen("Cargando los resultados")
    )
  }

  const porcentajeAciertos = (resultados.respuestas_correctas / resultados.total_respondidas) * 100

  return (
    <div className="container mt-5">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="text-center mb-4">Resultados del Test</h2>

          {/* <div className="text-center mb-4">
            <div className="progress" style={{ height: "30px" }}>
              <div
                className="progress-bar bg-naranja-quemado"
                role="progressbar"
                style={{ width: `${porcentajeAciertos}%` }}
                aria-valuenow={porcentajeAciertos}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {porcentajeAciertos.toFixed(1)}%
              </div>
            </div>
          </div> */}

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h5 className="card-title">Total de preguntas</h5>
                  <p className="card-text display-4">{resultados.total_respondidas}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Respuestas correctas</h5>
                  <p className="card-text display-4">{resultados.respuestas_correctas}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-danger text-white">
                <div className="card-body text-center">
                  <h5 className="card-title">Respuestas incorrectas</h5>
                  <p className="card-text display-4">{resultados.fallos}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <button className="btn btn-primary btn-lg btn-glow" onClick={() => navigate("/")}>
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Finalizar

