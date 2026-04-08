import type { CategoryHeaderType } from '../shared/types';
import { ACCOUNT_TYPES, CATEGORY_HEADER_TYPES, MATCH_TYPES } from '../shared/constants';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// ── Type Guards ──

export function isValidAccountType(type: unknown): type is 'current' | 'savings' | 'credit' {
  return typeof type === 'string' && (ACCOUNT_TYPES as readonly string[]).includes(type);
}

export function isValidCategoryHeaderType(type: unknown): type is CategoryHeaderType {
  return typeof type === 'string' && (CATEGORY_HEADER_TYPES as readonly string[]).includes(type);
}

export function isValidHexColour(colour: unknown): boolean {
  return typeof colour === 'string' && /^#[0-9a-fA-F]{6}$/.test(colour);
}

export function isValidMatchType(type: unknown): type is 'contains' | 'exact' | 'starts_with' | 'regex' {
  return typeof type === 'string' && (MATCH_TYPES as readonly string[]).includes(type);
}

// ── Entity Validators ──

export function validateAccountData(data: Record<string, unknown>): ValidationResult {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return { isValid: false, error: 'Account name is required' };
  }
  if (!isValidAccountType(data.type)) {
    return { isValid: false, error: 'Account type must be one of: current, savings, credit' };
  }
  return { isValid: true };
}

export function validateCategoryHeaderData(data: Record<string, unknown>): ValidationResult {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return { isValid: false, error: 'Category header name is required' };
  }
  if (!isValidCategoryHeaderType(data.type)) {
    return { isValid: false, error: 'Category header type is invalid' };
  }
  if (!isValidHexColour(data.colour)) {
    return { isValid: false, error: 'Category header colour must be a valid hex colour (e.g., #ff0000)' };
  }
  return { isValid: true };
}

export function validateCategoryData(data: Record<string, unknown>): ValidationResult {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return { isValid: false, error: 'Category name is required' };
  }
  if (!data.category_header_id || typeof data.category_header_id !== 'string') {
    return { isValid: false, error: 'Category header ID is required' };
  }
  return { isValid: true };
}

export function validateTransactionData(data: Record<string, unknown>): ValidationResult {
  if (data.date === undefined || data.date === null || typeof data.date !== 'number') {
    return { isValid: false, error: 'Transaction date is required and must be a number' };
  }
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    return { isValid: false, error: 'Transaction description is required' };
  }
  if (data.delta_value === undefined || data.delta_value === null || typeof data.delta_value !== 'number' || data.delta_value === 0) {
    return { isValid: false, error: 'Transaction amount is required and must be a non-zero number' };
  }
  return { isValid: true };
}

export function validateCategorisationRuleData(data: Record<string, unknown>): ValidationResult {
  if (!data.match_text || typeof data.match_text !== 'string' || data.match_text.trim().length === 0) {
    return { isValid: false, error: 'Match text is required' };
  }
  if (!isValidMatchType(data.match_type)) {
    return { isValid: false, error: 'Match type must be one of: contains, exact, starts_with, regex' };
  }
  if (data.match_type === 'regex') {
    try {
      new RegExp(data.match_text as string);
    } catch {
      return { isValid: false, error: 'Invalid regular expression pattern' };
    }
  }
  if (
    data.min_amount !== null && data.min_amount !== undefined &&
    data.max_amount !== null && data.max_amount !== undefined &&
    typeof data.min_amount === 'number' && typeof data.max_amount === 'number' &&
    data.min_amount > data.max_amount
  ) {
    return { isValid: false, error: 'Minimum amount must be less than or equal to maximum amount' };
  }
  return { isValid: true };
}
