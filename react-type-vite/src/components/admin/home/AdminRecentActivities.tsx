import React, { useEffect, useState } from "react";
import { getRecentActivities } from "../../../services/api/admin/educationUnitApi";
import type { RecentActivityResponse } from "../../../services/api/response/recentActivityResponse";
import { Clock, ShoppingCart, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const AdminRecentActivities: React.FC = () => {
  const [activities, setActivities] = useState<RecentActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getRecentActivities();
        setActivities(data);
      } catch (error) {
        console.error("Failed to fetch recent activities", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse h-full">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getIcon = (type: string) => {
    if (type === "INTERNAL") {
      return (
        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
          <UserPlus size={18} />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
        <ShoppingCart size={18} />
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col max-h-[420px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center">
          <span className="w-1.5 h-6 bg-orange-400 rounded-full mr-3"></span>
          Hoạt động gần đây
        </h2>
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Clock size={12} /> Live
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Chưa có hoạt động nào gần đây
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
          <div className="relative border-l-2 border-gray-100 ml-5 space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="relative pl-6">
                <span className="absolute -left-[21px] top-1">
                  {getIcon(activity.type)}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-0.5">{activity.title}</h4>
                  <p className="text-sm text-gray-600 mb-1 leading-snug">{activity.description}</p>
                  <span className="text-xs text-gray-400 font-medium">
                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true, locale: vi })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecentActivities;
