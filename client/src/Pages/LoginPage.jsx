import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";

const LoginPage = () => {
  const { login, user, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Get the page the user was trying to visit before being redirected to login
  const from = location.state?.from?.pathname || "/dashboard";

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setLoginError(null);
    console.log("Login form submitted with data:", {
      username: data.username,
      passwordLength: data.password?.length,
    });

    try {
      const result = await login(data);
      console.log("Login result:", result);

      if (result.success) {
        console.log("Navigating to:", from);
        navigate(from, { replace: true });
      } else if (result.field) {
        console.log("Field error:", result.field, result.error);
        setFormError(result.field, {
          type: "manual",
          message: result.error,
        });
      } else {
        console.log("General login error:", result.error);
        setLoginError(result.error);
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      setLoginError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col justify-center py-6 xs:py-8 sm:py-12 px-4 xs:px-6 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img
            src="/support-gaza-logo.png"
            alt="Save Gaza Logo"
            className="h-16 xs:h-18 sm:h-20 w-auto"
          />
        </div>
        <h2 className="mt-2 xs:mt-3 text-center text-2xl xs:text-2xl sm:text-3xl font-bold xs:font-extrabold text-gray-900">
          Sign in to Save Gaza
        </h2>
        <p className="mt-1 xs:mt-2 text-center text-xs xs:text-sm text-gray-600">
          Private platform for authorized members only
        </p>
      </div>

      <div className="mt-6 xs:mt-7 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 xs:py-7 sm:py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-100">
          {loginError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 xs:p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-4 w-4 xs:h-5 xs:w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-xs xs:text-sm text-red-700">
                    {loginError}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form
            className="space-y-4 xs:space-y-5 sm:space-y-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div>
              <label
                htmlFor="username"
                className="block text-xs xs:text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  className={`appearance-none block w-full pl-9 xs:pl-10 pr-3 py-1.5 xs:py-2 text-xs xs:text-sm border ${
                    errors.username ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500`}
                  placeholder="Enter your username"
                  {...register("username", {
                    required: "Username is required",
                  })}
                />
              </div>
              {errors.username && (
                <p className="mt-1 xs:mt-2 text-xs text-red-600 flex items-center">
                  <FiAlertCircle className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs xs:text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`appearance-none block w-full pl-9 xs:pl-10 pr-9 xs:pr-10 py-1.5 xs:py-2 text-xs xs:text-sm border ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500`}
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    {!showPassword ? (
                      <FiEyeOff className="h-4 w-4 xs:h-5 xs:w-5" />
                    ) : (
                      <FiEye className="h-4 w-4 xs:h-5 xs:w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 xs:mt-2 text-xs text-red-600 flex items-center">
                  <FiAlertCircle className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-1.5 xs:py-2 px-3 xs:px-4 border border-transparent rounded-md shadow-sm text-xs xs:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 xs:mt-5 sm:mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs xs:text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Need an account?
                </span>
              </div>
            </div>

            <div className="mt-3 xs:mt-4 text-center">
              <Link
                to="/register"
                className="text-xs xs:text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors duration-200"
              >
                Register
              </Link>
            </div>

            <p className="mt-4 xs:mt-5 sm:mt-6 text-center text-[10px] xs:text-xs text-gray-500">
              This platform is exclusively for authorized members to manage
              donation data and campaigns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
