import { FileText, Lightbulb, Upload, CheckCircle } from "lucide-react";
import { MOCK_SUMMARY } from "@/lib/quiz/quizMockData";

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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file.name);
      // Simulate extraction
      setTimeout(() => onSummaryChange(MOCK_SUMMARY), 600);
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
        {(["document", "topic"] as const).map((type) => (
          <button
            key={type}
            onClick={() => onSourceTypeChange(type)}
            className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all text-left ${
              sourceType === type
                ? "border-primary bg-secondary"
                : "border-border hover:border-primary/40"
            }`}
          >
            {type === "document" ? (
              <FileText className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <Lightbulb className="h-5 w-5 text-primary shrink-0" />
            )}
            <div>
              <p className="font-medium text-foreground">
                {type === "document" ? "Từ tài liệu" : "Từ chủ đề"}
              </p>
              <p className="text-xs text-muted-foreground">
                {type === "document"
                  ? "Upload PDF, DOC, DOCX"
                  : "Nhập chủ đề bất kỳ"}
              </p>
            </div>
          </button>
        ))}
      </div>

      {sourceType === "document" && (
        <div className="space-y-3 animate-slide-up">
          <label className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-secondary/50 p-6 cursor-pointer hover:border-primary/60 transition-colors">
            {fileName ? (
              <>
                <CheckCircle className="h-8 w-8 text-success" />
                <span className="text-sm font-medium text-foreground">
                  {fileName}
                </span>
                <span className="text-xs text-muted-foreground">
                  Đã chọn file
                </span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
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
            />
          </label>

          {summary && (
            <div className="space-y-2 animate-slide-up">
              <label className="text-sm font-medium text-foreground">
                Tóm tắt nội dung (có thể chỉnh sửa)
              </label>
              <textarea
                value={summary}
                onChange={(e) => onSummaryChange(e.target.value)}
                rows={4}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          )}
        </div>
      )}

      {sourceType === "topic" && (
        <div className="animate-slide-up">
          <label className="text-sm font-medium text-foreground">Chủ đề</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="Ví dụ: Lập trình web với React..."
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}
    </div>
  );
}
