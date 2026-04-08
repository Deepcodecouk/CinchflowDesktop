import { ChevronDown, ChevronRight } from 'lucide-react';
import { GridCell } from './GridCell';
import { MonthColumnWrapper } from './MonthColumnWrapper';
import { computeActualColor, computeHybridColor } from './cashflow-types';
import type { MonthColumnConfig } from './cashflow-types';
import type { CashflowCalculations } from '../hooks/use-cashflow-calculations';
import type { CashflowActualTransactionsFilter, CategoryHierarchy } from '../../../../shared/types';

interface CashflowCollapsedHeaderRowProps {
  hierarchy: CategoryHierarchy;
  isCollapsed: boolean;
  months: MonthColumnConfig[];
  calc: CashflowCalculations;
  currencySymbol: string;
  getComment: (categoryId: string, month: number) => string | null;
  onToggleCollapse: (headerId: string) => void;
  onDrilldown: (month: number, filter: CashflowActualTransactionsFilter) => void;
}

export function CashflowCollapsedHeaderRow({
  hierarchy,
  isCollapsed,
  months,
  calc,
  currencySymbol,
  getComment,
  onToggleCollapse,
  onDrilldown,
}: CashflowCollapsedHeaderRowProps) {

  const isExpenseHeader = hierarchy.header.type === 'fixed_expense' || hierarchy.header.type === 'variable_expense';

  function handleToggleCollapse() {

    onToggleCollapse(hierarchy.header.id);
  
}

  function handleHeaderDrilldown(month: number) {

    onDrilldown(month, {
      kind: 'header',
      headerId: hierarchy.header.id,
      headerName: hierarchy.header.name,
    });
  
}

  function getHeaderCommentSummary(month: number): string | null {

    const comments = hierarchy.categories.flatMap((category) => {

      const comment = getComment(category.id, month);

      return comment ? [`${category.name}: ${comment}`] : [];
    
    });

    return comments.length > 0 ? comments.join('\n') : null;

  }

  function renderCollapsedMonthCells(config: MonthColumnConfig) {

    const month = config.month;

    if (!isCollapsed) {

      return null;
    
}

    if (config.subCellCount === 3) {

      const budgetTotal = hierarchy.categories.reduce((sum, category) => sum + calc.getBudget(category.id, month), 0);
      const actualTotal = hierarchy.categories.reduce((sum, category) => sum + calc.getActual(category.id, month), 0);
      const hybridTotal = hierarchy.categories.reduce((sum, category) => sum + Math.abs(calc.getHybrid(category.id, month)), 0);
      const commentSummary = getHeaderCommentSummary(month);
      const displayedActual = isExpenseHeader ? -actualTotal : actualTotal;
      const actualColor = computeActualColor(actualTotal, budgetTotal, isExpenseHeader);
      const hybridColor = computeHybridColor(actualTotal, budgetTotal, hybridTotal, isExpenseHeader);
      const handleActualDrilldown = () => handleHeaderDrilldown(month);

      return (
        <>
          <GridCell
            purpose="total"
            value={budgetTotal}
            currencySymbol={currencySymbol}
            bold
            reserveBudgetActionSpace
            commentSummary={commentSummary}
          />
          <GridCell
            purpose="total"
            value={displayedActual}
            currencySymbol={currencySymbol}
            bold
            colorOverride={actualColor}
            onDrilldown={handleActualDrilldown}
          />
          <GridCell
            purpose="total"
            value={hybridTotal}
            currencySymbol={currencySymbol}
            bold
            colorOverride={hybridColor}
          />
        </>
      );
    
}

    if (config.subCellCount === 2) {

      const budgetTotal = hierarchy.categories.reduce((sum, category) => sum + calc.getBudget(category.id, month), 0);
      const actualTotal = hierarchy.categories.reduce((sum, category) => sum + calc.getActual(category.id, month), 0);
      const commentSummary = getHeaderCommentSummary(month);
      const displayedActual = isExpenseHeader ? -actualTotal : actualTotal;
      const actualColor = computeActualColor(actualTotal, budgetTotal, isExpenseHeader);
      const handleActualDrilldown = () => handleHeaderDrilldown(month);

      return (
        <>
          <GridCell
            purpose="total"
            value={budgetTotal}
            currencySymbol={currencySymbol}
            bold
            reserveBudgetActionSpace
            commentSummary={commentSummary}
          />
          <GridCell
            purpose="total"
            value={displayedActual}
            currencySymbol={currencySymbol}
            bold
            colorOverride={actualColor}
            onDrilldown={handleActualDrilldown}
          />
        </>
      );
    
}

    const totalValue = calc.sumHeader(hierarchy, month, config.monthType);
    const displayedValue = config.monthType === 'past' && isExpenseHeader ? -totalValue : totalValue;
    const commentSummary = getHeaderCommentSummary(month);
    const handlePastDrilldown = () => handleHeaderDrilldown(month);

    return (
      <GridCell
        purpose="total"
        value={displayedValue}
        currencySymbol={currencySymbol}
        bold
        colorOverride={config.monthType === 'past' ? 'text-zinc-500' : undefined}
        reserveBudgetActionSpace={config.monthType !== 'past'}
        commentSummary={commentSummary}
        onDrilldown={config.monthType === 'past' ? handlePastDrilldown : undefined}
      />
    );
  
}

  return (
    <div className="flex items-stretch border-b border-zinc-800/50 hover:bg-zinc-800/20">
      <button
        type="button"
        className="sticky left-0 z-10 flex w-52 flex-shrink-0 items-center gap-1 border-r border-zinc-700 bg-zinc-900 px-3 py-1.5 text-left hover:bg-zinc-800/80"
        onClick={handleToggleCollapse}
      >
        <span className="p-0.5">
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 text-zinc-500" />
          ) : (
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          )}
        </span>
        <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: hierarchy.header.colour }} />
        <span className="truncate text-xs font-semibold text-zinc-300">{hierarchy.header.name}</span>
      </button>
      {months.map((config) => (
        <MonthColumnWrapper key={config.month} config={config}>
          {renderCollapsedMonthCells(config)}
        </MonthColumnWrapper>
      ))}
    </div>
  );

}
