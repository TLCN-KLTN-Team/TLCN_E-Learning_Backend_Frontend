import React, { useState, useEffect } from "react";
import { X, User, Mail, Lock, Calendar, Hash, Users, FileText, Link, UserPlus, Building, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/context/admin-context/index";
import type { StudentRequest, DepartmentResponse } from "@/context/admin-context/index";

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionId: string;
  onSuccess?: () => void;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  institutionId,
  onSuccess,
}) => {
  const { createStudent, getDepartmentsByInstitution, isLoading } = useAdmin();
  
  const [form, setForm] = useState<Omit<StudentRequest, 'educationalUnitId'>>({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    dob: "",
    studentId: "",
    className: "",
    departmentId: "",
    description: "",
    socialUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Load departments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await getDepartmentsByInstitution();
      setDepartments(response.content || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.username || form.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!form.password || form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!form.firstName) {
      newErrors.firstName = "First name is required";
    }
    if (!form.lastName) {
      newErrors.lastName = "Last name is required";
    }
    if (!form.studentId) {
      newErrors.studentId = "Student ID is required";
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
      const studentData: StudentRequest = {
        ...form,
        educationalUnitId: institutionId,
      };
      
      await createStudent(studentData);
      onSuccess?.();
      onClose();
      
      // Reset form
      setForm({
        username: "",
        password: "",
        email: "",
        firstName: "",
        lastName: "",
        dob: "",
        studentId: "",
        className: "",
        departmentId: "",
        description: "",
        socialUrl: "",
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating student:', error);
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
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Create New Student</h2>
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
          <p className="text-green-100 text-sm mt-2">Add a new student to your institution</p>
        </div>
        
        {/* Form Content với Footer bên trong */}
        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-120px)]">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <User size={16} className="mr-2" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <User size={14} className="mr-2 text-green-600" />
                      First Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input 
                      name="firstName" 
                      placeholder="Enter first name" 
                      value={form.firstName} 
                      onChange={handleChange}
                      className={`transition-colors ${errors.firstName ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
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
                      <User size={14} className="mr-2 text-green-600" />
                      Last Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input 
                      name="lastName" 
                      placeholder="Enter last name" 
                      value={form.lastName} 
                      onChange={handleChange}
                      className={`transition-colors ${errors.lastName ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
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
                    <Calendar size={14} className="mr-2 text-green-600" />
                    Date of Birth
                  </label>
                  <Input 
                    name="dob" 
                    type="date" 
                    value={form.dob} 
                    onChange={handleChange}
                    className="focus:border-green-500"
                  />
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Lock size={16} className="mr-2" />
                  Account Information
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <User size={14} className="mr-2 text-blue-600" />
                      Username
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input 
                      name="username" 
                      placeholder="Enter username (min 3 characters)" 
                      value={form.username} 
                      onChange={handleChange}
                      className={`transition-colors ${errors.username ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
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
                        <Mail size={14} className="mr-2 text-blue-600" />
                        Email
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <Input 
                        name="email" 
                        type="email" 
                        placeholder="student@example.com" 
                        value={form.email} 
                        onChange={handleChange}
                        className={`transition-colors ${errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
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
                        <Lock size={14} className="mr-2 text-blue-600" />
                        Password
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <Input 
                        name="password" 
                        type="password" 
                        placeholder="Min 6 characters" 
                        value={form.password} 
                        onChange={handleChange}
                        className={`transition-colors ${errors.password ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                      />
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

              {/* Academic Information */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Users size={16} className="mr-2" />
                  Academic Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Hash size={14} className="mr-2 text-purple-600" />
                      Student ID
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input 
                      name="studentId" 
                      placeholder="e.g., STU001" 
                      value={form.studentId} 
                      onChange={handleChange}
                      className={`transition-colors ${errors.studentId ? 'border-red-500 focus:border-red-500' : 'focus:border-purple-500'}`}
                    />
                    {errors.studentId && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.studentId}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Users size={14} className="mr-2 text-purple-600" />
                      Class Name
                    </label>
                    <Input 
                      name="className" 
                      placeholder="e.g., CS2024A" 
                      value={form.className} 
                      onChange={handleChange}
                      className="focus:border-purple-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Building size={14} className="mr-2 text-purple-600" />
                    Department
                  </label>
                  <div className="relative">
                    {/* Label ẩn để screen reader đọc được */}
                    <label htmlFor="departmentId" className="sr-only">
                      Department
                    </label>
                    <select
                      id="departmentId"
                      name="departmentId"
                      value={form.departmentId || ""}
                      onChange={handleChange}
                      disabled={loadingDepartments}
                      className={[
                        "w-full p-3 border rounded-lg bg-white transition-colors focus:border-purple-500",
                        "appearance-none", // ẩn mũi tên mặc định
                        loadingDepartments ? "opacity-50" : ""
                      ].join(" ")}
                    >
                      <option value="">
                        {loadingDepartments ? "Loading departments..." : "Select department (optional)"}
                      </option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <FileText size={16} className="mr-2" />
                  Additional Information
                  <span className="text-gray-400 ml-2 text-xs">(Optional)</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FileText size={14} className="mr-2 text-orange-600" />
                      Description
                    </label>
                    <textarea
                      name="description"
                      placeholder="Additional notes about the student..."
                      value={form.description}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:border-orange-500 focus:outline-none transition-colors"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Link size={14} className="mr-2 text-orange-600" />
                      Social URL
                    </label>
                    <Input 
                      name="socialUrl" 
                      placeholder="https://facebook.com/student" 
                      value={form.socialUrl} 
                      onChange={handleChange}
                      className="focus:border-orange-500"
                    />
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
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserPlus size={16} className="mr-2" />
                    Create Student
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

export default StudentFormModal;