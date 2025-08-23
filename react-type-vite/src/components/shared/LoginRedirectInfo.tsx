import { useAuth } from "@/context/auth-context/useAuth";
import { useLocation } from "react-router-dom";

const LoginRedirectInfo = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const firstLogin = sessionStorage.getItem("firstLogin");

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-lg max-w-sm">
      <h4 className="font-semibold text-blue-800 mb-2">Debug Info</h4>
      <div className="text-sm text-blue-700 space-y-1">
        <p>
          <strong>Current Path:</strong> {location.pathname}
        </p>
        <p>
          <strong>Roles:</strong> {user.roles?.join(", ")}
        </p>
        <p>
          <strong>First Login Flag:</strong> {firstLogin || "none"}
        </p>
        <p className="text-xs mt-2 text-blue-600">
          {firstLogin === "true"
            ? "🔄 Sẽ redirect khi vào trang chính"
            : "✅ Tự do di chuyển"}
        </p>
      </div>
    </div>
  );
};

export default LoginRedirectInfo;
