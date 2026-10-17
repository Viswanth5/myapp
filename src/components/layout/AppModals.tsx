"use client";

import React from "react";
import { useOrbitStore } from "@/store/useOrbitStore";
import { CaptureModal } from "@/components/capture/CaptureModal";
import { NotificationTray } from "@/components/notifications/NotificationTray";
import { FocusRoomModal } from "@/components/focus/FocusRoomModal";
import { EveningShutdownModal } from "@/components/shutdown/EveningShutdownModal";
import { SmartImportModal } from "@/components/import/SmartImportModal";

export const AppModals: React.FC = () => {
  const {
    isFocusOpen,
    setFocusOpen,
    isShutdownOpen,
    setShutdownOpen,
    setDumpOpen,
    setDumpInput,
    triggerRefresh,
  } = useOrbitStore();

  const sampleFocusTask = {
    id: "sample-focus",
    title: "DBMS Assignment 3: Relational Algebra & Queries",
    effortMin: 45,
  };

  return (
    <>
      {/* Global Quick Capture Modal */}
      <CaptureModal />

      {/* Notification Tray */}
      <NotificationTray />

      {/* Focus Chamber Modal */}
      <FocusRoomModal
        task={sampleFocusTask}
        isOpen={isFocusOpen}
        onClose={() => setFocusOpen(false)}
        onComplete={(actualMinutes) => {
          setFocusOpen(false);
          triggerRefresh();
        }}
      />

      {/* Evening 9 PM Shutdown Ritual */}
      <EveningShutdownModal
        isOpen={isShutdownOpen}
        onClose={() => setShutdownOpen(false)}
        completedCount={4}
        carriedCount={1}
        onBrainDump={(text) => {
          setDumpInput(text);
          setDumpOpen(true);
        }}
      />

      {/* Smart WhatsApp & Notice Importer */}
      <SmartImportModal />
    </>
  );
};
