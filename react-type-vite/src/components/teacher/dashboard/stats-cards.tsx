"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { TrendingUp, Users, BookOpen, Wallet } from "lucide-react"
import { useAuth } from "../../../context/auth-context/useAuth"
import { getTeacherByUserId } from "../../../services/api/teacher/teacherApi"
import { getTeacherRevenue } from "../../../services/api/teacher/revenueApi"
import { getTeacherStatistics } from "../../../services/api/teacher/teacherStatisticsApi"
import type { TeacherRevenueResponse } from "../../../services/api/response/revenueResponse"
import type { TeacherPublicStatisticsResponse } from "../../../services/api/teacher/teacherStatisticsApi"

const StatsCards: React.FC = () => {
  const { user } = useAuth()
  const [, setRevenue] = useState<TeacherRevenueResponse | null>(null)
  const [stats, setStats] = useState<TeacherPublicStatisticsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        console.log("Stats: No user id found")
        return
      }

      try {
        console.log("Stats: Loading data for user:", user.id)
        const teacherData = await getTeacherByUserId(user.id)
        console.log("Stats: Teacher data:", teacherData)

        const [revenueData, statsData] = await Promise.all([
          getTeacherRevenue(),
          getTeacherStatistics(teacherData.teacherId),
        ])
        console.log("Stats: Revenue data:", revenueData)
        console.log("Stats: Statistics data:", statsData)

        setRevenue(revenueData)
        setStats(statsData)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  const totalCourses = stats?.totalCourses ?? 0
  const totalStudents = stats?.totalStudents ?? 0
  const totalCoursesPublish = stats?.totalCoursesPublish ?? 0
  const totalUserPublish = stats?.totalUserPublish ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2 font-medium">Tổng khóa học nội bộ</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? "..." : totalCourses}
            </h3>
            <p className="text-xs text-blue-600 font-semibold">Nội bộ</p>
          </div>
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2 font-medium">Tổng học viên nội bộ</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? "..." : totalStudents > 1000 ? (totalStudents / 1000).toFixed(1) : totalStudents}
              {!loading && totalStudents > 1000 && <span className="text-lg">k+</span>}
            </h3>
            <p className="text-xs text-purple-600 font-semibold">Học viên</p>
          </div>
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2 font-medium">Tổng khóa học thương mại</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? "..." : totalCoursesPublish}
            </h3>
            <p className="text-xs text-blue-600 font-semibold">Thương mại</p>
          </div>
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2 font-medium">Tổng học viên thương mại</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? "..." : totalUserPublish > 1000 ? (totalUserPublish / 1000).toFixed(1) : totalUserPublish}
              {!loading && totalUserPublish > 1000 && <span className="text-lg">k+</span>}
            </h3>
            <p className="text-xs text-purple-600 font-semibold">Học viên</p>
          </div>
          <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsCards
