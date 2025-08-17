"use client"

import type React from "react"
import { useEffect, useRef } from "react"

const AdminEarningsChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    const data = [
      { month: "Feb", value: 2909, x: 0 },
      { month: "Mar", value: 1269, x: 1 },
      { month: "Apr", value: 950, x: 2 },
      { month: "May", value: 1563, x: 3 },
      { month: "Jun", value: 1825, x: 4 },
      { month: "Jul", value: 2526, x: 5 },
      { month: "Aug", value: 2010, x: 6 },
      { month: "Sep", value: 3260, x: 7 },
      { month: "Oct", value: 3005, x: 8 },
      { month: "Nov", value: 3680, x: 9 },
      { month: "Dec", value: 4039, x: 10 },
    ]

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    const padding = 60
    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    ctx.strokeStyle = "#e9ecef"
    ctx.lineWidth = 1
    for (let i = 0; i <= 8; i++) {
      const y = padding + (i * chartHeight) / 8
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    ctx.fillStyle = "#6c757d"
    ctx.font = "11px Arial"
    ctx.textAlign = "right"
    for (let i = 0; i <= 8; i++) {
      const value = 4500 - i * 500 // From 4500 to 0
      const y = padding + (i * chartHeight) / 8 + 4
      ctx.fillText(value.toString(), padding - 10, y)
    }

    const points = data.map((point, index) => ({
      x: padding + (index * chartWidth) / (data.length - 1),
      y: padding + chartHeight - (point.value / 4500) * chartHeight,
      value: point.value,
      month: point.month,
    }))

    ctx.fillStyle = "rgba(6, 106, 201, 0.15)"
    ctx.beginPath()
    ctx.moveTo(points[0].x, height - padding)
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y)
    })
    ctx.lineTo(points[points.length - 1].x, height - padding)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = "#066ac9"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })
    ctx.stroke()

    points.forEach((point) => {
      // Draw circle
      ctx.fillStyle = "#066ac9"
      ctx.beginPath()
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI)
      ctx.fill()

      // Draw white border around circle
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI)
      ctx.stroke()

      // Draw value label above point
      ctx.fillStyle = "#066ac9"
      ctx.font = "bold 11px Arial"
      ctx.textAlign = "center"
      ctx.fillText(point.value.toString(), point.x, point.y - 12)
    })

    ctx.fillStyle = "#6c757d"
    ctx.font = "11px Arial"
    ctx.textAlign = "center"
    points.forEach((point) => {
      ctx.fillText(point.month, point.x, height - padding + 20)
    })
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full">
      {/* Card header */}
      <div className="p-4 border-b">
        <h5 className="text-lg font-semibold text-gray-900 m-0">Earnings</h5>
      </div>

      {/* Card body */}
      <div className="p-4">
        <canvas ref={canvasRef} className="w-full h-80" style={{ maxHeight: "320px" }} />
      </div>
    </div>
  )
}

export default AdminEarningsChart
