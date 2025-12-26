"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { ArrowUp, ArrowDown } from "lucide-react"
import { useAuth } from "../../../context/auth-context/useAuth"
import { getTeacherRevenue } from "../../../services/api/teacher/revenueApi"
import type { TeacherRevenueResponse } from "../../../services/api/teacher/revenueApi"

const EarningsChart: React.FC = () => {
  const { user } = useAuth()
  const chartRef = useRef<HTMLDivElement>(null)
  const [revenue, setRevenue] = useState<TeacherRevenueResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return

      try {
        const revenueData = await getTeacherRevenue()
        setRevenue(revenueData)
      } catch (error) {
        console.error("Error loading revenue data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  useEffect(() => {
    if (!revenue?.monthlyRevenueDetails || revenue.monthlyRevenueDetails.length === 0 || !chartRef.current) {
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = 800
    canvas.height = 300
    canvas.style.width = "100%"
    canvas.style.height = "300px"
    canvas.style.maxWidth = "100%"

    const ctx = canvas.getContext("2d")
    if (!ctx || !chartRef.current) return

    // Clear previous content
    chartRef.current.innerHTML = ""
    chartRef.current.appendChild(canvas)

    // Data from API
    const monthlyData = revenue.monthlyRevenueDetails || []
    const data = monthlyData.map((m) => Number(m.revenue) || 0)
    const labels = monthlyData.map((m) => m.month.split("-")[1]) // Extract month number

    if (data.length === 0) return

    // Chart dimensions
    const padding = 60
    const chartWidth = canvas.width - 2 * padding
    const chartHeight = canvas.height - 2 * padding

    // Find min and max values
    const minValue = Math.min(...data, 0)
    const maxValue = Math.max(...data)
    const valueRange = maxValue - minValue || 1

    // Draw background
    ctx.fillStyle = "#f8fafc"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid lines
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(canvas.width - padding, y)
      ctx.stroke()
    }

    // Vertical grid lines
    for (let i = 0; i < data.length; i++) {
      const x = padding + (chartWidth / (data.length - 1)) * i
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, canvas.height - padding)
      ctx.stroke()
    }

    // Draw the line chart
    ctx.strokeStyle = "#066ac9"
    ctx.lineWidth = 3
    ctx.beginPath()

    data.forEach((value, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index
      const y = canvas.height - padding - ((value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw data points
    ctx.fillStyle = "#066ac9"
    data.forEach((value, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index
      const y = canvas.height - padding - ((value - minValue) / valueRange) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw labels
    ctx.fillStyle = "#64748b"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"

    labels.forEach((label, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index
      ctx.fillText(`M${label}`, x, canvas.height - padding + 20)
    })

    // Draw y-axis labels
    ctx.textAlign = "right"
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange / 5) * (5 - i)
      const y = padding + (chartHeight / 5) * i
      ctx.fillText(`${Math.round(value / 1000)}k`, padding - 10, y + 4)
    }
  }, [revenue])

  const currentMonth = revenue?.monthlyRevenueDetails?.[revenue.monthlyRevenueDetails.length - 1]
  const lastMonth = revenue?.monthlyRevenueDetails?.[revenue.monthlyRevenueDetails.length - 2]
  const currentRevenue = Number(currentMonth?.revenue) || 0
  const lastRevenue = Number(lastMonth?.revenue) || 0
  const percentChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0

  return (
    <div className="mt-5">
      <div className="bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
          {/* Content */}
          <div className="sm:col-span-1 md:col-span-1">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-900 text-white rounded">
              Current Month
            </span>
            <h4 className="text-3xl font-bold text-blue-600 my-2">
              {loading ? "Loading..." : `${(currentRevenue / 1000).toFixed(1)}k`}
            </h4>
            <p className="mb-0 text-sm">
              {!loading && (
                <span className={`${percentChange >= 0 ? "text-green-600" : "text-red-600"} font-medium inline-flex items-center mr-1`}>
                  {percentChange >= 0 ? "+" : ""}{percentChange.toFixed(2)}%{" "}
                  {percentChange >= 0 ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />}
                </span>
              )}
              vs last month
            </p>
          </div>
          {/* Content */}
          <div className="sm:col-span-1 md:col-span-1">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-900 text-white rounded">
              Last Month
            </span>
            <h4 className="text-3xl font-bold my-2">
              {loading ? "Loading..." : `${(lastRevenue / 1000).toFixed(1)}k`}
            </h4>
            <p className="mb-0 text-sm">
              <span className="text-gray-600 font-medium inline-flex items-center mr-1">
                Previous period
              </span>
            </p>
          </div>
        </div>

        <div
          ref={chartRef}
          className="mt-6 h-80 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4"
        >
          {loading && <div className="flex items-center justify-center h-full">Loading chart...</div>}
        </div>
      </div>
    </div>
  )
}

export default EarningsChart
