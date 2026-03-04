import { useState } from "react";

export type DateRange = {
  year: number;
  month: number | null; // null = all months
  dayStart: number | null;
  dayEnd: number | null;
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function useDateFilter(initialYear?: number, initialMonth?: number | null): [DateRange, (r: DateRange) => void] {
  const now = new Date();
  const [range, setRange] = useState<DateRange>({
    year: initialYear ?? now.getFullYear(),
    month: initialMonth !== undefined ? initialMonth : now.getMonth(),
    dayStart: null,
    dayEnd: null,
  });
  return [range, setRange];
}

/** Produce SQL-compatible date strings from a DateRange */
export function dateRangeToFilter(range: DateRange): { start: string; end: string } {
  const { year, month, dayStart, dayEnd } = range;
  if (month === null) {
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  const m = String(month + 1).padStart(2, "0");
  const maxDay = daysInMonth(year, month);
  const ds = dayStart ?? 1;
  const de = dayEnd ?? maxDay;
  return {
    start: `${year}-${m}-${String(ds).padStart(2, "0")}`,
    end: `${year}-${m}-${String(de).padStart(2, "0")}`,
  };
}

/** Get human-readable label for the current filter */
export function dateRangeLabel(range: DateRange): string {
  if (range.month === null) return `${range.year}`;
  const label = `${MONTHS[range.month]} ${range.year}`;
  if (range.dayStart !== null && range.dayEnd !== null) {
    return `${range.dayStart}–${range.dayEnd} ${label}`;
  }
  return label;
}
