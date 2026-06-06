import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Send,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "react-toastify";
import { useAuth } from "@/context/auth-context/useAuth";
import type {
  AssignmentSessionResponse,
  ChannelResponse,
  GroupFinalScoreResponse,
  PeerScoreEntryResponse,
  ScoreCollectionStatus,
} from "@/types/chat.types";
import {
  collectSessionScores,
  getSessionById,
  getSessionScores,
  sendScoresToLms,
  updateGroupScore,
} from "@/services/api/workspace/channel.api";

interface AssignmentSessionPanelProps {
  channel: ChannelResponse;
}

const fmt = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "HH:mm dd/MM/yyyy", { locale: vi });
  } catch {
    return iso;
  }
};

const isSessionEnded = (session: AssignmentSessionResponse): boolean => {
  const now = new Date();
  if (session.allowCrossReview && session.crossReviewDeadline) {
    return parseISO(session.crossReviewDeadline) < now;
  }
  return parseISO(session.submissionDeadline) < now;
};

const StatusBadge = ({
  status,
}: {
  status: ScoreCollectionStatus | null | undefined;
}) => {
  switch (status) {
    case "SENT_TO_LMS":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
          <Send className="w-3 h-3" /> Đã gửi LMS
        </span>
      );
    case "COLLECTED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700">
          <CheckCircle2 className="w-3 h-3" /> Đã thu điểm
        </span>
      );
    case "COLLECTING":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
          <Loader2 className="w-3 h-3 animate-spin" /> Đang thu...
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-700">
          <AlertCircle className="w-3 h-3" /> Thất bại
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-400 border border-gray-600">
          Chưa thu điểm
        </span>
      );
  }
};

const ScoreStatusLabel = ({
  status,
}: {
  status: string | null | undefined;
}) => {
  switch (status) {
    case "CALCULATED":
      return <span className="text-green-400 text-xs">Đã tính</span>;
    case "NO_SUBMISSION":
      return <span className="text-gray-500 text-xs">Không nộp</span>;
    case "NO_PEERS":
      return <span className="text-yellow-400 text-xs">Không có chấm chéo</span>;
    case "SENT_TO_LMS":
      return <span className="text-blue-400 text-xs">Đã gửi LMS</span>;
    default:
      return <span className="text-gray-500 text-xs">—</span>;
  }
};

// ─── GroupScoreSection — section cho 1 nhóm được chấm ───────────────────────

interface GroupScoreSectionProps {
  score: GroupFinalScoreResponse;
  nameMap: Map<string, string>;
  sessionId: string;
  isTeacher: boolean;
  onScoreUpdated: (updated: GroupFinalScoreResponse) => void;
}

const GroupScoreSection = ({
  score,
  nameMap,
  sessionId,
  isTeacher,
  onScoreUpdated,
}: GroupScoreSectionProps) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const groupName = nameMap.get(score.channelId) ?? score.channelId.slice(-6);
  const canEdit =
    isTeacher &&
    score.status !== "NO_SUBMISSION" &&
    score.status !== "NO_PEERS";

  const startEdit = () => {
    setEditValue(score.finalScore != null ? score.finalScore.toFixed(1) : "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveEdit = async () => {
    const parsed = parseFloat(editValue);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) {
      toast.error("Điểm phải trong khoảng 0 – 10");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateGroupScore(sessionId, score.channelId, parsed);
      onScoreUpdated(updated);
      setEditing(false);
      toast.success(`Đã cập nhật điểm nhóm ${groupName}`);
    } catch {
      toast.error("Cập nhật điểm thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Header row — tên nhóm được chấm + trạng thái */}
      <tr className="bg-gray-750 border-b border-gray-600">
        <td
          colSpan={4}
          className="px-3 py-1.5 bg-gray-800/80"
        >
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="text-gray-200 font-semibold text-xs">{groupName}</span>
            <ScoreStatusLabel status={score.status} />
          </div>
        </td>
      </tr>

      {/* Các dòng điểm từ từng nhóm chấm */}
      {score.peerScores.length > 0 ? (
        score.peerScores.map((p: PeerScoreEntryResponse, i: number) => (
          <tr key={i} className="border-b border-gray-700/60 hover:bg-gray-700/20">
            <td className="px-3 py-1.5 text-gray-300 text-xs">
              <div className="flex flex-col">
                <span>{nameMap.get(p.reviewerChannelId) ?? p.reviewerChannelId.slice(-6)}</span>
                {p.comment && (
                  <span className="text-gray-500 italic text-[10px] truncate max-w-[140px]">
                    {p.comment}
                  </span>
                )}
              </div>
            </td>
            <td className="px-3 py-1.5 text-center text-gray-200 text-xs font-medium">
              {p.score != null ? `${p.score.toFixed(1)}` : "—"}
            </td>
            <td className="px-3 py-1.5 text-center text-gray-500 text-xs">—</td>
            <td className="px-3 py-1.5 text-center text-gray-500 text-xs">—</td>
          </tr>
        ))
      ) : (
        <tr className="border-b border-gray-700/60">
          <td colSpan={4} className="px-3 py-1.5 text-xs text-gray-500 italic">
            {score.status === "NO_SUBMISSION"
              ? "Nhóm chưa nộp bài."
              : "Chưa có nhóm nào chấm nhóm này."}
          </td>
        </tr>
      )}

      {/* Dòng tổng hợp — Trung vị + Điểm cuối */}
      {(score.status === "CALCULATED" || score.status === "SENT_TO_LMS" || score.manuallyOverridden) && (
        <tr className="border-b border-gray-600 bg-gray-800/40">
          <td className="px-3 py-1.5 text-[11px] text-gray-400 italic">Tổng hợp</td>
          <td className="px-3 py-1.5 text-center text-gray-500 text-xs">—</td>
          <td className="px-3 py-1.5 text-center text-xs font-medium text-indigo-300">
            {score.medianPeerScore != null ? score.medianPeerScore.toFixed(1) : "—"}
          </td>
          <td className="px-3 py-1.5 text-center text-xs">
            {editing ? (
              <div className="flex items-center justify-center gap-1">
                <input
                  ref={inputRef}
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="w-14 px-1 py-0.5 text-center bg-gray-700 border border-indigo-500 rounded text-white text-xs focus:outline-none"
                />
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="text-green-400 hover:text-green-300 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 group/final">
                <span className="font-bold text-white text-sm">
                  {score.finalScore != null ? score.finalScore.toFixed(1) : "—"}
                  {score.manuallyOverridden && (
                    <span className="ml-1 text-yellow-400 text-[10px]" title="Giáo viên đã chỉnh sửa">
                      ✎
                    </span>
                  )}
                </span>
                {canEdit && (
                  <button
                    onClick={startEdit}
                    className="opacity-0 group-hover/final:opacity-100 text-gray-400 hover:text-indigo-400 transition-opacity ml-1"
                    title="Chỉnh sửa điểm cuối"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Main panel ──────────────────────────────────────────────────────────────

const AssignmentSessionPanel = ({ channel }: AssignmentSessionPanelProps) => {
  const { user } = useAuth();
  const isTeacher =
    user?.roles?.includes("educator") ||
    user?.role === "educator" ||
    user?.roles?.includes("EDUCATOR") ||
    user?.role === "EDUCATOR" ||
    false;

  const [session, setSession] = useState<AssignmentSessionResponse | null>(null);
  const [scores, setScores] = useState<GroupFinalScoreResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [scoresLoaded, setScoresLoaded] = useState(false);

  const sessionId = channel.assignmentSessionId;

  useEffect(() => {
    if (!sessionId) return;
    // Reset khi đổi channel / session
    setSession(null);
    setScores([]);
    setScoresLoaded(false);
    setExpanded(false);
    setLoading(true);
    getSessionById(sessionId)
      .then(setSession)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Tự động load điểm nếu session đã COLLECTED hoặc SENT_TO_LMS, rồi mở panel
  useEffect(() => {
    if (!session || scoresLoaded) return;
    const s = session.scoreCollectionStatus;
    if (s !== "COLLECTED" && s !== "SENT_TO_LMS") return;
    getSessionScores(session.id)
      .then((result) => {
        setScores(result);
        if (isTeacher && result.length > 0) setExpanded(true);
      })
      .catch(() => {})
      .finally(() => setScoresLoaded(true));
  }, [session, scoresLoaded, isTeacher]);

  // Polling: refresh session mỗi 30s khi deadline đã qua nhưng chưa collect xong
  useEffect(() => {
    if (!session || !sessionId) return;
    const s = session.scoreCollectionStatus;
    if (s === "COLLECTED" || s === "SENT_TO_LMS") return;
    if (!isSessionEnded(session)) return;

    const timer = setInterval(() => {
      getSessionById(sessionId)
        .then((fresh) => {
          setSession(fresh);
          if (
            fresh.scoreCollectionStatus === "COLLECTED" ||
            fresh.scoreCollectionStatus === "SENT_TO_LMS"
          ) {
            setScoresLoaded(false); // trigger auto-load effect
          }
        })
        .catch(() => {});
    }, 30_000);

    return () => clearInterval(timer);
  }, [session, sessionId]);

  const handleCollect = async () => {
    if (!session) return;
    setCollecting(true);
    try {
      const result = await collectSessionScores(session.id);
      setScores(result);
      setScoresLoaded(true);
      setSession((s) =>
        s ? { ...s, scoreCollectionStatus: "COLLECTED" as ScoreCollectionStatus } : s,
      );
      setExpanded(true);
      toast.success("Thu điểm thành công!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thu điểm thất bại");
    } finally {
      setCollecting(false);
    }
  };

  const handleSendToLms = async () => {
    if (!session) return;
    setSending(true);
    try {
      const result = await sendScoresToLms(session.id);
      setScores(result);
      setSession((s) =>
        s ? { ...s, scoreCollectionStatus: "SENT_TO_LMS" as ScoreCollectionStatus } : s,
      );
      toast.success("Đã gửi điểm sang LMS thành công!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gửi điểm thất bại");
    } finally {
      setSending(false);
    }
  };

  const handleScoreUpdated = (updated: GroupFinalScoreResponse) => {
    setScores((prev) =>
      prev.map((s) => (s.channelId === updated.channelId ? updated : s)),
    );
  };

  if (!sessionId) return null;
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-400 border-b border-gray-700 bg-gray-850">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải thông tin bài tập...
      </div>
    );
  }
  if (!session) return null;

  const ended = isSessionEnded(session);
  const status = session.scoreCollectionStatus;
  const canCollect =
    isTeacher && ended && status !== "COLLECTED" && status !== "COLLECTING" && status !== "SENT_TO_LMS";
  const hasScores =
    isTeacher && (status === "COLLECTED" || status === "SENT_TO_LMS");
  const alreadySentToLms = status === "SENT_TO_LMS";
  const progress =
    session.totalChannels > 0
      ? Math.round((session.submittedCount / session.totalChannels) * 100)
      : 0;

  return (
    <div className="border-b border-gray-700 bg-gray-850 text-sm">
      {/* Collapsed header — luôn hiển thị */}
      <div
        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-700/40 select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="text-gray-200 font-medium text-xs truncate flex-1 min-w-0">
          {session.name || "Phiên bài tập nhóm"}
        </span>
        <StatusBadge status={status} />
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-700/60">
          {/* Deadlines */}
          <div className="grid grid-cols-2 gap-x-4 text-xs mt-3">
            <div>
              <span className="text-gray-500">Hạn nộp:</span>{" "}
              <span className="text-gray-300">
                {fmt(session.submissionDeadline)}
              </span>
            </div>
            {session.allowCrossReview && session.crossReviewDeadline && (
              <div>
                <span className="text-gray-500">Hạn chấm chéo:</span>{" "}
                <span className="text-gray-300">
                  {fmt(session.crossReviewDeadline)}
                </span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> Tiến độ nộp bài
              </span>
              <span className="text-gray-300">
                {session.submittedCount}/{session.totalChannels} nhóm
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Nút Gửi sang LMS — hiện sau progress, chỉ giáo viên khi đã có điểm */}
          {hasScores && (
            <button
              onClick={handleSendToLms}
              disabled={sending}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                alreadySentToLms
                  ? "bg-blue-700 hover:bg-blue-600"
                  : "bg-emerald-700 hover:bg-emerald-600"
              }`}
            >
              {sending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang gửi điểm...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  {alreadySentToLms ? "Gửi điểm lại sang LMS" : "Gửi điểm sang LMS"}
                </>
              )}
            </button>
          )}

          {/* Error message */}
          {status === "FAILED" && session.scoreCollectionError && (
            <div className="flex items-start gap-2 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{session.scoreCollectionError}</span>
            </div>
          )}

          {/* Collected at */}
          {(status === "COLLECTED" || status === "SENT_TO_LMS") && session.scoreCollectedAt && (
            <p className="text-xs text-green-400">
              Thu điểm lúc: {fmt(session.scoreCollectedAt)}
            </p>
          )}

          {/* Collect / retry button — chỉ giáo viên, khi chưa collect */}
          {canCollect && (
            <button
              onClick={handleCollect}
              disabled={collecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
            >
              {collecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang thu điểm...
                </>
              ) : (
                <>
                  <Trophy className="w-3.5 h-3.5" />
                  {status === "FAILED" ? "Thu điểm lại" : "Thu điểm"}
                </>
              )}
            </button>
          )}

          {/* Score table (giáo viên) — breakdown đầy đủ từng nhóm */}
          {isTeacher && scoresLoaded && scores.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-600">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-800 border-b border-gray-600">
                    <th className="text-left px-3 py-2 text-gray-400 font-medium">
                      Nhóm chấm
                    </th>
                    <th className="text-center px-3 py-2 text-gray-400 font-medium">
                      Điểm
                    </th>
                    <th className="text-center px-3 py-2 text-gray-400 font-medium">
                      Trung vị
                    </th>
                    <th className="text-center px-3 py-2 text-gray-400 font-medium">
                      Điểm cuối
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const nameMap = new Map(session.channels.map((c) => [c.id, c.name]));
                    return scores.map((s) => (
                      <GroupScoreSection
                        key={s.channelId}
                        score={s}
                        nameMap={nameMap}
                        sessionId={session.id}
                        isTeacher={isTeacher}
                        onScoreUpdated={handleScoreUpdated}
                      />
                    ));
                  })()}
                </tbody>
              </table>
              <p className="text-[10px] text-gray-500 px-3 py-1.5">
                Hover vào điểm cuối của từng nhóm để chỉnh sửa.
              </p>
            </div>
          )}

          {/* Điểm cuối (sinh viên) — chỉ điểm của nhóm mình, không có breakdown */}
          {!isTeacher && scoresLoaded && scores.length > 0 && (
            <div className="rounded-lg border border-gray-600 bg-gray-800/60 px-4 py-3">
              {(() => {
                const mine = scores[0];
                const showFinal =
                  mine.status === "CALCULATED" ||
                  mine.status === "SENT_TO_LMS" ||
                  mine.manuallyOverridden;
                return (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                      Điểm cuối của nhóm bạn
                    </span>
                    {showFinal && mine.finalScore != null ? (
                      <span className="text-lg font-bold text-white">
                        {mine.finalScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 italic">
                        {mine.status === "NO_SUBMISSION"
                          ? "Nhóm chưa nộp bài"
                          : mine.status === "NO_PEERS"
                          ? "Chưa có nhóm nào chấm"
                          : "Chưa có điểm"}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentSessionPanel;
