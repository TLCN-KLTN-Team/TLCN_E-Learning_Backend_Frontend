import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileText,
  Loader2,
  Send,
  Upload,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  AttachmentCategory,
  ChannelPhase,
  type AttachmentResponse,
  type ChannelResponse,
  type CrossReviewScoreResponse,
} from "@/types/chat.types";
import {
  getChannelAttachments,
  getCrossReviewAttachments,
  getMyCrossReview,
  submitCrossReview,
  uploadChannelFile,
} from "@/services/api/workspace/channel.api";
import { derivePhase } from "@/utils/channelPhase";

interface ChannelFilesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChannelResponse;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ChannelFilesPanel = ({
  isOpen,
  onClose,
  channel,
}: ChannelFilesPanelProps) => {
  const [generalFiles, setGeneralFiles] = useState<AttachmentResponse[]>([]);
  const [submissionFiles, setSubmissionFiles] = useState<AttachmentResponse[]>([]);
  const [crossReviewFiles, setCrossReviewFiles] = useState<AttachmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingCategory, setUploadingCategory] =
    useState<AttachmentCategory | null>(null);
  const [reviewScore, setReviewScore] = useState<string>("");
  const [reviewComment, setReviewComment] = useState<string>("");
  const [existingReview, setExistingReview] =
    useState<CrossReviewScoreResponse | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const generalInputRef = useRef<HTMLInputElement>(null);
  const submissionInputRef = useRef<HTMLInputElement>(null);

  const phase = derivePhase(
    channel.submissionDeadline,
    channel.crossReviewDeadline,
    channel.allowCrossReview,
  );
  const showCrossReview =
    phase === ChannelPhase.REVIEW &&
    Boolean(channel.allowCrossReview) &&
    Boolean(channel.reviewTargetChannelId);
  const canUpload = phase === ChannelPhase.OPEN;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoading(true);

    const loaders: Array<Promise<unknown>> = [
      getChannelAttachments(channel.id, AttachmentCategory.GENERAL).then(
        (data) => !cancelled && setGeneralFiles(data ?? []),
      ),
      getChannelAttachments(channel.id, AttachmentCategory.SUBMISSION).then(
        (data) => !cancelled && setSubmissionFiles(data ?? []),
      ),
    ];
    if (showCrossReview) {
      loaders.push(
        getCrossReviewAttachments(channel.id).then(
          (data) => !cancelled && setCrossReviewFiles(data ?? []),
        ),
        getMyCrossReview(channel.id).then((data) => {
          if (cancelled) return;
          setExistingReview(data);
          setReviewScore(data?.score != null ? String(data.score) : "");
          setReviewComment(data?.comment ?? "");
        }),
      );
    } else {
      setCrossReviewFiles([]);
      setExistingReview(null);
      setReviewScore("");
      setReviewComment("");
    }

    Promise.allSettled(loaders).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, channel.id, showCrossReview]);

  const handleUploadClick = (category: AttachmentCategory) => {
    if (!canUpload) return;
    if (category === AttachmentCategory.GENERAL) {
      generalInputRef.current?.click();
    } else {
      submissionInputRef.current?.click();
    }
  };

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: AttachmentCategory,
  ) => {
    const files = e.target.files;
    e.target.value = "";
    if (!files || files.length === 0) return;

    setUploadingCategory(category);
    try {
      await uploadChannelFile(channel.id, category, files);
      const refreshed = await getChannelAttachments(channel.id, category);
      if (category === AttachmentCategory.GENERAL) {
        setGeneralFiles(refreshed ?? []);
      } else {
        setSubmissionFiles(refreshed ?? []);
      }
      toast.success(
        category === AttachmentCategory.GENERAL
          ? "Đã tải tài liệu chung"
          : "Đã nộp bài",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploadingCategory(null);
    }
  };

  const handleSubmitReview = async () => {
    const parsed = Number(reviewScore);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
      toast.warn("Điểm phải là số trong khoảng 0 – 10");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const saved = await submitCrossReview(channel.id, {
        score: parsed,
        comment: reviewComment.trim() || undefined,
      });
      setExistingReview(saved);
      setReviewScore(String(saved.score));
      setReviewComment(saved.comment ?? "");
      toast.success("Đã gửi điểm chấm chéo");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gửi điểm chấm chéo thất bại",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 left-0 z-30 w-96 max-w-[90%] bg-gray-900 border-r border-gray-700 shadow-xl flex flex-col">
      <input
        type="file"
        multiple
        ref={generalInputRef}
        className="hidden"
        onChange={(e) => handleFilesSelected(e, AttachmentCategory.GENERAL)}
      />
      <input
        type="file"
        multiple
        ref={submissionInputRef}
        className="hidden"
        onChange={(e) => handleFilesSelected(e, AttachmentCategory.SUBMISSION)}
      />

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" /> Tài liệu của nhóm
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{channel.name}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
          </div>
        ) : (
          <>
            <FileSection
              title="Tài liệu chung"
              files={generalFiles}
              showUpload={canUpload}
              uploading={uploadingCategory === AttachmentCategory.GENERAL}
              uploadLabel="Tải tài liệu"
              onUploadClick={() => handleUploadClick(AttachmentCategory.GENERAL)}
            />
            <FileSection
              title="Bài đã nộp"
              files={submissionFiles}
              showUpload={canUpload}
              uploading={uploadingCategory === AttachmentCategory.SUBMISSION}
              uploadLabel="Nộp bài"
              onUploadClick={() =>
                handleUploadClick(AttachmentCategory.SUBMISSION)
              }
            />
            {showCrossReview && (
              <>
                <FileSection
                  title="Bài cần chấm chéo"
                  files={crossReviewFiles}
                  emptyHint="Chưa có bài để chấm."
                  showUpload={false}
                />
                <section className="rounded-md border border-gray-700 bg-gray-800/50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-gray-200 font-medium">
                      Nhận xét & chấm điểm
                    </h4>
                    {existingReview && (
                      <span className="text-[11px] text-emerald-400">
                        Đã nộp · có thể cập nhật
                      </span>
                    )}
                  </div>
                  <label className="block">
                    <span className="text-xs text-gray-400">
                      Điểm (0 – 10)
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={reviewScore}
                      onChange={(e) => setReviewScore(e.target.value)}
                      disabled={isSubmittingReview}
                      className="mt-1 w-32 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-400">Nhận xét</span>
                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      disabled={isSubmittingReview}
                      placeholder="Góp ý cho nhóm bạn chấm…"
                      className="mt-1 w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview || reviewScore === ""}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
                  >
                    {isSubmittingReview ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {existingReview ? "Cập nhật điểm" : "Gửi điểm chấm chéo"}
                  </button>
                </section>
              </>
            )}
            {phase === ChannelPhase.LOCKED && (
              <div className="rounded-md border border-red-700 bg-red-950/40 px-3 py-2 text-red-300 text-xs">
                Kênh đã hết hạn. Chỉ giảng viên còn quyền thao tác.
              </div>
            )}
            {phase === ChannelPhase.REVIEW && !showCrossReview && (
              <div className="rounded-md border border-amber-700 bg-amber-950/40 px-3 py-2 text-amber-200 text-xs">
                Đang trong giai đoạn chấm chéo — không thể nộp bài mới.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface FileSectionProps {
  title: string;
  files: AttachmentResponse[];
  emptyHint?: string;
  showUpload?: boolean;
  uploading?: boolean;
  uploadLabel?: string;
  onUploadClick?: () => void;
}

const FileSection = ({
  title,
  files,
  emptyHint = "Chưa có file nào.",
  showUpload,
  uploading,
  uploadLabel,
  onUploadClick,
}: FileSectionProps) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-gray-200 font-medium">{title}</h4>
        {showUpload && onUploadClick && (
          <button
            type="button"
            onClick={onUploadClick}
            disabled={uploading}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploadLabel ?? "Tải lên"}
          </button>
        )}
      </div>
      {files.length === 0 ? (
        <p className="text-xs text-gray-500 italic">{emptyHint}</p>
      ) : (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-2 rounded-md bg-gray-800 px-3 py-2 border border-gray-700"
            >
              <div className="min-w-0">
                <p className="text-gray-100 text-sm truncate" title={f.fileName}>
                  {f.fileName}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(f.fileSize)}
                </p>
              </div>
              <a
                href={f.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
                title="Tải xuống"
              >
                <Download className="w-4 h-4" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ChannelFilesPanel;
