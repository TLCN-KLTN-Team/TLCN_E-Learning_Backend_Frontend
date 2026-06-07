import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  Boxes,
  Clock,
  MessageSquare,
  Award,
} from "lucide-react";
import groupAssignmentApi from "@/services/api/student/groupAssignmentApi";
import {
  GroupAssignmentStatus,
  type GroupAssignmentResponse,
} from "@/types/groupAssignment.types";

interface GroupAssignmentsTabProps {
  classId: number;
}

const ONGOING_STATUSES: string[] = [
  GroupAssignmentStatus.SUBMISSION,
  GroupAssignmentStatus.CROSS_REVIEW,
  GroupAssignmentStatus.COLLECTING,
];

const STATUS_LABELS: Record<string, string> = {
  [GroupAssignmentStatus.SUBMISSION]: "Đang nộp bài",
  [GroupAssignmentStatus.CROSS_REVIEW]: "Đang chấm chéo",
  [GroupAssignmentStatus.COLLECTING]: "Đang tổng hợp điểm",
  [GroupAssignmentStatus.COMPLETED]: "Đã có điểm",
  [GroupAssignmentStatus.NO_SUBMISSION]: "Không nộp bài",
  [GroupAssignmentStatus.NO_PEERS]: "Không có nhóm chấm",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  [GroupAssignmentStatus.SUBMISSION]: "bg-blue-100 text-blue-700",
  [GroupAssignmentStatus.CROSS_REVIEW]: "bg-purple-100 text-purple-700",
  [GroupAssignmentStatus.COLLECTING]: "bg-amber-100 text-amber-700",
  [GroupAssignmentStatus.COMPLETED]: "bg-green-100 text-green-700",
  [GroupAssignmentStatus.NO_SUBMISSION]: "bg-gray-200 text-gray-600",
  [GroupAssignmentStatus.NO_PEERS]: "bg-gray-200 text-gray-600",
};

const formatDate = (value: string | null): string =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";

const GroupAssignmentCard = ({ ga }: { ga: GroupAssignmentResponse }) => {
  const badgeClass =
    STATUS_BADGE_CLASSES[ga.status] || "bg-gray-200 text-gray-600";
  const hasScore = ga.finalScore !== null && ga.finalScore !== undefined;

  return (
    <div className="student-dashboard-course-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="text-lg font-semibold student-dashboard-course-title">
          {ga.title}
        </h4>
        <span
          className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full ${badgeClass}`}
        >
          {STATUS_LABELS[ga.status] || ga.status}
        </span>
      </div>

      {ga.description && (
        <p className="text-sm student-dashboard-text-muted mb-3">
          {ga.description}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Hạn nộp: {formatDate(ga.submissionDeadline)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Hạn chấm chéo: {formatDate(ga.crossReviewDeadline)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-orange-500" />
        {hasScore ? (
          <span className="font-semibold text-gray-800">
            Điểm: {ga.finalScore}
            {ga.maxScore ? ` / ${ga.maxScore}` : ""}
          </span>
        ) : (
          <span className="text-gray-500">Chưa có điểm</span>
        )}
      </div>

      {ga.evaluations.length > 0 && (
        <div className="pt-3 border-t">
          <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Nhận xét ({ga.evaluations.length})
          </h5>
          <ul className="space-y-2">
            {ga.evaluations.map((comment, index) => (
              <li
                key={index}
                className="text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-300 rounded p-3"
              >
                {comment}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const GroupAssignmentsTab = ({ classId }: GroupAssignmentsTabProps) => {
  const [assignments, setAssignments] = useState<GroupAssignmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;

    const fetchGroupAssignments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await groupAssignmentApi.getByClass(classId);
        setAssignments(data);
      } catch (err) {
        console.error("Error fetching group assignments:", err);
        setError("Đã xảy ra lỗi khi tải bài tập nhóm");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupAssignments();
  }, [classId]);

  if (isLoading) {
    return (
      <div className="student-dashboard-course-card p-8">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Đang tải bài tập nhóm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-dashboard-course-card p-6">
        <div className="flex items-start gap-3 text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Lỗi tải dữ liệu</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="student-dashboard-course-card p-6">
        <div className="text-center">
          <Boxes className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có bài tập nhóm</h3>
          <p className="student-dashboard-text-muted">
            Các bài tập nhóm của lớp sẽ được hiển thị tại đây.
          </p>
        </div>
      </div>
    );
  }

  const ongoing = assignments.filter((ga) =>
    ONGOING_STATUSES.includes(ga.status)
  );
  const finished = assignments.filter(
    (ga) => !ONGOING_STATUSES.includes(ga.status)
  );

  return (
    <div className="space-y-8">
      {ongoing.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">
            Đang diễn ra ({ongoing.length})
          </h3>
          {ongoing.map((ga) => (
            <GroupAssignmentCard key={ga.id} ga={ga} />
          ))}
        </section>
      )}

      {finished.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">
            Đã kết thúc ({finished.length})
          </h3>
          {finished.map((ga) => (
            <GroupAssignmentCard key={ga.id} ga={ga} />
          ))}
        </section>
      )}
    </div>
  );
};

export default GroupAssignmentsTab;
