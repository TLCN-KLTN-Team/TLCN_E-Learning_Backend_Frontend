"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ShoppingBag, Search, Users, Clock, Grid3X3, List, TrendingUp, MessageSquare } from "lucide-react"
import { useAuth } from "@/context/auth-context/useAuth"
import { getTeacherByUserId } from "@/services/api/teacher/teacherApi"
import teacherPublicApi, { type PublicCourseResponse } from "@/services/api/teacher/teacherPublicApi"
import TeacherCourseDiscussionModal from "@/components/teacher/course/TeacherCourseDiscussionModal"

const PublicCoursesPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<PublicCourseResponse[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCourseForDiscussion, setSelectedCourseForDiscussion] = useState<PublicCourseResponse | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [creditRange, setCreditRange] = useState<string>("all")
  const [updatedRange, setUpdatedRange] = useState<string>("")

  useEffect(() => {
    const fetchTeacherIdAndCourses = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!user?.id) {
          setError("User not authenticated")
          return
        }

        // Lấy thông tin teacher từ userId
        const teacherResponse = await getTeacherByUserId(user.id)
        const fetchedTeacherId = teacherResponse.teacherId

        if (!fetchedTeacherId) {
          setError("Teacher ID not found")
          return
        }

          // Lấy danh sách khóa học public từ API (server-side paging + filters)
          const response = await teacherPublicApi.getPublicCourses(fetchedTeacherId, page, pageSize, searchTerm, creditRange, updatedRange)
          console.log("PublicCourses API response:", response)

          setCourses(response.content || [])
          setTotalElements(response.totalElements || 0)
          setTotalPages(response.totalPages || 0)
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
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherIdAndCourses()
  }, [user?.id, navigate, page, pageSize, searchTerm, creditRange, updatedRange])

  // debounce search input
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(0)
      setSearchTerm(searchInput)
    }, 350)

    return () => clearTimeout(handle)
  }, [searchInput])

  // derived pagination values (fallbacks when backend omits totalPages)
  const computedTotalPages = totalPages || (totalElements ? Math.ceil(totalElements / pageSize) : 0)
  // always render pagination controls (disabled appropriately) so user can change pageSize or see navigation
  const showPagination = true

  const handleViewCourseStudents = (courseId: number) => {
    navigate(`/teacher/public-courses/${courseId}/students`)
  }

  const handleOpenDiscussion = (course: PublicCourseResponse, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedCourseForDiscussion(course)
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
                  <h3 className="text-2xl font-bold text-card-foreground">{totalElements}</h3>
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

          {/* Search + Filters */}
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
              <div className="flex items-center space-x-2">
                <select value={creditRange} onChange={(e) => { setCreditRange(e.target.value); setPage(0); }} className="border rounded-md p-1 bg-background">
                  <option value="all">Tất cả tín chỉ</option>
                  <option value="1-2">1-2</option>
                  <option value="3-4">3-4</option>
                  <option value="5+">5+</option>
                </select>

                <select value={updatedRange} onChange={(e) => { setUpdatedRange(e.target.value); setPage(0); }} className="border rounded-md p-1 bg-background">
                  <option value="">Cập nhật: Tất cả</option>
                  <option value="7d">7 ngày</option>
                  <option value="30d">30 ngày</option>
                  <option value="90d">90 ngày</option>
                </select>
              </div>

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
          {courses.length === 0 ? (
            <div className="text-center py-12">
              {totalElements === 0 ? (
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
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
              {courses.map((course) => (
                <div key={course.id} className="h-full">
                  {viewMode === "grid" ? (
                    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewCourseStudents(course.id)}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg line-clamp-2" title={course.courseName}>
                            {course.courseName}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col space-y-3">
                        {course.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{course.description}</p>
                        )}

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="w-4 h-4 mr-2" />
                            <span>{course.currentStudents || 0} học viên</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{course.credits || 0} tín chỉ</span>
                          </div>
                          <div className="flex items-center text-sm font-semibold text-green-600">
                            <span>{(course.price || 0).toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-auto pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50 px-2"
                            onClick={(e) => handleOpenDiscussion(course, e)}
                          >
                            <MessageSquare className="w-4 h-4 mr-1.5" />
                            Thảo luận
                          </Button>

                          <Button
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCourseStudents(course.id);
                            }}
                          >
                            <Users className="w-4 h-4 mr-1.5" />
                            Chấm bài
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div
                      className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer flex items-center p-4"
                      onClick={() => handleViewCourseStudents(course.id)}
                    >
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
                        Chấm bài
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="ml-2"
                        onClick={(e) => handleOpenDiscussion(course, e)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Thảo luận
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Pagination */}
          {showPagination && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
                <span className="text-sm text-muted-foreground">Trang {page + 1} / {computedTotalPages || "-"}</span>
                <Button size="sm" onClick={() => setPage((p) => Math.min(Math.max(0, computedTotalPages - 1), p + 1))} disabled={computedTotalPages === 0 || page + 1 >= computedTotalPages}>Next</Button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Hiển thị</label>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} className="border rounded-md p-1 bg-background">
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Discussion Modal */}
      {selectedCourseForDiscussion && selectedCourseForDiscussion.publishedCourseId && (
        <TeacherCourseDiscussionModal
          courseId={selectedCourseForDiscussion.id}
          publishedCourseId={selectedCourseForDiscussion.publishedCourseId}
          courseName={selectedCourseForDiscussion.courseName}
          user={user}
          onClose={() => setSelectedCourseForDiscussion(null)}
        />
      )}
    </div>
  )
}

export default PublicCoursesPage
