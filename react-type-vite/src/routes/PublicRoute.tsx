import { Route } from "react-router-dom";
import Home from "../pages/student/home/Home";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import GoogleAuthenticate from "../pages/auth/GoogleAuthenticate";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import Contact from "../pages/student/home/Contact";
import EducationUnitRegistration from "../pages/student/home/EducationUnitRegistration";
import FacebookAuthenticate from "@/pages/auth/FacebookAuthenticate";
import Courses from "@/pages/user/Courses";
import CourseDetail from "@/pages/user/course/CourseDetail";
import TeacherDetail from "@/pages/user/course/TeacherDetail";
import DetailEducationalUnit from "@/pages/user/universitry/DetailEducationalUnit";
import AboutUs from "@/pages/user/home/AboutUs";
import ForumHome from "@/pages/forum/ForumHome";
import ForumCreatePost from "@/pages/forum/ForumCreatePost";
import ForumBookmarkedPosts from "@/pages/forum/ForumBookmarkedPosts";
import ForumPostDetail from "@/pages/forum/ForumPostDetail";
import CertificateVerificationPage from "@/pages/public/CertificateVerificationPage";

import ForumLayout from "@/layouts/ForumLayout";
import {
  PUBLIC_ROUTES,
  FORUM_ROUTES,
  ROUTE_PATTERNS,
} from "@/constants/routes";

// Public routes - accessible by anonymous users
const PublicRoutes = [
  <Route key="home" path={PUBLIC_ROUTES.HOME} element={<Home />} />,
  <Route key="login" path={PUBLIC_ROUTES.LOGIN} element={<LoginPage />} />,
  <Route
    key="register"
    path={PUBLIC_ROUTES.REGISTER}
    element={<RegisterPage />}
  />,
  <Route
    key="google-auth-callback"
    path={PUBLIC_ROUTES.GOOGLE_AUTH_CALLBACK}
    element={<GoogleAuthenticate />}
  />,
  <Route
    key="facebook-auth-callback"
    path={PUBLIC_ROUTES.FACEBOOK_AUTH_CALLBACK}
    element={<FacebookAuthenticate />}
  />,
  <Route
    key="forgot-password"
    path={PUBLIC_ROUTES.FORGOT_PASSWORD}
    element={<ForgotPasswordPage />}
  />,
  <Route key="about-us" path={PUBLIC_ROUTES.ABOUT_US} element={<AboutUs />} />,
  <Route key="contact" path={PUBLIC_ROUTES.CONTACT} element={<Contact />} />,
  <Route
    key="education-unit-registration"
    path={PUBLIC_ROUTES.REGISTER_EDUCATION_UNIT}
    element={<EducationUnitRegistration />}
  />,

  // All user accessible routes can be added here
  <Route key="courses" path={PUBLIC_ROUTES.COURSES} element={<Courses />} />,
  <Route
    key="course-detail-alt"
    path={ROUTE_PATTERNS.COURSE_DETAIL}
    element={<CourseDetail />}
  />,
  <Route
    key="teacher-detail"
    path={ROUTE_PATTERNS.TEACHER_DETAIL}
    element={<TeacherDetail />}
  />,
  <Route
    key="educational-unit-detail"
    path={ROUTE_PATTERNS.EDUCATIONAL_UNIT_DETAIL}
    element={<DetailEducationalUnit />}
  />,
  <Route
    key="certificate-verify"
    path={ROUTE_PATTERNS.CERTIFICATE_VERIFY}
    element={<CertificateVerificationPage />}
  />,
  <Route
    key="certificate-verify-base"
    path={PUBLIC_ROUTES.CERTIFICATE_VERIFY_BASE}
    element={<CertificateVerificationPage />}
  />,

  // Forum Routes
  <Route key="forum-layout" element={<ForumLayout />}>
    <Route path={FORUM_ROUTES.HOME} element={<ForumHome />} />
    <Route path={FORUM_ROUTES.CREATE} element={<ForumCreatePost />} />
    <Route path={FORUM_ROUTES.BOOKMARKS} element={<ForumBookmarkedPosts />} />
    <Route
      path={ROUTE_PATTERNS.FORUM_POST_DETAIL}
      element={<ForumPostDetail />}
    />
  </Route>,
];

export default PublicRoutes;
