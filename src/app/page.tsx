"use client";

import React from "react";
import { useOrbitStore } from "@/store/useOrbitStore";
import { TodayView } from "@/components/views/TodayView";
import { PlanView } from "@/components/views/PlanView";
import { MoneyView } from "@/components/views/MoneyView";
import { HabitsView } from "@/components/views/HabitsView";
import { StudyView } from "@/components/views/StudyView";
import { RewindView } from "@/components/views/RewindView";
import { SettingsView } from "@/components/views/SettingsView";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const { activeTab } = useOrbitStore();

  const renderActiveView = () => {
    switch (activeTab) {
      case "today":
        return <TodayView />;
      case "plan":
        return <PlanView />;
      case "money":
        return <MoneyView />;
      case "habits":
        return <HabitsView />;
      case "study":
        return <StudyView />;
      case "rewind":
        return <RewindView />;
      case "settings":
        return <SettingsView />;
      default:
        return <TodayView />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        {renderActiveView()}
      </motion.div>
    </AnimatePresence>
  );
}
