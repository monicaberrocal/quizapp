const Title = () => {
    <div className="d-flex justify-content-between align-items-center">
      {/* 📌 Botón para regresar a la lista de asignaturas */}
      <Link to="/asignaturas" className="btn i-menu i-orange">
        <i className="bi bi-arrow-left"></i>
        <span className="d-none d-md-inline ms-2">Volver a asignaturas</span>
      </Link>
  
      {/* 📌 Contenedor del título editable */}
      <div className="position-absolute start-50 translate-middle-x d-flex align-items-center">
        {editando ? (
          <input
            type="text"
            className="form-control text-center fw-bold"
            value={nuevoTitulo}
            onChange={(e) => setNuevoTitulo(e.target.value)}
            style={{ maxWidth: "400px" }}
          />
        ) : (
            <h2 className="text-center mb-0">
                {nombre ? (
                    {nombre}
                ):
                    "..."
                }
            </h2>
        )}
  
        <button
          className="btn i-menu i-orange ms-2"
          onClick={editando ? handleActualizarTitulo : () => setEditando(true)}
        >
          {editando ? (
            <i className="bi bi-check-lg"></i>
          ) : (
            <i className="bi bi-pencil-square"></i>
          )}
        </button>
      </div>
  
      {/* 📌 Botón para eliminar la asignatura */}
      <button className="btn i-menu i-orange">
        <i className="bi bi-trash3-fill"></i>
      </button>
    </div>;
  };
  
  export default Title;
  