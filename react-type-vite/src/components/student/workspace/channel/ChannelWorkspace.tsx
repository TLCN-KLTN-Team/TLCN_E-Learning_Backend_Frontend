import { useState, useEffect, useCallback } from "react";
import ChannelTimer from "./ChannelTimer";
import ExerciseComponent from "./ExerciseComponent";
import MessageList from "../chat-window/MessageList";
import MessageInput from "../chat-window/MessageInput";
import { Clock, BookOpen, MessageCircle } from "lucide-react";
import type {
  ChatMessageResponse,
  Participant,
} from "@/types/chat.types";

interface ChannelWorkspaceProps {
  channelId: string;
  channelName: string;
  endTime: string; // ISO string from backend
  onChannelExpired?: () => void;
  // Chat props
  participants: Participant[];
  isLoadingMessages: boolean;
  isConnected: boolean;
  wsMessages: ChatMessageResponse[];
  wsErrors: Array<{ message: string }>;
  onSendMessage: (content: string) => void;
  onClearErrors: () => void;
}

const ChannelWorkspace = ({
  channelId,
  channelName,
  endTime,
  onChannelExpired,
  participants,
  isLoadingMessages,
  isConnected,
  wsMessages,
  wsErrors,
  onSendMessage,
  onClearErrors,
}: ChannelWorkspaceProps) => {
  const [isExerciseSubmitted, setIsExerciseSubmitted] = useState(false);
  const [showExercise, setShowExercise] = useState(true);
  const [showChat, setShowChat] = useState(false);

  // Check if channel time is valid
  const isChannelActive = useCallback(() => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    return end > now;
  }, [endTime]);

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
    if (!isChannelActive() && !isExerciseSubmitted) {
      // Auto submit exercise if time has expired
      console.log("Time expired, auto-submitting exercise...");
      handleExerciseSubmit();
    }
  }, [endTime, isExerciseSubmitted, isChannelActive]);

  // Set up interval to check time expiration
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isChannelActive() && !isExerciseSubmitted) {
        console.log("Time expired, auto-submitting exercise...");
        handleExerciseSubmit();
        clearInterval(interval);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isExerciseSubmitted, isChannelActive]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 m-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              Không gian làm việc - {channelName}
            </h1>
          </div>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showChat
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{showChat ? "Ẩn Chat" : "Hiện Chat"}</span>
          </button>
        </div>
        <p className="text-gray-600">
          Hoàn thành bài tập trong thời gian quy định. Kênh sẽ tự động đóng khi
          hết thời gian.
        </p>
      </div>

      {/* Timer Component */}
      {isChannelActive() && (
        <div className="mx-6 mb-4">
          <ChannelTimer
            channelId={channelId}
            channelName={channelName}
            endTime={endTime}
            onChannelExpired={handleChannelExpired}
          />
        </div>
      )}

      {/* Main Content Area - Two Column Layout */}
      <div className="flex-1 flex px-6 gap-6">
        {/* Left Column - Exercise */}
        <div className={`${showChat ? "w-2/3" : "w-full"} transition-all duration-300`}>
          {/* Exercise Component */}
          {showExercise && (
            <ExerciseComponent
              channelName={channelName}
              onSubmit={handleExerciseSubmit}
              isTimeExpired={!isChannelActive()}
            />
          )}

          {/* Channel Expired Message */}
          {!isChannelActive() && !showExercise && (
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
        </div>

        {/* Right Column - Chat */}
        {showChat && (
          <div className="w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Chat - {channelName}</h3>
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {participants.length} thành viên
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <MessageList
                selectedChannel={{ id: channelId, channelName, endTime: parseInt(endTime), isPrivate: false }}
                wsMessages={wsMessages}
                isLoadingMessages={isLoadingMessages}
                isConnected={isConnected}
                wsErrors={wsErrors}
              />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200">
              <MessageInput
                selectedChannel={{ id: channelId, channelName, endTime: parseInt(endTime), isPrivate: false }}
                isConnected={isConnected}
                wsMessages={wsMessages}
                wsErrors={wsErrors}
                onSendMessage={onSendMessage}
                onClearErrors={onClearErrors}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer - Instructions and Status */}
      <div className="p-6 space-y-4">
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
    </div>
  );
};

export default ChannelWorkspace;
