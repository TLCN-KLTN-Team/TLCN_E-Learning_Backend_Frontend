import { addHours, format, parseISO } from "date-fns";

interface GroupChannelModalProps {
  totalStudents: number;
  membersPerGroup: number;
  allowCrossReview: boolean;
  /** UC-41: hạn nộp bài (datetime-local). Bắt buộc */
  submissionDeadlineLocal: string;
  /** UC-41: hạn chấm chéo (datetime-local). Hiện khi allowCrossReview=true, phải > submission + 1h */
  crossReviewDeadlineLocal: string;
  onMembersPerGroupChange: (value: number) => void;
  onAllowCrossReviewChange: (checked: boolean) => void;
  onSubmissionDeadlineChange: (value: string) => void;
  onCrossReviewDeadlineChange: (value: string) => void;
}

const DATETIME_LOCAL_FMT = "yyyy-MM-dd'T'HH:mm";

const GroupChannelModal = ({
  totalStudents,
  membersPerGroup,
  allowCrossReview,
  submissionDeadlineLocal,
  crossReviewDeadlineLocal,
  onMembersPerGroupChange,
  onAllowCrossReviewChange,
  onSubmissionDeadlineChange,
  onCrossReviewDeadlineChange,
}: GroupChannelModalProps) => {
  const minSubmissionDateTime = format(new Date(), DATETIME_LOCAL_FMT);
  const minCrossReviewDateTime = submissionDeadlineLocal
    ? format(addHours(parseISO(submissionDeadlineLocal), 1), DATETIME_LOCAL_FMT)
    : minSubmissionDateTime;

  const crossReviewError =
    allowCrossReview &&
    crossReviewDeadlineLocal &&
    submissionDeadlineLocal &&
    parseISO(crossReviewDeadlineLocal) <=
      addHours(parseISO(submissionDeadlineLocal), 1);

  return (
    <div className="space-y-4">
      <div className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
          Cấu hình nhóm
        </h3>

        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
          <span className="text-sm text-gray-300">
            Tổng số sinh viên trong Section:
          </span>
          <span className="text-lg font-bold text-indigo-400">
            {totalStudents} sinh viên
          </span>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-200">
            Số lượng thành viên trong một nhóm
          </label>
          <input
            type="number"
            min="2"
            value={membersPerGroup}
            onChange={(e) =>
              onMembersPerGroupChange(parseInt(e.target.value) || 2)
            }
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
          <div>
            <h4 className="text-white font-medium">Chấm bài chéo</h4>
            <p className="text-sm text-gray-400">
              Cho phép các nhóm chấm bài cho nhau
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={allowCrossReview}
              onChange={(e) => onAllowCrossReviewChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 text-gray-400">⏰</div>
            <label className="text-sm text-gray-300 font-medium">
              Hạn nộp bài
            </label>
          </div>
          <input
            type="datetime-local"
            value={submissionDeadlineLocal}
            min={minSubmissionDateTime}
            onChange={(e) => onSubmissionDeadlineChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {allowCrossReview && (
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 text-gray-400">📝</div>
              <label className="text-sm text-gray-300 font-medium">
                Hạn chấm chéo
              </label>
            </div>
            <input
              type="datetime-local"
              value={crossReviewDeadlineLocal}
              min={minCrossReviewDateTime}
              onChange={(e) => onCrossReviewDeadlineChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {crossReviewError && (
              <p className="text-xs text-red-400">
                Hạn chấm chéo phải sau hạn nộp ít nhất 1 giờ.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChannelModal;
