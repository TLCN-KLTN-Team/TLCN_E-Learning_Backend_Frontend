"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { TrendingUp, Users, BookOpen, Wallet } from "lucide-react"
import { useAuth } from "../../../context/auth-context/useAuth"
import { getTeacherByUserId } from "../../../services/api/teacher/teacherApi"
import { getTeacherRevenue } from "../../../services/api/teacher/revenueApi"
import { getTeacherStatistics } from "../../../services/api/teacher/teacherStatisticsApi"
import type { TeacherRevenueResponse } from "../../../services/api/teacher/revenueApi"
import type { TeacherPublicStatisticsResponse } from "../../../services/api/teacher/teacherStatisticsApi"

const useCounterAnimation = (end: number, duration = 2000) => {
  const countRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const element = countRef.current
    if (!element) return

    let startTime: number
    const startValue = 0

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      const currentValue = Math.floor(progress * (end - startValue) + startValue)
      element.textContent = currentValue.toString()

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [end, duration])

  return countRef
}

const StatsCards: React.FC = () => {
  const { user } = useAuth()
  const [revenue, setRevenue] = useState<TeacherRevenueResponse | null>(null)
  const [stats, setStats] = useState<TeacherPublicStatisticsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const coursesRef = useCounterAnimation(stats?.totalCourses ?? 0, 2000)
  const studentsRef = useCounterAnimation(stats?.totalStudents ?? 0, 2200)
  const revenueRef = useCounterAnimation(Math.round((revenue?.totalRevenue ?? 0) / 1000), 2400)

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
  const totalRevenue = revenue?.totalRevenue ?? 0
  const totalSettled = revenue?.totalSettled ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2 font-medium">Total Courses</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? "..." : totalCourses}
            </h3>
            <p className="text-xs text-blue-600 font-semibold">Published</p>
          </div>
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2 font-medium">Total Students</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? "..." : totalStudents > 1000 ? (totalStudents / 1000).toFixed(1) : totalStudents}
              {!loading && totalStudents > 1000 && <span className="text-lg">k+</span>}
            </h3>
            <p className="text-xs text-purple-600 font-semibold">Enrolled</p>
          </div>
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2 font-medium">Total Revenue</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? "..." : totalRevenue > 1000000 ? (totalRevenue / 1000000).toFixed(1) + "M" : (totalRevenue / 1000).toFixed(0) + "k"}
            </h3>
            <p className="text-xs text-green-600 font-semibold">All time</p>
          </div>
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2 font-medium">Settled Revenue</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? "..." : totalSettled > 1000000 ? (totalSettled / 1000000).toFixed(1) + "M" : (totalSettled / 1000).toFixed(0) + "k"}
            </h3>
            <p className="text-xs text-orange-600 font-semibold">Paid out</p>
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
