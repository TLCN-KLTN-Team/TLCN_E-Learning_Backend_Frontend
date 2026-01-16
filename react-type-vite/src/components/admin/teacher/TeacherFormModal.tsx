import React, { useState, useEffect } from "react";
import { X, User, Mail, Lock, Calendar, Hash, Building, CreditCard, FileText, Link, UserCheck, ChevronDown, Eye, EyeOff, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from 'react-toastify';
import * as teacherApi from "@/services/api/admin/teacherApi";
import * as departmentApi from "@/services/api/admin/departmentApi";
import type { TeacherRequest } from "@/services/api/request/teacherRequest";
import type { TeacherResponse } from "@/services/api/response/teacherResponse";
import type { DepartmentResponse } from "@/services/api/response/departmentResponse";

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  educationalUnitId: number;
  onSuccess?: () => void;
  editingTeacher?: TeacherResponse | null;
}

const TeacherFormModal: React.FC<TeacherFormModalProps> = ({
  isOpen,
  onClose,
  educationalUnitId,
  onSuccess,
  editingTeacher = null,
}) => {
  const [form, setForm] = useState<Omit<TeacherRequest, 'educationalUnitId'>>({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    teacherId: "",
    dob: "",
    departmentId: "",
    description: "",
    socialUrl: "",
    bankAccountNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Kiểm tra xem đây là chế độ edit hay tạo mới
  const isEditMode = Boolean(editingTeacher);

  // Load departments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  // Load teacher data when editing
  useEffect(() => {
    if (isOpen && editingTeacher) {
      setForm({
        username: editingTeacher.username || "",
        password: "", // Không hiển thị mật khẩu cũ
        email: editingTeacher.email || "",
        firstName: editingTeacher.firstName || "",
        lastName: editingTeacher.lastName || "",
        teacherId: editingTeacher.teacherId || "",
        dob: editingTeacher.dob || "",
        departmentId: editingTeacher.departmentId || "",
        description: editingTeacher.description || "",
        bankAccountNumber: editingTeacher.bankAccountNumber || "",
      });
    } else if (isOpen && !editingTeacher) {
      // Reset form for new teacher
      setForm({
        username: "",
        password: "",
        email: "",
        firstName: "",
        lastName: "",
        teacherId: "",
        dob: "",
        departmentId: "",
        description: "",
        socialUrl: "",
        bankAccountNumber: "",
      });
    }
    setErrors({});
  }, [isOpen, editingTeacher]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      console.log('Loading departments for unit:', educationalUnitId);
      const response = await departmentApi.getDepartmentsByEducationalUnit(educationalUnitId, 0, 100);
      console.log('Departments response:', response);
      setDepartments(response.content || []);
      console.log('Departments set:', response.content);
    } catch (error: any) {
      console.error('Error loading departments:', error);
      console.error('Error details:', error?.response?.data || error?.message);
      toast.error('Không thể tải danh sách khoa/phòng ban');
    } finally {
      setLoadingDepartments(false);
    }
  };

  if (!isOpen) return null;

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.username || form.username.length < 3) {
      newErrors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Định dạng email không hợp lệ";
    }
    // Chỉ validate password nếu là chế độ tạo mới hoặc user nhập password mới
    if (!isEditMode) {
      if (!form.password || form.password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      }
    } else if (form.password && form.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (!form.firstName) {
      newErrors.firstName = "Tên là bắt buộc";
    }
    if (!form.lastName) {
      newErrors.lastName = "Họ là bắt buộc";
    }
    if (!form.teacherId) {
      newErrors.teacherId = "Mã giảng viên là bắt buộc";
    }
    
    // Validate age - must be over 18
    if (form.dob) {
      const age = calculateAge(form.dob);
      if (age < 18) {
        newErrors.dob = "Giảng viên phải từ 18 tuổi trở lên";
      }
    }
    
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      
      if (isEditMode && editingTeacher) {
        // Update teacher
        const updateData: Partial<TeacherRequest> = {
          username: form.username,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          teacherId: form.teacherId,
          dob: form.dob,
          departmentId: form.departmentId,
          description: form.description,
          socialUrl: form.socialUrl,
          bankAccountNumber: form.bankAccountNumber,
          educationalUnitId: educationalUnitId,
        };
        
        // Chỉ gửi password nếu user đã nhập password mới
        if (form.password) {
          updateData.password = form.password;
        }
        
        await teacherApi.updateTeacher(educationalUnitId, editingTeacher.id, updateData);
        toast.success('Cập nhật giảng viên thành công!');
      } else {
        // Create new teacher
        const teacherData: TeacherRequest = {
          ...form,
          educationalUnitId: educationalUnitId,
        };
        
        await teacherApi.createTeacher(educationalUnitId, teacherData);
        toast.success('Tạo giảng viên thành công!');
      }
      
      onSuccess?.();
      onClose();
      
      // Reset form
      setForm({
        username: "",
        password: "",
        email: "",
        firstName: "",
        lastName: "",
        teacherId: "",
        dob: "",
        departmentId: "",
        description: "",
        socialUrl: "",
        bankAccountNumber: "",
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error saving teacher:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Enhanced error handling with multiple fallbacks
      let errorMessage = isEditMode ? 'Không thể cập nhật giảng viên' : 'Không thể tạo giảng viên';
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
      
      console.log('Extracted backend message:', backendMessage);
      
      if (backendMessage) {
        errorMessage = backendMessage;
        
        // Map specific error messages to form fields
        const lowerMessage = backendMessage.toLowerCase();
        
        if (lowerMessage.includes('email')) {
          if (backendMessage.includes('đã tồn tại') || lowerMessage.includes('already exists')) {
            fieldErrors.email = 'Email này đã được đăng ký';
            errorMessage = 'Email đã tồn tại. Vui lòng sử dụng email khác.';
          } else {
            fieldErrors.email = backendMessage;
          }
        } else if (lowerMessage.includes('username')) {
          if (backendMessage.includes('đã tồn tại') || lowerMessage.includes('already exists')) {
            fieldErrors.username = 'Tên đăng nhập này đã được sử dụng';
            errorMessage = 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.';
          } else {
            fieldErrors.username = backendMessage;
          }
        } else if (lowerMessage.includes('teacher id') || lowerMessage.includes('teacherid')) {
          if (backendMessage.includes('đã tồn tại') || lowerMessage.includes('already exists')) {
            fieldErrors.teacherId = 'Mã giảng viên này đã được sử dụng';
            errorMessage = 'Mã giảng viên đã tồn tại. Vui lòng sử dụng mã khác.';
          } else {
            fieldErrors.teacherId = backendMessage;
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
                {isEditMode ? <Edit className="w-5 h-5 text-white" /> : <UserCheck className="w-5 h-5 text-white" />}
              </div>
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Chỉnh Sửa Giảng Viên' : 'Tạo Giảng Viên Mới'}
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
            {isEditMode ? `Cập nhật thông tin giảng viên ${form.firstName} ${form.lastName}` : 'Thêm giảng viên mới vào trường của bạn'}
          </p>
        </div>
        
        {/* Form Content with Footer inside */}
        <div className="flex flex-col h-[calc(90vh-120px)]">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <User size={16} className="mr-2" />
                  Thông Tin Cá Nhân
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <User size={14} className="mr-2 text-blue-600" />
                      Tên
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      name="firstName" 
                      placeholder="Nhập tên" 
                      value={form.firstName} 
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <User size={14} className="mr-2 text-blue-600" />
                      Họ
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      name="lastName" 
                      placeholder="Nhập họ" 
                      value={form.lastName} 
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Calendar size={14} className="mr-2 text-blue-600" />
                    Ngày Sinh
                    <span className="text-gray-400 ml-1 text-xs">(Phải từ 18 tuổi trở lên)</span>
                  </label>
                  <input 
                    name="dob" 
                    type="date" 
                    value={form.dob} 
                    onChange={handleChange}
                    aria-label="Chọn ngày sinh"
                    className={`w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none ${errors.dob ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                  />
                  {errors.dob && (
                    <p className="text-red-500 text-xs flex items-center mt-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.dob}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Lock size={16} className="mr-2" />
                  Thông Tin Tài Khoản
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <User size={14} className="mr-2 text-green-600" />
                      Tên Đăng Nhập
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      name="username" 
                      placeholder="Nhập tên đăng nhập (tối thiểu 3 ký tự)" 
                      value={form.username} 
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.username ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                    />
                    {errors.username && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.username}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <Mail size={14} className="mr-2 text-green-600" />
                        Email
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input 
                        name="email" 
                        type="email" 
                        placeholder="giaovien@example.com" 
                        value={form.email} 
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs flex items-center mt-1">
                          <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                          {errors.email}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <Lock size={14} className="mr-2 text-green-600" />
                        Mật Khẩu
                        {!isEditMode && <span className="text-red-500 ml-1">*</span>}
                        {isEditMode && <span className="text-gray-400 ml-1 text-xs">(Để trống nếu không đổi)</span>}
                      </label>
                      <div className="relative">
                        <input 
                          name="password" 
                          type={showPassword ? "text" : "password"}
                          placeholder={isEditMode ? "Nhập mật khẩu mới (tùy chọn)" : "Tối thiểu 6 ký tự"} 
                          value={form.password} 
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg transition-colors pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-xs flex items-center mt-1">
                          <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                          {errors.password}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Building size={16} className="mr-2" />
                  Thông Tin Nghề Nghiệp
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Hash size={14} className="mr-2 text-purple-600" />
                      Mã Giảng Viên
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      name="teacherId" 
                      placeholder="vd: GV001" 
                      value={form.teacherId} 
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.teacherId ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                    />
                    {errors.teacherId && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.teacherId}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Building size={14} className="mr-2 text-purple-600" />
                      Khoa/Phòng Ban
                    </label>
                    <div className="relative">
                      <select
                        name="departmentId"
                        aria-label="Chọn khoa hoặc phòng ban"
                        value={form.departmentId || ""}
                        onChange={handleChange}
                        disabled={loadingDepartments}
                        className={`w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm transition-colors focus:border-purple-500 focus:outline-none appearance-none ${
                          loadingDepartments ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        }`}
                      >
                        <option value="">
                          {loadingDepartments ? "Đang tải khoa/phòng ban..." : "Chọn khoa/phòng ban (tùy chọn)"}
                        </option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        size={16}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial & Additional Information */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <CreditCard size={16} className="mr-2" />
                  Thông Tin Tài Chính & Bổ Sung
                  <span className="text-gray-400 ml-2 text-xs">(Tùy chọn)</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <CreditCard size={14} className="mr-2 text-orange-600" />
                      Số Tài Khoản Ngân Hàng
                    </label>
                    <input 
                      name="bankAccountNumber" 
                      placeholder="Nhập số tài khoản ngân hàng" 
                      value={form.bankAccountNumber} 
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg transition-colors border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Link size={14} className="mr-2 text-orange-600" />
                      Liên Kết Mạng Xã Hội
                    </label>
                    <input 
                      name="socialUrl" 
                      placeholder="https://linkedin.com/in/giaovien" 
                      value={form.socialUrl} 
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg transition-colors border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FileText size={14} className="mr-2 text-orange-600" />
                      Mô Tả
                    </label>
                    <textarea
                      name="description"
                      placeholder="Thông tin bổ sung về chuyên môn, kinh nghiệm hoặc chuyên ngành của giảng viên..."
                      value={form.description}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:border-orange-500 focus:outline-none transition-colors"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer - Inside form */}
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
                    {isEditMode ? <Edit size={16} className="mr-2" /> : <UserCheck size={16} className="mr-2" />}
                    {isEditMode ? 'Cập Nhật Giảng Viên' : 'Tạo Giảng Viên'}
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

export default TeacherFormModal;