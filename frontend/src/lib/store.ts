import { create } from "zustand";
import type { UploadState, UserProfile } from "@/types";

interface AppStore {
  // Upload state
  upload: UploadState;
  setUpload: (partial: Partial<UploadState>) => void;
  resetUpload: () => void;

  // Auth state
  user: UserProfile | null;
  token: string | null;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const initialUpload: UploadState = {
  file: null,
  progress: 0,
  status: "idle",
  analysisId: null,
  error: null,
};

export const useStore = create<AppStore>((set) => ({
  upload: initialUpload,
  setUpload: (partial) =>
    set((state) => ({ upload: { ...state.upload, ...partial } })),
  resetUpload: () => set({ upload: initialUpload }),

  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    set({ token });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
}));
