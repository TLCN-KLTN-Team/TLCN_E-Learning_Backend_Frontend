import { Route } from "react-router-dom";
import Home from "../pages/student/home/Home";
import AuthPage from "../pages/student/auth/AuthPage";
import GoogleAuthenticate from "../pages/student/auth/GoogleAuthenticate";
import ForgotPasswordPage from "../pages/student/auth/ForgotPasswordPage";
import Contact from "../pages/student/home/Contact";
import EducationUnitRegistration from "../pages/student/home/EducationUnitRegistration";
import FacebookAuthenticate from "@/pages/student/auth/FacebookAuthenticate";
import Courses from "@/pages/user/Courses";
import CourseDetail from "@/pages/user/course/CourseDetail";
import Payment from "@/pages/user/payment/Payment";
import VNPayReturn from "@/pages/user/payment/VNPayReturn";
import PaypalReturn from "@/pages/user/payment/PaypalReturn";
import Cart from "@/pages/user/cart/Cart";
import MyCourses from "@/pages/user/my-courses/MyCourses";
import Wishlist from "@/pages/user/wishlist/Wishlist";

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
    key="google-auth-callback"
    path="/auth/google/callback/"
    element={<GoogleAuthenticate />}
  />,
  <Route
    key="facebook-auth-callback"
    path="/auth/facebook/callback/"
    element={<FacebookAuthenticate />}
  />,
  <Route
    key="forgot-password"
    path="/forgot-password"
    element={<ForgotPasswordPage />}
  />,
  <Route key="contact" path="/contact" element={<Contact />} />,
  <Route
    key="education-unit-registration"
    path="/register-education-unit"
    element={<EducationUnitRegistration />}
  />,

  // All user accessible routes can be added here
  <Route path={`/courses`} element={<Courses />} />,
  <Route path="/courses/course/:courseId" element={<CourseDetail />} />,
  <Route
    path="/payment/checkout/express/course/:courseId"
    element={<Payment />}
  />,
  <Route path="/payment/checkout/cart" element={<Payment />} />,
  <Route
    path="/payment/checkout/express/vnpay/return"
    element={<VNPayReturn />}
  />,
  <Route
    path="/payment/checkout/express/paypal/return"
    element={<PaypalReturn />}
  />,

  <Route path="/cart" element={<Cart />} />,
  <Route path="/wishlist" element={<Wishlist />} />,
  <Route path="/my-courses" element={<MyCourses />} />,
];

export default PublicRoutes;
