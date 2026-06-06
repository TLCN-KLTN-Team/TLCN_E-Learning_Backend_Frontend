import { useRef, useState, type ChangeEvent } from "react";
import {
  PlusCircle,
  Gift,
  Smile,
  Send,
  ImagePlus,
  FilePlus,
  FileText,
  Lock,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  ChannelPhase,
  type ChannelResponse,
  type ChatMessageResponse,
} from "@/types/chat.types";
import type { FileItem } from "@/types/file.types";
import { derivePhase } from "@/utils/channelPhase";

interface MessageInputProps {
  selectedChannel: ChannelResponse;
  isConnected: boolean;
  wsMessages: ChatMessageResponse[];
  wsErrors: Array<{ message: string }>;
  onSendMessage: (content: string, files: FileItem[]) => void;
  onClearErrors: () => void;
}

const MessageInput = ({
  selectedChannel,
  isConnected,
  onSendMessage,
}: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [isMultiline, setIsMultiline] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setNewMessage(textarea.value);

    // Reset height to auto to get correct scrollHeight
    textarea.style.height = "auto";
    // Set height based on scrollHeight, with max height limit
    const maxHeight = 200; // Maximum height in pixels
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;

    // Check if multiline (height > minimum single line height)
    setIsMultiline(newHeight > 48);
  };

  // UC-41: derive phase từ deadline. Channel không phải bài tập (no submissionDeadline) coi là OPEN.
  const phase = derivePhase(
    selectedChannel.submissionDeadline,
    selectedChannel.crossReviewDeadline,
    selectedChannel.allowCrossReview,
  );
  const isLocked = phase === ChannelPhase.LOCKED;
  const lockMessage = "Kênh đã hết hạn. Không thể gửi tin nhắn hoặc upload file.";

  const handleSendMessage = () => {
    const hasMessage = newMessage.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;

    if (!hasMessage && !hasFiles) return;
    if (!isConnected) {
      toast.warning("Chưa kết nối đến server. Vui lòng đợi...");
      return;
    }
    if (isLocked) {
      toast.warning(lockMessage);
      return;
    }

    onSendMessage(newMessage.trim(), selectedFiles);

    // Clear input state immediately (optimistic)
    setNewMessage("");
    setSelectedFiles([]);
    setIsMultiline(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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

  if (isLocked) {
    return (
      <div className="p-4 bg-gray-900 border-t border-gray-700">
        <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-300">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{lockMessage}</span>
        </div>
      </div>
    );
  }

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
        type="file"
        ref={fileInputRef}
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
      <div className="flex items-center gap-2 rounded-lg">
        {/* Left icon */}
        <div
          className={`flex-shrink-0 ${isMultiline ? "self-end" : "self-center"}`}
        >
          <PlusCircle className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={handleTextareaChange}
          onKeyPress={handleKeyPress}
          placeholder={`Message #${selectedChannel.name}`}
          disabled={!isConnected}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-gray-400 disabled:cursor-not-allowed resize-none overflow-y-auto border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 hover:border-0 p-0 leading-6"
          style={{ minHeight: "24px", maxHeight: "176px" }}
        />

        {/* Right icons */}
        <div
          className={`flex-shrink-0 flex items-center gap-2 ${
            isMultiline ? "self-end" : "self-center"
          }`}
        >
          <button
            className="text-gray-400 hover:text-white transition-colors"
            title="GIF"
            disabled={!isConnected}
          >
            <Gift className="w-5 h-5" />
          </button>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            title="Emoji"
            disabled={!isConnected}
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
            title="Upload file"
            disabled={!isConnected}
          >
            <FilePlus className="w-5 h-5" />
          </button>
          <button
            onClick={() => imageInputRef.current?.click()}
            className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
            title="Upload image"
            disabled={!isConnected}
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={
              (!newMessage.trim() && selectedFiles.length === 0) || !isConnected
            }
            className={`${
              selectedFiles.length > 0
                ? "bg-green-500 hover:bg-green-600"
                : "bg-blue-500 hover:bg-blue-600"
            } disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors`}
            title={
              selectedFiles.length > 0
                ? `Send message with ${selectedFiles.length} files`
                : "Send message"
            }
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
