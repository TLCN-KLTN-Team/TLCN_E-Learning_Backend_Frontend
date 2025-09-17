import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, UserPlus, Trash2, Edit, Mail} from "lucide-react";
import { toast } from 'react-toastify';
import TeacherFormModal from "@/components/admin/teacher/TeacherFormModal";
import * as teacherApi from "@/services/api/admin/teacherApi";
import * as educationUnitApi from "@/services/api/admin/educationUnitApi";
import type { TeacherResponse } from "@/services/api/response/teacherResponse";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";

const TeacherListPage: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherResponse[]>([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [institutionLoading, setInstitutionLoading] = useState(true);
  const [currentInstitution, setCurrentInstitution] = useState<EducationalUnitResponse | null>(null);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  
  // State cho chức năng chỉnh sửa
  const [editingTeacher, setEditingTeacher] = useState<TeacherResponse | null>(null);

  // Initialize institution
  useEffect(() => {
    const initializeInstitution = async () => {
      try {
        setInstitutionLoading(true);
        const institution = await educationUnitApi.getMyInstitution();
        setCurrentInstitution(institution);
        setInstitutionId(institution.id);
      } catch (error: any) {
        console.error('Failed to load institution:', error);
        toast.error('Không thể tải dữ liệu cơ sở giáo dục');
      } finally {
        setInstitutionLoading(false);
      }
    };

    initializeInstitution();
  }, []);

  const loadTeachers = async () => {
    if (!institutionId) return;
    
    try {
      setLoading(true);
      const response: PaginatedResponse<TeacherResponse> = await teacherApi.getTeachers(institutionId);
      console.log("📌 Danh sách giảng viên (content):", response.content);
      setTeachers(response.content || []);
      setFilteredTeachers(response.content || []);
    } catch (error: any) {
      console.error('Error loading teachers:', error);
      toast.error('Không thể tải danh sách giáo viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (institutionId) {
      loadTeachers();
    }
  }, [institutionId]);

  useEffect(() => {
    const filtered = teachers.filter(teacher =>
      teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (teacher.department && teacher.department.name.toLowerCase().includes(searchTerm.toLowerCase()))  
    );
    setFilteredTeachers(filtered);
  }, [searchTerm, teachers]);

  const handleSuccess = () => {
    loadTeachers(); // Reload teachers after successful creation/update
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa giáo viên "${teacherName}"? Hành động này không thể hoàn tác.`)) {
      try {
        await teacherApi.deleteTeacher(institutionId!, teacherId);
        toast.success('Xóa giáo viên thành công!');
        handleSuccess();
      } catch (error: any) {
        console.error('Error deleting teacher:', error);
        toast.error(error?.response?.data?.message || 'Không thể xóa giáo viên');
      }
    }
  };

  // Handler cho chức năng chỉnh sửa
  const handleEditTeacher = (teacher: TeacherResponse) => {
    setEditingTeacher(teacher);
    setShowTeacherModal(true);
  };

  // Handler để đóng modal và reset state
  const handleCloseModal = () => {
    setShowTeacherModal(false);
    setEditingTeacher(null);
  };

  // Show loading state while institution is loading
  if (institutionLoading) {
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

  // Show error if no institution ID
  if (!institutionId) {
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
            <Users className="mr-3 text-blue-600" size={32} />
            Quản lý Giáo viên
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý tài khoản giáo viên cho {currentInstitution?.name || 'cơ sở giáo dục của bạn'}
          </p>
        </div>
        <Button 
          onClick={() => setShowTeacherModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
        >
          <UserPlus className="mr-2" size={18} />
          Tạo Giáo viên Mới
        </Button>
      </div>

      {/* Statistics and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng Giáo viên</p>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Tìm kiếm giáo viên theo tên, tên đăng nhập, email, mã giáo viên hoặc khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredTeachers.length === 0 ? (
          <div className="p-12 text-center">
            {teachers.length === 0 ? (
              <>
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy giáo viên nào</h3>
                <p className="text-gray-500 mb-4">Bắt đầu bằng cách tạo tài khoản giáo viên đầu tiên</p>
                <Button onClick={() => setShowTeacherModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg">
                  <UserPlus className="mr-2" size={16} />
                  Tạo Giáo viên
                </Button>
              </>
            ) : (
              <>
                <Search className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có giáo viên nào phù hợp với tìm kiếm</h3>
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
                    GIÁO VIÊN
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LIÊN HỆ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MÃ GIÁO VIÊN
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KHOA
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TÀI KHOẢN NGÂN HÀNG
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HÀNH ĐỘNG
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-green-600 font-medium text-sm">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {teacher.firstName} {teacher.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{teacher.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start space-y-1 flex-col">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail size={14} className="mr-2 text-gray-400" />
                          {teacher.email}
                        </div> 
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {teacher.teacherId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {teacher.department?.name || (
                          <span className="text-gray-500 italic">Chưa có khoa</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {teacher.bankAccountNumber ? (
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {teacher.bankAccountNumber.replace(/(.{4})/g, '$1 ').trim()}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Chưa cung cấp</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTeacher(teacher)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit size={14} className="mr-1" />
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTeacher(teacher.id, `${teacher.firstName} ${teacher.lastName}`)}
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

      <TeacherFormModal
        isOpen={showTeacherModal}
        onClose={handleCloseModal}
        institutionId={institutionId}
        onSuccess={handleSuccess}
        editingTeacher={editingTeacher}
      />
    </div>
  );
};

export default TeacherListPage;