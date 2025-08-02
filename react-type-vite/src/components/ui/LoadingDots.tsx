import React from "react";
import "../../styles/authenticate.css";

interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  className = "w-2 h-2 bg-blue-600",
}) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className={`${className} rounded-full loading-dot`}></div>
      <div className={`${className} rounded-full loading-dot`}></div>
      <div className={`${className} rounded-full loading-dot`}></div>
    </div>
  );
};
