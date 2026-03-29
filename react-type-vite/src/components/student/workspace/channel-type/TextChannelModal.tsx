import { Search, UserMinus, UserPlus } from "lucide-react";
import type { UserChatInfo } from "@/types/chat.types";

interface TextChannelModalProps {
  searchQuery: string;
  isSearching: boolean;
  searchResults: UserChatInfo[];
  selectedStudents: UserChatInfo[];
  onSearchChange: (query: string) => void;
  onAddAllStudents: () => void;
  onAddStudent: (student: UserChatInfo) => void;
  onRemoveStudent: (studentId: string) => void;
}

const TextChannelModal = ({
  searchQuery,
  isSearching,
  searchResults,
  selectedStudents,
  onSearchChange,
  onAddAllStudents,
  onAddStudent,
  onRemoveStudent,
}: TextChannelModalProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-200 uppercase tracking-wide">
        Add Members
      </label>
      <p className="text-xs text-gray-400 mb-2">
        💡 Gõ bất kỳ phần nào của mã số sinh viên để tìm kiếm (VD: 2051, 1200,
        ...)
      </p>

      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Nhập mã số sinh viên (VD: 2051120001)..."
          className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onAddAllStudents}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm tất cả ({searchResults.length} sinh viên)</span>
          </button>

          <div className="bg-gray-800 rounded-lg border border-gray-600 max-h-48 overflow-y-auto">
            {searchResults.map((student) => (
              <div
                key={student.id}
                onClick={() => onAddStudent(student)}
                className="flex items-center justify-between p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0"
              >
                <div>
                  <p className="text-white font-medium">
                    {student.fullName || "Không có tên"}
                  </p>
                </div>
                <UserPlus className="w-5 h-5 text-green-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedStudents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-200">
            Thành viên đã chọn ({selectedStudents.length})
          </p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-2 bg-gray-800 rounded-lg border border-gray-600"
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {student.fullName || "Không có tên"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveStudent(student.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextChannelModal;
