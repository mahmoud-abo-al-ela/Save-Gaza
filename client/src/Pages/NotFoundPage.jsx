import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 xs:py-8 sm:py-12 px-4 xs:px-6 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-7xl xs:text-8xl sm:text-9xl font-bold text-emerald-600">
            404
          </h1>
          <h2 className="mt-3 xs:mt-4 text-xl xs:text-2xl sm:text-3xl font-bold xs:font-extrabold text-gray-900">
            Page not found
          </h2>
          <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base text-gray-500">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <div className="mt-4 xs:mt-5 sm:mt-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-3 xs:px-4 py-1.5 xs:py-2 border border-transparent text-xs xs:text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Go back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
