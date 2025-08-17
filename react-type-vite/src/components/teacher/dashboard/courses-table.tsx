import type React from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Edit, X, ChevronLeft, ChevronRight } from "lucide-react"

interface Course {
  id: number
  title: string
  image: string
  selling: number
  amount: string
  period: string
}

const courses: Course[] = [
  {
    id: 1,
    title: "Building Scalable APIs with GraphQL",
    image: "/src/assets/images/courses/4by3/08.jpg?height=60&width=80",
    selling: 34,
    amount: "$1,25,478",
    period: "9 months",
  },
  {
    id: 2,
    title: "Bootstrap 5 From Scratch",
    image: "/src/assets/images/courses/4by3/10.jpg?height=60&width=80",
    selling: 45,
    amount: "$2,85,478",
    period: "6 months",
  },
  {
    id: 3,
    title: "Graphic Design Masterclass",
    image: "/src/assets/images/courses/4by3/02.jpg?height=60&width=80",
    selling: 21,
    amount: "$85,478",
    period: "4 months",
  },
  {
    id: 4,
    title: "Learn Invision",
    image: "/src/assets/images/courses/4by3/04.jpg?height=60&width=80",
    selling: 28,
    amount: "$98,478",
    period: "8 months",
  },
  {
    id: 5,
    title: "Angular – The Complete Guide",
    image: "/src/assets/images/courses/4by3/04.jpg?height=60&width=80",
    selling: 38,
    amount: "$1,02,478",
    period: "1 year",
  },
]

const CoursesTable: React.FC = () => {
  return (
    <div className="mt-0">
      <div className="bg-white border border-gray-200 dark:border-gray-700 rounded-lg mt-5 overflow-hidden shadow-sm">
        {/* Card header START */}
        <div className="bg-white border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold mb-2 sm:mb-0 text-gray-800">Most Selling Courses</h3>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-[#cde1f4] text-[#066ac9] border-[#9bc3e9] hover:bg-[#9bc3e9] transition-colors duration-300"
            >
              <Link to="/teacher/courses">View all</Link>
            </Button>
          </div>
        </div>
        {/* Card header END */}

        {/* Card body START */}
        <div className="p-0">
          <div className="overflow-x-auto border-0 rounded-lg">
            {/* Table START */}
            <table className="w-full table-auto bg-[#24292d] dark:bg-gray-900 text-gray-100 p-4 mb-0">
              {/* Table head */}
              <thead>
                <tr>
                  <th className="border-0 rounded-l-lg px-6 py-3 text-left text-xs font-medium text-[#9a9ea4] uppercase tracking-wider">
                    Course Name
                  </th>
                  <th className="border-0 px-6 py-3 text-left text-xs font-medium text-[#9a9ea4] uppercase tracking-wider">
                    Selling
                  </th>
                  <th className="border-0 px-6 py-3 text-left text-xs font-medium text-[#9a9ea4] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="border-0 px-6 py-3 text-left text-xs font-medium text-[#9a9ea4] uppercase tracking-wider">
                    Period
                  </th>
                  <th className="border-0 rounded-r-lg px-6 py-3 text-left text-xs font-medium text-[#9a9ea4] uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              {/* Table body START */}
              <tbody className="divide-y divide-[#404448]">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-[#404448] transition-colors duration-300">
                    {/* Course item */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-15">
                          <img
                            src={course.image || "/placeholder.svg"}
                            className="rounded w-15 h-11 object-cover"
                            alt={course.title}
                          />
                        </div>
                        <h6 className="mb-0 ml-2 text-sm font-medium text-white">
                          <a href="#" className="hover:text-[#066ac9] transition-colors duration-300">
                            {course.title}
                          </a>
                        </h6>
                      </div>
                    </td>
                    {/* Selling item */}
                    <td className="px-6 py-4 text-sm text-gray-100">{course.selling}</td>
                    {/* Amount item */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-100">{course.amount}</td>
                    {/* Period item */}
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-[#cde1f4] text-[#066ac9] rounded-full">
                        {course.period}
                      </span>
                    </td>
                    {/* Action item */}
                    <td className="px-6 py-4">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          className="bg-[#cef2e7] text-[#0cbc87] hover:bg-[#9ee4cf] border-0 rounded-full w-8 h-8 p-0 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#f7d4d8] text-[#d6293e] hover:bg-[#efa9b2] border-0 rounded-full w-8 h-8 p-0 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Table body END */}
            </table>
            {/* Table END */}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-3 px-6 pb-4">
            {/* Content */}
            <p className="mb-0 text-center sm:text-left text-sm text-gray-600 dark:text-gray-400">
              Showing 1 to 8 of 20 entries
            </p>
            {/* Pagination */}
            <nav className="flex justify-center mb-0" aria-label="navigation">
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#cde1f4] text-[#066ac9] border-[#9bc3e9] hover:bg-[#9bc3e9] transition-colors duration-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#cde1f4] text-[#066ac9] border-[#9bc3e9] hover:bg-[#9bc3e9] transition-colors duration-300"
                >
                  1
                </Button>
                <Button size="sm" className="bg-[#066ac9] text-white hover:bg-[#0555a1] transition-colors duration-300">
                  2
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#cde1f4] text-[#066ac9] border-[#9bc3e9] hover:bg-[#9bc3e9] transition-colors duration-300"
                >
                  3
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#cde1f4] text-[#066ac9] border-[#9bc3e9] hover:bg-[#9bc3e9] transition-colors duration-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </nav>
          </div>
        </div>
        {/* Card body END */}
      </div>
    </div>
  )
}

export default CoursesTable
