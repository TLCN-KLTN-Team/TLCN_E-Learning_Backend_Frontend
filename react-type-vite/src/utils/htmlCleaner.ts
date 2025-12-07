/**
 * Utility to clean HTML content from TinyMCE before saving to database
 * Removes tracking attributes and unnecessary metadata
 */

export const cleanHTMLForStorage = (html: string): string => {
  if (!html) return "";

  let cleaned = html;

  // Remove all data-* attributes (data-start, data-end, data-mce-*, etc.)
  cleaned = cleaned.replace(/\s*data-[a-z-]+="[^"]*"/gi, '');
  
  // Remove contenteditable attributes
  cleaned = cleaned.replace(/\s*contenteditable="[^"]*"/gi, '');
  
  // Remove mce-* classes
  cleaned = cleaned.replace(/\s*class="[^"]*mce-[^"]*"/gi, '');
  
  // Remove empty class attributes
  cleaned = cleaned.replace(/\s*class=""\s*/gi, ' ');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  
  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
};

/**
 * Decode HTML entities for display (used by MarkdownRenderer)
 */
export const decodeHTMLEntities = (html: string): string => {
  if (!html) return "";
  
  // Create temporary textarea to decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
};
