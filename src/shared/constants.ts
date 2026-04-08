import type { CategoryHeaderType } from './types';

export const ACCOUNT_ICONS = [
  '🏦', '💳', '💰', '🏠', '🚗', '✈️', '🎓', '💼', '🛒', '📱',
  '💎', '🌟', '🎯', '🔑', '🏢', '📊', '🎪', '🌍', '⚡', '🎨',
];

export const CATEGORY_COLOURS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#78716c',
];

export const ACCOUNT_TYPES = ['current', 'savings', 'credit'] as const;

export const CATEGORY_HEADER_TYPES = ['income_start', 'income_end', 'fixed_expense', 'variable_expense'] as const;

export const CURRENCY_SYMBOLS = [
  { code: 'GBP', symbol: '£' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'JPY', symbol: '¥' },
  { code: 'INR', symbol: '₹' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
];

export const MATCH_TYPES = ['contains', 'exact', 'starts_with', 'regex'] as const;

export const QUICK_RULE_MIN_MULTIPLIER = 0.75;
export const QUICK_RULE_MAX_MULTIPLIER = 1.25;

export const UNCATEGORISED_CATEGORY_ID = '__uncategorised__';

export const OPENING_BALANCE_EPOCH = -2208988800;

export const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function isIncomeType(type: CategoryHeaderType): boolean {
  return type === 'income_start' || type === 'income_end';
}

export function isExpenseType(type: CategoryHeaderType): boolean {
  return type === 'fixed_expense' || type === 'variable_expense';
}
