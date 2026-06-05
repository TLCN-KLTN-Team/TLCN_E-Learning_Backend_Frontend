import { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  Download,
  FileText,
  Loader2,
  Lock,
  Upload,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  AttachmentCategory,
  ChannelPhase,
  type AttachmentResponse,
  type ChannelResponse,
} from "@/types/chat.types";
import {
  getChannelAttachments,
  uploadChannelFile,
} from "@/services/api/workspace/channel.api";
import { derivePhase } from "@/utils/channelPhase";

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChannelResponse;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDeadline = (iso?: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const SubmitAssignmentModal = ({
  isOpen,
  onClose,
  channel,
}: SubmitAssignmentModalProps) => {
  const [submissions, setSubmissions] = useState<AttachmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const phase = derivePhase(
    channel.submissionDeadline,
    channel.crossReviewDeadline,
    channel.allowCrossReview,
  );
  const canSubmit = phase === ChannelPhase.OPEN;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Reset success state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubmitSuccess(false);
      setCountdown(3);
    }
  }, [isOpen]);

  // Auto-close countdown after successful submit
  useEffect(() => {
    if (!submitSuccess) return;
    if (countdown <= 0) {
      onClose();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [submitSuccess, countdown, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoading(true);
    getChannelAttachments(channel.id, AttachmentCategory.SUBMISSION)
      .then((data) => {
        if (!cancelled) setSubmissions(data ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Không tải được bài đã nộp",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, channel.id]);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      e.target.value = "";
      return;
    }
    const picked = Array.from(files);
    e.target.value = "";

    const oversized = picked.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error(
        `File vượt quá 20MB: ${oversized.map((f) => f.name).join(", ")}`,
      );
      const valid = picked.filter((f) => f.size <= MAX_FILE_SIZE);
      if (valid.length > 0) setPendingFiles((prev) => [...prev, ...valid]);
      return;
    }

    setPendingFiles((prev) => [...prev, ...picked]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (pendingFiles.length === 0) {
      toast.warn("Vui lòng chọn file để nộp");
      return;
    }
    setIsUploading(true);
    try {
      await uploadChannelFile(
        channel.id,
        AttachmentCategory.SUBMISSION,
        pendingFiles,
      );
      const refreshed = await getChannelAttachments(
        channel.id,
        AttachmentCategory.SUBMISSION,
      );
      setSubmissions(refreshed ?? []);
      setPendingFiles([]);
      setSubmitSuccess(true);
      setCountdown(3);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nộp bài thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-lg bg-gray-900 border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleFilePick}
        />

        {submitSuccess && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12 px-6 text-center animate-in fade-in duration-300">
            <div className="rounded-full bg-green-500/20 p-4">
              <CheckCircle className="w-14 h-14 text-green-400" />
            </div>
            <div>
              <p className="text-white text-lg font-semibold">Nộp bài thành công!</p>
              <p className="text-gray-400 text-sm mt-1">
                Nhóm đã nộp bài. Cửa sổ sẽ tự đóng sau{" "}
                <span className="text-indigo-400 font-medium">{countdown}</span> giây…
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
            >
              Đóng ngay
            </button>
          </div>
        )}

        {!submitSuccess && (
        <>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" /> Nộp bài
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

        <div className="px-5 py-3 border-b border-gray-700 text-xs text-gray-300 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Hạn nộp:</span>
            <span>{formatDeadline(channel.submissionDeadline)}</span>
          </div>
          {channel.allowCrossReview && channel.crossReviewDeadline && (
            <div className="flex justify-between">
              <span className="text-gray-400">Hạn chấm chéo:</span>
              <span>{formatDeadline(channel.crossReviewDeadline)}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
          {!canSubmit && (
            <div className="rounded-md border border-amber-700 bg-amber-950/40 px-3 py-2 text-amber-200 text-xs flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {phase === ChannelPhase.REVIEW
                  ? "Đã hết hạn nộp bài. Đang trong giai đoạn chấm chéo nên bài nộp đã bị khóa."
                  : "Kênh đã đóng. Không thể nộp hoặc chỉnh sửa bài."}
              </span>
            </div>
          )}

          <section>
            <h4 className="text-gray-200 font-medium mb-2">Bài đã nộp</h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-4 text-gray-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải…
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                Chưa có bài nộp nào.
              </p>
            ) : (
              <ul className="space-y-2">
                {submissions.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-gray-800 px-3 py-2 border border-gray-700"
                  >
                    <div className="min-w-0">
                      <p
                        className="text-gray-100 text-sm truncate"
                        title={f.fileName}
                      >
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

          {canSubmit && (
            <section>
              <h4 className="text-gray-200 font-medium mb-2">File sắp nộp</h4>
              {pendingFiles.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  Chưa chọn file nào.
                </p>
              ) : (
                <ul className="space-y-2 mb-2">
                  {pendingFiles.map((f, idx) => (
                    <li
                      key={`${f.name}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-md bg-gray-800 px-3 py-2 border border-gray-700"
                    >
                      <div className="min-w-0">
                        <p
                          className="text-gray-100 text-sm truncate"
                          title={f.name}
                        >
                          {f.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(f.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingFile(idx)}
                        className="text-gray-400 hover:text-red-400"
                        title="Bỏ chọn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 text-sm py-2 rounded border border-dashed border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-white transition-colors"
              >
                <Upload className="w-4 h-4" /> Chọn file
              </button>
            </section>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded text-gray-300 hover:bg-gray-800"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isUploading || pendingFiles.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Nộp bài
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default SubmitAssignmentModal;
