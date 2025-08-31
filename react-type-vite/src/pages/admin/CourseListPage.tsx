import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Trash2, BookOpen } from "lucide-react";
import CourseFormModal from "@/components/admin/course/CourseFormModal";
import AssignTeacherModal from "@/components/admin/course/AssignTeacherModal";
import EnrollStudentsModal from "@/components/admin/course/EnrollStudentsModal";
import { useAdmin } from "@/context/admin-context";
import type { CourseResponse } from "@/context/admin-context";

const CourseListPage: React.FC = () => {
  const { 
    getCourses, 
    deleteCourse, 
    institutionId, 
    isInstitutionLoading,
    currentInstitution 
  } = useAdmin();
  
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [showEnrollStudents, setShowEnrollStudents] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    if (!institutionId) return;
    
    try {
      setLoading(true);
      const response = await getCourses();
      setCourses(response.content || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (institutionId) {
      loadCourses();
    }
  }, [institutionId]);

  const handleSuccess = () => {
    loadCourses(); // Reload courses after successful operations
    setSelectedCourse(null);
  };

  const handleAssignTeacher = (course: CourseResponse) => {
    setSelectedCourse(course);
    setShowAssignTeacher(true);
  };

  const handleEnrollStudents = (course: CourseResponse) => {
    setSelectedCourse(course);
    setShowEnrollStudents(true);
  };

  const handleDeleteCourse = async (courseId: number, courseName: string) => {
    if (window.confirm(`Are you sure you want to delete the course "${courseName}"? This action cannot be undone.`)) {
      try {
        await deleteCourse(courseId);
        handleSuccess();
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const getStudentStatusColor = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio >= 0.9) return "text-red-600 font-semibold";
    if (ratio >= 0.7) return "text-orange-600 font-medium";
    return "text-green-600";
  };

  // Show loading state while institution is loading
  if (isInstitutionLoading) {
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
          <h3 className="text-lg font-medium text-red-900 mb-2">Institution not found</h3>
          <p className="text-red-700">Unable to load institution data. Please try refreshing the page.</p>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BookOpen className="mr-3 text-blue-600" size={32} />
            Course Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage courses for {currentInstitution?.name || 'your institution'}
          </p>
        </div>
        <Button 
          onClick={() => setShowCourseModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
        >
          <BookOpen className="mr-2" size={18} />
          Create New Course
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
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
              <p className="text-sm font-medium text-gray-600">With Teachers</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.teacher).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserPlus className="text-purple-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((sum, course) => sum + (course.currentStudents || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BookOpen className="text-orange-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.length > 0 
                  ? Math.round((courses.reduce((sum, course) => sum + (course.currentStudents || 0), 0) / 
                     courses.reduce((sum, course) => sum + (course.maxStudents || 0), 0)) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {courses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first course</p>
            <Button onClick={() => setShowCourseModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <BookOpen className="mr-2" size={16} />
              Create Course
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {course.courseName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {course.courseType?.courseTypeName || 'No type specified'}
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
                        <span className="text-sm text-gray-500 italic">No teacher assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          getStudentStatusColor(course.currentStudents || 0, course.maxStudents || 1)
                        }`}>
                          {course.currentStudents || 0}/{course.maxStudents || 0}
                        </span>
                        <div className="ml-2 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ 
                              width: `${Math.min(100, ((course.currentStudents || 0) / (course.maxStudents || 1)) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(((course.currentStudents || 0) / (course.maxStudents || 1)) * 100)}% full
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {course.credits || 0} credits
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
                          Teacher
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEnrollStudents(course)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <UserPlus size={14} className="mr-1" />
                          Students
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CourseFormModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        institutionId={institutionId}
        onSuccess={handleSuccess}
      />

      <AssignTeacherModal
        isOpen={showAssignTeacher}
        onClose={() => setShowAssignTeacher(false)}
        course={selectedCourse}
        institutionId={institutionId}
        onSuccess={handleSuccess}
      />

      <EnrollStudentsModal
        isOpen={showEnrollStudents}
        onClose={() => setShowEnrollStudents(false)}
        course={selectedCourse}
        institutionId={institutionId}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default CourseListPage;