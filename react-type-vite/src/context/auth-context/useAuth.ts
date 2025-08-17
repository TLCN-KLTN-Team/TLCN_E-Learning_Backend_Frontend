import { useContext } from "react";
import { AuthContext } from "./context";

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log("Có vào useAuth:" + context);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
