import { format } from "date-fns";

interface GroupChannelModalProps {
  totalStudents: number;
  membersPerGroup: number;
  allowCrossReview: boolean;
  endTimeLocal: string;
  onMembersPerGroupChange: (value: number) => void;
  onAllowCrossReviewChange: (checked: boolean) => void;
  onEndTimeChange: (value: string) => void;
}

const GroupChannelModal = ({
  totalStudents,
  membersPerGroup,
  allowCrossReview,
  endTimeLocal,
  onMembersPerGroupChange,
  onAllowCrossReviewChange,
  onEndTimeChange,
}: GroupChannelModalProps) => {
  const minDateTime = format(new Date(), "yyyy-MM-dd'T'HH:mm");

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
            min="1"
            value={membersPerGroup}
            onChange={(e) =>
              onMembersPerGroupChange(parseInt(e.target.value) || 1)
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
              Thời gian kết thúc kênh
            </label>
          </div>
          <input
            type="datetime-local"
            value={endTimeLocal}
            min={minDateTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default GroupChannelModal;
