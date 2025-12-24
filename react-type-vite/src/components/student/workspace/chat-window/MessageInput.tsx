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
import { toast } from "react-toastify";
import type { ChannelResponse, ChatMessageResponse } from "@/types/chat.types";
import type { FileItem } from "@/types/file.types";
import { uploadMultipleFiles } from "@/services/api/fileUploadApi";

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
  onSendMessage,
}: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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

  const uploadFilesForMessage = async () => {
    setIsUploading(true);
    console.log("📤 Starting file upload...");

    const formData = new FormData();
    selectedFiles.forEach((fileItem) => {
      formData.append("files", fileItem.file ? fileItem.file : new Blob());
    });
    formData.append("channelId", selectedChannel.id);

    try {
      const uploadAtachmentsResults = await uploadMultipleFiles(formData);
      console.log("✅ File upload completed:", uploadAtachmentsResults);
      toast.success(`Đã tải lên ${selectedFiles.length} tệp thành công!`);
    } catch (error) {
      console.error("❌ File upload failed:", error);
      toast.error("Không thể tải lên tệp. Vui lòng thử lại.");
      throw new Error("Failed to upload files: " + error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    const hasMessage = newMessage.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;

    // Validate input
    if (!hasMessage && !hasFiles) return;
    if (!isConnected) {
      toast.warning("Chưa kết nối đến server. Vui lòng đợi...");
      return;
    }

    try {
      if (hasMessage && hasFiles) {
        // Send both message and files
        onSendMessage(newMessage.trim());
        // Upload files after sending message
        await uploadFilesForMessage();
      } else if (hasMessage && !hasFiles) {
        // Send only message
        onSendMessage(newMessage.trim());
      } else if (!hasMessage && hasFiles) {
        // Upload only files
        await uploadFilesForMessage();
      }

      // Clear input and files after successful operation
      setNewMessage("");
      setSelectedFiles([]);
      setIsMultiline(false);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      console.log("✅ Operation completed successfully");
    } catch (error) {
      console.error("❌ Error in handleSendMessage:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
      // Don't clear inputs if there was an error
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

    console.log("Selected files:", newFiles);
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
      <div className="flex items-start gap-2 bg-gray-700 rounded-lg p-3">
        {/* Left icon */}
        <div className={`flex-shrink-0 ${isMultiline ? "pt-0.5" : ""}`}>
          <PlusCircle className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={handleTextareaChange}
          onKeyPress={handleKeyPress}
          placeholder={`Message #${selectedChannel.channelName}`}
          disabled={!isConnected}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto min-h-[24px] max-h-[176px] outline-none border-none focus:outline-none focus:ring-0"
        />

        {/* Right icons */}
        <div
          className={`flex-shrink-0 flex items-center gap-2 ${
            isMultiline ? "pt-0.5" : ""
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
            disabled={!isConnected || isUploading}
          >
            <FilePlus className="w-5 h-5" />
          </button>
          <button
            onClick={() => imageInputRef.current?.click()}
            className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
            title="Upload image"
            disabled={!isConnected || isUploading}
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={
              (!newMessage.trim() && selectedFiles.length === 0) ||
              !isConnected ||
              isUploading
            }
            className={`${
              selectedFiles.length > 0
                ? "bg-green-500 hover:bg-green-600"
                : "bg-blue-500 hover:bg-blue-600"
            } disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors`}
            title={
              isUploading
                ? "Uploading files..."
                : selectedFiles.length > 0
                ? `Send message with ${selectedFiles.length} files`
                : "Send message"
            }
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Upload status */}
      {isUploading && (
        <div className="mt-2 flex items-center space-x-2 text-xs text-blue-400">
          <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          <span>Uploading {selectedFiles.length} files...</span>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
