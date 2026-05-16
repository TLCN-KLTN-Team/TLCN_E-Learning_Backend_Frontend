"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ArrowLeft, Building2, User, Shield, AlertCircle, Eye, EyeOff, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Header from "../../../components/student/home/Header"
import Footer from "../../../components/student/home/Footer"
import * as educationUnitApi from "@/services/api/registerEducationUnitApi"
import type { EducationUnitRegistrationRequest } from "@/services/api/request/educationUnitRegistrationRequest"

interface ValidationErrors {
  adminName?: string
  representativeEmail?: string
  businessLicenseSigned?: string
  general?: string
}

const EducationUnitRegistration = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [imageModal, setImageModal] = useState<{ isOpen: boolean; src: string; alt: string }>({
    isOpen: false,
    src: "",
    alt: "",
  })

  const [formData, setFormData] = useState({
    // Education unit information
    name: "",
    type: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: null as File | null,
    description: "",
    establishedYear: "",
    businessLicenseSigned: null as File | null,

    // Admin account information
    adminName: "",
    adminPassword: "",
    adminConfirmPassword: "",

    // Representative information
    representativeName: "",
    representativePosition: "",
    representativePhone: "",
    representativeEmail: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear specific field errors when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }

    // Clear general error when user makes changes
    if (error) {
      setError(null)
    }
  }

  const handleFileChange = (field: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }))

    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }

    if (error) {
      setError(null)
    }
  }

  const isPdfFile = (file: File | null) => {
    if (!file) return false
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  }

  // Enhanced error parsing function
  const parseErrorMessage = (errorMessage: string): ValidationErrors => {
    const errors: ValidationErrors = {}

    // Check for email already exists error
    if (errorMessage.includes("Email") || errorMessage.includes("USER_2003")) {
      errors.representativeEmail = "Email này đã được sử dụng. Vui lòng sử dụng email khác."
    }

    // Check for username already exists error (assuming similar error code/message structure)
    if (errorMessage.includes("Username") || errorMessage.includes("USERNAME_EXISTS")) {
      errors.adminName = "Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên đăng nhập khác."
    }

    if (errorMessage.includes("SIGNATURE") || errorMessage.includes("businessLicenseSigned")) {
      errors.businessLicenseSigned = "File giấy phép đã ký số không hợp lệ. Vui lòng kiểm tra lại chữ ký số."
    }

    // If no specific field errors, set as general error
    if (Object.keys(errors).length === 0) {
      errors.general = errorMessage
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})

    // Validate passwords match
    if (formData.adminPassword !== formData.adminConfirmPassword) {
      setValidationErrors({ general: "Mật khẩu xác nhận không khớp!" })
      return
    }

    // Validate required fields
    if (
      !formData.name ||
      !formData.type ||
      !formData.address ||
      !formData.phone ||
      !formData.email ||
      !formData.description ||
      !formData.establishedYear ||
      !formData.adminName ||
      !formData.adminPassword ||
      !formData.representativeName ||
      !formData.representativePosition ||
      !formData.representativePhone ||
      !formData.representativeEmail ||
      !formData.businessLicenseSigned
    ) {
      setValidationErrors({ general: "Vui lòng điền đầy đủ thông tin bắt buộc!" })
      return
    }

    if (!isPdfFile(formData.businessLicenseSigned)) {
      setValidationErrors({ businessLicenseSigned: "Giấy phép đã ký số phải là file PDF." })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.representativeEmail)) {
      setValidationErrors({ representativeEmail: "Định dạng email không hợp lệ." })
      return
    }
    if (!emailRegex.test(formData.email)) {
      setValidationErrors({ general: "Định dạng email đơn vị không hợp lệ." })
      return
    }

    // Validate password strength
    if (formData.adminPassword.length < 6) {
      setValidationErrors({ general: "Mật khẩu phải có ít nhất 6 ký tự." })
      return
    }

    try {
      setIsLoading(true)

      const registrationData: EducationUnitRegistrationRequest = {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website || undefined,
        description: formData.description,
        establishedYear: Number.parseInt(formData.establishedYear),
        adminName: formData.adminName,
        adminPassword: formData.adminPassword,
        adminConfirmPassword: formData.adminConfirmPassword,
        representativeName: formData.representativeName,
        representativePosition: formData.representativePosition,
        representativePhone: formData.representativePhone,
        representativeEmail: formData.representativeEmail,
      }

      const registrationResponse = await educationUnitApi.registerEducationUnit(
        registrationData,
        formData.logo || undefined,
        formData.businessLicenseSigned || undefined,
      )

      console.log("Registration successful:", registrationResponse)
      toast.success("Đăng ký đơn vị đào tạo thành công!")
      navigate("/")
    } catch (error: any) {
      console.error("Registration error:", error)

      let errorMessage = "Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại."

      // Extract error message from different possible response structures
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error?.message) {
        errorMessage = error.message
      }

      // Parse and set validation errors
      const parsedErrors = parseErrorMessage(errorMessage)
      setValidationErrors(parsedErrors)

      // Set general error if no specific field errors
      if (parsedErrors.general) {
        setError(parsedErrors.general)
      }

      // Show toast notification
      if (parsedErrors.representativeEmail) {
        toast.error(parsedErrors.representativeEmail)
      } else if (parsedErrors.adminName) {
        toast.error(parsedErrors.adminName)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Component for displaying field-specific errors
  const FieldError = ({ error }: { error?: string }) => {
    if (!error) return null
    return (
      <div className="flex items-center gap-1 mt-1">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  const FileUploadArea = ({
    id,
    file,
    onFileChange,
    accept,
    icon: Icon,
    label,
    description,
  }: {
    id: string
    file: File | null
    onFileChange: (file: File | null) => void
    accept: string
    icon: React.ComponentType<any>
    label: string
    description?: string
  }) => {
    const [preview, setPreview] = useState<string | null>(null)

    useEffect(() => {
      if (file && file.type.startsWith("image/")) {
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)
        return () => URL.revokeObjectURL(objectUrl)
      } else {
        setPreview(null)
      }
    }, [file])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] || null
      onFileChange(selectedFile)
    }

    const handleClick = () => {
      document.getElementById(id)?.click()
    }

    const handleRemoveFile = (e: React.MouseEvent) => {
      e.stopPropagation()
      onFileChange(null)
      setPreview(null)
    }

    const handleImageClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (preview) {
        setImageModal({
          isOpen: true,
          src: preview,
          alt: file?.name || "Preview",
        })
      }
    }

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div
          onClick={handleClick}
          className="relative border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 rounded-lg text-center cursor-pointer transition-colors duration-200 hover:bg-muted/30 h-48 w-full flex items-center justify-center"
        >
          <Input id={id} type="file" accept={accept} onChange={handleFileSelect} className="hidden" />

          {preview ? (
            <div className="relative w-full h-full p-2">
              <img
                src={preview || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-full max-w-full max-h-full object-contain rounded-lg cursor-pointer"
                onClick={handleImageClick}
              />
              <button
                onClick={handleRemoveFile}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors z-10"
                aria-label="Xóa file"
                title="Xóa file"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : file ? (
            <div className="relative">
              <Icon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <button onClick={handleRemoveFile} className="mt-2 text-xs text-red-500 hover:text-red-600">
                Xóa file
              </button>
              {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>
          ) : (
            <div>
              <Icon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">Click để chọn file</p>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          )}
        </div>
      </div>
    )
  }

  const ImageModal = () => {
    if (!imageModal.isOpen) return null

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
        onClick={() => setImageModal({ isOpen: false, src: "", alt: "" })}
      >
        <div className="relative max-w-4xl max-h-[90vh] p-4">
          <button
            onClick={() => setImageModal({ isOpen: false, src: "", alt: "" })}
            className="absolute top-2 right-2 bg-white text-black rounded-full h-10 w-10 flex items-center justify-center text-lg hover:bg-gray-200 transition-colors z-10"
            aria-label="Đóng xem ảnh"
            title="Đóng xem ảnh"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={imageModal.src || "/placeholder.svg"}
            alt={imageModal.alt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-12 px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại trang chủ
            </Button>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Đăng ký đơn vị đào tạo</h1>
              <p className="text-muted-foreground">
                Hoàn tất hồ sơ đơn vị và nộp giấy phép hoạt động PDF đã ký số để được xét duyệt nhanh
              </p>
            </div>
          </div>

          {/* General Error Display */}
          {(error || validationErrors.general) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-600 text-sm font-medium">{error || validationErrors.general}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Education Unit Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Tài khoản quản trị viên
                </CardTitle>
                <CardDescription>Tạo tài khoản quản trị viên cho đơn vị đào tạo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Tên đăng nhập *</Label>
                  <Input
                    id="adminName"
                    value={formData.adminName}
                    onChange={(e) => handleInputChange("adminName", e.target.value)}
                    placeholder="admin"
                    required
                    className={validationErrors.adminName ? "border-red-500 focus:border-red-500" : ""}
                  />
                  <FieldError error={validationErrors.adminName} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Mật khẩu *</Label>
                    <div className="relative">
                      <Input
                        id="adminPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.adminPassword}
                        onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                        placeholder="Nhập mật khẩu"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Mật khẩu phải có ít nhất 6 ký tự</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminConfirmPassword">Xác nhận mật khẩu *</Label>
                    <div className="relative">
                      <Input
                        id="adminConfirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.adminConfirmPassword}
                        onChange={(e) => handleInputChange("adminConfirmPassword", e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Representative Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin người đại diện
                </CardTitle>
                <CardDescription>Thông tin của người đại diện chính thức của đơn vị</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="representativeName">Họ và tên *</Label>
                    <Input
                      id="representativeName"
                      value={formData.representativeName}
                      onChange={(e) => handleInputChange("representativeName", e.target.value)}
                      placeholder="Nhập họ và tên"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representativePosition">Chức vụ *</Label>
                    <Input
                      id="representativePosition"
                      value={formData.representativePosition}
                      onChange={(e) => handleInputChange("representativePosition", e.target.value)}
                      placeholder="Hiệu trưởng, Giám đốc..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="representativePhone">Số điện thoại *</Label>
                    <Input
                      id="representativePhone"
                      value={formData.representativePhone}
                      onChange={(e) => handleInputChange("representativePhone", e.target.value)}
                      placeholder="Nhập số điện thoại"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representativeEmail">Email *</Label>
                    <Input
                      id="representativeEmail"
                      type="email"
                      value={formData.representativeEmail}
                      onChange={(e) => handleInputChange("representativeEmail", e.target.value)}
                      placeholder="Nhập email"
                      required
                      className={validationErrors.representativeEmail ? "border-red-500 focus:border-red-500" : ""}
                    />
                    <FieldError error={validationErrors.representativeEmail} />
                    <p className="text-xs text-muted-foreground">Email này sẽ được dùng cho tài khoản quản trị viên</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Thông tin đơn vị đào tạo
                </CardTitle>
                <CardDescription>Vui lòng cung cấp thông tin chi tiết về đơn vị đào tạo của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên đơn vị đào tạo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Nhập tên đơn vị đào tạo"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Loại hình đào tạo *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại hình đào tạo" />
                      </SelectTrigger>
                      <SelectContent className="bg-white shadow-lg rounded-md border border-gray-200">
                        <SelectItem value="university">Đại học</SelectItem>
                        <SelectItem value="college">Cao đẳng</SelectItem>
                        <SelectItem value="vocational">Trung cấp nghề</SelectItem>
                        <SelectItem value="training-center">Trung tâm đào tạo</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Nhập địa chỉ đầy đủ"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Nhập số điện thoại"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Nhập email"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="establishedYear">Năm thành lập *</Label>
                    <Input
                      id="establishedYear"
                      type="number"
                      value={formData.establishedYear}
                      onChange={(e) => handleInputChange("establishedYear", e.target.value)}
                      placeholder="2020"
                      min="1900"
                      max={new Date().getFullYear()}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả về đơn vị *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Mô tả chi tiết về đơn vị đào tạo, lĩnh vực hoạt động, thế mạnh..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUploadArea
                    id="logo"
                    file={formData.logo}
                    onFileChange={(file) => handleFileChange("logo", file)}
                    accept="image/*"
                    icon={Upload}
                    label="Logo đơn vị"
                    description="Chấp nhận các định dạng: JPG, PNG, GIF"
                  />

                  <div className="space-y-2">
                    <FileUploadArea
                      id="businessLicenseSigned"
                      file={formData.businessLicenseSigned}
                      onFileChange={(file) => handleFileChange("businessLicenseSigned", file)}
                      accept=".pdf,application/pdf"
                      icon={Shield}
                      label="Giấy phép hoạt động (PDF đã ký số) *"
                      description="File PDF PAdES đã ký số bằng chứng thư số hợp lệ"
                    />
                    <FieldError error={validationErrors.businessLicenseSigned} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Account Information */}
            

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-base min-w-[200px] disabled:bg-amber-400"
              >
                {isLoading ? "Đang xử lý..." : "Đăng ký đơn vị"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />

      <ImageModal />
    </div>
  )
}

export default EducationUnitRegistration
