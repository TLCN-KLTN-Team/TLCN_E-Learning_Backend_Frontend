import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Settings,
  UserPlus,
  Send,
  Smile,
  Paperclip,
  Upload,
  AlertCircle,
} from "lucide-react";
import type {
  ChannelResponse,
  ChatMessageResponse,
  UserResponse,
} from "@/types/chat.types";

interface TimeBasedChannelViewProps {
  channel: ChannelResponse;
  participants: UserResponse[];
  wsMessages: ChatMessageResponse[];
  isConnected: boolean;
  onSendMessage: (content: string) => void;
  onInvitePeople?: () => void;
  onChannelSettings?: () => void;
}

const TimeBasedChannelView = ({
  channel,
  // participants, // Reserved for future use
  wsMessages,
  isConnected,
  onSendMessage,
  onInvitePeople,
  onChannelSettings,
}: TimeBasedChannelViewProps) => {
  const [messageInput, setMessageInput] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const endTime = channel.endTime ?? 0;
      const remaining = endTime - now;

      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining(0);
        return 0;
      }

      setTimeRemaining(remaining);
      return remaining;
    };

    // Initial calculation
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);

    return () => clearInterval(interval);
  }, [channel.endTime]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [wsMessages]);

  // Format time remaining
  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return "00:00:00";

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || isExpired) {
      return;
    }

    onSendMessage(messageInput.trim());
    setMessageInput("");
  };

  // Get user initials for avatar
  // const getUserInitials = (participant: UserResponse): string => {
  //   const firstName = participant.nickname;
  //   return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "??";
  // };

  // Check if channel is ending soon (less than 5 minutes)
  const isEndingSoon = timeRemaining > 0 && timeRemaining <= 5 * 60 * 1000;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Channel Name */}
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-gray-800">
              # {channel.name}
            </h1>
          </div>

          {/* Actions and Timer */}
          <div className="flex items-center space-x-4">
            {/* Add User Button */}
            {onInvitePeople && (
              <button
                onClick={onInvitePeople}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            )}

            {/* Settings Button */}
            {onChannelSettings && (
              <button
                onClick={onChannelSettings}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            )}

            {/* Timer Display */}
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-sm ${
                isExpired
                  ? "bg-red-100 text-red-700"
                  : isEndingSoon
                    ? "bg-orange-100 text-orange-700 animate-pulse"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              <Clock className="w-4 h-4" />
              {isExpired ? (
                <span className="font-semibold">⛔ Time is over</span>
              ) : (
                <>
                  <span>⏳</span>
                  <span className="font-semibold">
                    {formatTimeRemaining(timeRemaining)} remaining
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Welcome to #{channel.name}!
        </h2>
        <p className="text-gray-600 mb-3">
          {channel.description ||
            `Đây là kênh chung dành cho ${channel.name}.`}
        </p>

        {!isExpired && (
          <div className="flex items-center space-x-2 text-gray-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              ⏱ Thời gian còn lại để trao đổi:{" "}
              {formatTimeRemaining(timeRemaining)}
            </span>
          </div>
        )}

        {isExpired && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">
              Thời gian trao đổi đã kết thúc. Giáo viên có thể mở lại nếu cần.
            </span>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {wsMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          ) : (
            wsMessages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.me ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.sender?.avatarUrl ? (
                    <img
                      src={message.sender.avatarUrl}
                      alt={message.sender.nickname ?? "member"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                      {(message.sender?.nickname ?? "?").charAt(0)}
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 ${message.me ? "text-right" : ""}`}>
                  <div className="flex items-baseline space-x-2 mb-1">
                    <span className="font-semibold text-gray-800 text-sm">
                      {message.sender?.nickname ?? "Anonymous"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.sender?.studentId ?? ""}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(message.createdDate).toLocaleTimeString(
                        "vi-VN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                  <div
                    className={`inline-block px-4 py-2 rounded-lg ${
                      message.me
                        ? "bg-indigo-500 text-white"
                        : "bg-white text-gray-800 border border-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    {message.attachments?.map((att) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline mt-1 block"
                      >
                        📎 {att.fileName}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {isExpired ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-center">
              <p className="text-red-700 font-medium">
                🚫 Không thể gửi tin nhắn vì đã hết thời gian trao đổi
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message #${channel.name}`}
                  disabled={!isConnected || isExpired}
                  className="w-full px-4 py-3 pr-32 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-200 disabled:cursor-not-allowed"
                />

                {/* Action Buttons */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Attach"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Upload"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || !isConnected || isExpired}
                    className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Connection Status */}
              {!isConnected && (
                <div className="flex items-center space-x-2 text-orange-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Đang kết nối lại...</span>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeBasedChannelView;
