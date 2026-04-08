import { MessageSquare } from 'lucide-react';
import { cn, formatCurrency } from '../../../lib/utils';
import type { CellPurpose } from './cashflow-types';

interface GridCellProps {
  purpose: CellPurpose;
  value: number;
  currencySymbol: string;
  colorOverride?: string;
  bold?: boolean;
  onDrilldown?: () => void;
  reserveBudgetActionSpace?: boolean;
  commentSummary?: string | null;
}

export function GridCell({
  value,
  currencySymbol,
  colorOverride,
  bold = false,
  onDrilldown,
  reserveBudgetActionSpace = false,
  commentSummary,
}: GridCellProps) {

  const formattedValue = formatCurrency(value, currencySymbol);
  const isDrilldownCell = typeof onDrilldown === 'function';
  const hasComment = Boolean(commentSummary);

  function renderValue() {

    if (isDrilldownCell) {

      return (
        <span
          className={cn('block w-full cursor-pointer truncate px-0.5 text-right text-[10px] hover:underline', colorOverride)}
          onClick={onDrilldown}
        >
          {formattedValue}
        </span>
      );
    
}

    return (
      <span
        className={cn(
          'block w-full truncate px-0.5 text-right text-[10px]',
          bold && 'font-bold',
          colorOverride,
          value < 0 && !colorOverride && 'text-red-400',
        )}
      >
        {formattedValue}
      </span>
    );
  
}

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center',
        bold && 'font-bold',
        hasComment && '-my-1.5 rounded-sm bg-yellow-500/30 px-1 py-1.5',
      )}
    >
      <div className="min-w-0 flex-1">{renderValue()}</div>
      {reserveBudgetActionSpace && <div className="w-4 shrink-0" />}
      {(reserveBudgetActionSpace || hasComment) && (
        <div className="flex w-4 shrink-0 items-center justify-center">
          {hasComment ? (
            <span className="text-yellow-200" title={commentSummary ?? undefined} aria-label="Budget comments">
              <MessageSquare className="h-2.5 w-2.5" />
            </span>
          ) : null}
        </div>
      )}
    </div>
  );

}
