"use client"

import React, { createContext, useContext, useState } from "react"
import type { CourseClassResponse } from "@/services/api/response/courseClassResponse"

interface SelectedClassContextType {
  selectedClass: CourseClassResponse | null
  setSelectedClass: (classData: CourseClassResponse | null) => void
}

const SelectedClassContext = createContext<SelectedClassContextType | undefined>(undefined)

export const SelectedClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedClass, setSelectedClass] = useState<CourseClassResponse | null>(null)

  return (
    <SelectedClassContext.Provider value={{ selectedClass, setSelectedClass }}>
      {children}
    </SelectedClassContext.Provider>
  )
}

export const useSelectedClass = () => {
  const context = useContext(SelectedClassContext)
  if (!context) {
    throw new Error("useSelectedClass phải được sử dụng bên trong SelectedClassProvider")
  }
  return context
}
