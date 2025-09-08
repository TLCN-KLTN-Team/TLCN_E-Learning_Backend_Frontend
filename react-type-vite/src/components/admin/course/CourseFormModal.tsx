import React, { useState, useEffect } from "react";
import { X, BookOpen, Users, Clock, FileText, Hash, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/context/admin-context/index";
import type { CourseRequest, CourseTypeResponse } from "@/context/admin-context/index";

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionId: string;
  onSuccess?: () => void;
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createCourse, getCourseTypes, isLoading } = useAdmin();
  
  const [form, setForm] = useState<CourseRequest>({
    courseName: "",
    courseTypeId: 0,
    credits: 3,
    maxStudents: 30,
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [courseTypes, setCourseTypes] = useState<CourseTypeResponse[]>([]);
  const [loadingCourseTypes, setLoadingCourseTypes] = useState(false);

  // Load course types when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCourseTypes();
    }
  }, [isOpen]);

  const loadCourseTypes = async () => {
    try {
      setLoadingCourseTypes(true);
      const response = await getCourseTypes();
      setCourseTypes(response.content || []);
    } catch (error) {
      console.error('Error loading course types:', error);
    } finally {
      setLoadingCourseTypes(false);
    }
  };

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.courseName.trim()) {
      newErrors.courseName = "Course name is required";
    }
    if (!form.courseTypeId || form.courseTypeId < 1) {
      newErrors.courseTypeId = "Please select a course type";
    }
    if (!form.credits || form.credits < 1) {
      newErrors.credits = "Credits must be at least 1";
    }
    if (!form.maxStudents || form.maxStudents < 1) {
      newErrors.maxStudents = "Max students must be at least 1";
    }
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === "number" ? Number(value) : value,
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;

    try {
      await createCourse(form);
      onSuccess?.();
      onClose();
      
      // Reset form
      setForm({
        courseName: "",
        courseTypeId: 0,
        credits: 3,
        maxStudents: 30,
        description: "",
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={handleBackdropClick}
      ></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Create New Course</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X size={18} />
            </Button>
          </div>
          <p className="text-blue-100 text-sm mt-2">Add a new course to your institution</p>
        </div>
        
        {/* Form Content với Footer bên trong */}
        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-120px)]">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Course Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <BookOpen size={16} className="mr-2" />
                  Course Information
                </h3>
                
                <div className="space-y-4">
                  {/* Course Name */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <BookOpen size={14} className="mr-2 text-blue-600" />
                      Course Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input 
                      name="courseName" 
                      placeholder="e.g., Introduction to Computer Science" 
                      value={form.courseName} 
                      onChange={handleChange}
                      className={`transition-colors ${errors.courseName ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    />
                    {errors.courseName && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.courseName}
                      </p>
                    )}
                  </div>
                  
                  {/* Course Type Dropdown */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Hash size={14} className="mr-2 text-blue-600" />
                      Course Type
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <label htmlFor="courseTypeId" className="sr-only">Course type</label>
                      <select
                        id="courseTypeId"
                        name="courseTypeId"
                        value={form.courseTypeId || ""}
                        onChange={handleChange}
                        disabled={loadingCourseTypes}
                        className={`w-full p-3 border rounded-lg appearance-none bg-white transition-colors ${
                          errors.courseTypeId ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                        } ${loadingCourseTypes ? 'opacity-50' : ''}`}
                      >
                        <option value="">
                          {loadingCourseTypes ? "Loading course types..." : "Select course type"}
                        </option>
                        {courseTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.courseTypeName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                        size={16}
                      />
                    </div>
                    {errors.courseTypeId && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.courseTypeId}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Users size={16} className="mr-2" />
                  Course Details
                </h3>
                
                {/* Credits and Max Students Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Clock size={14} className="mr-2 text-green-600" />
                      Credits
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input 
                      name="credits" 
                      type="number" 
                      placeholder="3" 
                      value={form.credits || ""} 
                      onChange={handleChange} 
                      min="1" 
                      max="10"
                      className={`transition-colors ${errors.credits ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                    />
                    {errors.credits && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.credits}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Users size={14} className="mr-2 text-green-600" />
                      Max Students
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input 
                      name="maxStudents" 
                      type="number" 
                      placeholder="30" 
                      value={form.maxStudents || ""} 
                      onChange={handleChange} 
                      min="1" 
                      max="500"
                      className={`transition-colors ${errors.maxStudents ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                    />
                    {errors.maxStudents && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.maxStudents}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <FileText size={16} className="mr-2" />
                  Additional Information
                  <span className="text-gray-400 ml-2 text-xs">(Optional)</span>
                </h3>
                
                {/* Description */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FileText size={14} className="mr-2 text-orange-600" />
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Provide a brief description of the course content and objectives..."
                    value={form.description || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:border-orange-500 focus:outline-none transition-colors"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer - Moved inside form */}
          <div className="border-t bg-gray-50 px-6 py-4 mt-auto">
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <BookOpen size={16} className="mr-2" />
                    Create Course
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseFormModal;