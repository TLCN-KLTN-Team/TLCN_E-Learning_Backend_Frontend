import React, { useEffect, useState } from "react";
import { X, Plus, Edit, Trash2, Users, School, Calendar, Hash } from "lucide-react";
import { toast } from 'react-toastify';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as classApi from "@/services/api/admin/classApi";
import EnrollStudentsToClassModal from "./EnrollStudentsToClassModal";
import type { CourseResponse } from "@/services/api/response/courseResponse";
import type { CourseClassResponse } from "@/services/api/response/courseClassResponse";
import type { CourseClassRequest } from "@/services/api/request/courseClassRequest";

interface ClassManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseResponse | null;
  educationalUnitId: string;
  onSuccess?: () => void;
}

const ClassManagementModal: React.FC<ClassManagementModalProps> = ({
  isOpen,
  onClose,
  course,
  educationalUnitId,
  onSuccess,
}) => {
  const [classes, setClasses] = useState<CourseClassResponse[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClass, setEditingClass] = useState<CourseClassResponse | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<CourseClassResponse | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    className: "",
    classCode: "",
    maxStudents: 30,
    startDate: "",
    endDate: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && course) {
      loadClasses();
    }
  }, [isOpen, course]);

  const loadClasses = async () => {
    if (!course) return;
    try {
      setLoadingClasses(true);
      const response = await classApi.getClassesByCourse(educationalUnitId, course.id);
      setClasses(response.content || []);
    } catch (error) {
      console.error("Error loading classes:", error);
      toast.error('Không thể tải danh sách lớp học');
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.className.trim()) {
      errors.className = "Tên lớp học là bắt buộc";
    }
    if (!formData.classCode.trim()) {
      errors.classCode = "Mã lớp học là bắt buộc";
    }
    if (formData.maxStudents < 1) {
      errors.maxStudents = "Sĩ số tối đa phải ít nhất là 1";
    }
    
    // Check for duplicate class code (only when creating new class)
    if (!editingClass && classes.some(cls => cls.classCode === formData.classCode.trim())) {
      errors.classCode = "Mã lớp học đã tồn tại";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateClass = async () => {
    if (!course || !validateForm()) return;
    
    try {
      setIsLoading(true);
      const classData: CourseClassRequest = {
        className: formData.className.trim(),
        classCode: formData.classCode.trim(),
        courseId: course.id,
        maxStudents: formData.maxStudents,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        description: formData.description.trim() || undefined,
      };

      await classApi.createClass(educationalUnitId, classData);
      toast.success('Tạo lớp học thành công!');
      await loadClasses(); // Reload classes
      resetForm();
      setShowCreateForm(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating class:", error);
      const message = error?.response?.data?.message || 'Không thể tạo lớp học';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass || !validateForm()) return;
    
    try {
      setIsLoading(true);
      const updateData = {
        className: formData.className.trim(),
        classCode: formData.classCode.trim(),
        maxStudents: formData.maxStudents,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        description: formData.description.trim() || undefined,
      };

      await classApi.updateClass(educationalUnitId, editingClass.id, updateData);
      toast.success('Cập nhật lớp học thành công!');
      await loadClasses(); // Reload classes
      resetForm();
      setEditingClass(null);
      setShowCreateForm(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error updating class:", error);
      const message = error?.response?.data?.message || 'Không thể cập nhật lớp học';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (classToDelete: CourseClassResponse) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp "${classToDelete.className}"? Việc này cũng sẽ xóa tất cả danh sách sinh viên đã đăng ký. Hành động này không thể hoàn tác.`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      await classApi.deleteClass(educationalUnitId, classToDelete.id);
      toast.success('Xóa lớp học thành công!');
      await loadClasses(); // Reload classes
      onSuccess?.();
    } catch (error: any) {
      console.error("Error deleting class:", error);
      const message = error?.response?.data?.message || 'Không thể xóa lớp học';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      className: "",
      classCode: "",
      maxStudents: 30,
      startDate: "",
      endDate: "",
      description: "",
    });
    setFormErrors({});
  };

  const startEdit = (courseClass: CourseClassResponse) => {
    setEditingClass(courseClass);
    setFormData({
      className: courseClass.className,
      classCode: courseClass.classCode,
      maxStudents: courseClass.maxStudents,
      startDate: courseClass.startDate ? new Date(courseClass.startDate).toISOString().split('T')[0] : "",
      endDate: courseClass.endDate ? new Date(courseClass.endDate).toISOString().split('T')[0] : "",
      description: courseClass.description || "",
    });
    setFormErrors({});
    setShowCreateForm(true);
  };

  const handleManageStudents = (courseClass: CourseClassResponse) => {
    setSelectedClass(courseClass);
    setShowEnrollModal(true);
  };

  const handleClose = () => {
    resetForm();
    setShowCreateForm(false);
    setEditingClass(null);
    setSelectedClass(null);
    setShowEnrollModal(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleEnrollSuccess = () => {
    loadClasses(); // Reload to update student counts
    onSuccess?.();
  };

  if (!isOpen || !course) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          onClick={handleBackdropClick}
        ></div>
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <School className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Quản Lý Lớp Học</h2>
                  <p className="text-blue-100 text-sm">{course.courseName}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-white/20 h-8 w-8 p-0">
                <X size={18} />
              </Button>
            </div>
          </div>

          {/* Content with Footer structure */}
          <div className="flex flex-col h-[calc(90vh-120px)]">
            <div className="flex-1 overflow-hidden">
              <div className="p-6 h-full overflow-y-auto">
                {!showCreateForm ? (
                  <div className="space-y-6">
                    {/* Stats and Actions */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="grid grid-cols-3 gap-4 lg:gap-6 w-full lg:w-auto">
                        <div className="text-center">
                          <div className="text-xl lg:text-2xl font-bold text-blue-600">{classes.length}</div>
                          <div className="text-xs lg:text-sm text-gray-500">Tổng Số Lớp</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl lg:text-2xl font-bold text-green-600">
                            {classes.reduce((sum, cls) => sum + (cls.currentStudents || 0), 0)}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-500">Tổng Sinh Viên</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl lg:text-2xl font-bold text-orange-600">
                            {classes.reduce((sum, cls) => sum + cls.maxStudents, 0)}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-500">Sức Chứa Tối Đa</div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => setShowCreateForm(true)} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
                      >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Tạo Lớp Học Mới</span>
                        <span className="sm:hidden">Tạo Lớp</span>
                      </Button>
                    </div>

                    {/* Classes List */}
                    <div className="space-y-4">
                      {loadingClasses ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                          <p className="text-gray-500">Đang tải danh sách lớp học...</p>
                        </div>
                      ) : classes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <School className="mx-auto mb-3 text-gray-400" size={48} />
                          <p className="text-lg font-medium mb-2">Chưa có lớp học nào</p>
                          <p className="text-sm">Tạo lớp học đầu tiên để bắt đầu tổ chức sinh viên</p>
                        </div>
                      ) : (
                        classes.map((courseClass) => (
                          <div key={courseClass.id} className="border rounded-lg p-4 lg:p-6 hover:shadow-md transition-shadow">
                            <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                              <div className="flex-1 w-full lg:w-auto">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                                  <h3 className="font-bold text-lg text-gray-900">{courseClass.className}</h3>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                                      {courseClass.classCode}
                                    </span>
                                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                                      courseClass.status === "ACTIVE" 
                                        ? "bg-green-100 text-green-800" 
                                        : "bg-gray-100 text-gray-800"
                                    }`}>
                                      {courseClass.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 text-sm">
                                  <div className="flex items-center text-gray-600">
                                    <Users size={16} className="mr-2 text-blue-500 flex-shrink-0" />
                                    <span>
                                      <span className="font-medium">{courseClass.currentStudents}</span>
                                      /{courseClass.maxStudents} sinh viên
                                    </span>
                                  </div>
                                  
                                  {courseClass.startDate && (
                                    <div className="flex items-center text-gray-600">
                                      <Calendar size={16} className="mr-2 text-green-500 flex-shrink-0" />
                                      <span className="truncate">Bắt đầu {new Date(courseClass.startDate).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center text-gray-600">
                                    <Hash size={16} className="mr-2 text-purple-500 flex-shrink-0" />
                                    <span className="truncate">Mã: {courseClass.id}</span>
                                  </div>

                                  <div className={`flex items-center text-sm ${
                                    courseClass.currentStudents >= courseClass.maxStudents 
                                      ? "text-red-600 font-medium" 
                                      : "text-gray-600"
                                  }`}>
                                    {courseClass.currentStudents >= courseClass.maxStudents 
                                      ? "🔴 Đã đầy" 
                                      : `Còn ${courseClass.maxStudents - courseClass.currentStudents} chỗ trống`
                                    }
                                  </div>
                                </div>

                                {courseClass.description && (
                                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    <strong>Mô tả:</strong> {courseClass.description}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-row lg:flex-col xl:flex-row gap-2 w-full lg:w-auto">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleManageStudents(courseClass)}
                                  className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 flex-1 lg:flex-none justify-center"
                                >
                                  <Users size={14} />
                                  <span className="hidden sm:inline">Sinh viên</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEdit(courseClass)}
                                  className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50 flex-1 lg:flex-none justify-center"
                                >
                                  <Edit size={14} />
                                  <span className="hidden sm:inline">Sửa</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClass(courseClass)}
                                  disabled={isLoading}
                                  className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 flex-1 lg:flex-none justify-center disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                  <span className="hidden sm:inline">Xóa</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  // Create/Edit Form
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <h3 className="text-xl font-bold flex items-center">
                        <School className="mr-2 text-blue-600" size={24} />
                        {editingClass ? "Chỉnh Sửa Lớp Học" : "Tạo Lớp Học Mới"}
                      </h3>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowCreateForm(false);
                          setEditingClass(null);
                          resetForm();
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Quay lại danh sách
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Tên Lớp Học <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.className}
                          onChange={(e) => {
                            setFormData({ ...formData, className: e.target.value });
                            if (formErrors.className) setFormErrors({ ...formErrors, className: "" });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                            formErrors.className ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="vd: Lớp Sáng A"
                        />
                        {formErrors.className && (
                          <p className="text-red-500 text-sm">{formErrors.className}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Mã Lớp Học <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.classCode}
                          onChange={(e) => {
                            setFormData({ ...formData, classCode: e.target.value });
                            if (formErrors.classCode) setFormErrors({ ...formErrors, classCode: "" });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                            formErrors.classCode ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="vd: CNTT101-A1"
                        />
                        {formErrors.classCode && (
                          <p className="text-red-500 text-sm">{formErrors.classCode}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Sĩ Số Tối Đa <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="500"
                          value={formData.maxStudents}
                          onChange={(e) => {
                            setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 1 });
                            if (formErrors.maxStudents) setFormErrors({ ...formErrors, maxStudents: "" });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                            formErrors.maxStudents ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                          }`}
                        />
                        {formErrors.maxStudents && (
                          <p className="text-red-500 text-sm">{formErrors.maxStudents}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Ngày Bắt Đầu
                        </label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Ngày Kết Thúc
                        </label>
                        <Input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 transition-colors"
                          min={formData.startDate}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Mô Tả
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 transition-colors"
                        rows={3}
                        placeholder="Mô tả tùy chọn cho lớp học này..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Similar structure to EnrollStudentsToClassModal */}
            {showCreateForm && (
              <div className="border-t bg-gray-50 px-6 py-4 mt-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-sm text-gray-600">
                    {editingClass ? "Đang cập nhật thông tin lớp học" : "Đang tạo lớp học mới"}
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingClass(null);
                        resetForm();
                      }}
                      className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex-1 sm:flex-none"
                      disabled={isLoading}
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={editingClass ? handleUpdateClass : handleCreateClass}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 min-w-[140px] flex-1 sm:flex-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {editingClass ? "Đang cập nhật..." : "Đang tạo..."}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <School size={16} className="mr-2" />
                          <span className="hidden sm:inline">
                            {editingClass ? "Cập Nhật Lớp" : "Tạo Lớp Học"}
                          </span>
                          <span className="sm:hidden">
                            {editingClass ? "Cập nhật" : "Tạo"}
                          </span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enroll Students Modal */}
      <EnrollStudentsToClassModal
        isOpen={showEnrollModal}
        onClose={() => {
          setShowEnrollModal(false);
          setSelectedClass(null);
        }}
        courseClass={selectedClass}
        educationalUnitId={educationalUnitId}
        onSuccess={handleEnrollSuccess}
      />
    </>
  );
};

export default ClassManagementModal;