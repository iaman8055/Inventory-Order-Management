import React from "react";

interface LoaderProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Loader: React.FC<LoaderProps> = ({ 
  message = "Loading data from service...", 
  className = "",
  size = "md" 
}) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4"
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className={`relative ${size === "sm" ? "w-5 h-5" : size === "md" ? "w-10 h-10" : "w-16 h-16"}`}>
        <div className={`rounded-full border-slate-200 border-t-blue-600 animate-spin absolute inset-0 ${sizeClasses[size]}`}></div>
      </div>
      {message && (
        <span className="mt-4 text-sm font-medium text-slate-500 animate-pulse">
          {message}
        </span>
      )}
    </div>
  );
};

export const ScreenLoader: React.FC<{ message?: string }> = ({ message = "Connecting to interface..." }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center max-w-xs">
        <Loader message={message} size="md" />
      </div>
    </div>
  );
};
