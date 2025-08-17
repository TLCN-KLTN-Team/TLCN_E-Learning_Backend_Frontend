"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface CounterProps {
  end: number
  duration?: number
  suffix?: string
}

const Counter: React.FC<CounterProps> = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      setCount(Math.floor(progress * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    const timer = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate)
    }, 200)

    return () => {
      clearTimeout(timer)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [end, duration])

  return (
    <span>
      {count}
      {suffix}
    </span>
  )
}

const AdminStatsCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Completed Courses */}
      <div className="bg-orange-50 rounded-lg p-6 border border-orange-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1 purecounter">
              <Counter end={1958} />
            </h2>
            <span className="text-gray-600 text-sm font-medium">Completed Courses</span>
          </div>
          <div className="w-14 h-14 bg-orange-400 rounded-full flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1 purecounter">
              <Counter end={1600} />
            </h2>
            <span className="text-gray-600 text-sm font-medium">Enrolled Courses</span>
          </div>
          <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Course In Progress */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1 purecounter">
              <Counter end={1235} />
            </h2>
            <span className="text-gray-600 text-sm font-medium">Course In Progress</span>
          </div>
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Total Watch Time */}
      <div className="bg-green-50 rounded-lg p-6 border border-green-100">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-baseline">
              <h2 className="text-3xl font-bold text-gray-900 mb-1 purecounter">
                <Counter end={845} />
              </h2>
              <span className="text-2xl font-bold text-gray-900 ml-1">hrs</span>
            </div>
            <span className="text-gray-600 text-sm font-medium">Total Watch Time</span>
          </div>
          <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminStatsCards
