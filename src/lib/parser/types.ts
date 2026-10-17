export type EntryType =
  | "TASK"
  | "EXAM"
  | "EXPENSE"
  | "INCOME"
  | "HABIT"
  | "GOAL"
  | "EVENT";

export interface ParsedEntry {
  id: string;
  type: EntryType;
  title: string;
  description?: string;
  dueAt?: string | null; // ISO String
  startAt?: string | null;
  effortMin?: number | null; // in minutes
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  weight?: number | null; // 0.0 to 1.0
  amount?: number | null; // for transactions
  category?: string | null; // "College", "Career & Projects", "Finance", "Goals", "Routines & Habits", "Health & Fitness", "Personal"
  frequencyDays?: number | null; // for habits (e.g. 3 for 3x/week)
  targetValue?: number | null; // for goals (e.g. 5000 for ₹5000)
  unit?: string | null; // "INR", "CGPA", "days", etc.
  courseCode?: string | null; // "CS301", "DBMS", "OS", etc.
  subtasks?: string[];
  isRecurring?: boolean;
  recurringFrequency?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  confidence: number; // 0.0 to 1.0
  raw: string;
  clarificationQuestion?: string | null;
  isAmbiguous?: boolean;
}

export interface ParseResult {
  entries: ParsedEntry[];
  source: "gemini" | "rule-based";
  originalText: string;
}
