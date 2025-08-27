import React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader} from '@/components/ui/card';
import type { QuizRequest } from '@/types/course.types';

const QuizSettings: React.FC<{
  settings: QuizRequest;
  onSettingsChange: (settings: Partial<QuizRequest>) => void;
}> = ({ settings, onSettingsChange }) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Quiz Settings</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) => onSettingsChange({ title: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Enter quiz title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={settings.description || ''}
            onChange={(e) => onSettingsChange({ description: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter quiz description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <Input
              type="number"
              value={settings.duration || ''}
              onChange={(e) => onSettingsChange({ duration: parseInt(e.target.value) || 0 })}
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Passing Score (%)</label>
            <Input
              type="number"
              value={settings.passingScore || ''}
              onChange={(e) => onSettingsChange({ passingScore: parseInt(e.target.value) || 0 })}
              min="0"
              max="100"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizSettings;