import { Plus, MoreHorizontal } from "lucide-react";
import { getAvartarFromName } from "@/utils/callApiUtils";
import { getRoles } from "@/utils/localStorageVariables";
import type { WorkspaceResponse } from "@/types/chat.types";

interface WorkspaceListProps {
  workspaces: WorkspaceResponse[];
  selectedWorkspace: WorkspaceResponse | null;
  hasMoreWorkspaces: boolean;
  onWorkspaceSelect: (workspace: WorkspaceResponse) => void;
  onLoadMore: () => void;
}

const WorkspaceList = ({
  workspaces,
  selectedWorkspace,
  hasMoreWorkspaces,
  onWorkspaceSelect,
  onLoadMore,
}: WorkspaceListProps) => {
  return (
    <>
      {/* Workspace Icons */}
      {workspaces.map((workspace) => (
        <div
          key={workspace.id}
          onClick={() => onWorkspaceSelect(workspace)}
          className="relative"
        >
          {/* Active indicator */}
          {selectedWorkspace?.id === workspace.id && (
            <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r"></div>
          )}

          <div
            className={`w-12 h-12 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer text-white font-bold text-sm group relative ${
              selectedWorkspace?.id === workspace.id ? "rounded-xl" : ""
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
      ))}

      {/* Show More Button */}
      {hasMoreWorkspaces && (
        <div
          onClick={onLoadMore}
          className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group relative"
        >
          <MoreHorizontal className="w-5 h-5 text-gray-400 group-hover:text-white" />
          <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Xem thêm workspaces
          </div>
        </div>
      )}

      {/* Add Workspace Button (only for teachers) */}
      {getRoles().includes("TEACHER") && (
        <div className="w-12 h-12 bg-gray-700 hover:bg-green-600 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group relative">
          <Plus className="w-6 h-6 text-green-400 group-hover:text-white" />
          <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Thêm workspace
          </div>
        </div>
      )}
    </>
  );
};

export default WorkspaceList;
