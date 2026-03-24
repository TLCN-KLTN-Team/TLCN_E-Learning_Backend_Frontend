import { useState, useEffect } from "react";
import ChannelTimer from "./ChannelTimer";
import ExerciseComponent from "./ExerciseComponent";
import { Clock, BookOpen } from "lucide-react";

interface ChannelWorkspaceProps {
  channelId: string;
  channelName: string;
  endTime: Date; // ISO string from backend
  onChannelExpired?: () => void;
}

const ChannelWorkspace = ({
  channelId,
  channelName,
  endTime,
  onChannelExpired,
}: ChannelWorkspaceProps) => {
  const [isExerciseSubmitted, setIsExerciseSubmitted] = useState(false);
  const [showExercise, setShowExercise] = useState(true);

  // Check if channel time is valid
  const isChannelActive = () => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    return end > now;
  };

  // Handle exercise submission
  const handleExerciseSubmit = () => {
    setIsExerciseSubmitted(true);
  };

  // Handle channel expiration
  const handleChannelExpired = () => {
    setShowExercise(false);
    if (onChannelExpired) {
      onChannelExpired();
    }
  };

  // Auto-submit exercise when time expires
  useEffect(() => {
    const checkAndAutoSubmit = () => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const isActive = end > now;

      if (!isActive && !isExerciseSubmitted) {
        // Auto submit exercise if time has expired
        handleExerciseSubmit();
      }
    };

    checkAndAutoSubmit();
  }, [endTime, isExerciseSubmitted]);

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-800">
            Không gian làm việc - {channelName}
          </h1>
        </div>
        <p className="text-gray-600">
          Hoàn thành bài tập trong thời gian quy định. Kênh sẽ tự động đóng khi
          hết thời gian.
        </p>
      </div>

      {/* Timer Component */}
      {isChannelActive() && (
        <ChannelTimer
          channelId={channelId}
          channelName={channelName}
          endTime={endTime}
          onChannelExpired={handleChannelExpired}
        />
      )}

      {/* Exercise Component */}
      {showExercise && isChannelActive() && (
        <ExerciseComponent
          channelName={channelName}
          onSubmit={handleExerciseSubmit}
        />
      )}

      {/* Channel Expired Message */}
      {!isChannelActive() && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Kênh đã kết thúc
              </h3>
              <p className="text-red-600 mt-1">
                Thời gian làm bài đã hết. Kênh "{channelName}" đã được đóng và
                lưu trữ.
              </p>
              {isExerciseSubmitted && (
                <p className="text-green-600 mt-2">
                  ✅ Bài tập đã được nộp thành công trước khi hết thời gian.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exercise Submitted Status */}
      {isExerciseSubmitted && isChannelActive() && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-700 font-medium">
              Bài tập đã nộp thành công. Bạn có thể tiếp tục sử dụng kênh cho
              đến khi hết thời gian.
            </span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Hướng dẫn:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Hoàn thành bài tập trong thời gian quy định</li>
          <li>• Bài tập sẽ tự động nộp khi hết thời gian</li>
          <li>• Kênh sẽ tự động đóng và được lưu trữ sau khi hết thời gian</li>
          <li>• Bạn có thể chat với các thành viên khác trong kênh</li>
        </ul>
      </div>
    </div>
  );
};

export default ChannelWorkspace;
