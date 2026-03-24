import type { UserResponse } from "@/types/chat.types";
import { X, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {channelMemberApi} from "@/services/api/workspace/channelMember.api";

interface ParticipantsListProps {
  participants: UserResponse[];
  isVisible: boolean;
  onClose: () => void;
  channelId?: string;
}

const ParticipantsList = ({
  isVisible,
  onClose,
  channelId,
}: ParticipantsListProps) => {
  const [members, setMembers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!channelId || !isVisible) return;

      setLoading(true);
      setError(null);
      try {
        const data = await channelMemberApi.getActiveChannelMembers(channelId);
        setMembers(data);
        console.log("Fetched channel members:", data);
      } catch (err) {
        console.error("Error fetching channel members:", err);
        const errorMessage = "Không thể tải danh sách thành viên.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [channelId, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="w-64 bg-gray-800 border-l border-gray-600 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-600 flex items-center justify-between">
        <h3 className="text-white font-semibold">
          Danh sách thành viên
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
            Loading members...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-400">{error}</div>
        ) : members.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            Không có thành viên nào
          </div>
        ) : (
          <div className="p-2">
            {members.map((member) => {
              return (
                <div
                  key={member.id}
                  className="flex items-center p-2 hover:bg-gray-700 rounded-md transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                    {"avatarUrl" in member && member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.nickname}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-300" />
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      {member.owner ? (
                        <span className="text-yellow-400 text-sm font-semibold truncate">
                          {member.nickname}
                        </span>
                      ) : (
                        <span className="text-white text-sm font-medium truncate">
                          {member.nickname}
                        </span>
                      )}
                    </div>
                    {member.owner ? (
                      <div className="text-xs text-yellow-400/80 truncate">
                        <span>Giáo viên</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 truncate">
                        <span>MSSV: {member.studentId}</span>
                      </div>
                    )}
                  </div>

                  {/* Online Status - placeholder for future implementation */}
                  <div className="flex items-center">
                    <div
                      className="w-2 h-2 rounded-full bg-green-500"
                      title="Online"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-600 text-xs text-gray-400">
        {loading ? "Loading..." : `${members.length} thành viên`}
      </div>
    </div>
  );
};

export default ParticipantsList;
