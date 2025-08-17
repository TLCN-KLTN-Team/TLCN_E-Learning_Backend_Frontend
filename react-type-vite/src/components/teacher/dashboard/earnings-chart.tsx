"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { ArrowUp, ArrowDown } from "lucide-react"

const EarningsChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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

    // Sample data for earnings chart
    const data = [28000, 30000, 25000, 32000, 35000, 33000, 35000]
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]

    // Chart dimensions
    const padding = 60
    const chartWidth = canvas.width - 2 * padding
    const chartHeight = canvas.height - 2 * padding

    // Find min and max values
    const minValue = Math.min(...data)
    const maxValue = Math.max(...data)
    const valueRange = maxValue - minValue

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
      ctx.fillText(label, x, canvas.height - padding + 20)
    })

    // Draw y-axis labels
    ctx.textAlign = "right"
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange / 5) * (5 - i)
      const y = padding + (chartHeight / 5) * i
      ctx.fillText(`$${Math.round(value / 1000)}k`, padding - 10, y + 4)
    }
  }, [])

  return (
    <div className="mt-5">
      <div className="bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Content */}
          <div className="sm:col-span-1 md:col-span-1">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-900 text-white rounded">
              Current Month
            </span>
            <h4 className="text-3xl font-bold text-blue-600 my-2">$35000</h4>
            <p className="mb-0 text-sm">
              <span className="text-green-600 font-medium inline-flex items-center mr-1">
                0.20% <ArrowUp className="w-3 h-3 ml-1" />
              </span>
              vs last month
            </p>
          </div>
          {/* Content */}
          <div className="sm:col-span-1 md:col-span-1">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-900 text-white rounded">
              Last Month
            </span>
            <h4 className="text-3xl font-bold my-2">$28000</h4>
            <p className="mb-0 text-sm">
              <span className="text-red-600 font-medium inline-flex items-center mr-1">
                0.10% <ArrowDown className="w-3 h-3 ml-1" />
              </span>
              Then last month
            </p>
          </div>
        </div>

        <div
          ref={chartRef}
          className="mt-6 h-80 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4"
        >
          {/* Chart will be rendered here */}
        </div>
      </div>
    </div>
  )
}

export default EarningsChart
