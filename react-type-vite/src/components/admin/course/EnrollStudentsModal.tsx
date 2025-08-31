import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/context/admin-context/index";
import type { CourseResponse, StudentResponse } from "@/context/admin-context/index";

interface EnrollStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseResponse | null;
  institutionId: string;
  onSuccess?: () => void;
}

const EnrollStudentsModal: React.FC<EnrollStudentsModalProps> = ({
  isOpen,
  onClose,
  course,
  institutionId,
  onSuccess,
}) => {
  const { getStudents, enrollStudentsToCourse, isLoading } = useAdmin();
  
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<string[]>([]);

  // Reset selectedStudents when course changes or modal opens
  useEffect(() => {
    if (isOpen && course) {
      setSelectedStudents([]);
      // Load enrolled students for this course
      loadEnrolledStudents();
    }
  }, [isOpen, course?.id]); // Add course?.id as dependency

  // Load all students when modal opens
  useEffect(() => {
    if (isOpen && institutionId) {
      loadStudents();
    }
  }, [isOpen, institutionId]);

  const loadStudents = async () => {
    try {
      const response = await getStudents();
      setStudents(response.content || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadEnrolledStudents = async () => {
    if (!course) return;
    
    try {
      // You might need to create this API call to get enrolled students
      // For now, we'll filter based on the enrollment check
      // This is a placeholder - you should implement getEnrolledStudents API
      setEnrolledStudents([]);
    } catch (error) {
      console.error('Error loading enrolled students:', error);
      setEnrolledStudents([]);
    }
  };

  const handleToggle = (studentId: string) => {
    // Don't allow selecting already enrolled students
    if (enrolledStudents.includes(studentId)) {
      return;
    }

    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleEnroll = async () => {
    if (!selectedStudents.length || !course) return;
    try {
      await enrollStudentsToCourse(course.id, selectedStudents);
      onSuccess?.();
      handleClose(); // Use custom close handler
    } catch (error) {
      console.error('Error enrolling students:', error);
      // Don't close modal on error, let user try again
    }
  };

  const handleClose = () => {
    setSelectedStudents([]); // Reset selection when closing
    setEnrolledStudents([]);
    onClose();
  };

  // Filter out already enrolled students from the display
  const availableStudents = students.filter(student => 
    !enrolledStudents.includes(student.id)
  );

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            Enroll Students to {course.courseName}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Current: {course.currentStudents || 0}/{course.maxStudents} students
          </div>

          <div className="text-sm text-blue-600">
            Available students: {availableStudents.length}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {availableStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No available students to enroll
              </div>
            ) : (
              availableStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                >
                  <label className="flex items-center space-x-2 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleToggle(student.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {student.firstName} {student.lastName}
                        <span className="ml-2 text-sm text-gray-500">
                          ({student.studentId})
                        </span>
                      </div>
                      {student.className && (
                        <div className="text-sm text-gray-500">{student.className}</div>
                      )}
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>

          <div className="text-sm font-medium">
            {selectedStudents.length} selected
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={!selectedStudents.length || isLoading || availableStudents.length === 0}
            >
              {isLoading
                ? "Enrolling..."
                : `Enroll ${selectedStudents.length} Students`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollStudentsModal;