# Document Library (Kho lưu trữ) - Implementation Guide

## Overview

This feature provides a comprehensive archive/library page for students to manage their AI-generated flashcard sets and quiz sets from the review section.

## Files Created

### 1. Types Definition

**File:** `src/types/document-library.types.ts`

Defines TypeScript interfaces for:

- `FlashcardSet`: Flashcard set metadata
- `QuizSet`: Quiz set metadata with attempt statistics
- `DocumentSet`: Union type for both
- `DocumentLibraryStats`: Statistics for the library

### 2. Mock API Service

**File:** `src/services/api/student/documentLibraryApi.ts`

Provides 3 main API functions:

1. **`getAllDocumentSets()`** - Fetches all flashcard and quiz sets combined
2. **`getFlashcardSets()`** - Fetches only flashcard sets
3. **`getQuizSets()`** - Fetches only quiz sets

Additional functions:

- `getDocumentLibraryStats()` - Get aggregated statistics
- `deleteDocumentSet(id)` - Delete a set by ID

**Mock Data Includes:**

- 5 flashcard sets (React, TypeScript, CSS, JavaScript topics)
- 4 quiz sets with various difficulty levels
- Simulated network delays (300-500ms)
- Realistic Vietnamese content

### 3. Main Page Component

**File:** `src/pages/student/document-library/MyDocumentLibraryPage.tsx`

## Features

### UI Components

1. **Header Section**
   - Archive icon and title
   - Navigation links to Quiz, Flashcards, and "Ôn tập AI" (AI Review)

2. **Statistics Cards**
   - Total sets count
   - Total flashcard sets count
   - Total quiz sets count

3. **Tabs System**
   - "Tất cả" (All) - Shows all sets
   - "Flashcards" - Filters flashcard sets only
   - "Quizzes" - Filters quiz sets only
   - Each tab displays the count

4. **Set List Cards**
   - Set icon (different for flashcard/quiz)
   - Set name
   - Creation date (formatted as relative time)
   - Badge showing count (e.g., "15 thẻ" or "10 câu")
   - View button (Eye icon)
   - Delete button (Trash icon)

### Functionality

#### Data Loading

- Automatically loads all sets on component mount
- Shows loading spinner during fetch
- Error handling with toast notifications

#### Date Formatting

Smart relative date display:

- "Hôm nay" (Today)
- "Hôm qua" (Yesterday)
- "X ngày trước" (X days ago)
- "X tuần trước" (X weeks ago)
- "X tháng trước" (X months ago)
- Full date for older items

#### Tab Filtering

Real-time filtering based on selected tab without re-fetching data.

#### Delete Functionality

- Confirmation dialog before deletion
- Optimistic UI update (removes from list immediately)
- Toast notification on success/error

#### Empty States

Shows helpful message with link to create new sets when:

- No sets exist
- Filtered tab has no items

### State Management

- `tab`: Current active tab (all/flashcard/quiz)
- `sets`: Array of all document sets
- `loading`: Loading state for data fetching

### Hooks Used

- `useState`: For local component state
- `useEffect`: For data loading on mount
- `useCallback`: To memoize the load function
- `useToast`: For user notifications

## Integration Points

### Required Routes

Add to your router configuration:

```tsx
<Route path="/student/document-library" element={<MyDocumentLibraryPage />} />
```

### Navigation Links

The page expects these routes to exist:

- `/` - Quiz page
- `/flashcards` - Flashcards page
- `/review` - AI Review page (where sets are created)

## Future Enhancements

### Backend Integration

Replace mock API with real endpoints:

```typescript
// Example real API implementation
export const getAllDocumentSets = async (): Promise<DocumentSet[]> => {
  const response = await axiosInstance.get(
    "/api/student/document-library/sets",
  );
  return response.data.result;
};
```

### Additional Features to Implement

1. **View/Edit Set Details**
   - Click on Eye icon to view full flashcard/quiz content
   - Edit set name and metadata

2. **Search & Filter**
   - Search by set name
   - Filter by tags
   - Filter by difficulty level
   - Sort by date, name, or count

3. **Bulk Operations**
   - Select multiple sets
   - Bulk delete
   - Bulk export

4. **Statistics Enhancement**
   - Total number of cards/questions across all sets
   - Study progress tracking
   - Performance analytics

5. **Export/Share**
   - Export sets to PDF or JSON
   - Share sets with other students
   - Duplicate sets

6. **Study Integration**
   - Launch study session directly from library
   - Continue where you left off
   - Spaced repetition scheduling

## UI Components Used

From shadcn/ui:

- `Card`, `CardContent`
- `Badge`
- `Button`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `useToast` hook

Icons from Lucide:

- `Archive`, `BookOpen`, `Layers`, `Brain`, `Clock`, `Eye`, `Trash2`

## Styling

- Fully responsive design
- Dark mode compatible (uses CSS variables)
- Tailwind CSS utility classes
- Smooth transitions and hover effects

## Accessibility

- Semantic HTML structure
- Keyboard navigation support (via UI components)
- Screen reader friendly labels
- Confirmation dialogs for destructive actions

## Error Handling

- Network error handling with user feedback
- Loading states for better UX
- Graceful fallbacks for empty states
- Console logging for debugging

## Performance Considerations

- Memoized callbacks to prevent unnecessary re-renders
- Efficient filtering (client-side, no re-fetch)
- Optimistic UI updates for delete operations
- Minimal mock data to simulate realistic loads

## Next Steps

1. **Connect to Real Backend**
   - Replace mock API with actual endpoints
   - Add authentication headers
   - Handle pagination for large datasets

2. **Add View/Edit Modals**
   - Create detail views for each set
   - Enable inline editing

3. **Implement Search**
   - Add search input component
   - Debounced search functionality

4. **Add Sorting Options**
   - Sort by date, name, popularity
   - Ascending/descending toggle

This implementation provides a solid foundation for the document library feature with room for future expansion and enhancement.
