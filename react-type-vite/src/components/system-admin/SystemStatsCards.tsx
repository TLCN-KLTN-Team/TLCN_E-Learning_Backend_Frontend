"use client";

import { University, Users, DollarSign, Activity } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

const SystemStatsCards: React.FC = () => {
  const [counters, setCounters] = useState({
    trainingUnits: 0,
    totalAccounts: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });

  const finalValues = {
    trainingUnits: 45,
    totalAccounts: 12500,
    totalRevenue: 2850000,
    activeUsers: 8750,
  };

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    const intervals = Object.keys(finalValues).map((key) => {
      const finalValue = finalValues[key as keyof typeof finalValues];
      const increment = finalValue / steps;

      return setInterval(() => {
        setCounters((prev) => ({
          ...prev,
          [key]: Math.min(
            prev[key as keyof typeof prev] + increment,
            finalValue
          ),
        }));
      }, stepDuration);
    });

    setTimeout(() => {
      intervals.forEach((interval) => clearInterval(interval));
      setCounters(finalValues);
    }, duration);

    return () => intervals.forEach((interval) => clearInterval(interval));
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return Math.round(num).toString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  const userHover =
    "transform hover:scale-105 hover:shadow transition-transform duration-200";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Training Units */}
      <div
        className={`bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl p-6 text-white ${userHover}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm text-white">Đơn vị đào tạo</p>
            <p className="text-3xl font-bold mt-2">
              {Math.round(counters.trainingUnits)}
            </p>
          </div>
          <div className="w-12 h-12 bg-opacity-20 rounded-lg flex items-center justify-center">
            <University className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Total Accounts */}
      <div
        className={`bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white ${userHover}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm font-medium">
              Tổng tài khoản
            </p>
            <p className="text-3xl font-bold mt-2">
              {formatNumber(counters.totalAccounts)}
            </p>
          </div>
          <div className="w-12 h-12 bg-opacity-20 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Total Revenue */}
      <div
        className={`bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white ${userHover}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Tổng doanh thu</p>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(counters.totalRevenue)}
            </p>
          </div>
          <div className="w-12 h-12 bg-opacity-20 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Active Users */}
      <div
        className={`bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white ${userHover}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium">
              Người dùng hoạt động
            </p>
            <p className="text-3xl font-bold mt-2">
              {formatNumber(counters.activeUsers)}
            </p>
          </div>
          <div className="w-12 h-12 bg-opacity-20 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatsCards;
