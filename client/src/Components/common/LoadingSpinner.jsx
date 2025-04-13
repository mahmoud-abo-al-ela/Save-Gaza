import React from "react";

const LoadingSpinner = ({ size = "md", text = "Loading..." }) => {
  // Define size classes
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  // Get the appropriate size class
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex flex-col justify-center items-center gap-2">
      <div
        className={`animate-spin rounded-full ${sizeClass} border-b-2 border-emerald-700`}
      ></div>
      {text && (
        <span
          className={`${
            text === "Loading..." ? "sr-only" : "text-gray-600 text-sm"
          }`}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
