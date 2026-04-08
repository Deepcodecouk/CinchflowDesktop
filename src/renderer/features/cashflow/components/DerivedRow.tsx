import { cn } from '../../../lib/utils';
import { GridCell } from './GridCell';
import { MonthColumnWrapper } from './MonthColumnWrapper';
import { computeHybridColor, getBalanceValueColor, getOverUnderColor } from './cashflow-types';
import type { MonthColumnConfig } from './cashflow-types';

interface DerivedRowProps {
  label: string;
  getValue: (month: number) => number;
  months: MonthColumnConfig[];
  currencySymbol: string;
  bold?: boolean;
  getCurrentMonthBreakdown?: (month: number) => { budget: number; actual: number; hybrid: number };
  invertActuals?: boolean;
  zeroIsGreen?: boolean;
}

export function DerivedRow({
  label,
  getValue,
  months,
  currencySymbol,
  bold = false,
  getCurrentMonthBreakdown,
  invertActuals = false,
  zeroIsGreen = false,
}: DerivedRowProps) {

  function renderCells(month: number, subCellCount: number, monthType: string) {

    if (subCellCount >= 2 && getCurrentMonthBreakdown) {

      const { budget, actual, hybrid } = getCurrentMonthBreakdown(month);
      const displayedActual = invertActuals ? -actual : actual;
      const budgetColor = zeroIsGreen ? getBalanceValueColor(budget) : undefined;
      const actualColor = zeroIsGreen
        ? getBalanceValueColor(displayedActual)
        : getOverUnderColor(displayedActual, budget, invertActuals);
      const hybridColor = computeHybridColor(actual, budget, hybrid, invertActuals);

      if (subCellCount === 3) {

        return (
          <>
            <GridCell
              purpose="derived"
              value={budget}
              currencySymbol={currencySymbol}
              bold={bold}
              colorOverride={budgetColor}
              reserveBudgetActionSpace
            />
            <GridCell purpose="derived" value={displayedActual} currencySymbol={currencySymbol} bold={bold} colorOverride={actualColor} />
            <GridCell purpose="derived" value={hybrid} currencySymbol={currencySymbol} bold={bold} colorOverride={hybridColor} />
          </>
        );
      
}

      return (
        <>
          <GridCell
            purpose="derived"
            value={budget}
            currencySymbol={currencySymbol}
            bold={bold}
            colorOverride={budgetColor}
            reserveBudgetActionSpace
          />
          <GridCell purpose="derived" value={displayedActual} currencySymbol={currencySymbol} bold={bold} colorOverride={actualColor} />
        </>
      );
    
}

    const value = getValue(month);
    const displayedValue = monthType === 'past' && invertActuals ? -value : value;
    const color = zeroIsGreen
      ? getBalanceValueColor(displayedValue)
      : monthType === 'past'
        ? 'text-zinc-500'
        : undefined;

    if (subCellCount === 3) {

      return (
        <>
          <GridCell
            purpose="derived"
            value={displayedValue}
            currencySymbol={currencySymbol}
            bold={bold}
            colorOverride={color}
            reserveBudgetActionSpace
          />
          <GridCell purpose="derived" value={displayedValue} currencySymbol={currencySymbol} bold={bold} colorOverride={color} />
          <GridCell purpose="derived" value={displayedValue} currencySymbol={currencySymbol} bold={bold} colorOverride={color} />
        </>
      );
    
}

    if (subCellCount === 2) {

      return (
        <>
          <GridCell
            purpose="derived"
            value={displayedValue}
            currencySymbol={currencySymbol}
            bold={bold}
            colorOverride={color}
            reserveBudgetActionSpace
          />
          <GridCell purpose="derived" value={displayedValue} currencySymbol={currencySymbol} bold={bold} colorOverride={color} />
        </>
      );
    
}

    return (
      <GridCell
        purpose="derived"
        value={displayedValue}
        currencySymbol={currencySymbol}
        bold={bold}
        colorOverride={color}
        reserveBudgetActionSpace={monthType !== 'past'}
      />
    );
  
}

  return (
    <div className={cn('flex items-stretch', bold ? 'border-b border-zinc-700 bg-zinc-800/20' : 'border-b border-zinc-800/50')}>
      <div className={cn('sticky left-0 z-10 w-52 flex-shrink-0 border-r border-zinc-700 px-3 py-1.5', bold ? 'bg-[#1b1b1e]' : 'bg-zinc-900')}>
        <span className={cn('block truncate text-xs', bold ? 'font-semibold text-zinc-200' : 'text-zinc-400')}>
          {label}
        </span>
      </div>
      {months.map((config) => (
        <MonthColumnWrapper key={config.month} config={config}>
          {renderCells(config.month, config.subCellCount, config.monthType)}
        </MonthColumnWrapper>
      ))}
    </div>
  );

}
