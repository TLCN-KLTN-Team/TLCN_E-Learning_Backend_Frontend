import { useContext } from "react";
import { EducationUnitContext } from "@/context/register-education-unit-context";
import type { EducationUnitContextType } from "@/context/register-education-unit-context";

export const useEducationUnit = (): EducationUnitContextType => {
  const context = useContext(EducationUnitContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};