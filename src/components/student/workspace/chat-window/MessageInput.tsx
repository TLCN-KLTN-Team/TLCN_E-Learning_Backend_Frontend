import { useRef, useState, type ChangeEvent } from "react";
import {
  PlusCircle,
  Gift,
  Smile,
  Send,
  ImagePlus,
  FilePlus,
  FileText,
  X,
} from "lucide-react";
import type {
  ChannelResponse,
  ChatMessageResponse,
} from "@/services/api/channelApi";

interface MessageInputProps {
  selectedChannel: ChannelResponse;
  isConnected: boolean;
  wsMessages: ChatMessageResponse[];
  wsErrors: Array<{ message: string }>;
  onSendMessage: (content: string) => void;
  onClearErrors: () => void;
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string; // For images
  file?: File; // For other files
  preview: string; // Base64 or URL for preview
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
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!isConnected) return;

    const formData = new FormData();
    formData.append("channelId", selectedChannel.id);
    formData.append("message", newMessage.trim());

    // Add files to formData
    selectedFiles.forEach((fileItem, index) => {
      formData.append(`files[${index}]`, fileItem.file || new Blob());
      formData.append(`fileTypes[${index}]`, fileItem.type);
    });

    try {
      console.log("Sending message with files:", {
        channelId: selectedChannel.id,
        message: newMessage.trim(),
        files: selectedFiles.map((f) => ({
          name: f.name,
          type: f.type,
          size: f.size,
          preview: f.preview,
        })),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      return;
    }

    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>, type: string) => {
    const files = Array.from(e.target.files || []);
    const newFiles: FileItem[] = files.map((fileItem) => ({
      file: fileItem,
      type,
      id: Math.random().toString(36).substring(7),
      name: fileItem.name,
      size: fileItem.size,
      preview: type === "image" ? URL.createObjectURL(fileItem) : "",
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = ""; // Reset input value
  };

  const removeFile = (fileId: string) => {
    const fileToRemove = selectedFiles.find((f) => f.id === fileId);
    if (fileToRemove) {
      setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
      // Revoke object URL if it's an image
      if (fileToRemove.type && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
    }
  };

  const calculateFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="p-4 bg-gray-900">
      {/* Hidden file input */}
      <input
        type="file"
        ref={imageInputRef}
        className="hidden"
        onChange={(e) => handleFileSelect(e, "image")}
        accept="image/*"
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e, "file")}
        accept="*/*"
      />

      {/* File preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {selectedFiles.map((fileItem) => (
            <div
              key={fileItem.id}
              className="relative bg-gray-800 rounded-lg p-3 flex items-center space-x-3 max-w-sm border border-gray-700"
            >
              {/* File icon/image preview */}
              <div className="flex-shrink-0">
                {fileItem.type === "image" && fileItem.preview ? (
                  <img
                    src={fileItem.preview}
                    alt={fileItem.name}
                    className="w-12 h-12 rounded object-cover border border-gray-600"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-white text-sm font-medium truncate"
                  title={fileItem.name}
                >
                  {fileItem.name}
                </p>
                <p className="text-gray-400 text-xs">
                  {calculateFileSize(fileItem.size)}
                </p>
              </div>

              {/* Remove button */}
              <button
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                onClick={() => removeFile(fileItem.id)}
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message input */}
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
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-white"
            title="Upload file"
            disabled={!isConnected}
          >
            <FilePlus className="w-5 h-5" />
          </button>
          <button
            onClick={() => imageInputRef.current?.click()}
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
