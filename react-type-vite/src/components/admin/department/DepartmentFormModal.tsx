import React, { useState, useEffect } from "react";
import { X, Building, FileText, Plus, Edit } from "lucide-react";
import { toast } from 'react-toastify';
import { Button } from "@/components/ui/button";
import * as departmentApi from "@/services/api/admin/departmentApi";
import type { DepartmentResponse } from "@/services/api/response/departmentResponse";

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  educationalUnitId: number;
  onSuccess?: () => void;
  editingDepartment?: DepartmentResponse | null;
}

interface DepartmentFormData {
  name: string;
  description: string;
}

const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
  isOpen,
  onClose,
  educationalUnitId,
  onSuccess,
  editingDepartment = null,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState<DepartmentFormData>({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Kiểm tra xem đây là chế độ edit hay tạo mới
  const isEditMode = Boolean(editingDepartment);

  // Load department data when editing
  useEffect(() => {
    if (isOpen && editingDepartment) {
      setForm({
        name: editingDepartment.name || "",
        description: editingDepartment.description || "",
      });
    } else if (isOpen && !editingDepartment) {
      // Reset form for new department
      setForm({
        name: "",
        description: "",
      });
    }
    setErrors({});
  }, [isOpen, editingDepartment]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'Tên khoa không được để trống';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Tên khoa phải có ít nhất 2 ký tự';
    } else if (form.name.trim().length > 255) {
      newErrors.name = 'Tên khoa không được vượt quá 255 ký tự';
    }

    if (form.description && form.description.length > 1000) {
      newErrors.description = 'Mô tả không được vượt quá 1000 ký tự';
    }
    
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
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
      
      if (isEditMode && editingDepartment) {
        // Update department
        await departmentApi.updateDepartment(educationalUnitId, editingDepartment.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined
        });
        toast.success('Cập nhật khoa thành công!');
      } else {
        // Create new department
        await departmentApi.createDepartment(educationalUnitId, {
          name: form.name.trim(),
          description: form.description.trim() || undefined
        });
        toast.success('Tạo khoa thành công!');
      }
      
      onSuccess?.();
      onClose();
      
      // Reset form
      setForm({
        name: "",
        description: "",
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error saving department:', error);
      
      // Enhanced error handling with multiple fallbacks
      let errorMessage = isEditMode ? 'Không thể cập nhật khoa' : 'Không thể tạo khoa';
      let fieldErrors: Record<string, string> = {};
      
      // Try to extract error message from various possible locations
      let backendMessage = '';
      
      if (error?.response?.data?.message) {
        backendMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        backendMessage = error.response.data.error;
      } else if (error?.response?.data) {
        // If data is a string
        backendMessage = typeof error.response.data === 'string' ? error.response.data : '';
      } else if (error?.message) {
        backendMessage = error.message;
      }
      
      if (backendMessage) {
        errorMessage = backendMessage;
        
        // Map specific error messages to form fields
        const lowerMessage = backendMessage.toLowerCase();
        
        if (lowerMessage.includes('name') || lowerMessage.includes('tên')) {
          if (backendMessage.includes('đã tồn tại') || lowerMessage.includes('already exists')) {
            fieldErrors.name = 'Tên khoa này đã được sử dụng';
            errorMessage = 'Tên khoa đã tồn tại. Vui lòng sử dụng tên khác.';
          } else {
            fieldErrors.name = backendMessage;
          }
        }
      }
      
      // Handle validation errors if they come in a different format
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach((err: any) => {
          if (err.field && err.message) {
            fieldErrors[err.field] = err.message;
          }
        });
      }
      
      // Set field-specific errors
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(prevErrors => ({
          ...prevErrors,
          ...fieldErrors
        }));
      }
      
      // Show toast error
      toast.error(errorMessage);
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
        <div className={`${isEditMode ? 'bg-gradient-to-r from-orange-600 to-orange-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} px-6 py-4`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                {isEditMode ? <Edit className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
              </div>
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Chỉnh Sửa Khoa' : 'Tạo Khoa Mới'}
              </h2>
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
          <p className={`${isEditMode ? 'text-orange-100' : 'text-blue-100'} text-sm mt-2`}>
            {isEditMode ? `Cập nhật thông tin khoa ${form.name}` : 'Thêm khoa mới vào cơ sở giáo dục của bạn'}
          </p>
        </div>
        
        {/* Form Content với Footer bên trong */}
        <div className="flex flex-col h-[calc(90vh-120px)]">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Building size={16} className="mr-2" />
                  Thông Tin Khoa
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Building size={14} className="mr-2 text-blue-600" />
                      Tên Khoa
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      name="name" 
                      placeholder="Ví dụ: Khoa Công nghệ Thông tin" 
                      value={form.name} 
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <FileText size={16} className="mr-2" />
                  Mô Tả
                  <span className="text-gray-400 ml-2 text-xs">(Tùy chọn)</span>
                </h3>
                
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FileText size={14} className="mr-2 text-purple-600" />
                    Mô Tả Chi Tiết
                  </label>
                  <textarea
                    name="description"
                    placeholder="Nhập mô tả về khoa (tùy chọn)..."
                    value={form.description}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg resize-none focus:outline-none transition-colors ${
                      errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                    }`}
                    rows={4}
                  />
                  <div className="flex justify-between items-center">
                    {errors.description ? (
                      <p className="text-red-500 text-xs flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Tối đa 1000 ký tự</p>
                    )}
                    <p className="text-sm text-gray-500">{form.description.length}/1000</p>
                  </div>
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
                onClick={handleSubmit}
                className={`px-6 py-2 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isEditMode 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isEditMode ? 'Đang cập nhật...' : 'Đang tạo...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    {isEditMode ? <Edit size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
                    {isEditMode ? 'Cập Nhật Khoa' : 'Tạo Khoa'}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentFormModal;