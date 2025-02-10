import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Homepage from "./pages/Homepage";
import Register from "./pages/Register";
import RegisterSuccess from "./pages/RegisterSuccess";
import ActivateAccount from "./pages/ActivateAccount";
import Login from "./pages/Login";
// import Asignaturas from "./pages/Asignaturas-borrar";
import Asignaturas from "./pages/Asignaturas";

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
        {/* <Route path="/temas" element={<Temas />} /> */}
      </Routes>
    </Layout>
  );
}

export default App;
