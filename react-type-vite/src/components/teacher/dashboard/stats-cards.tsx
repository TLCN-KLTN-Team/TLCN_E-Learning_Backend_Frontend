"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { TrendingUp, Users, BookOpen } from "lucide-react"

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
  const coursesCountRef = useCounterAnimation(25, 2000)
  const studentsCountRef = useCounterAnimation(12, 2200)
  const enrolledCountRef = useCounterAnimation(95, 2400)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2 font-medium">Total Courses</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              <span ref={coursesCountRef}>0</span>
            </h3>
            <p className="text-xs text-blue-600 font-semibold">+2 this month</p>
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
              <span ref={studentsCountRef}>0</span>
              <span className="text-lg">k+</span>
            </h3>
            <p className="text-xs text-purple-600 font-semibold">Growing daily</p>
          </div>
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2 font-medium">Active Enrollment Rate</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              <span ref={enrolledCountRef}>0</span>
              <span className="text-lg">%</span>
            </h3>
            <p className="text-xs text-green-600 font-semibold">Excellent performance</p>
          </div>
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsCards
