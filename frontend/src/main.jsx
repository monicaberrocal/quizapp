import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./assets/css/styles.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import '@fortawesome/fontawesome-free/css/all.min.css';

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { SyncProvider } from "./context/SyncContext";

import $ from "jquery";
window.$ = window.jQuery = $;

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <SyncProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SyncProvider>
  </AuthProvider>
);