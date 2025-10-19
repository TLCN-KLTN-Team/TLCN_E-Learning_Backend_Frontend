import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, Search, UserPlus, Trash2, Edit, Mail} from "lucide-react";
import { toast } from 'react-toastify';
import StudentFormModal from "@/components/admin/student/StudentFormModal";
import * as studentApi from "@/services/api/admin/studentApi";
import * as educationUnitApi from "@/services/api/admin/educationUnitApi";
import type { StudentResponse } from "@/services/api/response/studentResponse";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";

const StudentListPage: React.FC = () => {
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentResponse[]>([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [educationalUnitLoading, setEducationalUnitLoading] = useState(true);
  const [currentEducationalUnit, setCurrentEducationalUnit] = useState<EducationalUnitResponse | null>(null);
  const [educationalUnitId, setEducationalUnitId] = useState<string | null>(null);
  
  // State cho chức năng chỉnh sửa
  const [editingStudent, setEditingStudent] = useState<StudentResponse | null>(null);

  // Initialize educationalUnit
  useEffect(() => {
    const initializeEducationalUnit = async () => {
      try {
        setEducationalUnitLoading(true);
        const educationalUnit = await educationUnitApi.getMyEducationalUnit();
        setCurrentEducationalUnit(educationalUnit);
        setEducationalUnitId(educationalUnit.id);
      } catch (error: any) {
        console.error('Failed to load educationalUnit:', error);
        toast.error('Không thể tải dữ liệu cơ sở giáo dục');
      } finally {
        setEducationalUnitLoading(false);
      }
    };

    initializeEducationalUnit();
  }, []);

  const loadStudents = async () => {
    if (!educationalUnitId) return;
    
    try {
      setLoading(true);
      const response: PaginatedResponse<StudentResponse> = await studentApi.getStudents(educationalUnitId);
      setStudents(response.content || []);
      setFilteredStudents(response.content || []);
    } catch (error: any) {
      console.error('Error loading students:', error);
      toast.error('Không thể tải danh sách học sinh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (educationalUnitId) {
      loadStudents();
    }
  }, [educationalUnitId]);

  useEffect(() => {
    const filtered = students.filter(student =>
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.className && student.className.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const handleSuccess = () => {
    loadStudents(); // Reload students after successful creation/update
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa học sinh "${studentName}"? Hành động này không thể hoàn tác.`)) {
      try {
        await studentApi.deleteStudent(educationalUnitId!, studentId);
        toast.success('Xóa học sinh thành công!');
        handleSuccess();
      } catch (error: any) {
        console.error('Error deleting student:', error);
        toast.error(error?.response?.data?.message || 'Không thể xóa học sinh');
      }
    }
  };

  // Handler cho chức năng chỉnh sửa
  const handleEditStudent = (student: StudentResponse) => {
    setEditingStudent(student);
    setShowStudentModal(true);
  };

  // Handler để đóng modal và reset state
  const handleCloseModal = () => {
    setShowStudentModal(false);
    setEditingStudent(null);
  };

  // Show loading state while educationalUnit is loading
  if (educationalUnitLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error if no educationalUnit ID
  if (!educationalUnitId) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-900 mb-2">Không tìm thấy cơ sở giáo dục</h3>
          <p className="text-red-700">Không thể tải dữ liệu cơ sở giáo dục. Vui lòng thử làm mới trang.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <GraduationCap className="mr-3 text-blue-600" size={32} />
            Quản lý Học sinh
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý tài khoản học sinh cho {currentEducationalUnit?.name || 'cơ sở giáo dục của bạn'}
          </p>
        </div>
        <Button 
          onClick={() => setShowStudentModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
        >
          <UserPlus className="mr-2" size={18} />
          Tạo Học sinh Mới
        </Button>
      </div>

      {/* Statistics and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng Học sinh</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Tìm kiếm học sinh theo tên, tên đăng nhập, email, mã học sinh hoặc lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            {students.length === 0 ? (
              <>
                <GraduationCap className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy học sinh nào</h3>
                <p className="text-gray-500 mb-4">Bắt đầu bằng cách tạo tài khoản học sinh đầu tiên</p>
                <Button onClick={() => setShowStudentModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg">
                  <UserPlus className="mr-2" size={16} />
                  Tạo Học sinh
                </Button>
              </>
            ) : (
              <>
                <Search className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có học sinh nào phù hợp với tìm kiếm</h3>
                <p className="text-gray-500">Thử điều chỉnh từ khóa tìm kiếm của bạn</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HỌC SINH
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LIÊN HỆ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LỚP & MÃ SỐ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KHOA
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HÀNH ĐỘNG
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-blue-600 font-medium text-sm">
                            {student.firstName[0]}{student.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{student.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start space-y-1 flex-col">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail size={14} className="mr-2 text-gray-400" />
                          {student.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Mã SH: {student.studentId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.className || 'Chưa phân lớp'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {student.department?.name || (
                          <span className="text-gray-500 italic">Chưa có khoa</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStudent(student)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit size={14} className="mr-1" />
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StudentFormModal
        isOpen={showStudentModal}
        onClose={handleCloseModal}
        educationalUnitId={educationalUnitId}
        onSuccess={handleSuccess}
        editingStudent={editingStudent}
      />
    </div>
  );
};

export default StudentListPage;