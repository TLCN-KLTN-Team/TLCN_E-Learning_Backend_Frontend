"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, Edit, Users, Clock, Calendar, Grid3X3, List, Filter } from "lucide-react"
import { getTeacherCourses } from "@/services/api/teacher/teacherCourseApi"
import { useAuth } from "@/context/auth-context/useAuth"
import type { CourseResponse } from "@/services/api/response/courseResponse"
import { getTeacherByUserId } from "@/services/api/teacher/teacherApi"

const AssignedCoursesPage: React.FC = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CourseResponse[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    const fetchTeacherIdAndCourses = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!user?.id) {
          setError("User not authenticated")
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
        const response = await getTeacherCourses(fetchedTeacherId, 0, 20)
        setCourses(response.content)
        setFilteredCourses(response.content)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load courses. Please try again later.")
        setCourses([])
        setFilteredCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherIdAndCourses()
  }, [user?.id])

  useEffect(() => {
    const filtered = courses.filter(
      (course) =>
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredCourses(filtered)
  }, [searchTerm, courses])

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
              Khóa Học Được Gán
            </h1>
            <p className="text-muted-foreground text-lg">Quản lý và chỉnh sửa các khóa học mà admin đã gán cho bạn</p>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-input"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Lọc
              </Button>
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
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              {courses.length === 0 ? (
                <>
                  <BookOpen className="mx-auto text-muted-foreground mb-4" size={48} />
                  <h3 className="text-lg font-medium text-foreground mb-2">Chưa có khóa học nào được gán</h3>
                  <p className="text-muted-foreground">Liên hệ với admin để được gán khóa học để giảng dạy</p>
                </>
              ) : (
                <>
                  <Search className="mx-auto text-muted-foreground mb-4" size={48} />
                  <h3 className="text-lg font-medium text-foreground mb-2">Không tìm thấy khóa học nào</h3>
                  <p className="text-muted-foreground">Thử điều chỉnh từ khóa tìm kiếm</p>
                </>
              )}
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredCourses.map((course) => (
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
                          <Link to={`/teacher/courses/${course.id}/manage`}>Quản lý</Link>
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
                          <Link to={`/teacher/courses/${course.id}/manage`}>Quản lý</Link>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AssignedCoursesPage
