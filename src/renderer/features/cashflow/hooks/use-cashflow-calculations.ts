import { useMemo } from 'react';
import { buildCashflowCalculations, getEmptyCashflowBreakdown } from '../lib/cashflow-calculations';
import type { CashflowCalculations } from '../lib/cashflow-calculations';
import type { CarryForwardMode } from '../components/cashflow-types';
import type { CashflowAccountData, CategoryLinkWithNames } from '../../../../shared/types';

export type { CashflowCalculations } from '../lib/cashflow-calculations';

export function useCashflowCalculations(
  data: CashflowAccountData | null,
  year: number,
  accountId: string,
  categoryLinks: CategoryLinkWithNames[],
  carryForwardMode: CarryForwardMode = 'hybrid',
): CashflowCalculations | null {
  return useMemo(
    () => (data ? buildCashflowCalculations(data, year, accountId, categoryLinks, carryForwardMode) : null),
    [data, year, accountId, categoryLinks, carryForwardMode],
  );
}
