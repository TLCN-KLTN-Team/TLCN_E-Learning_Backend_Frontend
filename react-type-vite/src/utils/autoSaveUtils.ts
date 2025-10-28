/**
 * Auto-save utilities for course builder
 * Handles debouncing and local storage persistence
 */

import type { SectionResponse } from "@/services/api/response/sectionResponse"

const AUTOSAVE_KEY = "courseBuilder_autosave"
const AUTOSAVE_TIMESTAMP_KEY = "courseBuilder_autosave_timestamp"

export interface AutoSaveData {
  courseId: string
  sections: SectionResponse[]
  timestamp: number
}

/**
 * Save sections to local storage
 */
export const saveToLocalStorage = (courseId: string, sections: SectionResponse[]): void => {
  try {
    const data: AutoSaveData = {
      courseId,
      sections,
      timestamp: Date.now(),
    }
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data))
    localStorage.setItem(AUTOSAVE_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.error("[v0] Failed to save to local storage:", error)
  }
}

/**
 * Load sections from local storage
 */
export const loadFromLocalStorage = (): AutoSaveData | null => {
  try {
    const data = localStorage.getItem(AUTOSAVE_KEY)
    if (!data) return null

    const parsed = JSON.parse(data) as AutoSaveData
    return parsed
  } catch (error) {
    console.error("[v0] Failed to load from local storage:", error)
    return null
  }
}

/**
 * Clear auto-save data from local storage
 */
export const clearAutoSave = (): void => {
  try {
    localStorage.removeItem(AUTOSAVE_KEY)
    localStorage.removeItem(AUTOSAVE_TIMESTAMP_KEY)
  } catch (error) {
    console.error("[v0] Failed to clear auto-save:", error)
  }
}

/**
 * Get the timestamp of the last auto-save
 */
export const getLastAutoSaveTime = (): number | null => {
  try {
    const timestamp = localStorage.getItem(AUTOSAVE_TIMESTAMP_KEY)
    return timestamp ? Number.parseInt(timestamp) : null
  } catch (error) {
    console.error("[v0] Failed to get auto-save timestamp:", error)
    return null
  }
}

/**
 * Create a debounced auto-save function
 */
export const createAutoSaveDebounce = (
  courseId: string,
  onSave: (courseId: string, sections: SectionResponse[]) => void,
  delayMs = 3000,
) => {
  let timeoutId: NodeJS.Timeout | null = null

  return (sections: SectionResponse[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      saveToLocalStorage(courseId, sections)
      onSave(courseId, sections)
    }, delayMs)
  }
}
