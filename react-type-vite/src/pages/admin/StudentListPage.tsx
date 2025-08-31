import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, Search, UserPlus, Trash2, Edit, Mail} from "lucide-react";
import StudentFormModal from "@/components/admin/student/StudentFormModal";
import { useAdmin } from "@/context/admin-context";
import type { StudentResponse } from "@/context/admin-context";

const StudentListPage: React.FC = () => {
  const { 
    getStudents, 
    deleteStudent, 
    institutionId, 
    isInstitutionLoading,
    currentInstitution 
  } = useAdmin();
  
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentResponse[]>([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    if (!institutionId) return;
    
    try {
      setLoading(true);
      const response = await getStudents();
      setStudents(response.content || []);
      setFilteredStudents(response.content || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (institutionId) {
      loadStudents();
    }
  }, [institutionId]);

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
    loadStudents(); // Reload students after successful creation
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to delete student "${studentName}"? This action cannot be undone.`)) {
      try {
        await deleteStudent(studentId);
        handleSuccess();
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
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
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <GraduationCap className="mr-3 text-blue-600" size={32} />
            Student Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage student accounts for {currentInstitution?.name || 'your institution'}
          </p>
        </div>
        <Button 
          onClick={() => setShowStudentModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
        >
          <UserPlus className="mr-2" size={18} />
          Create Student
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
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search students by name, username, email, student ID, or class..."
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first student account</p>
                <Button onClick={() => setShowStudentModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="mr-2" size={16} />
                  Create Student
                </Button>
              </>
            ) : (
              <>
                <Search className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students match your search</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STUDENT
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CONTACT
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class & ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                          ID: {student.studentId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.className || 'No class assigned'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {student.department?.name || (
                          <span className="text-gray-500 italic">No department</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
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
        onClose={() => setShowStudentModal(false)}
        institutionId={institutionId}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default StudentListPage;