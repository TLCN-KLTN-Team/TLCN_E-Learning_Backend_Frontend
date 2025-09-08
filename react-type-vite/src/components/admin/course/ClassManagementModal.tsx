import React, { useEffect, useState } from "react";
import { X, Plus, Edit, Trash2, Users, School, Calendar, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/context/admin-context/index";
import { Input } from "@/components/ui/input";
import type { CourseResponse, CourseClassResponse } from "@/context/admin-context/index";
import EnrollStudentsToClassModal from "./EnrollStudentsToClassModal";

interface ClassManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseResponse | null;
  institutionId: string;
  onSuccess?: () => void;
}

const ClassManagementModal: React.FC<ClassManagementModalProps> = ({
  isOpen,
  onClose,
  course,
  institutionId,
  onSuccess,
}) => {
  const { 
    getClassesByCourse, 
    createClass, 
    updateClass, 
    deleteClass,
    isLoading 
  } = useAdmin();

  const [classes, setClasses] = useState<CourseClassResponse[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClass, setEditingClass] = useState<CourseClassResponse | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<CourseClassResponse | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(false);
  
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
      const response = await getClassesByCourse(course.id);
      setClasses(response.content || []);
    } catch (error) {
      console.error("Error loading classes:", error);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.className.trim()) {
      errors.className = "Class name is required";
    }
    if (!formData.classCode.trim()) {
      errors.classCode = "Class code is required";
    }
    if (formData.maxStudents < 1) {
      errors.maxStudents = "Max students must be at least 1";
    }
    
    // Check for duplicate class code (only when creating new class)
    if (!editingClass && classes.some(cls => cls.classCode === formData.classCode.trim())) {
      errors.classCode = "Class code already exists";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateClass = async () => {
    if (!course || !validateForm()) return;
    
    try {
      const classData = {
        className: formData.className.trim(),
        classCode: formData.classCode.trim(),
        courseId: course.id,
        maxStudents: formData.maxStudents,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        description: formData.description.trim() || undefined,
      };

      await createClass(classData);
      await loadClasses(); // Reload classes
      resetForm();
      setShowCreateForm(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating class:", error);
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass || !validateForm()) return;
    
    try {
      const updateData = {
        className: formData.className.trim(),
        classCode: formData.classCode.trim(),
        maxStudents: formData.maxStudents,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        description: formData.description.trim() || undefined,
      };

      await updateClass(editingClass.id, updateData);
      await loadClasses(); // Reload classes
      resetForm();
      setEditingClass(null);
      setShowCreateForm(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating class:", error);
    }
  };

  const handleDeleteClass = async (classToDelete: CourseClassResponse) => {
    if (!confirm(`Are you sure you want to delete "${classToDelete.className}"? This will also remove all student enrollments. This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteClass(classToDelete.id);
      await loadClasses(); // Reload classes
      onSuccess?.();
    } catch (error) {
      console.error("Error deleting class:", error);
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
                  <h2 className="text-xl font-bold text-white">Class Management</h2>
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
                          <div className="text-xs lg:text-sm text-gray-500">Total Classes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl lg:text-2xl font-bold text-green-600">
                            {classes.reduce((sum, cls) => sum + (cls.currentStudents || 0), 0)}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-500">Total Students</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl lg:text-2xl font-bold text-orange-600">
                            {classes.reduce((sum, cls) => sum + cls.maxStudents, 0)}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-500">Max Capacity</div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => setShowCreateForm(true)} 
                        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 w-full lg:w-auto px-4 lg:px-6"
                      >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Create New Class</span>
                        <span className="sm:hidden">Create Class</span>
                      </Button>
                    </div>

                    {/* Classes List */}
                    <div className="space-y-4">
                      {loadingClasses ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                          <p className="text-gray-500">Loading classes...</p>
                        </div>
                      ) : classes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <School className="mx-auto mb-3 text-gray-400" size={48} />
                          <p className="text-lg font-medium mb-2">No classes yet</p>
                          <p className="text-sm">Create your first class to start organizing students</p>
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
                                      {courseClass.status}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 text-sm">
                                  <div className="flex items-center text-gray-600">
                                    <Users size={16} className="mr-2 text-blue-500 flex-shrink-0" />
                                    <span>
                                      <span className="font-medium">{courseClass.currentStudents}</span>
                                      /{courseClass.maxStudents} students
                                    </span>
                                  </div>
                                  
                                  {courseClass.startDate && (
                                    <div className="flex items-center text-gray-600">
                                      <Calendar size={16} className="mr-2 text-green-500 flex-shrink-0" />
                                      <span className="truncate">Starts {new Date(courseClass.startDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center text-gray-600">
                                    <Hash size={16} className="mr-2 text-purple-500 flex-shrink-0" />
                                    <span className="truncate">ID: {courseClass.id}</span>
                                  </div>

                                  <div className={`flex items-center text-sm ${
                                    courseClass.currentStudents >= courseClass.maxStudents 
                                      ? "text-red-600 font-medium" 
                                      : "text-gray-600"
                                  }`}>
                                    {courseClass.currentStudents >= courseClass.maxStudents 
                                      ? "🔴 Full" 
                                      : `${courseClass.maxStudents - courseClass.currentStudents} slots available`
                                    }
                                  </div>
                                </div>

                                {courseClass.description && (
                                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    <strong>Description:</strong> {courseClass.description}
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
                                  <span className="hidden sm:inline">Students</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEdit(courseClass)}
                                  className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50 flex-1 lg:flex-none justify-center"
                                >
                                  <Edit size={14} />
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClass(courseClass)}
                                  className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 flex-1 lg:flex-none justify-center"
                                >
                                  <Trash2 size={14} />
                                  <span className="hidden sm:inline">Delete</span>
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
                        {editingClass ? "Edit Class" : "Create New Class"}
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
                        Back to List
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Class Name <span className="text-red-500">*</span>
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
                          placeholder="e.g., Morning Class A"
                        />
                        {formErrors.className && (
                          <p className="text-red-500 text-sm">{formErrors.className}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Class Code <span className="text-red-500">*</span>
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
                          placeholder="e.g., CS101-A1"
                        />
                        {formErrors.classCode && (
                          <p className="text-red-500 text-sm">{formErrors.classCode}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Max Students <span className="text-red-500">*</span>
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
                          Start Date
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
                          End Date
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
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 transition-colors"
                        rows={3}
                        placeholder="Optional description for this class..."
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
                    {editingClass ? "Updating class information" : "Creating new class"}
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
                      Cancel
                    </Button>
                    <Button
                      onClick={editingClass ? handleUpdateClass : handleCreateClass}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 min-w-[140px] flex-1 sm:flex-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {editingClass ? "Updating..." : "Creating..."}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <School size={16} className="mr-2" />
                          <span className="hidden sm:inline">
                            {editingClass ? "Update Class" : "Create Class"}
                          </span>
                          <span className="sm:hidden">
                            {editingClass ? "Update" : "Create"}
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
        institutionId={institutionId}
        onSuccess={handleEnrollSuccess}
      />
    </>
  );
};

export default ClassManagementModal;