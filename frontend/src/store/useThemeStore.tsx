import { create } from "zustand";

type ThemeStore = {
  theme: string;
  setTheme: (theme: string) => void;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: localStorage.getItem("chat-theme") || "coffee",
  setTheme: (theme: string) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));
