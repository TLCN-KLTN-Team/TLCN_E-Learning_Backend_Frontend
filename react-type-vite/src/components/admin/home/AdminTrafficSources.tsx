import type React from "react"

const AdminTrafficSources: React.FC = () => {
  const trafficSources = [
    { source: "Direct", visitors: 2450, percentage: 45, color: "bg-blue-500" },
    { source: "Google Search", visitors: 1890, percentage: 35, color: "bg-green-500" },
    { source: "Social Media", visitors: 680, percentage: 12, color: "bg-purple-500" },
    { source: "Referrals", visitors: 430, percentage: 8, color: "bg-orange-500" },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg font-semibold text-gray-900">Traffic Sources</h5>
        <button className="text-blue-600 hover:text-blue-800 text-sm">View Report</button>
      </div>
      <div className="space-y-4">
        {trafficSources.map((source, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${source.color}`}></div>
              <span className="font-medium text-gray-900">{source.source}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">{source.visitors.toLocaleString()}</div>
              <div className="text-sm text-gray-600">{source.percentage}%</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
          {trafficSources.map((source, index) => (
            <div key={index} className={source.color} style={{ width: `${source.percentage}%` }}></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminTrafficSources
