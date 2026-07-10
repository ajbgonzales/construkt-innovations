import { create } from "zustand";

interface AppStore {
  activeTab: "attendance" | "payslipGenerator";
  setActiveTab: (tab: "attendance" | "payslipGenerator") => void;
}

const useAppStore = create<AppStore>((set) => ({
  activeTab: "attendance",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export default useAppStore;
