import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, MessageSquare } from 'lucide-react';
import { useSettingsStore } from '../stores/settings-store';
import { Button } from '../components/ui/button';
import { DrilldownDialog } from '../features/cashflow/components/DrilldownDialog';
import { DashboardAccountBalanceCard } from '../features/dashboard/components/DashboardAccountBalanceCard';
import { callIpc, toErrorMessage } from '../lib/ipc-client';
import { cn, formatCurrency, isEffectivelyZero, normalizeCurrencyAmount } from '../lib/utils';
import type {
  AccountBalance,
  CashflowActualTransactionsFilter,
  DashboardAccountBalanceSummary,
  CategoryHeaderType,
  DashboardBudgetProgressAccount,
  DashboardBudgetProgressItem,
} from '../../shared/types';
import { isExpenseType, MONTH_NAMES_SHORT, UNCATEGORISED_CATEGORY_ID } from '../../shared/constants';

const DASHBOARD_COLLAPSED_ACCOUNTS_STORAGE_KEY = 'dashboard.collapsedAccounts';
const PROGRESS_EPSILON = 0.0001;

const CATEGORY_TYPE_ORDER: CategoryHeaderType[] = [
  'income_start',
  'fixed_expense',
  'variable_expense',
  'income_end',
];

const CATEGORY_TYPE_LABELS: Record<CategoryHeaderType, string> = {
  income_start: 'Income (Start of month)',
  fixed_expense: 'Fixed Expenses',
  variable_expense: 'Variable Expenses',
  income_end: 'Income (End of month)',
};

interface DashboardHeaderGroup {
  headerId: string;
  headerName: string;
  headerColour: string;
  type: CategoryHeaderType;
  budget: number;
  actual: number;
  items: DashboardBudgetProgressItem[];
}

interface DashboardSectionGroup {
  type: CategoryHeaderType;
  label: string;
  headers: DashboardHeaderGroup[];
}

function toMagnitude(value: number): number {

  return Math.abs(normalizeCurrencyAmount(value));

}

function getDifferenceValue(budget: number, actual: number): number {

  return toMagnitude(budget) - toMagnitude(actual);

}

function getDifferenceColorClass(type: CategoryHeaderType, budget: number, actual: number): string {

  const budgetMagnitude = toMagnitude(budget);
  const actualMagnitude = toMagnitude(actual);

  return isExpenseType(type)
    ? actualMagnitude > budgetMagnitude ? 'text-red-400' : 'text-green-400'
    : actualMagnitude >= budgetMagnitude ? 'text-green-400' : 'text-red-400';

}

function getActualColorClass(type: CategoryHeaderType, budget: number, actual: number): string {

  if (isEffectivelyZero(actual) && isEffectivelyZero(budget)) {

    return 'text-zinc-400';
  
}

  return getDifferenceColorClass(type, budget, actual);

}

function getBalanceTextClass(value: number): string {

  const normalizedValue = normalizeCurrencyAmount(value);

  if (normalizedValue < 0) {

    return 'text-red-400';
  
}

  return 'text-green-400';

}

function getForecastedBalanceTextClass(budget: number, actual: number): string {

  const normalizedBudget = normalizeCurrencyAmount(budget);
  const normalizedForecast = normalizeCurrencyAmount(actual);

  return normalizedForecast < normalizedBudget ? 'text-red-400' : 'text-green-400';

}

function buildCommentSummary(items: DashboardBudgetProgressItem[]): string | null {

  const comments = items.flatMap((item) => item.comment ? [`${item.category_name}: ${item.comment}`] : []);

  return comments.length > 0 ? comments.join('\n') : null;

}

function getProgressBarClass(ratio: number): string {

  if (ratio > 1 + PROGRESS_EPSILON) return 'bg-red-400';
  if (ratio > 0.9 && ratio < 1 - PROGRESS_EPSILON) return 'bg-amber-400';
  return 'bg-green-400';

}

function getProgressBarClassForType(type: CategoryHeaderType, ratio: number): string {

  if (isExpenseType(type)) {

    return getProgressBarClass(ratio);
  
}

  if (ratio >= 1 - PROGRESS_EPSILON) return 'bg-green-400';
  if (ratio >= 0.9) return 'bg-amber-400';
  return 'bg-red-400';

}

function buildSectionGroups(items: DashboardBudgetProgressItem[]): DashboardSectionGroup[] {

  const visibleItems = items.filter((item) => item.budget !== 0 || item.actual !== 0 || !!item.comment);
  const sectionMap = new Map<CategoryHeaderType, Map<string, DashboardHeaderGroup>>();

  for (const item of visibleItems) {

    const existingSection = sectionMap.get(item.category_type) ?? new Map<string, DashboardHeaderGroup>();
    const existingHeader = existingSection.get(item.category_header_id);

    if (existingHeader) {

      existingHeader.budget += item.budget;
      existingHeader.actual += item.actual;
      existingHeader.items.push(item);
    
} else {

      existingSection.set(item.category_header_id, {
        headerId: item.category_header_id,
        headerName: item.category_header_name,
        headerColour: item.category_colour,
        type: item.category_type,
        budget: item.budget,
        actual: item.actual,
        items: [item],
      });
    
}

    sectionMap.set(item.category_type, existingSection);
  
}

  return CATEGORY_TYPE_ORDER
    .map((type) => {

      const headers = [...(sectionMap.get(type)?.values() ?? [])]
        .sort((left, right) => {

          if (left.headerId === UNCATEGORISED_CATEGORY_ID) return 1;
          if (right.headerId === UNCATEGORISED_CATEGORY_ID) return -1;
          return left.headerName.localeCompare(right.headerName);
        
})
        .map((header) => ({
          ...header,
          items: [...header.items].sort((left, right) => {

            if (left.category_id === UNCATEGORISED_CATEGORY_ID) return 1;
            if (right.category_id === UNCATEGORISED_CATEGORY_ID) return -1;
            return left.category_name.localeCompare(right.category_name);
          
}),
        }));

      return {
        type,
        label: CATEGORY_TYPE_LABELS[type],
        headers,
      };
    
})
    .filter((section) => section.headers.length > 0);

}

function BudgetProgressBar({
  type,
  budget,
  actual,
}: {
  type: CategoryHeaderType;
  budget: number;
  actual: number;
}) {

  const budgetMagnitude = toMagnitude(budget);
  const actualMagnitude = toMagnitude(actual);
  const ratio = budgetMagnitude === 0
    ? actualMagnitude > 0 ? 1.01 : 0
    : actualMagnitude / budgetMagnitude;
  const width = Math.max(0, Math.min(100, ratio * 100));

  return (
    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all', getProgressBarClassForType(type, ratio))}
        style={{ width: `${width}%` }}
      />
    </div>
  );

}

function DashboardValueHeadings() {

  return (
    <div className="grid grid-cols-[minmax(220px,1.5fr)_minmax(240px,2fr)_120px_120px_140px] gap-4 px-4 py-2 border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
      <div>Item</div>
      <div>Progress</div>
      <div className="text-right">Budget</div>
      <div className="text-right">Actual</div>
      <div className="text-right">Amount remaining</div>
    </div>
  );

}

function DashboardBalancePanel({
  title,
  summary,
  currencySymbol,
}: {
  title: string;
  summary: DashboardAccountBalanceSummary;
  currencySymbol: string;
}) {

  function renderSubCard(label: string, value: number, colorClass?: string) {

    return (
      <div className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-3">
        <div className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">{label}</div>
        <div className={cn('mt-1 text-lg font-semibold', colorClass ?? getBalanceTextClass(value))}>
          {formatCurrency(value, currencySymbol)}
        </div>
      </div>
    );
  
}

  if (title === 'Opening Balance') {

    const openingLabel = summary.monthType === 'future'
      ? 'Opening balance based on current month\'s forecasted balance'
      : 'Actual opening balance';

    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{title}</div>
        </div>
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="text-sm text-zinc-300">{openingLabel}</div>
          <div className={cn('text-lg font-semibold', getBalanceTextClass(summary.openingBalance))}>
            {formatCurrency(summary.openingBalance, currencySymbol)}
          </div>
        </div>
      </div>
    );
  
}

  if (summary.monthType === 'current') {

    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{title}</div>
        </div>
        <div className="grid gap-3 px-4 py-4 md:grid-cols-3">
          {renderSubCard('Budgeted balance', summary.closingBudget)}
          {renderSubCard('Current actual', summary.closingActual)}
          {renderSubCard(
            'Forecasted balance',
            summary.closingHybrid,
            getForecastedBalanceTextClass(summary.closingBudget, summary.closingHybrid),
          )}
        </div>
      </div>
    );
  
}

  if (summary.monthType === 'past') {

    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{title}</div>
        </div>
        <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
          {renderSubCard('Budgeted closing balance', summary.closingBudget)}
          {renderSubCard('Actual closing balance', summary.closingActual)}
        </div>
      </div>
    );
  
}

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{title}</div>
      </div>
      <div className="grid gap-3 px-4 py-4">
        {renderSubCard('Budgeted closing balance', summary.closingBudget)}
      </div>
    </div>
  );

}

function DashboardDetailRow({
  accountId,
  item,
  year,
  month,
  currencySymbol,
  onOpenDrilldown,
}: {
  accountId: string;
  item: DashboardBudgetProgressItem;
  year: number;
  month: number;
  currencySymbol: string;
  onOpenDrilldown: (accountId: string, filter: CashflowActualTransactionsFilter) => void;
}) {

  const difference = getDifferenceValue(item.budget, item.actual);
  const hasActuals = !isEffectivelyZero(item.actual);

  function handleOpenDrilldown() {

    onOpenDrilldown(accountId, {
      kind: 'category',
      categoryId: item.category_id,
      categoryName: item.category_name,
    });
  
}

  return (
    <div className="grid grid-cols-[minmax(220px,1.5fr)_minmax(240px,2fr)_120px_120px_140px] gap-4 px-4 py-2 items-center border-b border-zinc-800/40 last:border-b-0 text-xs">
      <div className="min-w-0 pl-8">
        <span className="inline-flex items-center min-w-0">
          <span className="text-zinc-400 truncate">{item.category_name}</span>
        </span>
      </div>
      <BudgetProgressBar type={item.category_type} budget={item.budget} actual={item.actual} />
      <div className="text-right text-zinc-400">
        <span className="inline-flex items-center justify-end gap-2">
          <span>
            {item.budget !== 0 ? formatCurrency(toMagnitude(item.budget), currencySymbol) : '-'}
          </span>
          {item.comment && (
            <span className="text-blue-400" title={item.comment} aria-label="Budget comment">
              <MessageSquare className="w-3.5 h-3.5" />
            </span>
          )}
        </span>
      </div>
      <div className={cn('text-right', getActualColorClass(item.category_type, item.budget, item.actual))}>
        {hasActuals ? (
          <button
            type="button"
            onClick={handleOpenDrilldown}
            className="cursor-pointer hover:underline underline-offset-2"
            title={`View transactions for ${MONTH_NAMES_SHORT[month - 1]} ${year}`}
          >
            {formatCurrency(toMagnitude(item.actual), currencySymbol)}
          </button>
        ) : '-'}
      </div>
      <div className={cn('text-right font-medium', getDifferenceColorClass(item.category_type, item.budget, item.actual))}>
        {item.budget !== 0 || item.actual !== 0 ? formatCurrency(difference, currencySymbol) : '-'}
      </div>
    </div>
  );

}

function DashboardAccountProgressCard({
  account,
  expanded,
  onToggle,
  year,
  month,
  currencySymbol,
  onOpenDrilldown,
}: {
  account: DashboardBudgetProgressAccount;
  expanded: boolean;
  onToggle: () => void;
  year: number;
  month: number;
  currencySymbol: string;
  onOpenDrilldown: (accountId: string, filter: CashflowActualTransactionsFilter) => void;
}) {

  const sections = useMemo(() => buildSectionGroups(account.items), [account.items]);
  const [collapsedHeaders, setCollapsedHeaders] = useState<Set<string>>(
    () => new Set(
      sections.flatMap((section) => section.headers.map((header) => header.headerId))
        .filter((headerId) => headerId !== UNCATEGORISED_CATEGORY_ID),
    ),
  );

  useEffect(() => {

    setCollapsedHeaders(new Set(
      sections.flatMap((section) => section.headers.map((header) => header.headerId))
        .filter((headerId) => headerId !== UNCATEGORISED_CATEGORY_ID),
    ));
  
}, [sections]);

  function toggleHeader(headerId: string) {

    setCollapsedHeaders((previous) => {

      const next = new Set(previous);

      if (next.has(headerId)) next.delete(headerId);
      else next.add(headerId);
      return next;
    
    });
  
}

  function buildHeaderDrilldownFilter(header: DashboardHeaderGroup): CashflowActualTransactionsFilter {

    return {
      kind: 'header',
      headerId: header.headerId,
      headerName: header.headerName,
    };

  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50"
      >
        <span className="text-sm font-medium text-zinc-200">
          {account.account_icon} {account.account_name}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 text-zinc-500 transition-transform',
          !expanded && '-rotate-90',
        )} />
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 bg-zinc-950/20">
          {sections.length === 0 ? (
            <div className="px-4 py-6 text-sm text-zinc-500">No budget activity for this month.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              <div className="px-4 py-4">
                <DashboardBalancePanel
                  title="Opening Balance"
                  summary={account.balanceSummary}
                  currencySymbol={currencySymbol}
                />

                <div className="mt-4 space-y-4">
                  {sections.map((section) => (
                    <div key={section.type} className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                          {section.label}
                        </div>
                      </div>
                      <DashboardValueHeadings />
                      <div className="divide-y divide-zinc-800/60">
                        {section.headers.map((header) => {

                          if (header.headerId === UNCATEGORISED_CATEGORY_ID) {

                            return (
                              <div key={header.headerId} className="border-t border-zinc-800/60 bg-zinc-950/20">
                                {header.items.map((item) => (
                                  <DashboardDetailRow
                                    key={item.category_id}
                                    accountId={account.account_id}
                                    item={item}
                                    year={year}
                                    month={month}
                                    currencySymbol={currencySymbol}
                                    onOpenDrilldown={onOpenDrilldown}
                                  />
                                ))}
                              </div>
                            );
                          
}

                          const difference = getDifferenceValue(header.budget, header.actual);
                          const isHeaderCollapsed = collapsedHeaders.has(header.headerId);
                          const hasHeaderActuals = !isEffectivelyZero(header.actual);
                          const headerCommentSummary = isHeaderCollapsed ? buildCommentSummary(header.items) : null;

                          function handleToggleHeader() {

                            toggleHeader(header.headerId);

                          }

                          function handleHeaderActualDrilldown(event: React.MouseEvent<HTMLButtonElement>) {

                            event.stopPropagation();
                            onOpenDrilldown(account.account_id, buildHeaderDrilldownFilter(header));

                          }

                          return (
                            <div key={header.headerId}>
                              <div
                                className="grid grid-cols-[minmax(220px,1.5fr)_minmax(240px,2fr)_120px_120px_140px] gap-4 px-4 py-3 items-center hover:bg-zinc-900/70"
                              >
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={handleToggleHeader}
                                    className="flex w-full items-center gap-2 text-left"
                                  >
                                    <ChevronDown className={cn(
                                      'w-4 h-4 text-zinc-500 transition-transform shrink-0',
                                      isHeaderCollapsed && '-rotate-90',
                                    )} />
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: header.headerColour }} />
                                    <span className="text-sm font-medium text-zinc-200 truncate">{header.headerName}</span>
                                  </button>
                                </div>
                                <BudgetProgressBar type={header.type} budget={header.budget} actual={header.actual} />
                                <div className="text-right text-sm text-zinc-300">
                                  <span
                                    className={cn(
                                      'inline-flex items-center justify-end gap-2',
                                      headerCommentSummary && '-my-3 rounded-sm bg-yellow-500/30 px-2 py-3',
                                    )}
                                  >
                                    <span>
                                      {header.budget !== 0 ? formatCurrency(toMagnitude(header.budget), currencySymbol) : '-'}
                                    </span>
                                    {headerCommentSummary && (
                                      <span className="text-yellow-200" title={headerCommentSummary} aria-label="Budget comments">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className={cn('text-right text-sm', getActualColorClass(header.type, header.budget, header.actual))}>
                                  {hasHeaderActuals ? (
                                    <button
                                      type="button"
                                      onClick={handleHeaderActualDrilldown}
                                      className="cursor-pointer hover:underline underline-offset-2"
                                      title={`View transactions for ${header.headerName} in ${MONTH_NAMES_SHORT[month - 1]} ${year}`}
                                    >
                                      {formatCurrency(toMagnitude(header.actual), currencySymbol)}
                                    </button>
                                  ) : '-'}
                                </div>
                                <div className={cn('text-right text-sm font-medium', getDifferenceColorClass(header.type, header.budget, header.actual))}>
                                  {header.budget !== 0 || header.actual !== 0 ? formatCurrency(difference, currencySymbol) : '-'}
                                </div>
                              </div>

                              {!isHeaderCollapsed && (
                                <div className="border-t border-zinc-800/60 bg-zinc-950/20">
                                  {header.items.map((item) => (
                                    <DashboardDetailRow
                                      key={item.category_id}
                                      accountId={account.account_id}
                                      item={item}
                                      year={year}
                                      month={month}
                                      currencySymbol={currencySymbol}
                                      onOpenDrilldown={onOpenDrilldown}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        
})}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <DashboardBalancePanel
                    title="Closing Balance"
                    summary={account.balanceSummary}
                    currencySymbol={currencySymbol}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

}

export function DashboardPage() {

  const navigate = useNavigate();
  const { currencySymbol } = useSettingsStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [progress, setProgress] = useState<DashboardBudgetProgressAccount[]>([]);
  const [collapsedAccounts, setCollapsedAccounts] = useState<Set<string>>(() => {

    if (typeof window === 'undefined') {

      return new Set();
    
}

    const saved = window.localStorage.getItem(DASHBOARD_COLLAPSED_ACCOUNTS_STORAGE_KEY);

    if (!saved) {

      return new Set();
    
}

    try {

      const parsed = JSON.parse(saved);

      return Array.isArray(parsed) ? new Set(parsed.filter((value): value is string => typeof value === 'string')) : new Set();
    
} catch {

      return new Set();
    
}
  
});
  const [error, setError] = useState<string | null>(null);
  const [drilldown, setDrilldown] = useState<{ accountId: string; filter: CashflowActualTransactionsFilter } | null>(null);

  const loadData = useCallback(async () => {

    try {

      const [balanceData, progressData] = await Promise.all([
        callIpc(window.api.dashboard.balances(year, month), 'Failed to load dashboard balances'),
        callIpc(window.api.dashboard.budgetProgress(year, month), 'Failed to load dashboard budget progress'),
      ]);

      setBalances(balanceData);
      setProgress(progressData);
      setError(null);
      setCollapsedAccounts((previous) => {

        const availableIds = new Set(progressData.map((account) => account.account_id));
        const next = new Set<string>();

        for (const accountId of previous) {

          if (availableIds.has(accountId)) {

            next.add(accountId);
          
}
        
}

        return next;
      
});
    
} catch (loadError) {

      setError(toErrorMessage(loadError, 'Failed to load dashboard'));
    
}
  
}, [year, month]);

  useEffect(() => {

 loadData(); 

}, [loadData]);

  useEffect(() => {

    window.localStorage.setItem(
      DASHBOARD_COLLAPSED_ACCOUNTS_STORAGE_KEY,
      JSON.stringify([...collapsedAccounts]),
    );
  
}, [collapsedAccounts]);

  function navigateMonth(delta: number) {

    let newMonth = month + delta;
    let newYear = year;

    if (newMonth < 1) {

 newMonth = 12; newYear--; 

}
    if (newMonth > 12) {

 newMonth = 1; newYear++; 

}
    setYear(newYear);
    setMonth(newMonth);
  
}

  function toggleAccount(accountId: string) {

    setCollapsedAccounts((prev) => {

      const next = new Set(prev);

      if (next.has(accountId)) {

        next.delete(accountId);
      
} else {

        next.add(accountId);
      
}
      return next;
    
});
  
}

  function handleCloseDrilldown() {

    setDrilldown(null);
  
}

  function handleOpenDrilldown(accountId: string, filter: CashflowActualTransactionsFilter) {

    setDrilldown({ accountId, filter });
  
}

  function handleOpenAccountRegister(accountId: string) {

    navigate(`/accounts/${accountId}/${year}/${month}`);

  }

  const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header + Month Navigator */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-medium w-32 text-center">
            {MONTH_NAMES_SHORT[month - 1]} {year}
          </span>
          <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <section>
          <h2 className="text-lg font-medium text-zinc-200 mb-3">Account Balances</h2>
          <div className="space-y-3">
            <div className="bg-blue-950/40 border border-blue-800/60 rounded-lg px-4 py-4">
              <div className="text-sm text-blue-200/80 font-medium mb-1">Overall balance</div>
              <div className={cn('text-2xl font-semibold', totalBalance < 0 ? 'text-red-400' : 'text-zinc-100')}>
                {formatCurrency(totalBalance, currencySymbol)}
              </div>
            </div>

            {balances.map((balance) => (
              <DashboardAccountBalanceCard
                key={balance.id}
                account={balance}
                currencySymbol={currencySymbol}
                onOpenRegister={handleOpenAccountRegister}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium text-zinc-200 mb-3">Budget vs Actual</h2>
          {error && (
            <div className="mb-3 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          {progress.length === 0 ? (
            <div className="text-center py-8 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500">
              No budget data for this month.
            </div>
          ) : (
            <div className="space-y-3">
              {progress.map((acct) => (
                <DashboardAccountProgressCard
                  key={acct.account_id}
                  account={acct}
                  expanded={!collapsedAccounts.has(acct.account_id)}
                  onToggle={() => toggleAccount(acct.account_id)}
                  year={year}
                  month={month}
                  currencySymbol={currencySymbol}
                  onOpenDrilldown={handleOpenDrilldown}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {drilldown && (
        <DrilldownDialog
          open={!!drilldown}
          onClose={handleCloseDrilldown}
          accountId={drilldown.accountId}
          year={year}
          month={month}
          filter={drilldown.filter}
        />
      )}
    </div>
  );

}
