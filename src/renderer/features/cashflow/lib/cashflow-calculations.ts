import { UNCATEGORISED_CATEGORY_ID } from '../../../../shared/constants';
import { getMonthType } from '../components/cashflow-types';
import type {
  CashflowBreakdown,
  CarryForwardMode,
  MonthType,
} from '../components/cashflow-types';
import type {
  CashflowCoreData,
  CategoryHierarchy,
  CategoryLinkWithNames,
  CategoryHeaderType,
} from '../../../../shared/types';

const EMPTY_BREAKDOWN: CashflowBreakdown = {
  budget: 0,
  actual: 0,
  hybrid: 0,
};

export interface CashflowCalculations {
  getBudget(categoryId: string, month: number): number;
  getActual(categoryId: string, month: number): number;
  getHybrid(categoryId: string, month: number): number;
  getCellValue(categoryId: string, month: number, monthType: MonthType): number;
  sumHeader(hierarchy: CategoryHierarchy, month: number, monthType: MonthType): number;
  sectionBreakdown(type: CategoryHeaderType, month: number, extraCategoryIds?: string[]): CashflowBreakdown;
  openingBalForMonth(month: number): number;
  incomeStartTotal(month: number): number;
  availableFunds(month: number): number;
  availableFundsBreakdown(month: number): CashflowBreakdown;
  fixedExpTotal(month: number): number;
  availableFundsAfterFixed(month: number): number;
  availableFundsAfterFixedBreakdown(month: number): CashflowBreakdown;
  varExpTotal(month: number): number;
  totalExpenses(month: number): number;
  availableFundsAfterAllExpenses(month: number): number;
  availableFundsAfterAllExpensesBreakdown(month: number): CashflowBreakdown;
  incomeEndTotal(month: number): number;
  closingBalForMonth(month: number): number;
  categoryNameMap: Map<string, string>;
  isExpenseCategory(categoryId: string): boolean;
  displayActual(value: number, categoryId: string): number;
  getLinkForCategory(categoryId: string): CategoryLinkWithNames | null;
  getLinkTooltip(link: CategoryLinkWithNames, categoryId: string): string;
  incomeStartHeaders: CategoryHierarchy[];
  fixedExpHeaders: CategoryHierarchy[];
  varExpHeaders: CategoryHierarchy[];
  incomeEndHeaders: CategoryHierarchy[];
  incomeStartBreakdown(month: number): CashflowBreakdown;
  fixedExpenseBreakdown(month: number): CashflowBreakdown;
  variableExpenseBreakdown(month: number): CashflowBreakdown;
  incomeEndBreakdown(month: number): CashflowBreakdown;
  closingBalanceBreakdown(month: number): CashflowBreakdown;
}

export function buildCashflowCalculations(
  data: CashflowCoreData,
  year: number,
  accountId: string,
  categoryLinks: CategoryLinkWithNames[],
  carryForwardMode: CarryForwardMode = 'hybrid',
): CashflowCalculations {
  const incomeStartHeaders = data.hierarchies.filter((hierarchy) => hierarchy.header.type === 'income_start');
  const fixedExpHeaders = data.hierarchies.filter((hierarchy) => hierarchy.header.type === 'fixed_expense');
  const varExpHeaders = data.hierarchies.filter((hierarchy) => hierarchy.header.type === 'variable_expense');
  const incomeEndHeaders = data.hierarchies.filter((hierarchy) => hierarchy.header.type === 'income_end');

  const expenseCategoryIds = new Set<string>();

  for (const hierarchy of [...fixedExpHeaders, ...varExpHeaders]) {
    for (const category of hierarchy.categories) {
      expenseCategoryIds.add(category.id);
    }
  }

  expenseCategoryIds.add(UNCATEGORISED_CATEGORY_ID);

  const categoryNameMap = new Map<string, string>();

  for (const hierarchy of data.hierarchies) {
    for (const category of hierarchy.categories) {
      categoryNameMap.set(category.id, category.name);
    }
  }

  categoryNameMap.set(UNCATEGORISED_CATEGORY_ID, 'Uncategorised');

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

  function getCarryForwardValue(categoryId: string, month: number): number {
    if (carryForwardMode === 'budget') return getBudget(categoryId, month);
    if (carryForwardMode === 'actual') return getActual(categoryId, month);

    return getHybrid(categoryId, month);
  }

  function getCellValue(categoryId: string, month: number, monthType: MonthType): number {
    if (monthType === 'past') return getActual(categoryId, month);
    if (monthType === 'future') return getBudget(categoryId, month);

    return getCarryForwardValue(categoryId, month);
  }

  function sumHeader(hierarchy: CategoryHierarchy, month: number, monthType: MonthType): number {
    return hierarchy.categories.reduce((sum, category) => sum + getCellValue(category.id, month, monthType), 0);
  }

  function sumSection(type: CategoryHeaderType, month: number, monthType: MonthType): number {
    return data.hierarchies
      .filter((hierarchy) => hierarchy.header.type === type)
      .reduce((sum, hierarchy) => sum + sumHeader(hierarchy, month, monthType), 0);
  }

  function sumSectionBy(type: CategoryHeaderType, month: number, getAmount: (categoryId: string, month: number) => number): number {
    return data.hierarchies
      .filter((hierarchy) => hierarchy.header.type === type)
      .reduce(
        (sum, hierarchy) => sum + hierarchy.categories.reduce((sectionSum, category) => sectionSum + getAmount(category.id, month), 0),
        0,
      );
  }

  function sectionBreakdown(type: CategoryHeaderType, month: number, extraCategoryIds?: string[]): CashflowBreakdown {
    let budget = sumSectionBy(type, month, getBudget);
    let actual = sumSectionBy(type, month, getActual);
    let hybrid = sumSectionBy(type, month, (categoryId, monthValue) => Math.abs(getHybrid(categoryId, monthValue)));

    if (extraCategoryIds) {
      for (const categoryId of extraCategoryIds) {
        budget += getBudget(categoryId, month);
        actual += getActual(categoryId, month);
        hybrid += Math.abs(getHybrid(categoryId, month));
      }
    }

    return { budget, actual, hybrid };
  }

  function openingBalForMonth(month: number): number {
    if (month === 1) {
      if (data.projectedOpeningBalances) {
        return data.projectedOpeningBalances[carryForwardMode];
      }

      return data.openingBalance;
    }

    return closingBalForMonth(month - 1);
  }

  function incomeStartTotal(month: number): number {
    return sumSection('income_start', month, getMonthType(year, month));
  }

  function incomeStartBreakdown(month: number): CashflowBreakdown {
    return sectionBreakdown('income_start', month);
  }

  function availableFunds(month: number): number {
    return openingBalForMonth(month) + incomeStartTotal(month);
  }

  function availableFundsBreakdown(month: number): CashflowBreakdown {
    const openingBalance = openingBalForMonth(month);
    const incomeBreakdown = incomeStartBreakdown(month);

    return {
      budget: openingBalance + incomeBreakdown.budget,
      actual: openingBalance + incomeBreakdown.actual,
      hybrid: openingBalance + incomeBreakdown.hybrid,
    };
  }

  function fixedExpTotal(month: number): number {
    const monthType = getMonthType(year, month);

    if (monthType === 'current') {
      return sumSectionBy('fixed_expense', month, (categoryId, monthValue) => Math.abs(getCarryForwardValue(categoryId, monthValue)));
    }

    return sumSection('fixed_expense', month, monthType);
  }

  function fixedExpenseBreakdown(month: number): CashflowBreakdown {
    return sectionBreakdown('fixed_expense', month);
  }

  function availableFundsAfterFixed(month: number): number {
    return availableFunds(month) - Math.abs(fixedExpTotal(month));
  }

  function availableFundsAfterFixedBreakdown(month: number): CashflowBreakdown {
    const availableBreakdown = availableFundsBreakdown(month);
    const fixedBreakdown = fixedExpenseBreakdown(month);

    return {
      budget: availableBreakdown.budget - Math.abs(fixedBreakdown.budget),
      actual: availableBreakdown.actual - Math.abs(fixedBreakdown.actual),
      hybrid: availableBreakdown.hybrid - Math.abs(fixedBreakdown.hybrid),
    };
  }

  function varExpTotal(month: number): number {
    const monthType = getMonthType(year, month);

    if (monthType === 'current') {
      return sumSectionBy('variable_expense', month, (categoryId, monthValue) => Math.abs(getCarryForwardValue(categoryId, monthValue)))
        + Math.abs(getCarryForwardValue(UNCATEGORISED_CATEGORY_ID, month));
    }

    return sumSection('variable_expense', month, monthType) + getCellValue(UNCATEGORISED_CATEGORY_ID, month, monthType);
  }

  function variableExpenseBreakdown(month: number): CashflowBreakdown {
    return sectionBreakdown('variable_expense', month, [UNCATEGORISED_CATEGORY_ID]);
  }

  function totalExpenses(month: number): number {
    return fixedExpTotal(month) + varExpTotal(month);
  }

  function availableFundsAfterAllExpenses(month: number): number {
    return availableFunds(month) - Math.abs(totalExpenses(month));
  }

  function availableFundsAfterAllExpensesBreakdown(month: number): CashflowBreakdown {
    const availableAfterFixedBreakdown = availableFundsAfterFixedBreakdown(month);
    const variableBreakdown = variableExpenseBreakdown(month);

    return {
      budget: availableAfterFixedBreakdown.budget - Math.abs(variableBreakdown.budget),
      actual: availableAfterFixedBreakdown.actual - Math.abs(variableBreakdown.actual),
      hybrid: availableAfterFixedBreakdown.hybrid - Math.abs(variableBreakdown.hybrid),
    };
  }

  function incomeEndTotal(month: number): number {
    return sumSection('income_end', month, getMonthType(year, month));
  }

  function incomeEndBreakdown(month: number): CashflowBreakdown {
    return sectionBreakdown('income_end', month);
  }

  function closingBalForMonth(month: number): number {
    return availableFunds(month) - Math.abs(totalExpenses(month)) + incomeEndTotal(month);
  }

  function closingBalanceBreakdown(month: number): CashflowBreakdown {
    const availableAfterExpensesBreakdown = availableFundsAfterAllExpensesBreakdown(month);
    const incomeEnd = incomeEndBreakdown(month);

    return {
      budget: availableAfterExpensesBreakdown.budget + incomeEnd.budget,
      actual: availableAfterExpensesBreakdown.actual + incomeEnd.actual,
      hybrid: availableAfterExpensesBreakdown.hybrid + incomeEnd.hybrid,
    };
  }

  function isExpenseCategory(categoryId: string): boolean {
    return expenseCategoryIds.has(categoryId);
  }

  function displayActual(value: number, categoryId: string): number {
    return isExpenseCategory(categoryId) ? -value : value;
  }

  function getLinkForCategory(categoryId: string): CategoryLinkWithNames | null {
    return categoryLinks.find(
      (link) =>
        (link.source_account_id === accountId && link.source_category_id === categoryId)
        || (link.target_account_id === accountId && link.target_category_id === categoryId),
    ) ?? null;
  }

  function getLinkTooltip(link: CategoryLinkWithNames, categoryId: string): string {
    if (link.source_category_id === categoryId) {
      return `Linked to ${link.target_account_name} / ${link.target_category_name}`;
    }

    return `Linked to ${link.source_account_name} / ${link.source_category_name}`;
  }

  return {
    getBudget,
    getActual,
    getHybrid,
    getCellValue,
    sumHeader,
    sectionBreakdown,
    openingBalForMonth,
    incomeStartTotal,
    availableFunds,
    availableFundsBreakdown,
    fixedExpTotal,
    availableFundsAfterFixed,
    availableFundsAfterFixedBreakdown,
    varExpTotal,
    totalExpenses,
    availableFundsAfterAllExpenses,
    availableFundsAfterAllExpensesBreakdown,
    incomeEndTotal,
    closingBalForMonth,
    categoryNameMap,
    isExpenseCategory,
    displayActual,
    getLinkForCategory,
    getLinkTooltip,
    incomeStartHeaders,
    fixedExpHeaders,
    varExpHeaders,
    incomeEndHeaders,
    incomeStartBreakdown,
    fixedExpenseBreakdown,
    variableExpenseBreakdown,
    incomeEndBreakdown,
    closingBalanceBreakdown,
  };
}

export function getEmptyCashflowBreakdown(): CashflowBreakdown {
  return EMPTY_BREAKDOWN;
}
