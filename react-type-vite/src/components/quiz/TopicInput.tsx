import { Lightbulb, CheckCircle } from "lucide-react";
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
  placeholder = "Ví dụ: Lập trình web với React...",
  label = "Chủ đề",
}: Props) {
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

      {/* Input */}
      <div className="space-y-2">
        <label
          className={`text-sm font-medium transition-colors duration-300 flex items-center gap-1 ${
            topic ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {topic && <CheckCircle className="h-3.5 w-3.5" />}
          {label}
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border-2 bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all duration-300 ${
            topic
              ? "border-primary text-foreground focus:ring-primary/20 shadow-sm"
              : "border-border text-foreground focus:ring-ring hover:border-primary/40"
          }`}
        />
      </div>
    </div>
  );
}
