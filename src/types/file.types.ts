export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string; // For images
  file?: File; // For other files
  preview: string; // Base64 or URL for preview
}

export interface AttachmentUploadResponse {
  success: boolean;
  message: string;
  attachmentId?: string; // Optional, if the upload was successful
  messageId?: string; // Optional, if the upload was part of a message
  fileUrl?: string; // Optional, if the upload was successful
}
