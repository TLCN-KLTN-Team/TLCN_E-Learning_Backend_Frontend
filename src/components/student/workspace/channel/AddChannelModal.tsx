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
} from "lucide-react";
import { getStudentsByMSSV } from "@/services/api/workspaceApi";
import { toast } from "react-toastify";
import type {
  ChannelResponse,
  UserResponse,
  WorkspaceResponse,
} from "@/types/chat.types";
import { createChannel } from "@/services/api/channelApi";

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceResponse | null;
  onChannelCreated?: (newChannel: ChannelResponse) => void;
}

type ChannelType = "text" | "voice" | "forum";

const AddChannelModal = ({
  isOpen,
  onClose,
  workspace,
  onChannelCreated,
}: AddChannelModalProps) => {
  const [selectedType, setSelectedType] = useState<ChannelType>("text");
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Student search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<UserResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search students function using real API
  const searchStudents = async (query: string): Promise<UserResponse[]> => {
    if (!query.trim()) return [];

    setIsSearching(true);

    try {
      const studentsByMSSV: UserResponse[] = await getStudentsByMSSV(query);
      setIsSearching(false);
      return studentsByMSSV || [];
    } catch (error) {
      console.error("Error searching students:", error);
      setIsSearching(false);
      return [];
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchStudents(query);
      setSearchResults(results);
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
    if (
      channelName.trim() &&
      channelDescription.trim() &&
      selectedStudents.length > 0
    ) {
      try {
        const newChannel: ChannelResponse = await createChannel({
          workspaceId: workspace?.id || "",
          description: channelDescription.trim(),
          name: channelName.trim(),
          memberIds: selectedStudents.map((student) => student.id),
        });

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
        setSelectedType("text");
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
    setSelectedType("text");
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
        setSelectedType("text");
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

              {/* Text Channel */}
              <label className="flex items-center p-3 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="channelType"
                  value="text"
                  checked={selectedType === "text"}
                  onChange={(e) =>
                    setSelectedType(e.target.value as ChannelType)
                  }
                  className="w-5 h-5 text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-500 focus:ring-2"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center space-x-3">
                    <Hash className="w-6 h-6 text-gray-400" />
                    <div>
                      <h4 className="text-white font-medium">Text</h4>
                      <p className="text-sm text-gray-400">
                        Send messages, images, GIFs, emoji, opinions, and puns
                      </p>
                    </div>
                  </div>
                </div>
              </label>

              {/* Voice Channel */}
              {/* <label className="flex items-center p-3 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors">
              <input
                type="radio"
                name="channelType"
                value="voice"
                checked={selectedType === "voice"}
                onChange={(e) => setSelectedType(e.target.value as ChannelType)}
                className="w-5 h-5 text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-500 focus:ring-2"
              />
              <div className="ml-4 flex-1">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-6 h-6 text-gray-400" />
                  <div>
                    <h4 className="text-white font-medium">Voice</h4>
                    <p className="text-sm text-gray-400">
                      Hang out together with voice, video, and screen share
                    </p>
                  </div>
                </div>
              </div>
            </label> */}

              {/* Forum Channel */}
              {/* <label className="flex items-center p-3 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors">
              <input
                type="radio"
                name="channelType"
                value="forum"
                checked={selectedType === "forum"}
                onChange={(e) => setSelectedType(e.target.value as ChannelType)}
                className="w-5 h-5 text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-500 focus:ring-2"
              />
              <div className="ml-4 flex-1">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-6 h-6 text-gray-400" />
                  <div>
                    <h4 className="text-white font-medium">Forum</h4>
                    <p className="text-sm text-gray-400">
                      Create a space for organized discussions
                    </p>
                    <button
                      type="button"
                      className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </label> */}
            </div>

            {/* Channel Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200 uppercase tracking-wide">
                Channel Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {selectedType === "text" && (
                    <Hash className="w-5 h-5 text-gray-400" />
                  )}
                  {selectedType === "voice" && (
                    <Volume2 className="w-5 h-5 text-gray-400" />
                  )}
                  {selectedType === "forum" && (
                    <MessageSquare className="w-5 h-5 text-gray-400" />
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
