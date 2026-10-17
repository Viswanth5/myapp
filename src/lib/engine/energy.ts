export type EnergyLevel = "low" | "steady" | "peak";

export interface EnergyLog {
  id: string;
  hour: number; // 0-23
  level: EnergyLevel;
  timestamp: string;
}

export interface EnergyProfile {
  peakHours: string; // e.g. "2:00 PM – 5:00 PM"
  lowHours: string;  // e.g. "8:00 PM – 10:00 PM"
  currentLevel: EnergyLevel;
  slotAdvice: string;
}

export function analyzeEnergyMap(logs?: EnergyLog[]): EnergyProfile {
  // Default college student circadian pattern
  return {
    peakHours: "2:00 PM – 6:00 PM (Afternoon Focus)",
    lowHours: "8:00 PM – 10:00 PM (Wind Down)",
    currentLevel: "peak",
    slotAdvice: "Peak cognitive energy right now. Recommended for DBMS Query Plans and OS Lab work.",
  };
}
