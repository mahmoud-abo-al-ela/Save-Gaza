// client/src/context/AuthContext.js
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { toast } from "react-hot-toast";
import { authService } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Clear any error when component rerenders
  useEffect(() => {
    return () => setError(null);
  }, []);

  const checkLoggedIn = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const data = await authService.getCurrentUser();
          setUser(data.user);
        } catch (err) {
          console.error("Token validation failed:", err);
          // Clear invalid token
          localStorage.removeItem("token");
          setUser(null);
        }
      }
    } catch (err) {
      console.error("Authentication check failed:", err);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkLoggedIn();
  }, [checkLoggedIn]);

  const login = async ({ username, password }) => {
    setError(null);
    try {
      setLoading(true);
      console.log("Attempting login for:", username);
      const data = await authService.login({ username, password });

      if (!data || !data.token) {
        console.error("Login response missing token:", data);
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);
      console.log("Login successful");
      toast.success("Successfully logged in!");
      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || "Login failed";
      const errorField = err.response?.data?.field || null;
      setError({ message: errorMessage, field: errorField });
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
        field: errorField,
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      setLoading(true);
      const data = await authService.register(userData);
      localStorage.setItem("token", data.token);
      setUser(data.user);
      toast.success("Registration successful!");
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed";
      const errorField = err.response?.data?.field || null;
      setError({ message: errorMessage, field: errorField });
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
        field: errorField,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.success("Logged out successfully");
  };

  const refreshUser = async () => {
    if (!localStorage.getItem("token")) return;

    try {
      setLoading(true);
      const data = await authService.getCurrentUser();
      setUser(data.user);
    } catch (err) {
      console.error("User refresh failed:", err);
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    authChecked,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
