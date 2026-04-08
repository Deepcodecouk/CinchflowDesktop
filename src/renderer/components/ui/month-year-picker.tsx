import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES_SHORT } from '../../../shared/constants';

interface MonthYearPickerProps {
  year: number;
  month: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}

export function MonthYearPicker({ year, month, onSelect, onClose }: MonthYearPickerProps) {
  const [viewYear, setViewYear] = useState(year);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 p-3 w-56">
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setViewYear((y) => y - 1)}
            className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-zinc-200">{viewYear}</span>
          <button
            onClick={() => setViewYear((y) => y + 1)}
            className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1">
          {MONTH_NAMES_SHORT.map((name, idx) => {
            const m = idx + 1;
            const isSelected = viewYear === year && m === month;
            return (
              <button
                key={m}
                onClick={() => { onSelect(viewYear, m); onClose(); }}
                className={
                  isSelected
                    ? 'px-2 py-1.5 text-xs font-medium rounded bg-blue-600 text-white'
                    : 'px-2 py-1.5 text-xs font-medium rounded text-zinc-300 hover:bg-zinc-800'
                }
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
