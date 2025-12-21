import React, { useState, useEffect } from "react";
import { X, BookOpen, Users, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as courseApi from "@/services/api/admin/courseApi";
import { toast } from "react-toastify";
import type { CourseRequest } from "@/services/api/request/courseRequest";

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  educationalUnitId: number;
  onSuccess?: () => void;
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  educationalUnitId,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<CourseRequest>({
    courseName: "",
    credits: 3,
    maxStudents: 0,
    description: "",
    idTeacher: "GV001",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load course types when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCourseTypes();
    }
  }, [isOpen]);

  const loadCourseTypes = async () => {
    try {
    } catch (error) {
      console.error("Error loading course types:", error);
      toast.error("Không thể tải danh sách loại khóa học");
    } finally {
    }
  };

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.courseName.trim()) {
      newErrors.courseName = "Tên khóa học là bắt buộc";
    }
    if (!form.credits || form.credits < 1) {
      newErrors.credits = "Số tín chỉ phải ít nhất là 1";
    }
    return newErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === "number" ? Number(value) : value,
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsLoading(true);
      await courseApi.createCourse(educationalUnitId, form);
      toast.success("Tạo khóa học thành công!");
      onSuccess?.();
      onClose();

      // Reset form
      setForm({
        courseName: "",
        credits: 3,
        maxStudents: 0,
        description: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Không thể tạo khóa học");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      ></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Tạo Khóa học Mới</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X size={18} />
            </Button>
          </div>
          <p className="text-blue-100 text-sm mt-2">
            Thêm khóa học mới vào cơ sở giáo dục của bạn
          </p>
        </div>

        {/* Form Content với Footer bên trong */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-[calc(90vh-120px)]"
        >
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Course Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <BookOpen size={16} className="mr-2" />
                  Thông tin Khóa học
                </h3>

                <div className="space-y-4">
                  {/* Course Name */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <BookOpen size={14} className="mr-2 text-blue-600" />
                      Tên Khóa học
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      name="courseName"
                      placeholder="VD: Nhập môn Khoa học Máy tính"
                      value={form.courseName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                        errors.courseName
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-blue-500"
                      }`}
                    />
                    {errors.courseName && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.courseName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Users size={16} className="mr-2" />
                  Chi tiết Khóa học
                </h3>

                {/* Credits Row */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Clock size={14} className="mr-2 text-green-600" />
                      Số Tín chỉ
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      name="credits"
                      type="number"
                      placeholder="3"
                      value={form.credits || ""}
                      onChange={handleChange}
                      min="1"
                      max="10"
                      className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                        errors.credits
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-blue-500"
                      }`}
                    />
                    {errors.credits && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.credits}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <FileText size={16} className="mr-2" />
                  Thông tin Bổ sung
                  <span className="text-gray-400 ml-2 text-xs">
                    (Không bắt buộc)
                  </span>
                </h3>

                {/* Description */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FileText size={14} className="mr-2 text-orange-600" />
                    Mô tả
                  </label>
                  <textarea
                    name="description"
                    placeholder="Cung cấp mô tả ngắn gọn về nội dung và mục tiêu của khóa học..."
                    value={form.description || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:border-orange-500 focus:outline-none transition-colors"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Moved inside form */}
          <div className="border-t bg-gray-50 px-6 py-4 mt-auto">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang tạo...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <BookOpen size={16} className="mr-2" />
                    Tạo Khóa học
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseFormModal;