import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getAccessToken } from "@/utils/localStorageVariables";
import "@/styles/ai-study-mode.css";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8888/api/v1";

async function summarizeExtractionFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const token = getAccessToken();
  const headers: HeadersInit = { Accept: "text/event-stream" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${BASE_URL}/ai/parser/summary`, { method: "POST", headers, body: formData });
}

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
  // Ref tracks latest summary value so stream appends after any user edits
  const summaryRef = useRef(summary);

  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onFileSelect(file.name);
      // Clear previous content and reset ref before streaming new file
      onSummaryChange("");
      summaryRef.current = "";
      setIsProcessing(true);

      const response = await summarizeExtractionFile(file);
      console.log("Response from API:", response);

      if (!response?.body) {
        throw new Error("Invalid response from server");
      }

      setIsProcessing(false);
      setIsStreaming(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setIsStreaming(false);
          break;
        }

        // Normalize CRLF → LF so split("\n\n") works regardless of gateway
        const rawText = decoder.decode(value, { stream: true });
        buffer += rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        // SSE events are delimited by double newline
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.trim()) continue;
          for (const line of event.split("\n")) {
            // Handle both "data: " (spec) and "data:" (no-space variant)
            if (!line.startsWith("data:")) continue;
            const chunk = line.startsWith("data: ") ? line.slice(6) : line.slice(5);
            // Skip keepalive empty events and [DONE] sentinel
            if (!chunk || chunk === "[DONE]") continue;
            const newText = summaryRef.current + chunk;
            summaryRef.current = newText;
            onSummaryChange(newText);
          }
        }
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setIsProcessing(false);
      setIsStreaming(false);
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
              onChange={(e) => {
                summaryRef.current = e.target.value;
                onSummaryChange(e.target.value);
              }}
              rows={textareaRows}
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
