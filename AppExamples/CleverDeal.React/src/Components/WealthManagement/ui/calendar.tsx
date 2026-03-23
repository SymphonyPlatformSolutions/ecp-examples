import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from './utils';

interface CalendarProps {
  className?: string;
  selected?: Date;
  onSelect?: (date: Date) => void;
}

function isSameDay(a?: Date, b?: Date) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function Calendar({ className, selected, onSelect }: CalendarProps) {
  const [viewDate, setViewDate] = useState(selected ?? new Date());

  useEffect(() => {
    if (selected) {
      setViewDate(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [selected]);

  const monthLabel = viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = (startOfMonth.getDay() + 6) % 7;

  const days = useMemo(() => {
    const result: Array<Date | null> = [];
    for (let index = 0; index < startOffset; index += 1) {
      result.push(null);
    }

    const totalDays = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= totalDays; day += 1) {
      result.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    }

    while (result.length % 7 !== 0) {
      result.push(null);
    }

    return result;
  }, [startOffset, viewDate]);

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-3', className)}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-[12px] font-semibold text-slate-900">{monthLabel}</div>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-1.5">
        {days.map((day, index) =>
          day ? (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              className={cn(
                'mx-auto flex h-7 w-7 items-center justify-center rounded-md text-[11px] text-slate-700 transition-colors hover:bg-slate-100',
                isSameDay(day, selected) && 'bg-[#0a2c63] text-white hover:bg-[#0a2c63]',
              )}
            >
              {day.getDate()}
            </button>
          ) : (
            <div key={`empty-${index}`} className="h-7" />
          ),
        )}
      </div>
    </div>
  );
}