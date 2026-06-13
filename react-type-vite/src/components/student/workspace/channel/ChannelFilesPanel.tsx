import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Save,
  Send,
  Trophy,
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
  type ScoreCollectionStatus,
  type SessionGroupSubmissionsResponse,
} from "@/types/chat.types";
import {
  collectSessionScores,
  getChannelAttachments,
  getCrossReviewAttachments,
  getMyCrossReviews,
  getSessionById,
  getSessionSubmissions,
  submitBatchCrossReview,
  uploadChannelFile,
} from "@/services/api/workspace/channel.api";
import { derivePhase } from "@/utils/channelPhase";
import { useAuth } from "@/context/auth-context/useAuth";
import { hasRole } from "@/utils/roleUtils";

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

// ─── Per-group review form ──────────────────────────────────────────────────

interface LocalDraft {
  score: string;
  comment: string;
}

interface GroupReviewFormProps {
  group: SessionGroupSubmissionsResponse;
  /** Điểm đã nộp lên server (từ myReviews). */
  submitted: CrossReviewScoreResponse | undefined;
  /** Bản nháp đang lưu cục bộ (chưa nộp batch). */
  draft: LocalDraft | undefined;
  onDraftSave: (channelId: string, score: string, comment: string) => void;
  isSelf?: boolean;
}

const GroupReviewForm = ({
  group,
  submitted,
  draft,
  onDraftSave,
  isSelf,
}: GroupReviewFormProps) => {
  const [score, setScore] = useState(draft?.score ?? (submitted?.score != null ? String(submitted.score) : ""));
  const [comment, setComment] = useState(draft?.comment ?? (submitted?.comment ?? ""));
  const [savedLocally, setSavedLocally] = useState(!!draft);
  const [expanded, setExpanded] = useState(false);

  const handleScoreChange = (v: string) => { setScore(v); setSavedLocally(false); };
  const handleCommentChange = (v: string) => { setComment(v); setSavedLocally(false); };

  const handleSaveLocally = () => {
    const parsed = Number(score);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
      toast.warn("Điểm phải là số trong khoảng 0 – 10");
      return;
    }
    onDraftSave(group.channelId, score, comment);
    setSavedLocally(true);
    toast.success(`Đã lưu điểm cho ${group.channelName} (chưa nộp)`);
  };

  const hasDraft = draft !== undefined;
  const headerBadge = hasDraft ? (
    <span className="text-[11px] text-amber-400 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" /> Đã lưu {draft.score}/10
    </span>
  ) : submitted ? (
    <span className="text-[11px] text-emerald-400">
      Đã nộp {submitted.score}/10
    </span>
  ) : null;

  return (
    <div className="rounded-md border border-gray-700 bg-gray-800/60 overflow-hidden">
      {/* Header — collapse/expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-700/50"
      >
        <span className="text-gray-200 font-medium text-sm flex items-center gap-1.5">
          {group.channelName}
          {isSelf && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-800 text-indigo-200 font-normal">
              Nhóm bạn
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {headerBadge}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-700">
          {/* Files của nhóm này */}
          {group.files.length === 0 ? (
            <p className="text-xs text-gray-500 italic pt-2">Nhóm chưa nộp file nào.</p>
          ) : (
            <ul className="space-y-1 pt-2">
              {group.files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded bg-gray-900 px-2 py-1.5 border border-gray-700"
                >
                  <div className="min-w-0">
                    <p className="text-gray-100 text-xs truncate" title={f.fileName}>
                      {f.fileName}
                    </p>
                    <p className="text-[11px] text-gray-500">{formatFileSize(f.fileSize)}</p>
                  </div>
                  <a
                    href={f.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white shrink-0"
                    title="Tải xuống"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Form chấm điểm */}
          <div className="space-y-2 pt-1">
            <label className="block">
              <span className="text-xs text-gray-400">Điểm (0 – 10)</span>
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={score}
                onChange={(e) => handleScoreChange(e.target.value)}
                className="mt-1 w-28 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Nhận xét</span>
              <textarea
                rows={2}
                maxLength={2000}
                value={comment}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder="Góp ý cho nhóm…"
                className="mt-1 w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </label>
            <button
              type="button"
              onClick={handleSaveLocally}
              disabled={score === ""}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors ${
                savedLocally
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {savedLocally ? "Đã lưu" : "Lưu điểm"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main panel ─────────────────────────────────────────────────────────────

const ChannelFilesPanel = ({
  isOpen,
  onClose,
  channel,
}: ChannelFilesPanelProps) => {
  const { user } = useAuth();
  const isTeacher =
    hasRole("TEACHER") ||
    user?.roles?.includes("TEACHER") ||
    user?.role === "TEACHER" ||
    false;

  const [generalFiles, setGeneralFiles] = useState<AttachmentResponse[]>([]);
  const [submissionFiles, setSubmissionFiles] = useState<AttachmentResponse[]>([]);
  const [groupSubmissions, setGroupSubmissions] = useState<SessionGroupSubmissionsResponse[]>([]);
  const [myReviews, setMyReviews] = useState<CrossReviewScoreResponse[]>([]);
  /** Bản nháp điểm lưu cục bộ: reviewedChannelId → {score, comment} */
  const [draftScores, setDraftScores] = useState<Record<string, LocalDraft>>({});
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [reviewVersion, setReviewVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState<AttachmentCategory | null>(null);
  const [sessionStatus, setSessionStatus] = useState<ScoreCollectionStatus | null>(null);
  const [sessionStatusLoaded, setSessionStatusLoaded] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const generalInputRef = useRef<HTMLInputElement>(null);
  const submissionInputRef = useRef<HTMLInputElement>(null);

  const phase = derivePhase(
    channel.submissionDeadline,
    channel.crossReviewDeadline,
    channel.allowCrossReview,
  );
  const showCrossReview = phase === ChannelPhase.REVIEW && Boolean(channel.allowCrossReview);
  const canUpload = phase === ChannelPhase.OPEN;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoading(true);
    setSessionStatusLoaded(false);

    const loadSubmissions = channel.assignmentSessionId
      ? getSessionSubmissions(channel.id)
      : getChannelAttachments(channel.id, AttachmentCategory.SUBMISSION);

    const loaders: Array<Promise<unknown>> = [
      getChannelAttachments(channel.id, AttachmentCategory.GENERAL).then(
        (data) => !cancelled && setGeneralFiles(data ?? []),
      ),
      loadSubmissions.then(
        (data) => !cancelled && setSubmissionFiles(data ?? []),
      ),
    ];

    if (showCrossReview) {
      loaders.push(
        getCrossReviewAttachments(channel.id).then(
          (data) => !cancelled && setGroupSubmissions(data ?? []),
        ),
        getMyCrossReviews(channel.id).then(
          (data) => !cancelled && setMyReviews(data ?? []),
        ),
      );
    } else {
      setGroupSubmissions([]);
      setMyReviews([]);
      // Giáo viên cần biết trạng thái thu điểm khi phiên đã khoá.
      if (phase === ChannelPhase.LOCKED && isTeacher && channel.assignmentSessionId) {
        loaders.push(
          getSessionById(channel.assignmentSessionId)
            .then((s) => {
              if (!cancelled) {
                setSessionStatus(s.scoreCollectionStatus ?? null);
                setSessionStatusLoaded(true);
              }
            })
            .catch(() => {
              if (!cancelled) setSessionStatusLoaded(true);
            }),
        );
      }
    }

    Promise.allSettled(loaders).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [isOpen, channel.id, showCrossReview]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUploadClick = (category: AttachmentCategory) => {
    if (!canUpload) return;
    if (category === AttachmentCategory.GENERAL) generalInputRef.current?.click();
    else submissionInputRef.current?.click();
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
      if (category === AttachmentCategory.GENERAL) {
        const refreshed = await getChannelAttachments(channel.id, AttachmentCategory.GENERAL);
        setGeneralFiles(refreshed ?? []);
      } else {
        const refreshed = channel.assignmentSessionId
          ? await getSessionSubmissions(channel.id)
          : await getChannelAttachments(channel.id, AttachmentCategory.SUBMISSION);
        setSubmissionFiles(refreshed ?? []);
      }
      toast.success(
        category === AttachmentCategory.GENERAL ? "Đã tải tài liệu chung" : "Đã nộp bài",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploadingCategory(null);
    }
  };

  // Build map reviewedChannelId → submitted score để hiển thị badge "Đã nộp"
  const myReviewMap = Object.fromEntries(
    myReviews.map((r) => [r.reviewedChannelId, r]),
  );

  const handleDraftSave = (channelId: string, score: string, comment: string) => {
    setDraftScores((prev) => ({ ...prev, [channelId]: { score, comment } }));
  };

  const draftCount = Object.keys(draftScores).length;

  const handleBatchSubmit = async () => {
    if (draftCount === 0) return;
    setBatchSubmitting(true);
    try {
      const entries = Object.entries(draftScores).map(([reviewedChannelId, d]) => ({
        reviewedChannelId,
        score: Number(d.score),
        comment: d.comment.trim() || undefined,
      }));
      await submitBatchCrossReview(channel.id, { entries });
      // Reload điểm đã nộp từ server, xóa drafts, force remount form để hiện lịch sử
      const refreshed = await getMyCrossReviews(channel.id);
      setMyReviews(refreshed ?? []);
      setDraftScores({});
      setReviewVersion((v) => v + 1);
      toast.success(`Đã nộp bài chấm thành công (${entries.length} nhóm)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nộp bài chấm thất bại");
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleCollect = async () => {
    if (!channel.assignmentSessionId) return;
    setCollecting(true);
    try {
      await collectSessionScores(channel.assignmentSessionId);
      setSessionStatus("COLLECTED" as ScoreCollectionStatus);
      toast.success("Thu điểm thành công!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thu điểm thất bại");
    } finally {
      setCollecting(false);
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
        <button onClick={onClose} className="text-gray-400 hover:text-white" title="Đóng">
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
              onUploadClick={() => handleUploadClick(AttachmentCategory.SUBMISSION)}
            />

            {showCrossReview && (
              <section>
                <h4 className="text-gray-200 font-medium mb-2">
                  Chấm bài ({groupSubmissions.length} nhóm)
                </h4>
                {groupSubmissions.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">
                    Chưa có nhóm nào nộp bài trong session này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {groupSubmissions.map((g) => (
                      <GroupReviewForm
                        key={`${g.channelId}-v${reviewVersion}`}
                        group={g}
                        submitted={myReviewMap[g.channelId]}
                        draft={draftScores[g.channelId]}
                        onDraftSave={handleDraftSave}
                        isSelf={g.channelId === channel.id}
                      />
                    ))}
                  </div>
                )}

                {/* Nút Nộp bài chấm */}
                <div className="mt-4 pt-3 border-t border-gray-700">
                  {draftCount > 0 && (
                    <p className="text-xs text-amber-400 mb-2">
                      {draftCount} nhóm đã được lưu điểm — nhấn "Nộp bài chấm" để gửi lên hệ thống.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleBatchSubmit}
                    disabled={draftCount === 0 || batchSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium transition-colors"
                  >
                    {batchSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {batchSubmitting
                      ? "Đang nộp…"
                      : draftCount > 0
                        ? `Nộp bài chấm (${draftCount} nhóm)`
                        : "Nộp bài chấm"}
                  </button>
                </div>
              </section>
            )}

            {phase === ChannelPhase.LOCKED && (
              <div className="space-y-2">
                <div className="rounded-md border border-red-700 bg-red-950/40 px-3 py-2 text-red-300 text-xs">
                  Kênh đã hết hạn. Chỉ giảng viên còn quyền thao tác.
                </div>
                {isTeacher && channel.assignmentSessionId && sessionStatusLoaded && (
                  sessionStatus === "COLLECTED" || sessionStatus === "SENT_TO_LMS" ? (
                    <div className="flex items-center gap-1.5 text-xs text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Điểm đã được thu
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCollect}
                      disabled={collecting || sessionStatus === "COLLECTING"}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      {collecting || sessionStatus === "COLLECTING" ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Đang thu điểm...
                        </>
                      ) : (
                        <>
                          <Trophy className="w-3.5 h-3.5" />
                          {sessionStatus === "FAILED" ? "Thu điểm lại" : "Thu điểm"}
                        </>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
            {phase === ChannelPhase.REVIEW && !channel.allowCrossReview && (
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

// ─── FileSection ─────────────────────────────────────────────────────────────

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
}: FileSectionProps) => (
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
              <p className="text-xs text-gray-400">{formatFileSize(f.fileSize)}</p>
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

export default ChannelFilesPanel;
