export interface SpendStudyInsight {
  id: string;
  metric: string;
  title: string;
  insight: string;
  recommendation: string;
}

export function generateSpendStudyCorrelations(): SpendStudyInsight[] {
  return [
    {
      id: "cor-1",
      metric: "2.3x Food Spends",
      title: "Exam Days & Swiggy Spends",
      insight: "On submission and exam prep days, your food & canteen spend averages ₹420 (vs ₹180 normal days).",
      recommendation: "Pre-stock hostel snacks before midterm weeks to preserve runway.",
    },
    {
      id: "cor-2",
      metric: "94% Habit Hold",
      title: "Gym vs Study Momentum",
      insight: "On days you complete your 30-min workout, task completion jumps from 62% to 94%.",
      recommendation: "Preserve the 3x/week gym routine using monthly grace buffer.",
    },
  ];
}
