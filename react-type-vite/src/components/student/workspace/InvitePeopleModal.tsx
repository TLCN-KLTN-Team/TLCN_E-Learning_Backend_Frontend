import { useState } from "react";
import { X, Search, Hash } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  avatar: string;
  username: string;
}

interface InvitePeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
  channelName: string;
}

const InvitePeopleModal = ({
  isOpen,
  onClose,
  workspaceName,
  channelName,
}: InvitePeopleModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteLink] = useState("https://discord.gg/ZJsPaNPm");

  // Mock friends data
  const friends: Friend[] = [
    {
      id: "1",
      name: "nguyenvj",
      avatar:
        "https://ui-avatars.com/api/?name=Nguyen+VJ&background=5865f2&color=fff",
      username: "nguyenvj",
    },
    {
      id: "2",
      name: "longgg",
      avatar:
        "https://ui-avatars.com/api/?name=Long+GG&background=ed4245&color=fff",
      username: "longgg",
    },
    {
      id: "3",
      name: "Glory_Shrimp",
      avatar:
        "https://ui-avatars.com/api/?name=Glory+Shrimp&background=57f287&color=fff",
      username: "Glory_Shrimp",
    },
    {
      id: "4",
      name: "Kien.Nguyen",
      avatar:
        "https://ui-avatars.com/api/?name=Kien+Nguyen&background=fee75c&color=000",
      username: "Kien.Nguyen",
    },
  ];

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    // You could add a toast notification here
  };

  const handleInviteFriend = (friendId: string) => {
    console.log("Inviting friend:", friendId);
    // Handle invite logic here
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg w-[480px] max-h-[600px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-white font-semibold text-lg">
              Invite friends to {workspaceName}'s server
            </h2>
            <div className="flex items-center text-gray-400 text-sm mt-1">
              <Hash className="w-4 h-4 mr-1" />
              <span>{channelName}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for friends"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 text-white placeholder-gray-400 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Friends List */}
          <div className="max-h-64 overflow-y-auto mb-6">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-white text-sm">{friend.name}</span>
                </div>
                <button
                  onClick={() => handleInviteFriend(friend.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm font-medium transition-colors"
                >
                  Invite
                </button>
              </div>
            ))}
          </div>

          {/* Invite Link Section */}
          <div>
            <h3 className="text-white font-medium mb-3">
              Or, Send A Server Invite Link To A Friend
            </h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              Your invite link expires in 7 days.{" "}
              <span className="text-blue-400 cursor-pointer hover:underline">
                Edit invite link
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitePeopleModal;
