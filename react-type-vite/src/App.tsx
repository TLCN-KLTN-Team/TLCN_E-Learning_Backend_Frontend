import { Route, Routes } from "react-router-dom";
import Home from "./pages/student/home/Home";
import AuthPage from "./pages/student/auth/AuthPage";
import { useTokenExpiry } from "./hooks/useTokenExpiry";
import Authenticate from "./pages/student/auth/Authenticate";

function App() {
  // Khởi tạo token expiry monitoring
  useTokenExpiry();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<AuthPage isLoggin={true} />} />
      <Route path="/register" element={<AuthPage isLoggin={false} />} />
      <Route path="/auth/callback" element={<Authenticate />} />
      {/* Add other routes as needed */}
    </Routes>
  );
}

export default App;
