import { useEffect, useState } from "react";
import {
  X,
  Hash,
  Volume2,
  MessageSquare,
  Lock,
  Search,
  UserPlus,
  UserMinus,
  Users,
  Megaphone,
  FileText,
} from "lucide-react";
import { getUsersByKeyword } from "@/services/api/workspace/workspace.api";
import { toast } from "react-toastify";
import type {
  ChannelResponse,
  WorkspaceResponse,
  UserChatInfo,
} from "@/types/chat.types";
import { ChannelType } from "@/types/chat.types";
import { createChannel } from "@/services/api/workspace/channel.api";

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceResponse | null;
  sectionId?: string | null;
  onChannelCreated?: (newChannel: ChannelResponse) => void;
}

const AddChannelModal = ({
  isOpen,
  onClose,
  workspace,
  sectionId,
  onChannelCreated,
}: AddChannelModalProps) => {
  const [selectedType, setSelectedType] = useState<ChannelType>(
    ChannelType.TEXT
  );
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Time duration states
  const [selectedDuration, setSelectedDuration] = useState<string>("5");
  const [customDuration, setCustomDuration] = useState<string>("");
  const [durationUnit, setDurationUnit] = useState<"minutes" | "hours">(
    "minutes"
  );

  // Student search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserChatInfo[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<UserChatInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search students by keyword (studentId contains keyword - ignoring case)
  const searchStudents = async (query: string): Promise<UserChatInfo[]> => {
    if (!query.trim()) return [];

    setIsSearching(true);

    try {
      const users: UserChatInfo[] = await getUsersByKeyword(query);
      setIsSearching(false);
      return users || [];
    } catch (error) {
      console.error("Error searching students:", error);
      toast.error("Không thể tìm kiếm sinh viên. Vui lòng thử lại.");
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

  const addStudent = (student: UserChatInfo) => {
    if (!selectedStudents.find((s) => s.id === student.id)) {
      setSelectedStudents([...selectedStudents, student]);
      console.log("Added student:", student);
    }
    // Keep search query for continuous adding
  };

  const addAllStudents = () => {
    const newStudents = searchResults.filter(
      (result) => !selectedStudents.find((s) => s.id === result.id)
    );
    if (newStudents.length > 0) {
      setSelectedStudents([...selectedStudents, ...newStudents]);
      setSearchQuery("");
      setSearchResults([]);
      toast.success(`Đã thêm ${newStudents.length} sinh viên`);
    }
  };

  const removeStudent = (studentId: string) => {
    setSelectedStudents(selectedStudents.filter((s) => s.id !== studentId));
  };

  // Calculate duration in minutes
  const getDurationInMinutes = (): number | undefined => {
    // Only return duration for TEXT and GROUP channel types
    if (
      selectedType !== ChannelType.TEXT &&
      selectedType !== ChannelType.GROUP
    ) {
      return undefined;
    }

    if (customDuration) {
      const duration = parseInt(customDuration);
      return durationUnit === "hours" ? duration * 60 : duration;
    }

    if (selectedDuration) {
      const duration = parseInt(selectedDuration);
      return durationUnit === "hours" ? duration * 60 : duration;
    }

    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      channelName.trim() &&
      channelDescription.trim() &&
      selectedStudents.length > 0
    ) {
      try {
        const memberIds = selectedStudents.map((student) => student.id);
        const durationInMinutes = getDurationInMinutes();

        console.log("📋 Student IDs being sent to create channel:", memberIds);
        console.log("👥 Selected students with full info:", selectedStudents);
        console.log("⏰ Duration in minutes:", durationInMinutes);

        const newChannel: ChannelResponse = await createChannel({
          workspaceId: workspace?.id || "",
          sectionId: sectionId || undefined,
          description: channelDescription.trim(),
          channelName: channelName.trim(),
          memberIds: memberIds,
          isPrivate: isPrivate,
          channelType: selectedType,
          durationInMinutes: durationInMinutes,
        });
        console.log("🚀 Creating channel with data:", newChannel);

        if (newChannel) {
          console.log("New channel created:", newChannel);

          // Call the callback to update the channel list in parent component
          if (onChannelCreated) {
            onChannelCreated(newChannel);
          }

          // Show success message
          toast.success(
            `Channel "${newChannel.channelName}" đã được tạo thành công!`
          );
        }

        // Reset form
        setChannelName("");
        setChannelDescription("");
        setSelectedType(ChannelType.TEXT);
        setIsPrivate(false);
        setSelectedStudents([]);
        setSearchQuery("");
        setSearchResults([]);
        onClose();
      } catch (error) {
        console.error("Error creating channel:", error);
        toast.error("Không thể tạo channel. Vui lòng thử lại!");
      }
    }
  };

  const handleClose = () => {
    setChannelName("");
    setChannelDescription("");
    setSelectedType(ChannelType.TEXT);
    setIsPrivate(false);
    setSelectedStudents([]);
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Reset form and close modal
        setChannelName("");
        setChannelDescription("");
        setSelectedType(ChannelType.TEXT);
        setIsPrivate(false);
        setSelectedStudents([]);
        setSearchQuery("");
        setSearchResults([]);
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

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
            <h2 className="text-xl font-semibold text-white">Create Channel</h2>
            <p className="text-sm text-gray-400 mt-1">{channelName}</p>
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
            {/* Channel Type Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
                Channel Type
              </h3>

              {/* TEXT Channel */}
              <label className="flex items-center p-3 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="channelType"
                  value={ChannelType.TEXT}
                  checked={selectedType === ChannelType.TEXT}
                  onChange={() => setSelectedType(ChannelType.TEXT)}
                  className="w-5 h-5 text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-500 focus:ring-2"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center space-x-3">
                    <Hash className="w-6 h-6 text-gray-400" />
                    <div>
                      <h4 className="text-white font-medium">Text</h4>
                      <p className="text-sm text-gray-400">
                        Kênh văn bản để gửi tin nhắn, hình ảnh và trao đổi
                      </p>
                    </div>
                  </div>
                </div>
              </label>

              {/* GROUP Channel */}
              <label className="flex items-center p-3 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="channelType"
                  value={ChannelType.GROUP}
                  checked={selectedType === ChannelType.GROUP}
                  onChange={() => setSelectedType(ChannelType.GROUP)}
                  className="w-5 h-5 text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-500 focus:ring-2"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6 text-gray-400" />
                    <div>
                      <h4 className="text-white font-medium">Group</h4>
                      <p className="text-sm text-gray-400">
                        Kênh nhóm để làm việc theo nhóm nhỏ
                      </p>
                    </div>
                  </div>
                </div>
              </label>

              {/* ANNOUNCEMENT Channel */}
              <label className="flex items-center p-3 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="channelType"
                  value={ChannelType.ANNOUNCEMENT}
                  checked={selectedType === ChannelType.ANNOUNCEMENT}
                  onChange={() => setSelectedType(ChannelType.ANNOUNCEMENT)}
                  className="w-5 h-5 text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-500 focus:ring-2"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center space-x-3">
                    <Megaphone className="w-6 h-6 text-gray-400" />
                    <div>
                      <h4 className="text-white font-medium">Announcement</h4>
                      <p className="text-sm text-gray-400">
                        Kênh thông báo chỉ giáo viên có thể gửi tin
                      </p>
                    </div>
                  </div>
                </div>
              </label>

              {/* VOICE_LIVE Channel */}
              <label className="flex items-center p-3 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="channelType"
                  value={ChannelType.VOICE_LIVE}
                  checked={selectedType === ChannelType.VOICE_LIVE}
                  onChange={() => setSelectedType(ChannelType.VOICE_LIVE)}
                  className="w-5 h-5 text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-500 focus:ring-2"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-6 h-6 text-gray-400" />
                    <div>
                      <h4 className="text-white font-medium">Voice Live</h4>
                      <p className="text-sm text-gray-400">
                        Kênh voice chat trực tiếp để trao đổi bằng giọng nói
                      </p>
                    </div>
                  </div>
                </div>
              </label>

              {/* POST Channel */}
              <label className="flex items-center p-3 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="channelType"
                  value={ChannelType.POST}
                  checked={selectedType === ChannelType.POST}
                  onChange={() => setSelectedType(ChannelType.POST)}
                  className="w-5 h-5 text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-500 focus:ring-2"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-gray-400" />
                    <div>
                      <h4 className="text-white font-medium">Post</h4>
                      <p className="text-sm text-gray-400">
                        Kênh đăng bài để tổ chức các bài thảo luận
                      </p>
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* Channel Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200 uppercase tracking-wide">
                Channel Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {selectedType === ChannelType.TEXT && (
                    <Hash className="w-5 h-5 text-gray-400" />
                  )}
                  {selectedType === ChannelType.VOICE_LIVE && (
                    <Volume2 className="w-5 h-5 text-gray-400" />
                  )}
                  {selectedType === ChannelType.POST && (
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  )}
                  {selectedType === ChannelType.GROUP && (
                    <Users className="w-5 h-5 text-gray-400" />
                  )}
                  {selectedType === ChannelType.ANNOUNCEMENT && (
                    <Megaphone className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="new-channel"
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Description  */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200 uppercase tracking-wide">
                Description
              </label>
              <textarea
                placeholder="Enter channel description"
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
                maxLength={200}
                onChange={(e) => setChannelDescription(e.target.value)}
              />
            </div>

            {/* Student Search and Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200 uppercase tracking-wide">
                Add Members
              </label>
              <p className="text-xs text-gray-400 mb-2">
                💡 Gõ bất kỳ phần nào của mã số sinh viên để tìm kiếm (VD: 2051,
                1200, ...)
              </p>

              {/* Search Input */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Nhập mã số sinh viên (VD: 2051120001)..."
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
                <div className="space-y-2">
                  {/* Add All Button */}
                  <button
                    type="button"
                    onClick={addAllStudents}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Thêm tất cả ({searchResults.length} sinh viên)</span>
                  </button>

                  {/* Results List */}
                  <div className="bg-gray-800 rounded-lg border border-gray-600 max-h-48 overflow-y-auto">
                    {searchResults.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => addStudent(student)}
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
                            {student.fullName || "Không có tên"}
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

            {/* TIME TO END CHANNEL - Only for TEXT and GROUP Channel */}
            {(selectedType === ChannelType.TEXT ||
              selectedType === ChannelType.GROUP) && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-gray-400">⏰</div>
                  <div>
                    <h4 className="text-white font-medium">Channel Duration</h4>
                    <p className="text-sm text-gray-400">
                      Set how long this channel will remain active.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Preset Duration Options */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300 font-medium">
                      Quick Duration
                    </label>
                    <select
                      value={
                        selectedDuration
                          ? `${selectedDuration}-${durationUnit}`
                          : ""
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          const [value, unit] = e.target.value.split("-");
                          setSelectedDuration(value);
                          setDurationUnit(unit as "minutes" | "hours");
                          setCustomDuration("");
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="5-minutes">5 minutes</option>
                      <option value="15-minutes">15 minutes</option>
                      <option value="45-minutes">45 minutes</option>
                      <option value="1-hours">1 hour</option>
                    </select>
                  </div>

                  {/* Custom Duration Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300 font-medium">
                      Custom Duration
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={customDuration}
                        onChange={(e) => {
                          setCustomDuration(e.target.value);
                          if (e.target.value) {
                            setSelectedDuration("");
                          }
                        }}
                        placeholder="Enter duration"
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <select
                        value={durationUnit}
                        onChange={(e) =>
                          setDurationUnit(e.target.value as "minutes" | "hours")
                        }
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                      </select>
                    </div>
                  </div>

                  {/* Duration Summary */}
                  <div className="p-3 bg-gray-800 rounded-md">
                    <p className="text-sm text-gray-300">
                      <span className="text-white font-medium">Duration: </span>
                      {customDuration
                        ? `${customDuration} ${durationUnit}`
                        : selectedDuration
                        ? `${selectedDuration} ${durationUnit}`
                        : "Not set"}
                    </p>
                    {(customDuration || selectedDuration) && (
                      <>
                        <p className="text-xs text-gray-400 mt-1">
                          Channel will automatically expire after this duration.
                        </p>
                        <p className="text-xs text-green-400 mt-1">
                          <span className="font-medium">Will expire in: </span>
                          {customDuration
                            ? `${customDuration} ${durationUnit}`
                            : selectedDuration
                            ? `${selectedDuration} ${durationUnit}`
                            : "15 minutes"}{" "}
                          from creation time
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Private Channel Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <h4 className="text-white font-medium">Private Channel</h4>
                  <p className="text-sm text-gray-400">
                    Only members will be able to view this channel.
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

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-600">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!channelName.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                Create Channel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddChannelModal;
