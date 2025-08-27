import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SectionRequest } from '@/types/course.types';
import Modal from "@/components/ui/modal";

const AddSectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddSection: (data: Omit<SectionRequest, 'id'>) => void;
}> = ({ isOpen, onClose, onAddSection }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev, 
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    setIsLoading(true);

    setTimeout(() => {
      onAddSection({ ...formData, isPublished: false });
      setFormData({ title: '', description: '' });
      setIsLoading(false);
      onClose();
    }, 500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex flex-col max-h-[90vh]">  
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Create New Section</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Section Title</label>
            <Input 
              id="title" 
              name="title" 
              type="text" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="e.g., Introduction to React Basics"
              required 
              autoFocus 
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Description (Optional)</label>
            <textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Brief description of what this section covers..."
              className="w-full p-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" 
              rows={3}
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> The section will be automatically positioned at the end. 
              You can drag and drop to reorder sections later.
            </p>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Section'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddSectionModal;