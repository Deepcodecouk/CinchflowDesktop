import { isEffectivelyZero } from '../../../lib/utils';

export type MonthType = 'past' | 'current' | 'future';

export type CarryForwardMode = 'hybrid' | 'budget' | 'actual';
export type CashflowAccountDisplayMode = 'full' | 'summary_only';

export interface CashflowBreakdown {
  budget: number;
  actual: number;
  hybrid: number;
}

export interface CellCoord {
  categoryId: string;
  month: number;
}

export interface ContextMenuState {
  categoryId: string;
  month: number;
  x: number;
  y: number;
}

export interface MonthContextMenuState {
  month: number;
  x: number;
  y: number;
}

export interface EditingCategoryName {
  id: string;
  name: string;
}

export type CellPurpose = 'budget' | 'actual' | 'hybrid' | 'total' | 'derived';

export interface MonthColumnConfig {
  month: number;
  monthType: MonthType;
  expanded: boolean;
  subCellCount: number;
  flexClass: string;
  minWidthClass: string;
  bgClass: string;
  borderClass: string;
}

export const CASHFLOW_MONTH_COUNT = 12;

export function buildCashflowMonthConfigs(year: number, showHistoricBudgets: boolean): MonthColumnConfig[] {

  return Array.from({ length: CASHFLOW_MONTH_COUNT }, (_, index) =>
    getMonthColumnConfig(year, index + 1, showHistoricBudgets),
  );

}

export function getMonthType(year: number, month: number): MonthType {

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) return 'past';
  if (year === currentYear && month === currentMonth) return 'current';

  return 'future';

}

export function getMonthColumnConfig(year: number, month: number, showHistoricBudgets: boolean): MonthColumnConfig {

  const monthType = getMonthType(year, month);
  const expanded = monthType === 'past' && showHistoricBudgets;

  if (monthType === 'current') {

    return {
      month,
      monthType,
      expanded: false,
      subCellCount: 3,
      flexClass: 'flex-[2]',
      minWidthClass: 'min-w-[360px]',
      bgClass: 'bg-blue-950/20',
      borderClass: 'border-l-2 border-l-blue-500/60 border-r-2 border-r-blue-500/60',
    };
  
}

  if (expanded) {

    return {
      month,
      monthType,
      expanded: true,
      subCellCount: 2,
      flexClass: 'flex-[1.5]',
      minWidthClass: 'min-w-[240px]',
      bgClass: 'bg-zinc-900/50',
      borderClass: 'border-l border-zinc-700',
    };
  
}

  return {
    month,
    monthType,
    expanded: false,
    subCellCount: 1,
    flexClass: 'flex-1',
    minWidthClass: 'min-w-[120px]',
    bgClass: monthType === 'past' ? 'bg-zinc-900/50' : '',
    borderClass: 'border-l border-zinc-700',
  };

}

export function computeActualColor(actual: number, budget: number, isExpense: boolean): string {

  const actualMagnitude = Math.abs(actual);
  const budgetMagnitude = Math.abs(budget);

  if (isExpense) {

    return actualMagnitude > budgetMagnitude ? 'text-red-400' : 'text-green-400';
  
}

  return actualMagnitude >= budgetMagnitude ? 'text-green-400' : 'text-red-400';

}

export function computeHybridColor(actual: number, budget: number, hybrid: number, isExpense: boolean): string {

  const actualMagnitude = Math.abs(actual);
  const budgetMagnitude = Math.abs(budget);
  const hybridMagnitude = Math.abs(hybrid);

  if (isExpense) {

    return actualMagnitude > budgetMagnitude || hybridMagnitude > budgetMagnitude ? 'text-red-400' : 'text-green-400';
  
}

  return actualMagnitude >= budgetMagnitude ? 'text-green-400' : 'text-amber-400';

}

export function getOverUnderColor(value: number, budget: number, invert: boolean): string {

  if (isEffectivelyZero(value) && isEffectivelyZero(budget)) {

    return 'text-green-400';
  
}

  if (invert) {

    return Math.abs(value) > Math.abs(budget) ? 'text-red-400' : 'text-green-400';
  
}

  return value >= budget ? 'text-green-400' : 'text-red-400';

}

export function getBalanceValueColor(value: number): string | undefined {

  if (isEffectivelyZero(value)) {

    return 'text-green-400';
  
}

  if (value < 0) {

    return 'text-red-400';
  
}

  return 'text-green-400';

}
