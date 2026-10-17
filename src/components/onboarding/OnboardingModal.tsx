"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrbitStore } from "@/store/useOrbitStore";

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen } = useOrbitStore();
  const router = useRouter();

  useEffect(() => {
    if (isOnboardingOpen) {
      setIsOnboardingOpen(false);
      router.push("/onboarding");
    }
  }, [isOnboardingOpen, router, setIsOnboardingOpen]);

  return null;
};
