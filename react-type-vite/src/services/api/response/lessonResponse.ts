interface LessonResponse {
  id: number
  sectionId: number
  sectionName: string
  title: string
  description: string
  content: string
  attachments: string[]
  videoUrl: string
  numberItem: number
  isFreeLesson: boolean
  isPublished?: boolean;
  createdAt: Date
  updateAt: Date
}

export type { LessonResponse };