import { Lightbulb, CheckCircle } from "lucide-react";
import RichTextEditor from "@/components/shared/RichTextEditor";
import "@/styles/ai-study-mode.css";

interface Props {
  topic: string;
  onTopicChange: (topic: string) => void;
  // Customization props
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  label?: string;
}

export default function TopicInput({
  topic,
  onTopicChange,
  title = "Chủ đề",
  description = "Nhập chủ đề bất kỳ để tạo nội dung",
  icon,
  placeholder = "Ví dụ: Lập trình web với React, các khái niệm OOP...",
  label = "Nội dung chủ đề",
}: Props) {
  const hasContent = topic.replace(/<[^>]*>/g, "").trim().length > 0;

  return (
    <div className="ai-section-card space-y-4">
      {/* Header */}
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

      {/* Rich text editor */}
      <div className="space-y-2">
        <label
          className={`text-sm font-medium transition-colors duration-300 flex items-center gap-1 ${
            hasContent ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {hasContent && <CheckCircle className="h-3.5 w-3.5" />}
          {label}
        </label>
        <RichTextEditor
          value={topic}
          onChange={onTopicChange}
          placeholder={placeholder}
          minHeight="260px"
        />
      </div>
    </div>
  );
}
