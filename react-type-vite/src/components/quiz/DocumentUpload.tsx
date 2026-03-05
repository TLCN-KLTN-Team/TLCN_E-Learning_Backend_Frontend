import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import QuizService from "@/services/api/teacher/quizApi";
import "@/styles/ai-study-mode.css";

interface Props {
  fileName: string;
  summary: string;
  onFileSelect: (fileName: string) => void;
  onSummaryChange: (summary: string) => void;
  // Customization props
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  showTextarea?: boolean;
  textareaLabel?: string;
  textareaRows?: number;
  acceptFiles?: string;
}

export default function DocumentUpload({
  fileName,
  summary,
  onFileSelect,
  onSummaryChange,
  title = "Thông tin bổ sung",
  description = "Upload tài liệu để AI trích xuất nội dung",
  icon,
  showTextarea = true,
  textareaLabel = "Nội dung trích xuất (có thể chỉnh sửa)",
  textareaRows = 6,
  acceptFiles = ".pdf,.doc,.docx,.txt",
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Display file name immediately
        onFileSelect(file.name);
        setIsProcessing(true);

        // Call API to get streaming response
        const response = await QuizService.summarizeExtractionFile(file);
        console.log("Response from API:", response);

        if (!response || !response.body) {
          throw new Error("Invalid response from server");
        }

        setIsProcessing(false);
        setIsStreaming(true);

        // Process streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setIsStreaming(false);
            break;
          }

          // Decode the chunk and accumulate
          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          // Update UI with accumulated text
          onSummaryChange(accumulatedText);
        }
      } catch (error) {
        console.error("Error processing file:", error);
        setIsProcessing(false);
        setIsStreaming(false);
      }
    }
  };

  return (
    <div className="ai-section-card space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="ai-header-icon">
          {icon || <Upload className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <label
        className={`ai-upload-area ${isProcessing ? "pointer-events-none" : ""} ${fileName && !isProcessing ? "uploaded" : ""}`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm font-medium text-primary">
              Đang xử lý tài liệu...
            </span>
            <span className="text-xs text-muted-foreground">Vui lòng đợi</span>
          </>
        ) : fileName ? (
          <>
            <CheckCircle className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {fileName}
            </span>
            <span className="text-xs text-muted-foreground">
              ✓ Đã chọn file — nhấn để đổi
            </span>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Chọn tài liệu
            </span>
            <span className="text-xs text-muted-foreground">
              {acceptFiles.replace(/\./g, "").toUpperCase()}
            </span>
          </>
        )}
        <input
          type="file"
          accept={acceptFiles}
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />
      </label>

      {/* Textarea for editing extracted content */}
      {showTextarea && (summary || isStreaming) && (
        <div className="space-y-2 animate-slide-up">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {isStreaming ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="text-primary">Đang tạo tóm tắt...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
                <span>{textareaLabel}</span>
              </>
            )}
          </label>
          <div className="relative">
            <textarea
              value={summary}
              onChange={(e) => onSummaryChange(e.target.value)}
              rows={textareaRows}
              disabled={isStreaming}
              className={`w-full rounded-lg border-2 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 resize-y transition-all duration-300 ${
                isStreaming
                  ? "border-primary/50 opacity-90"
                  : "border-primary focus:ring-primary/20 hover:border-primary/80"
              }`}
            />
            {isStreaming && summary && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1">
                <span className="inline-block w-1 h-4 bg-primary animate-pulse" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
