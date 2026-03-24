import { getAvartarFromName } from "@/utils/callApiUtils";
import type { WorkspaceResponse } from "@/types/chat.types";

interface WorkspaceItemProps {
  workspace: WorkspaceResponse;
  isSelected: boolean;
  onSelect: (workspace: WorkspaceResponse) => void;
}

const WorkspaceItem = ({
  workspace,
  isSelected,
  onSelect,
}: WorkspaceItemProps) => {
  return (
    <div onClick={() => onSelect(workspace)} className="relative">
      {/* Active indicator */}
      {isSelected && (
        <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r"></div>
      )}

      <div
        className={`w-12 h-12 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer text-white font-bold text-sm group relative ${
          isSelected ? "rounded-xl" : ""
        }`}
      >
        <img
          src={workspace.avatarUrl || getAvartarFromName(workspace.name)}
          className="w-full h-full rounded-2xl hover:rounded-xl object-cover"
          alt={workspace.name}
        />

        {/* Tooltip */}
        <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap top-1/2 transform -translate-y-1/2 pointer-events-none z-50">
          {workspace.name}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceItem;
