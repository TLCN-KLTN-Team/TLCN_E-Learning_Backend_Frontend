"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, FileImage, FileVideo, File, Loader2 } from "lucide-react"
import type { UploadedFile } from "@/types/course.types"
import { Input } from "@/components/ui/input"

interface FileUploadProps {
  files: string[]
  onFilesChange: (files: string[]) => void
  acceptedTypes?: string[]
  maxFileSize?: number // tính bằng MB
  maxFiles?: number
  title?: string
  description?: string
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  acceptedTypes = [
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".xls",
    ".xlsx",
    ".txt",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".mp4",
    ".mov",
    ".avi",
    ".zip",
    ".rar",
  ],
  maxFileSize = 50, // mặc định 50MB
  maxFiles = 10,
  title = "Tài Liệu Đính Kèm",
  description = "Tải lên tệp để hỗ trợ nội dung của bạn",
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split(".").pop()
    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return <FileImage className="h-4 w-4" />
      case "mp4":
      case "mov":
      case "avi":
      case "wmv":
      case "flv":
        return <FileVideo className="h-4 w-4" />
      case "pdf":
      case "doc":
      case "docx":
      case "txt":
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Kích thước tệp vượt quá giới hạn ${maxFileSize}MB`
    }

    const extension = "." + file.name.toLowerCase().split(".").pop()
    if (!acceptedTypes.includes(extension)) {
      return `Loại tệp ${extension} không được hỗ trợ`
    }

    return null
  }

  const simulateFileUpload = async (file: File): Promise<UploadedFile> => {
    // Mô phỏng độ trễ tải lên API
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    const fileMetadata = {
      name: file.name,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    }

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: JSON.stringify(fileMetadata), // Store as JSON string
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }
  }

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return

    const filesToUpload = Array.from(fileList)

    if (uploadedFiles.length + filesToUpload.length > maxFiles) {
      alert(`Tối đa ${maxFiles} tệp được phép`)
      return
    }

    // Xác thực tệp
    const validationErrors: string[] = []
    filesToUpload.forEach((file) => {
      const error = validateFile(file)
      if (error) validationErrors.push(`${file.name}: ${error}`)
    })

    if (validationErrors.length > 0) {
      alert("Lỗi xác thực tệp:\n" + validationErrors.join("\n"))
      return
    }

    setIsUploading(true)

    try {
      // Tải lên tệp (mô phỏng)
      const uploadPromises = filesToUpload.map((file) => simulateFileUpload(file))
      const newUploadedFiles = await Promise.all(uploadPromises)

      const updatedFiles = [...uploadedFiles, ...newUploadedFiles]
      setUploadedFiles(updatedFiles)

      const fileUrls = updatedFiles.map((f) => f.url)
      onFilesChange(fileUrls)
    } catch (error) {
      console.error("Tải lên thất bại:", error)
      alert("Tải lên thất bại. Vui lòng thử lại.")
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter((f) => f.id !== fileId)
    setUploadedFiles(updatedFiles)

    const fileUrls = updatedFiles.map((f) => f.url)
    onFilesChange(fileUrls)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{title}</label>
        <p className="text-sm text-gray-500 mb-2">{description}</p>
      </div>

      {/* Vùng Tải Lên */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          Kéo và thả tệp vào đây, hoặc{" "}
          <Button type="button" variant="link" className="p-0 h-auto" onClick={() => fileInputRef.current?.click()}>
            nhấn để duyệt
          </Button>
        </p>
        <p className="text-xs text-gray-500">Định dạng hỗ trợ: {acceptedTypes.join(", ")}</p>
        <p className="text-xs text-gray-500">
          Kích thước tệp tối đa: {maxFileSize}MB | Số tệp tối đa: {maxFiles}
        </p>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Tiến Trình Tải Lên */}
      {isUploading && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Đang tải lên tệp...</span>
        </div>
      )}

      {/* Danh Sách Tệp Đã Tải Lên */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Tệp Đã Tải Lên</h4>
          <div className="space-y-1">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(file.name)}
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">{formatFileSize(file.size)}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload
