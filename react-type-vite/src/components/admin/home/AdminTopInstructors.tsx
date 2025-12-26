import React, { useEffect, useMemo, useState } from "react"
import educationUnitApi from "../../../services/api/admin/educationUnitApi"
import { getPublishedCourses } from "../../../services/api/admin/adminPublishedCourseApi"
import type { PublishedCourseResponse } from "../../../services/api/response/publishedCourseResponse"

type InstructorStat = {
  id: string
  name: string
  courses: number
  students: number
  avatar?: string
}

const AdminTopInstructors: React.FC = () => {
  const [publishedCourses, setPublishedCourses] = useState<PublishedCourseResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const edu = await educationUnitApi.getMyEducationalUnit()
        const page = await getPublishedCourses(edu.id, 2, 0, 200) // status=2 Approved, size=200
        console.table(
          (page.content || []).map((pc) => ({
            course: pc.course?.courseName,
            teacherId: pc.course?.teacher?.id || pc.course?.idTeacher,
            socialUrl: pc.course?.teacher?.avatarUrl,
          }))
        )
        setPublishedCourses(page.content || [])
      } catch (err) {
        console.error("Không tải được danh sách khóa học đã publish:", err)
        setPublishedCourses([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const instructors = useMemo<InstructorStat[]>(() => {
    const map = new Map<string, InstructorStat>()
    publishedCourses.forEach((pc) => {
      const teacher = pc.course?.teacher
      const teacherId = teacher?.id || pc.course?.idTeacher
      if (!teacherId) return

      const fullName = teacher?.firstName || teacher?.lastName
        ? `${teacher?.firstName || ""} ${teacher?.lastName || ""}`.trim()
        : pc.course?.teacher?.username || "Giảng viên"

      const currentStudents = pc.course?.currentStudents ?? 0

      if (!map.has(teacherId)) {
        map.set(teacherId, {
          id: teacherId,
          name: fullName,
          courses: 0,
          students: 0,
          avatar: teacher?.avatarUrl,
        })
      }

      const stat = map.get(teacherId)!
      stat.courses += 1
      stat.students += currentStudents
    })

    return Array.from(map.values()).sort((a, b) => b.students - a.students || b.courses - a.courses).slice(0, 5)
  }, [publishedCourses])

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg font-semibold text-gray-900">Top Instructors</h5>
        <button className="text-blue-600 hover:text-blue-800 text-sm">View All</button>
      </div>
      {loading ? (
        <div className="text-sm text-gray-600">Đang tải...</div>
      ) : instructors.length === 0 ? (
        <div className="text-sm text-gray-600">Chưa có khóa học đã publish</div>
      ) : (
        <div className="space-y-4">
          {instructors.map((instructor) => (
            <div key={instructor.id} className="flex items-center space-x-3">
              <img
                src={instructor.avatar || "/placeholder.svg"}
                alt={instructor.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <h6 className="font-medium text-gray-900">{instructor.name}</h6>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{instructor.courses} khóa</span>
                  <span>{instructor.students} học viên</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminTopInstructors
