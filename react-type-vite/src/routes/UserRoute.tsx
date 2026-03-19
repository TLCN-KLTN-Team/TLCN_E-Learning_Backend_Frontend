import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import Payment from "@/pages/user/payment/Payment";
import VNPayReturn from "@/pages/user/payment/VNPayReturn";
import PaypalReturn from "@/pages/user/payment/PaypalReturn";
import Cart from "@/pages/user/cart/Cart";
import Wishlist from "@/pages/user/wishlist/Wishlist";
import MyCourses from "@/pages/user/personal/MyCourses";
import OrderHistoryPage from "@/pages/user/personal/OrderHistoryPage";
import CourseLearning from "@/pages/user/course/CourseLearning";
import UserQuizAttempt from "@/components/user/course/UserQuizAttempt";
import MyDocumentLibraryPage from "@/pages/student/document-library/MyDocumentLibraryPage";
import UserNotificationsPage from "@/pages/user/notifications/UserNotificationsPage";
import { USER_ROUTES, ROUTE_PATTERNS } from "@/constants/routes";

const UserRoutes = [
  <Route
    key="payment"
    path={USER_ROUTES.PAYMENT_CHECKOUT}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <Payment />
      </ProtectedRoute>
    }
  />,

  <Route
    key="vnpay-return"
    path={USER_ROUTES.VNPAY_RETURN}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <VNPayReturn />
      </ProtectedRoute>
    }
  />,

  <Route
    key="paypal-return"
    path={USER_ROUTES.PAYPAL_RETURN}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <PaypalReturn />
      </ProtectedRoute>
    }
  />,

  <Route
    key="notifications"
    path={USER_ROUTES.NOTIFICATIONS}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <UserNotificationsPage />
      </ProtectedRoute>
    }
  />,

  <Route
    key="cart"
    path={USER_ROUTES.CART}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <Cart />
      </ProtectedRoute>
    }
  />,

  <Route
    key="wishlist"
    path={USER_ROUTES.WISHLIST}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <Wishlist />
      </ProtectedRoute>
    }
  />,

  <Route
    key="my-courses"
    path={USER_ROUTES.MY_COURSES}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <MyCourses />
      </ProtectedRoute>
    }
  />,

  <Route
    key="document-library"
    path={USER_ROUTES.DOCUMENT_LIBRARY}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <MyDocumentLibraryPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="purchase-history"
    path="/purchase-history"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <OrderHistoryPage />
      </ProtectedRoute>
    }
  />,

  <Route
    key="course-learning"
    path={ROUTE_PATTERNS.COURSE_LEARNING}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <CourseLearning />
      </ProtectedRoute>
    }
  />,

  <Route
    key="user-quiz"
    path={ROUTE_PATTERNS.USER_QUIZ}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <UserQuizAttempt />
      </ProtectedRoute>
    }
  />,
];

export default UserRoutes;
