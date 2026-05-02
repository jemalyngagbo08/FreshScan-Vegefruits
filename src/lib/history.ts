export type AnalysisResult = {
  detected: boolean;
  name: string;
  category: "fruit" | "vegetable" | "unknown";
  freshness: "fresh" | "rotten" | "unknown";
  confidence: number;
  reason: string;
  tip: string;
};

export type HistoryItem = {
  id: string;
  timestamp: number;
  thumbnail: string;
  result: AnalysisResult;
  feedback?: "correct" | "incorrect";
};

const KEY = "freshcheck.history.v1";
const MAX = 30;

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(item: HistoryItem) {
  const items = [item, ...loadHistory()].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function updateFeedback(id: string, feedback: "correct" | "incorrect") {
  const items = loadHistory().map((i) => (i.id === id ? { ...i, feedback } : i));
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}

export function deleteHistoryItem(id: string) {
  const items = loadHistory().filter((item) => item.id !== id);
  localStorage.setItem(KEY, JSON.stringify(items));
}
