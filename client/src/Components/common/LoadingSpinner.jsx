import React from "react";

const LoadingSpinner = ({ size = "md", text = "Loading..." }) => {
  // Define size classes with responsive variants
  const sizeClasses = {
    sm: "h-5 w-5 xs:h-6 xs:w-6",
    md: "h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10",
    lg: "h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16",
    xl: "h-16 w-16 xs:h-20 xs:w-20 sm:h-24 sm:w-24",
  };

  // Get the appropriate size class
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex flex-col justify-center items-center gap-2 xs:gap-3">
      <div
        className={`animate-spin rounded-full ${sizeClass} border-b-2 border-emerald-700`}
      ></div>
      {text && (
        <span
          className={`${
            text === "Loading..." ? "sr-only" : "text-gray-600 rwd-text"
          }`}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
