import { useCallback, useEffect, useState } from "react";
import { X, Hash, Users } from "lucide-react";
import { addHours, addMinutes, format, parseISO } from "date-fns";
import { getUsersByKeyword } from "@/services/api/workspace/workspace.api";
import { toast } from "react-toastify";
import type {
  UserChatInfo,
  BulkRandomChannelRequest,
  BulkRandomChannelResponse,
} from "@/types/chat.types";
import { ChannelType } from "@/types/chat.types";
import GroupChannelModal from "../channel-type/GroupChannelModal";
import TextChannelModal from "../channel-type/TextChannelModal";
import { useParams } from "react-router-dom";

import { getStudentCountBySectionId } from "@/services/api/workspace/section.api";
import { bulkRandomCreateChannels } from "@/services/api/workspace/channel.api";

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelCreated?: (sectionId: string) => void;
  sectionId?: string;
}

const AddChannelModal = ({
  isOpen,
  onClose,
  onChannelCreated,
  sectionId,
}: AddChannelModalProps) => {
  const { sectionId: sectionIdFromParams } = useParams();
  const targetSectionId = sectionId ?? sectionIdFromParams;

  const [selectedType, setSelectedType] = useState<ChannelType>(
    ChannelType.GROUP,
  );
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");

  // GROUP channel specific states
  const [membersPerGroup, setMembersPerGroup] = useState<number>(1);
  const [allowCrossReview, setAllowCrossReview] = useState(false);
  const [totalStudents, setTotalStudents] = useState<number>(0); // TODO: Get from section/workspace

  // UC-41: 2 mốc deadline (datetime-local string).
  // submissionDeadline luôn cần; crossReviewDeadline chỉ khi allowCrossReview=true.
  const [submissionDeadlineLocal, setSubmissionDeadlineLocal] = useState<string>(
    () => format(addMinutes(new Date(), 15), "yyyy-MM-dd'T'HH:mm"),
  );
  const [crossReviewDeadlineLocal, setCrossReviewDeadlineLocal] = useState<string>(
    () => format(addHours(addMinutes(new Date(), 15), 2), "yyyy-MM-dd'T'HH:mm"),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student search states (only for TEXT)
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
        (student) => !selectedStudents.find((s) => s.id === student.id),
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
      (result) => !selectedStudents.find((s) => s.id === result.id),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedType === ChannelType.GROUP) {
      if (!channelName.trim()) {
        toast.error("Vui lòng điền đầy đủ thông tin");
        return;
      }
      if (membersPerGroup < 1) {
        toast.error("Số thành viên cho từng nhóm phải lớn hơn 0");
        return;
      }
    }

    if (!targetSectionId) {
      toast.error("Không xác định được phần học. Vui lòng thử lại.");
      return;
    }

    if (selectedType === ChannelType.GROUP) {
      if (!submissionDeadlineLocal) {
        toast.error("Vui lòng chọn hạn nộp bài hợp lệ");
        return;
      }
      if (allowCrossReview) {
        if (!crossReviewDeadlineLocal) {
          toast.error("Vui lòng chọn hạn chấm chéo");
          return;
        }
        if (
          parseISO(crossReviewDeadlineLocal) <=
          addHours(parseISO(submissionDeadlineLocal), 1)
        ) {
          toast.error("Hạn chấm chéo phải sau hạn nộp ít nhất 1 giờ");
          return;
        }
      }
    }

    const requestData: BulkRandomChannelRequest = {
      sectionId: targetSectionId,
      description: channelDescription.trim(),
      channelName: channelName.trim(),
      channelType: selectedType,
      submissionDeadline: submissionDeadlineLocal,
      crossReviewDeadline: allowCrossReview
        ? crossReviewDeadlineLocal
        : undefined,
      membersPerGroup: membersPerGroup,
      allowCrossReview: allowCrossReview,
    };

    setIsSubmitting(true);
    try {
      const newChannel: BulkRandomChannelResponse =
        await bulkRandomCreateChannels(requestData);

      if (newChannel) {
        const count = newChannel.channels?.length ?? 0;
        toast.success(
          count > 1
            ? `Đã tạo thành công ${count} kênh!`
            : `Đã tạo kênh "${channelName.trim()}" thành công!`,
        );
        onChannelCreated?.(targetSectionId);
      }

      handleClose();
    } catch (error) {
      console.error("Error creating channel:", error);
      toast.error("Không thể tạo channel. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    setChannelName("");
    setChannelDescription("");
    setSelectedType(ChannelType.GROUP);

    // Reset GROUP states
    setMembersPerGroup(1);
    setAllowCrossReview(false);
    setSubmissionDeadlineLocal(
      format(addMinutes(new Date(), 15), "yyyy-MM-dd'T'HH:mm"),
    );
    setCrossReviewDeadlineLocal(
      format(addHours(addMinutes(new Date(), 15), 2), "yyyy-MM-dd'T'HH:mm"),
    );

    // Reset TEXT states
    setSelectedStudents([]);
    setSearchQuery("");
    setSearchResults([]);

    onClose();
  }, [onClose]);

  useEffect(() => {
    const fetchStudentCount = async () => {
      if (targetSectionId) {
        const studentCount = await getStudentCountBySectionId(targetSectionId);
        console.log("Fetched student count for section:", studentCount);
        setTotalStudents(studentCount);
      }
    };

    fetchStudentCount();
  }, [targetSectionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300"
        onClick={isSubmitting ? undefined : handleClose}
      />

      {/* Modal Panel */}
      <div className="relative bg-gray-700 rounded-lg w-[520px] max-w-[95vw] max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white">Tạo kênh</h2>
            <p className="text-sm text-gray-400 mt-1">{channelName}</p>
          </div>
          <button
            onClick={isSubmitting ? undefined : handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                Loại kênh
              </h3>

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
                        Kênh nhóm để làm bài tập theo nhóm nhỏ
                      </p>
                    </div>
                  </div>
                </div>
              </label>

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
                        Kênh văn bản để gửi tin nhắn trao đổi chung
                      </p>
                    </div>
                  </div>
                </div>
              </label>

              {/* VOICE Channel - Temporarily Hidden */}
              {/* <label className="flex items-center p-3 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors opacity-50 pointer-events-none">
                <input
                  type="radio"
                  name="channelType"
                  value={ChannelType.VOICE}
                  disabled
                  className="w-5 h-5 text-indigo-500 bg-gray-600 border-gray-500"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-6 h-6 text-gray-400" />
                    <div>
                      <h4 className="text-white font-medium">Voice Live (Coming Soon)</h4>
                      <p className="text-sm text-gray-400">
                        Kênh voice chat trực tiếp để trao đổi bằng giọng nói
                      </p>
                    </div>
                  </div>
                </div>
              </label> */}
            </div>

            {/* Channel Name */}
            {selectedType == ChannelType.GROUP ? (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-200 uppercase tracking-wide">
                  Tên bài tập
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="Bài tập giữa kì"
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    maxLength={100}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-200 uppercase tracking-wide">
                  Tên kênh
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Hash className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="Tên kênh"
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    maxLength={100}
                  />
                </div>
              </div>
            )}

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

            {selectedType === ChannelType.GROUP && (
              <GroupChannelModal
                totalStudents={totalStudents}
                membersPerGroup={membersPerGroup}
                allowCrossReview={allowCrossReview}
                submissionDeadlineLocal={submissionDeadlineLocal}
                crossReviewDeadlineLocal={crossReviewDeadlineLocal}
                onMembersPerGroupChange={setMembersPerGroup}
                onAllowCrossReviewChange={setAllowCrossReview}
                onSubmissionDeadlineChange={setSubmissionDeadlineLocal}
                onCrossReviewDeadlineChange={setCrossReviewDeadlineLocal}
              />
            )}

            {selectedType === ChannelType.TEXT && (
              <TextChannelModal
                searchQuery={searchQuery}
                isSearching={isSearching}
                searchResults={searchResults}
                selectedStudents={selectedStudents}
                onSearchChange={handleSearch}
                onAddAllStudents={addAllStudents}
                onAddStudent={addStudent}
                onRemoveStudent={removeStudent}
              />
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-600">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-300 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!channelName.trim() || isSubmitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Đang tạo...
                  </>
                ) : (
                  "Tạo kênh"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddChannelModal;
