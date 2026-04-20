import { FileText, Download } from "lucide-react";
import type { AttachmentResponse } from "@/types/chat.types";

interface FileCardProps {
  attachment: AttachmentResponse;
}

const FileCard = ({ attachment }: FileCardProps) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg border border-gray-600 max-w-sm">
      <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
        <FileText className="w-6 h-6 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {attachment.fileName || "Unknown file"}
        </p>
        {attachment.fileSize && (
          <p className="text-gray-400 text-xs">
            {formatFileSize(attachment.fileSize)}
          </p>
        )}
      </div>
      {attachment.fileUrl && (
        <a
          href={attachment.fileUrl}
          download={attachment.fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
          title="Tải về"
        >
          <Download className="w-4 h-4" />
        </a>
      )}
    </div>
  );
};

export default FileCard;
