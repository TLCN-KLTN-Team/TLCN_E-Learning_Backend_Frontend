import React, { useEffect, useState } from "react";
import { X, Users, UserCheck, UserMinus, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from 'react-toastify';
import * as classApi from "@/services/api/admin/classApi";
import type { CourseClassResponse } from "@/services/api/response/courseClassResponse";
import type { StudentResponse } from "@/services/api/response/studentResponse";
import { AlertDialogOverlay } from "@radix-ui/react-alert-dialog";

interface EnrollStudentsToClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseClass: CourseClassResponse | null;
  educationalUnitId: number;
  onSuccess?: () => void;
}

const EnrollStudentsToClassModal: React.FC<EnrollStudentsToClassModalProps> = ({
  isOpen,
  onClose,
  courseClass,
  educationalUnitId,
  onSuccess,
}) => {
  const [allAvailableStudents, setAllAvailableStudents] = useState<StudentResponse[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<StudentResponse[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'enrolled'>('available');
  const [loadingData, setLoadingData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<StudentResponse | null>(null);

  useEffect(() => {
    if (isOpen && courseClass) {
      loadData();
      setSelectedStudents([]);
      setSearchTerm('');
    }
  }, [isOpen, courseClass?.id]);

  const loadData = async () => {
    if (!courseClass) return;
    
    try {
      setLoadingData(true);
      const [availableResponse, enrolledResponse] = await Promise.all([
        classApi.getAvailableStudentsForClass(educationalUnitId, courseClass.id),
        classApi.getStudentsInClass(educationalUnitId, courseClass.id)
      ]);
      
      setAllAvailableStudents(availableResponse || []);
      setEnrolledStudents(enrolledResponse || []);
    } catch (error: any) {
      console.error('Error loading student data:', error);
      toast.error('Không thể tải dữ liệu sinh viên');
    } finally {
      setLoadingData(false);
    }
  };

  // Filter out enrolled students from available students
  const availableStudents = allAvailableStudents.filter(student => 
    !enrolledStudents.some(enrolled => enrolled.id === student.id)
  );

  // Filter students based on search term
  const filteredAvailableStudents = availableStudents.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.department?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.className?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEnrolledStudents = enrolledStudents.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.department?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.className?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const availableSlots = courseClass!.maxStudents - courseClass!.currentStudents;
    const studentsToSelect = filteredAvailableStudents
      .slice(0, availableSlots)
      .map(student => student.id);
    setSelectedStudents(studentsToSelect);
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  const handleEnrollStudents = async () => {
    if (!selectedStudents.length || !courseClass) return;
    
    try {
      setIsLoading(true);
      // Convert IDs back to studentIds for API call
      const studentIdsToEnroll = selectedStudents
        .map(id => availableStudents.find(s => s.id === id)?.studentId)
        .filter(Boolean) as string[];
      
      await classApi.enrollStudentsToClass(educationalUnitId, courseClass.id, studentIdsToEnroll);
      toast.success('Đăng ký sinh viên vào lớp thành công!');
      await loadData(); // Reload data
      setSelectedStudents([]);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error enrolling students:', error);
      toast.error(error?.response?.data?.message || 'Không thể đăng ký sinh viên vào lớp');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnenrollStudent = async (student: StudentResponse) => {
    setStudentToRemove(student);
    setShowConfirmModal(true);
  };

  const confirmUnenrollStudent = async () => {
    if (!courseClass || !studentToRemove) return;
    
    try {
      setIsLoading(true);
      await classApi.unenrollStudentFromClass(educationalUnitId, courseClass.id, studentToRemove.studentId);
      toast.success('Đã loại bỏ sinh viên khỏi lớp thành công!');
      await loadData(); // Reload data
      onSuccess?.();
      setShowConfirmModal(false);
      setStudentToRemove(null);
    } catch (error: any) {
      console.error('Error unenrolling student:', error);
      toast.error(error?.response?.data?.message || 'Không thể loại bỏ sinh viên khỏi lớp');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStudents([]);
    setActiveTab('available');
    setSearchTerm('');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen || !courseClass) return null;

  const canEnrollMore = courseClass.currentStudents < courseClass.maxStudents;
  const availableSlots = courseClass.maxStudents - courseClass.currentStudents;
  const showEnrollFooter = activeTab === 'available' && filteredAvailableStudents.length > 0 && canEnrollMore;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
          onClick={handleBackdropClick}
        ></div>
        
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Quản Lý Sinh Viên</h2>
                  <p className="text-purple-100 text-sm">
                    {courseClass.className} 
                    <span className="text-purple-200 font-normal ml-2">({courseClass.classCode})</span>
                  </p>
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
            
            {/* Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white/70 rounded-full"></div>
                <span className="text-sm text-purple-100">
                  Hiện tại: <span className="font-semibold text-white">{courseClass.currentStudents}/{courseClass.maxStudents}</span> sinh viên
                </span>
              </div>
              {!canEnrollMore && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium w-fit">
                  Lớp đã đầy
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
              <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('available')}
                  className={`flex-1 px-4 lg:px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'available'
                      ? 'bg-white text-purple-600 shadow-sm transform scale-[1.02]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Users className="inline mr-2" size={16} />
                  <span className="hidden sm:inline">Sinh Viên Ngoài Lớp</span>
                  <span className="sm:hidden">Có Sẵn</span>
                  <span className="ml-1">({availableStudents.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('enrolled')}
                  className={`flex-1 px-4 lg:px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'enrolled'
                      ? 'bg-white text-purple-600 shadow-sm transform scale-[1.02]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <UserCheck className="inline mr-2" size={16} />
                  <span className="hidden sm:inline">Sinh Viên Trong Lớp</span>
                  <span className="sm:hidden">Đã Đăng Ký</span>
                  <span className="ml-1">({enrolledStudents.length})</span>
                </button>
              </div>
            </div>

          {/* Search Bar */}
          <div className="px-6 pb-4 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Tìm kiếm sinh viên theo tên, mã, khoa hoặc lớp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-2.5 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg"
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
            {loadingData ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600 font-medium">Đang tải danh sách sinh viên...</span>
                </div>
              ) : activeTab === 'available' ? (
                <div className="space-y-4 pb-4">
                  {!canEnrollMore && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <Users className="text-yellow-600" size={16} />
                          </div>
                          <p className="text-yellow-800 font-medium text-sm">
                            Lớp này đã đạt sức chứa tối đa. Không thể đăng ký thêm sinh viên nào.
                          </p>
                        </div>
                      </div>
                    )}

                    {filteredAvailableStudents.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {searchTerm ? 'Không tìm thấy sinh viên' : 'Không có sinh viên khả dụng'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {searchTerm 
                            ? 'Thử điều chỉnh tiêu chí tìm kiếm' 
                            : 'Tất cả sinh viên đủ điều kiện đã được đăng ký hoặc không có sinh viên nào khả dụng để đăng ký'
                          }
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Action Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg mb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <span className="text-sm text-gray-600">
                              <span className="font-semibold">{filteredAvailableStudents.length}</span> sinh viên khả dụng
                            </span>
                            <div className="hidden sm:block h-4 w-px bg-gray-300"></div>
                            <span className="text-sm text-gray-600">
                              <span className="font-semibold text-purple-600">{availableSlots}</span> chỗ còn trống
                            </span>
                          </div>
                          {canEnrollMore && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                                disabled={filteredAvailableStudents.length === 0}
                                className="text-purple-600 border-purple-200 hover:bg-purple-50 flex-1 sm:flex-none"
                              >
                                Chọn tất cả
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeselectAll}
                                disabled={selectedStudents.length === 0}
                                className="text-gray-600 border-gray-200 hover:bg-gray-50 flex-1 sm:flex-none"
                              >
                                Bỏ chọn tất cả
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Student List */}
                        <div className="grid gap-3 pb-4">
                          {filteredAvailableStudents.map((student) => {
                            const isSelected = selectedStudents.includes(student.id);
                            const isDisabled = !canEnrollMore || (selectedStudents.length >= availableSlots && !isSelected);
                            
                            return (
                              <div
                                key={student.id}
                                className={`relative group transition-all duration-200 rounded-xl border-2 ${
                                  isSelected 
                                    ? 'border-purple-200 bg-purple-50 shadow-md' 
                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                                } ${isDisabled ? 'opacity-50' : ''}`}
                              >
                                <label className="flex items-center p-4 cursor-pointer">
                                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                                    <div className="flex-shrink-0">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleStudent(student.id)}
                                        disabled={isDisabled}
                                        className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 disabled:opacity-50 cursor-pointer"
                                      />
                                    </div>
                                    
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                        {student.firstName[0]}{student.lastName[0]}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate">
                                          {student.firstName} {student.lastName}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 font-medium">
                                            Mã: {student.studentId}
                                          </span>
                                          {student.className && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                                              Lớp: {student.className}
                                            </span>
                                          )}
                                          {student.department && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-medium">
                                              {student.department.name}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {filteredEnrolledStudents.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <UserCheck className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {searchTerm ? 'Không tìm thấy sinh viên' : 'Chưa có sinh viên đăng ký'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {searchTerm 
                            ? 'Thử điều chỉnh tiêu chí tìm kiếm' 
                            : 'Hiện tại chưa có sinh viên nào đăng ký lớp học này'
                          }
                        </p>
                      </div>
                    ) : (
                      filteredEnrolledStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <UserCheck className="text-green-600" size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 font-medium">
                                  Mã: {student.studentId}
                                </span>
                                {student.className && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                                    Lớp: {student.className}
                                  </span>
                                )}
                                {student.department && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-medium">
                                    {student.department.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnenrollStudent(student)}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 flex-shrink-0 ml-3"
                          >
                            <UserMinus size={14} className="mr-1" />
                            <span className="hidden sm:inline">Loại bỏ</span>
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                {showEnrollFooter ? (
                  <>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-purple-600">{selectedStudents.length}</span> sinh viên đã chọn
                      {selectedStudents.length > availableSlots && (
                        <span className="text-red-600 ml-2 font-medium block sm:inline">
                          (Vượt quá số chỗ trống: {availableSlots})
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        onClick={handleClose}
                        className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex-1 sm:flex-none"
                        disabled={isLoading}
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleEnrollStudents}
                        disabled={
                          !selectedStudents.length || 
                          selectedStudents.length > availableSlots || 
                          isLoading
                        }
                        className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 min-w-[140px] flex-1 sm:flex-none"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Đang đăng ký...
                          </div>
                        ) : (
                          `Đăng ký ${selectedStudents.length} sinh viên`
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-end w-full">
                    <Button 
                      variant="outline" 
                      onClick={handleClose}
                      className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Đóng
                    </Button>
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmModal} onOpenChange={(open) => {
        if (!open && !isLoading) {
          setShowConfirmModal(false);
          setStudentToRemove(null);
        }
      }}>
        {/* Nền mờ (overlay) */}
        <AlertDialogOverlay className="bg-black/50 backdrop-blur-sm fixed inset-0" />
        
        {/* Hộp nội dung */}
        <AlertDialogContent className="max-w-md bg-white rounded-xl shadow-lg">
          <AlertDialogHeader>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-600" size={32} />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Xác nhận loại bỏ sinh viên
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Bạn có chắc chắn muốn loại bỏ sinh viên này khỏi lớp?
                  </p>
                  {studentToRemove && (
                    <div className="flex items-center justify-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {studentToRemove.firstName[0]}{studentToRemove.lastName[0]}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">
                          {studentToRemove.firstName} {studentToRemove.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Mã SV: {studentToRemove.studentId}
                        </div>
                      </div>
                    </div>
                  )}
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
                confirmUnenrollStudent();
              }}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                <>
                  <UserMinus size={16} className="mr-2" />
                  Xác nhận loại bỏ
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
};

export default EnrollStudentsToClassModal;