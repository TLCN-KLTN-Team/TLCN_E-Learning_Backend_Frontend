"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { courseService, type Course } from "@/services/course-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Play, Pause, LogOut } from "lucide-react"
import { CreateCourseDialog } from "./create-course-dialog"
import { CourseDetailDialog } from "./course-detail-dialog"
import { useToast } from "@/hooks/use-toast"

export function AdminDashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const { user, logout } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const data = await courseService.getAllCourses()
      setCourses(data)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách khóa học",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (courseId: number, newStatus: "ACTIVE" | "INACTIVE") => {
    try {
      await courseService.updateCourseStatus(courseId, newStatus)
      await loadCourses()
      toast({
        title: "Thành công",
        description: `Đã ${newStatus === "ACTIVE" ? "kích hoạt" : "tạm ngưng"} khóa học`,
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái khóa học",
        variant: "destructive",
      })
    }
  }

  const handleViewDetail = async (courseId: number) => {
    try {
      const course = await courseService.getCourseById(courseId)
      setSelectedCourse(course)
      setDetailDialogOpen(true)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin khóa học",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý khóa học</h1>
              <p className="text-gray-600">Chào mừng, {user?.username}</p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Danh sách khóa học</h2>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo khóa học
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription>Mã: {course.code}</CardDescription>
                  </div>
                  <Badge variant={course.status === "ACTIVE" ? "default" : "secondary"}>
                    {course.status === "ACTIVE" ? "Hoạt động" : "Tạm ngưng"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">Số tín chỉ: {course.credits}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                  {course.teacherName && <p className="text-sm text-gray-600">GV: {course.teacherName}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetail(course.id)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Xem
                  </Button>
                  {course.status === "ACTIVE" ? (
                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(course.id, "INACTIVE")}>
                      <Pause className="w-4 h-4 mr-1" />
                      Tạm ngưng
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(course.id, "ACTIVE")}>
                      <Play className="w-4 h-4 mr-1" />
                      Hoạt động
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Chưa có khóa học nào</p>
          </div>
        )}
      </div>

      <CreateCourseDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={loadCourses} />

      <CourseDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} course={selectedCourse} />
    </div>
  )
}
