import { useEffect, useState } from "react";
import { X, Lock, Search, UserPlus, UserMinus, Users } from "lucide-react";
import {
  getMembersInChannelByMssv,
  createGroup,
} from "@/services/api/workspace/group.api";
import { toast } from "react-toastify";
import type {
  CreateGroupRequest,
  GroupResponse,
  UserResponse,
} from "@/types/chat.types";
import { useParams } from "react-router-dom";

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: GroupResponse) => void;
}

const AddGroupModal = ({
  isOpen,
  onClose,
  onGroupCreated,
}: AddGroupModalProps) => {
  const { channelId } = useParams<{
    workspaceId: string;
    channelId: string;
  }>();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Student search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<UserResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search students function using real API
  const searchStudents = async (query: string): Promise<UserResponse[]> => {
    if (!query.trim() || !channelId) return [];

    setIsSearching(true);

    try {
      const members = await getMembersInChannelByMssv(channelId, query);
      // Convert UserProfileResponse to UserResponse format
      const convertedMembers: UserResponse[] = members.map((member) => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        mssv: member.mssv,
        avatarUrl: member.avatar,
        owner: member.owner,
      }));
      setIsSearching(false);
      return convertedMembers || [];
    } catch (error) {
      console.error("Error searching students:", error);
      toast.error("Không thể tìm kiếm thành viên. Vui lòng thử lại.");
      setIsSearching(false);
      return [];
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchStudents(query);
      const leftStudents = results.filter(
        (student) => !selectedStudents.find((s) => s.id === student.id)
      );
      setSearchResults(leftStudents);
    } else {
      setSearchResults([]);
    }
  };

  const addStudent = (student: UserResponse) => {
    if (!selectedStudents.find((s) => s.id === student.id)) {
      setSelectedStudents([...selectedStudents, student]);
      console.log("Added student:", student);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeStudent = (studentId: string) => {
    setSelectedStudents(selectedStudents.filter((s) => s.id !== studentId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || !groupName.trim() || selectedStudents.length === 0) {
      toast.warning(
        "Vui lòng điền đầy đủ thông tin và chọn ít nhất 1 thành viên"
      );
      return;
    }

    setIsLoading(true);
    try {
      const request: CreateGroupRequest = {
        channelId: channelId,
        name: groupName.trim(),
        description: description.trim() || undefined,
        memberIds: selectedStudents.map((student) => student.id),
      };

      // Call API to create group
      const newGroup = await createGroup(request);

      onGroupCreated(newGroup);
      toast.success(`Nhóm "${newGroup.groupName}" đã được tạo thành công!`);
      handleClose();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Không thể tạo nhóm. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName("");
    setDescription("");
    setIsPrivate(false);
    setSelectedStudents([]);
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300"
        onClick={handleClose}
      />

      {/* Modal Panel */}
      <div className="relative bg-gray-700 rounded-lg w-[520px] max-w-[95vw] max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white">Tạo Nhóm Mới</h2>
            <p className="text-sm text-gray-400 mt-1">
              {groupName || "Nhập tên nhóm"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#4b5563 #1f2937",
          }}
        >
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Group Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200 uppercase tracking-wide">
                Tên Nhóm
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ví dụ: Nhóm 1, Team A..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={50}
                  required
                />
              </div>
              <p className="text-xs text-gray-400">
                {groupName.length}/50 ký tự
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200 uppercase tracking-wide">
                Mô Tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về nhóm..."
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-400">
                {description.length}/200 ký tự
              </p>
            </div>

            {/* Student Search and Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200 uppercase tracking-wide">
                Thêm Thành Viên
              </label>

              {/* Search Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tìm sinh viên theo mã số hoặc tên..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="bg-gray-800 rounded-lg border border-gray-600 max-h-48 overflow-y-auto">
                  {searchResults.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => addStudent(student)}
                      className="flex items-center justify-between p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {`${student.firstName || ""} ${
                            student.lastName || ""
                          }`.trim() || "Không có tên"}
                        </p>
                        <p className="text-sm text-gray-400">{student.mssv}</p>
                      </div>
                      <UserPlus className="w-5 h-5 text-green-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Students */}
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
                            {`${student.firstName || ""} ${
                              student.lastName || ""
                            }`.trim() || "Không có tên"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {student.mssv}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStudent(student.id)}
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

            {/* Private Group Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <h4 className="text-white font-medium">Nhóm Riêng Tư</h4>
                  <p className="text-sm text-gray-400">
                    Chỉ thành viên mới có thể xem nhóm này
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Info Note */}
            <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded p-3">
              <p className="text-sm text-blue-300">
                💡 Sau khi tạo nhóm, bạn có thể quản lý thành viên và quyền truy
                cập
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-600">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={
                  !groupName.trim() ||
                  selectedStudents.length === 0 ||
                  isLoading
                }
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isLoading ? "Đang tạo..." : "Tạo Nhóm"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddGroupModal;
