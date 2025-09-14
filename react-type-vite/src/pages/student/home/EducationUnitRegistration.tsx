"use client"

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ArrowLeft, Building2, User, FileText, Shield } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Header from "../../../components/student/home/Header"
import Footer from "../../../components/student/home/Footer"
import { useEducationUnit } from "@/context/register-education-unit-context"
import type { EducationUnitRegistrationRequest } from "@/services/api/registerEducationUnitApi"

const EducationUnitRegistration = () => {
  const navigate = useNavigate()
  const { registerEducationUnit, isLoading } = useEducationUnit()
  const [error, setError] = useState<string | null>(null)
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
    businessLicense: null as File | null,

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
  }

  const handleFileChange = (field: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (formData.adminPassword !== formData.adminConfirmPassword) {
      setError("Mật khẩu xác nhận không khớp!")
      return
    }

    // Validate required fields
    if (!formData.name || !formData.type || !formData.address || !formData.phone || 
        !formData.email || !formData.description || !formData.establishedYear ||
        !formData.adminName || !formData.adminPassword || !formData.representativeName ||
        !formData.representativePosition || !formData.representativePhone || 
        !formData.representativeEmail) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc!")
      return
    }

    try {
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

      const registrationResponse = await registerEducationUnit(
        registrationData, 
        formData.logo || undefined, 
        formData.businessLicense || undefined
      )

      console.log("Registration successful:", registrationResponse)
      navigate("/")
    } catch (error) {
      console.error("Registration error:", error)
      setError("Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại.")
    }
  }

  // Component for file upload with preview
  const FileUploadArea = ({ 
    id, 
    file, 
    onFileChange, 
    accept, 
    icon: Icon, 
    label, 
    description 
  }: {
    id: string;
    file: File | null;
    onFileChange: (file: File | null) => void;
    accept: string;
    icon: React.ComponentType<any>;
    label: string;
    description?: string;
  }) => {
    const [preview, setPreview] = useState<string | null>(null)

    useEffect(() => {
      if (file && file.type.startsWith('image/')) {
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

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div 
          onClick={handleClick}
          className="relative border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 hover:bg-muted/30"
        >
          <Input
            id={id}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {preview ? (
            <div className="relative">
              <img 
                src={preview} 
                alt="Preview" 
                className="mx-auto h-128 w-128 object-cover rounded-lg"
              />
              <button
                onClick={handleRemoveFile}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          ) : file ? (
            <div className="relative">
              <Icon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <button
                onClick={handleRemoveFile}
                className="mt-2 text-xs text-red-500 hover:text-red-600"
              >
                Xóa file
              </button>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          ) : (
            <div>
              <Icon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">
                Click để chọn file
              </p>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          )}
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
                Đăng ký đơn vị của bạn để tham gia nền tảng học tập số của chúng tôi
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Education Unit Information */}
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

                  <FileUploadArea
                    id="businessLicense"
                    file={formData.businessLicense}
                    onFileChange={(file) => handleFileChange("businessLicense", file)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    icon={FileText}
                    label="Giấy phép hoạt động"
                    description="Chấp nhận các định dạng: PDF, JPG, PNG"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Admin Account Information */}
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
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Mật khẩu *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                      placeholder="Nhập mật khẩu"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminConfirmPassword">Xác nhận mật khẩu *</Label>
                    <Input
                      id="adminConfirmPassword"
                      type="password"
                      value={formData.adminConfirmPassword}
                      onChange={(e) => handleInputChange("adminConfirmPassword", e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      required
                    />
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
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-base min-w-[200px]"
              >
                {isLoading ? "Đang xử lý..." : "Đăng ký đơn vị"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default EducationUnitRegistration