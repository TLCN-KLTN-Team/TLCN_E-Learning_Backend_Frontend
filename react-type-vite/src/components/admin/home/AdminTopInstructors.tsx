import type React from "react"

const AdminTopInstructors: React.FC = () => {
  const instructors = [
    {
      id: 1,
      name: "Sarah Wilson",
      courses: 12,
      students: 1250,
      rating: 4.9,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "David Chen",
      courses: 8,
      students: 980,
      rating: 4.8,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      courses: 15,
      students: 1450,
      rating: 4.9,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 4,
      name: "Michael Brown",
      courses: 6,
      students: 720,
      rating: 4.7,
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg font-semibold text-gray-900">Top Instructors</h5>
        <button className="text-blue-600 hover:text-blue-800 text-sm">View All</button>
      </div>
      <div className="space-y-4">
        {instructors.map((instructor) => (
          <div key={instructor.id} className="flex items-center space-x-3">
            <img
              src={instructor.avatar || "/placeholder.svg"}
              alt={instructor.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <h6 className="font-medium text-gray-900">{instructor.name}</h6>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{instructor.courses} courses</span>
                <span>{instructor.students} students</span>
                <div className="flex items-center">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1">{instructor.rating}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminTopInstructors
