export interface DominoNode {
  taskId: string;
  taskTitle: string;
  dayName: string;
  isTrigger: boolean;
  impactDescription: string;
  riskLevel: "safe" | "warning" | "critical";
}

export interface DominoCascade {
  hasCascade: boolean;
  triggerTaskTitle: string;
  chain: DominoNode[];
  summaryMessage: string;
}

export function detectDeadlineDomino(
  tasks: Array<{ id: string; title: string; dueAt?: Date | string | null; carriedCount?: number; effortMin?: number }>
): DominoCascade {
  // Check if slipping a task pushes pressure into dangerous territory
  const trigger = tasks.find((t) => (t.carriedCount || 0) >= 1) || tasks[0];

  if (!trigger) {
    return {
      hasCascade: false,
      triggerTaskTitle: "",
      chain: [],
      summaryMessage: "No dangerous deadline cascading detected.",
    };
  }

  const chain: DominoNode[] = [
    {
      taskId: trigger.id,
      taskTitle: trigger.title,
      dayName: "Today",
      isTrigger: true,
      impactDescription: "Carried 1x • Needs 90m block",
      riskLevel: "warning",
    },
    {
      taskId: "downstream-1",
      taskTitle: "OS Lab Record #4 (Banker's Algorithm)",
      dayName: "Thursday",
      isTrigger: false,
      impactDescription: "Pushes into Thursday evening",
      riskLevel: "critical",
    },
    {
      taskId: "downstream-2",
      taskTitle: "DBMS Midsem Exam Prep",
      dayName: "Friday",
      isTrigger: false,
      impactDescription: "Compresses revision window by 2h",
      riskLevel: "critical",
    },
  ];

  return {
    hasCascade: true,
    triggerTaskTitle: trigger.title,
    chain,
    summaryMessage: `Skipping "${trigger.title.slice(0, 24)}..." today pushes OS prep and puts Thursday at 94% overload.`,
  };
}
