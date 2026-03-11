import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import WorkspacePage from "@/pages/workspace/WorkspacePage";
import { WORKSPACE_ROUTES, ROUTE_PATTERNS } from "@/constants/routes";

// Main routes - shared routes between multiple roles
const MainRoutes = [
  // Workspace routes - accessible by both STUDENT and TEACHER
  <Route
    key="workspace"
    path={WORKSPACE_ROUTES.BASE}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "TEACHER"]}>
        <WorkspacePage />
      </ProtectedRoute>
    }
  />,

  <Route
    key="workspace-with-params"
    path={ROUTE_PATTERNS.WORKSPACE_WITH_ID}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "TEACHER"]}>
        <WorkspacePage />
      </ProtectedRoute>
    }
  />,

  <Route
    key="workspace-with-channel"
    path={ROUTE_PATTERNS.WORKSPACE_WITH_CHANNEL}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "TEACHER"]}>
        <WorkspacePage />
      </ProtectedRoute>
    }
  />,
];

export default MainRoutes;
