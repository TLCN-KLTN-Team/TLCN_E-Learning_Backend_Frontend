"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingBag, Search, Users, Clock, DollarSign, Grid3X3, List, Filter, TrendingUp } from "lucide-react"
import { useAuth } from "@/context/auth-context/useAuth"
import { getTeacherByUserId } from "@/services/api/teacher/teacherApi"
import teacherPublicApi, { type PublicCourseResponse } from "@/services/api/teacher/teacherPublicApi"

const PublicCoursesPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<PublicCourseResponse[]>([])
  const [filteredCourses, setFilteredCourses] = useState<PublicCourseResponse[]>([])
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
          navigate("/login")
          return
        }

        // Lấy thông tin teacher từ userId
        const teacherResponse = await getTeacherByUserId(user.id)
        const fetchedTeacherId = teacherResponse.teacherId

        if (!fetchedTeacherId) {
          setError("Teacher ID not found")
          return
        }

        // Lấy danh sách khóa học public từ API
        const response = await teacherPublicApi.getPublicCourses(fetchedTeacherId, 0, 20)
        
        setCourses(response.content)
        setFilteredCourses(response.content)
      } catch (err: any) {
        console.error("Error fetching data:", err)
        
        // Nếu là lỗi authentication, redirect về login
        if (err?.message?.includes("Lỗi xác thực token") || err?.status === 401) {
          setError("Session expired. Please login again.")
          navigate("/login")
        } else {
          setError("Failed to load public courses. Please try again later.")
        }
        
        setCourses([])
        setFilteredCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherIdAndCourses()
  }, [user?.id, navigate])

  useEffect(() => {
    const filtered = courses.filter(
      (course) =>
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredCourses(filtered)
  }, [searchTerm, courses])

  const handleViewCourseStudents = (courseId: number) => {
    navigate(`/teacher/public-courses/${courseId}/students`)
  }

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
              <ShoppingBag className="mr-3 text-primary" size={32} />
              Khóa Học Thương Mại
            </h1>
            <p className="text-muted-foreground text-lg">Quản lý người dùng và chấm bài cho các khóa học thương mại của bạn</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng khóa học</p>
                  <h3 className="text-2xl font-bold text-card-foreground">{courses.length}</h3>
                </div>
                <ShoppingBag className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng học viên</p>
                  <h3 className="text-2xl font-bold text-card-foreground">
                    {courses.reduce((sum, course) => sum + (course.currentStudents || 0), 0)}
                  </h3>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Doanh thu ước tính</p>
                  <h3 className="text-2xl font-bold text-card-foreground">
                    {courses.reduce((sum, course) => sum + ((course.price || 0) * (course.currentStudents || 0) * 0.7), 0).toLocaleString('vi-VN')}đ
                  </h3>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

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
                  <ShoppingBag className="mx-auto text-muted-foreground mb-4" size={48} />
                  <h3 className="text-lg font-medium text-foreground mb-2">Chưa có khóa học public nào</h3>
                  <p className="text-muted-foreground">Các khóa học có phí sẽ hiển thị ở đây</p>
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
                  className={`bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer ${
                    viewMode === "list" ? "flex items-center p-4" : "p-6"
                  }`}
                  onClick={() => handleViewCourseStudents(course.id)}
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
                          <span>{course.currentStudents || 0} học viên</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{course.credits || 0} tín chỉ</span>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-green-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span>{(course.price || 0).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>

                      <Button className="w-full" variant="outline">
                        <Users className="w-4 h-4 mr-2" />
                        Xem người dùng & Chấm bài
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-card-foreground mb-1">{course.courseName}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{course.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{course.currentStudents || 0} học viên</span>
                          <span>{course.credits || 0} tín chỉ</span>
                          <span className="font-semibold text-green-600">{(course.price || 0).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="ml-4">
                        <Users className="w-4 h-4 mr-2" />
                        Xem học viên
                      </Button>
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

export default PublicCoursesPage
