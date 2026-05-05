"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, ChevronRight, AlertCircle, Loader2, Plus, MessageSquare } from 'lucide-react'
import * as classApi from "@/services/api/teacher/classManagementApi";
import type { CourseClassResponse } from "@/services/api/response/courseClassResponse"
import ClassDiscussionModal from "./ClassDiscussionModal"

interface ClassListViewProps {
  courseId: string
  educationalUnitId: number
  onSelectClass: (classData: CourseClassResponse) => void
}

const ClassListView: React.FC<ClassListViewProps> = ({ courseId, educationalUnitId, onSelectClass }) => {
  const [classes, setClasses] = useState<CourseClassResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [discussionModalOpen, setDiscussionModalOpen] = useState(false)
  const [selectedClassForDiscussion, setSelectedClassForDiscussion] = useState<CourseClassResponse | null>(null)

  useEffect(() => {
    fetchClasses()
  }, [courseId])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError(null)
      const classesData = await classApi.getClassesByCourse(educationalUnitId, Number(courseId))
      setClasses(classesData.content || [])
    } catch (err) {
      console.error("Error fetching classes:", err)
      setError("Không thể tải danh sách lớp học. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDiscussion = (classData: CourseClassResponse, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedClassForDiscussion(classData)
    setDiscussionModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Đang tải danh sách lớp học...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-semibold flex items-center gap-2 mb-1">
          <Users className="h-6 w-6 text-blue-600" />
          Quản Lý Lớp Học
        </h2>
        <p className="text-sm text-gray-600">Chọn một lớp để xem danh sách sinh viên</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Classes Grid */}
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((classData) => (
            <Card
              key={classData.id}
              className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
              onClick={() => onSelectClass(classData)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2" title={classData.className}>
                      {classData.className}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Mã lớp: {classData.classCode}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                {/* Status Badge */}
                <div>
                  <Badge
                    variant={classData.status === "ACTIVE" ? "default" : "secondary"}
                    className={
                      classData.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : classData.status === "COMPLETED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }
                  >
                    {classData.status === "ACTIVE"
                      ? "Hoạt Động"
                      : classData.status === "COMPLETED"
                        ? "Hoàn Thành"
                        : "Không Hoạt Động"}
                  </Badge>
                </div>

                {/* Student Count */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sinh viên:</span>
                  <span className="font-semibold">
                    {classData.currentStudents}/{classData.maxStudents}
                  </span>
                </div>

                {/* Dates */}
                {classData.startDate && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Bắt đầu: {new Date(classData.startDate).toLocaleDateString("vi-VN")}</p>
                    {classData.endDate && <p>Kết thúc: {new Date(classData.endDate).toLocaleDateString("vi-VN")}</p>}
                  </div>
                )}

                {/* Description */}
                {classData.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {classData.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto pt-2">
                  <Button
                    onClick={(e) => handleOpenDiscussion(classData, e)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50 px-2"
                  >
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Thảo luận
                  </Button>
                  <Button
                    onClick={() => onSelectClass(classData)}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2"
                  >
                    Xem Chi Tiết
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Chưa có lớp học nào cho khóa học này</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Tạo Lớp Học Mới
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Discussion Modal */}
      {selectedClassForDiscussion && (
        <ClassDiscussionModal
          isOpen={discussionModalOpen}
          onClose={() => {
            setDiscussionModalOpen(false)
            setSelectedClassForDiscussion(null)
          }}
          classId={selectedClassForDiscussion.id}
          className={selectedClassForDiscussion.className}
        />
      )}
    </div>
  )
}

export default ClassListView
