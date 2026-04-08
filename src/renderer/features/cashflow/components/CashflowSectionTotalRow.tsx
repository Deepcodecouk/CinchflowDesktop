import { GridCell } from './GridCell';
import { MonthColumnWrapper } from './MonthColumnWrapper';
import { computeActualColor, computeHybridColor } from './cashflow-types';
import type { CashflowBreakdown, MonthColumnConfig } from './cashflow-types';

interface CashflowSectionTotalRowProps {
  label: string;
  months: MonthColumnConfig[];
  currencySymbol: string;
  invertActuals?: boolean;
  getTotalValue: (month: number) => number;
  getTotalBreakdown?: (month: number) => CashflowBreakdown;
}

export function CashflowSectionTotalRow({
  label,
  months,
  currencySymbol,
  invertActuals = false,
  getTotalValue,
  getTotalBreakdown,
}: CashflowSectionTotalRowProps) {

  function renderMonthCells(month: number, monthType: string, subCellCount: number) {

    if (subCellCount >= 2 && getTotalBreakdown) {

      const { budget, actual, hybrid } = getTotalBreakdown(month);
      const displayedActual = invertActuals ? -actual : actual;
      const actualColor = computeActualColor(actual, budget, invertActuals);
      const hybridColor = computeHybridColor(actual, budget, hybrid, invertActuals);

      if (subCellCount === 3) {

        return (
          <>
            <GridCell purpose="total" value={budget} currencySymbol={currencySymbol} bold reserveBudgetActionSpace />
            <GridCell purpose="total" value={displayedActual} currencySymbol={currencySymbol} bold colorOverride={actualColor} />
            <GridCell
              purpose="total"
              value={hybrid}
              currencySymbol={currencySymbol}
              bold
              colorOverride={hybridColor}
            />
          </>
        );
      
}

      return (
        <>
          <GridCell purpose="total" value={budget} currencySymbol={currencySymbol} bold reserveBudgetActionSpace />
          <GridCell purpose="total" value={displayedActual} currencySymbol={currencySymbol} bold colorOverride={actualColor} />
        </>
      );
    
}

    const totalValue = getTotalValue(month);
    const displayedValue = monthType === 'past' && invertActuals ? -totalValue : totalValue;

    return (
      <GridCell
        purpose="total"
        value={displayedValue}
        currencySymbol={currencySymbol}
        bold
        colorOverride={monthType === 'past' ? 'text-zinc-500' : undefined}
        reserveBudgetActionSpace={monthType !== 'past'}
      />
    );
  
}

  return (
    <div className="flex items-stretch border-t border-zinc-700 border-b border-b-zinc-700 bg-zinc-800/30">
      <div className="sticky left-0 z-10 w-52 flex-shrink-0 border-r border-zinc-700 bg-[#1d1d20] px-3 py-1.5">
        <span className="block truncate text-xs font-semibold text-zinc-300">{label}</span>
      </div>
      {months.map((config) => (
        <MonthColumnWrapper key={config.month} config={config}>
          {renderMonthCells(config.month, config.monthType, config.subCellCount)}
        </MonthColumnWrapper>
      ))}
    </div>
  );

}
