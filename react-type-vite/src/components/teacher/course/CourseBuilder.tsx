"use client"

import type React from "react"
import { useState } from "react"
import { produce } from "immer"
import { Button } from "@/components/ui/button"
import { PlusCircle, Save } from "lucide-react"
import AddSectionModal from "./AddSectionModal"
import SectionItem from "./SectionItem"
import type { SectionRequest } from "@/services/api/request/sectionRequest"

interface CourseBuilderProps {
  courseId: string
  sections: SectionRequest[]
  onSectionsChange: (sections: SectionRequest[]) => void
  onBack: () => void
}

// Utility function for reordering arrays (drag & drop)
const reorderArray = <T,>(array: T[], fromIndex: number, toIndex: number): T[] => {
  const newArray = [...array]
  const [movedItem] = newArray.splice(fromIndex, 1)
  newArray.splice(toIndex, 0, movedItem)
  return newArray
}

const CourseBuilder: React.FC<CourseBuilderProps> = ({ courseId, sections, onSectionsChange, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAddSection = (sectionData: Omit<SectionRequest, "id">) => {
    const newSection: SectionRequest = {
      ...sectionData,
      id: sectionData.courseId || Date.now(), // Use API-provided ID if available
      courseId: sectionData.courseId || Number.parseInt(courseId.replace("mock_id_", "")),
      lessons: sectionData.lessons || [],
      quizzes: sectionData.quizzes || [],
    }
    onSectionsChange(
      produce(sections, (draft) => {
        draft.push(newSection)
      }),
    )
  }

  const handleUpdateSection = (updatedSection: SectionRequest) => {
    onSectionsChange(
      produce(sections, (draft) => {
        const index = draft.findIndex((s) => s.id === updatedSection.id)
        if (index !== -1) {
          draft[index] = updatedSection
        }
      }),
    )
  }

  const handleDeleteSection = (sectionId?: number) => {
    if (!sectionId) return
    onSectionsChange(sections.filter((s) => s.id !== sectionId))
  }

  // New handler for drag & drop reordering of sections
  const handleSectionReorder = (fromIndex: number, toIndex: number) => {
    const reorderedSections = reorderArray(sections, fromIndex, toIndex)
    onSectionsChange(reorderedSections)
  }

  const handleSaveCourse = () => {
    // TODO: Final API call to save the entire course object
    console.log("Saving final course structure:", sections)
    alert("Course structure saved to console!")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Step 2: Course Builder</h2>
          <p className="text-muted-foreground">
            Structure your course content by adding sections, lessons, and quizzes.
            <br />
            <span className="text-sm text-blue-600">💡 Drag sections to reorder them</span>
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Section
        </Button>
      </div>

      <div className="space-y-4">
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <SectionItem
              key={section.id}
              section={section}
              index={index} // Required for drag & drop
              courseId={courseId}
              onUpdate={handleUpdateSection}
              onDelete={handleDeleteSection}
              onReorder={handleSectionReorder} // Required for drag & drop
            />
          ))
        ) : (
          <div className="text-center py-12 border-dashed border-2 rounded-lg bg-card">
            <h3 className="text-lg font-medium">Your course has no content yet.</h3>
            <p className="text-muted-foreground mt-1">Add your first section to begin building your course.</p>
          </div>
        )}
      </div>

      <AddSectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSection={handleAddSection}
        courseId={courseId}
      />

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          Back to Course Info
        </Button>
        <Button size="lg" onClick={handleSaveCourse}>
          <Save className="mr-2 h-4 w-4" />
          Save & Publish
        </Button>
      </div>
    </div>
  )
}

export default CourseBuilder
