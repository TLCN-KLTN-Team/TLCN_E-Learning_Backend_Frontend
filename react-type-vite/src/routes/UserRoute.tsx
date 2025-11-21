import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import Payment from "@/pages/user/payment/Payment";
import VNPayReturn from "@/pages/user/payment/VNPayReturn";
import PaypalReturn from "@/pages/user/payment/PaypalReturn";
import Cart from "@/pages/user/cart/Cart";
import Wishlist from "@/pages/user/wishlist/Wishlist";
import MyCourses from "@/pages/user/personal/MyCourses";
import RoleProtectedRoute from "./protected/RoleProtectedRoute";

const UserRoutes = [
  <Route key={"payment"} element={<ProtectedRoute />}>
    <Route key={"user-protected-route"} element={<RoleProtectedRoute />}>
      {/* Add user-specific routes here */}
      <Route
        path="/payment/checkout/express/course/:courseId"
        element={<Payment />}
      />
      ,
      <Route path="/payment/checkout/cart" element={<Payment />} />,
      <Route
        path="/payment/checkout/express/vnpay/return"
        element={<VNPayReturn />}
      />
      ,
      <Route
        path="/payment/checkout/express/paypal/return"
        element={<PaypalReturn />}
      />
      ,
      <Route path="/cart" element={<Cart />} />,
      <Route path="/wishlist" element={<Wishlist />} />,
      <Route path="/my-courses" element={<MyCourses />} />,
    </Route>
  </Route>,
];

export default UserRoutes;
