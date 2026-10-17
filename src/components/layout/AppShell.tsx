"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarDock } from "@/components/layout/SidebarDock";
import { Navbar } from "@/components/layout/Navbar";
import { AppModals } from "@/components/layout/AppModals";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/auth" ||
    pathname === "/forgot-password" ||
    pathname === "/onboarding";

  if (pathname === "/onboarding") {
    return (
      <main className="relative z-10 min-h-screen w-full flex flex-col items-center justify-start py-6 sm:py-10 px-3 sm:px-6">
        {children}
      </main>
    );
  }

  if (isAuthPage) {
    return (
      <main className="relative z-10 min-h-screen w-full flex items-center justify-center p-4">
        {children}
      </main>
    );
  }

  return (
    <>
      {/* Floating Left Rail on Desktop & Mobile Dock */}
      <SidebarDock />

      {/* Main Content Area */}
      <div className="relative z-10 flex min-h-screen flex-col lg:pl-24">
        <main className="flex-1 px-3 sm:px-8 max-w-7xl mx-auto w-full pt-2 pb-24 lg:pb-8">
          <Navbar />
          <div className="pt-4">{children}</div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <AppModals />
    </>
  );
}

