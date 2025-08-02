import React from "react";

interface ErrorDisplayProps {
  error?: string | null;
  errors?: Record<string, string> | null;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  errors,
  className = "text-red-500 text-sm mt-2",
}) => {
  if (!error && !errors) return null;

  return (
    <div className={className}>
      {error && <div className="mb-2">{error}</div>}

      {errors && Object.keys(errors).length > 0 && (
        <div>
          {Object.entries(errors).map(([field, message]) => (
            <div key={field} className="mb-1">
              <span className="font-medium">{field}:</span> {message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
