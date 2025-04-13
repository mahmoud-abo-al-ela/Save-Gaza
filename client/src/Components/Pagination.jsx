import React from "react";

const Pagination = ({
  currentPage,
  totalPages,
  handleNextPage,
  handlePrevPage,
}) => {
  return (
    <div className="flex justify-center items-center mt-4">
      <button
        onClick={handlePrevPage}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
      >
        Previous
      </button>
      <span className="text-lg mx-4">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
