"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Footer from "@/components/teacher/dashboard/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BookOpen, Settings, FileText, AlertCircle, Loader2, Users } from "lucide-react"
import CourseBuilder from "@/components/teacher/course/CourseBuilder"
import ClassManagement from "@/components/teacher/course/ClassManagement"
import type { SectionResponse } from "@/services/api/response/sectionResponse"
import { getSectionsByCourseId } from "@/services/api/teacher/sectionApi"
import { getCourseById } from "@/services/api/teacher/teacherCourseApi"
import { useAuth } from "@/context/auth-context/useAuth"
import { getTeacherByUserId } from "@/services/api/teacher/teacherApi"

interface CourseData {
  id: number
  courseName: string
  credits: number
  maxStudents: number
  description?: string
  currentStudents: number
  sections?: SectionResponse[]
}

const EditCoursePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [courseData, setCourseData] = useState<CourseData | null>(null)
  const [activeTab, setActiveTab] = useState("info")
  const [error, setError] = useState<string | null>(null)
  const [educationalUnitId, setEducationalUnitId] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) {
        setError("Course ID không hợp lệ")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        if (user?.id) {
          const teacherResponse = await getTeacherByUserId(user.id)
          setEducationalUnitId(teacherResponse.educationalUnitId || null)
        }

        const courseResponse = await getCourseById(Number(courseId))

        // Fetch sections with lessons and quizzes from API
        const sectionsResponse = await getSectionsByCourseId(Number.parseInt(courseId))

        console.log("Course loaded:", courseResponse)
        console.log("Sections loaded:", sectionsResponse)

        setCourseData({
          id: courseResponse.id,
          courseName: courseResponse.courseName,
          credits: courseResponse.credits,
          maxStudents: courseResponse.maxStudents,
          currentStudents: courseResponse.currentStudents,
          description: courseResponse.description,
          sections: sectionsResponse,
        })

        setLoading(false)
      } catch (error) {
        console.error("Error fetching course data:", error)
        setError("Không thể tải thông tin khóa học. Vui lòng thử lại.")
        setLoading(false)
      }
    }

    fetchCourseData()
  }, [courseId, user?.id])

  const handleSectionsChange = (sections: SectionResponse[]) => {
    if (courseData) {
      setCourseData({
        ...courseData,
        sections,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Đang tải thông tin khóa học...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !courseData) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-red-500 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">{error || "Không tìm thấy khóa học"}</h3>
                    <p className="text-gray-600 mb-4">
                      Khóa học này có thể đã bị xóa hoặc bạn không có quyền truy cập.
                    </p>
                    <Button onClick={() => navigate("/teacher/assigned-courses")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Quay lại danh sách khóa học
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button variant="outline" onClick={() => navigate("/teacher/assigned-courses")} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <BookOpen className="mr-3 text-blue-600" size={32} />
                Chỉnh Sửa Khóa Học
              </h1>
              <p className="text-muted-foreground">Cập nhật thông tin và nội dung khóa học</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Thông Tin Cơ Bản
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Nội Dung Khóa Học
              </TabsTrigger>
              <TabsTrigger value="class" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Quản Lý Lớp Học
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông Tin Khóa Học</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Course Name - Read Only */}
                  <div>
                    <label htmlFor="courseName" className="block text-sm font-medium mb-2">
                      Tên Khóa Học
                    </label>
                    <Input
                      id="courseName"
                      name="courseName"
                      value={courseData.courseName}
                      disabled
                      className="bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  {/* Credits and Max Students - Read Only */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="credits" className="block text-sm font-medium mb-2">
                        Số Tín Chỉ
                      </label>
                      <Input
                        id="credits"
                        name="credits"
                        type="number"
                        value={courseData.credits}
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label htmlFor="maxStudents" className="block text-sm font-medium mb-2">
                        Số Học Sinh Tối Đa
                      </label>
                      <Input
                        id="maxStudents"
                        name="maxStudents"
                        type="number"
                        value={courseData.maxStudents}
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Hiện tại có {courseData.currentStudents} học sinh đã đăng ký
                      </p>
                    </div>
                  </div>

                  {/* Description - Read Only */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                      Mô Tả Khóa Học
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={courseData.description || "Chưa có mô tả"}
                      disabled
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed text-gray-700"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Thông tin chỉ để xem</p>
                      <p>Thông tin cơ bản của khóa học không thể chỉnh sửa. Vui lòng liên hệ quản trị viên nếu cần thay đổi.</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end pt-6">
                    <Button variant="outline" onClick={() => navigate("/teacher/assigned-courses")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Quay lại
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="mt-6">
              <CourseBuilder
                courseId={courseId || ""}
                educationalUnitId={educationalUnitId || ""} 
                sections={courseData.sections || []}
                onSectionsChange={handleSectionsChange}
                onBack={() => setActiveTab("info")}
              />
            </TabsContent>

            <TabsContent value="class" className="mt-6">
              <ClassManagement courseId={courseId || ""} educationalUnitId={educationalUnitId} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default EditCoursePage
