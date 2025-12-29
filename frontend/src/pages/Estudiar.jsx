import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import PreguntaMostrar from "../components/PreguntaMostrar";
import RespuestaMostrar from "../components/RespuestaMostrar";
import LoadingScreen from "../components/LoadingScreen";
import "../assets/css/styles_test.css";

const Estudiar = () => {
  const { tipo, filtro, id } = useParams();
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null);
  const [mostrarPregunta, setMostrarPregunta] = useState(true);
  const [loading, setLoading] = useState(true);
  const [processingContinue, setProcessingContinue] = useState(false);
  const navigate = useNavigate();

  const [preguntaActual, setPreguntaActual] = useState(null);
  const [preguntaSiguiente, setPreguntaSiguiente] = useState(null);
  const [testId, setTestId] = useState(null);
  const [totalPreguntas, setTotalPreguntas] = useState(0);  

  useEffect(() => {
    fetchPreguntas();
  }, [tipo, filtro, id]);

  const fetchPreguntas = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/estudiar?tipo=${tipo}&filtro=${filtro}&id=${id}`, {
        withCredentials: true,
      });
      setPreguntaActual(response.data.pregunta_actual)
      setTotalPreguntas(response.data.total)
      setTestId(response.data.test_id)
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  

  const handleSeleccionarRespuesta = (respuestaId, esCorrecta) => {
    setRespuestaSeleccionada({ id: respuestaId, correcta: esCorrecta });
  };

  const handleSiguientePregunta = () => {
    setRespuestaSeleccionada(null);
    setMostrarPregunta(true);
    setPreguntaActual(preguntaSiguiente)
    setPreguntaSiguiente(null)
    if (preguntaActual.indice >= totalPreguntas - 1) {
      navigate(`/finalizar/${testId}`);
    }
  };

  const handleEnviarRespuesta = async () => {
    setProcessingContinue(true)
    try {
      const response = await api.post(
        `/estudiar/?tipo=${tipo}&filtro=${filtro}&id=${id}`,
        {
          pregunta_id: preguntaActual.id,
          respuesta_id: respuestaSeleccionada?.id,
          test_id: testId
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      setPreguntaSiguiente(response.data.pregunta_actual)
      setMostrarPregunta(false);
    } catch (error) {
      console.error(error);
    } finally{
      setProcessingContinue(false)
    }
  };

  if (loading) {
    return <LoadingScreen mensaje="Cargando preguntas para estudiar..." />;
  }
  
  
  if (totalPreguntas === 0 || !preguntaActual) {
    return <div className="text-center mt-5">No hay preguntas disponibles</div>;
  }
  

  return (
    <>
      {mostrarPregunta ? (
        <PreguntaMostrar
          preguntaActual={preguntaActual}
          totalPreguntas={totalPreguntas}
          handleEnviarRespuesta={() => handleEnviarRespuesta()}
          handleSeleccionarRespuestaSuper={(respuestaId, esCorrecta) =>
            handleSeleccionarRespuesta(respuestaId, esCorrecta)
          }
          loading={processingContinue}
        />
      ) : (
        <RespuestaMostrar
          pregunta={preguntaActual}
          respuestaSeleccionada={respuestaSeleccionada}
          handleSiguientePregunta={() => handleSiguientePregunta()}
          testId={testId}
        />
      )}
    </>
  );
};

export default Estudiar;
