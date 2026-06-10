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
          <div className="flex gap-1 mt-4 p-1 rounded-xl bg-muted/60 border border-border">
            {(["document", "topic"] as const).map((type) => {
              const isSelected = sourceType === type;
              const hasContent = type === "document" ? !!fileName : !!topic;

              return (
                <button
                  key={type}
                  onClick={() => onSourceTypeChange(type)}
                  className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-sm cursor-default pointer-events-none"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.97]"
                  }`}
                >
                  {type === "document" ? (
                    <FileText className="h-4 w-4 shrink-0" />
                  ) : (
                    <Lightbulb className="h-4 w-4 shrink-0" />
                  )}
                  <span>{type === "document" ? documentLabel : topicLabel}</span>
                  {isSelected && hasContent && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
                  )}
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
