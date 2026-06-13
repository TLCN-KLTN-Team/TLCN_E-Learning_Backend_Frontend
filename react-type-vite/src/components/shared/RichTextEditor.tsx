import React, { useRef } from "react";
import { Editor } from '@tinymce/tinymce-react';
import axiosInstance from "@/services/api/httpClient/axiosInstance";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
  /**
   * Backend endpoint to upload images (relative to VITE_BASE_URL).
   * Defaults to the forum image upload endpoint.
   * The endpoint must accept multipart/form-data with field "file"
   * and return JSON { location: "<url>" } (TinyMCE format).
   */
  uploadEndpoint?: string;
}

const DEFAULT_UPLOAD_ENDPOINT = "/chat/forum/upload-image";

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  disabled = false,
  className = "",
  minHeight = "400px",
  uploadEndpoint = DEFAULT_UPLOAD_ENDPOINT,
}) => {
  const editorRef = useRef(null);

  // Clean HTML by removing tracking attributes
  const cleanHTML = (html: string): string => {
    if (!html) return html;
    return html
      .replace(/\s*data-start="[^"]*"/g, '')
      .replace(/\s*data-end="[^"]*"/g, '')
      .replace(/\s*data-mce-[^=]*="[^"]*"/g, '')
      .replace(/\s*contenteditable="[^"]*"/g, '')
      .trim();
  };

  const handleEditorChange = (content: string) => {
    const cleanedContent = cleanHTML(content);
    onChange(cleanedContent);
  };

  /**
   * TinyMCE images_upload_handler — uploads to our backend via axiosInstance
   * so the Authorization header is included automatically.
   */
  const handleImageUpload = (blobInfo: any): Promise<string> =>
    new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", blobInfo.blob(), blobInfo.filename());

      axiosInstance
        .post<{ location: string; url?: string }>(uploadEndpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          // TinyMCE expects the resolved string to be the image URL
          const url = res.data.location || res.data.url;
          if (url) {
            resolve(url);
          } else {
            reject("Phản hồi upload không hợp lệ.");
          }
        })
        .catch((err) => {
          console.error("Image upload failed", err);
          reject("Tải ảnh lên thất bại. Vui lòng thử lại.");
        });
    });

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
          toolbar:
            'undo redo | blocks | ' +
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
            img { max-width: 100%; height: auto; border-radius: 6px; }
          `,
          placeholder: placeholder,
          branding: false,
          promotion: false,
          toolbar_mode: 'sliding',
          block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4',
          font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
          language: 'vi',
          track_changes: false,
          collaborative_editing: false,
          paste_as_text: false,
          paste_data_images: true,
          // Real server upload — replaces the old base64 fallback
          images_upload_handler: handleImageUpload,
          // Allow dragging images directly into the editor
          automatic_uploads: true,
          file_picker_types: 'image',
          extended_valid_elements: 'span[*],div[*],p[*],strong[*],em[*],ul[*],ol[*],li[*],h1[*],h2[*],h3[*],h4[*],br[*],img[*]',
          setup: (editor: any) => {
            editor.on('init', () => {
              if (disabled) {
                editor.mode.set('readonly');
              }
            });
            editor.on('PastePostProcess', (e: any) => {
              // Remove inline styles that might make pasted text look blurry or have wrong colors
              const allElements = e.node.querySelectorAll('*');
              allElements.forEach((el: any) => {
                el.style.color = '';
                el.style.backgroundColor = '';
                el.style.fontFamily = '';
                el.style.fontSize = '';
                el.style.fontWeight = '';
                el.style.lineHeight = '';
                // If style attribute is empty, remove it
                if (!el.getAttribute('style')) {
                  el.removeAttribute('style');
                }
              });
              e.node.innerHTML = cleanHTML(e.node.innerHTML);
            });
          }
        }}
      />
    </div>
  );
};

export default RichTextEditor;
