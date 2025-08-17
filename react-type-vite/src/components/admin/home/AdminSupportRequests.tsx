import type React from "react"

const AdminSupportRequests: React.FC = () => {
  const requests = [
    { id: 1, user: "John Doe", subject: "Payment Issue", time: "2 hours ago", priority: "high" },
    { id: 2, user: "Jane Smith", subject: "Course Access", time: "4 hours ago", priority: "medium" },
    { id: 3, user: "Mike Johnson", subject: "Technical Problem", time: "6 hours ago", priority: "low" },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg font-semibold text-gray-900">Support Requests</h5>
        <button className="text-blue-600 hover:text-blue-800 text-sm">View All</button>
      </div>
      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h6 className="font-medium text-gray-900">{request.user}</h6>
              <p className="text-sm text-gray-600">{request.subject}</p>
              <span className="text-xs text-gray-500">{request.time}</span>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                request.priority === "high"
                  ? "bg-red-100 text-red-800"
                  : request.priority === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
              }`}
            >
              {request.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminSupportRequests
