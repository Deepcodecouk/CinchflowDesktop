import { ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { MonthColumnConfig } from './cashflow-types';
import { MONTH_NAMES_SHORT } from '../../../../shared/constants';

interface MonthHeaderRowProps {
  leftLabel: string;
  leftIcon: string;
  isSummaryOnly: boolean;
  months: MonthColumnConfig[];
  onToggleSummaryOnly: () => void;
  onOpenMonthContextMenu: (month: number, x: number, y: number) => void;
}

export function MonthHeaderRow({
  leftLabel,
  leftIcon,
  isSummaryOnly,
  months,
  onToggleSummaryOnly,
  onOpenMonthContextMenu,
}: MonthHeaderRowProps) {
  function handleContextMenuClick(month: number, event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onOpenMonthContextMenu(month, event.clientX, event.clientY);
  }

  function handleToggleSummaryMode() {
    onToggleSummaryOnly();
  }

  function handleMonthButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    const month = event.currentTarget.dataset.month;

    if (month) {
      handleContextMenuClick(parseInt(month, 10), event);
    }
  }

  return (
    <div className="sticky top-0 z-20 flex items-stretch rounded-t-lg border border-slate-600/80 border-b-zinc-700 bg-[#1f2940] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <button
        type="button"
        className="sticky left-0 z-30 flex w-52 flex-shrink-0 items-center justify-between gap-2 border-r border-slate-600/80 bg-[#2b3550] px-3 py-2 text-left hover:bg-[#344162]"
        onClick={handleToggleSummaryMode}
      >
        <span className="truncate text-sm font-medium text-zinc-100">
          {leftIcon} {leftLabel}
        </span>
        {isSummaryOnly ? <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-500" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-zinc-500" />}
      </button>
      {months.map((config, index) => (
        <div
          key={config.month}
          className={cn(
            'bg-[#1f2940] px-1 py-2 text-center',
            config.flexClass,
            config.minWidthClass,
            config.bgClass,
            config.borderClass,
          )}
        >
          <span className="flex items-center justify-center gap-0.5">
            <span className={cn('text-xs font-medium', config.monthType === 'current' ? 'text-blue-300' : 'text-zinc-400')}>
              {MONTH_NAMES_SHORT[index]}
            </span>
            {(config.monthType !== 'past' || config.expanded) && (
              <button
                data-month={config.month}
                className="p-0 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                onClick={handleMonthButtonClick}
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            )}
          </span>
          {config.subCellCount === 3 ? (
            <div className="flex gap-px text-[8px] text-zinc-600 mt-0.5">
              <div className="flex items-center min-w-0 flex-1">
                <span className="flex-1 text-center">Bud</span>
                <div className="w-4 flex-shrink-0" />
                <div className="w-4 flex-shrink-0" />
              </div>
              <span className="flex-1 text-center">Act</span>
              <span className="flex-1 text-center">Hyb</span>
            </div>
          ) : config.subCellCount === 2 ? (
            <div className="flex gap-px text-[8px] text-zinc-600 mt-0.5">
              <div className="flex items-center min-w-0 flex-1">
                <span className="flex-1 text-center">Bud</span>
                <div className="w-4 flex-shrink-0" />
                <div className="w-4 flex-shrink-0" />
              </div>
              <span className="flex-1 text-center">Act</span>
            </div>
          ) : (
            <div className="text-[8px] text-zinc-600 mt-0.5">
              {config.monthType === 'past' ? 'Act' : 'Bud'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
