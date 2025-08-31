import { useContext } from "react";
import { AdminContext } from "@/context/admin-context";
import type { AdminContextType } from "@/context/admin-context";

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};