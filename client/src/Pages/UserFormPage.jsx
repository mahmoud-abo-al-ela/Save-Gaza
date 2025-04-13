import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { userService } from "../services/api";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../Components/common/LoadingSpinner";

const UserFormPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "member", // Default role is 'member'
    },
  });

  const watchPassword = watch("password");

  // Fetch user data if editing
  useEffect(() => {
    const fetchUser = async () => {
      if (!isEditing) return;

      try {
        setInitialLoading(true);
        const userData = await userService.getById(id);

        // Check if editing current user
        const isSelf = currentUser.id === userData.id;
        setIsCurrentUser(isSelf);

        reset({
          username: userData.username || "",
          email: userData.email || "",
          password: "", // Don't populate password
          confirmPassword: "",
          role: userData.role || "member",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load user data");
        navigate("/users");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUser();
  }, [id, isEditing, reset, navigate, currentUser.id]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Remove confirmPassword field
      const { confirmPassword, ...userData } = data;

      // Don't send password if it's empty (in case of editing)
      if (!userData.password) {
        delete userData.password;
      }

      // Default role to 'member' if not set
      if (!userData.role) {
        userData.role = "member";
      }

      if (isEditing) {
        await userService.update(id, userData);
        toast.success("User updated successfully");
      } else {
        await userService.create(userData);
        toast.success("User added successfully");
      }

      // Navigate back to users list
      navigate("/users");
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(isEditing ? "Failed to update user" : "Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingSpinner size="md" text="Loading user data..." />;
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => navigate("/users")}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Edit User" : "Add New User"}
        </h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Username */}
            <div className="sm:col-span-3">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username*
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="username"
                  {...register("username", {
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                  })}
                  className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="sm:col-span-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email*
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  id="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="sm:col-span-3">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                {isEditing
                  ? "New Password (leave blank to keep current)"
                  : "Password*"}
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  id="password"
                  {...register("password", {
                    required: isEditing ? false : "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="sm:col-span-3">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                {isEditing ? "Confirm New Password" : "Confirm Password*"}
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  id="confirmPassword"
                  {...register("confirmPassword", {
                    required: isEditing ? false : "Please confirm password",
                    validate: (value) =>
                      !watchPassword ||
                      value === watchPassword ||
                      "Passwords do not match",
                  })}
                  className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Role - fixed as 'member' according to requirements */}
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <div className="mt-1">
                <div className="bg-gray-100 p-2 rounded-md flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    member
                  </span>
                  <span className="text-sm text-gray-500">
                    Full permissions to manage donations, campaigns, and users
                  </span>
                </div>
                <input type="hidden" {...register("role")} value="member" />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                All users have the same role with full permissions in the system
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-5">
            <button
              type="button"
              onClick={() => navigate("/users")}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Update User" : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormPage;
