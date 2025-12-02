import { useEffect, useState, useCallback } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { softDeleteChannel } from "@/services/api/channel.api";
import { toast } from "react-toastify";

interface ChannelTimerProps {
  channelId: string;
  channelName: string;
  endTime: string; // ISO string from backend
  onChannelExpired?: () => void;
}

const ChannelTimer = ({
  channelId,
  channelName,
  endTime,
  onChannelExpired,
}: ChannelTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);

  // Calculate initial time left
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        return 0;
      }

      return difference;
    };

    setTimeLeft(calculateTimeLeft());
  }, [endTime]);

  // Handle channel expiration
  const handleChannelExpired = useCallback(async () => {
    try {
      console.log(`⏰ Channel ${channelName} has expired. Soft deleting...`);

      await softDeleteChannel(channelId);

      toast.success(`Kênh "${channelName}" đã kết thúc và được lưu trữ.`);

      // Notify parent component
      if (onChannelExpired) {
        onChannelExpired();
      }
    } catch (error) {
      console.error("Error soft deleting channel:", error);
      toast.error("Không thể kết thúc kênh. Vui lòng thử lại.");
    }
  }, [channelId, channelName, onChannelExpired]);

  // Timer effect
  useEffect(() => {
    if (isExpired || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1000;

        // Check if time is running out (last 5 minutes)
        if (newTime <= 5 * 60 * 1000 && newTime > 0) {
          setIsExpiring(true);
        }

        // Check if expired
        if (newTime <= 0) {
          setIsExpired(true);
          handleChannelExpired();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isExpired, handleChannelExpired]);

  // Format time display
  const formatTime = (milliseconds: number): string => {
    if (milliseconds <= 0) return "00:00:00";

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Get timer color based on time left
  const getTimerColor = (): string => {
    if (isExpired) return "text-red-500";
    if (isExpiring) return "text-yellow-500";
    return "text-green-500";
  };

  // Get background color for timer box
  const getBackgroundColor = (): string => {
    if (isExpired) return "bg-red-100 border-red-300";
    if (isExpiring) return "bg-yellow-100 border-yellow-300";
    return "bg-green-100 border-green-300";
  };

  if (isExpired) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-100 border border-red-300 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
        <span className="text-red-700 font-medium">Kênh đã kết thúc</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border ${getBackgroundColor()}`}
    >
      <div className="flex items-center space-x-3">
        <Clock className={`w-5 h-5 ${getTimerColor()}`} />
        <div>
          <h4 className="text-gray-800 font-medium">Thời gian còn lại</h4>
          <p className="text-sm text-gray-600">
            Kênh sẽ tự động kết thúc khi hết thời gian
          </p>
        </div>
      </div>

      <div className="text-right">
        <div className={`text-2xl font-bold ${getTimerColor()}`}>
          {formatTime(timeLeft)}
        </div>
        {isExpiring && (
          <p className="text-xs text-yellow-600 mt-1">⚠️ Sắp hết thời gian!</p>
        )}
      </div>
    </div>
  );
};

export default ChannelTimer;
