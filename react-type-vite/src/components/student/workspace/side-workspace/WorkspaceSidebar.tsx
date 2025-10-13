import WorkspaceList from "./WorkspaceList";
import UserMenu from "./UserMenu";
import type { WorkspaceResponse } from "@/types/chat.types";

interface WorkspaceSidebarProps {
  workspaces: WorkspaceResponse[];
  selectedWorkspace: WorkspaceResponse | null;
  hasMoreWorkspaces: boolean;
  onWorkspaceSelect: (workspace: WorkspaceResponse) => void;
  onLoadMore: () => void;
}

const WorkspaceSidebar = ({
  workspaces,
  selectedWorkspace,
  hasMoreWorkspaces,
  onWorkspaceSelect,
  onLoadMore,
}: WorkspaceSidebarProps) => {
  return (
    <div className="w-18 bg-gray-900 flex flex-col items-center py-3 space-y-2">
      {/* Home/Direct Messages */}
      <div className="w-12 h-12 bg-indigo-600 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group relative">
        <svg
          className="w-6 h-6 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
        <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          Trang chủ
        </div>
      </div>

      {/* Separator */}
      <div className="w-8 h-0.5 bg-gray-700 rounded"></div>

      {/* Workspace List */}
      <WorkspaceList
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        hasMoreWorkspaces={hasMoreWorkspaces}
        onWorkspaceSelect={onWorkspaceSelect}
        onLoadMore={onLoadMore}
      />

      {/* User Avatar */}
      <UserMenu className="mt-auto" />
    </div>
  );
};

export default WorkspaceSidebar;
