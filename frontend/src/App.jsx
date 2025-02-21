import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Homepage from "./pages/Homepage";
import Register from "./pages/Register";
import RegisterSuccess from "./pages/RegisterSuccess";
import ActivateAccount from "./pages/ActivateAccount";
import Login from "./pages/Login";
import Asignaturas from "./pages/Asignaturas";
import Tema from "./pages/Tema"
import Asignatura from "./pages/Asignatura"
import Estudiar from "./pages/Estudiar";
import FinalizarTest from "./pages/Finalizar";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-success" element={<RegisterSuccess />} />
        <Route path="/activar/:token" element={<ActivateAccount />} />
        <Route path="/login" element={<Login />} />
        <Route path="/asignaturas" element={<Asignaturas />} />
        <Route path="/temas/:temaId" element={<Tema />} />
        <Route path="/asignaturas/:asignaturaId" element={<Asignatura />} />
        <Route path="/cuestionario/:tipo/:filtro/:id" element={<Estudiar />} />
        <Route path="/finalizar" element={<FinalizarTest />} />
      </Routes>
    </Layout>
  );
}

export default App;
