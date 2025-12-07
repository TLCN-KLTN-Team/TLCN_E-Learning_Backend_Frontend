import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  // Decode HTML entities step by step
  const decodeAndClean = (html: string): string => {
    if (!html) return "";
    
    // Step 1: Decode HTML entities using textarea trick
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    const decoded = textarea.value;
    
    // Step 2: Clean tracking attributes from the decoded HTML
    const cleaned = decoded
      .replace(/\s*data-start="[^"]*"/gi, '')
      .replace(/\s*data-end="[^"]*"/gi, '')
      .replace(/\s*data-mce-[^=]*="[^"]*"/gi, '');
    
    return cleaned;
  };

  const processedContent = decodeAndClean(content);

  return (
    <div 
      className={`lesson-content ${className}`}
      style={{
        fontSize: '15px',
        lineHeight: '1.8',
        color: '#374151'
      }}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};

export default MarkdownRenderer;
