import { CATEGORY_COLOURS, ACCOUNT_ICONS } from '../../shared/constants';
import type { CategoryHeaderType } from '../../shared/types';
import { accountService } from './account-service';
import { accountRepository } from '../repositories/account-repository';
import { categoryHeaderRepository } from '../repositories/category-header-repository';
import { categoryRepository } from '../repositories/category-repository';
import { categorisationRuleRepository } from '../repositories/categorisation-rule-repository';
import { transaction } from '../db/connection';

// ── Plan types ──

export interface ConfigPlan {
  accounts: ConfigAccountPlan[];
}

export interface ConfigAccountPlan {
  name: string;
  icon: string;
  type: 'current' | 'savings' | 'credit';
  openingBalance: number;
  categoryTypes: ConfigCategoryTypePlan[];
}

export interface ConfigCategoryTypePlan {
  typeName: string;
  type: CategoryHeaderType;
  headers: ConfigHeaderPlan[];
}

export interface ConfigHeaderPlan {
  name: string;
  colour: string;
  categories: ConfigCategoryPlan[];
}

export interface ConfigCategoryPlan {
  name: string;
  rules: ConfigRulePlan[];
}

export interface ConfigRulePlan {
  matchText: string;
  matchType: 'contains' | 'exact' | 'starts_with' | 'regex';
  minAmount: number;
  maxAmount: number;
}

// ── Parsing helpers ──

interface ParsedLine {
  indent: number;
  rawText: string;
  name: string;
  overrides: Record<string, string>;
}

const CATEGORY_TYPE_MAP: Record<string, CategoryHeaderType> = {
  'Income (Start of month)': 'income_start',
  'Income (End of month)': 'income_end',
  'Fixed expenses': 'fixed_expense',
  'Variable expenses': 'variable_expense',
};

const CATEGORY_TYPE_REVERSE: Record<CategoryHeaderType, string> = {
  income_start: 'Income (Start of month)',
  income_end: 'Income (End of month)',
  fixed_expense: 'Fixed expenses',
  variable_expense: 'Variable expenses',
};

const MATCH_TYPE_SET = new Set(['contains', 'exact', 'starts_with', 'regex']);

function parseLine(raw: string): ParsedLine | null {
  if (!raw.trim()) return null;

  const match = raw.match(/^(\s*)-\s+(.+)$/);
  if (!match) return null;

  const indent = match[1].length;
  const rawText = match[2];

  // Extract overrides from {key:value} or {value} blocks
  const overrides: Record<string, string> = {};
  const bracePattern = /\{([^}]+)\}/g;
  let braceMatch;
  while ((braceMatch = bracePattern.exec(rawText)) !== null) {
    const inner = braceMatch[1].trim();
    const colonIdx = inner.indexOf(':');
    if (colonIdx >= 0) {
      const key = inner.substring(0, colonIdx).trim();
      const value = inner.substring(colonIdx + 1).trim();
      overrides[key] = value;
    } else if (MATCH_TYPE_SET.has(inner)) {
      overrides['type'] = inner;
    }
  }

  // Name = text before first brace, trimmed
  const braceIdx = rawText.indexOf('{');
  const name = (braceIdx >= 0 ? rawText.substring(0, braceIdx) : rawText).trim();

  return { indent, rawText, name, overrides };
}

interface TreeNode {
  line: ParsedLine;
  children: TreeNode[];
}

function buildTree(lines: ParsedLine[]): TreeNode[] {
  const roots: TreeNode[] = [];
  const stack: { node: TreeNode; indent: number }[] = [];

  for (const line of lines) {
    const node: TreeNode = { line, children: [] };

    // Pop the stack until we find a parent with smaller indent
    while (stack.length > 0 && stack[stack.length - 1].indent >= line.indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, indent: line.indent });
  }

  return roots;
}

let colourIndex = 0;
function nextColour(): string {
  const colour = CATEGORY_COLOURS[colourIndex % CATEGORY_COLOURS.length];
  colourIndex++;
  return colour;
}

function parseRuleNode(node: TreeNode): ConfigRulePlan {
  const matchText = node.line.name;
  const matchType = (node.line.overrides['type'] || 'starts_with') as ConfigRulePlan['matchType'];

  let minAmount = 0;
  let maxAmount = 100;

  if (node.line.overrides['range']) {
    const parts = node.line.overrides['range'].split(',').map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      minAmount = parts[0];
      maxAmount = parts[1];
    }
  }

  return { matchText, matchType, minAmount, maxAmount };
}

function parseCategoryNode(node: TreeNode): ConfigCategoryPlan {
  const rules = node.children.map((child) => parseRuleNode(child));
  return { name: node.line.name, rules };
}

function parseHeaderNode(node: TreeNode): ConfigHeaderPlan {
  const categories = node.children.map((child) => parseCategoryNode(child));
  return { name: node.line.name, colour: nextColour(), categories };
}

function parseCategoryTypeNode(node: TreeNode): ConfigCategoryTypePlan | null {
  const typeName = node.line.name;
  const type = CATEGORY_TYPE_MAP[typeName];
  if (!type) return null;

  const headers = node.children.map((child) => parseHeaderNode(child));
  return { typeName, type, headers };
}

function parseAccountNode(node: TreeNode): ConfigAccountPlan {
  const name = node.line.name;
  const icon = ACCOUNT_ICONS[0];
  const accountType = (node.line.overrides['type'] || 'current') as ConfigAccountPlan['type'];
  const openingBalance = node.line.overrides['ob'] ? parseFloat(node.line.overrides['ob']) : 0;

  const categoryTypes: ConfigCategoryTypePlan[] = [];
  for (const child of node.children) {
    const ct = parseCategoryTypeNode(child);
    if (ct) categoryTypes.push(ct);
  }

  return { name, icon, type: accountType, openingBalance, categoryTypes };
}

// ── Public API ──

export const rapidConfigService = {
  parseConfig(content: string): ConfigPlan {
    colourIndex = 0;
    const lines: ParsedLine[] = [];

    for (const raw of content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')) {
      const parsed = parseLine(raw);
      if (parsed) lines.push(parsed);
    }

    const tree = buildTree(lines);
    const accounts = tree.map(parseAccountNode);
    return { accounts };
  },

  executeConfig(plan: ConfigPlan): { accountsCreated: number; headersCreated: number; categoriesCreated: number; rulesCreated: number } {
    let accountsCreated = 0;
    let headersCreated = 0;
    let categoriesCreated = 0;
    let rulesCreated = 0;

    return transaction(() => {
      for (const accountPlan of plan.accounts) {
        const account = accountService.createAccountWithBalance({
          name: accountPlan.name,
          icon: accountPlan.icon,
          type: accountPlan.type,
          openingBalance: accountPlan.openingBalance,
        });
        accountsCreated++;

        for (const ctPlan of accountPlan.categoryTypes) {
          for (const headerPlan of ctPlan.headers) {
            const header = categoryHeaderRepository.create({
              name: headerPlan.name,
              type: ctPlan.type,
              colour: headerPlan.colour,
              account_id: account.id,
            });
            headersCreated++;

            for (const catPlan of headerPlan.categories) {
              const category = categoryRepository.create({
                name: catPlan.name,
                category_header_id: header.id,
              });
              categoriesCreated++;

              for (const rulePlan of catPlan.rules) {
                categorisationRuleRepository.create(account.id, {
                  category_id: category.id,
                  match_text: rulePlan.matchText,
                  match_type: rulePlan.matchType,
                  min_amount: rulePlan.minAmount,
                  max_amount: rulePlan.maxAmount,
                });
                rulesCreated++;
              }
            }
          }
        }
      }

      return { accountsCreated, headersCreated, categoriesCreated, rulesCreated };
    });
  },

  exportConfig(): string {
    const accounts = accountRepository.findAll();
    const lines: string[] = [];

    for (const account of accounts) {
      const ob = accountRepository.getOpeningBalanceAmount(account.id);
      let accountLine = `- ${account.name}`;
      const accountOverrides: string[] = [];
      if (ob !== 0) accountOverrides.push(`{ob:${ob}}`);
      if (account.type !== 'current') accountOverrides.push(`{type:${account.type}}`);
      if (accountOverrides.length > 0) accountLine += ' ' + accountOverrides.join('');
      lines.push(accountLine);

      const hierarchies = categoryHeaderRepository.findHierarchical(account.id);
      const rules = categorisationRuleRepository.findByAccount(account.id);

      // Group headers by type, preserving the standard order
      const typeOrder: CategoryHeaderType[] = ['income_start', 'fixed_expense', 'variable_expense', 'income_end'];
      const headersByType = new Map<CategoryHeaderType, typeof hierarchies>();

      for (const h of hierarchies) {
        const existing = headersByType.get(h.header.type) ?? [];
        existing.push(h);
        headersByType.set(h.header.type, existing);
      }

      for (const type of typeOrder) {
        const typeHeaders = headersByType.get(type);
        if (!typeHeaders && !headersByType.has(type)) continue;

        lines.push(`  - ${CATEGORY_TYPE_REVERSE[type]}`);

        if (typeHeaders) {
          for (const { header, categories } of typeHeaders) {
            lines.push(`    - ${header.name}`);

            for (const category of categories) {
              lines.push(`      - ${category.name}`);

              const categoryRules = rules.filter((r) => r.category_id === category.id);

              for (const rule of categoryRules) {
                let ruleLine = `        - ${rule.match_text}`;
                const ruleOverrides: string[] = [];

                if (rule.match_type !== 'starts_with') {
                  ruleOverrides.push(`{${rule.match_type}}`);
                }

                const hasCustomRange = rule.min_amount !== 0 || rule.max_amount !== 100;

                if (hasCustomRange && rule.min_amount !== null && rule.max_amount !== null) {
                  ruleOverrides.push(`{range:${rule.min_amount},${rule.max_amount}}`);
                }

                if (ruleOverrides.length > 0) ruleLine += ' ' + ruleOverrides.join('');
                lines.push(ruleLine);
              }
            }
          }
        }
      }
    }

    return lines.join('\n') + '\n';
  },
};
