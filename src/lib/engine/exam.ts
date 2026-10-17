export interface SyllabusChunk {
  dayNumber: number;
  date: string;
  topic: string;
  unit: string;
  estimatedHours: number;
  isCompleted: boolean;
  isSkipped?: boolean;
}

export interface ExamStudyPlan {
  examId: string;
  examTitle: string;
  courseCode: string;
  examDate: string;
  daysRemaining: number;
  totalTopics: number;
  completedTopics: number;
  dailyHoursNeeded: number;
  chunks: SyllabusChunk[];
  isActive: boolean;
}

// Sample college course syllabus modules (e.g., DBMS, OS, Networks, AI)
const DEFAULT_SYLLABUS_MAP: Record<string, string[]> = {
  DBMS: [
    "Unit 1: ER Models, Relational Algebra, SQL Fundamentals",
    "Unit 2: Normalization (1NF, 2NF, 3NF, BCNF, Functional Dependencies)",
    "Unit 3: Transaction Processing & ACID Properties",
    "Unit 4: Concurrency Control (2PL, Timestamping, Deadlocks)",
    "Unit 5: Indexing & Hashing (B+ Trees, Query Optimization)",
    "Unit 6: Mock Paper & Previous Year Questions (PYQs)",
  ],
  OS: [
    "Unit 1: Process Management & CPU Scheduling Algorithms (FCFS, SJF, RR)",
    "Unit 2: Inter-Process Communication & Synchronization (Semaphores, Monitors)",
    "Unit 3: Deadlocks (Detection, Prevention, Banker's Algorithm)",
    "Unit 4: Memory Management (Paging, Segmentation, Page Replacement)",
    "Unit 5: File Systems & Disk Scheduling (SCAN, C-LOOK)",
    "Unit 6: Shell Scripting & Viva/Lab Revision",
  ],
  DSA: [
    "Unit 1: Arrays, Linked Lists, Stacks & Queues",
    "Unit 2: Trees (BST, AVL, Heap, Trie) & Traversals",
    "Unit 3: Graphs (BFS, DFS, Dijkstra, Prim's, Kruskal's)",
    "Unit 4: Dynamic Programming (0/1 Knapsack, LCS, LIS)",
    "Unit 5: Sorting & Searching Time Complexities",
    "Unit 6: Hard LeetCode Patterns & PYQs",
  ],
  GEN: [
    "Module 1: Core Definitions & High-Yield Fundamentals",
    "Module 2: Chapter 1 & 2 Theory and Numerical Problems",
    "Module 3: Chapter 3 & 4 Complex Derivations & Diagrams",
    "Module 4: Case Studies & Application Based Questions",
    "Module 5: Revision of Important Formulae & Past 3 Years Papers",
  ],
};

/**
 * Generate 14-day study plan chunking syllabus into daily achievable tasks
 */
export function generateExamStudyPlan(
  exam: { id: string; title: string; courseCode?: string | null; dueAt?: Date | string | null },
  customTopics?: string[],
  now: Date = new Date()
): ExamStudyPlan | null {
  if (!exam.dueAt) return null;

  const examDate = new Date(exam.dueAt);
  const diffTime = examDate.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Exam mode activates when <= 14 days
  const isActive = daysRemaining <= 14;
  const courseKey = (exam.courseCode || "GEN").toUpperCase();
  const topics = customTopics && customTopics.length > 0
    ? customTopics
    : DEFAULT_SYLLABUS_MAP[courseKey] || DEFAULT_SYLLABUS_MAP.GEN;

  const chunks: SyllabusChunk[] = [];
  const availableDays = Math.min(daysRemaining, 14);

  // Distribute topics evenly across available study days
  const topicsPerDay = topics.length / availableDays;

  for (let day = 0; day < availableDays; day++) {
    const chunkDate = new Date(now);
    chunkDate.setDate(chunkDate.getDate() + day);

    const topicIndex = Math.min(Math.floor(day * topicsPerDay), topics.length - 1);
    const topicText = topics[topicIndex] || `Revision session ${day + 1}`;

    chunks.push({
      dayNumber: day + 1,
      date: chunkDate.toISOString().split("T")[0],
      topic: topicText,
      unit: `Topic ${topicIndex + 1}`,
      estimatedHours: 2.0,
      isCompleted: false,
    });
  }

  const totalTopics = topics.length;
  const completedTopics = 0;
  const dailyHoursNeeded = Math.round((totalTopics * 2.0 / availableDays) * 10) / 10;

  return {
    examId: exam.id,
    examTitle: exam.title,
    courseCode: courseKey,
    examDate: examDate.toISOString(),
    daysRemaining,
    totalTopics,
    completedTopics,
    dailyHoursNeeded,
    chunks,
    isActive,
  };
}

/**
 * Dynamic Re-Flow: When student skips a day, re-distribute remaining syllabus without panic
 */
export function reflowStudyPlan(plan: ExamStudyPlan, missedDayNumber: number): ExamStudyPlan {
  const remainingChunks = plan.chunks.filter((c) => c.dayNumber > missedDayNumber && !c.isCompleted);
  const missedChunk = plan.chunks.find((c) => c.dayNumber === missedDayNumber);

  if (!missedChunk || remainingChunks.length === 0) return plan;

  // Mark missed chunk as skipped
  missedChunk.isSkipped = true;

  // Append or re-distribute missed topic across remaining days
  const updatedChunks = plan.chunks.map((c) => {
    if (c.dayNumber === missedDayNumber) {
      return { ...c, isSkipped: true };
    }
    if (c.dayNumber === missedDayNumber + 1) {
      return {
        ...c,
        topic: `${c.topic} + [Rollover: ${missedChunk.topic.slice(0, 30)}...]`,
        estimatedHours: c.estimatedHours + 0.5,
      };
    }
    return c;
  });

  return {
    ...plan,
    chunks: updatedChunks,
  };
}
