import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/context/admin-context/index";
import type { CourseResponse, TeacherResponse } from "@/context/admin-context/index";

interface AssignTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseResponse | null;
  institutionId: string;
  onSuccess?: () => void;
}

const AssignTeacherModal: React.FC<AssignTeacherModalProps> = ({
  isOpen,
  onClose,
  course,
  institutionId,
  onSuccess,
}) => {
  const {
    getTeachers,
    assignTeacherToCourse,
    removeTeacherFromCourse,
    isLoading,
  } = useAdmin();
  
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");

  useEffect(() => {
    if (isOpen && institutionId) {
      loadTeachers();
    }
  }, [isOpen, institutionId]);

  const loadTeachers = async () => {
    try {
      const response = await getTeachers();
      setTeachers(response.content || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedTeacher || !course) return;
    try {
      console.log('Assigning teacher:', selectedTeacher, 'to course:', course.id);
      console.log('Selected teacher details:', teachers.find(t => t.id === selectedTeacher));
      await assignTeacherToCourse(course.id, selectedTeacher);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      console.error('Selected teacher ID:', selectedTeacher);
      console.error('Available teachers:', teachers);
    }
  };

  const handleRemoveTeacher = async () => {
    if (!course) return;
    try {
      await removeTeacherFromCourse(course.id);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error removing teacher:', error);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            Manage Teacher for {course.courseName}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="space-y-4">
          {course.teacher && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">Current Teacher:</p>
              <p className="text-sm">
                {course.teacher.firstName} {course.teacher.lastName} ({course.teacher.teacherId})
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveTeacher}
                disabled={isLoading}
                className="mt-2"
              >
                Remove Teacher
              </Button>
            </div>
          )}
          <div>
            <label htmlFor="teacher-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select new teacher
            </label>
            <select
              id="teacher-select"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="">Select new teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.teacherId}>
                  {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
                  {teacher.department && ` - ${teacher.department.name}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedTeacher || isLoading}
            >
              {isLoading ? "Assigning..." : "Assign Teacher"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AssignTeacherModal;