import { getDb } from '../db/connection';
import { categorisationRuleRepository } from '../repositories/categorisation-rule-repository';
import { buildCategoryLookup } from '../utils/category-lookup';
import type { DbCategorisationRule, TransactionWithCategory, AutoCategoriseProposal, AutoCategorisePreview } from '../../shared/types';

export function matchesRule(rule: DbCategorisationRule, description: string, absAmount: number): boolean {
  // Text matching
  let textMatch = false;
  switch (rule.match_type) {
    case 'contains':
      textMatch = description.toLowerCase().includes(rule.match_text.toLowerCase());
      break;
    case 'exact':
      textMatch = description.toLowerCase() === rule.match_text.toLowerCase();
      break;
    case 'starts_with':
      textMatch = description.toLowerCase().startsWith(rule.match_text.toLowerCase());
      break;
    case 'regex':
      try {
        textMatch = new RegExp(rule.match_text).test(description);
      } catch {
        textMatch = false;
      }
      break;
  }
  if (!textMatch) return false;

  // Amount matching
  if (rule.min_amount !== null && absAmount < rule.min_amount) return false;
  if (rule.max_amount !== null && absAmount > rule.max_amount) return false;

  return true;
}

export const autoCategorisationService = {
  preview(accountId: string, year: number, month: number, mode: 'uncategorised' | 'all'): AutoCategorisePreview {
    const db = getDb();
    const rules = categorisationRuleRepository.findByAccount(accountId);

    // Get transactions for the month
    const startDate = Date.UTC(year, month - 1, 1) / 1000;
    const endDate = Date.UTC(year, month, 1) / 1000;

    let query: string;
    if (mode === 'uncategorised') {
      query = `
        SELECT t.*, c.name as category_name, ch.type as category_type, ch.colour as category_colour
        FROM transactions t
        LEFT JOIN categories c ON c.id = t.category_id
        LEFT JOIN category_headers ch ON ch.id = c.category_header_id
        WHERE t.account_id = ? AND t.date >= ? AND t.date < ? AND t.is_opening_balance = 0
          AND t.category_id IS NULL
        ORDER BY t.date DESC
      `;
    } else {
      query = `
        SELECT t.*, c.name as category_name, ch.type as category_type, ch.colour as category_colour
        FROM transactions t
        LEFT JOIN categories c ON c.id = t.category_id
        LEFT JOIN category_headers ch ON ch.id = c.category_header_id
        WHERE t.account_id = ? AND t.date >= ? AND t.date < ? AND t.is_opening_balance = 0
        ORDER BY t.date DESC
      `;
    }

    const transactions = db.prepare(query).all(accountId, startDate, endDate) as TransactionWithCategory[];

    const categoryLookup = buildCategoryLookup(accountId);

    const matched: AutoCategoriseProposal[] = [];
    const unmatched: TransactionWithCategory[] = [];

    for (const tx of transactions) {
      const absAmount = Math.abs(tx.delta_value);
      let matchedRule: DbCategorisationRule | null = null;

      for (const rule of rules) {
        if (rule.category_id && matchesRule(rule, tx.description, absAmount)) {
          matchedRule = rule;
          break;
        }
      }

      if (matchedRule && matchedRule.category_id) {
        const catInfo = categoryLookup.get(matchedRule.category_id);
        matched.push({
          transaction_id: tx.id,
          rule_id: matchedRule.id,
          category_id: matchedRule.category_id,
          rule_match_text: matchedRule.match_text,
          category_name: catInfo?.name ?? 'Unknown',
          category_colour: catInfo?.colour ?? null,
          transaction_description: tx.description,
          transaction_date: tx.date,
          transaction_amount: tx.delta_value,
        });
      } else {
        unmatched.push(tx);
      }
    }

    return { matched, unmatched };
  },

  apply(accountId: string, proposals: AutoCategoriseProposal[], overwrite: boolean): number {
    const db = getDb();
    const now = Date.now();
    let count = 0;

    const updateStmt = overwrite
      ? db.prepare('UPDATE transactions SET category_id = ?, categorised_by_rule_id = ?, updated_at = ? WHERE id = ? AND account_id = ?')
      : db.prepare('UPDATE transactions SET category_id = ?, categorised_by_rule_id = ?, updated_at = ? WHERE id = ? AND account_id = ? AND category_id IS NULL');

    for (const proposal of proposals) {
      const result = updateStmt.run(proposal.category_id, proposal.rule_id, now, proposal.transaction_id, accountId);
      count += result.changes;
    }

    return count;
  },
};
