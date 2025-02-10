import React, { useEffect, useState } from "react";
import api from "../api";

const Temas = () => {
  const [temasPorAsignatura, setTemasPorAsignatura] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTemas();
  }, []);

  const fetchTemas = async () => {
    try {
      const response = await api.get("/temas/", { withCredentials: true });
      setTemasPorAsignatura(response.data);
    } catch (error) {
      setError("Error al cargar los temas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center">Mis Temas</h2>

      {error && <p className="alert alert-danger text-center">{error}</p>}

      {loading ? (
        <p className="text-center">Cargando temas...</p>
      ) : (
        <div className="accordion" id="accordionTemas">
          {temasPorAsignatura.length === 0 ? (
            <p className="text-center">No hay temas disponibles.</p>
          ) : (
            temasPorAsignatura.map((asignatura, index) => (
              <div className="accordion-item" key={index}>
                <h2 className="accordion-header" id={`heading-${index}`}>
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#collapse-${index}`}
                    aria-expanded="false"
                    aria-controls={`collapse-${index}`}
                  >
                    {asignatura.asignatura}
                  </button>
                </h2>
                <div
                  id={`collapse-${index}`}
                  className="accordion-collapse collapse"
                  aria-labelledby={`heading-${index}`}
                  data-bs-parent="#accordionTemas"
                >
                  <div className="accordion-body">
                    <ul className="list-group">
                      {asignatura.temas.map((tema) => (
                        <li key={tema.id} className="list-group-item">
                          {tema.nombre}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Temas;
