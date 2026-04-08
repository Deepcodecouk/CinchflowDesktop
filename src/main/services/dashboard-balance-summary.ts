import { UNCATEGORISED_CATEGORY_ID } from '../../shared/constants';
import type {
  CashflowTableData,
  CategoryHeaderType,
  DashboardAccountBalanceSummary,
  DashboardMonthType,
} from '../../shared/types';

export function getDashboardMonthType(year: number, month: number): DashboardMonthType {

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) return 'past';
  if (year === currentYear && month === currentMonth) return 'current';

  return 'future';

}

export function buildDashboardBalanceSummary(
  data: CashflowTableData,
  year: number,
  selectedMonth: number,
): DashboardAccountBalanceSummary {

  const monthType = getDashboardMonthType(year, selectedMonth);

  function getBudget(categoryId: string, month: number): number {

    return data.budgetLookup[categoryId]?.[month] ?? 0;
  
}

  function getActual(categoryId: string, month: number): number {

    return data.actualsLookup[categoryId]?.[month] ?? 0;
  
}

  function getHybrid(categoryId: string, month: number): number {

    const budgetAmount = getBudget(categoryId, month);
    const actualAmount = getActual(categoryId, month);

    return Math.abs(actualAmount) > Math.abs(budgetAmount) ? actualAmount : budgetAmount;
  
}

  function getCellValue(categoryId: string, month: number): number {

    const currentMonthType = getDashboardMonthType(year, month);

    if (currentMonthType === 'past') return getActual(categoryId, month);
    if (currentMonthType === 'future') return getBudget(categoryId, month);

    return getHybrid(categoryId, month);
  
}

  function sumSectionBy(type: CategoryHeaderType, month: number, getAmount: (categoryId: string, targetMonth: number) => number): number {

    return data.hierarchies
      .filter((hierarchy) => hierarchy.header.type === type)
      .reduce(
        (sum, hierarchy) => sum + hierarchy.categories.reduce((sectionSum, category) => sectionSum + getAmount(category.id, month), 0),
        0,
      );
  
}

  function sumSection(type: CategoryHeaderType, month: number): number {

    return sumSectionBy(type, month, (categoryId, targetMonth) => getCellValue(categoryId, targetMonth));
  
}

  function sectionBreakdown(type: CategoryHeaderType, month: number, extraCategoryIds?: string[]) {

    let budget = sumSectionBy(type, month, getBudget);
    let actual = sumSectionBy(type, month, getActual);
    let hybrid = sumSectionBy(type, month, (categoryId, targetMonth) => Math.abs(getHybrid(categoryId, targetMonth)));

    if (extraCategoryIds) {

      for (const categoryId of extraCategoryIds) {

        budget += getBudget(categoryId, month);
        actual += getActual(categoryId, month);
        hybrid += Math.abs(getHybrid(categoryId, month));
      
}
    
}

    return { budget, actual, hybrid };
  
}

  const openingBalanceMemo = new Map<number, number>();
  const closingBalanceMemo = new Map<number, number>();

  function openingBalForMonth(month: number): number {

    if (openingBalanceMemo.has(month)) {

      return openingBalanceMemo.get(month) as number;
    
}

    let value: number;

    if (month === 1) {

      value = data.projectedOpeningBalances?.hybrid ?? data.openingBalance;
    
} else {

      value = closingBalForMonth(month - 1);
    
}

    openingBalanceMemo.set(month, value);
    return value;
  
}

  function incomeStartTotal(month: number): number {

    return sumSection('income_start', month);
  
}

  function fixedExpTotal(month: number): number {

    if (getDashboardMonthType(year, month) === 'current') {

      return sumSectionBy('fixed_expense', month, (categoryId, targetMonth) => Math.abs(getHybrid(categoryId, targetMonth)));
    
}

    return sumSection('fixed_expense', month);
  
}

  function varExpTotal(month: number): number {

    if (getDashboardMonthType(year, month) === 'current') {

      return sumSectionBy('variable_expense', month, (categoryId, targetMonth) => Math.abs(getHybrid(categoryId, targetMonth)))
        + Math.abs(getHybrid(UNCATEGORISED_CATEGORY_ID, month));
    
}

    return sumSection('variable_expense', month) + getCellValue(UNCATEGORISED_CATEGORY_ID, month);
  
}

  function totalExpenses(month: number): number {

    return fixedExpTotal(month) + varExpTotal(month);
  
}

  function incomeEndTotal(month: number): number {

    return sumSection('income_end', month);
  
}

  function closingBalForMonth(month: number): number {

    if (closingBalanceMemo.has(month)) {

      return closingBalanceMemo.get(month) as number;
    
}

    const value = openingBalForMonth(month) + incomeStartTotal(month) - Math.abs(totalExpenses(month)) + incomeEndTotal(month);

    closingBalanceMemo.set(month, value);
    return value;
  
}

  function availableFundsBreakdown(month: number) {

    const openingBalance = openingBalForMonth(month);
    const incomeBreakdown = sectionBreakdown('income_start', month);

    return {
      budget: openingBalance + incomeBreakdown.budget,
      actual: openingBalance + incomeBreakdown.actual,
      hybrid: openingBalance + incomeBreakdown.hybrid,
    };
  
}

  function availableFundsAfterFixedBreakdown(month: number) {

    const availableBreakdown = availableFundsBreakdown(month);
    const fixedBreakdown = sectionBreakdown('fixed_expense', month);

    return {
      budget: availableBreakdown.budget - Math.abs(fixedBreakdown.budget),
      actual: availableBreakdown.actual - Math.abs(fixedBreakdown.actual),
      hybrid: availableBreakdown.hybrid - Math.abs(fixedBreakdown.hybrid),
    };
  
}

  function availableFundsAfterAllExpensesBreakdown(month: number) {

    const availableAfterFixedBreakdown = availableFundsAfterFixedBreakdown(month);
    const variableBreakdown = sectionBreakdown('variable_expense', month, [UNCATEGORISED_CATEGORY_ID]);

    return {
      budget: availableAfterFixedBreakdown.budget - Math.abs(variableBreakdown.budget),
      actual: availableAfterFixedBreakdown.actual - Math.abs(variableBreakdown.actual),
      hybrid: availableAfterFixedBreakdown.hybrid - Math.abs(variableBreakdown.hybrid),
    };
  
}

  function closingBalanceBreakdown(month: number) {

    const availableAfterExpensesBreakdown = availableFundsAfterAllExpensesBreakdown(month);
    const incomeEndBreakdown = sectionBreakdown('income_end', month);

    return {
      budget: availableAfterExpensesBreakdown.budget + incomeEndBreakdown.budget,
      actual: availableAfterExpensesBreakdown.actual + incomeEndBreakdown.actual,
      hybrid: availableAfterExpensesBreakdown.hybrid + incomeEndBreakdown.hybrid,
    };
  
}

  const closingBreakdown = closingBalanceBreakdown(selectedMonth);

  return {
    monthType,
    openingBalance: openingBalForMonth(selectedMonth),
    closingBudget: closingBreakdown.budget,
    closingActual: monthType === 'future' ? closingBalForMonth(selectedMonth) : closingBreakdown.actual,
    closingHybrid: closingBalForMonth(selectedMonth),
  };

}
