import { create } from "zustand";
import { ParsedEntry } from "@/lib/parser/types";

export type NavTab = "today" | "plan" | "money" | "habits" | "study" | "rewind" | "settings";

interface OrbitState {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  
  // Brain Dump State
  isDumpOpen: boolean;
  setDumpOpen: (open: boolean) => void;
  dumpInput: string;
  setDumpInput: (text: string) => void;
  parsedPreview: ParsedEntry[];
  setParsedPreview: (entries: ParsedEntry[]) => void;
  isParsing: boolean;
  setIsParsing: (val: boolean) => void;
  isRecording: boolean;
  setIsRecording: (val: boolean) => void;

  // Onboarding
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (val: boolean) => void;

  // Focus Room Modal
  isFocusOpen: boolean;
  setFocusOpen: (val: boolean) => void;

  // Evening Shutdown Modal
  isShutdownOpen: boolean;
  setShutdownOpen: (val: boolean) => void;

  // Smart WhatsApp / Notice Import Modal
  isImportOpen: boolean;
  setImportOpen: (val: boolean) => void;

  // Notifications
  isNotificationsOpen: boolean;
  setNotificationsOpen: (val: boolean) => void;

  // Global Refresh Trigger
  refreshCounter: number;
  triggerRefresh: () => void;
}

export const useOrbitStore = create<OrbitState>((set) => ({
  activeTab: "today",
  setActiveTab: (tab) => set({ activeTab: tab }),

  isDumpOpen: false,
  setDumpOpen: (open) => set({ isDumpOpen: open }),
  dumpInput: "",
  setDumpInput: (text) => set({ dumpInput: text }),
  parsedPreview: [],
  setParsedPreview: (entries) => set({ parsedPreview: entries }),
  isParsing: false,
  setIsParsing: (val) => set({ isParsing: val }),
  isRecording: false,
  setIsRecording: (val) => set({ isRecording: val }),

  isOnboardingOpen: false,
  setIsOnboardingOpen: (val) => set({ isOnboardingOpen: val }),

  isFocusOpen: false,
  setFocusOpen: (val) => set({ isFocusOpen: val }),

  isShutdownOpen: false,
  setShutdownOpen: (val) => set({ isShutdownOpen: val }),

  isImportOpen: false,
  setImportOpen: (val) => set({ isImportOpen: val }),

  isNotificationsOpen: false,
  setNotificationsOpen: (val) => set({ isNotificationsOpen: val }),

  refreshCounter: 0,
  triggerRefresh: () => set((state) => ({ refreshCounter: state.refreshCounter + 1 })),
}));
