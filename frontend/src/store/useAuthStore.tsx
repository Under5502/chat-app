import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { io } from "socket.io-client";
import { Socket } from "socket.io-client";

type AuthUser = {
  _id: string;
  id: number;
  name: string;
  email: string;
  fullName: string;
  createdAt: string;
  profilePic: string;
};

type SignupData = {
  fullName: string;
  email: string;
  password: string;
};

type ProfileData = {
  profilePic: string;
};

type LoginData = {
  email: string;
  password: string;
};

type ErrorResponse = {
  message: string;
};

type AuthStore = {
  authUser: AuthUser | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  onlineUsers: string[];
  socket: Socket | null;
  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  login: (data: LoginData) => Promise<void>;
  updateProfile: (data: ProfileData) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
};

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/";

export const useAuthStore = create<AuthStore>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
      console.log("error", error);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data: SignupData) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account create success");
      get().connectSocket();
    } catch (error: unknown) {
      const err = error as AxiosError<ErrorResponse>;
      const message = err.response?.data?.message || "Signup failed.";
      toast.error(message);
      console.log("Signup error:", message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data: LoginData) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Log in success");

      get().connectSocket();
    } catch (error: unknown) {
      const err = error as AxiosError<ErrorResponse>;
      const message = err.response?.data?.message || "Login failed.";
      toast.error(message);
      console.log("Login error:", message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logout success");
      get().disconnectSocket();
    } catch (error: unknown) {
      const err = error as AxiosError<ErrorResponse>;
      const message = err.response?.data?.message || "Logout failed.";
      toast.error(message);
      console.log("Logout error:", message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  updateProfile: async (data: ProfileData) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      const err = error as AxiosError<ErrorResponse>;
      const message = err.response?.data?.message || "Update profile failed.";
      toast.error(message);
      console.log("Update profile error:", message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });

    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket?.disconnect();
  },
}));
