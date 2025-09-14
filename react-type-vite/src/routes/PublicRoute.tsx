import { Route } from "react-router-dom";
import Home from "../pages/student/home/Home";
import AuthPage from "../pages/student/auth/AuthPage";
import Authenticate from "../pages/student/auth/Authenticate";
import ForgotPasswordPage from "../pages/student/auth/ForgotPasswordPage";
import Contact from "../pages/student/home/Contact";
import EducationUnitRegistration from "../pages/student/home/EducationUnitRegistration"

// Public routes - accessible by anonymous users
const PublicRoutes = [
  <Route key="home" path="/" element={<Home />} />,
  <Route key="login" path="/login" element={<AuthPage isLoggin={true} />} />,
  <Route
    key="register"
    path="/register"
    element={<AuthPage isLoggin={false} />}
  />,
  <Route
    key="auth-callback"
    path="/auth/callback"
    element={<Authenticate />}
  />,
  <Route
    key="forgot-password"
    path="/forgot-password"
    element={<ForgotPasswordPage />}
  />,
  <Route key="contact" path="/contact" element={<Contact />} />,
  <Route key="education-unit-registration" path="/register-education-unit" element={<EducationUnitRegistration />} />,
];

export default PublicRoutes;
