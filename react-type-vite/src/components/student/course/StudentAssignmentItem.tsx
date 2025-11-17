"use client"

import type React from "react"
import { useState } from "react"
import {
  FileText,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Paperclip,
  AlertTriangle,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AssignmentResponse } from "@/services/api/response/assignmentResponse"

interface StudentAssignmentItemProps {
  assignment: AssignmentResponse
}

const StudentAssignmentItem: React.FC<StudentAssignmentItemProps> = ({ 
  assignment 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getFileName = (fileData: string): string => {
    try {
      const metadata = JSON.parse(fileData)
      return metadata.name || "Tệp không xác định"
    } catch {
      return fileData.split("/").pop() || "Tệp không xác định"
    }
  }

  const isDeadlinePassed = new Date(assignment.deadline) < new Date()
  const daysUntilDeadline = Math.ceil(
    (new Date(assignment.deadline).getTime() - new Date().getTime()) / 
    (1000 * 60 * 60 * 24)
  )

  const getDeadlineStatus = () => {
    if (isDeadlinePassed) {
      return (
        <span className="flex items-center gap-1 text-red-600">
          <AlertTriangle className="h-3 w-3" />
          Đã hết hạn
        </span>
      )
    }
    if (daysUntilDeadline <= 3) {
      return (
        <span className="flex items-center gap-1 text-orange-600">
          <AlertTriangle className="h-3 w-3" />
          {daysUntilDeadline} ngày còn lại
        </span>
      )
    }
    return (
      <span className="text-gray-600">
        {daysUntilDeadline} ngày còn lại
      </span>
    )
  }

  return (
    <div className="border rounded-lg hover:bg-gray-50 transition-colors">
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm text-gray-500 min-w-[30px]">
            #{assignment.numberItem}
          </span>
          <FileText className="h-5 w-5 text-orange-500" />
          <div className="flex-1">
            <h5 className="font-medium">{assignment.title}</h5>
            {!isExpanded && (
              <div className="flex items-center gap-4 text-xs mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {getDeadlineStatus()}
                </span>
                <span>{assignment.submissionType}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDeadlinePassed && (
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={(e) => {
                e.stopPropagation()
                console.log("Submit assignment:", assignment.id)
              }}
            >
              <Upload className="h-4 w-4 mr-1" />
              Nộp bài
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-2 border-t bg-gray-50/50 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-gray-500 text-xs">Hạn nộp</p>
                <p className="font-medium">
                  {new Date(assignment.deadline).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-gray-500 text-xs">Loại nộp</p>
                <p className="font-medium">{assignment.submissionType}</p>
              </div>
            </div>
            {assignment.maxScore !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-500 text-xs">Điểm tối đa</p>
                  <p className="font-medium">{assignment.maxScore}</p>
                </div>
              </div>
            )}
          </div>

          {assignment.description && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Mô tả:</p>
              <p className="text-sm text-gray-600">{assignment.description}</p>
            </div>
          )}

          {assignment.assignmentFiles && assignment.assignmentFiles.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Tệp đề bài ({assignment.assignmentFiles.length}):
              </p>
              <ul className="space-y-1">
                {assignment.assignmentFiles.map((file, idx) => (
                  <li key={idx}>
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      📄 {getFileName(file)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assignment.rubricFiles && assignment.rubricFiles.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Tiêu chí chấm điểm ({assignment.rubricFiles.length}):
              </p>
              <ul className="space-y-1">
                {assignment.rubricFiles.map((file, idx) => (
                  <li key={idx}>
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      📋 {getFileName(file)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
            {getDeadlineStatus()}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentAssignmentItem