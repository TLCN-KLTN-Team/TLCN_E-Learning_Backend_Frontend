import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import WorkspacePage from "@/pages/workspace/WorkspacePage";

// Main routes - shared routes between multiple roles
const MainRoutes = [
  // Workspace routes - accessible by both STUDENT and TEACHER
  <Route
    key="workspace"
    path="/workspaces"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "TEACHER"]}>
        <WorkspacePage />
      </ProtectedRoute>
    }
  />,

  <Route
    key="workspace-with-params"
    path="/workspaces/:workspaceId"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "TEACHER"]}>
        <WorkspacePage />
      </ProtectedRoute>
    }
  />,

  <Route
    key="workspace-with-channel"
    path="/workspaces/:workspaceId/:channelId"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "TEACHER"]}>
        <WorkspacePage />
      </ProtectedRoute>
    }
  />,
];

export default MainRoutes;
