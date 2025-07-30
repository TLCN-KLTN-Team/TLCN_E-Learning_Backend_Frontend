import { Route, Routes } from "react-router-dom";
import Home from "./pages/student/home/Home";
import RegisterPage from "./components/student/auth/RegisterPage";
import AuthPage from "./pages/student/auth/AuthPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}

export default App;
