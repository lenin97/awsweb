import { ulid } from "ulid";

export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function generateProcessId(): {
  processId: string;
  date: string;
} {
  const date = getTodayDate(); // 2025-12-22
  const processId = `${date}_${ulid()}`;

  return { processId, date };
}
