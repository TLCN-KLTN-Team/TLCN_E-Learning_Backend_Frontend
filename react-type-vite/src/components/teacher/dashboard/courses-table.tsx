import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ChevronLeft, ChevronRight, Users, BookOpen, Award } from "lucide-react"
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
    <div className="mt-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Khóa học của tôi</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quản lý và theo dõi hiệu suất khóa học của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by creating your first course</p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Create Your First Course
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-4 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {courses.map((course) => (
                      <tr 
                        key={course.id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h6 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {course.courseName}
                              </h6>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Course ID: {course.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full">
                              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                {course.currentStudents || 0}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                {course.credits || 0}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Link to={`/teacher/courses/${course.id}/edit`}>
                              <Button
                                size="sm"
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-0 h-9 px-3"
                              >
                                <Edit className="w-4 h-4 mr-1.5" />
                                Edit
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              className="bg-red-50 hover:bg-red-100 text-red-600 border-0 h-9 px-3"
                            >
                              <Trash2 className="w-4 h-4 mr-1.5" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {courses.map((course) => (
                  <div 
                    key={course.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h6 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {course.courseName}
                        </h6>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {course.id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Students</p>
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            {course.currentStudents || 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                        <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Credits</p>
                          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                            {course.credits || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link to={`/teacher/courses/${course.id}/edit`} className="flex-1">
                        <Button size="sm" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border-0">
                          <Edit className="w-4 h-4 mr-1.5" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-medium">{page * size + 1}</span> to{" "}
                    <span className="font-medium">{Math.min((page + 1) * size, courses.length)}</span> of{" "}
                    <span className="font-medium">{courses.length}</span> courses
                  </p>
                  
                  <nav className="flex items-center space-x-2">
                    <Button
                      onClick={handlePreviousPage}
                      disabled={page === 0}
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex space-x-1">
                      {getPageNumbers().map((pageNum) => (
                        <Button
                          key={pageNum}
                          onClick={() => handlePageClick(pageNum)}
                          size="sm"
                          className={`h-9 px-3 ${
                            pageNum === page
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {pageNum + 1}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      onClick={handleNextPage}
                      disabled={page >= totalPages - 1}
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CoursesTable