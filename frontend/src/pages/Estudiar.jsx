import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import PreguntaMostrar from "../components/PreguntaMostrar";
import RespuestaMostrar from "../components/RespuestaMostrar";
import LoadingScreen from "../components/LoadingScreen";
import "../assets/css/styles_test.css";

const Estudiar = () => {
  const [csrfToken, setCsrfToken] = useState("");
  const { tipo, filtro, id } = useParams();
  const [preguntaActual, setPreguntaActual] = useState(null);
  // const [preguntas, setPreguntas] = useState([]);
  // const [preguntaActualIndex, setPreguntaActualIndex] = useState(0);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null);
  const [mostrarPregunta, setMostrarPregunta] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // useEffect(() => {
  //   fetchPreguntas();
  //   fetchCsrfToken();
  // }, [tipo, filtro, id]);

  useEffect(() => {
    fetchCsrfToken();
    fetchPregunta();
  }, [tipo, filtro, id]);

  const fetchCsrfToken = async () => {
    try {
      const response = await api.get("/csrf/", { withCredentials: true });
      setCsrfToken(response.data.csrfToken);
    } catch (error) {
      console.error("❌ Error obteniendo CSRF Token", error);
    }
  };

  // const fetchPreguntas = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await api.get(`/estudiar?tipo=${tipo}&filtro=${filtro}&id=${id}`, {
  //       withCredentials: true,
  //     });
  //     setPreguntas(response.data);
  //   } catch (error) {
  //     console.error(error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchPregunta = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/estudiar?tipo=${tipo}&filtro=${filtro}&id=${id}`,
        { withCredentials: true },
      );
      setPreguntaActual({
        ...response.data.pregunta,
        numero_actual: response.data.numero_actual,
        total: response.data.total,
      });
    } catch (error) {
      console.error("Error al cargar pregunta", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarRespuesta = (respuestaId, esCorrecta) => {
    setRespuestaSeleccionada({ id: respuestaId, correcta: esCorrecta });
  };

  // const handleSiguientePregunta = () => {
  //   setRespuestaSeleccionada(null);
  //   setMostrarPregunta(true);
  //   if (preguntaActualIndex < preguntas.length - 1) {
  //     setPreguntaActualIndex(preguntaActualIndex + 1);
  //   } else {
  //     navigate(`/finalizar/${tipo}/${filtro}/${id}`);
  //   }
  // };

  const handleSiguientePregunta = () => {
    setRespuestaSeleccionada(null);
    setMostrarPregunta(true);
    fetchPregunta();
  };

  // const handleEnviarRespuesta = async () => {
  //   try {
  //     await api.post(
  //       `/estudiar/?tipo=${tipo}&filtro=${filtro}&id=${id}`,
  //       {
  //         pregunta_id: preguntaActual.id,
  //         respuesta_id: respuestaSeleccionada?.id,
  //       },
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //           "X-CSRFToken": csrfToken,
  //         },
  //         withCredentials: true,
  //       }
  //     );
  //   } catch (error) {
  //     console.error(error);
  //   }
  //   setMostrarPregunta(false);
  // };

  const handleEnviarRespuesta = async () => {
    try {
      await api.post(
        `/estudiar/`,
        {
          pregunta_id: preguntaActual.id,
          respuesta_id: respuestaSeleccionada?.id,
          tipo,
          filtro,
          id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        },
      );
      setMostrarPregunta(false);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <LoadingScreen mensaje="Cargando preguntas para estudiar..." />;
  }

  // if (!preguntas.length) {
  //   return <div className="text-center mt-5">No hay preguntas disponibles</div>;
  // }

  if (!preguntaActual) {
    return <div className="text-center mt-5">No hay preguntas disponibles</div>;
  }

  // const preguntaActual = preguntas[preguntaActualIndex];

  return (
    <>
      {mostrarPregunta ? (
        // <PreguntaMostrar
        //   preguntaActual={preguntaActual}
        //   preguntaActualIndex={preguntaActualIndex + 1}
        //   totalPreguntas={preguntas.length}
        //   handleEnviarRespuesta={() => handleEnviarRespuesta()}
        //   handleSeleccionarRespuestaSuper={(respuestaId, esCorrecta) =>
        //     handleSeleccionarRespuesta(respuestaId, esCorrecta)
        //   }
        // />
        <PreguntaMostrar
          preguntaActual={preguntaActual}
          handleEnviarRespuesta={handleEnviarRespuesta}
          handleSeleccionarRespuestaSuper={handleSeleccionarRespuesta}
        />
      ) : (
        <RespuestaMostrar
          pregunta={preguntaActual}
          respuestaSeleccionada={respuestaSeleccionada}
          handleSiguientePregunta={handleSiguientePregunta}
          tipo={tipo}
          filtro={filtro}
          id={id}
        />
      )}
    </>
  );
};

export default Estudiar;
