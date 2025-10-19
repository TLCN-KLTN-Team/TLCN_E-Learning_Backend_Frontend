export interface LessonRequest {
  id?: number;
  sectionId?: number;
  title: string;
  description?: string;
  content?: string;
  attachments?: string[]; // Added attachments array
  videoUrl?: string;
  numberItem?: number;
  isFreeLesson?: boolean;
  createdAt?: string;
  updateAt?: string;
}