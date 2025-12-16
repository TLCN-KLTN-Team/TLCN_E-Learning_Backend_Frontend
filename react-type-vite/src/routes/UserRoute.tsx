import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import Payment from "@/pages/user/payment/Payment";
import VNPayReturn from "@/pages/user/payment/VNPayReturn";
import PaypalReturn from "@/pages/user/payment/PaypalReturn";
import Cart from "@/pages/user/cart/Cart";
import Wishlist from "@/pages/user/wishlist/Wishlist";
import MyCourses from "@/pages/user/personal/MyCourses";
import CourseLearning from "@/pages/user/course/CourseLearning";
import UserQuizAttempt from "@/components/user/course/UserQuizAttempt";

const UserRoutes = [
  <Route
    key="payment"
    path="/payment/checkout/express/course"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <Payment />
      </ProtectedRoute>
    }
  />,

  <Route
    key="vnpay-return"
    path="/payment/checkout/express/vnpay/return"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <VNPayReturn />
      </ProtectedRoute>
    }
  />,

  <Route
    key="paypal-return"
    path="/payment/checkout/express/paypal/return"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <PaypalReturn />
      </ProtectedRoute>
    }
  />,

  <Route
    key="cart"
    path="/cart"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <Cart />
      </ProtectedRoute>
    }
  />,

  <Route
    key="wishlist"
    path="/wishlist"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <Wishlist />
      </ProtectedRoute>
    }
  />,

  <Route
    key="my-courses"
    path="/my-courses"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <MyCourses />
      </ProtectedRoute>
    }
  />,

  <Route
    key="course-learning"
    path="/course/:courseId/learn"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <CourseLearning />
      </ProtectedRoute>
    }
  />,

  <Route
    key="user-quiz"
    path="/user/quiz/:quizId"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <UserQuizAttempt />
      </ProtectedRoute>
    }
  />,
];

export default UserRoutes;
