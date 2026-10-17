import * as chrono from "chrono-node";
import { ParsedEntry } from "./types";

// Known Indian College Subjects & Acronyms with full aliases
const COURSE_ALIASES: Array<{ code: string; patterns: RegExp[] }> = [
  { code: "DBMS", patterns: [/\bdbms\b/i, /database\s*management/i, /database/i] },
  { code: "OS", patterns: [/\bos\b/i, /operating\s*systems?/i] },
  { code: "DSA", patterns: [/\bdsa\b/i, /data\s*structures?/i, /algorithms?/i] },
  { code: "CN", patterns: [/\bcn\b/i, /computer\s*networks?/i, /networking/i] },
  { code: "AI", patterns: [/\bai\b/i, /artificial\s*intelligence/i] },
  { code: "ML", patterns: [/\bml\b/i, /machine\s*learning/i] },
  { code: "TOC", patterns: [/\btoc\b/i, /theory\s*of\s*computation/i, /automata/i] },
  { code: "COA", patterns: [/\bcoa\b/i, /computer\s*organization/i] },
  { code: "OOPS", patterns: [/\boops?\b/i, /object\s*oriented/i] },
  { code: "SE", patterns: [/\bse\b/i, /software\s*engineering/i] },
  { code: "PHYSICS", patterns: [/\bphysics\b/i] },
  { code: "MATHS", patterns: [/\bmaths?\b/i, /calculus/i, /linear\s*algebra/i] },
];

function matchCourseCode(text: string): string | null {
  for (const item of COURSE_ALIASES) {
    if (item.patterns.some((p) => p.test(text))) {
      return item.code;
    }
  }
  return null;
}

// Clean and normalize text fragments
function cleanText(txt: string): string {
  return txt.trim().replace(/^[,;\-\s]+|[,;\-\s]+$/g, "");
}

// Split multi-intent text into separate intent chunks
export function splitClauses(input: string): string[] {
  // First split by commas, semicolons, or newlines
  const primarySplits = input.split(/[\n;]+|,\s*(?=[a-zA-Z0-9₹])/i);
  const clauses: string[] = [];

  for (const part of primarySplits) {
    const trimmed = cleanText(part);
    if (!trimmed) continue;

    // Split on 'and' ONLY when followed by action keywords starting a new item
    const subClauses = trimmed.split(/\s+and\s+(?=(?:spent|paid|bought|save|saving|gym\b|workout|need to|have to|must finish|due\b|record\b|log\b|petrol\b|diesel\b|travel\b))/i);
    for (const sub of subClauses) {
      const cleanSub = cleanText(sub);
      if (cleanSub) {
        clauses.push(cleanSub);
      }
    }
  }

  return clauses.length > 0 ? clauses : [input.trim()];
}

// Parse single clause into a typed ParsedEntry
export function parseSingleClause(clause: string, index: number): ParsedEntry {
  const lower = clause.toLowerCase();
  const id = `parsed-${Date.now()}-${index}`;

  // 1. DURATION / EFFORT EXTRACTION (e.g. "spend 30 minutes", "for 45 mins", "take 2 hours")
  const durationRegex = /\b(?:spend|take|for|about)?\s*(\d+(?:\.\d+)?)\s*(?:mins?|minutes?|hrs?|hours?)\b/i;
  const durationMatch = clause.match(durationRegex);
  let detectedEffortMin: number | null = null;
  let hasExplicitDuration = false;
  let textWithoutDuration = clause;

  if (durationMatch) {
    const num = parseFloat(durationMatch[1]);
    const isHr = /hr|hour/i.test(durationMatch[0]);
    detectedEffortMin = Math.round(isHr ? num * 60 : num);
    hasExplicitDuration = true;
    textWithoutDuration = clause.replace(durationMatch[0], "").trim();
  }

  // 2. DATE & TIME EXTRACTION via chrono-node
  const chronoResults = chrono.parse(textWithoutDuration, new Date(), { forwardDate: true });
  let dueAt: string | null = null;
  let textWithoutDate = textWithoutDuration;

  if (chronoResults.length > 0) {
    const parsedDate = chronoResults[0].start.date();
    dueAt = parsedDate.toISOString();
    const dateText = chronoResults[0].text;
    textWithoutDate = textWithoutDate.replace(new RegExp(`(?:due|by|on|at)?\\s*${dateText}`, "i"), "").trim();
  }

  // 3. PRIORITY DETECTION
  let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
  if (/\b(?:urgent|asap|emergency|immediately|right now|critical)\b/i.test(clause)) {
    priority = "URGENT";
  } else if (/\b(?:important|high priority|must finish|crucial|top priority|pending assignments?)\b/i.test(clause)) {
    priority = "HIGH";
  } else if (/\b(?:low priority|whenever|someday|optional|can wait)\b/i.test(clause)) {
    priority = "LOW";
  }

  // 4. CHECK EXPENSE / INCOME (guard against duration phrases like "spend 30 minutes")
  const recordExpenseMatch = textWithoutDate.match(/(?:record|log|add)\s+(?:my\s+)?([a-zA-Z\s]+?)\s+expense(?:\s*(?:of|for)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?))?/i) ||
    textWithoutDate.match(/(?:petrol|fuel|diesel)\s+expense(?:\s*(?:of|for)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?))?/i);

  const expenseMatch = !hasExplicitDuration && (
    textWithoutDate.match(/(?:spent|paid|bought|cost|recharge|mess|canteen|order|swiggy|zomato|chai|coffee|auto|metro|uber|ola)\s*(?:of|for)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i) ||
    textWithoutDate.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)\s*(?:on|for|spent)?/i) ||
    textWithoutDate.match(/(\d+(?:\.\d+)?)\s*(?:rs|rupees|bucks)\s*(?:on|for)?/i) ||
    textWithoutDate.match(/(?:spent|paid)\s+(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s+(?:on|for)?\s*(.*)/i)
  );

  const incomeMatch = textWithoutDate.match(/(?:received|got|earned|allowance|salary|cashback|pocket money)\s*(?:of|for)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i);

  if (incomeMatch) {
    const amount = parseFloat(incomeMatch[1]);
    let title = textWithoutDate.replace(incomeMatch[0], "").trim();
    if (!title) title = "Allowance / Income";
    return {
      id,
      type: "INCOME",
      title: title.charAt(0).toUpperCase() + title.slice(1),
      amount,
      category: "Finance",
      confidence: 0.92,
      raw: clause,
    };
  }

  if (recordExpenseMatch) {
    const rawAmt = recordExpenseMatch[2] || (recordExpenseMatch[0].match(/(\d+(?:\.\d+)?)/)?.[1]);
    const amount = rawAmt ? parseFloat(rawAmt) : null;
    let subject = recordExpenseMatch[1]?.trim() || "Petrol";
    if (/petrol|fuel|diesel/i.test(clause)) subject = "Petrol";

    let category = "Personal";
    if (/petrol|fuel|diesel|cab|auto|uber|ola|metro/i.test(clause)) {
      category = "Travel";
    }

    return {
      id,
      type: "EXPENSE",
      title: `${subject.charAt(0).toUpperCase() + subject.slice(1)} Expense`,
      amount,
      category,
      confidence: 0.92,
      raw: clause,
      clarificationQuestion: amount ? null : `Enter amount for ${subject} expense:`,
    };
  }

  if (expenseMatch) {
    const amount = parseFloat(expenseMatch[1]);
    let subject = textWithoutDate
      .replace(expenseMatch[0], "")
      .replace(/^(?:spent|paid|on|for|a|an|the)\s+/i, "")
      .trim();

    let category = "Personal";
    const subLower = (subject + " " + clause).toLowerCase();

    if (/lunch|dinner|breakfast|food|canteen|swiggy|zomato|chai|coffee|snack|maggie|biryani|mess/i.test(subLower)) {
      category = "Food";
      if (!subject) subject = "Lunch / Food";
    } else if (/metro|auto|bus|cab|uber|ola|travel|petrol|fuel|train/i.test(subLower)) {
      category = "Travel";
      if (!subject) subject = "Travel / Transport";
    } else if (/book|print|xerox|stationery|pen|notebook|assignment sheet|manual/i.test(subLower)) {
      category = "Academics";
      if (!subject) subject = "Stationery & Academics";
    } else if (/recharge|jio|airtel|wifi|internet/i.test(subLower)) {
      category = "Tech";
      if (!subject) subject = "Mobile / Wi-Fi Recharge";
    }

    if (!subject) subject = `Expense (₹${amount})`;

    return {
      id,
      type: "EXPENSE",
      title: subject.charAt(0).toUpperCase() + subject.slice(1),
      amount,
      category,
      confidence: 0.95,
      raw: clause,
    };
  }

  // 5. CHECK GOAL
  const goalMatch = textWithoutDate.match(/(?:save|saving|target|aim for|goal)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?(?:k)?)\s*(?:for|to buy|towards)?\s*(.*)/i);
  if (goalMatch || lower.includes("save ") || lower.includes("saving ")) {
    let targetValue = 5000;
    let title = "Savings Goal";

    if (goalMatch) {
      let rawNum = goalMatch[1].toLowerCase();
      if (rawNum.endsWith("k")) {
        targetValue = parseFloat(rawNum.replace("k", "")) * 1000;
      } else {
        targetValue = parseFloat(rawNum);
      }
      title = goalMatch[2] ? `Save for ${cleanText(goalMatch[2])}` : `Save ₹${targetValue}`;
    } else {
      const numMatch = textWithoutDate.match(/(\d+(?:\.\d+)?)/);
      if (numMatch) targetValue = parseFloat(numMatch[1]);
      title = textWithoutDate;
    }

    return {
      id,
      type: "GOAL",
      title: title.charAt(0).toUpperCase() + title.slice(1),
      targetValue,
      unit: "INR",
      dueAt,
      category: "Goals",
      confidence: 0.9,
      raw: clause,
    };
  }

  // 6. CHECK HABIT
  const freqMatch = textWithoutDate.match(/(\d+)\s*(?:times|x|days)\s*(?:a|per)?\s*(?:week|wk)/i);
  const isDaily = /daily|every\s*day|every\s*morning|every\s*night/i.test(textWithoutDate);
  const isHabitKeyword = /gym|workout|meditate|habit|read|water|running|jogging|pushups|sleep by/i.test(textWithoutDate);

  if (freqMatch || isDaily || (isHabitKeyword && !lower.includes("assignment") && !lower.includes("exam") && !lower.includes("project"))) {
    let freq = 7;
    if (freqMatch) {
      freq = parseInt(freqMatch[1], 10);
    } else if (!isDaily && isHabitKeyword) {
      freq = 3;
    }

    let habitName = textWithoutDate
      .replace(/(\d+)\s*(?:times|x|days)\s*(?:a|per)?\s*(?:week|wk)/gi, "")
      .replace(/daily|every\s*day|every\s*morning|every\s*night/gi, "")
      .trim();

    if (!habitName) habitName = "Habit";

    return {
      id,
      type: "HABIT",
      title: habitName.charAt(0).toUpperCase() + habitName.slice(1),
      frequencyDays: freq,
      category: "Health & Fitness",
      confidence: 0.92,
      raw: clause,
    };
  }

  // 7. CHECK EXAM / DEADLINE
  if (/exam|midsem|endsem|quiz|test|viva|finals|practical/i.test(textWithoutDate)) {
    const courseCode = matchCourseCode(textWithoutDate) || "GEN";

    return {
      id,
      type: "EXAM",
      title: textWithoutDate.charAt(0).toUpperCase() + textWithoutDate.slice(1),
      dueAt: dueAt || new Date(Date.now() + 7 * 86400000).toISOString(),
      effortMin: detectedEffortMin || 180,
      priority: "URGENT",
      weight: 0.95,
      category: "College",
      courseCode,
      confidence: 0.94,
      raw: clause,
    };
  }

  // 8. CHECK EVENT
  if (/meeting|workshop|class|lecture|seminar|meetup|hackathon|call with/i.test(textWithoutDate)) {
    return {
      id,
      type: "EVENT",
      title: textWithoutDate.charAt(0).toUpperCase() + textWithoutDate.slice(1),
      dueAt: dueAt || new Date(Date.now() + 86400000).toISOString(),
      effortMin: detectedEffortMin || 60,
      priority,
      category: /class|lecture|seminar/i.test(textWithoutDate) ? "College" : "Personal",
      confidence: 0.88,
      raw: clause,
    };
  }

  // 9. DEFAULT TO TASK
  const courseCode = matchCourseCode(textWithoutDate);

  // Category matching
  let category = "Personal";
  if (courseCode || /\b(?:college|campus|assignment|assignments|lab|exam|homework|manual|study|professor|lecture|viva|quiz|syllabus|cs\d+|dbms|dsa|coa|cn|os)\b/i.test(textWithoutDate)) {
    category = "College";
  } else if (/\b(?:project|projects|code|build|portfolio|github|deploy|client|resume|interview|meeting|bug|feature|api|pull\s*request|pr\b)/i.test(textWithoutDate)) {
    category = "Career & Projects";
  } else if (/\b(?:financ|finances|budget|tax|bank|saving|invest|bill|salary|invoice|allowance|recharge|organizing my finances)\b/i.test(textWithoutDate)) {
    category = "Finance";
  } else if (/\b(?:gym|workout|running|run|exercise|yoga|pushup|water|sleep|meditat|health|fitness)\b/i.test(textWithoutDate)) {
    category = "Health & Fitness";
  } else if (/\b(?:routine|morning|wind-down|evening\s*review|habit)\b/i.test(textWithoutDate)) {
    category = "Routines & Habits";
  }

  let effortMin = detectedEffortMin || 45;
  if (!detectedEffortMin) {
    if (/assignment|project|report|lab record|submission|writeup/i.test(textWithoutDate)) {
      effortMin = 90;
    } else if (/quick|email|call|reply|print|buy|clean/i.test(textWithoutDate)) {
      effortMin = 20;
    } else if (/study|prepare|revise|code|build/i.test(textWithoutDate)) {
      effortMin = 120;
    }
  }

  // Clean task title
  let taskTitle = textWithoutDate
    .replace(/^due\s+/i, "")
    .replace(/^(?:i\s*need\s*to\s*|i\s*have\s*to\s*|need\s*to\s*|must\s*|spend\s+|take\s+|for\s+)/i, "")
    .replace(/^(?:organizing|organise)\s+/i, "Organize ")
    .replace(/^(?:completing)\s+/i, "Complete ")
    .replace(/^(?:finishing)\s+/i, "Finish ")
    .trim();

  if (!taskTitle) taskTitle = clause;

  const isAmbiguous = dueAt === null;
  const clarificationQuestion = isAmbiguous
    ? "When should this task be finished?"
    : null;

  return {
    id,
    type: "TASK",
    title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
    dueAt: dueAt || new Date(Date.now() + 86400000).toISOString(),
    effortMin,
    priority,
    weight: priority === "URGENT" ? 0.95 : priority === "HIGH" ? 0.85 : priority === "MEDIUM" ? 0.6 : 0.4,
    category,
    courseCode,
    confidence: 0.9,
    raw: clause,
    isAmbiguous,
    clarificationQuestion,
  };
}

// Master deterministic multi-intent parser
export function parseDeterministic(input: string): ParsedEntry[] {
  if (!input || !input.trim()) return [];
  const clauses = splitClauses(input);
  return clauses.map((clause, idx) => parseSingleClause(clause, idx));
}
