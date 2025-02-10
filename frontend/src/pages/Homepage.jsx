import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/img/logo_completo.png";

const Homepage = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 text-center mt-3">
          <img className="img-fluid mb-4" src={logo} alt="Logo" />
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-md-9 text-center mt-3">
          {isAuthenticated ? (
            <h1 className="mb-4">Acceder a todo tu contenido:</h1>
          ) : (
            <h1 className="mb-4">Inicia sesión para poder acceder a todo el contenido</h1>
          )}
        </div>
      </div>

      <div className="row justify-content-center">
        <Link className="btn btn-primary mx-2" to="/pruebas">
          <h4>Probar</h4>
        </Link>
        <button id="ejecutarTarea">Ejecutar Tarea</button>
      </div>

      <div className="d-flex justify-content-center mt-3">
        {isAuthenticated ? (
          <>
            <Link className="btn btn-primary mx-2" to="/asignaturas">
              <h4>Mis asignaturas</h4>
            </Link>
            {/* <Link className="btn btn-primary mx-2" to="/temas">
              <h4>Mis temas</h4>
            </Link> */}
          </>
        ) : (
          <>
            <Link className="btn btn-primary mx-2" to="/register">
              <h4>Registrarse</h4>
            </Link>
            <Link className="btn btn-primary mx-2" to="/login">
              <h4>Iniciar sesión</h4>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Homepage;
