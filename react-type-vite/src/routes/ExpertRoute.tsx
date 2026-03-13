import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import PendingCoursesPage from "@/pages/expert/PendingCoursesPage"; // Potentially unused
import CourseApprovalDetailPage from "@/pages/expert/CourseApprovalDetailPage";
import CourseListPage from "@/pages/expert/CourseListPage";
import ExpertLayout from "@/components/expert/home/ExpertLayout";
import { EXPERT_ROUTES } from "@/constants/routes";
import EquivalentCourseManagementPage from "@/pages/expert/EquivalentCourseManagementPage";
import CreditTransferApprovalPage from "@/pages/expert/CreditTransferApprovalPage";

// Expert routes - protected routes for expert roles
const ExpertRoutes = [
  <Route
    key="expert-layout"
    path={`${EXPERT_ROUTES.BASE}/*`}
    element={
      <ProtectedRoute allowedRoles={["EXPERT", "SUPER_ADMIN"]}>
        <ExpertLayout />
      </ProtectedRoute>
    }
  >
    {/* Default route - could be PendingCoursesPage or dedicated dashboard */}
    <Route index element={<PendingCoursesPage />} />
    <Route path="courses" element={<CourseListPage />} />
    <Route path="published-courses" element={<PendingCoursesPage />} />
    <Route
        key="expert-layout"
        path="/expert/*"
        element={
            <ProtectedRoute allowedRoles={["EXPERT", "SUPER_ADMIN"]}>
                <ExpertLayout />
            </ProtectedRoute>
        }
    >
        {/* Default route */}
        <Route index element={<PendingCoursesPage />} />

        {/* Course Routes */}
        <Route path="courses" element={<CourseListPage />} />
        <Route path="equivalent-courses" element={<EquivalentCourseManagementPage />} />
        <Route path="credit-transfers" element={<CreditTransferApprovalPage />} />
        <Route path="published-courses" element={<PendingCoursesPage />} />

        <Route
            path="published-courses/:publishedCourseId"
            element={<CourseApprovalDetailPage />}
        />
    </Route>,

  </Route>,
];

export default ExpertRoutes;
