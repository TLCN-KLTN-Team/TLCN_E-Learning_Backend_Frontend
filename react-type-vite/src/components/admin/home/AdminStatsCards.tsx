"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { BookOpen, Users, BookMarked, Clock } from "lucide-react";

interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
}

const Counter: React.FC<CounterProps> = ({
  end,
  duration = 2000,
  suffix = "",
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const timer = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 200);

    return () => {
      clearTimeout(timer);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

const userHover =
  "transform hover:scale-105 hover:shadow-sm transition-transform duration-300";

const AdminStatsCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 md:mb-6">
      {/* Completed Courses */}
      <div
        className={`bg-orange-50 rounded-lg p-4 md:p-6 border border-orange-100 ${userHover}`}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 purecounter">
              <Counter end={1958} />
            </h2>
            <span className="text-gray-600 text-xs md:text-sm font-medium">
              Completed Courses
            </span>
          </div>
          <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-400 rounded-full flex items-center justify-center text-white">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div
        className={`bg-purple-50 rounded-lg p-4 md:p-6 border border-purple-100 ${userHover}`}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 purecounter">
              <Counter end={1600} />
            </h2>
            <span className="text-gray-600 text-xs md:text-sm font-medium">
              Enrolled Courses
            </span>
          </div>
          <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-500 rounded-full flex items-center justify-center text-white">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
      </div>

      {/* Course In Progress */}
      <div
        className={`bg-blue-50 rounded-lg p-4 md:p-6 border border-blue-100 ${userHover}`}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 purecounter">
              <Counter end={1235} />
            </h2>
            <span className="text-gray-600 text-xs md:text-sm font-medium">
              Course In Progress
            </span>
          </div>
          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <BookMarked className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
      </div>

      {/* Total Watch Time */}
      <div
        className={`bg-green-50 rounded-lg p-4 md:p-6 border border-green-100 ${userHover}`}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-baseline">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 purecounter">
                <Counter end={845} />
              </h2>
              <span className="text-xl md:text-2xl font-bold text-gray-900 ml-1">
                hrs
              </span>
            </div>
            <span className="text-gray-600 text-xs md:text-sm font-medium">
              Total Watch Time
            </span>
          </div>
          <div className="w-12 h-12 md:w-14 md:h-14 bg-green-500 rounded-full flex items-center justify-center text-white">
            <Clock className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsCards;
