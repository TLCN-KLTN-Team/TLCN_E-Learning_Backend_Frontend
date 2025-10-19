import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Modal from "@/components/ui/modal";
import FileUpload from './FileUpload';
import type { LessonRequest } from '@/services/api/request/lessonRequest';

const AddLessonModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddLesson: (data: Omit<LessonRequest, 'id'>) => void;
}> = ({ isOpen, onClose, onAddLesson }) => {
  const [formData, setFormData] = useState<Omit<LessonRequest, 'id' | 'sectionId'>>({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    isFreeLesson: false,
    attachments: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFilesChange = (files: string[]) => {
    setFormData(prev => ({
      ...prev,
      attachments: files,
    }));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.title) return;
    setIsLoading(true);
    setTimeout(() => {
      onAddLesson(formData);
      setFormData({
        title: '',
        description: '',
        content: '',
        videoUrl: '',
        isFreeLesson: false,
        attachments: [],
      });
      setIsLoading(false);
      onClose();
    }, 500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Create New Lesson</h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Lesson Title</label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Introduction to React Components"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Lesson Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of what students will learn"
              className="w-full p-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">Lesson Content</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Enter lesson content (supports Markdown formatting)"
              className="w-full p-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
            />
          </div>

          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium mb-1">Video URL (Optional)</label>
            <Input
              id="videoUrl"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              placeholder="e.g., https://www.youtube.com/watch?v=..."
            />
          </div>

          {/* File Upload Section */}
          <FileUpload
            files={formData.attachments || []}
            onFilesChange={handleFilesChange}
            title="Lesson Attachments"
            description="Upload supporting materials for this lesson"
            acceptedTypes={['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.jpg', '.jpeg', '.png', '.mp4', '.mov', '.zip']}
            maxFileSize={100}
            maxFiles={10}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFreeLesson"
              id="isFreeLesson"
              checked={formData.isFreeLesson}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <label htmlFor="isFreeLesson" className="text-sm">Make this a free preview lesson</label>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-700">
              💡 <strong>Tip:</strong> The lesson will be added to the end of this section.
              You can drag and drop to reorder lessons later.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Lesson'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddLessonModal;
