"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { Monitor, GraduationCap, Gem } from "lucide-react"

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
  const studentsCountRef = useCounterAnimation(25, 2200)
  const enrolledCountRef = useCounterAnimation(12, 2400)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Counter item */}
      <div className="flex justify-center items-center p-4 bg-[#fdf3d5] dark:bg-yellow-900/15 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <span className="text-6xl text-[#f7c32e] mb-0">
          <Monitor className="w-12 h-12" />
        </span>
        <div className="ml-4">
          <div className="flex items-baseline">
            <h5 ref={coursesCountRef} className="text-2xl font-bold mb-0 text-gray-800">
              0
            </h5>
          </div>
          <span className="text-sm font-light text-gray-600 dark:text-gray-400">Total Courses</span>
        </div>
      </div>

      {/* Counter item */}
      <div className="flex justify-center items-center p-4 bg-[#f4f0ff] dark:bg-purple-900/10 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <span className="text-6xl text-[#6f42c1] mb-0">
          <GraduationCap className="w-12 h-12" />
        </span>
        <div className="ml-4">
          <div className="flex items-baseline">
            <h5 ref={studentsCountRef} className="text-2xl font-bold mb-0 text-gray-800">
              0
            </h5>
            <span className="text-xl font-bold text-gray-800">K+</span>
          </div>
          <span className="text-sm font-light text-gray-600 dark:text-gray-400">Total Students</span>
        </div>
      </div>

      {/* Counter item */}
      <div className="flex justify-center items-center p-4 bg-[#cde1f4] dark:bg-blue-900/10 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <span className="text-6xl text-[#066ac9] mb-0">
          <Gem className="w-12 h-12" />
        </span>
        <div className="ml-4">
          <div className="flex items-baseline">
            <h5 ref={enrolledCountRef} className="text-2xl font-bold mb-0 text-gray-800">
              0
            </h5>
            <span className="text-xl font-bold text-gray-800">K</span>
          </div>
          <span className="text-sm font-light text-gray-600 dark:text-gray-400">Enrolled Students</span>
        </div>
      </div>
    </div>
  )
}

export default StatsCards
