import React, { useEffect, useState } from "react";
import { X, Users, UserCheck, UserMinus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/context/admin-context/index";
import { Input } from "@/components/ui/input";
import type { CourseClassResponse, StudentResponse } from "@/context/admin-context/index";

interface EnrollStudentsToClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseClass: CourseClassResponse | null;
  institutionId: string;
  onSuccess?: () => void;
}

const EnrollStudentsToClassModal: React.FC<EnrollStudentsToClassModalProps> = ({
  isOpen,
  onClose,
  courseClass,
  onSuccess,
}) => {
  const {
    getAvailableStudentsForClass,
    getStudentsInClass,
    enrollStudentsToClass,
    unenrollStudentFromClass,
    isLoading,
  } = useAdmin();
  
  const [allAvailableStudents, setAllAvailableStudents] = useState<StudentResponse[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<StudentResponse[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'enrolled'>('available');
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
        getAvailableStudentsForClass(courseClass.id),
        getStudentsInClass(courseClass.id)
      ]);
      
      setAllAvailableStudents(availableResponse || []);
      setEnrolledStudents(enrolledResponse || []);
    } catch (error) {
      console.error('Error loading student data:', error);
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
      await enrollStudentsToClass(courseClass.id, selectedStudents);
      await loadData(); // Reload data
      setSelectedStudents([]);
      onSuccess?.();
    } catch (error) {
      console.error('Error enrolling students:', error);
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    if (!courseClass) return;
    
    if (window.confirm('Are you sure you want to remove this student from the class?')) {
      try {
        await unenrollStudentFromClass(courseClass.id, studentId);
        await loadData(); // Reload data
        onSuccess?.();
      } catch (error) {
        console.error('Error unenrolling student:', error);
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={handleBackdropClick}
      ></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Student Management</h2>
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
                Current: <span className="font-semibold text-white">{courseClass.currentStudents}/{courseClass.maxStudents}</span> students
              </span>
            </div>
            {!canEnrollMore && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium w-fit">
                Class Full
              </span>
            )}
          </div>
        </div>

        {/* Content with Footer structure - Similar to StudentFormModal */}
        <div className="flex flex-col h-[calc(90vh-140px)]">
          <div className="flex-1 overflow-hidden">
            {/* Tabs */}
            <div className="px-6 pt-6 pb-0">
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
                  <span className="hidden sm:inline">Available Students</span>
                  <span className="sm:hidden">Available</span>
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
                  <span className="hidden sm:inline">Enrolled Students</span>
                  <span className="sm:hidden">Enrolled</span>
                  <span className="ml-1">({enrolledStudents.length})</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-6 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  placeholder="Search students by name, ID, department, or class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-2.5 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg"
                />
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 flex-1 overflow-y-auto">
              {loadingData ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600 font-medium">Loading students...</span>
                </div>
              ) : activeTab === 'available' ? (
                <div className="space-y-4">
                  {!canEnrollMore && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <Users className="text-yellow-600" size={16} />
                        </div>
                        <p className="text-yellow-800 font-medium text-sm">
                          This class is at maximum capacity. No more students can be enrolled.
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
                        {searchTerm ? 'No students found' : 'No available students'}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {searchTerm 
                          ? 'Try adjusting your search criteria' 
                          : 'All eligible students are already enrolled or no students available to enroll'
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Action Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <span className="text-sm text-gray-600">
                            <span className="font-semibold">{filteredAvailableStudents.length}</span> students available
                          </span>
                          <div className="hidden sm:block h-4 w-px bg-gray-300"></div>
                          <span className="text-sm text-gray-600">
                            <span className="font-semibold text-purple-600">{availableSlots}</span> slots remaining
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
                              Select All
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDeselectAll}
                              disabled={selectedStudents.length === 0}
                              className="text-gray-600 border-gray-200 hover:bg-gray-50 flex-1 sm:flex-none"
                            >
                              Deselect All
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
                                  <div className="relative flex-shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleStudent(student.id)}
                                      disabled={isDisabled}
                                      className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                                    />
                                    {isSelected && (
                                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <UserCheck size={12} className="text-white" />
                                      </div>
                                    )}
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
                                          ID: {student.studentId}
                                        </span>
                                        {student.className && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                                            Class: {student.className}
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
                        {searchTerm ? 'No students found' : 'No students enrolled'}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {searchTerm 
                          ? 'Try adjusting your search criteria' 
                          : 'No students are currently enrolled in this class'
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
                                ID: {student.studentId}
                              </span>
                              {student.className && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                                  Class: {student.className}
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
                          onClick={() => handleUnenrollStudent(student.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 flex-shrink-0 ml-3"
                        >
                          <UserMinus size={14} className="mr-1" />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer - Similar structure to StudentFormModal */}
          <div className="border-t bg-gray-50 px-6 py-4 mt-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              {showEnrollFooter ? (
                <>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-purple-600">{selectedStudents.length}</span> student(s) selected
                    {selectedStudents.length > availableSlots && (
                      <span className="text-red-600 ml-2 font-medium block sm:inline">
                        (Exceeds available slots: {availableSlots})
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
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEnrollStudents}
                      disabled={
                        !selectedStudents.length || 
                        selectedStudents.length > availableSlots || 
                        isLoading
                      }
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 min-w-[140px] flex-1 sm:flex-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Enrolling...
                        </div>
                      ) : (
                        `Enroll ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`
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
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollStudentsToClassModal;