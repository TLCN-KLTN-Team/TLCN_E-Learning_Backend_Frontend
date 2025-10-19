

// --- Course Detail ---
export interface CourseTypeRequest {
  id?: number;
  courseTypeName: string;
}


export interface FileUploadRequest {
  file: File;
  type: 'lesson' | 'question';
  targetId?: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}