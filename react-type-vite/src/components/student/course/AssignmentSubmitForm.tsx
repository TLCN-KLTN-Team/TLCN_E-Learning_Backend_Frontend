"use client"

import type React from "react"
import { useState } from "react"
import {
  X,
  Upload,
  Link as LinkIcon,
  FileText,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import assignmentApi from "@/services/api/student/assignmentApi"
import type { AssignmentDetailResponse } from "@/services/api/response/assignmentDetailResponse"
import type { AssignmentSubmissionResponse } from "@/services/api/response/assignmentSubmissionResponse"
import fileApi from "@/services/api/teacher/fileApi"

interface AssignmentSubmitFormProps {
  assignment: AssignmentDetailResponse
  existingSubmission?: AssignmentSubmissionResponse | null
  onClose: () => void
  onSuccess: () => void
}

const AssignmentSubmitForm: React.FC<AssignmentSubmitFormProps> = ({
  assignment,
  existingSubmission,
  onClose,
  onSuccess,
}) => {
  const [submissionText, setSubmissionText] = useState(existingSubmission?.submissionText || "")
  const [submissionFiles, setSubmissionFiles] = useState<string[]>(
    existingSubmission?.submissionFiles || []
  )
  const [submissionLink, setSubmissionLink] = useState(existingSubmission?.submissionLink || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)

  const canSubmitText = ["TEXT", "BOTH"].includes(assignment.submissionType)
  const canSubmitFile = ["UPLOAD_FILE", "BOTH"].includes(assignment.submissionType)
  const canSubmitLink = ["LINK", "BOTH"].includes(assignment.submissionType)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingFiles(true)
    setError(null)

    try {
      const fileArray = Array.from(files)
      
      // Validate file sizes before uploading
      const maxSize = 10 * 1024 * 1024 // 10MB
      for (const file of fileArray) {
        if (file.size > maxSize) {
          throw new Error(`File "${file.name}" quá lớn. Kích thước tối đa là 10MB.`)
        }
      }

      // Upload files using the API service
      const uploadResults = await fileApi.uploadMultipleFiles(fileArray)
      
      // Extract URLs from results
      const uploadedUrls = uploadResults.map(result => result.url)
      
      // Add to existing files
      setSubmissionFiles([...submissionFiles, ...uploadedUrls])
      
      // Reset file input
      event.target.value = ""
      
    } catch (err: any) {
      console.error("Error uploading files:", err)
      
      // Handle different error types
      if (err.message) {
        setError(err.message)
      } else if (err.code) {
        // Handle AppError from axiosInstance
        setError(err.message || "Lỗi khi upload file")
      } else {
        setError("Không thể upload file. Vui lòng kiểm tra kết nối mạng và thử lại.")
      }
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleRemoveFile = (index: number) => {
    setSubmissionFiles(submissionFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Validate
      if (canSubmitText && !submissionText && submissionFiles.length === 0 && !submissionLink) {
        setError("Vui lòng nhập nội dung bài làm")
        setIsSubmitting(false)
        return
      }

      const submitData = {
        assignmentId: assignment.id,
        submissionText: canSubmitText ? submissionText : undefined,
        submissionFiles: canSubmitFile ? submissionFiles : undefined,
        submissionLink: canSubmitLink ? submissionLink : undefined,
      }

      if (existingSubmission) {
        // Update existing submission
        await assignmentApi.updateSubmission(existingSubmission.id, submitData)
      } else {
        // Create new submission
        await assignmentApi.submitAssignment(assignment.id, submitData)
      }

      onSuccess()
    } catch (err) {
      console.error("Error submitting assignment:", err)
      setError("Không thể nộp bài. Vui lòng thử lại.")
      setIsSubmitting(false)
    }
  }

  const getFileName = (url: string): string => {
    return url.split("/").pop() || "file"
  }

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {existingSubmission ? "Cập nhật bài nộp" : "Nộp bài tập"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{assignment.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Text Submission */}
          {canSubmitText && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung bài làm
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập nội dung bài làm của bạn..."
              />
            </div>
          )}

          {/* File Upload */}
          {canSubmitFile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tệp đính kèm
              </label>
              
              {/* Upload Button */}
              <div className="mb-3">
                <label className="cursor-pointer">
                  <div className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg transition ${
                    uploadingFiles 
                      ? "border-gray-300 bg-gray-50 cursor-not-allowed" 
                      : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                  }`}>
                    {uploadingFiles ? (
                      <Loader2 className="h-5 w-5 text-gray-600 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5 text-gray-600" />
                    )}
                    <span className="text-sm text-gray-600">
                      {uploadingFiles ? "Đang upload..." : "Chọn file để upload (Tối đa 10MB/file)"}
                    </span>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingFiles}
                    accept="*/*"
                  />
                </label>
              </div>

              {/* Uploaded Files List */}
              {submissionFiles.length > 0 && (
                <div className="space-y-2">
                  {submissionFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 border rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{getFileName(file)}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="p-1 hover:bg-gray-200 rounded"
                        disabled={uploadingFiles || isSubmitting}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Link Submission */}
          {canSubmitLink && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link bài làm
              </label>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingFiles}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang nộp...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {existingSubmission ? "Cập nhật" : "Nộp bài"}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default AssignmentSubmitForm