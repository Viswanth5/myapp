export interface RolloverDecision {
  action: "do_today" | "split" | "drop";
  newEffortMin?: number;
  subTasks?: string[];
}

export interface RolloverTaskResult {
  id: string;
  title: string;
  carriedCount: number;
  needsTriage: boolean; // True if carried >= 3 times
  triagePrompt?: string;
  adjustedPriorityBonus: number;
}

/**
 * Smart Rollover: Rolls unfinished tasks past midnight without red shame
 * After 3 carries, asks student: Do it, Split it, or Drop it?
 */
export function processRollover(task: {
  id: string;
  title: string;
  status: string;
  carriedCount: number;
  dueAt?: Date | string | null;
}): RolloverTaskResult {
  const newCarriedCount = task.carriedCount + 1;
  const needsTriage = newCarriedCount >= 3;

  let triagePrompt: string | undefined;
  if (needsTriage) {
    triagePrompt = `Carried 3 times. Let's decide: Do it today, Split into smaller steps, or Drop without guilt?`;
  }

  // Slightly reduced priority bump to prevent overwhelming
  const adjustedPriorityBonus = Math.min(newCarriedCount * 6, 24);

  return {
    id: task.id,
    title: task.title,
    carriedCount: newCarriedCount,
    needsTriage,
    triagePrompt,
    adjustedPriorityBonus,
  };
}

export function autoRolloverTasks(tasks: any[]) {
  const rolledTasks = tasks.map((t) => processRollover({
    id: t.id,
    title: t.title,
    status: t.status || "PENDING",
    carriedCount: t.carriedCount || 0,
    dueAt: t.dueAt,
  }));
  const triageNeeded = rolledTasks.filter((r) => r.needsTriage);
  return { rolledTasks, triageNeeded };
}
