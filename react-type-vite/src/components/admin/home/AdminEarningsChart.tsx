"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import educationUnitApi from "../../../services/api/admin/educationUnitApi"

const AdminEarningsChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [internalStudentRatio, setInternalStudentRatio] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInternalStudentRatio = async () => {
      try {
        setLoading(true)
        console.log("Fetching internal student ratio...")
        const ratio = await educationUnitApi.getInternalStudentRatio()
        console.log("Tỉ lệ học của sinh viên trong đơn vị đào tạo:", ratio)
        setInternalStudentRatio(ratio)
      } catch (error) {
        console.error("Failed to fetch internal student ratio:", error)
        console.error("Error details:", error instanceof Error ? error.message : JSON.stringify(error))
        setInternalStudentRatio(0)
      } finally {
        setLoading(false)
      }
    }

    fetchInternalStudentRatio()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Retina scale
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Donut chart dimensions
    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(width, height) / 3
    const innerRadius = radius * 0.62

    // Values
    const internalPct = Math.max(0, Math.min(1, internalStudentRatio))
    const externalPct = 1 - internalPct

    // Colors
    const internalColor = "#066ac9"
    const externalColor = "#e9ecef"

    // Draw external ring (background)
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = externalColor
    ctx.lineWidth = radius - innerRadius
    ctx.stroke()

    // Draw internal arc
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + Math.PI * 2 * internalPct
    ctx.beginPath()
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.strokeStyle = internalColor
    ctx.lineCap = "round"
    ctx.lineWidth = radius - innerRadius
    ctx.stroke()

    // Middle text
    ctx.fillStyle = internalColor
    ctx.font = "bold 22px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${(internalPct * 100).toFixed(2)}%`, cx, cy - 6)

    ctx.fillStyle = "#6c757d"
    ctx.font = "12px Arial"
    ctx.fillText("Hoàn thành", cx, cy + 16)

    // Legend
    const legendX = cx
    const legendY = cy + radius + 28
    const gap = 110

    // Internal legend
    ctx.fillStyle = internalColor
    ctx.fillRect(legendX - gap, legendY - 8, 14, 14)
    ctx.fillStyle = "#334155"
    ctx.font = "12px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`Hoàn thành ${(internalPct * 100).toFixed(1)}%`, legendX - gap + 20, legendY + 3)

    // External legend
    ctx.fillStyle = externalColor
    ctx.fillRect(legendX + 10, legendY - 8, 14, 14)
    ctx.fillStyle = "#334155"
    ctx.fillText(`Chưa hoàn thành ${(externalPct * 100).toFixed(1)}%`, legendX + 30, legendY + 3)
  }, [internalStudentRatio])

  return (
    <div className="space-y-4">
      {/* Internal Student Ratio Card */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h5 className="text-lg font-semibold text-gray-900 m-0">Tỉ lệ học của sinh viên trong đơn vị đào tạo</h5>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <span className="text-gray-600">Loading...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-2">
                  Tỉ lệ trung bình sinh viên thuộc đơn vị đang học các khóa của đơn vị
                </p>
                <p className="text-gray-600 text-xs">
                  (Tỉ lệ những học viên có cùng đơn vị đào tạo học khóa của đơn vị đó)
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-blue-600">
                  {(internalStudentRatio * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Internal Ratio Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border h-full">
        {/* Card header */}
        <div className="p-4 border-b">
          <h5 className="text-lg font-semibold text-gray-900 m-0">Phân tích tỉ lệ hoàn thành</h5>
        </div>

        {/* Card body */}
        <div className="p-4">
          <canvas ref={canvasRef} className="w-full h-80" style={{ maxHeight: "320px" }} />
        </div>
      </div>
    </div>
  )
}

export default AdminEarningsChart
