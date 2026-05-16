import React, { useEffect, useState } from "react";
import { X, Plus, Edit, Users, School, Calendar, Hash, Upload, Archive } from "lucide-react";
import { toast } from 'react-toastify';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertDialogOverlay } from "@radix-ui/react-alert-dialog";
import * as expertClassApi from "@/services/api/expert/expertClassApi";
import EnrollStudentsToClassModal from "./EnrollStudentsToClassModal";
import ImportClassesModal from "./ImportClassesModal";
import type { CourseResponse } from "@/services/api/response/courseResponse";
import type { CourseClassResponse } from "@/services/api/response/courseClassResponse";
import type { CourseClassRequest } from "@/services/api/request/courseClassRequest";
import { AppError } from "@/errors";

interface ClassManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseResponse | null;
  educationalUnitId: number;
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

  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [classToDelete, setClassToDelete] = useState<CourseClassResponse | null>(null);
  const [showArchived, setShowArchived] = useState(false);

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
      const response = await expertClassApi.getClassesByCourse(educationalUnitId, course.id);
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
      toast.error("Mã lớp học đã tồn tại!");
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

      await expertClassApi.createClass(educationalUnitId, classData);
      toast.success('Tạo lớp học thành công!');
      await loadClasses(); // Reload classes
      resetForm();
      setShowCreateForm(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating class:", error);
      let message = 'Không thể tạo lớp học';
      if (error instanceof AppError) {
        message = error.getDisplayMessage();
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      }
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

      await expertClassApi.updateClass(educationalUnitId, editingClass.id, updateData);
      toast.success('Cập nhật lớp học thành công!');
      await loadClasses(); // Reload classes
      resetForm();
      setEditingClass(null);
      setShowCreateForm(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error updating class:", error);
      let message = 'Không thể cập nhật lớp học';
      if (error instanceof AppError) {
        message = error.getDisplayMessage();
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (courseClass: CourseClassResponse) => {
    setClassToDelete(courseClass);
    setShowDeleteAlert(true);
  };

  const confirmDeleteClass = async () => {
    if (!classToDelete) return;

    try {
      setIsLoading(true);
      await expertClassApi.deleteClass(educationalUnitId, classToDelete.id);
      toast.success('Xóa lớp học thành công!');
      await loadClasses(); // Reload classes
      onSuccess?.();
      setShowDeleteAlert(false);
      setClassToDelete(null);
    } catch (error: any) {
      console.error("Error deleting class:", error);
      let message = 'Không thể xóa lớp học';
      if (error instanceof AppError) {
        message = error.getDisplayMessage();
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      }
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

  const getFilteredClasses = () => {
    return classes.filter(cls => showArchived ? cls.isArchived : !cls.isArchived);
  };

  const activeClasses = classes.filter(cls => !cls.isArchived);
  const archivedClasses = classes.filter(cls => cls.isArchived);

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
                          <div className="text-xl lg:text-2xl font-bold text-blue-600">{activeClasses.length}</div>
                          <div className="text-xs lg:text-sm text-gray-500">Lớp Hoạt Động</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl lg:text-2xl font-bold text-green-600">
                            {activeClasses.reduce((sum, cls) => sum + (cls.currentStudents || 0), 0)}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-500">Tổng Sinh Viên</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl lg:text-2xl font-bold text-orange-600">
                            {archivedClasses.length}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-500">Lớp Đã Lưu Trữ</div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => setShowCreateForm(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
                        >
                          <Plus size={16} />
                          <span className="hidden sm:inline">Tạo Lớp Học Mới</span>
                          <span className="sm:hidden">Tạo Lớp</span>
                        </Button>
                        <Button
                          onClick={() => setShowImportModal(true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
                        >
                          <Upload size={16} />
                          <span className="hidden sm:inline">Import từ File</span>
                          <span className="sm:hidden">Import</span>
                        </Button>
                        {archivedClasses.length > 0 && (
                          <Button
                            onClick={() => setShowArchived(!showArchived)}
                            variant={showArchived ? "default" : "outline"}
                            className={`px-6 py-3 text-lg ${showArchived ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                          >
                            <Archive size={16} />
                            <span className="hidden sm:inline ml-2">{showArchived ? 'Lớp Hoạt Động' : 'Lớp Lưu Trữ'}</span>
                            <span className="sm:hidden">{showArchived ? 'Hoạt Động' : 'Lưu Trữ'}</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Classes List */}
                    <div className="space-y-4">
                      {loadingClasses ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                          <p className="text-gray-500">Đang tải danh sách lớp học...</p>
                        </div>
                      ) : getFilteredClasses().length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <School className="mx-auto mb-3 text-gray-400" size={48} />
                          <p className="text-lg font-medium mb-2">{showArchived ? 'Chưa có lớp học nào được lưu trữ' : 'Chưa có lớp học nào'}</p>
                          <p className="text-sm">{showArchived ? 'Lớp học sẽ xuất hiện ở đây khi được lưu trữ' : 'Tạo lớp học đầu tiên để bắt đầu tổ chức sinh viên'}</p>
                        </div>
                      ) : (
                        getFilteredClasses().map((courseClass) => (
                          <div key={courseClass.id} className={`border rounded-lg p-4 lg:p-6 hover:shadow-md transition-shadow ${courseClass.isArchived ? 'bg-gray-50 opacity-75' : ''}`}>
                            <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                              <div className="flex-1 w-full lg:w-auto">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                                  <h3 className={`font-bold text-lg ${courseClass.isArchived ? 'text-gray-600 line-through' : 'text-gray-900'}`}>{courseClass.className}</h3>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                                      {courseClass.classCode}
                                    </span>
                                    {courseClass.isArchived ? (
                                      <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full font-medium flex items-center gap-1">
                                        <Archive size={14} />
                                        Đã lưu trữ
                                      </span>
                                    ) : (
                                      <span className={`px-3 py-1 text-sm rounded-full font-medium ${courseClass.status === "ACTIVE"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                        }`}>
                                        {courseClass.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
                                      </span>
                                    )}
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

                                  {courseClass.endDate && (
                                    <div className="flex items-center text-gray-600">
                                      <Calendar size={16} className="mr-2 text-red-500 flex-shrink-0" />
                                      <span className="truncate">Kết thúc {new Date(courseClass.endDate).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center text-gray-600">
                                    <Hash size={16} className="mr-2 text-purple-500 flex-shrink-0" />
                                    <span className="truncate">Mã: {courseClass.id}</span>
                                  </div>
                                </div>

                                {courseClass.description && (
                                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    <strong>Mô tả:</strong> {courseClass.description}
                                  </div>
                                )}

                                {courseClass.isArchived && courseClass.archivedAt && (
                                  <div className="mt-3 text-xs text-gray-500">
                                    Lưu trữ vào: {new Date(courseClass.archivedAt).toLocaleString('vi-VN')}
                                  </div>
                                )}
                              </div>

                              {!courseClass.isArchived && (
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
                                    onClick={() => handleDeleteClick(courseClass)}
                                    disabled={isLoading}
                                    className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 flex-1 lg:flex-none justify-center disabled:opacity-50"
                                  >
                                    <Archive size={14} />
                                    <span className="hidden sm:inline">Lưu Trữ</span>
                                    <span className="sm:hidden">Lưu Trữ</span>
                                  </Button>
                                </div>
                              )}
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
                          className={`w-full px-3 py-2 border rounded-lg transition-colors ${formErrors.className ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
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
                          className={`w-full px-3 py-2 border rounded-lg transition-colors ${formErrors.classCode ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
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
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={formData.maxStudents}
                          onChange={(e) => {
                            setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 1 });
                            if (formErrors.maxStudents) setFormErrors({ ...formErrors, maxStudents: "" });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg transition-colors ${formErrors.maxStudents ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
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
                        <input
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
                        <input
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

      <ImportClassesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        educationalUnitId={educationalUnitId}
        course={course}
        onSuccess={async () => {
          await loadClasses();
          onSuccess?.();
        }}
      />

      <AlertDialog open={showDeleteAlert} onOpenChange={(open) => {
        if (!open && !isLoading) {
          setShowDeleteAlert(false);
          setClassToDelete(null);
        }
      }}>
        <AlertDialogOverlay className="bg-black/50 backdrop-blur-sm fixed inset-0" />
        <AlertDialogContent className="max-w-md bg-white rounded-xl shadow-lg">
          <AlertDialogHeader>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Archive className="text-yellow-600" size={32} />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Lưu trữ lớp học
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Bạn có chắc chắn muốn lưu trữ lớp học này? Lớp học sẽ được ẩn khỏi danh sách chính nhưng dữ liệu vẫn được lưu trữ.
                  </p>
                  {classToDelete && (
                    <div className="flex flex-col items-center justify-center space-y-1 p-3 bg-white rounded-lg border border-gray-200">
                      <span className="font-bold text-gray-900 text-lg">{classToDelete.className}</span>
                      <span className="text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{classToDelete.classCode}</span>
                    </div>
                  )}
                  <p className="text-sm text-yellow-600 mt-3 font-medium">
                    Lưu ý: Bạn có thể xem lại lớp học này trong tab "Lớp Lưu Trữ" bất cứ lúc nào.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-row flex-col-reverse gap-2">
            <AlertDialogCancel disabled={isLoading} className="mt-0">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteClass();
              }}
              disabled={isLoading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang lưu trữ...
                </div>
              ) : (
                <>
                  <Archive size={16} className="mr-2" />
                  Xác nhận lưu trữ
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClassManagementModal;