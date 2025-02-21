import React from "react";

const PreguntaItem = ({ pregunta, handleEliminarPregunta }) => {
  return (
    <div className="accordion-item">
      <div className="accordion-header d-flex justify-content-between align-items-center pr-3">
        <button
          className="accordion-button collapsed flex-grow-1 text-start"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#collapse${pregunta.id}`}
          aria-expanded="false"
          aria-controls={`collapse${pregunta.id}`}
        >
          {pregunta.texto}
        </button>

        <button className="btn ms-auto" onClick={() => handleEliminarPregunta(pregunta.id)}>
          <i className="bi bi-trash3-fill i-orange i-menu-sm btn"></i>
        </button>
      </div>

      <div id={`collapse${pregunta.id}`} className="accordion-collapse collapse">
        <div className="accordion-body">
          <ul className="list-group">
            {pregunta.respuestas.map((respuesta, index) => (
              <li
                key={index}
                className={`list-group-item ${respuesta.id === pregunta.respuesta_correcta ? "respuesta-correcta text-success" : ""}`}
              >
                {respuesta.texto}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PreguntaItem;
