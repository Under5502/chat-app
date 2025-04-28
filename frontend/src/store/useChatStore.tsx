import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { AxiosError } from "axios";
import { useAuthStore } from "./useAuthStore";

// Định nghĩa các interface cho User, Message, và các loại trạng thái
interface User {
  _id: string;
  profilePic?: string;
  id: string;
  name: string;
  fullName: string;
}

interface Message {
  text: string;
  _id: string;
  senderId: string;
  id: string;
  content: string;
  timestamp: string;
  image?: string;
  createdAt: string;
}
type MessageData = {
  text: string;
  image: string | null;
};

interface ChatStore {
  messages: Message[];
  users: User[];
  selectedUser: User | null;
  isUserLoading: boolean;
  isMessagesLoading: boolean;
  subscribeToMessages: () => void;
  unsubscribeToMessages: () => void;

  // Các action
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  sendMessage: (messageData: MessageData) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUserLoading: false,
  isMessagesLoading: false,

  // Lấy danh sách người dùng
  getUsers: async () => {
    set({ isUserLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      const message = err.response?.data?.message || "Failed to fetch users.";
      toast.error(message);
      console.log("Get users error:", message);
    } finally {
      set({ isUserLoading: false });
    }
  },

  // Lấy tin nhắn của người dùng
  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      const message = err?.response?.data?.message || "Fail to fetch messages!";
      toast.error(message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData: MessageData) => {
    const { selectedUser, messages } = get(); // Đây là cách đúng để lấy giá trị từ Zustand

    if (!selectedUser) {
      toast.error("No selected user!");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      const message = err?.response?.data?.message || "Fail to send message!";
      toast.error(message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return; // 🛠 check nếu chưa có socket thì return luôn

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return; // 🛠 thêm check này
    socket.off("newMessage");
  },

  // Thiết lập người dùng đã chọn
  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
  },
}));
