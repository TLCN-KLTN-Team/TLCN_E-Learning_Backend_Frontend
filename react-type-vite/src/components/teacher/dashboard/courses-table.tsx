import type React from "react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Edit, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "../../../context/auth-context/useAuth"
import { getTeacherByUserId } from "../../../services/api/teacher/teacherApi"
import { getTeacherCourses } from "../../../services/api/teacher/teacherCourseApi"
import type { CourseResponse } from "../../../services/api/response/courseResponse"

interface CourseWithRevenue extends CourseResponse {
  totalSales?: number
  revenue?: number
}

const CoursesTable: React.FC = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<CourseWithRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const size = 5

  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const teacherData = await getTeacherByUserId(user.id)
        const coursesData = await getTeacherCourses(teacherData.teacherId, page, size)
        setCourses(coursesData.content || [])
        setTotalPages(coursesData.totalPages || 0)
      } catch (error) {
        console.error("Error loading courses:", error)
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [user?.id, page])

  const handlePreviousPage = () => {
    if (page > 0) setPage(page - 1)
  }

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(page + 1)
  }

  const handlePageClick = (pageNum: number) => {
    setPage(pageNum)
  }

  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 3
    let startPage = Math.max(0, page - 1)
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1)

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <div className="mt-0">
      <div className="bg-white border border-gray-200 dark:border-gray-700 rounded-lg mt-5 overflow-hidden shadow-sm">
        {/* Card header START */}
        <div className="bg-white border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold mb-2 sm:mb-0 text-gray-800">My Courses</h3>
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
          {loading ? (
            <div className="px-6 py-8 text-center text-gray-500">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">No courses found. Create your first course!</div>
          ) : (
            <>
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
                        Students
                      </th>
                      <th className="border-0 px-6 py-3 text-left text-xs font-medium text-[#9a9ea4] uppercase tracking-wider">
                        Credits
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
                          <h6 className="mb-0 text-sm font-medium text-white">
                            <a href="#" className="hover:text-[#066ac9] transition-colors duration-300">
                              {course.courseName}
                            </a>
                          </h6>
                        </td>
                        {/* Students item */}
                        <td className="px-6 py-4 text-sm text-gray-100">{course.currentStudents || 0}</td>
                        {/* Credits item */}
                        <td className="px-6 py-4 text-sm text-gray-100">{course.credits || 0}</td>
                        {/* Action item */}
                        <td className="px-6 py-4">
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              asChild
                              className="bg-[#cef2e7] text-[#0cbc87] hover:bg-[#9ee4cf] border-0 rounded-full w-8 h-8 p-0 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
                            >
                              <Link to={`/teacher/courses/${course.id}/edit`}>
                                <Edit className="w-3 h-3" />
                              </Link>
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
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-3 px-6 pb-4">
                  {/* Content */}
                  <p className="mb-0 text-center sm:text-left text-sm text-gray-600 dark:text-gray-400">
                    Showing {page * size + 1} to {Math.min((page + 1) * size, (page + 1) * size)} entries
                  </p>
                  {/* Pagination */}
                  <nav className="flex justify-center mb-0" aria-label="navigation">
                    <div className="flex space-x-1">
                      <Button
                        onClick={handlePreviousPage}
                        disabled={page === 0}
                        variant="outline"
                        size="sm"
                        className="bg-[#cde1f4] text-[#066ac9] border-[#9bc3e9] hover:bg-[#9bc3e9] transition-colors duration-300 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {getPageNumbers().map((pageNum) => (
                        <Button
                          key={pageNum}
                          onClick={() => handlePageClick(pageNum)}
                          size="sm"
                          className={
                            pageNum === page
                              ? "bg-[#066ac9] text-white hover:bg-[#0555a1] transition-colors duration-300"
                              : "bg-[#cde1f4] text-[#066ac9] border-[#9bc3e9] hover:bg-[#9bc3e9] transition-colors duration-300"
                          }
                        >
                          {pageNum + 1}
                        </Button>
                      ))}
                      <Button
                        onClick={handleNextPage}
                        disabled={page >= totalPages - 1}
                        variant="outline"
                        size="sm"
                        className="bg-[#cde1f4] text-[#066ac9] border-[#9bc3e9] hover:bg-[#9bc3e9] transition-colors duration-300 disabled:opacity-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
        {/* Card body END */}
      </div>
    </div>
  )
}

export default CoursesTable
