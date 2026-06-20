import { create } from "zustand";

interface AppStore {
  activeTab: "dashboard" | "employees" | "attendance" | "reports";
  setActiveTab: (
    tab: "dashboard" | "employees" | "attendance" | "reports",
  ) => void;
}

const useAppStore = create<AppStore>((set) => ({
  activeTab: "attendance",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export default useAppStore;
