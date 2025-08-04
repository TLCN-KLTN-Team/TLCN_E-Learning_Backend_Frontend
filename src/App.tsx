import { Route, Routes } from "react-router-dom";
import Home from "./pages/student/home/Home";
import AuthPage from "./pages/student/auth/AuthPage";
import { useTokenExpiry } from "./hooks/useTokenExpiry";
import Authenticate from "./pages/student/auth/Authenticate";
import { ThemeProvider } from "./context/theme-context";
import TeacherHomePage from "./pages/teacher/home/home";

function App() {
  // Khởi tạo token expiry monitoring
  useTokenExpiry();
  console.log("Có vào trong App.tsx");
  return (
    <ThemeProvider defaultTheme="system">
      <Routes>
        
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPage isLoggin={true} />} />
        <Route path="/register" element={<AuthPage isLoggin={false} />} />
        <Route path="/auth/callback" element={<Authenticate />} />
        <Route path="/teacher/home" element={<TeacherHomePage />} />
        {/* Add other routes as needed */}
      </Routes>
    </ThemeProvider>
  );
}

export default App;
