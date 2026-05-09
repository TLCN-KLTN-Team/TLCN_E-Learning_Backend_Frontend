import { useEffect, useMemo, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface ChannelTimerProps {
  channelId: string;
  channelName: string;
  /** UC-41: hạn nộp bài (ISO instant). Nếu thiếu, fallback `endTime`. */
  submissionDeadline?: string;
  /** UC-41: hạn chấm chéo (ISO instant). Bỏ qua nếu allowCrossReview=false. */
  crossReviewDeadline?: string | null;
  allowCrossReview?: boolean;
  /** Legacy single-deadline (datetime/string/Date). Bỏ khi UC-41 truyền 2 mốc. */
  endTime?: string | Date;
  onChannelExpired?: () => void;
}

type Phase = "OPEN" | "REVIEW" | "LOCKED";

interface PhaseTarget {
  phase: Phase;
  label: string;
  deadline: Date | null;
}

const toDate = (v: string | Date | null | undefined): Date | null => {
  if (!v) return null;
  return v instanceof Date ? v : new Date(v);
};

/**
 * Tính phase hiện tại + mốc deadline đang đếm ngược.
 * Nếu thiếu submissionDeadline → fallback dùng `endTime` legacy.
 */
const computeTarget = (
  now: Date,
  submission: Date | null,
  crossReview: Date | null,
  allowCrossReview: boolean,
  legacy: Date | null,
): PhaseTarget => {
  if (!submission && legacy) {
    return {
      phase: now < legacy ? "OPEN" : "LOCKED",
      label: "Thời gian còn lại",
      deadline: legacy,
    };
  }
  if (!submission) {
    return { phase: "LOCKED", label: "", deadline: null };
  }
  if (now < submission) {
    return { phase: "OPEN", label: "Hạn nộp bài", deadline: submission };
  }
  if (allowCrossReview && crossReview && now < crossReview) {
    return { phase: "REVIEW", label: "Hạn chấm chéo", deadline: crossReview };
  }
  return { phase: "LOCKED", label: "", deadline: null };
};

const formatRemaining = (ms: number): string => {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  if (days >= 1) {
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `Còn lại: ${days} ngày ${hours} giờ ${minutes} phút`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const ChannelTimer = ({
  channelName,
  submissionDeadline,
  crossReviewDeadline,
  allowCrossReview = false,
  endTime,
  onChannelExpired,
}: ChannelTimerProps) => {
  const submission = useMemo(() => toDate(submissionDeadline), [submissionDeadline]);
  const crossReview = useMemo(() => toDate(crossReviewDeadline), [crossReviewDeadline]);
  const legacy = useMemo(() => toDate(endTime), [endTime]);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = useMemo(
    () => computeTarget(now, submission, crossReview, allowCrossReview, legacy),
    [now, submission, crossReview, allowCrossReview, legacy],
  );

  // Fire onChannelExpired một lần khi vào phase LOCKED
  useEffect(() => {
    if (target.phase === "LOCKED" && onChannelExpired) {
      onChannelExpired();
    }
    // chỉ phụ thuộc phase, tránh spam callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.phase]);

  if (target.phase === "LOCKED") {
    return (
      <div className="flex items-center justify-center p-4 bg-red-100 border border-red-300 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
        <span className="text-red-700 font-medium">
          {allowCrossReview
            ? `Kênh "${channelName}" đã hết hạn chấm chéo`
            : `Kênh "${channelName}" đã hết hạn nộp bài`}
        </span>
      </div>
    );
  }

  const remainingMs = target.deadline
    ? target.deadline.getTime() - now.getTime()
    : 0;
  const isExpiring = remainingMs > 0 && remainingMs <= 5 * 60 * 1000;
  const isReview = target.phase === "REVIEW";

  const colorText = isReview
    ? "text-amber-600"
    : isExpiring
      ? "text-yellow-600"
      : "text-green-600";
  const colorBg = isReview
    ? "bg-amber-50 border-amber-300"
    : isExpiring
      ? "bg-yellow-100 border-yellow-300"
      : "bg-green-100 border-green-300";

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border ${colorBg}`}
    >
      <div className="flex items-center space-x-3">
        <Clock className={`w-5 h-5 ${colorText}`} />
        <div>
          <h4 className="text-gray-800 font-medium">{target.label}</h4>
          <p className="text-sm text-gray-600">
            {isReview
              ? "Đang trong giai đoạn chấm chéo. Hết hạn chấm sẽ khoá kênh."
              : "Sau hạn nộp, kênh sẽ chuyển sang trạng thái khoá."}
          </p>
        </div>
      </div>

      <div className="text-right">
        <div className={`text-2xl font-bold ${colorText}`}>
          {formatRemaining(remainingMs)}
        </div>
        {isExpiring && !isReview && (
          <p className="text-xs text-yellow-700 mt-1">⚠️ Sắp hết thời gian!</p>
        )}
      </div>
    </div>
  );
};

export default ChannelTimer;
