import type { GroupResponse } from "@/types/chat.types";
import { Users } from "lucide-react";

interface GroupListProps {
  groups: GroupResponse[];
  selectedGroup: GroupResponse | null;
  onGroupSelect: (group: GroupResponse) => void;
}

const GroupList = ({
  groups,
  selectedGroup,
  onGroupSelect,
}: GroupListProps) => {
  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <div className="ml-4 mb-2 space-y-1">
      {groups.map((group) => (
        <div
          key={group.id}
          onClick={() => onGroupSelect(group)}
          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
            selectedGroup?.id === group.id
              ? "bg-gray-600 text-white"
              : "hover:bg-gray-700 text-gray-300 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm truncate">{group.groupName}</span>
          {group.participants && (
            <span className="ml-auto text-xs text-gray-400">
              {group.participants.length}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default GroupList;
