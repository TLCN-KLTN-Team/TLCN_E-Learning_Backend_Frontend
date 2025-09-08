"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Header from "@/components/teacher/dashboard/header"
import Footer from "@/components/teacher/dashboard/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, BookOpen, Settings, FileText } from "lucide-react"
import CourseBuilder from "@/components/teacher/course/CourseBuilder"
import type { SectionRequest } from "@/types/course.types"

interface CourseData {
  id: number
  courseName: string
  courseType: string
  courseTypeId: number
  credits: number
  maxStudents: number
  description?: string
  currentStudents: number
  sections?: SectionRequest[]
}

const EditCoursePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [courseData, setCourseData] = useState<CourseData | null>(null)
  const [activeTab, setActiveTab] = useState("info")

  // Mock course types
  const courseTypes = [
    { id: 1, name: "Programming" },
    { id: 2, name: "Design" },
    { id: 3, name: "Marketing" },
    { id: 4, name: "Business" },
    { id: 5, name: "Data Science" },
  ]

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API call
        // const response = await teacherApi.getCourseById(courseId);

        // Mock data
        setTimeout(() => {
          setCourseData({
            id: Number.parseInt(courseId || "1"),
            courseName: "Introduction to Computer Science",
            courseType: "Programming",
            courseTypeId: 1,
            credits: 3,
            maxStudents: 30,
            currentStudents: 25,
            description: "Basic concepts of computer science and programming fundamentals",
            sections: [
              {
                id: 1,
                title: "Giới thiệu về lập trình",
                description: "Khái niệm cơ bản về lập trình",
                orderIndex: 1,
                isPublished: true,
                lessons: [],
                quizzes: [],
              },
            ],
          })
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching course:", error)
        setLoading(false)
      }
    }

    if (courseId) {
      fetchCourseData()
    }
  }, [courseId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (courseData) {
      setCourseData({
        ...courseData,
        [name]: type === "number" ? Number.parseInt(value) || 0 : value,
      })
    }
  }

  const handleSectionsChange = (sections: SectionRequest[]) => {
    if (courseData) {
      setCourseData({
        ...courseData,
        sections,
      })
    }
  }

  const handleSave = async () => {
    if (!courseData) return

    try {
      setSaving(true)
      // TODO: Replace with actual API call
      // await teacherApi.updateCourse(courseData.id, courseData);

      // Mock save
      setTimeout(() => {
        setSaving(false)
        alert("Khóa học đã được cập nhật thành công!")
        navigate("/teacher/assigned-courses")
      }, 1000)
    } catch (error) {
      console.error("Error saving course:", error)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="animate-pulse max-w-4xl mx-auto">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!courseData) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy khóa học</h3>
            <Button onClick={() => navigate("/teacher/assigned-courses")}>Quay lại danh sách khóa học</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Thông Tin Cơ Bản
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Nội Dung Khóa Học
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông Tin Khóa Học</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Course Name */}
                  <div>
                    <label htmlFor="courseName" className="block text-sm font-medium mb-2">
                      Tên Khóa Học *
                    </label>
                    <Input
                      id="courseName"
                      name="courseName"
                      value={courseData.courseName}
                      onChange={handleInputChange}
                      placeholder="Nhập tên khóa học"
                    />
                  </div>

                  {/* Course Type */}
                  <div>
                    <label htmlFor="courseTypeId" className="block text-sm font-medium mb-2">
                      Loại Khóa Học *
                    </label>
                    <select
                      id="courseTypeId"
                      name="courseTypeId"
                      value={courseData.courseTypeId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {courseTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Credits and Max Students */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="credits" className="block text-sm font-medium mb-2">
                        Số Tín Chỉ *
                      </label>
                      <Input
                        id="credits"
                        name="credits"
                        type="number"
                        value={courseData.credits}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                      />
                    </div>
                    <div>
                      <label htmlFor="maxStudents" className="block text-sm font-medium mb-2">
                        Số Học Sinh Tối Đa *
                      </label>
                      <Input
                        id="maxStudents"
                        name="maxStudents"
                        type="number"
                        value={courseData.maxStudents}
                        onChange={handleInputChange}
                        min={courseData.currentStudents}
                        max="500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Hiện tại có {courseData.currentStudents} học sinh đã đăng ký
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                      Mô Tả Khóa Học
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={courseData.description || ""}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập mô tả về khóa học..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6">
                    <Button variant="outline" onClick={() => navigate("/teacher/assigned-courses")}>
                      Hủy
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                      {saving ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Đang lưu...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Save className="w-4 h-4 mr-2" />
                          Lưu Thay Đổi
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="mt-6">
              <CourseBuilder
                courseId={courseId || ""}
                sections={courseData.sections || []}
                onSectionsChange={handleSectionsChange}
                onBack={() => setActiveTab("info")}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default EditCoursePage
