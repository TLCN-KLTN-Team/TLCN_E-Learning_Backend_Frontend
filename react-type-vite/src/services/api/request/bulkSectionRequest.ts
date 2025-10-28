import type { SectionRequest } from "./sectionRequest"

export interface BulkSectionRequest {
  courseId: number
  sections: SectionRequest[]
}
