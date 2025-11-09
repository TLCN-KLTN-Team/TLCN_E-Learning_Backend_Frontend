import React, { useEffect, useState } from "react";
import { X, User, UserCheck, UserX, ChevronDown, Search, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as teacherApi from "@/services/api/admin/teacherApi";
import * as courseApi from "@/services/api/admin/courseApi";
import { toast } from "react-toastify";
import type { CourseResponse } from "@/services/api/response/courseResponse";
import type { TeacherResponse } from "@/services/api/response/teacherResponse";

interface AssignTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseResponse | null;
  educationalUnitId: number;
  onSuccess?: () => void;
}

const AssignTeacherModal: React.FC<AssignTeacherModalProps> = ({
  isOpen,
  onClose,
  course,
  educationalUnitId,
  onSuccess,
}) => {
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && educationalUnitId) {
      loadTeachers();
      setSelectedTeacher("");
      setSearchTerm("");
    }
  }, [isOpen, educationalUnitId]);

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await teacherApi.getTeachers(educationalUnitId);
      setTeachers(response.content || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('Không thể tải danh sách giảng viên');
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Filter teachers: exclude current teacher if exists, and apply search filter
  const filteredTeachers = teachers.filter(teacher => {
    // Exclude current teacher from the list
    if (course?.teacher && teacher.teacherId === course.teacher.teacherId) {
      return false;
    }
    
    // Apply search filter
    const searchMatch = 
      `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.department?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return searchMatch;
  });

  const selectedTeacherData = teachers.find(t => t.teacherId === selectedTeacher);

  const handleAssign = async () => {
    if (!selectedTeacher || !course) return;
    try {
      setIsLoading(true);
      console.log('Assigning teacher:', selectedTeacher, 'to course:', course.id);
      console.log('Selected teacher details:', selectedTeacherData);
      await courseApi.assignTeacherToCourse(educationalUnitId, course.id, selectedTeacher);
      toast.success('Phân công giảng viên thành công!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      console.error('Selected teacher ID:', selectedTeacher);
      console.error('Available teachers:', teachers);
      toast.error('Không thể phân công giảng viên');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTeacher = async () => {
    if (!course) return;
    
    if (window.confirm('Bạn có chắc chắn muốn loại bỏ giảng viên này khỏi môn học?')) {
      try {
        setIsLoading(true);
        await courseApi.removeTeacherFromCourse(educationalUnitId, course.id);
        toast.success('Đã loại bỏ giảng viên thành công!');
        onSuccess?.();
        onClose();
      } catch (error) {
        console.error('Error removing teacher:', error);
        toast.error('Không thể loại bỏ giảng viên');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setSelectedTeacher("");
    setSearchTerm("");
    setIsDropdownOpen(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={handleBackdropClick}
      ></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Quản Lý Giảng Viên</h2>
                <p className="text-blue-100 text-sm mt-1">Phân công hoặc quản lý giảng viên môn học</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X size={18} />
            </Button>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3 mt-3">
            <p className="font-semibold text-lg text-white">{course.courseName}</p>
            <p className="text-blue-100 text-sm">
              Số tín chỉ: {course.credits}
            </p>
          </div>
        </div>

        {/* Content with form structure */}
        <div className="flex flex-col h-[calc(90vh-180px)]">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Current Teacher Section */}
              {course.teacher && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                    <UserCheck size={16} className="mr-2 text-green-600" />
                    Giảng Viên Hiện Tại
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <UserCheck className="text-green-600" size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">
                          {course.teacher.firstName} {course.teacher.lastName}
                        </h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                            Mã: {course.teacher.teacherId}
                          </span>
                          {course.teacher.department && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-medium">
                              {course.teacher.department.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveTeacher}
                      disabled={isLoading}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      <UserX size={14} className="mr-2" />
                      Loại bỏ
                    </Button>
                  </div>
                </div>
              )}

              {/* Teacher Selection Section */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <User size={16} className="mr-2 text-blue-600" />
                  {course.teacher ? 'Thay Đổi Giảng Viên' : 'Phân Công Giảng Viên'}
                </h3>

                {loadingTeachers ? (
                  <div className="flex items-center justify-center py-12 bg-white rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 font-medium">Đang tải danh sách giảng viên...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <Search size={14} className="mr-2 text-blue-600" />
                        Tìm Kiếm Giảng Viên
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Tìm theo tên, mã giảng viên hoặc khoa..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border rounded-lg transition-colors border-gray-300 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Custom Dropdown */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <User size={14} className="mr-2 text-blue-600" />
                        Chọn Giảng Viên
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="w-full p-3 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            {selectedTeacherData ? (
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                  {selectedTeacherData.firstName[0]}{selectedTeacherData.lastName[0]}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">
                                    {selectedTeacherData.firstName} {selectedTeacherData.lastName}
                                  </span>
                                  <span className="text-gray-500 text-sm ml-2">
                                    ({selectedTeacherData.teacherId})
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">Chọn giảng viên</span>
                            )}
                            <ChevronDown 
                              className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                              size={16} 
                            />
                          </div>
                        </button>

                        {isDropdownOpen && (
                          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredTeachers.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                <User className="mx-auto mb-2 text-gray-400" size={24} />
                                <p className="text-sm">
                                  {searchTerm 
                                    ? 'Không tìm thấy giảng viên phù hợp' 
                                    : course.teacher 
                                      ? 'Không có giảng viên khác khả dụng' 
                                      : 'Không có giảng viên khả dụng'
                                  }
                                </p>
                                {course.teacher && !searchTerm && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Giảng viên hiện tại đã bị loại khỏi danh sách
                                  </p>
                                )}
                              </div>
                            ) : (
                              filteredTeachers.map((teacher) => (
                                <button
                                  key={teacher.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTeacher(teacher.teacherId);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                    selectedTeacher === teacher.teacherId ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                      {teacher.firstName[0]}{teacher.lastName[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900">
                                        {teacher.firstName} {teacher.lastName}
                                      </div>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 font-medium">
                                          Mã: {teacher.teacherId}
                                        </span>
                                        {teacher.department && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-medium">
                                            {teacher.department.name}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {selectedTeacher === teacher.teacherId && (
                                      <UserCheck className="text-blue-600" size={16} />
                                    )}
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Teacher Preview */}
              {selectedTeacherData && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                    <UserCheck size={16} className="mr-2 text-orange-600" />
                    Xem Trước Giảng Viên Đã Chọn
                  </h3>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {selectedTeacherData.firstName[0]}{selectedTeacherData.lastName[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {selectedTeacherData.firstName} {selectedTeacherData.lastName}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 font-medium">
                          Mã: {selectedTeacherData.teacherId}
                        </span>
                        {selectedTeacherData.department && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-medium">
                            {selectedTeacherData.department.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Inside the flex container */}
          <div className="border-t bg-gray-50 px-6 py-4 mt-auto">
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={isLoading || loadingTeachers}
              >
                Hủy
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedTeacher || isLoading || loadingTeachers}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang phân công...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserCheck size={16} className="mr-2" />
                    Phân Công Giảng Viên
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

export default AssignTeacherModal;