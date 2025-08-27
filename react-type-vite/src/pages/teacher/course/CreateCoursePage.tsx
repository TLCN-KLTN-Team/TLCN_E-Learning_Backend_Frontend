import React, { useState, useCallback } from 'react';
import { produce } from 'immer';
import Header from '@/components/teacher/dashboard/header';
import Footer from '@/components/teacher/dashboard/footer';
import CreateCourseForm from '@/components/teacher/course/CreateCourseForm';
import CourseBuilder from '@/components/teacher/course/CourseBuilder';
import type { CourseRequest, SectionRequest } from '@/types/course.types';

// Initial state for a new course, mirroring the backend DTOs
const initialCourseState: CourseRequest = {
  courseName: '',
  courseTypeId: 1,
  sections: [],
};


const CreateCoursePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [courseData, setCourseData] = useState<CourseRequest>(initialCourseState);
  const [courseId, setCourseId] = useState<string | null>(null); // To be received from backend

  // A centralized, immutable way to update the nested course state using Immer
  const handleCourseChange = useCallback((updater: (draft: CourseRequest) => void) => {
    setCourseData(produce(updater));
  }, []);

  // Fired when the first step (form) is completed
  const handleFormSubmit = (submittedData: CourseRequest) => {
    console.log("Step 1 Complete. Data:", submittedData);
    // In a real app, you would send this to the backend and get a courseId
    // For now, we'll just update the state and move to the next step
    setCourseData(submittedData);
    setCourseId(courseId ?? `mock_id_${Date.now()}`); // Use existing or create mock ID
    setCurrentStep(2);
  };

  // Centralized logic for managing sections
  const handleSectionsChange = (newSections: SectionRequest[]) => {
    handleCourseChange(draft => {
      draft.sections = newSections;
    });
  };

  const handleGoToStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Create a New Course</h1>
          <p className="text-muted-foreground mb-6">
            Follow the steps below to create and structure your course content.
          </p>
          
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  1
                </div>
                <span className="ml-2 font-medium">Course Info</span>
              </div>
              <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  2
                </div>
                <span className="ml-2 font-medium">Course Builder</span>
              </div>
            </div>
          </div>

          {/* Step 1: Course Form */}
          <div className={currentStep === 1 ? 'block' : 'hidden'}>
            <CreateCourseForm
              initialData={courseData}
              onSubmit={handleFormSubmit}
            />
          </div>

          {/* Step 2: Course Builder */}
          <div className={currentStep === 2 ? 'block' : 'hidden'}>
            {courseId && (
              <CourseBuilder
                courseId={courseId}
                sections={courseData.sections || []}
                onSectionsChange={handleSectionsChange}
                onBack={() => handleGoToStep(1)}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateCoursePage;