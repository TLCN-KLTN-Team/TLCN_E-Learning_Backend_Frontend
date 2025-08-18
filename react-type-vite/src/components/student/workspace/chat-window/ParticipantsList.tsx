import type { Participant } from "@/types/chat.types";
import { X, User } from "lucide-react";

interface ParticipantsListProps {
  participants: Participant[];
  isVisible: boolean;
  onClose: () => void;
}

const ParticipantsList = ({
  participants,
  isVisible,
  onClose,
}: ParticipantsListProps) => {
  if (!isVisible) return null;

  const getFullName = (participant: Participant) => {
    const firstName = participant.firstName || "";
    const lastName = participant.lastName || "";
    return `${firstName} ${lastName}`.trim() || "Unknown User";
  };

  return (
    <div className="w-64 bg-gray-800 border-l border-gray-600 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-600 flex items-center justify-between">
        <h3 className="text-white font-semibold">
          Participants ({participants.length})
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
        {participants.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            No participants found
          </div>
        ) : (
          <div className="p-2">
            {participants.map((participant, index) => (
              <div
                key={participant.userId || index}
                className="flex items-center p-2 hover:bg-gray-700 rounded-md transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                  {participant.avatarUrl ? (
                    <img
                      src={participant.avatarUrl}
                      alt={getFullName(participant)}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-300" />
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className="text-white text-sm font-medium truncate">
                      {getFullName(participant)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    ID: {participant.userId}
                  </div>
                </div>

                {/* Online Status - placeholder for future implementation */}
                <div className="flex items-center">
                  <div
                    className="w-2 h-2 rounded-full bg-green-500"
                    title="Online"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-600 text-xs text-gray-400">
        {participants.length} participants
      </div>
    </div>
  );
};

export default ParticipantsList;
