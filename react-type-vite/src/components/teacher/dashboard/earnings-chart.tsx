"use client"

import React, { useEffect, useState } from "react"
import { ArrowUp, ArrowDown } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useAuth } from "../../../context/auth-context/useAuth"
import { getTeacherRevenue } from "../../../services/api/teacher/revenueApi"
import type { TeacherRevenueResponse } from "../../../services/api/response/revenueResponse"

// Format currency helper
const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  return `${(value / 1000).toFixed(1)}k`
}

// Custom Tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          Tháng {data.monthLabel}
        </p>
        <p className="text-lg font-bold text-blue-600">
          {formatCurrency(data.revenue)}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {data.orderCount} đơn hàng
        </p>
      </div>
    )
  }
  return null
}

const EarningsChart: React.FC = () => {
  const { user } = useAuth()
  const [revenue, setRevenue] = useState<TeacherRevenueResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // Load data from backend API
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

  // Prepare chart data
  const chartData = revenue?.monthlyRevenueDetails.map(item => ({
    month: item.month,
    monthLabel: item.month.split("-")[1],
    revenue: item.revenue,
    orderCount: item.orderCount
  })) || []

  // Format currency helper
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    return `${(value / 1000).toFixed(1)}k`
  }

  // Calculate statistics
  const currentMonth = revenue?.monthlyRevenueDetails?.[revenue.monthlyRevenueDetails.length - 1]
  const lastMonth = revenue?.monthlyRevenueDetails?.[revenue.monthlyRevenueDetails.length - 2]
  const currentRevenue = Number(currentMonth?.revenue) || 0
  const lastRevenue = Number(lastMonth?.revenue) || 0
  const percentChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0

  return (
    <div className="mt-5">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Current Month */}
          <div>
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full mb-3">
              Tháng hiện tại
            </span>
            <h4 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {loading ? "..." : formatCurrency(currentRevenue)}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {!loading && (
                <span className={`font-semibold inline-flex items-center ${percentChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                  {percentChange >= 0 ? "+" : ""}{percentChange.toFixed(1)}%
                  {percentChange >= 0 ?
                    <ArrowUp className="w-4 h-4 ml-1" /> :
                    <ArrowDown className="w-4 h-4 ml-1" />
                  }
                </span>
              )}
              <span className="ml-1">so với tháng trước</span>
            </p>
          </div>

          {/* Last Month */}
          <div>
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-gray-700 dark:bg-gray-600 text-white rounded-full mb-3">
              Tháng trước
            </span>
            <h4 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {loading ? "..." : formatCurrency(lastRevenue)}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kỳ trước đó
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Đang tải biểu đồ...</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="monthLabel"
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `T${value}`}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                    return `${(value / 1000).toFixed(0)}k`
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ fill: '#2563eb', r: 5 }}
                  activeDot={{ r: 7, fill: '#1d4ed8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default EarningsChart