"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  X,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
  Upload,
  CheckCircle,
  Clock,
  Award,
  Paperclip,
  Link as LinkIcon,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import assignmentApi from "@/services/api/student/assignmentApi"
import AssignmentSubmitForm from "./AssignmentSubmitForm"
import type { AssignmentDetailResponse } from "@/services/api/response/assignmentDetailResponse"
import type { AssignmentSubmissionResponse } from "@/services/api/response/assignmentSubmissionResponse"
import DiscussionSection from "./DiscussionSection"

interface AssignmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  assignmentId: number
}

const AssignmentDetailModal: React.FC<AssignmentDetailModalProps> = ({
  isOpen,
  onClose,
  assignmentId,
}) => {
  const [assignment, setAssignment] = useState<AssignmentDetailResponse | null>(null)
  const [mySubmission, setMySubmission] = useState<AssignmentSubmissionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [activeTab, setActiveTab] = useState<"info" | "discussion">("info")

  useEffect(() => {
    if (isOpen && assignmentId) {
      fetchAssignmentDetail()
    }
  }, [isOpen, assignmentId])

  const fetchAssignmentDetail = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [assignmentData, submissionData] = await Promise.all([
        assignmentApi.getAssignmentDetail(assignmentId),
        assignmentApi.getMySubmission(assignmentId),
      ])

      setAssignment(assignmentData)
      setMySubmission(submissionData)
    } catch (err) {
      console.error("Error fetching assignment detail:", err)
      setError("Không thể tải thông tin bài tập")
    } finally {
      setIsLoading(false)
    }
  }

  const getFileName = (fileData: string): string => {
    try {
      const metadata = JSON.parse(fileData)
      return metadata.name || "Tệp không xác định"
    } catch {
      return fileData.split("/").pop() || "Tệp không xác định"
    }
  }

  const isDeadlinePassed = () => {
    if (!assignment) return false
    return new Date(assignment.deadline) < new Date()
  }

  const getDaysUntilDeadline = () => {
    if (!assignment) return 0
    return Math.ceil(
      (new Date(assignment.deadline).getTime() - new Date().getTime()) / 
      (1000 * 60 * 60 * 24)
    )
  }

  const getDeadlineStatus = () => {
    if (isDeadlinePassed()) {
      return {
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: <AlertTriangle className="h-5 w-5" />,
        text: "Đã hết hạn"
      }
    }
    const days = getDaysUntilDeadline()
    if (days <= 3) {
      return {
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        icon: <AlertTriangle className="h-5 w-5" />,
        text: `${days} ngày còn lại`
      }
    }
    return {
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: <Clock className="h-5 w-5" />,
      text: `${days} ngày còn lại`
    }
  }

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
        <div className="p-8 flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Đang tải thông tin bài tập...</p>
        </div>
      </Modal>
    )
  }

  if (error || !assignment) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
        <div className="p-8">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <p className="font-medium">{error || "Không tìm thấy bài tập"}</p>
          </div>
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </Modal>
    )
  }

  const deadlineStatus = getDeadlineStatus()

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {assignment.title}
            </h2>
            {assignment.description && (
              <p className="text-gray-600">{assignment.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6 mt-4">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === "info"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileText className="w-4 h-4" />
              Thông tin & Nộp bài
            </button>
            <button
              onClick={() => setActiveTab("discussion")}
              className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === "discussion"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Thảo luận
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "info" && (
            <>
              {/* Assignment Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-lg mb-4">Thông tin bài tập</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Hạn nộp</p>
                      <p className="font-medium">
                        {new Date(assignment.deadline).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Loại nộp</p>
                      <p className="font-medium">{assignment.submissionType}</p>
                    </div>
                  </div>
                  {assignment.maxScore && (
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Điểm tối đa</p>
                        <p className="font-medium">{assignment.maxScore}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Deadline Status */}
                <div className={`mt-4 pt-4 border-t border-blue-200 flex items-center gap-2 ${deadlineStatus.color}`}>
                  {deadlineStatus.icon}
                  <span className="font-medium">{deadlineStatus.text}</span>
                </div>
              </div>

              {/* Assignment Files */}
              {assignment.assignmentFiles && assignment.assignmentFiles.length > 0 && (
                <div className="bg-gray-50 border rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Tệp đề bài ({assignment.assignmentFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {assignment.assignmentFiles.map((file, idx) => (
                      <a
                        key={idx}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-white border rounded hover:bg-gray-50 transition"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-600 hover:underline">
                          {getFileName(file)}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Rubric Files */}
              {assignment.rubricFiles && assignment.rubricFiles.length > 0 && (
                <div className="bg-gray-50 border rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Tiêu chí chấm điểm ({assignment.rubricFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {assignment.rubricFiles.map((file, idx) => (
                      <a
                        key={idx}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-white border rounded hover:bg-gray-50 transition"
                      >
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 hover:underline">
                          {getFileName(file)}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* My Submission */}
              {mySubmission && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Bài nộp của bạn</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Thời gian nộp:</p>
                      <p className="font-medium">
                        {new Date(mySubmission.submittedAt).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    {mySubmission.submissionText && (
                      <div>
                        <p className="text-sm text-gray-600">Nội dung:</p>
                        <p className="font-medium bg-white p-3 rounded border">
                          {mySubmission.submissionText}
                        </p>
                      </div>
                    )}

                    {mySubmission.submissionFiles && mySubmission.submissionFiles.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Tệp đính kèm:</p>
                        <div className="space-y-1">
                          {mySubmission.submissionFiles.map((file, idx) => (
                            <a
                              key={idx}
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              {getFileName(file)}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {mySubmission.submissionLink && (
                      <div>
                        <p className="text-sm text-gray-600">Link:</p>
                        <a
                          href={mySubmission.submissionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          {mySubmission.submissionLink}
                        </a>
                      </div>
                    )}

                    {mySubmission.status && (
                      <div>
                        <p className="text-sm text-gray-600">Trạng thái:</p>
                        <span
                          className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                            mySubmission.status === "GRADED"
                              ? "bg-green-100 text-green-800"
                              : mySubmission.status === "LATE"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {mySubmission.status}
                        </span>
                      </div>
                    )}

                    {mySubmission.score !== undefined && mySubmission.score !== null && (
                      <div>
                        <p className="text-sm text-gray-600">Điểm:</p>
                        <p className="text-2xl font-bold text-green-600">
                          {mySubmission.score}/{assignment.maxScore}
                        </p>
                      </div>
                    )}

                    {mySubmission.feedback && (
                      <div>
                        <p className="text-sm text-gray-600">Nhận xét:</p>
                        <p className="font-medium bg-white p-3 rounded border">
                          {mySubmission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warning if late */}
              {isDeadlinePassed() && !mySubmission && (
                <div className={`p-4 ${deadlineStatus.bgColor} border ${deadlineStatus.borderColor} rounded-lg mb-6`}>
                  <div className={`flex items-center gap-2 ${deadlineStatus.color}`}>
                    <AlertTriangle className="h-5 w-5" />
                    <p className="font-medium">
                      Đã quá hạn nộp bài ({new Date(assignment.deadline).toLocaleString("vi-VN")})
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Đóng
                </Button>
                
                {!mySubmission && !isDeadlinePassed() && (
                  <Button
                    onClick={() => setShowSubmitForm(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Nộp bài
                  </Button>
                )}

                {mySubmission && !isDeadlinePassed() && (
                  <Button
                    onClick={() => setShowSubmitForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Nộp lại bài
                  </Button>
                )}
              </div>
            </>
          )}

          {activeTab === "discussion" && (
            <DiscussionSection
              itemType="assignment"
              itemId={assignmentId}
              itemTitle={assignment.title}
            />
          )}
        </div>
      </div>

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <AssignmentSubmitForm
          assignment={assignment}
          existingSubmission={mySubmission}
          onClose={() => setShowSubmitForm(false)}
          onSuccess={() => {
            setShowSubmitForm(false)
            fetchAssignmentDetail()
          }}
        />
      )}
    </Modal>
  )
}

export default AssignmentDetailModal