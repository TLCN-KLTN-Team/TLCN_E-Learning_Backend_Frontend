"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, Edit, Users, Clock, Calendar, Grid3X3, List, ChevronLeft, ChevronRight } from "lucide-react"
import { getTeacherCourses } from "@/services/api/teacher/teacherCourseApi"
import { useAuth } from "@/context/auth-context/useAuth"
import type { CourseResponse } from "@/services/api/response/courseResponse"
import { getTeacherByUserId } from "@/services/api/teacher/teacherApi"

const AssignedCoursesPage: React.FC = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [creditRange, setCreditRange] = useState("all")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(9)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    const fetchTeacherIdAndCourses = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!user?.id) {
          setError("User not authenticated")
          setCourses([])
          setTotalPages(0)
          setTotalElements(0)
          return
        }

        // Bước 1: Lấy thông tin teacher từ userId
        const teacherResponse = await getTeacherByUserId(user.id)
        const fetchedTeacherId = teacherResponse.teacherId

        if (!fetchedTeacherId) {
          setError("Teacher ID not found")
          return
        }


        // Bước 2: Lấy danh sách khóa học bằng teacherId
        const response = await getTeacherCourses(fetchedTeacherId, page, pageSize, searchTerm, creditRange)
        setCourses(response.content || [])
        setTotalPages(response.totalPages || 0)
        setTotalElements(response.totalElements || 0)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load courses. Please try again later.")
        setCourses([])
        setTotalPages(0)
        setTotalElements(0)
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherIdAndCourses()
  }, [user?.id, page, pageSize, searchTerm, creditRange])

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput.trim())
      setPage(0)
    }, 350)

    return () => clearTimeout(handle)
  }, [searchInput])

  const handleCreditRangeChange = (value: string) => {
    setCreditRange(value)
    setPage(0)
  }

  const getPageNumbers = () => {
    const maxPagesToShow = 5
    const pages: number[] = []
    if (totalPages <= 0) return pages

    let startPage = Math.max(0, page - Math.floor(maxPagesToShow / 2))
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1)

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1)
    }

    for (let index = startPage; index <= endPage; index += 1) {
      pages.push(index)
    }

    return pages
  }

  const showingStart = totalElements === 0 ? 0 : page * pageSize + 1
  const showingEnd = Math.min((page + 1) * pageSize, totalElements)
  const isNoResults = !loading && courses.length === 0 && totalElements === 0
  const isFilteredNoResults = isNoResults && (searchTerm.length > 0 || creditRange !== "all")

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center text-foreground">
              <BookOpen className="mr-3 text-primary" size={32} />
              Khóa Học Nội Bộ
            </h1>
            <p className="text-muted-foreground text-lg">Quản lý và chỉnh sửa các khóa học mà admin đã phân công</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Tìm kiếm khóa học..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 bg-background border-input"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={creditRange}
                onChange={(e) => handleCreditRangeChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                aria-label="Lọc theo số tín chỉ"
              >
                <option value="all">Tất cả tín chỉ</option>
                <option value="1-2">1-2 tín chỉ</option>
                <option value="3-4">3-4 tín chỉ</option>
                <option value="5+">5+ tín chỉ</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(0)
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                aria-label="Số mục mỗi trang"
              >
                <option value={6}>6 / trang</option>
                <option value={9}>9 / trang</option>
                <option value={12}>12 / trang</option>
                <option value={20}>20 / trang</option>
              </select>

              <div className="flex border border-border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Courses Grid/List */}
          {isNoResults ? (
            <div className="text-center py-12">
              {isFilteredNoResults ? (
                <>
                  <Search className="mx-auto text-muted-foreground mb-4" size={48} />
                  <h3 className="text-lg font-medium text-foreground mb-2">Không tìm thấy khóa học nào</h3>
                  <p className="text-muted-foreground">Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc tín chỉ</p>
                </>
              ) : (
                <>
                  <BookOpen className="mx-auto text-muted-foreground mb-4" size={48} />
                  <h3 className="text-lg font-medium text-foreground mb-2">Chưa có khóa học nào được gán</h3>
                  <p className="text-muted-foreground">Liên hệ với admin để được gán khóa học để giảng dạy</p>
                </>
              )}
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 ${
                    viewMode === "list" ? "flex items-center p-4" : "p-6"
                  }`}
                >
                  {viewMode === "grid" ? (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-card-foreground mb-2 line-clamp-2">
                            {course.courseName}
                          </h3>
                        </div>
                      </div>

                      {course.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                      )}

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="w-4 h-4 mr-2" />
                          <span>
                            {course.currentStudents || 0}/{course.maxStudents || 0} học sinh
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{course.credits || 0} tín chỉ</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            Cập nhật:{" "}
                            {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString("vi-VN") : "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button asChild className="flex-1">
                          <Link to={`/teacher/courses/${course.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </Link>
                        </Button>
                        <Button variant="outline" asChild className="flex-1 bg-transparent">
                          <Link to={`/teacher/courses/${course.id}/manage`}>Đóng gói</Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-card-foreground mb-1">{course.courseName}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {course.currentStudents || 0}/{course.maxStudents || 0} học sinh
                          </span>
                          <span>{course.credits || 0} tín chỉ</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button asChild size="sm">
                          <Link to={`/teacher/courses/${course.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </Link>
                        </Button>
                        <Button variant="outline" asChild size="sm">
                          <Link to={`/teacher/courses/${course.id}/manage`}>Đóng gói</Link>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Hiển thị <span className="font-medium">{showingStart}</span> đến <span className="font-medium">{showingEnd}</span> trong <span className="font-medium">{totalElements}</span> khóa học
              </p>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Trước
                </Button>

                {getPageNumbers().map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    size="sm"
                    variant={pageNumber === page ? "default" : "outline"}
                    onClick={() => setPage(pageNumber)}
                    className="min-w-9"
                  >
                    {pageNumber + 1}
                  </Button>
                ))}

                <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={page >= totalPages - 1}>
                  Sau
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AssignedCoursesPage
