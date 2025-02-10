import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/img/logo_reducido.png";
import Logout from "./Logout";

const Navbar = () => {
  const { isAuthenticated, username } = useContext(AuthContext);

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img className="logo_reducido" src={logo} alt="Logo" />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {isAuthenticated && (
            <div className="navbar-nav ms-auto">
              <Link className="nav-item nav-link" to="/asignaturas">Asignaturas</Link>
              {/* <Link className="nav-item nav-link" to="/temas">Temas</Link> */}
            </div>
          )}
          <div className="navbar-nav ms-auto">
            {isAuthenticated ? (
              <>
                <span className="navbar-text">Hola, {username}!</span>
                <div className="ms-3">
                  <Logout />
                </div>
              </>
            ) : (
              <>
                <Link className="nav-item nav-link btn my-btn" to="/register">Registrarse</Link>
                <Link className="nav-item nav-link btn my-btn" to="/login">Iniciar sesión</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
