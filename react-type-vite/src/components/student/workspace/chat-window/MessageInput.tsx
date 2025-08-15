import { useState } from "react";
import { PlusCircle, File, Gift, Smile, Send, ImagePlus } from "lucide-react";
import type {
  ChannelResponse,
  ChatMessageResponse,
} from "@/services/api/workspaceApi";

interface MessageInputProps {
  selectedChannel: ChannelResponse;
  isConnected: boolean;
  wsMessages: ChatMessageResponse[];
  wsErrors: Array<{ message: string }>;
  onSendMessage: (content: string) => void;
  onClearErrors: () => void;
}

const MessageInput = ({
  selectedChannel,
  isConnected,
  wsMessages,
  wsErrors,
  onSendMessage,
  onClearErrors,
}: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 bg-gray-900">
      <div className="relative">
        <PlusCircle className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-white" />
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Message #${selectedChannel.channelName}`}
          disabled={!isConnected}
          className="w-full px-12 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          <button
            className="text-gray-400 hover:text-white"
            title="GIF"
            disabled={!isConnected}
          >
            <Gift className="w-5 h-5" />
          </button>
          <button
            className="text-gray-400 hover:text-white"
            title="Emoji"
            disabled={!isConnected}
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            className="text-gray-400 hover:text-white"
            title="Upload file"
            disabled={!isConnected}
          >
            <File className="w-5 h-5" />
          </button>
          <button
            className="text-gray-400 hover:text-white"
            title="Upload image"
            disabled={!isConnected}
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connection and status info */}
      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="flex items-center space-x-4 text-gray-400">
          <span
            className={`flex items-center space-x-1 ${
              isConnected ? "text-green-400" : "text-red-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-400" : "bg-red-400"
              }`}
            ></div>
            <span>
              {isConnected ? "Real-time chat active" : "Connecting..."}
            </span>
          </span>
          {wsMessages.length > 0 && (
            <span className="text-blue-400">
              {
                wsMessages.filter((m) => m.channelId === selectedChannel.id)
                  .length
              }{" "}
              live messages
            </span>
          )}
        </div>
        {wsErrors.length > 0 && (
          <button
            onClick={onClearErrors}
            className="text-red-400 hover:text-red-300 underline"
          >
            Clear errors ({wsErrors.length})
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
