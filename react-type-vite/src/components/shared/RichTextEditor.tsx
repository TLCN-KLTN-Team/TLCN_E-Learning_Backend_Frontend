import React, { useRef } from "react";
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Nhập nội dung bài học...",
  disabled = false,
  className = "",
  minHeight = "400px"
}) => {
  const editorRef = useRef(null);

  // Clean HTML by removing tracking attributes
  const cleanHTML = (html: string): string => {
    if (!html) return html;
    
    // Remove data-start, data-end, and other tracking attributes
    return html
      .replace(/\s*data-start="[^"]*"/g, '')
      .replace(/\s*data-end="[^"]*"/g, '')
      .replace(/\s*data-mce-[^=]*="[^"]*"/g, '')
      .replace(/\s*contenteditable="[^"]*"/g, '')
      .trim();
  };

  const handleEditorChange = (content: string) => {
    // Clean the content before saving
    const cleanedContent = cleanHTML(content);
    onChange(cleanedContent);
  };

  return (
    <div className={className}>
      <Editor
        apiKey={import.meta.env.VITE_API_KEY_TINY}
        value={value}
        onInit={(_evt, editor) => {
          editorRef.current = editor as any;
        }}
        onEditorChange={handleEditorChange}
        disabled={disabled}
        init={{
          height: minHeight,
          menubar: 'file edit view insert format tools table help',
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'codesample', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | link image media | codesample code fullscreen | help',
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
              font-size: 14px; 
              line-height: 1.6;
              padding: 10px;
            }
          `,
          placeholder: placeholder,
          branding: false,
          promotion: false,
          toolbar_mode: 'sliding',
          block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4',
          font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
          language: 'vi',
          // Disable tracking and collaboration features
          track_changes: false,
          collaborative_editing: false,
          // Clean paste
          paste_as_text: false,
          paste_data_images: true,
          paste_remove_styles_if_webkit: false,
          paste_webkit_styles: 'all',
          // Image upload
          images_upload_handler: (blobInfo: any) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve(reader.result as string);
            };
            reader.onerror = () => reject('Image upload failed');
            reader.readAsDataURL(blobInfo.blob());
          }),
          // Extended valid elements to prevent stripping
          extended_valid_elements: 'span[*],div[*],p[*],strong[*],em[*],ul[*],ol[*],li[*],h1[*],h2[*],h3[*],h4[*],br[*]',
          // Setup
          setup: (editor: any) => {
            editor.on('init', () => {
              if (disabled) {
                editor.mode.set('readonly');
              }
            });
            
            // Remove tracking attributes on paste
            editor.on('PastePostProcess', (e: any) => {
              e.node.innerHTML = cleanHTML(e.node.innerHTML);
            });
          }
        }}
      />
    </div>
  );
};

export default RichTextEditor;
