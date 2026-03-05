import { FileText, Lightbulb } from "lucide-react";
import DocumentUpload from "./DocumentUpload";
import TopicInput from "./TopicInput";
import "@/styles/ai-study-mode.css";

interface Props {
  sourceType: "document" | "topic";
  summary: string;
  topic: string;
  fileName: string;
  onSourceTypeChange: (type: "document" | "topic") => void;
  onSummaryChange: (summary: string) => void;
  onTopicChange: (topic: string) => void;
  onFileSelect: (fileName: string) => void;
  // Optional customization props
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  documentLabel?: string;
  topicLabel?: string;
  hideTopicOption?: boolean;
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
  title = "Nguồn dữ liệu",
  description,
  icon,
  documentLabel = "Từ tài liệu",
  topicLabel = "Từ chủ đề",
  hideTopicOption = false,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Title and Source Type Selector */}
      <div className="ai-section-card">
        <div className="flex items-center gap-2">
          <div className="ai-header-icon">
            {icon || <Lightbulb className="h-4 w-4" />}
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

        {/* Source Type Selector */}
        {!hideTopicOption && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {(["document", "topic"] as const).map((type) => {
              const isSelected = sourceType === type;
              const hasContent = type === "document" ? fileName : topic;

              return (
                <button
                  key={type}
                  onClick={() => onSourceTypeChange(type)}
                  className={`group flex items-center gap-3 rounded-lg border-2 p-4 text-left transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected && hasContent
                      ? "border-primary bg-primary/10 shadow-lg"
                      : isSelected
                        ? "border-primary bg-primary/5 shadow-md animate-pulse-once"
                        : "border-border hover:border-primary/40 hover:shadow-md"
                  }`}
                >
                  {type === "document" ? (
                    <FileText
                      className={`h-5 w-5 shrink-0 transition-all duration-300 ${
                        isSelected && hasContent
                          ? "text-primary animate-bounce-once"
                          : isSelected
                            ? "text-primary scale-110"
                            : "text-muted-foreground group-hover:scale-110"
                      }`}
                    />
                  ) : (
                    <Lightbulb
                      className={`h-5 w-5 shrink-0 transition-all duration-300 ${
                        isSelected && hasContent
                          ? "text-primary animate-bounce-once"
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
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {type === "document" ? documentLabel : topicLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {type === "document"
                        ? "Upload PDF, DOC, DOCX, TXT"
                        : "Nhập chủ đề bất kỳ"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Upload Section */}
      {(sourceType === "document" || hideTopicOption) && (
        <DocumentUpload
          fileName={fileName}
          summary={summary}
          onFileSelect={onFileSelect}
          onSummaryChange={onSummaryChange}
          title={hideTopicOption ? documentLabel : undefined}
          description={
            hideTopicOption
              ? "Upload tài liệu để AI trích xuất nội dung"
              : undefined
          }
        />
      )}

      {/* Topic Input Section */}
      {sourceType === "topic" && !hideTopicOption && (
        <TopicInput
          topic={topic}
          onTopicChange={onTopicChange}
          title={topicLabel}
          description="Nhập chủ đề để AI tạo nội dung từ kiến thức chung"
        />
      )}
    </div>
  );
}
