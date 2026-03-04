import React, { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DateRange } from "@/lib/dateFilter";
import { dateRangeLabel } from "@/lib/dateFilter";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const YEARS = (() => {
  const curr = new Date().getFullYear();
  const years: number[] = [];
  for (let y = 2024; y <= curr; y++) years.push(y);
  return years;
})();

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

interface DateFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  compact?: boolean;
}

export function DateFilter({ value, onChange, compact }: DateFilterProps) {
  const [open, setOpen] = useState(false);

  const maxDays =
    value.month !== null ? daysInMonth(value.year, value.month) : 31;

  return (
    <div className="relative">
      {/* Trigger button */}
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        className={`gap-2 border-slate-200 bg-white hover:bg-slate-50 shadow-sm ${compact ? "h-8 text-xs px-2.5" : "h-9 text-sm px-3"}`}
      >
        <Calendar
          className={
            compact ? "w-3 h-3 text-blue-600" : "w-4 h-4 text-blue-600"
          }
        />
        <span className="font-medium text-slate-700">
          {dateRangeLabel(value)}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Button>

      {/* Dropdown panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-[300px] animate-in fade-in zoom-in-95 duration-150">
            {/* Year row */}
            <div className="mb-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Ano
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() =>
                      onChange({
                        ...value,
                        year: y,
                        dayStart: null,
                        dayEnd: null,
                      })
                    }
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      value.year === y
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Month row */}
            <div className="mb-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Mês
              </label>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() =>
                    onChange({
                      ...value,
                      month: null,
                      dayStart: null,
                      dayEnd: null,
                    })
                  }
                  className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                    value.month === null
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Todos
                </button>
                {MONTHS.map((m, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      onChange({
                        ...value,
                        month: i,
                        dayStart: null,
                        dayEnd: null,
                      })
                    }
                    className={`px-2 py-1.5 text-[11px] font-medium rounded-lg transition-all truncate ${
                      value.month === i
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {m.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Day range (only when a month is selected) */}
            {value.month !== null && (
              <div className="mb-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Período (dias)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={maxDays}
                    placeholder="De"
                    value={value.dayStart ?? ""}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        dayStart: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="w-20 h-8 border border-slate-200 rounded-lg text-center text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-400">até</span>
                  <input
                    type="number"
                    min={1}
                    max={maxDays}
                    placeholder="Até"
                    value={value.dayEnd ?? ""}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        dayEnd: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="w-20 h-8 border border-slate-200 rounded-lg text-center text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const now = new Date();
                  onChange({
                    year: now.getFullYear(),
                    month: now.getMonth(),
                    dayStart: null,
                    dayEnd: null,
                  });
                  setOpen(false);
                }}
                className="flex-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 rounded-lg py-1.5 transition-colors"
              >
                Mês Atual
              </button>
              <button
                onClick={() => {
                  onChange({
                    year: new Date().getFullYear(),
                    month: null,
                    dayStart: null,
                    dayEnd: null,
                  });
                  setOpen(false);
                }}
                className="flex-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 rounded-lg py-1.5 transition-colors"
              >
                Ano Inteiro
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg py-1.5 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
