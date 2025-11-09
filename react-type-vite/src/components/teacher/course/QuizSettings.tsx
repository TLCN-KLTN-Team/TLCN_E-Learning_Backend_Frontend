import React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader} from '@/components/ui/card';
import type { QuizRequest } from '@/services/api/request/quizRequest';

const QuizSettings: React.FC<{
  settings: QuizRequest;
  onSettingsChange: (settings: Partial<QuizRequest>) => void;
}> = ({ settings, onSettingsChange }) => {
  const toDateTimeLocal = (iso?: string) => (iso ? iso.slice(0, 16) : "")

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Cài Đặt Bài Kiểm Tra</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tiêu Đề</label>
          <input
            type="text"
            value={settings.title}
            onChange={(e) => onSettingsChange({ title: e.target.value })}
            className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
            placeholder="Nhập tiêu đề bài kiểm tra"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mô Tả</label>
          <textarea
            value={settings.description || ''}
            onChange={(e) => onSettingsChange({ description: e.target.value })}
            className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
            rows={3}
            placeholder="Nhập mô tả bài kiểm tra"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Thời Gian (phút)</label>
            <input
              type="number"
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
              value={settings.duration || ''}
              onChange={(e) => onSettingsChange({ duration: parseInt(e.target.value) || 0 })}
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Điểm Đạt (%)</label>
            <input
              type="number"
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
              value={settings.passingScore || ''}
              onChange={(e) => onSettingsChange({ passingScore: parseInt(e.target.value) || 0 })}
              min="0"
              max="100"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Giới Hạn Số Lần Làm</label>
            <input
              type="number"
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
              value={settings.attemptLimit ?? ''}
              onChange={(e) => onSettingsChange({ attemptLimit: parseInt(e.target.value) || 0 })}
              min="1"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <input
                id="showResults"
                type="checkbox"
                checked={!!settings.showResults}
                onChange={(e) => onSettingsChange({ showResults: e.target.checked })}
                className="h-4 w-4 mr-2"
              />
              <label htmlFor="showResults" className="text-sm">Hiển Thị Kết Quả</label>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Thời Gian Bắt Đầu</label>
            <input
              type="datetime-local"
              value={toDateTimeLocal(settings.startTime)}
              onChange={(e) => {
                console.log('[QuizSettings] startTime changed:', e.target.value);
                onSettingsChange({ startTime: e.target.value || undefined });
              }}
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Thời Gian Kết Thúc</label>
            <input
              type="datetime-local"
              value={toDateTimeLocal(settings.endTime)}
              onChange={(e) => {
                console.log('[QuizSettings] endTime changed:', e.target.value);
                onSettingsChange({ endTime: e.target.value || undefined });
              }}
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizSettings;