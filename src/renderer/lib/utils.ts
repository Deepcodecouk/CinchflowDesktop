import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const CURRENCY_EPSILON = 0.0001;

export function cn(...inputs: ClassValue[]): string {

  return twMerge(clsx(inputs));

}

export function normalizeCurrencyAmount(amount: number): number {

  return Math.abs(amount) < CURRENCY_EPSILON ? 0 : amount;

}

export function isEffectivelyZero(amount: number): boolean {

  return normalizeCurrencyAmount(amount) === 0;

}

export function formatCurrency(amount: number, symbol = '\u00A3'): string {

  const normalizedAmount = normalizeCurrencyAmount(amount);
  const formatted = Math.abs(normalizedAmount)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return normalizedAmount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;

}

export function formatDateInput(date: Date): string {

  return date.toISOString().split('T')[0];

}
