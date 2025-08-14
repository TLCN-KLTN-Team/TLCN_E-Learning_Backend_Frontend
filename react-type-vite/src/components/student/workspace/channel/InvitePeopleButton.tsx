import { UserRoundPlus } from "lucide-react";

interface InvitePeopleButtonProps {
  onClick: () => void;
}

const InvitePeopleButton = ({ onClick }: InvitePeopleButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center space-x-3 px-4 py-2 bg-gray-700 text-green-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium z-50"
    >
      <UserRoundPlus className="w-4 h-4" />
      <span>Invite People</span>
    </button>
  );
};

export default InvitePeopleButton;
