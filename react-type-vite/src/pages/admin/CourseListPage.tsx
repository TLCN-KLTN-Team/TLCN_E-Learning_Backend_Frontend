import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Trash2, BookOpen, School, TrendingUp } from "lucide-react";
import { toast } from 'react-toastify';
import CourseFormModal from "@/components/admin/course/CourseFormModal";
import AssignTeacherModal from "@/components/admin/course/AssignTeacherModal";
import ClassManagementModal from "@/components/admin/course/ClassManagementModal";
import * as courseApi from "@/services/api/admin/courseApi";
import * as educationUnitApi from "@/services/api/admin/educationUnitApi";
import * as classApi from "@/services/api/admin/classApi";
import type { CourseResponse } from "@/services/api/response/courseResponse";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";


const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [showClassManagement, setShowClassManagement] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [educationalUnitLoading, setEducationalUnitLoading] = useState(true);
  const [currentEducationalUnit, setCurrentEducationalUnit] = useState<EducationalUnitResponse | null>(null);
  const [educationalUnitId, setEducationalUnitId] = useState<string | null>(null);
  const [classStats, setClassStats] = useState<Record<number, { 
    totalClasses: number, 
    totalStudents: number,
    activeClasses: number,
    capacity: number 
  }>>({});

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

  const loadCourses = async () => {
    if (!educationalUnitId) return;
    
    try {
      setLoading(true);
      const response: PaginatedResponse<CourseResponse> = await courseApi.getCourses(educationalUnitId);
      const coursesData = response.content || [];
      setCourses(coursesData);
      
      // Load detailed class statistics for each course
      await loadClassStats(coursesData);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      toast.error('Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  const loadClassStats = async (coursesData: CourseResponse[]) => {
    const stats: Record<number, { totalClasses: number, totalStudents: number, activeClasses: number, capacity: number }> = {};
    
    for (const course of coursesData) {
      try {
        const classResponse = await classApi.getClassesByCourse(educationalUnitId!, course.id);
        const classes = classResponse.content || [];
        
        stats[course.id] = {
          totalClasses: classes.length,
          totalStudents: classes.reduce((sum, cls) => sum + (cls.currentStudents || 0), 0),
          activeClasses: classes.filter(cls => cls.status === 'ACTIVE').length,
          capacity: classes.reduce((sum, cls) => sum + cls.maxStudents, 0)
        };
      } catch (error) {
        console.error(`Error loading class stats for course ${course.id}:`, error);
        stats[course.id] = { totalClasses: 0, totalStudents: 0, activeClasses: 0, capacity: 0 };
      }
    }
    
    setClassStats(stats);
  };

  useEffect(() => {
    if (educationalUnitId) {
      loadCourses();
    }
  }, [educationalUnitId]);

  const handleSuccess = () => {
    loadCourses(); // Reload courses and stats after successful operations
    setSelectedCourse(null);
  };

  const handleAssignTeacher = (course: CourseResponse) => {
    setSelectedCourse(course);
    setShowAssignTeacher(true);
  };

  const handleManageClasses = (course: CourseResponse) => {
    setSelectedCourse(course);
    setShowClassManagement(true);
  };

  const handleDeleteCourse = async (courseId: number, courseName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khóa học "${courseName}"? Điều này sẽ xóa tất cả lớp học và đăng ký liên quan. Hành động này không thể hoàn tác.`)) {
      try {
        await courseApi.deleteCourse(educationalUnitId!, courseId);
        toast.success('Xóa khóa học thành công!');
        handleSuccess();
      } catch (error: any) {
        console.error('Error deleting course:', error);
        toast.error(error?.response?.data?.message || 'Không thể xóa khóa học');
      }
    }
  };

  const getCapacityColor = (current: number, max: number) => {
    if (max === 0) return "text-gray-500";
    const ratio = current / max;
    if (ratio >= 0.9) return "text-red-600 font-semibold";
    if (ratio >= 0.7) return "text-orange-600 font-medium";
    return "text-green-600";
  };

  const getCapacityBadge = (current: number, max: number) => {
    if (max === 0) return { color: "gray", text: "Không có sức chứa" };
    const ratio = current / max;
    if (ratio >= 1) return { color: "red", text: "Đầy" };
    if (ratio >= 0.9) return { color: "orange", text: "Gần đầy" };
    if (ratio >= 0.7) return { color: "yellow", text: "Đông" };
    return { color: "green", text: "Còn chỗ" };
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

  // Calculate overall statistics
  const totalClasses = Object.values(classStats).reduce((sum, stat) => sum + stat.totalClasses, 0);
  const totalStudents = Object.values(classStats).reduce((sum, stat) => sum + stat.totalStudents, 0);
  const totalCapacity = Object.values(classStats).reduce((sum, stat) => sum + stat.capacity, 0);
  const activeClasses = Object.values(classStats).reduce((sum, stat) => sum + stat.activeClasses, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BookOpen className="mr-3 text-blue-600" size={32} />
            Quản lý Khóa học
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý khóa học và lớp học cho {currentEducationalUnit?.name || 'cơ sở giáo dục của bạn'}
          </p>
        </div>
        <Button 
          onClick={() => setShowCourseModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
        >
          <BookOpen className="mr-2" size={18} />
          Tạo Khóa học Mới
        </Button>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Khóa học</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Có Giáo viên</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.teacher).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <School className="text-purple-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lớp Đang hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">{activeClasses}</p>
              <p className="text-xs text-gray-500">trên {totalClasses} tổng</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserPlus className="text-orange-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Học sinh Đã đăng ký</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-xs text-gray-500">trên {totalCapacity} sức chứa</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <TrendingUp className="text-cyan-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tỷ lệ Sử dụng</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500">sức chứa tổng thể</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {courses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy khóa học nào</h3>
            <p className="text-gray-500 mb-4">Bắt đầu bằng cách tạo khóa học đầu tiên của bạn</p>
            <Button onClick={() => setShowCourseModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg">
              <BookOpen className="mr-2" size={16} />
              Tạo Khóa học
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chi tiết Khóa học
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giáo viên
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lớp học & Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đăng ký
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tín chỉ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => {
                  const stats = classStats[course.id] || { 
                    totalClasses: 0, 
                    totalStudents: 0, 
                    activeClasses: 0,
                    capacity: 0 
                  };
                  const capacityBadge = getCapacityBadge(stats.totalStudents, stats.capacity);
                  
                  return (
                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {course.courseName}
                            {stats.totalClasses === 0 && (
                              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Không có lớp
                              </span>
                            )}
                          </div>
                          {course.description && (
                            <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                              {course.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {course.teacher ? (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-medium text-sm">
                                {course.teacher.firstName[0]}{course.teacher.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {course.teacher.firstName} {course.teacher.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {course.teacher.teacherId}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              <Users className="w-4 h-4 text-gray-400" />
                            </div>
                            <span className="text-sm text-gray-500 italic">Chưa phân công giáo viên</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {stats.totalClasses} lớp
                          </span>
                          {stats.activeClasses < stats.totalClasses && (
                            <span className="text-xs text-gray-500">
                              ({stats.activeClasses} đang hoạt động)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            capacityBadge.color === 'red' ? 'bg-red-100 text-red-800' :
                            capacityBadge.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            capacityBadge.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            capacityBadge.color === 'green' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {capacityBadge.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${getCapacityColor(stats.totalStudents, stats.capacity)}`}>
                            {stats.totalStudents}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            /{stats.capacity}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {stats.capacity === 0 ? 'Chưa thiết lập sức chứa' : 
                           `${stats.capacity - stats.totalStudents} chỗ còn trống`}
                        </div>
                        {stats.capacity > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div 
                              className={`h-1.5 rounded-full ${
                                stats.totalStudents >= stats.capacity ? 'bg-red-600' :
                                stats.totalStudents / stats.capacity >= 0.9 ? 'bg-orange-500' :
                                stats.totalStudents / stats.capacity >= 0.7 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min((stats.totalStudents / stats.capacity) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {course.credits || 0} tín chỉ
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssignTeacher(course)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Users size={14} className="mr-1" />
                            Giáo viên
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManageClasses(course)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <School size={14} className="mr-1" />
                            Lớp học
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCourse(course.id, course.courseName)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CourseFormModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        educationalUnitId={educationalUnitId}
        onSuccess={handleSuccess}
      />

      <AssignTeacherModal
        isOpen={showAssignTeacher}
        onClose={() => setShowAssignTeacher(false)}
        course={selectedCourse}
        educationalUnitId={educationalUnitId}
        onSuccess={handleSuccess}
      />

      <ClassManagementModal
        isOpen={showClassManagement}
        onClose={() => setShowClassManagement(false)}
        course={selectedCourse}
        educationalUnitId={educationalUnitId}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default CourseListPage;