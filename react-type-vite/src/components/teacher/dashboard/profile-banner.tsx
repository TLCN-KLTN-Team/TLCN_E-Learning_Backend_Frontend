import type React from "react"
import { useEffect, useState } from "react"
import { Star, Users, BookOpen, CheckCircle } from "lucide-react"
import { useAuth } from "../../../context/auth-context/useAuth"
import { getTeacherByUserId } from "../../../services/api/teacher/teacherApi"
import { getTeacherStatistics } from "../../../services/api/teacher/teacherStatisticsApi"
import type { TeacherResponse } from "../../../services/api/response/teacherResponse"
import type { TeacherPublicStatisticsResponse } from "../../../services/api/teacher/teacherStatisticsApi"

const ProfileBanner: React.FC = () => {
  const { user } = useAuth()
  const [teacher, setTeacher] = useState<TeacherResponse | null>(null)
  const [stats, setStats] = useState<TeacherPublicStatisticsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        console.log("No user id found")
        return
      }

      try {
        console.log("Loading teacher data for user:", user.id)
        // Load teacher info
        const teacherData = await getTeacherByUserId(user.id)
        console.log("Teacher data:", teacherData)
        setTeacher(teacherData)

        // Load statistics
        console.log("Loading statistics for teacherId:", teacherData.teacherId)
        const statsData = await getTeacherStatistics(teacherData.teacherId)
        console.log("Stats data:", statsData)
        setStats(statsData)
      } catch (error) {
        console.error("Error loading teacher data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "Teacher"
  const totalStudents = stats?.totalStudents ?? 0
  const totalCourses = stats?.totalCourses ?? 0
  const avgRating = stats?.averageCourseRating ?? 0

  return (
    <section className="pt-0">
      {/* Main banner background image */}
      <div className="w-full px-0">
        <div
          className="bg-[#066ac9] h-24 md:h-48 w-full rounded-none relative overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #066ac9 0%, #0555a1 100%), url(/placeholder.svg?height=200&width=1200&query=geometric+pattern)",
            backgroundSize: "cover, 100px 100px",
            backgroundPosition: "center, center",
            backgroundBlendMode: "overlay",
          }}
        >
          {/* Decorative pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 50%, white 2px, transparent 2px)",
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Profile banner START */}
          <div className="w-full">
            <div className="bg-transparent p-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Avatar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 md:mt-0">
                  <div className="relative -mt-3">
                    {user?.avatarUrl ? (
                      <img
                        className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                        src={user.avatarUrl}
                        alt="Teacher Profile"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-[#066ac9] to-[#0555a1] flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">
                          {teacher
                            ? `${teacher.firstName?.[0] || ""}${teacher.lastName?.[0] || ""}`.toUpperCase()
                            : "T"}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Profile info */}
                  <div className="mt-4">
                    <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2 mb-1 text-gray-800">
                      {loading ? "Loading..." : teacherName}
                      <CheckCircle className="w-5 h-5 text-[#066ac9]" />
                    </h1>
                    {!loading && (
                      <ul className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-[#f7c32e]" />
                          <span className="font-light">{avgRating.toFixed(1)}/5.0</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-[#fd7e14]" />
                          <span className="font-light">
                            {totalStudents > 1000 ? (totalStudents / 1000).toFixed(1) + "k" : totalStudents} Enrolled Students
                          </span>
                        </li>
                        <li className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-[#6f42c1]" />
                          <span className="font-light">{totalCourses} Courses</span>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Profile banner END */}

            {/* Advanced filter responsive toggler START */}
            <hr className="block xl:hidden my-4 border-gray-200 dark:border-gray-700" />
            <div className="flex xl:hidden justify-between items-center">
              <h6 className="text-lg font-bold">Menu</h6>
              <button
                className="px-4 py-2 bg-[#066ac9] text-white rounded-md hover:bg-[#0555a1] transition-colors duration-300"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasSidebar"
                aria-controls="offcanvasSidebar"
              >
                <i className="fas fa-sliders-h"></i>
              </button>
            </div>
            {/* Advanced filter responsive toggler END */}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProfileBanner
