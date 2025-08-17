import type React from "react"

const AdminNoticeBoard: React.FC = () => {
  const notices = [
    {
      id: 1,
      title: "System Maintenance",
      date: "2024-01-15",
      type: "warning",
      content: "Scheduled maintenance on Jan 20th",
    },
    {
      id: 2,
      title: "New Feature Release",
      date: "2024-01-12",
      type: "info",
      content: "Course analytics dashboard is now live",
    },
    { id: 3, title: "Policy Update", date: "2024-01-10", type: "important", content: "Updated terms of service" },
    { id: 4, title: "Holiday Schedule", date: "2024-01-08", type: "info", content: "Office closed on Jan 25th" },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg font-semibold text-gray-900">Notice Board</h5>
        <button className="text-blue-600 hover:text-blue-800 text-sm">Add Notice</button>
      </div>
      <div className="space-y-3">
        {notices.map((notice) => (
          <div key={notice.id} className="border-l-4 border-blue-500 pl-4 py-2">
            <div className="flex items-center justify-between">
              <h6 className="font-medium text-gray-900">{notice.title}</h6>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  notice.type === "warning"
                    ? "bg-yellow-100 text-yellow-800"
                    : notice.type === "important"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {notice.type}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{notice.content}</p>
            <span className="text-xs text-gray-500">{notice.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminNoticeBoard
