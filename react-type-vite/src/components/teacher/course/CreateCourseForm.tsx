import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { CourseRequest, CourseTypeRequest } from '@/types/course.types';

interface CreateCourseFormProps {
  initialData?: Partial<CourseRequest>;
  onSubmit: (data: CourseRequest) => void;
}

const CreateCourseForm: React.FC<CreateCourseFormProps> = ({ 
  initialData = {}, 
  onSubmit 
}) => {
  // Mock course types - in real app, fetch from API
  const [courseTypes] = useState<CourseTypeRequest[]>([
    { id: 1, courseTypeName: 'Programming' },
    { id: 2, courseTypeName: 'Design' },
    { id: 3, courseTypeName: 'Marketing' },
    { id: 4, courseTypeName: 'Business' },
    { id: 5, courseTypeName: 'Data Science' },
  ]);

  const [formData, setFormData] = useState<CourseRequest>({
    courseName: '',
    courseTypeId: 1,
    idTeacher: '', // Will be set from auth context in real app
    sections: [],
    ...initialData
  });
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In real app, get teacher ID from authentication context
    setFormData(prev => ({
      ...prev,
      idTeacher: 'current_teacher_id' // Mock teacher ID
    }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = () => {
    if (!formData.courseName.trim()) {
      alert('Please enter a course name');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      onSubmit({
        ...formData,
        createdAt: new Date().toISOString(),
        updateAt: new Date().toISOString()
      });
      setIsLoading(false);
    }, 500);
  };

  const selectedCourseType = courseTypes.find(ct => ct.id === formData.courseTypeId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Course Information</CardTitle>
          <CardDescription>
            Provide the essential details for your course. You can add content in the next step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Course Name */}
          <div>
            <label htmlFor="courseName" className="block text-sm font-medium mb-2">
              Course Name *
            </label>
            <Input
              id="courseName"
              name="courseName"
              type="text"
              value={formData.courseName}
              onChange={handleInputChange}
              placeholder="e.g., Complete Web Development Bootcamp"
              required
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose a clear, descriptive name that tells students what they'll learn
            </p>
          </div>

          {/* Course Type */}
          <div>
            <label htmlFor="courseTypeId" className="block text-sm font-medium mb-2">
              Course Category *
            </label>
            <select
              id="courseTypeId"
              name="courseTypeId"
              value={formData.courseTypeId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {courseTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.courseTypeName}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Selected: {selectedCourseType?.courseTypeName}
            </p>
          </div>

          {/* Teacher Info (Read-only for now) */}
          <div>
            <label htmlFor="idTeacher" className="block text-sm font-medium mb-2">
              Instructor
            </label>
            <Input
              id="idTeacher"
              name="idTeacher"
              type="text"
              value={formData.idTeacher}
              readOnly
              className="w-full bg-gray-50"
              placeholder="Your instructor ID will be automatically assigned"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be automatically set from your account
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Course Stats Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Course Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-900">Sections</div>
              <div className="text-2xl font-bold text-blue-600">
                {formData.sections?.length || 0}
              </div>
              <div className="text-blue-700 text-xs">Will be added in next step</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-900">Category</div>
              <div className="text-lg font-semibold text-green-600">
                {selectedCourseType?.courseTypeName || 'Not selected'}
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-900">Status</div>
              <div className="text-lg font-semibold text-purple-600">
                Draft
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• After creating your course, you'll add sections and lessons</li>
              <li>• You can upload files, videos, and create quizzes for each lesson</li>
              <li>• Your course will be saved as a draft until you're ready to publish</li>
              <li>• You can always edit course details later</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button 
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Course...
            </div>
          ) : (
            'Create Course & Continue'
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateCourseForm;