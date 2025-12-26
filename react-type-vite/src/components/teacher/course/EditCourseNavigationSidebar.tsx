"use client"

import type React from "react"
import { BookOpen, FileText, Users, Settings, CheckCircle2, ClipboardList, Zap, X } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useSelectedClass } from "@/context/teacher/SelectedClassContext"

interface NavigationItem {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  badge?: string | number | null
}

interface EditCourseNavigationSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  courseData: {
    courseName: string
    currentStudents: number
    maxStudents: number
  }
}

const EditCourseNavigationSidebar: React.FC<EditCourseNavigationSidebarProps> = ({
  activeTab,
  onTabChange,
  courseData,
}) => {
  const { selectedClass, setSelectedClass } = useSelectedClass()

  const navigationItems: NavigationItem[] = [
    {
      id: "info",
      label: "Thông Tin Cơ Bản",
      icon: <Settings className="w-5 h-5" />,
      description: "Xem chi tiết khóa học",
    },
    {
      id: "content",
      label: "Nội Dung Khóa Học",
      icon: <FileText className="w-5 h-5" />,
      description: "Quản lý sections và bài học",
    },
    {
      id: "class",
      label: "Quản Lý Lớp Học",
      icon: <Users className="w-5 h-5" />,
      description: `${courseData.currentStudents}/${courseData.maxStudents} sinh viên`,
      badge: courseData.currentStudents,
    },
    {
      id: "grading",
      label: "Chấm Bài Tập",
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: selectedClass ? `Lớp: ${selectedClass.className}` : "Vui lòng chọn lớp học",
    },
    {
      id: "exam",
      label: "Xem Bài Kiểm Tra",
      icon: <ClipboardList className="w-5 h-5" />,
      description: selectedClass ? `Lớp: ${selectedClass.className}` : "Vui lòng chọn lớp học",
    }
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6 h-screen sticky top-0 overflow-y-auto">
      {/* Logo/Header */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Chỉnh Sửa Khóa Học</h2>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{courseData.courseName}</p>
      </div>

      {selectedClass && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs font-medium text-blue-900">Lớp Được Chọn</p>
            <button
              onClick={() => setSelectedClass(null)}
              className="text-blue-600 hover:text-blue-800"
              title="Bỏ chọn lớp"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm font-semibold text-blue-900">{selectedClass.className}</p>
          <p className="text-xs text-blue-700 mt-1">{selectedClass.maxStudents || 0} sinh viên</p>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            disabled={["grading", "exam", "workspace"].includes(item.id) && !selectedClass}
            className={cn(
              "w-full text-left px-4 py-3 rounded-lg transition-all duration-200 group relative disabled:opacity-50 disabled:cursor-not-allowed",
              activeTab === item.id
                ? "bg-blue-50 border-l-4 border-blue-600"
                : "hover:bg-gray-50 border-l-4 border-transparent"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 transition-colors",
                  activeTab === item.id ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                )}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "font-medium transition-colors",
                      activeTab === item.id ? "text-blue-900" : "text-gray-700 group-hover:text-gray-900"
                    )}
                  >
                    {item.label}
                  </p>
                  {item.badge && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs mt-0.5 transition-colors",
                    activeTab === item.id ? "text-blue-700" : "text-gray-500 group-hover:text-gray-600"
                  )}
                >
                  {item.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default EditCourseNavigationSidebar
