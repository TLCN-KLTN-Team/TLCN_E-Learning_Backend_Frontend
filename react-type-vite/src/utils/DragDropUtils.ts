// Utility functions for drag and drop operations

class DragDropUtils {
  /**
   * Reorders an array by moving an item from one index to another
   * @param array - The array to reorder
   * @param fromIndex - The current index of the item to move
   * @param toIndex - The target index where the item should be moved
   * @returns A new array with the item moved to the target position
   */
  static reorderArray = <T>(array: T[], fromIndex: number, toIndex: number): T[] => {
    if (fromIndex === toIndex) return array;
    if (fromIndex < 0 || fromIndex >= array.length) return array;
    if (toIndex < 0 || toIndex >= array.length) return array;

    const newArray = [...array];
    const [movedItem] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, movedItem);
    return newArray;
  };

  /**
   * Updates the orderIndex or numberItem property of items after reordering
   * @param items - Array of items with order properties
   * @param orderProperty - The property name to update ('orderIndex' or 'numberItem')
   * @returns Updated array with corrected order values
   */
  static updateOrderIndexes = <T extends Record<string, any>>(
    items: T[], 
    orderProperty: keyof T = 'orderIndex' as keyof T
  ): T[] => {
    return items.map((item, index) => ({
      ...item,
      [orderProperty]: index + 1
    }));
  };

  /**
   * Validates if drag and drop operation is valid
   * @param fromIndex - Source index
   * @param toIndex - Target index
   * @param arrayLength - Length of the array
   * @returns Boolean indicating if the operation is valid
   */
  static isValidReorder = (fromIndex: number, toIndex: number, arrayLength: number): boolean => {
    return (
      fromIndex >= 0 && 
      fromIndex < arrayLength && 
      toIndex >= 0 && 
      toIndex < arrayLength && 
      fromIndex !== toIndex
    );
  };

  /**
   * Handles the standard drag start event
   * @param e - Drag event
   * @param index - Index of the item being dragged
   * @param setDraggedIndex - State setter for the dragged index
   */
  static handleDragStart = (
    e: React.DragEvent,
    index: number,
    setDraggedIndex: (index: number | null) => void
  ) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  /**
   * Handles the standard drag over event
   * @param e - Drag event
   */
  static handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * Handles the standard drop event
   * @param e - Drag event
   * @param targetIndex - Index of the drop target
   * @param onReorder - Callback function to handle reordering
   * @param setDraggedIndex - State setter for the dragged index
   */
  static handleDrop = (
    e: React.DragEvent,
    targetIndex: number,
    onReorder: (fromIndex: number, toIndex: number) => void,
    setDraggedIndex: (index: number | null) => void
  ) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (!isNaN(fromIndex) && fromIndex !== targetIndex) {
      onReorder(fromIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  /**
   * Gets CSS classes for drag states
   * @param isDragging - Whether the item is currently being dragged
   * @param isDragOver - Whether another item is being dragged over this one
   * @returns Object with CSS class names
   */
  static getDragClasses = (isDragging: boolean, isDragOver: boolean) => {
    return {
      dragging: isDragging ? 'opacity-50' : '',
      dragOver: isDragOver ? 'border-2 border-blue-300 bg-blue-50' : '',
      combined: `transition-all ${isDragging ? 'opacity-50' : ''} ${
        isDragOver ? 'border-2 border-blue-300 bg-blue-50' : ''
      }`
    };
  };
}

export default DragDropUtils;