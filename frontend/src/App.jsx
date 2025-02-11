import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Homepage from "./pages/Homepage";
import Register from "./pages/Register";
import RegisterSuccess from "./pages/RegisterSuccess";
import ActivateAccount from "./pages/ActivateAccount";
import Login from "./pages/Login";
import Asignaturas from "./pages/Asignaturas";
import Tema from "./pages/Tema"

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
      </Routes>
    </Layout>
  );
}

export default App;
