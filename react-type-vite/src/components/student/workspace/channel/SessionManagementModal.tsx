import { useEffect, useState } from "react";
import { X, Trophy, AlertCircle, CheckCircle2, Loader2, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "react-toastify";
import { useAuth } from "@/context/auth-context/useAuth";
import type {
  AssignmentSessionResponse,
  BasicChannelResponse,
  GroupFinalScoreResponse,
  ScoreCollectionStatus,
} from "@/types/chat.types";
import {
  collectSessionScores,
  getSessionsBySectionId,
  getSessionScores,
} from "@/services/api/workspace/channel.api";

interface SessionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionName: string;
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

const StatusBadge = ({ status }: { status: ScoreCollectionStatus | null | undefined }) => {
  switch (status) {
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

const ScoreStatusLabel = ({ status }: { status: string | null | undefined }) => {
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

const ScoreTable = ({
  scores,
  channels,
}: {
  scores: GroupFinalScoreResponse[];
  channels: BasicChannelResponse[];
}) => {
  const nameMap = new Map(channels.map((c) => [c.id, c.name]));

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-600">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-750 border-b border-gray-600">
            <th className="text-left px-3 py-2 text-gray-400 font-medium">Nhóm</th>
            <th className="text-center px-3 py-2 text-gray-400 font-medium">Tự chấm</th>
            <th className="text-center px-3 py-2 text-gray-400 font-medium">Median</th>
            <th className="text-center px-3 py-2 text-gray-400 font-medium">Điểm cuối</th>
            <th className="text-center px-3 py-2 text-gray-400 font-medium">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s) => (
            <tr key={s.channelId} className="border-b border-gray-700 hover:bg-gray-700/30">
              <td className="px-3 py-2 text-gray-200 font-medium">
                {nameMap.get(s.channelId) ?? s.channelId.slice(-6)}
              </td>
              <td className="px-3 py-2 text-center text-gray-300">
                {s.selfScore != null ? s.selfScore.toFixed(1) : "—"}
              </td>
              <td className="px-3 py-2 text-center text-gray-300">
                {s.medianPeerScore != null ? s.medianPeerScore.toFixed(1) : "—"}
              </td>
              <td className="px-3 py-2 text-center">
                {s.finalScore != null ? (
                  <span className="font-semibold text-white">
                    {s.finalScore.toFixed(1)}
                    {s.usedSelfScore && (
                      <span className="ml-1 text-indigo-400 text-xs" title="Dùng điểm tự chấm">
                        ✓
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-center">
                <ScoreStatusLabel status={s.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SessionCard = ({
  session,
  isTeacher,
  onCollect,
}: {
  session: AssignmentSessionResponse;
  isTeacher: boolean;
  onCollect: (sessionId: string) => Promise<void>;
}) => {
  const [scores, setScores] = useState<GroupFinalScoreResponse[]>([]);
  const [collecting, setCollecting] = useState(false);
  const [scoresLoaded, setScoresLoaded] = useState(false);

  const ended = isSessionEnded(session);
  const status = session.scoreCollectionStatus;
  const canCollect = isTeacher && ended && status !== "COLLECTED" && status !== "COLLECTING";

  // Auto-load scores nếu đã collect
  useEffect(() => {
    if (status === "COLLECTED" && !scoresLoaded) {
      getSessionScores(session.id)
        .then(setScores)
        .catch(() => {})
        .finally(() => setScoresLoaded(true));
    }
  }, [session.id, status, scoresLoaded]);

  const handleCollect = async () => {
    setCollecting(true);
    try {
      const result = await onCollect(session.id);
      setScores(result as unknown as GroupFinalScoreResponse[]);
      setScoresLoaded(true);
    } finally {
      setCollecting(false);
    }
  };

  const progress = session.totalChannels > 0
    ? Math.round((session.submittedCount / session.totalChannels) * 100)
    : 0;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-white font-semibold truncate">{session.name || "Phiên làm bài"}</h3>
          {session.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{session.description}</p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Deadlines */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="text-gray-500">Hạn nộp:</span>{" "}
          <span className="text-gray-300">{fmt(session.submissionDeadline)}</span>
        </div>
        {session.allowCrossReview && (
          <div>
            <span className="text-gray-500">Hạn chấm chéo:</span>{" "}
            <span className="text-gray-300">{fmt(session.crossReviewDeadline)}</span>
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

      {/* Error message */}
      {status === "FAILED" && session.scoreCollectionError && (
        <div className="flex items-start gap-2 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-300">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{session.scoreCollectionError}</span>
        </div>
      )}

      {/* Collected at */}
      {status === "COLLECTED" && session.scoreCollectedAt && (
        <p className="text-xs text-green-400">
          Thu điểm lúc: {fmt(session.scoreCollectedAt)}
        </p>
      )}

      {/* Collect button */}
      {canCollect && (
        <button
          onClick={handleCollect}
          disabled={collecting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {collecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang thu điểm...
            </>
          ) : (
            <>
              <Trophy className="w-4 h-4" />
              {status === "FAILED" ? "Thu điểm lại" : "Thu điểm"}
            </>
          )}
        </button>
      )}

      {/* Score table */}
      {scoresLoaded && scores.length > 0 && (
        <ScoreTable scores={scores} channels={session.channels} />
      )}
    </div>
  );
};

export const SessionManagementModal = ({
  isOpen,
  onClose,
  sectionId,
  sectionName,
}: SessionManagementModalProps) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AssignmentSessionResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const isTeacher =
    user?.roles?.includes("educator") ||
    user?.role === "educator" ||
    user?.roles?.includes("EDUCATOR") ||
    user?.role === "EDUCATOR" ||
    false;

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getSessionsBySectionId(sectionId)
      .then(setSessions)
      .catch(() => toast.error("Không thể tải thông tin phiên làm bài"))
      .finally(() => setLoading(false));
  }, [isOpen, sectionId]);

  const handleCollect = async (sessionId: string): Promise<GroupFinalScoreResponse[]> => {
    const scores = await collectSessionScores(sessionId);
    // Cập nhật status trong state (backend đã COLLECTED sau khi collect thành công)
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, scoreCollectionStatus: "COLLECTED" as ScoreCollectionStatus }
          : s,
      ),
    );
    toast.success("Thu điểm thành công!");
    return scores;
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-gray-700 rounded-lg w-[620px] max-w-[95vw] max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white">Quản lý phiên điểm</h2>
              <p className="text-xs text-gray-400 truncate">{sectionName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Đang tải...
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2">
              <Trophy className="w-10 h-10 opacity-30" />
              <p className="text-sm">Section này chưa có phiên bài tập nhóm nào.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isTeacher={isTeacher}
                onCollect={handleCollect}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
