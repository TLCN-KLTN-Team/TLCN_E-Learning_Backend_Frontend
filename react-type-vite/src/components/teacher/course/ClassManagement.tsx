"use client"

import type React from "react"
import { useState } from "react"
import type { CourseClassResponse } from "@/services/api/response/courseClassResponse"
import ClassListView from "./ClassListView"
import ClassStudentListView from "./ClassStudentListView"

interface ClassManagementProps {
  courseId: string
  educationalUnitId: number | null
}

const ClassManagement: React.FC<ClassManagementProps> = ({ courseId, educationalUnitId }) => {
  const [selectedClass, setSelectedClass] = useState<CourseClassResponse | null>(null)

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
