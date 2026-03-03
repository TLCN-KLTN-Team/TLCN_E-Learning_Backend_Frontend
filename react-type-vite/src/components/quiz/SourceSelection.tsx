import {
  FileText,
  Lightbulb,
  Upload,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";

import QuizService from "@/services/api/teacher/quizApi";

interface Props {
  sourceType: "document" | "topic";
  summary: string;
  topic: string;
  fileName: string;
  onSourceTypeChange: (type: "document" | "topic") => void;
  onSummaryChange: (summary: string) => void;
  onTopicChange: (topic: string) => void;
  onFileSelect: (fileName: string) => void;
}

export default function SourceSelection({
  sourceType,
  summary,
  topic,
  fileName,
  onSourceTypeChange,
  onSummaryChange,
  onTopicChange,
  onFileSelect,
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
    <div className="section-card space-y-5">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Lightbulb className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Nguồn dữ liệu</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(["document", "topic"] as const).map((type) => {
          const isSelected = sourceType === type;
          const hasContent = type === "document" ? fileName : topic;

          return (
            <button
              key={type}
              onClick={() => onSourceTypeChange(type)}
              className={`group flex items-center gap-3 rounded-lg border-2 p-4 text-left transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                isSelected && hasContent
                  ? "border-green-500 bg-green-50 dark:bg-green-950/30 shadow-lg shadow-green-500/20"
                  : isSelected
                    ? "border-primary bg-primary/10 shadow-md shadow-primary/10 animate-pulse-once"
                    : "border-border hover:border-primary/40 hover:shadow-md"
              }`}
            >
              {type === "document" ? (
                <FileText
                  className={`h-5 w-5 shrink-0 transition-all duration-300 ${
                    isSelected && hasContent
                      ? "text-green-600 dark:text-green-400 animate-bounce-once"
                      : isSelected
                        ? "text-primary scale-110"
                        : "text-muted-foreground group-hover:scale-110"
                  }`}
                />
              ) : (
                <Lightbulb
                  className={`h-5 w-5 shrink-0 transition-all duration-300 ${
                    isSelected && hasContent
                      ? "text-green-600 dark:text-green-400 animate-bounce-once"
                      : isSelected
                        ? "text-primary scale-110"
                        : "text-muted-foreground group-hover:scale-110"
                  }`}
                />
              )}
              <div>
                <p
                  className={`font-medium transition-colors duration-300 ${
                    isSelected && hasContent
                      ? "text-green-700 dark:text-green-300"
                      : "text-foreground"
                  }`}
                >
                  {type === "document" ? "Từ tài liệu" : "Từ chủ đề"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {type === "document"
                    ? "Upload PDF, DOC, DOCX"
                    : "Nhập chủ đề bất kỳ"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {sourceType === "document" && (
        <div className="space-y-3 animate-slide-up">
          <label
            className={`group flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transform transition-all duration-300 hover:scale-[1.01] ${
              isProcessing
                ? "border-primary bg-primary/10 pointer-events-none"
                : fileName
                  ? "border-green-500 bg-green-50 dark:bg-green-950/30 hover:border-green-600 shadow-lg shadow-green-500/10"
                  : "border-primary/30 bg-secondary/50 hover:border-primary/60 hover:bg-secondary/70"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">
                  Đang xử lý tài liệu...
                </span>
                <span className="text-xs text-muted-foreground">
                  Vui lòng đợi
                </span>
              </>
            ) : fileName ? (
              <>
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 animate-bounce-once" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {fileName}
                </span>
                <span className="text-xs text-green-600/70 dark:text-green-400/70">
                  ✓ Đã chọn file
                </span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
                <span className="text-sm font-medium text-foreground">
                  Chọn tài liệu
                </span>
                <span className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX
                </span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />
          </label>

          {(summary || isStreaming) && (
            <div className="space-y-2 animate-slide-up">
              <label className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                {isStreaming ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang tạo tóm tắt...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Tóm tắt nội dung (có thể chỉnh sửa)</span>
                  </>
                )}
              </label>
              <div className="relative">
                <textarea
                  value={summary}
                  onChange={(e) => onSummaryChange(e.target.value)}
                  rows={6}
                  disabled={isStreaming}
                  className={`w-full rounded-lg border-2 border-green-500 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none transition-all duration-300 hover:border-green-600 ${
                    isStreaming ? "opacity-90" : ""
                  }`}
                />
                {isStreaming && !summary && (
                  <div className="absolute top-3 left-3 flex items-center gap-0.5 text-muted-foreground text-sm">
                    <span className="dot-bounce">.</span>
                    <span className="dot-bounce">.</span>
                    <span className="dot-bounce">.</span>
                  </div>
                )}
                {isStreaming && summary && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1">
                    <span className="inline-block w-1 h-4 bg-primary animate-blink-cursor" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {sourceType === "topic" && (
        <div className="animate-slide-up">
          <label
            className={`text-sm font-medium transition-colors duration-300 flex items-center gap-1 ${
              topic ? "text-green-700 dark:text-green-300" : "text-foreground"
            }`}
          >
            {topic && (
              <CheckCircle className="h-3.5 w-3.5 animate-bounce-once" />
            )}
            Chủ đề
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="Ví dụ: Lập trình web với React..."
            className={`mt-1.5 w-full rounded-lg border-2 bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all duration-300 ${
              topic
                ? "border-green-500 text-green-700 dark:text-green-300 focus:ring-green-500/20 shadow-sm shadow-green-500/10"
                : "border-border text-foreground focus:ring-ring hover:border-primary/40"
            }`}
          />
        </div>
      )}
    </div>
  );
}
