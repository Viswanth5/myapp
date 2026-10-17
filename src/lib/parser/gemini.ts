import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedEntry } from "./types";
import { parseDeterministic } from "./deterministic";

const SYSTEM_PROMPT = `
You are the VIRA Life-OS Intelligent Capture Engine for students and professionals.
Convert free-form, conversational, messy student inputs into a structured JSON array of items.

Available Entry Types:
- TASK: assignments, lab records, coding practice, errands, chores, project submissions (dueAt ISO, effortMin, courseCode, weight)
- EXAM: tests, midsems, endsems, quizzes, vivas, practicals (dueAt ISO, effortMin, courseCode, weight: 0.7-1.0)
- EXPENSE: money spent (amount, category: "Food"|"Academics"|"Travel"|"Mess"|"Tech"|"Personal"|"Health")
- INCOME: money received, allowance, cashback (amount, category)
- HABIT: recurring habits or routines (frequencyDays: e.g. 3 for 3x/week or 7 for daily)
- GOAL: medium/long term targets (targetValue: number, unit: "INR"|"CGPA"|"days", dueAt ISO)
- EVENT: lectures, club meets, workshops, calls (dueAt ISO, effortMin)

Rules:
1. Always parse amounts in INR (₹). E.g. "180 on lunch" -> EXPENSE, amount 180, category "Food".
2. Multi-intent input (e.g. "DBMS assignment due friday 5pm, spent 180 on lunch, gym 3 times a week, save 5000 for laptop by december") MUST be split into separate entries.
3. Compute ISO strings for dates relative to current timestamp.
4. Output JSON strictly matching this schema:
[
  {
    "id": "item-1",
    "type": "TASK" | "EXAM" | "EXPENSE" | "INCOME" | "HABIT" | "GOAL" | "EVENT",
    "title": string,
    "dueAt": string | null,
    "effortMin": number | null,
    "weight": number | null,
    "amount": number | null,
    "category": string | null,
    "frequencyDays": number | null,
    "targetValue": number | null,
    "unit": string | null,
    "courseCode": string | null,
    "confidence": number,
    "raw": string
  }
]
`;

export async function parseWithGemini(input: string): Promise<ParsedEntry[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return parseDeterministic(input);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
      systemInstruction: SYSTEM_PROMPT,
    });

    const prompt = `Current time reference: ${new Date().toISOString()}\n\nUser Input to parse:\n"${input}"`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = JSON.parse(text) as ParsedEntry[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        ...item,
        id: item.id || `gemini-${Date.now()}-${idx}`,
        confidence: item.confidence ?? 0.95,
        raw: item.raw || input,
      }));
    }

    return parseDeterministic(input);
  } catch (error) {
    console.warn("Gemini parsing error, falling back to deterministic parser:", error);
    return parseDeterministic(input);
  }
}
