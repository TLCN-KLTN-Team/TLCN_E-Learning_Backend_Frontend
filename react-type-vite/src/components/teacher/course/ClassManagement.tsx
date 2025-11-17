"use client"

import type React from "react"
import ClassListView from "./ClassListView"
import ClassStudentListView from "./ClassStudentListView"
import { useSelectedClass } from "@/context/teacher/SelectedClassContext"

interface ClassManagementProps {
  courseId: string
  educationalUnitId: number | null
}

const ClassManagement: React.FC<ClassManagementProps> = ({ courseId, educationalUnitId }) => {
  const { selectedClass, setSelectedClass } = useSelectedClass()

  if (selectedClass) {
    return (
      <ClassStudentListView
        classData={selectedClass}
        courseId={courseId}
        educationalUnitId={educationalUnitId ?? 1}
        onBack={() => setSelectedClass(null)}
      />
    )
  }

  return (
    <ClassListView
      courseId={courseId}
      educationalUnitId={educationalUnitId ?? 0}
      onSelectClass={setSelectedClass}
    />
  )
}

export default ClassManagement
