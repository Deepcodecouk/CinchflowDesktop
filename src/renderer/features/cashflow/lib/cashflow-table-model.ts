import { UNCATEGORISED_CATEGORY_ID } from '../../../../shared/constants';
import type { CategoryHierarchy } from '../../../../shared/types';
import type { CashflowBreakdown } from '../components/cashflow-types';
import type { CashflowCalculations } from './cashflow-calculations';

export type CashflowSectionKey = 'income-start' | 'fixed-expenses' | 'variable-expenses' | 'income-end';

export interface CashflowBannerRowModel {
  kind: 'banner';
  key: string;
  label: string;
  variant: 'section' | 'summary';
  sectionKey?: CashflowSectionKey;
  isCollapsed?: boolean;
}

export interface CashflowSpacerRowModel {
  kind: 'spacer';
  key: string;
}

export interface CashflowHeaderRowModel {
  kind: 'header';
  key: string;
  hierarchy: CategoryHierarchy;
  isCollapsed: boolean;
}

export interface CashflowCategoryTableRowModel {
  kind: 'category';
  key: string;
  categoryId: string;
  categoryName: string;
  allowRename: boolean;
  linkedCategoryTooltip: string | null;
}

export interface CashflowSectionTotalRowModel {
  kind: 'section-total';
  key: string;
  label: string;
  invertActuals: boolean;
  getTotalValue: (month: number) => number;
  getTotalBreakdown?: (month: number) => CashflowBreakdown;
}

export interface CashflowDerivedRowModel {
  kind: 'derived';
  key: string;
  label: string;
  bold: boolean;
  invertActuals: boolean;
  zeroIsGreen?: boolean;
  getValue: (month: number) => number;
  getCurrentMonthBreakdown?: (month: number) => CashflowBreakdown;
}

export type CashflowTableRowModel =
  | CashflowBannerRowModel
  | CashflowSpacerRowModel
  | CashflowHeaderRowModel
  | CashflowCategoryTableRowModel
  | CashflowSectionTotalRowModel
  | CashflowDerivedRowModel;

export function getEditableCashflowCategoryIds(
  hierarchies: CategoryHierarchy[],
  collapsed: Record<string, boolean>,
  collapsedSections: Partial<Record<CashflowSectionKey, boolean>> = {},
): string[] {

  const ids: string[] = [];
  const incomeStartHeaders = hierarchies.filter((hierarchy) => hierarchy.header.type === 'income_start');
  const fixedExpenseHeaders = hierarchies.filter((hierarchy) => hierarchy.header.type === 'fixed_expense');
  const variableExpenseHeaders = hierarchies.filter((hierarchy) => hierarchy.header.type === 'variable_expense');
  const incomeEndHeaders = hierarchies.filter((hierarchy) => hierarchy.header.type === 'income_end');

  if (!collapsedSections['income-start']) {
    for (const hierarchy of incomeStartHeaders) {
      if (!collapsed[hierarchy.header.id]) {
        ids.push(...hierarchy.categories.map((category) => category.id));
      }
    }
  }

  if (!collapsedSections['fixed-expenses']) {
    for (const hierarchy of fixedExpenseHeaders) {
      if (!collapsed[hierarchy.header.id]) {
        ids.push(...hierarchy.categories.map((category) => category.id));
      }
    }
  }

  if (variableExpenseHeaders.length > 0 && !collapsedSections['variable-expenses']) {

    for (const hierarchy of variableExpenseHeaders) {

      if (!collapsed[hierarchy.header.id]) {

        ids.push(...hierarchy.categories.map((category) => category.id));
      
}
    
}

    ids.push(UNCATEGORISED_CATEGORY_ID);
  
}

  if (!collapsedSections['income-end']) {
    for (const hierarchy of incomeEndHeaders) {

      if (!collapsed[hierarchy.header.id]) {

        ids.push(...hierarchy.categories.map((category) => category.id));
      
}
    
}
  }

  return ids;

}

export function buildCashflowTableRows(
  calc: CashflowCalculations,
  collapsed: Record<string, boolean>,
  collapsedSections: Partial<Record<CashflowSectionKey, boolean>> = {},
): CashflowTableRowModel[] {

  const rows: CashflowTableRowModel[] = [
    {
      kind: 'derived',
      key: 'opening-balance',
      label: 'Opening Balance',
      bold: true,
      invertActuals: false,
      zeroIsGreen: true,
      getValue: calc.openingBalForMonth,
    },
  ];

  const sections: Array<{
    key: CashflowSectionKey;
    headers: typeof calc.incomeStartHeaders;
    label: string;
    totalLabel: string;
    getTotalValue: (month: number) => number;
    getTotalBreakdown: (month: number) => CashflowBreakdown;
    invertActuals: boolean;
    availableFunds: (month: number) => number;
    availableFundsBreakdown: (month: number) => CashflowBreakdown;
    showUncategorised: boolean;
  }> = [
    {
      key: 'income-start',
      headers: calc.incomeStartHeaders,
      label: 'Income (Start)',
      totalLabel: 'Total Income (Start)',
      getTotalValue: calc.incomeStartTotal,
      getTotalBreakdown: calc.incomeStartBreakdown,
      invertActuals: false,
      availableFunds: calc.availableFunds,
      availableFundsBreakdown: calc.availableFundsBreakdown,
      showUncategorised: false,
    },
    {
      key: 'fixed-expenses',
      headers: calc.fixedExpHeaders,
      label: 'Fixed Expenses',
      totalLabel: 'Total Fixed Expenses',
      getTotalValue: calc.fixedExpTotal,
      getTotalBreakdown: calc.fixedExpenseBreakdown,
      invertActuals: true,
      availableFunds: calc.availableFundsAfterFixed,
      availableFundsBreakdown: calc.availableFundsAfterFixedBreakdown,
      showUncategorised: false,
    },
    {
      key: 'variable-expenses',
      headers: calc.varExpHeaders,
      label: 'Variable Expenses',
      totalLabel: 'Total Variable Expenses',
      getTotalValue: calc.varExpTotal,
      getTotalBreakdown: calc.variableExpenseBreakdown,
      invertActuals: true,
      availableFunds: calc.availableFundsAfterAllExpenses,
      availableFundsBreakdown: calc.availableFundsAfterAllExpensesBreakdown,
      showUncategorised: true,
    },
    {
      key: 'income-end',
      headers: calc.incomeEndHeaders,
      label: 'Income (End)',
      totalLabel: 'Total Income (End)',
      getTotalValue: calc.incomeEndTotal,
      getTotalBreakdown: calc.incomeEndBreakdown,
      invertActuals: false,
      availableFunds: calc.closingBalForMonth,
      availableFundsBreakdown: calc.closingBalanceBreakdown,
      showUncategorised: false,
    },
  ];

  for (const section of sections) {

    if (section.headers.length === 0 && !section.showUncategorised) {

      continue;
    
}

    rows.push({
      kind: 'banner',
      key: `${section.key}-banner`,
      label: section.label,
      variant: 'section',
      sectionKey: section.key,
      isCollapsed: !!collapsedSections[section.key],
    });

    if (!collapsedSections[section.key]) {
      for (const hierarchy of section.headers) {

        const isCollapsed = !!collapsed[hierarchy.header.id];

        rows.push({
          kind: 'header',
          key: hierarchy.header.id,
          hierarchy,
          isCollapsed,
        });

        if (!isCollapsed) {

          for (const category of hierarchy.categories) {

            const linkedCategory = calc.getLinkForCategory(category.id);

            rows.push({
              kind: 'category',
              key: category.id,
              categoryId: category.id,
              categoryName: category.name,
              allowRename: true,
              linkedCategoryTooltip: linkedCategory ? calc.getLinkTooltip(linkedCategory, category.id) : null,
            });
          
}
        
}
      
}

      if (section.showUncategorised) {

        rows.push({
          kind: 'category',
          key: UNCATEGORISED_CATEGORY_ID,
          categoryId: UNCATEGORISED_CATEGORY_ID,
          categoryName: 'Uncategorised',
          allowRename: false,
          linkedCategoryTooltip: null,
        });
      
}
    }

    rows.push({
      kind: 'section-total',
      key: `${section.key}-total`,
      label: section.totalLabel,
      invertActuals: section.invertActuals,
      getTotalValue: section.getTotalValue,
      getTotalBreakdown: section.getTotalBreakdown,
    });

    rows.push({
      kind: 'derived',
      key: `${section.key}-available-funds`,
      label: 'Available Funds',
      bold: true,
      invertActuals: false,
      zeroIsGreen: true,
      getValue: section.availableFunds,
      getCurrentMonthBreakdown: section.availableFundsBreakdown,
    });
  
}

  rows.push({ kind: 'banner', key: 'summary-banner', label: 'Summary', variant: 'summary' });
  rows.push({
    kind: 'derived',
    key: 'summary-opening-balance',
    label: 'Opening Balance',
    bold: false,
    invertActuals: false,
    zeroIsGreen: true,
    getValue: calc.openingBalForMonth,
  });
  rows.push({
    kind: 'derived',
    key: 'summary-income-start',
    label: 'Total Income (Start)',
    bold: false,
    invertActuals: false,
    getValue: calc.incomeStartTotal,
    getCurrentMonthBreakdown: calc.incomeStartBreakdown,
  });
  rows.push({
    kind: 'derived',
    key: 'summary-fixed-expenses',
    label: 'Total Fixed Expenses',
    bold: false,
    invertActuals: true,
    getValue: calc.fixedExpTotal,
    getCurrentMonthBreakdown: calc.fixedExpenseBreakdown,
  });
  rows.push({
    kind: 'derived',
    key: 'summary-variable-expenses',
    label: 'Total Variable Expenses',
    bold: false,
    invertActuals: true,
    getValue: calc.varExpTotal,
    getCurrentMonthBreakdown: calc.variableExpenseBreakdown,
  });
  rows.push({
    kind: 'derived',
    key: 'summary-income-end',
    label: 'Total Income (End)',
    bold: false,
    invertActuals: false,
    getValue: calc.incomeEndTotal,
    getCurrentMonthBreakdown: calc.incomeEndBreakdown,
  });
  rows.push({
    kind: 'derived',
    key: 'summary-closing-balance',
    label: 'Closing Balance',
    bold: true,
    invertActuals: false,
    zeroIsGreen: true,
    getValue: calc.closingBalForMonth,
    getCurrentMonthBreakdown: calc.closingBalanceBreakdown,
  });

  return rows;

}
